#!/bin/sh
# ============================================================
# Image export script — exports one canvas from the template to a PNG of the given pixel size
#
# Usage:
#   sh export-image.sh --check-env [--fonts "stack1|stack2"]
#     Font pre-check: --fonts passes the task font stack; **separate multiple candidate stacks with |, and families inside a stack with commas**
#     (e.g. "Helvetica Neue,Arial,sans-serif|Georgia,serif"); passing one stack only reports its width and does not trigger the "all equal" warning.
#   sh export-image.sh <HTML> <language key> <width> <height> <output.png>
#
# Example:
#   sh export-image.sh project.html cn 800 800 "product-hero-en-v1.png"
#
# How it works:
#   Export mode — when the URL carries ?only=<language key>, only one canvas is kept and
#   the workspace chrome is removed; the viewport is first set to the image size, then the
#   page's own visualReady is awaited (fonts and images decoded), and finally the canvas
#   element #canvas is captured: an element screenshot matches the canvas size pixel for
#   pixel, without relying on viewport alignment. Area diagnostics run before export
#   (exceeding the canvas = failure, scroll/ancestor clipping = warning); after export the
#   actual width, height and byte size are checked against the PNG header, and an
#   .audit.json is written next to the image for human verification.
#
# Dependencies:
#   agent-browser — install once before first use: npm install -g agent-browser && agent-browser install
#   Node.js       — used only for PNG verification and diagnostic summarising; no npm package needed
#
# Environment variables:
#   AGENT_BROWSER_BIN  path to the agent-browser executable (auto-detected, then falls back to PATH)
#   NODE_BIN           path to the node executable (default: node)
#
# Alternative path:
#   When agent-browser is unavailable, see scripts/export-image.playwright.cjs (you must
#   supply Playwright and Chromium), or use another local renderer and export against the
#   **canvas boundaries**, checking the actual width and height afterwards. If neither is
#   available, keep the draft and report the blocker.
# ============================================================
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
NODE_BIN=${NODE_BIN:-node}
PROBE_W=160
PROBE_H=120
MAX_SIDE=16000

die() { echo "$1" >&2; exit 1; }

usage() {
  echo "Usage:" >&2
  echo "  sh export-image.sh --check-env [--fonts \"stack1|stack2\"]" >&2
  echo "  sh export-image.sh <HTML> <language key> <width> <height> <output.png>" >&2
  echo "  The language key corresponds to a key in the template's versions (e.g. cn, en); width/height must match the design parameters." >&2
  echo "  --fonts passes the task font stack (separate multiple candidate stacks with |, families inside a stack with commas; e.g." >&2
  echo "    \"Helvetica Neue,Arial,sans-serif|Georgia,serif\"); the font pre-check measures these stacks instead of the default three CJK families." >&2
  echo "    With a single stack it only reports that stack's width and does not trigger the \"all equal\" warning (comparison needs >=2 candidate stacks)." >&2
  exit 1
}

command -v "$NODE_BIN" >/dev/null 2>&1 ||
  die 'Node.js is missing. Use an environment where it is available or set NODE_BIN; export was not completed.'

