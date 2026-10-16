#!/bin/sh
# ============================================================
# 成图导出脚本 —— 把模板里的单个画布导出为指定像素的 PNG
#
# 用法:
#   sh export-image.sh --check-env [--fonts "栈1|栈2"]
#     字体预检：--fonts 传任务字体栈；**多个候选栈用 | 分隔，每个栈内部字体族用逗号**
#     （如 "Helvetica Neue,Arial,sans-serif|Georgia,serif"）；只传一个栈时仅报宽度、不触发"全部相同"告警。
#   sh export-image.sh <HTML> <语言键> <宽> <高> <输出.png>
#
# 例:
#   sh export-image.sh project.html cn 800 800 "商品-主图-中-v1.png"
#
# 原理:
#   导出模式 —— 网址加 ?only=<语言键> 时只保留一个画布、去掉工作区装饰；
#   先把视口设为成图尺寸，等页面自己的 visualReady（字体与图片解码完成），
#   再**截取画布元素 #canvas**：元素截图与画布尺寸逐像素一致，不靠视口对齐。
#   导出前做区域诊断（超画布＝失败，scroll/祖先裁切＝警告），导出后按 PNG
#   文件头核对实际宽高与体积，并随图落一份 .audit.json 供人工核验。
#
# 依赖:
#   agent-browser —— 首次使用先安装一次: npm install -g agent-browser && agent-browser install
#   Node.js       —— 仅用于 PNG 校验与诊断汇总，不需要安装任何 npm 包
#
# 环境变量:
#   AGENT_BROWSER_BIN  指定 agent-browser 可执行文件（默认自动探测，再退回 PATH）
#   NODE_BIN           指定 node 可执行文件（默认 node）
#
# 替代路径:
#   agent-browser 不可用时，见 scripts/export-image.playwright.cjs（需自备
#   Playwright 与 Chromium），或使用其他本地渲染器按**画布边界**导出，
#   导出后核对实际宽高。不可用又不替代时，保留草稿并报告阻塞。
# ============================================================
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
NODE_BIN=${NODE_BIN:-node}
PROBE_W=160
PROBE_H=120
MAX_SIDE=16000

die() { echo "$1" >&2; exit 1; }

usage() {
  echo "用法:" >&2
  echo "  sh export-image.sh --check-env [--fonts \"栈1|栈2\"]" >&2
  echo "  sh export-image.sh <HTML> <语言键> <宽> <高> <输出.png>" >&2
  echo "  语言键对应模板 versions 里的键（如 cn、en）；宽高须与设计参数一致。" >&2
  echo "  --fonts 传入任务字体栈（多个候选栈用 | 分隔，每个栈内部字体族用逗号；如" >&2
  echo "    \"Helvetica Neue,Arial,sans-serif|Georgia,serif\"），字体预检即测量这些栈而非默认三中文族。" >&2
  echo "    只传一个栈时仅报该栈宽度，不触发「全部相同」告警（比较需 >=2 个候选栈）。" >&2
  exit 1
}

command -v "$NODE_BIN" >/dev/null 2>&1 ||
  die '缺少 Node.js。请使用可用环境或设置 NODE_BIN；未完成导出。'

