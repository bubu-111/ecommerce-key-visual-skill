'use strict';
// Verification and summarising: PNG header checks, the area-diagnostic gate, and writing the diagnostic record.
// Uses only Node built-in modules and installs no npm package; machine checks do not replace human content and visual verification.
const fs = require('node:fs');
const path = require('node:path');

const PNG_SIGNATURE = '89504e470d0a1a0a';

function die(message) {
  console.error(message);
  process.exit(1);
}

// Read the PNG's actual width and height from the file header (IHDR must be the first data chunk); never trust the size the caller passes in
function readPng(file) {
  let buffer;
  try {
    buffer = fs.readFileSync(file);
  } catch (e) {
    die(`Cannot read the output file: ${file} (${e.message})`);
  }
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== PNG_SIGNATURE) {
    die(`Output is not a valid PNG: ${file}`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), bytes: buffer.length };
}

function readJson(file, fallback) {
  const raw = () => fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw());
  } catch {}
  // Tolerance: if the renderer output mixes in log lines/ANSI colour codes, strip them and retry
  // with the content between the first and last brace.
  try {
    const t = raw().replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
    const s = t.indexOf('{'), e = t.lastIndexOf('}');
    if (s >= 0 && e > s) return JSON.parse(t.slice(s, e + 1));
  } catch {}
  return fallback;
}

const commands = {
  // Environment pre-check: proves the renderer can start, load and save a PNG of the right size
  probe([file, width, height, version]) {
    const w = Number(width);
    const h = Number(height);
    const info = readPng(file);
    if (info.width !== w || info.height !== h) {
      die(`Pre-check size ${info.width}×${info.height} does not match the requested ${w}×${h}; the renderer is unusable, the export check was not completed`);
    }
    console.log(JSON.stringify({
      renderer: 'agent-browser',
      rendererVersion: version || 'unknown',
      environment: 'starts, loads and saves a PNG',
      probe: `${info.width}×${info.height}`,
      productFonts: 'still to be verified for the project',
      note: 'The pre-check only proves that rendering and saving work; it does not prove the facts, asset coverage or visual quality of the finished image',
    }, null, 2));
  },

  // Area-diagnostic gate: while failures exist, do not go on to the screenshot, so no image with a known overflow is produced
  gate([auditFile]) {
    const audit = readJson(auditFile, null);
    if (!audit) die('The area diagnostics result is not valid JSON; nothing exported');
    if (Array.isArray(audit.failures) && audit.failures.length) {
      die(`Area diagnostics did not pass, nothing exported: ${JSON.stringify(audit.failures)}`);
    }
  },

  // Verify and publish: check the actual width, height and byte size, write the diagnostic file, and only then move the image to the target path
  finalize([pngFile, width, height, language, auditFile, configFile, auditOut, target]) {
    const w = Number(width);
    const h = Number(height);
    const audit = readJson(auditFile, { failures: [], warnings: [], hints: [], manualReview: [] });

    if (Array.isArray(audit.failures) && audit.failures.length) {
      die(`Area diagnostics did not pass, nothing exported: ${JSON.stringify(audit.failures)}`);
    }
    if (audit.width != null && (Number(audit.width) !== w || Number(audit.height) !== h)) {
      die(`Canvas does not match the input width/height: canvas ${audit.width}×${audit.height}, input ${w}×${h}`);
    }

    const info = readPng(pngFile);
    if (info.width !== w || info.height !== h) {
      die(`PNG actual size ${info.width}×${info.height} does not match the requested ${w}×${h}; the image was not published`);
    }

    const config = readJson(configFile, {});
    const maxBytes = config.maxBytes;
    if (maxBytes != null && (!Number.isFinite(Number(maxBytes)) || Number(maxBytes) <= 0)) {
      die('The byte-size cap must be a positive number or null');
    }
    if (maxBytes != null && info.bytes > Number(maxBytes)) {
      die(`PNG ${info.bytes} bytes exceeds the cap ${maxBytes}`);
    }

    // Merge product-footprint hard-floor hints (height >= 55% of short side, width >= 30% of canvas; see references/layouts.md) into warnings so the result is not dropped
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
      status: 'Machine file checks done, human content and visual verification still required',
    };

    fs.mkdirSync(path.dirname(auditOut), { recursive: true });
    try {
      fs.writeFileSync(auditOut, JSON.stringify(result, null, 2), { flag: 'wx' });
    } catch (e) {
      die(`Writing the diagnostic file failed (image not published): ${e.message}`);
    }
    try {
      fs.renameSync(pngFile, target);
    } catch (e) {
      try { fs.unlinkSync(auditOut); } catch { /* the diagnostic file may already be gone */ }
      die(`Writing the image to disk failed (the diagnostic file was withdrawn): ${e.message}`);
    }
    process.stdout.write(JSON.stringify(result) + '\n');
  },
};

const [command, ...rest] = process.argv.slice(2);
if (!command || !Object.prototype.hasOwnProperty.call(commands, command)) {
  die('Usage: png-check.cjs probe <png> <width> <height> [renderer version] | gate <audit.json> | ' +
      'finalize <png> <width> <height> <language key> <audit.json> <config.json> <audit output.json> <target.png>');
}
commands[command](rest);
