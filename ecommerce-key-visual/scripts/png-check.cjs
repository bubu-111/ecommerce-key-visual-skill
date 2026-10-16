'use strict';
// 校验与汇总：PNG 文件头核对、区域诊断闸门、诊断记录落盘。
// 只使用 Node 内置模块，不安装任何 npm 包；机器检查不替代人工内容与视觉核验。
const fs = require('node:fs');
const path = require('node:path');

const PNG_SIGNATURE = '89504e470d0a1a0a';

function die(message) {
  console.error(message);
  process.exit(1);
}

// 读取 PNG 实际宽高：按文件头（IHDR 必须是首个数据块），不信任调用方传入的尺寸
function readPng(file) {
  let buffer;
  try {
    buffer = fs.readFileSync(file);
  } catch (e) {
    die(`读不到输出文件：${file}（${e.message}）`);
  }
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== PNG_SIGNATURE) {
    die(`输出不是有效 PNG：${file}`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), bytes: buffer.length };
}

function readJson(file, fallback) {
  const raw = () => fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw());
  } catch {}
  // 容错：渲染器输出若混入日志行/ANSI 色码，剥掉后取首尾大括号之间的内容再试一次。
  try {
    const t = raw().replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
    const s = t.indexOf('{'), e = t.lastIndexOf('}');
    if (s >= 0 && e > s) return JSON.parse(t.slice(s, e + 1));
  } catch {}
  return fallback;
}

const commands = {
  // 环境预检：证明渲染器能启动、加载并保存出正确尺寸的 PNG
  probe([file, width, height, version]) {
    const w = Number(width);
    const h = Number(height);
    const info = readPng(file);
    if (info.width !== w || info.height !== h) {
      die(`预检尺寸 ${info.width}×${info.height} 与要求 ${w}×${h} 不一致；渲染器不可用，未完成导出检查`);
    }
    console.log(JSON.stringify({
      renderer: 'agent-browser',
      rendererVersion: version || 'unknown',
      environment: '可启动、加载并保存 PNG',
      probe: `${info.width}×${info.height}`,
      productFonts: '仍需按项目核验',
      note: '预检只证明渲染与保存可用，不证明成品的事实、素材覆盖与视觉质量',
    }, null, 2));
  },

  // 区域诊断闸门：失败项存在时不进入截图，避免产出已知越界的成图
  gate([auditFile]) {
    const audit = readJson(auditFile, null);
    if (!audit) die('区域诊断结果不是有效 JSON；未导出');
    if (Array.isArray(audit.failures) && audit.failures.length) {
      die(`区域诊断未通过，未导出：${JSON.stringify(audit.failures)}`);
    }
  },

  // 校验并发布：核对实际宽高与体积，写诊断文件，最后才把成图落到目标路径
  finalize([pngFile, width, height, language, auditFile, configFile, auditOut, target]) {
    const w = Number(width);
    const h = Number(height);
    const audit = readJson(auditFile, { failures: [], warnings: [], hints: [], manualReview: [] });

    if (Array.isArray(audit.failures) && audit.failures.length) {
      die(`区域诊断未通过，未导出：${JSON.stringify(audit.failures)}`);
    }
    if (audit.width != null && (Number(audit.width) !== w || Number(audit.height) !== h)) {
      die(`画布与输入宽高不一致：画布 ${audit.width}×${audit.height}，输入 ${w}×${h}`);
    }

    const info = readPng(pngFile);
    if (info.width !== w || info.height !== h) {
      die(`PNG 实际尺寸 ${info.width}×${info.height} 与要求的 ${w}×${h} 不一致；未发布成图`);
    }

    const config = readJson(configFile, {});
    const maxBytes = config.maxBytes;
    if (maxBytes != null && (!Number.isFinite(Number(maxBytes)) || Number(maxBytes) <= 0)) {
      die('体积上限须为正数或 null');
    }
    if (maxBytes != null && info.bytes > Number(maxBytes)) {
      die(`PNG ${info.bytes} bytes 超过上限 ${maxBytes}`);
    }

    // 商品足迹硬下限告警（高度≥短边 55%、宽度≥画布宽 30%，见 references/layouts.md）并入 warnings，避免结果被丢弃
    const footprint = audit.productFootprint || null;
    const warnings = (audit.warnings || []).slice();
    if (footprint && footprint.hint) warnings.push({ id: 'footprint', reason: footprint.hint });

    const result = {
      output: target,
      width: w,
      height: h,
      bytes: info.bytes,
      language,
      fontStack: config.font || null,
      renderer: 'agent-browser',
      failures: audit.failures || [],
      warnings,
      hints: audit.hints || [],
      manualReview: audit.manualReview || [],
      productFootprint: footprint,
      status: '机器文件检查完成，待人工内容与视觉核验',
    };

    fs.mkdirSync(path.dirname(auditOut), { recursive: true });
    try {
      fs.writeFileSync(auditOut, JSON.stringify(result, null, 2), { flag: 'wx' });
    } catch (e) {
      die(`诊断文件写入失败（未发布成图）：${e.message}`);
    }
    try {
      fs.renameSync(pngFile, target);
    } catch (e) {
      try { fs.unlinkSync(auditOut); } catch { /* 诊断文件可能已不存在 */ }
      die(`成图落盘失败（诊断文件已撤回）：${e.message}`);
    }
    process.stdout.write(JSON.stringify(result) + '\n');
  },
};

const [command, ...rest] = process.argv.slice(2);
if (!command || !Object.prototype.hasOwnProperty.call(commands, command)) {
  die('用法: png-check.cjs probe <png> <宽> <高> [渲染器版本] | gate <审计.json> | ' +
      'finalize <png> <宽> <高> <语言键> <审计.json> <配置.json> <审计输出.json> <目标.png>');
}
commands[command](rest);