# Locating agent-browser: environment variable → WorkBuddy managed directory → PATH
AB=${AGENT_BROWSER_BIN:-}
if [ -z "$AB" ]; then
  NB_BIN=$(ls -d "$HOME"/.workbuddy/binaries/node/versions/*/bin 2>/dev/null | sort -V | tail -1 || true)
  if [ -n "$NB_BIN" ]; then export PATH="$NB_BIN:$PATH"; fi
  AB=agent-browser
fi
command -v "$AB" >/dev/null 2>&1 ||
  die 'agent-browser is missing. Run: npm install -g agent-browser && agent-browser install; or switch to the alternative renderer path. Export was not completed.'

abspath() {
  case "$1" in
    /*) printf '%s\n' "$1" ;;
    *) printf '%s/%s\n' "$(pwd)" "${1#./}" ;;
  esac
}

# Convert a local absolute path to a file:// URL.
# Under Windows (Git-Bash/MinGW) paths look like /c/Users/x, but Windows
# Chrome only accepts file:///C:/... and rejects file:///c/... — so in that
# environment only, uppercase the drive letter and add the colon; macOS/Linux
# paths (e.g. /Users/... or /home/...) are left untouched.
win_file_url() {
  p=$1
  case "$(uname -s 2>/dev/null)" in
    MINGW*|MSYS*|CYGWIN*) ;;
    *) printf 'file://%s' "$p" | sed 's/ /%20/g'; return 0 ;;
  esac
  case "$p" in
    /[a-zA-Z]/*)
      d=$(printf '%s' "$p" | cut -c2 | tr '[:lower:]' '[:upper:]')
      r=$(printf '%s' "$p" | sed 's|^/[a-zA-Z]/||')
      p="$d:/$r" ;;
  esac
  printf 'file://%s' "$p" | sed 's/ /%20/g'
}

is_pos_int() {
  case "$1" in ''|*[!0-9]*) return 1 ;; esac
  [ "$1" -gt 0 ]
}

# ---------- Environment pre-check: really run a render and save a PNG, rather than concluding from "the tool is installed" ----------
check_env() {
  tmp=$(mktemp -d "${TMPDIR:-/tmp}/visual-preflight.XXXXXX")
  trap 'rm -rf "$tmp"' EXIT
  cat > "$tmp/probe.html" <<'HTML'
<!doctype html>
<meta charset="utf-8">
<title>Render pre-check</title>
<div style="font-family:sans-serif">Render check</div>
<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3C/svg%3E" alt="probe">
HTML
  "$AB" open "$(win_file_url "$tmp/probe.html")" >/dev/null
  "$AB" set viewport "$PROBE_W" "$PROBE_H" >/dev/null
  "$AB" screenshot "$tmp/probe.png" >/dev/null
  ver=$("$AB" --version 2>/dev/null || true)
  "$NODE_BIN" "$SCRIPT_DIR/png-check.cjs" probe "$tmp/probe.png" "$PROBE_W" "$PROBE_H" "$ver"
  # Font measurement (width method, not document.fonts.check): measure the rendered width of each candidate in the font stack separately.
  # Default candidates = the three CJK fallback families; if --fonts passes a task-specified font stack (| separates candidates),
  # measure that stack instead, no longer limited to the three hardcoded CJK families (O5). If all candidates render to the same
  # width, the target font is likely inactive (all fell back to one substitute); confirm per the SKILL rule with
  # CDP/CSS.getPlatformFontsForNode or by listing the font directory — a font file existing does not mean the renderer used it.
  FONTS_ARG="${1:-}"
  if [ -z "$FONTS_ARG" ]; then
    FONTS_ARG="'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif|'Hiragino Sans GB',sans-serif|'Microsoft YaHei',sans-serif"
  fi
  idx=0; spans=""; rest="$FONTS_ARG"
  while [ -n "$rest" ]; do
    case "$rest" in
      *'|'*) f="${rest%%'|'*}"; rest="${rest#*'|'}" ;;
      *) f="$rest"; rest="" ;;
    esac
    spans="$spans<span class=\"fp\" data-i=\"$idx\" style=\"font-family:$f;font-size:64px;position:absolute;left:0;top:$((idx*90))px\">商品营销主视觉宽度测试</span>"
    idx=$((idx+1))
  done
  cat > "$tmp/fontprobe.html" <<HTML
<!doctype html>
<meta charset="utf-8">
<title>Font pre-check</title>
$spans
HTML
  "$AB" open "$(win_file_url "$tmp/fontprobe.html")" >/dev/null
  fr=$("$AB" eval "(function(){var o={};document.querySelectorAll('.fp').forEach(function(e){o[e.getAttribute('data-i')]=e.offsetWidth;});return JSON.stringify(o);})()" 2>&1)
  printf '%s' "$fr" | "$NODE_BIN" -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{let o=JSON.parse(s); if(typeof o==="string") o=JSON.parse(o); console.log("Font width: "+JSON.stringify(o));const v=Object.keys(o).map(k=>o[k]);if(v.length>1&&v.every(x=>x>0&&x===v[0]))console.log("WARNING: all candidate widths are equal; the target font may be inactive, confirm per the SKILL rule with CDP/CSS.getPlatformFontsForNode or the font directory");}catch(e){console.log("Font width: parse failed, skipped (does not block pre-check)");}});'
}

# ---------- The actual export ----------
main() {
  if [ "$1" = "--check-env" ]; then
    shift
    fonts=""
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --fonts) fonts="${2:-}"; shift 2 ;;
        --fonts=*) fonts="${1#--fonts=}"; shift ;;
        *) shift ;;
      esac
    done
    # --fonts is already "stack|stack" separated (commas inside a stack separate families); pass as-is, do not convert commas.
    check_env "$fonts"
    return 0
  fi
  [ "$#" -eq 5 ] || usage

  HTML=$1
  LANGKEY=$2
  W=$3
  H=$4
  OUT=$5

  case "$LANGKEY" in
    ''|*[!a-zA-Z0-9_-]*|[!a-zA-Z]*)
      die 'The language key must start with a letter and contain only letters, digits, underscores and hyphens' ;;
  esac
  [ "${#LANGKEY}" -le 32 ] ||
    die 'The language key may be at most 32 characters (the same rule as the alternative entry point export-image.playwright.cjs)'
  is_pos_int "$W" || die 'Width must be a positive integer'
  is_pos_int "$H" || die 'Height must be a positive integer'
  if [ "$W" -gt "$MAX_SIDE" ] || [ "$H" -gt "$MAX_SIDE" ]; then
    die "The maximum width/height is ${MAX_SIDE}px"
  fi
  case "$OUT" in
    *.png|*.PNG) ;;
    *) die 'Output must be a .png' ;;
  esac

  SRC=$(abspath "$HTML")
  TGT=$(abspath "$OUT")
  if [ ! -f "$SRC" ]; then die "HTML file does not exist: $HTML"; fi
  if [ "$SRC" = "$TGT" ]; then die 'Output must not overwrite the input HTML'; fi
  if [ -e "$TGT" ]; then die "Output already exists, please use a new version name: $OUT"; fi
  AUDIT="$TGT.audit.json"
  if [ -e "$AUDIT" ]; then die "The diagnostic file already exists, please use a new version name: $AUDIT"; fi
  mkdir -p "$(dirname "$TGT")"

  tmp=$(mktemp -d "${TMPDIR:-/tmp}/visual-export.XXXXXX")
  trap 'rm -rf "$tmp"' EXIT

  url=$(win_file_url "$SRC")
  "$AB" open "$url?only=$LANGKEY" >/dev/null
  "$AB" set viewport "$W" "$H" >/dev/null

  # 1) Wait for the page to declare itself ready: fonts and images decoded, placeholder content rejected by the template
  prep=$(cat <<'JS' | "$AB" eval --stdin 2>&1
(async () => {
  try {
    if (!window.visualReady) throw new Error('The page provides no visualReady; it needs a load check adapted to it, or use an alternative renderer against the canvas boundaries');
    await window.visualReady;
    await document.fonts.ready;
    await Promise.all([...document.images].filter(i => i.getAttribute('src')).map(i => i.decode().catch(() => {})));
    return 'READY canvas=' + (document.querySelector('#canvas') ? 1 : 0)
         + ' state=' + (document.documentElement.dataset.visualState || 'unknown');
  } catch (e) { return 'FAILED ' + (e && e.message ? e.message : e); }
})()
JS
)
  case "$prep" in
    *READY*) ;;
    *) die "Page was not ready, nothing exported: $prep" ;;
  esac
  has_canvas=$(printf '%s' "$prep" | sed -n 's/.*canvas=\([01]\).*/\1/p')

  # 2) Area diagnostics: exceeding the canvas = failure; scroll and ancestor clipping = warning, left for a human to check the real image
  audit_tmp="$tmp/audit.json"
  if [ "$has_canvas" = "1" ]; then
    { sed '/^module.exports/d' "$SCRIPT_DIR/layout-audit.cjs"
      printf '\n;auditLayout(document.querySelector("#canvas"))\n'
    } | "$AB" eval --stdin > "$audit_tmp" 2>/dev/null ||
      die 'Area diagnostics failed to run; nothing exported'
    "$NODE_BIN" "$SCRIPT_DIR/png-check.cjs" gate "$audit_tmp"
  else
    printf '{"width":%s,"height":%s,"failures":[],"warnings":[{"id":"canvas","reason":"The page has no #canvas element, so the whole viewport was captured and no area diagnostics were run"}],"hints":[]}\n' \
      "$W" "$H" > "$audit_tmp"
  fi

  # 3) Screenshot: capture the canvas element preferentially; without #canvas fall back to the whole viewport (the viewport already equals the image size)
  tmp_png="$tmp/out.png"
  if [ "$has_canvas" = "1" ]; then
    "$AB" screenshot "#canvas" "$tmp_png" >/dev/null
  else
    "$AB" screenshot "$tmp_png" >/dev/null
  fi
  if [ ! -f "$tmp_png" ]; then die 'No screenshot was produced; export failed'; fi

  # 4) Collect the page's actual configuration (font stack, byte-size cap); a failure here does not affect the export
  cfg_tmp="$tmp/config.json"
  "$AB" eval "(d=>({font:((getComputedStyle(document.documentElement).getPropertyValue('--font')||'').trim())||d.font||null,maxBytes:d.maxBytes==null?null:d.maxBytes}))(window.design||{})" \
    > "$cfg_tmp" 2>/dev/null || printf '{}' > "$cfg_tmp"

  # 5) Verify and publish: check the PNG's actual width, height and byte size, write the diagnostic file, and only then move it to the output path
  "$NODE_BIN" "$SCRIPT_DIR/png-check.cjs" finalize \
    "$tmp_png" "$W" "$H" "$LANGKEY" "$audit_tmp" "$cfg_tmp" "$AUDIT" "$TGT"
}

main "$@"
