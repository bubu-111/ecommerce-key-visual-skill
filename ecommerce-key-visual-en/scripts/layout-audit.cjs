'use strict';
// This function runs inside the page and does not rely on Node objects; machine diagnostics do not replace visual acceptance.
function auditLayout(canvas) {
  const c = canvas.getBoundingClientRect(), failures = [], warnings = [], hints = [];
  for (const e of canvas.querySelectorAll('[data-check]')) {
    const r = e.getBoundingClientRect(), style = getComputedStyle(e);
    if (style.display === 'none' || (!r.width && !r.height)) continue;
    const id = e.id || e.className || e.tagName;
    if (r.left < c.left - .5 || r.top < c.top - .5 ||
        r.right > c.right + .5 || r.bottom > c.bottom + .5) {
      failures.push({id, reason:'Checked area exceeds the canvas',
        overflowPx:{left:Math.max(0, c.left - r.left), top:Math.max(0, c.top - r.top),
                    right:Math.max(0, r.right - c.right), bottom:Math.max(0, r.bottom - c.bottom)}});
    }
    // Safe-area check: area past the safe area but still inside the canvas -> warning (warn->manual review, not a failure that blocks export)
    // Hits cases like a version tag/logo placed outside the safe area (e.g. a tag 4px past the boundary) that the machine used to miss.
    const safe = (window.design && Number.isFinite(window.design.safe)) ? window.design.safe
                 : Math.round(0.05 * Math.min(c.width, c.height));
    const sl = c.left + safe, st = c.top + safe, sr = c.right - safe, sb = c.bottom - safe;
    if (r.left < sl - .5 || r.top < st - .5 || r.right > sr + .5 || r.bottom > sb + .5) {
      warnings.push({id, reason:'Checked area exceeds the safe area, confirm on the actual image whether it presses the edge',
        overflowPx:{left:Math.max(0, sl - r.left), top:Math.max(0, st - r.top),
                    right:Math.max(0, r.right - sr), bottom:Math.max(0, r.bottom - sb)}});
    }
    const ox = Math.max(0, e.scrollWidth - e.clientWidth), oy = Math.max(0, e.scrollHeight - e.clientHeight);
    if (ox > 1 || oy > 1) {
      const item = {id, reason:'Scroll size exceeds the line box, needs checking against the actual screenshot',
        overflowX:style.overflowX, overflowY:style.overflowY, overflowPx:{x:ox, y:oy}};
      // An overflow of <=2px is usually line-height rounding (e.g. 1.12x72px = 80.6px) and is demoted to a hint,
      // so it need not be magnified image by image; >2px stays a warning and must be judged by hand as
      // "not clipped / genuinely defective / unconfirmed" — never take "warnings cleared" as the pass condition.
      (Math.max(ox, oy) <= 2 ? hints : warnings).push(item);
    }
    let parent = e.parentElement;
    while (parent && canvas.contains(parent)) {
      const ps = getComputedStyle(parent), pr = parent.getBoundingClientRect();
      const clipX = /hidden|clip|scroll|auto/.test(ps.overflowX);
      const clipY = /hidden|clip|scroll|auto/.test(ps.overflowY);
      const opx = clipX ? Math.max(0, pr.left - r.left, r.right - pr.right) : 0;
      const opy = clipY ? Math.max(0, pr.top - r.top, r.bottom - pr.bottom) : 0;
      if (opx > .5 || opy > .5) {
        warnings.push({id, reason:'Area may be clipped by an ancestor, needs confirmation on the actual image', overflowPx:{x:opx, y:opy}}); break;
      }
      parent = parent.parentElement;
    }
  }
  // Second pass: elements without data-check never enter the audit above, and ones past the canvas are silently clipped — sweep for them here.
  // Only elements with an id/class are considered (self-made decorations and capsules always carry a class; bare structural nodes like li/span are skipped to avoid noise).
  // Out-of-canvas is a warning, not a failure: it does not block export, but it is no longer silent.
  const checked = new Set(canvas.querySelectorAll('[data-check]'));
  for (const e of canvas.querySelectorAll('*')) {
    if (checked.has(e)) continue;
    const style = getComputedStyle(e);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    const id = e.id || (typeof e.className === 'string' ? e.className.trim() : '');
    if (!id) continue;
    const r = e.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    if (r.left < c.left - .5 || r.top < c.top - .5 ||
        r.right > c.right + .5 || r.bottom > c.bottom + .5) {
      warnings.push({id, reason:'Element without data-check exceeds the canvas (not covered by the default audit); confirm by hand whether it is clipped',
        overflowPx:{left:Math.max(0, c.left - r.left), top:Math.max(0, c.top - r.top),
                    right:Math.max(0, r.right - c.right), bottom:Math.max(0, r.bottom - c.bottom)}});
    }
  }
  // Third pass: content-text backstop — intercept elements that carry visible text yet lack data-check (self-invented copy that was never registered).
  // A hit requires: the element owns a non-empty direct text node, is not carried by any data-check ancestor, and is currently visible.
  // Pure decoration (no text) is skipped to avoid noise; only list items (li) whose direct parent ul/ol carries data-check are treated as
  // carried by the parent list. Any other element with direct text must itself carry data-check even if an ancestor has it — hiding
  // self-invented text inside a data-check container no longer bypasses this pass. Template chrome hidden in export mode (e.g. .notice) is skipped.
  // Pairs with the "use only the provided material pack" rule as a machine backstop.
  for (const e of canvas.querySelectorAll('*')) {
    if (checked.has(e)) continue;
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (e.tagName === 'SCRIPT' || e.tagName === 'STYLE') continue;
    let directText = '';
    for (const n of e.childNodes) if (n.nodeType === 3) directText += n.nodeValue;
    directText = directText.trim();
    if (!directText) continue;
    let p = e.parentElement;
    const ownedByList = e.tagName === 'LI' && p && /^UL|OL$/i.test(p.tagName) && p.hasAttribute('data-check');
    if (ownedByList) continue;
    const id = e.id || (typeof e.className === 'string' ? e.className.trim() : '');
    warnings.push({id: id || e.tagName, reason:'Element carries visible text but lacks data-check (it is a content element and must be registered for audit); confirm by hand whether it is self-invented or missing its tag', text: directText.slice(0, 24)});
  }
  // The template records field concerns such as an empty price/CTA in window.visualWarnings; merge them into the warning channel here.
  for (const w of (window.visualWarnings || [])) warnings.push({id:'field', reason:String(w)});
  // Product real footprint: use the product container (.product / #product) bounding box relative to the canvas to compute height/width percentages,
  // for manual checking against the hard lower bounds (height >= 55% of the short side, width >= 30% of the canvas width; see references/layouts.md product minimum occupancy).
  // These lower bounds apply to all skeletons and aspect ratios; landscape also has a height <= 60% upper bound (to stop the text strip being squeezed), which the machine reports only the lower bounds for — the upper bound is checked by hand.
  let productFootprint = null;
  const prod = canvas.querySelector('.product') || canvas.querySelector('#product');
  if (prod) {
    const pr = prod.getBoundingClientRect();
    const ph = c.height ? (pr.height / c.height) : 0, pw = c.width ? (pr.width / c.width) : 0;
    const hints = [];
    if (ph < 0.55) hints.push('Product height percentage is below the hard lower bound of 55%; confirm whether it is too small or a different skeleton is needed');
    if (pw < 0.30) hints.push('Product width percentage is below the hard lower bound of 30%; confirm whether it is too narrow');
    productFootprint = {
      heightPct: Math.round(ph * 1000) / 10, widthPct: Math.round(pw * 1000) / 10,
      hint: hints.length ? hints.join('; ') : null
    };
  }
  return {width:c.width, height:c.height, failures, warnings, hints, productFootprint,
    manualReview:['Actual text visibility','Product and logo appearance','Subject/decoration overlap','Pseudo-elements/overlays','Composition and brand quality','Safe-area margin']};
}
module.exports = {auditLayout};
