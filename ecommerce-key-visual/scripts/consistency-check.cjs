'use strict';
// 双语一致性自检：对比中英文 SKILL.md 的结构与关键字段，拦截历史踩过的"双语漂移"缺陷。
// 只使用 Node 内置模块，不安装任何 npm 包。机械校验不替代人工，但把"反引号奇偶 / 版本一致 / name 不撞车 / 残留 Source 行 / 标题数对称"自动化。
// 用法: node consistency-check.cjs <中文SKILL> <英文SKILL>
const fs = require('node:fs');
const path = require('node:path');

function die(m) { console.error(m); process.exit(1); }

function readLines(file) {
  let t;
  try { t = fs.readFileSync(file, 'utf8'); }
  catch (e) { die(`读不到文件：${file}（${e.message}）`); }
  return t.split(/\r?\n/);
}

// 解析 YAML frontmatter 的 name / version 字段。
// 支持一级缩进（本包 version 嵌在 metadata: 下：metadata:\n  version: "x"），故用 ^\s* 允许前导空格。
// 只取前两个 --- 之间的简单键值；值里若再出现 key: 形式也不会误匹配（本包 frontmatter 均为单行值）。
function frontmatter(lines) {
  const fm = {};
  if (lines[0] !== '---') return fm;
  for (let i = 1; i < lines.length && lines[i] !== '---'; i++) {
    const m = lines[i].match(/^\s*([A-Za-z_]+):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return fm;
}

function analyze(file) {
  const lines = readLines(file);
  const text = lines.join('\n');
  // 反引号奇偶（代码块 / 行内代码都用 ` 包裹）
  const backticks = (text.match(/`/g) || []).length;
  const headings = lines.filter(l => /^#{1,6}\s/.test(l)).length;
  // 残留 Source 行（历史缺陷：英文版曾多一行 Source 字段）
  const straySource = lines.filter(l => /^Source\s*:/.test(l)).length;
  const fm = frontmatter(lines);
  return {
    file,
    backticks, backtickParity: backticks % 2 === 0,
    headings,
    name: fm.name || null,
    version: fm.version || null,
    straySource,
  };
}

// 提取关键数值标记，用于跨语言数值漂移检测。
// 覆盖两类：① 带单位数值（% 与 px）——占比、字号、间距；② 尺寸对（如 800×800、1080×1350）——默认规格。
// 两类都是译文不应改变的关键数值。只比这两类，避免"3–5"这类纯计数在不同语言表述差异造成的误报。
function extractUnits(text) {
  const out = [];
  const reDim = /(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)/g;
  let m2;
  while ((m2 = reDim.exec(text)) !== null) out.push(m2[1] + '×' + m2[2]);
  const re = /(\d+(?:\.\d+)?)(%|px)/g;
  let m;
  while ((m = re.exec(text)) !== null) out.push(m[1] + m[2]);
  return out;
}
function countMultiset(arr) {
  const c = {};
  for (const x of arr) c[x] = (c[x] || 0) + 1;
  return c;
}
// 比较两份文本的数值标记多重集，返回对称性差异（中文独有 / 英文独有），不计较顺序。
function unitDrift(cnText, enText) {
  const cn = countMultiset(extractUnits(cnText));
  const en = countMultiset(extractUnits(enText));
  const onlyCn = [], onlyEn = [];
  const keys = new Set([...Object.keys(cn), ...Object.keys(en)]);
  for (const k of keys) {
    const d = (cn[k] || 0) - (en[k] || 0);
    if (d > 0) onlyCn.push(`${k}×${d}`);
    else if (d < 0) onlyEn.push(`${k}×${-d}`);
  }
  return { onlyCn, onlyEn };
}

const [cnArg, enArg] = process.argv.slice(2);
const here = __dirname;
// 包根 = scripts 的上两级（scripts → 技能目录 → 包根）；两份副本（cn/en）都按包根定位，行为一致。
const pkgRoot = path.join(here, '..', '..');
const cnPath = cnArg || path.join(pkgRoot, 'ecommerce-key-visual', 'SKILL.md');
const enPath = enArg || path.join(pkgRoot, 'ecommerce-key-visual-en', 'SKILL.md');

// 单装模式：只装了一个语种的包时，没有同名另一语种副本可比——不做双语比对，给出明确提示后正常退出（非报错）。
if (!fs.existsSync(cnPath) || !fs.existsSync(enPath)) {
  const missing = !fs.existsSync(cnPath) ? cnPath : enPath;
  console.log(JSON.stringify({
    mode: 'single-language',
    note: `未找到另一语种副本（${missing}）。单装模式下无双语可比，跳过一致性比对；双语漂移检查仅在 cn/en 双包同装时适用。`,
    status: 'SKIPPED',
  }, null, 2));
  process.exit(0);
}

const cn = analyze(cnPath);
const en = analyze(enPath);

const critical = [];
const warnings = [];

// 数值层一致性：不仅比结构与版本，还比规则正文里的关键数值（占比/字号/间距的 % 与 px）。
// 逐文件比对 SKILL.md 与 references 下同名文件；漂移只告警不阻断（译文表述差异可能良性，交由人工复核）。
const cnRaw = readLines(cnPath).join('\n');
const enRaw = readLines(enPath).join('\n');
const unitPairs = [{ cn: cnRaw, en: enRaw, label: 'SKILL.md' }];
try {
  const refDir = path.join(pkgRoot, 'ecommerce-key-visual', 'references');
  for (const f of fs.readdirSync(refDir)) {
    if (!f.endsWith('.md')) continue;
    const enRef = path.join(pkgRoot, 'ecommerce-key-visual-en', 'references', f);
    if (!fs.existsSync(enRef)) { warnings.push(`数值比对：英文 references 缺 ${f}`); continue; }
    unitPairs.push({ cn: fs.readFileSync(path.join(refDir, f), 'utf8'), en: fs.readFileSync(enRef, 'utf8'), label: `references/${f}` });
  }
} catch (e) { /* 无 references 目录则跳过 */ }
for (const p of unitPairs) {
  const d = unitDrift(p.cn, p.en);
  if (d.onlyCn.length || d.onlyEn.length)
    warnings.push(`数值漂移（${p.label}）：中文独有 ${d.onlyCn.join(', ')||'—'}；英文独有 ${d.onlyEn.join(', ')||'—'}`);
}

if (!cn.backtickParity) critical.push(`中文 SKILL.md 反引号奇数（${cn.backticks}）：存在未闭合代码块`);
if (!en.backtickParity) critical.push(`英文 SKILL.md 反引号奇数（${en.backticks}）：存在未闭合代码块`);
if (cn.version !== en.version) critical.push(`版本不一致：中文=${cn.version} 英文=${en.version}`);
if (cn.name && cn.name === en.name) critical.push(`name 撞车：中文与英文 name 相同（${cn.name}）——历史上因此互相顶替`);
if (cn.straySource) warnings.push(`中文 SKILL.md 有 ${cn.straySource} 处疑似残留 Source 行`);
if (en.straySource) warnings.push(`英文 SKILL.md 有 ${en.straySource} 处疑似残留 Source 行`);
if (cn.headings !== en.headings) warnings.push(`标题数不对称：中文=${cn.headings} 英文=${en.headings}（结构可能漂移）`);

const report = {
  cn: { name: cn.name, version: cn.version, backticks: cn.backticks, headings: cn.headings, straySource: cn.straySource },
  en: { name: en.name, version: en.version, backticks: en.backticks, headings: en.headings, straySource: en.straySource },
  critical, warnings,
  numericDrift: warnings.filter(w => w.startsWith('数值漂移')).length,
  status: critical.length ? 'FAIL' : (warnings.length ? 'WARN' : 'PASS'),
};
console.log(JSON.stringify(report, null, 2));
process.exit(critical.length ? 1 : 0);
