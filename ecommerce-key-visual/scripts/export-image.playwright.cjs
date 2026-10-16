'use strict';
// ============================================================
// 可选替代导出路径（非默认）。默认导出走 export-image.sh —— agent-browser。
//
// 仅在 agent-browser 不可用的环境中使用本文件；它需要自备
// Node.js + Playwright + 可启动的 Chromium，且不自动安装软件。
//
// 用法:
//   node export-image.playwright.cjs --check-env
//   node export-image.playwright.cjs <HTML> <语言键> <宽> <高> <输出.png>
//   可用 NODE_PATH 指向已有模块环境，用 BROWSER_EXECUTABLE 指定 Chromium 路径。
//
// 与默认路径的能力差异：本文件把区域诊断与 PNG 校验放在同一个进程内；
// 默认路径把这部分交给 png-check.cjs。两者都不替代人工内容与视觉核验。
// ============================================================
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {pathToFileURL} = require('node:url');
const {auditLayout} = require('./layout-audit.cjs');
const args = process.argv.slice(2);
async function launch() {
  let chromium;
  try { ({chromium} = require('playwright')); }
  catch { throw new Error('缺少Playwright；使用已有模块环境或设置NODE_PATH。未自动安装。'); }
  return chromium.launch({headless:true, timeout:15000,
    ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {})});
}
function verifyPNG(file, width, height) {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b.subarray(0,8).toString('hex') !== '89504e470d0a1a0a' ||
      b.readUInt32BE(16) !== width || b.readUInt32BE(20) !== height) throw new Error('PNG格式/尺寸校验失败');
  return b.length;
}
async function checkEnvironment() {
  const browser = await launch(); let directory;
  try {
    directory = fs.mkdtempSync(path.join(os.tmpdir(),'visual-preflight-'));
    const page = await browser.newPage({viewport:{width:160,height:120},deviceScaleFactor:1});
    const imageSource='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>');
    await page.setContent(`<div style="font-family:sans-serif">渲染检查 Render check</div><img src="${imageSource}">`);
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
    const probe=path.join(directory,'probe.png');await page.screenshot({path:probe});
    verifyPNG(probe,160,120);
    console.log(JSON.stringify({environment:'可启动、加载并保存PNG',productFonts:'仍需按项目核验'}));
  } finally {
    if(directory) fs.rmSync(directory,{recursive:true,force:true});
    await browser.close();
  }
}
async function main() {
  if (args.length===1 && args[0]==='--check-env') return checkEnvironment();
  const [html, language, sw, sh, output, ...extra] = args;
  if (!output || extra.length || !/^[a-zA-Z][a-zA-Z0-9_-]{0,31}$/.test(language||'') ||
      !/^[1-9]\d*$/.test(sw||'') || !/^[1-9]\d*$/.test(sh||'')) {
    throw new Error('用法: export-image.playwright.cjs --check-env，或 <HTML> <语言键> <正整数宽> <正整数高> <输出.png>');
  }
  const width=Number(sw),height=Number(sh),source=path.resolve(html),target=path.resolve(output);
  if(width>16000 || height>16000) throw new Error('脚本支持的尺寸上限为16000px');
  if(!fs.existsSync(source) || !fs.statSync(source).isFile()) throw new Error('HTML文件不存在');
  if(path.extname(target).toLowerCase()!=='.png') throw new Error('输出须为PNG');
  const auditFile=target+'.audit.json';
  if(source===target || fs.existsSync(target) || fs.existsSync(auditFile)) throw new Error('输出或诊断文件已存在，请换版本名');
  const browser=await launch(),temp=target+`.partial-${process.pid}.png`;
  try {
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const url=pathToFileURL(source);url.searchParams.set('only',language);
    await page.goto(url.href,{waitUntil:'load',timeout:30000});
    await page.evaluate(async()=>{
      await document.fonts.ready;
      if(!window.visualReady) throw new Error('未提供visualReady；需适配模板加载检查');
      await window.visualReady;
      await Promise.all([...document.images].filter(i=>i.getAttribute('src')).map(i=>i.decode()));
    });
    const canvas=page.locator('#canvas');
    const audit=await canvas.evaluate(auditLayout);
    if(audit.width!==width || audit.height!==height) throw new Error('画布与输入宽高不一致');
    if(audit.failures.length) throw new Error(JSON.stringify(audit.failures));
    const config=await page.evaluate(()=>{const d=window.design||{};const resolved=(getComputedStyle(document.documentElement).getPropertyValue('--font')||'').trim();return {maxBytes:d.maxBytes,font:resolved||d.font||null};});
    if(config.maxBytes!=null && (!Number.isFinite(config.maxBytes)||config.maxBytes<=0)) throw new Error('体积上限须为正数或null');
    fs.mkdirSync(path.dirname(target),{recursive:true});
    await canvas.screenshot({path:temp});
    const bytes=verifyPNG(temp,width,height);
    if(config.maxBytes && bytes>config.maxBytes) throw new Error(`PNG ${bytes} bytes超过上限${config.maxBytes}`);
    const result={output:target,width,height,bytes,language,fontStack:config.font,...audit,
      status:'机器文件检查完成，待人工内容与视觉核验'};
    fs.renameSync(temp,target);
    try {fs.writeFileSync(auditFile,JSON.stringify(result,null,2),{flag:'wx'});}
    catch(e) {throw new Error(`PNG已保存但诊断写入失败，需补记录：${e.message}`);}
    console.log(JSON.stringify(result));
  } finally {
    if(fs.existsSync(temp)) fs.unlinkSync(temp);
    await browser.close();
  }
}
main().catch(e=>{console.error(`未完成全部导出检查: ${e.message}`);process.exitCode=1;});
