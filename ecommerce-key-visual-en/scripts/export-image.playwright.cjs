'use strict';
// ============================================================
// Optional alternative export path (not the default). The default export goes through
// export-image.sh — agent-browser.
//
// Use this file only in an environment where agent-browser is unavailable; it requires
// your own Node.js + Playwright + a launchable Chromium, and installs nothing automatically.
//
// Usage:
//   node export-image.playwright.cjs --check-env
//   node export-image.playwright.cjs <HTML> <language key> <width> <height> <output.png>
//   NODE_PATH may point to an existing module environment, and BROWSER_EXECUTABLE to a Chromium path.
//
// Capability differences from the default path: this file puts the area diagnostics and the
// PNG verification in one process, while the default path hands that part to png-check.cjs.
// Neither replaces human content and visual verification.
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
  catch { throw new Error('Playwright is missing; use an existing module environment or set NODE_PATH. Nothing was installed automatically.'); }
  return chromium.launch({headless:true, timeout:15000,
    ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {})});
}
function verifyPNG(file, width, height) {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b.subarray(0,8).toString('hex') !== '89504e470d0a1a0a' ||
      b.readUInt32BE(16) !== width || b.readUInt32BE(20) !== height) throw new Error('PNG format/size verification failed');
  return b.length;
}
async function checkEnvironment() {
  const browser = await launch(); let directory;
  try {
    directory = fs.mkdtempSync(path.join(os.tmpdir(),'visual-preflight-'));
    const page = await browser.newPage({viewport:{width:160,height:120},deviceScaleFactor:1});
    const imageSource='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>');
    await page.setContent(`<div style="font-family:sans-serif">Render check</div><img src="${imageSource}">`);
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
    const probe=path.join(directory,'probe.png');await page.screenshot({path:probe});
    verifyPNG(probe,160,120);
    console.log(JSON.stringify({environment:'starts, loads and saves a PNG',productFonts:'still to be verified for the project'}));
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
    throw new Error('Usage: export-image.playwright.cjs --check-env, or <HTML> <language key> <positive integer width> <positive integer height> <output.png>');
  }
  const width=Number(sw),height=Number(sh),source=path.resolve(html),target=path.resolve(output);
  if(width>16000 || height>16000) throw new Error('This script supports sizes up to 16000px');
  if(!fs.existsSync(source) || !fs.statSync(source).isFile()) throw new Error('The HTML file does not exist');
  if(path.extname(target).toLowerCase()!=='.png') throw new Error('Output must be a PNG');
  const auditFile=target+'.audit.json';
  if(source===target || fs.existsSync(target) || fs.existsSync(auditFile)) throw new Error('The output or the diagnostic file already exists, please use a new version name');
  const browser=await launch(),temp=target+`.partial-${process.pid}.png`;
  try {
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const url=pathToFileURL(source);url.searchParams.set('only',language);
    await page.goto(url.href,{waitUntil:'load',timeout:30000});
    await page.evaluate(async()=>{
      await document.fonts.ready;
      if(!window.visualReady) throw new Error('No visualReady provided; the template load check needs adapting');
      await window.visualReady;
      await Promise.all([...document.images].filter(i=>i.getAttribute('src')).map(i=>i.decode()));
    });
    const canvas=page.locator('#canvas');
    const audit=await canvas.evaluate(auditLayout);
    if(audit.width!==width || audit.height!==height) throw new Error('Canvas does not match the input width/height');
    if(audit.failures.length) throw new Error(JSON.stringify(audit.failures));
    const config=await page.evaluate(()=>{const d=window.design||{};const resolved=(getComputedStyle(document.documentElement).getPropertyValue('--font')||'').trim();return {maxBytes:d.maxBytes,font:resolved||d.font||null};});
    if(config.maxBytes!=null && (!Number.isFinite(config.maxBytes)||config.maxBytes<=0)) throw new Error('The byte-size cap must be a positive number or null');
    fs.mkdirSync(path.dirname(target),{recursive:true});
    await canvas.screenshot({path:temp});
    const bytes=verifyPNG(temp,width,height);
    if(config.maxBytes && bytes>config.maxBytes) throw new Error(`PNG ${bytes} bytes exceeds the cap ${config.maxBytes}`);
    const result={output:target,width,height,bytes,language,fontStack:config.font,...audit,
      status:'Machine file checks done, human content and visual verification still required'};
    fs.renameSync(temp,target);
    try {fs.writeFileSync(auditFile,JSON.stringify(result,null,2),{flag:'wx'});}
    catch(e) {throw new Error(`The PNG was saved but writing the diagnostic record failed, please supplement it: ${e.message}`);}
    console.log(JSON.stringify(result));
  } finally {
    if(fs.existsSync(temp)) fs.unlinkSync(temp);
    await browser.close();
  }
}
main().catch(e=>{console.error(`Did not complete all export checks: ${e.message}`);process.exitCode=1;});