# agent-browser 定位：环境变量 → WorkBuddy 管理目录 → PATH
AB=${AGENT_BROWSER_BIN:-}
if [ -z "$AB" ]; then
  NB_BIN=$(ls -d "$HOME"/.workbuddy/binaries/node/versions/*/bin 2>/dev/null | sort -V | tail -1 || true)
  if [ -n "$NB_BIN" ]; then export PATH="$NB_BIN:$PATH"; fi
  AB=agent-browser
fi
command -v "$AB" >/dev/null 2>&1 ||
  die '缺少 agent-browser。先执行: npm install -g agent-browser && agent-browser install；或改用替代渲染路径。未完成导出。'

abspath() {
  case "$1" in
    /*) printf '%s\n' "$1" ;;
    *) printf '%s/%s\n' "$(pwd)" "${1#./}" ;;
  esac
}

# 把本地绝对路径转成 file:// URL。
# Windows（Git-Bash/MinGW）下路径形如 /c/Users/x，Windows Chrome 只认
# file:///C:/...，拒认 file:///c/...——故仅在该环境下把盘符归一成大写并补冒号；
# macOS/Linux 路径（如 /Users/... 或 /home/...）不受影响。
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

# ---------- 环境预检：真跑一次渲染并保存 PNG，不靠"工具已安装"下结论 ----------
check_env() {
  tmp=$(mktemp -d "${TMPDIR:-/tmp}/visual-preflight.XXXXXX")
  trap 'rm -rf "$tmp"' EXIT
  cat > "$tmp/probe.html" <<'HTML'
<!doctype html>
<meta charset="utf-8">
<title>渲染预检</title>
<div style="font-family:sans-serif">渲染检查 Render check</div>
<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3C/svg%3E" alt="探针">
HTML
  "$AB" open "$(win_file_url "$tmp/probe.html")" >/dev/null
  "$AB" set viewport "$PROBE_W" "$PROBE_H" >/dev/null
  "$AB" screenshot "$tmp/probe.png" >/dev/null
  ver=$("$AB" --version 2>/dev/null || true)
  "$NODE_BIN" "$SCRIPT_DIR/png-check.cjs" probe "$tmp/probe.png" "$PROBE_W" "$PROBE_H" "$ver"
  # 字体实测（量宽法，不依赖 document.fonts.check）：把候选字体栈里每个候选单独量一遍渲染宽度。
  # 默认候选＝中文字体三族兜底；若 --fonts 传入了任务指定的字体栈（| 分隔多个候选），
  # 则改为测量指定栈，不再局限于硬编码三中文族（O5）。若多个候选宽度完全相同，说明目标字体
  # 很可能未生效（被同一替代字体渲染），须按 SKILL 规则用 CDP/CSS.getPlatformFontsForNode 或列字体目录确认。
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
<title>字体预检</title>
$spans
HTML
  "$AB" open "$(win_file_url "$tmp/fontprobe.html")" >/dev/null
  fr=$("$AB" eval "(function(){var o={};document.querySelectorAll('.fp').forEach(function(e){o[e.getAttribute('data-i')]=e.offsetWidth;});return JSON.stringify(o);})()" 2>&1)
  printf '%s' "$fr" | "$NODE_BIN" -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{let o=JSON.parse(s); if(typeof o==="string") o=JSON.parse(o); console.log("字体量宽: "+JSON.stringify(o));const v=Object.keys(o).map(k=>o[k]);if(v.length>1&&v.every(x=>x>0&&x===v[0]))console.log("警告：候选字体渲染宽度全部相同，目标字体可能未生效，请按 SKILL 规则用 CDP/CSS.getPlatformFontsForNode 或列字体目录确认");}catch(e){console.log("字体量宽：解析失败，跳过（不阻断预检）");}});'
}

# ---------- 正式导出 ----------
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
    # --fonts 已是「栈｜栈」分隔（栈内用逗号分隔字体族），原样传给 check_env，不要转逗号
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
      die '语言键须以字母开头，只能含字母、数字、下划线、连字符' ;;
  esac
  [ "${#LANGKEY}" -le 32 ] ||
    die '语言键最长 32 个字符（与替代入口 export-image.playwright.cjs 的规则一致）'
  is_pos_int "$W" || die '宽须为正整数'
  is_pos_int "$H" || die '高须为正整数'
  if [ "$W" -gt "$MAX_SIDE" ] || [ "$H" -gt "$MAX_SIDE" ]; then
    die "宽高上限为 ${MAX_SIDE}px"
  fi
  case "$OUT" in
    *.png|*.PNG) ;;
    *) die '输出须为 .png' ;;
  esac

  SRC=$(abspath "$HTML")
  TGT=$(abspath "$OUT")
  if [ ! -f "$SRC" ]; then die "HTML 文件不存在：$HTML"; fi
  if [ "$SRC" = "$TGT" ]; then die '输出不能覆盖输入的 HTML'; fi
  if [ -e "$TGT" ]; then die "输出已存在，请换版本名：$OUT"; fi
  AUDIT="$TGT.audit.json"
  if [ -e "$AUDIT" ]; then die "诊断文件已存在，请换版本名：$AUDIT"; fi
  mkdir -p "$(dirname "$TGT")"

  tmp=$(mktemp -d "${TMPDIR:-/tmp}/visual-export.XXXXXX")
  trap 'rm -rf "$tmp"' EXIT

  url=$(win_file_url "$SRC")
  "$AB" open "$url?only=$LANGKEY" >/dev/null
  "$AB" set viewport "$W" "$H" >/dev/null

  # 1) 等页面自己宣告就绪：字体与图片解码完成，占位内容已被模板拒绝
  prep=$(cat <<'JS' | "$AB" eval --stdin 2>&1
(async () => {
  try {
    if (!window.visualReady) throw new Error('页面未提供 visualReady；需适配加载检查，或改用替代渲染器按画布边界核对');
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
    *) die "页面未就绪，未导出：$prep" ;;
  esac
  has_canvas=$(printf '%s' "$prep" | sed -n 's/.*canvas=\([01]\).*/\1/p')

  # 2) 区域诊断：超画布＝失败；scroll 与祖先裁切＝警告，留待人工看实际画面
  audit_tmp="$tmp/audit.json"
  if [ "$has_canvas" = "1" ]; then
    { sed '/^module.exports/d' "$SCRIPT_DIR/layout-audit.cjs"
      printf '\n;auditLayout(document.querySelector("#canvas"))\n'
    } | "$AB" eval --stdin > "$audit_tmp" 2>/dev/null ||
      die '区域诊断执行失败；未导出'
    "$NODE_BIN" "$SCRIPT_DIR/png-check.cjs" gate "$audit_tmp"
  else
    printf '{"width":%s,"height":%s,"failures":[],"warnings":[{"id":"canvas","reason":"页面无 #canvas 元素，已按整视口截图，未做区域诊断"}],"hints":[]}\n' \
      "$W" "$H" > "$audit_tmp"
  fi

  # 3) 截图：优先截画布元素；无 #canvas 时退回整视口（视口已等于成图尺寸）
  tmp_png="$tmp/out.png"
  if [ "$has_canvas" = "1" ]; then
    "$AB" screenshot "#canvas" "$tmp_png" >/dev/null
  else
    "$AB" screenshot "$tmp_png" >/dev/null
  fi
  if [ ! -f "$tmp_png" ]; then die '截图未生成，导出失败'; fi

  # 4) 采集页面实际配置（字体栈、体积上限），失败不影响导出
  cfg_tmp="$tmp/config.json"
  "$AB" eval "(d=>({font:((getComputedStyle(document.documentElement).getPropertyValue('--font')||'').trim())||d.font||null,maxBytes:d.maxBytes==null?null:d.maxBytes}))(window.design||{})" \
    > "$cfg_tmp" 2>/dev/null || printf '{}' > "$cfg_tmp"

  # 5) 校验并发布：核对 PNG 实际宽高与体积，写诊断文件，最后才落到输出路径
  "$NODE_BIN" "$SCRIPT_DIR/png-check.cjs" finalize \
    "$tmp_png" "$W" "$H" "$LANGKEY" "$audit_tmp" "$cfg_tmp" "$AUDIT" "$TGT"
}

main "$@"
