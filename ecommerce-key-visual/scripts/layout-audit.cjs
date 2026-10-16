'use strict';
// 此函数在页面内执行，不依赖Node对象；机器诊断不替代视觉验收。
function auditLayout(canvas) {
  const c = canvas.getBoundingClientRect(), failures = [], warnings = [], hints = [];
  for (const e of canvas.querySelectorAll('[data-check]')) {
    const r = e.getBoundingClientRect(), style = getComputedStyle(e);
    if (style.display === 'none' || (!r.width && !r.height)) continue;
    const id = e.id || e.className || e.tagName;
    if (r.left < c.left - .5 || r.top < c.top - .5 ||
        r.right > c.right + .5 || r.bottom > c.bottom + .5) {
      failures.push({id, reason:'检查区域超出画布',
        overflowPx:{left:Math.max(0, c.left - r.left), top:Math.max(0, c.top - r.top),
                    right:Math.max(0, r.right - c.right), bottom:Math.max(0, r.bottom - c.bottom)}});
    }
    // 安全区检查：区域越过安全区、但仍画布内 → 告警（告警→人工判，不当 failure 阻断导出）
    // 命中场景：版本标签/Logo 等被放在安全区外（如版本标越界 4px），此前机器漏报，靠人工发现。
    const safe = (window.design && Number.isFinite(window.design.safe)) ? window.design.safe
                 : Math.round(0.05 * Math.min(c.width, c.height));
    const sl = c.left + safe, st = c.top + safe, sr = c.right - safe, sb = c.bottom - safe;
    if (r.left < sl - .5 || r.top < st - .5 || r.right > sr + .5 || r.bottom > sb + .5) {
      warnings.push({id, reason:'检查区域超出安全区余量，需实际画面确认是否压边',
        overflowPx:{left:Math.max(0, sl - r.left), top:Math.max(0, st - r.top),
                    right:Math.max(0, r.right - sr), bottom:Math.max(0, r.bottom - sb)}});
    }
    const ox = Math.max(0, e.scrollWidth - e.clientWidth), oy = Math.max(0, e.scrollHeight - e.clientHeight);
    if (ox > 1 || oy > 1) {
      const item = {id, reason:'scroll尺寸超过行盒，需结合实际截图复核',
        overflowX:style.overflowX, overflowY:style.overflowY, overflowPx:{x:ox, y:oy}};
      // 溢出量 ≤2px 多为行高舍入误差（如 1.12×72px=80.6px），降级为提示，不必逐张放大；
      // >2px 仍为警告，须人工判「未裁切／确有缺陷／未确认」——不以告警清零为通过条件。
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
        warnings.push({id, reason:'区域可能被祖先裁切，需实际画面确认', overflowPx:{x:opx, y:opy}}); break;
      }
      parent = parent.parentElement;
    }
  }
  // 第二遍：未挂 data-check 的元素不进上面的审计，越出画布会静默被裁——这里兜底扫一遍。
  // 只看带 id/class 的元素（装饰线、胶囊等自造元素都有类名；li/span 等裸结构节点跳过防噪声）。
  // 越界报 warning 不报 failure：不阻断导出，但不再静默。
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
      warnings.push({id, reason:'元素未挂 data-check 且超出画布（默认审计不覆盖它），须人工确认是否被裁切',
        overflowPx:{left:Math.max(0, c.left - r.left), top:Math.max(0, c.top - r.top),
                    right:Math.max(0, r.right - c.right), bottom:Math.max(0, r.bottom - c.bottom)}});
    }
  }
  // 第三遍：内容性文字兜底——拦截"自造一行字却没挂 data-check"的元素。
  // 判定：元素自身持有非空直接文本节点、未被任一 data-check 祖先承载、且当前可见（非 display:none/visibility:hidden）。
  // 纯装饰无文字、容器（文本由带 data-check 的子元素承载，如 ul#points 下的 li）不报，防噪声；
  // 模板 chrome（.notice 等在导出态隐藏）不报。与 SKILL「只用资料包素材」规则配合，机器层兜底"自造内容"。
  for (const e of canvas.querySelectorAll('*')) {
    if (checked.has(e)) continue;
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (e.tagName === 'SCRIPT' || e.tagName === 'STYLE') continue;
    // 自身是否直接持有非空文本节点（区别于"文本由子元素承载"的容器）
    let directText = '';
    for (const n of e.childNodes) if (n.nodeType === 3) directText += n.nodeValue;
    directText = directText.trim();
    if (!directText) continue;
    // 第三遍不再因"祖先挂了 data-check"就放过文字：data-check 只声明该元素「自身」的布局与内容已登记，
    // 不代表其内部任何文字都被自动溯源。只有列表项 li 且直接父 ul/ol 挂了 data-check 时，文本由父列表整体登记，才视为被承载；
    // 其余任何带直接文字的元素（div/p/span/h* 等）即便祖先挂了 data-check，也必须自身挂 data-check，否则按未登记内容告警。
    // 这样堵住"把自造文字塞进 data-check 容器即可绕过第三遍"的缝隙。
    let p = e.parentElement;
    const ownedByList = e.tagName === 'LI' && p && /^UL|OL$/i.test(p.tagName) && p.hasAttribute('data-check');
    if (ownedByList) continue;
    const id = e.id || (typeof e.className === 'string' ? e.className.trim() : '');
    warnings.push({id: id || e.tagName, reason:'元素持有可见文字内容但未挂 data-check（属内容性元素，须登记以便审计）；须人工确认是否自造或漏挂', text: directText.slice(0, 24)});
  }
  // 模板把"价格/CTA 留空"这类字段疑点写进 window.visualWarnings，这里并入警告通道。
  for (const w of (window.visualWarnings || [])) warnings.push({id:'field', reason:String(w)});
  // 商品真实足迹：用商品容器（.product / #product）相对画布的渲染框，算出高度/宽度占比，
  // 供人工核对是否达硬下限（高度≥短边 55%、宽度≥画布宽 30%；见 references/layouts.md 商品最小占位）。
  // 这是全骨架/全画幅适用的硬下限；横版另有高度≤60% 上限（防信息条被挤爆），本机只报告下限，上限由人工对照。
  let productFootprint = null;
  const prod = canvas.querySelector('.product') || canvas.querySelector('#product');
  if (prod) {
    const pr = prod.getBoundingClientRect();
    const ph = c.height ? (pr.height / c.height) : 0, pw = c.width ? (pr.width / c.width) : 0;
    const hints = [];
    if (ph < 0.55) hints.push('商品高度占比低于硬下限 55%，须确认是否过小或须换骨架');
    if (pw < 0.30) hints.push('商品宽度占比低于硬下限 30%，须确认是否过窄');
    productFootprint = {
      heightPct: Math.round(ph * 1000) / 10, widthPct: Math.round(pw * 1000) / 10,
      hint: hints.length ? hints.join('；') : null
    };
  }
  return {width:c.width, height:c.height, failures, warnings, hints, productFootprint,
    manualReview:['文字实际可见性','商品与Logo外观','主体与装饰交叠','伪元素/蒙层','构图与品牌质量','安全区余量']};
}
module.exports = {auditLayout};
