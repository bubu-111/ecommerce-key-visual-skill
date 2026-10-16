# Optional decoration technique library (validated · self-contained)

This library collects optional decoration techniques validated during real test runs, written as **CSS you can copy directly**, with no dependency on any case or reference image outside the package. The techniques are **not general rules** — use them only when their trigger condition is met, following "trigger → CSS snippet → notes". For each technique, the **method (CSS / layout logic) may be borrowed freely**, but any **number or text inside it is content** and must come from the material pack / brief and map item by item to the facts table — "method may be borrowed, content must be real" is a hard boundary.

> Self-contained note: every CSS snippet here can be pasted directly into the template's `<style>` (appended after the template styles); no external asset and no reference image is needed. A later case that meets the trigger takes the technique directly instead of reinventing it.

## General discipline: separate the container (decoration) from the inner text (content)

- A **decoration container** (`.ghost` / `.pill` / any layer that exists for visuals) carries `data-check` as pure decoration and passes the audit; it **holds decoration styles only and must not hold visible text content**.
- **Every piece of text / number inside a container is a content element** and must carry `data-check` **on itself** (you cannot let the container's `data-check` count as registration — `layout-audit.cjs` pass three catches any element that "carries visible text yet lacks `data-check` on itself"; see `SKILL.md`, production · audit coverage).
- In practice: wrap the pill / ghost-number text in its own element (e.g. `<span data-check>…</span>`, or add `data-check` to the element that holds the text node); **do not let visible text be a direct text child of the decoration container** — otherwise pass three warns and the content cannot be traced.

## 1. Ghost number

- **Trigger**: the material pack contains one prominent, fact-based single number (e.g. 18,000 Pa suction, 43 h battery) that you want as a low-contrast giant background number to strengthen recall.
- **How**: place an absolutely positioned `.ghost` layer inside `.layout`, before the copy (`z-index` below the product and the copy); use an extra-large font size and low opacity, colour taken from the brand or a neutral colour. The number must be **wider than the subject that overlaps it**, otherwise the subject covers it and only the edges show.
- **CSS snippet (copy directly)**:
  ```css
  .ghost{position:absolute;left:40%;right:0;top:0;bottom:0;z-index:0;display:flex;align-items:flex-end;justify-content:flex-end;overflow:hidden;pointer-events:none}
  .ghost .num{font-size:300px;font-weight:800;color:rgba(176,141,87,.13);line-height:.8}
  .ghost .unit{font-size:84px;color:rgba(176,141,87,.17)}
  .copy{position:relative;z-index:2}
  .product{position:relative;z-index:1}
  ```
- **Notes**: `.ghost` is a decoration layer (carry `data-check`); the number inside **must come from the material pack / brief** (constrained by "use only the provided material pack") and the number text must carry `data-check` on itself (e.g. `<span data-check class="num">18,000</span>`) — never invent it, and do not rely on `.ghost`'s `data-check` for registration. If the number is not wide enough it is covered entirely by the product, so measure the subject width before setting the font size.

## 2. Atmospheric glow

- **Trigger**: you need a "morning-white / airy / premium" mood, or the product lacks layering on a light background. Can be drawn in code, no external asset needed.
- **CSS snippet (layered on `#background`'s multi-layer `background`, zero new DOM, zero external asset, copy directly)**:
  ```css
  #background{
    background:
      radial-gradient(62% 52% at 76% 10%, rgba(255,255,255,.92), rgba(255,255,255,0) 70%),
      radial-gradient(46% 38% at 8% 92%, rgba(214,205,189,.40), rgba(214,205,189,0) 70%),
      var(--bg);
  }
  ```
- **Notes**: stack multiple `radial-gradient`s on the template's existing background colour — no new element needed; if you do add a decoration layer, it must carry `data-check`. This technique has **no content element**; it is pure method and may be borrowed freely.

## 3. Glass pill

- **Trigger**: you want the feature points / selling points as "equal-width glass capsules" to raise refinement and readability (instead of plain text lines).
- **CSS snippet (copy directly)**:
  ```css
  .pill{display:inline-flex;align-items:center;gap:.6em;padding:.5em .9em;border-radius:12px;
        background:rgba(255,255,255,.72);border:1px solid #E4DAC6;color:var(--ink);font-size:var(--small)}
  ```
- **Notes**: `.pill` is a decoration container (carry `data-check`); text inside the pill is still a content element and must map item by item to the material pack, and the count and wording are constrained by "use only the provided material pack"; **each pill's text must carry `data-check` on itself** (e.g. `<span data-check>…</span>`) — do not rely on `.pill` for registration, or pass three will warn "carries visible text but lacks `data-check`". The glass-pill container must carry `data-check`.
