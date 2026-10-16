# Layout skeleton library (five starting skeletons)

Each direction proposal binds one skeleton; in production you rebuild the layout of the `.layout` layer of `assets/main-image-template.html` according to that binding (what this library calls a "layout skeleton" is the `.layout` block in the template) — **the skeleton decides *where things go*; colours and typeface decide *what things look like*; the two are independent**. Changing only the colours or the typeface without changing the skeleton does not count as changing the direction. **The reverse holds too: giving a skeleton without colours/mood leaves the user with no *visual style* to choose** — a direction proposal must give **both columns** (layout = skeleton number + compositional difference; visual style = 3–5 colour values + mood word + light/material note).

This library is a starting reference, not a closed list: when the product and brand material point to a different arrangement, follow the material and declare it; the arrangement you produce must still pass the safe-area, 300px readability and export-audit checks.

## The five skeletons at a glance

| No. | Name | Composition in one line | Direction types it usually suits | Aspect ratios it suits |
| --- | --- | --- | --- | --- |
| A | Text left, image right | Text column on the left, product column on the right, the vertical hierarchy reads top to bottom at a glance | Product-as-hero, conventional hero image | Portrait, square |
| B | Centred symmetry | Everything centred: headline across the top, product centred in the middle, price anchored at the bottom | Clean and imposing, ceremonial | Square, portrait |
| C | Stacked banner | A full-width product/scene band on top, an information bar below | Scene-driven, lifestyle | Landscape, square |
| D | Diagonal dynamism | Product pushed into one corner, text into the opposite corner, background lines creating movement | Performance, technology | Portrait, square |
| E | Price block first | Price/offer turned into a large colour block pinned to the top or bottom, the product second | Major sales, pre-sale | Portrait, square |

## Three-direction comp comparison (what the user sees in the proposal)

**The proposal needs a comp comparison image — one thumbnail comp rendered per direction, shown side by side.** Writing only "skeleton A: text left, image right" leaves the user to translate that into a picture before they can compare; most people will not, so "choosing a direction" quietly collapses into "picking a colour scheme".

**Five hard requirements** (missing any one counts as having given no image):

1. **Side by side, one size and one scale** — do not let one be larger than another, since size alone skews the judgement;
2. **Each comp uses that direction's actual colour values** (background, primary, ink), otherwise the style difference cannot be compared;
3. **Each comp uses that direction's bound skeleton** (left/right split, top/bottom banner, diagonal dynamism…), otherwise the layout difference cannot be compared;
4. **A thumbnail of the real cut-out asset in the product slot**; when the asset is not ready, a proportional placeholder is allowed but must be labelled "product placeholder" in the caption;
5. **Caption each comp below** with: direction name / skeleton number / that direction's colour values.

**Present it and save it**: present it inline in the conversation (visual card / HTML preview) so the user can compare on the spot; also export a PNG into the project directory and list it as a deliverable, so it can still be checked after the session ends.

> **Why character wireframes are not a substitute**: a wireframe can say *where things sit*, but not *how the colours feel together*. When choosing a direction, the first impression from colour is often stronger than the layout — that is exactly why the comps must be rendered rather than pasted as character boxes.

**Falling back to character boxes while rendering is available counts as having given no image** (see workflow 2 in `SKILL.md`). The wireframes under "Skeleton quick reference (character wireframes · fallback)" below are for **environments without a browser or any drawing tool** only, and must be labelled "**wireframe only, not the finished look**".

## Skeleton quick reference (character wireframes · fallback)

**Use only when no graphic can be rendered at all** (no browser, no drawing tool). In that case paste the wireframes below into the proposal, mark them "**wireframe only, not the finished look**", and note in the record "no rendering capability this run, downgraded to wireframes".

**Four things every diagram must show** (missing any one means it is still invisible to the user): ① **block names** (logo / headline / points / price / CTA / product); ② **the product's position and its size constraint** (e.g. "height >= 55% of the short side"); ③ **the hierarchy** (the headline is largest — the drawing must make that comparison obvious); ④ **the real proportions of any cross-format variant** — draw a wide box for a wide canvas instead of passing off a portrait box, and caption it "skeleton X, <landscape/portrait> variant".

> **Generation note**: the wireframes below contain full-width characters; hand-typing them always drifts out of alignment — generate them by padding on East-Asian width (full-width = 2 columns, Latin = 1 column) and then paste. Better still, avoid ambiguous-width glyphs such as `≥` inside the boxes and write `>=` instead, which is always 2 columns. Key: `▣` logo　`▓▓` product　`┃` separator within one tier　`[ ]` button.

### Skeleton A · Text left, image right (portrait / square)

```text
┌──────────────────────┬───────────────────────┐
│  ▣ Logo              │                       │
│  Headline (heaviest) │                       │
│  ────────────        │        ▓▓ Product ▓▓  │
│  · Sub-point 1       │          (cut-out)    │
│  · Sub-point 2       │                       │
│  · Sub-point 3       │                       │
│                      │                       │
│  ¥ Price ┃ Fine print│       Product col 50% │
│  [ CTA button ]      │                       │
│                      │                       │
└──────────────────────┴───────────────────────┘
      Text col 50%              Product col 50%
```

### Skeleton B · Centred symmetrical (square / portrait)

```text
┌──────────────────────────────────────────────┐
│                  ▣ Logo                      │
│                                              │
│        Headline (centred · largest)          │
│       · Point 1 · Point 2 · Point 3          │
│                                              │
│            ▓▓ Product ▓▓                     │
│           (centred · flex:1)                 │
│                                              │
│         ¥ Price ┃ Fine print                 │
│            [ CTA button ]                    │
└──────────────────────────────────────────────┘
   Headline on top → product in the middle → price at the bottom
```

### Skeleton C · Top/bottom banner (landscape / square)

```text
┌──────────────────────────────────────────────┐
│                                              │
│        ▓▓▓▓ Product / scene ▓▓▓▓             │
│        (full-width top · flex:1.3)           │
│                                              │
├──────────────────────────────────────────────┤
│  ▣ Logo │ Headline │ ¥ Price ┃ Terms │ CTA   │
└──────────────────────────────────────────────┘
   Bottom bar: three columns (logo | headline+points | price+CTA)
```

### Skeleton D · Diagonal dynamism (portrait / square)

```text
┌──────────────────────────────────────────────┐
│  ▣ Logo                                      │
│  Headline (large)              ╱             │
│  ──────────                  ╱               │
│  · Point 1                    ╱              │
│  · Point 2                   ╱               │
│  · Point 3                  ╱                │
│  ¥ Price ┃ Terms            ╱                │
│  [ CTA ]                   ╱                 │
│            ▓▓ Product ▓▓ (lower right)       │
└──────────────────────────────────────────────┘
   Copy to upper left (60% wide)   Product to lower right (62%)
```

### Skeleton E · Price block first (portrait / square)

```text
┌──────────────────────────────────────────────┐
│  ┏━━━━━━━━━━━━━━┓                            │
│  ┃  ¥ Price  Launch ┃  ← block <= 1/4 high   │
│  ┗━━━━━━━━━━━━━━┛                            │
│  ▣ Logo                                      │
│  Headline                                    │
│  · Point 1 · Point 2                         │
│                                              │
│            ▓▓ Product ▓▓                     │
│                                              │
│  Fine print           [ CTA button ]         │
└──────────────────────────────────────────────┘
```

### Landscape variant (16:9, skeleton A landscape as the example)

```text
┌────────────────────────┬───────────────────────────────┐
│  ▣ Logo                │                               │
│  Headline (heaviest)   │                               │
│  ───────────           │                               │
│  · Point 1 (<=4 items) │           ▓▓▓ Product ▓▓▓     │
│  · Point 2             │      Height >= 55% short      │
│  · Point 3             │      Width >= 30% canvas      │
│                        │                               │
│  ¥ Price ┃ Terms [CTA] │                               │
│                        │                               │
└────────────────────────┴───────────────────────────────┘
      Text col 42–48%                  Product col 52–58%
```

## How to apply each skeleton (append over the template's styles; leave `window.design` alone)

The CSS snippets below are rules that **come later and override the base styles**. **Do not replace the template's existing `.layout` rule with `position:absolute;inset:var(--safe)`** — once `.layout` loses its positioning and `inset`, its height degrades to `auto`, and the `flex:1` (flex-basis:0) in skeletons B/C/E **collapses to zero height**, while the machine audit only looks for "exceeding the canvas" and cannot detect a blank collapse — so always look at the finished image after changing the skeleton.

**Skeleton A (the template default, unchanged)**: `.layout` keeps `grid-template-columns:1fr 1fr`.

**Skeleton B · Centred symmetry**:
```css
.layout{display:flex;flex-direction:column;align-items:center;text-align:center}
.copy{align-items:center;width:100%}
.logo{object-position:center}
ul{list-style:none;padding:0;display:flex;gap:2em;flex-wrap:wrap;justify-content:center}
.product{flex:1;min-height:0}
```
Note: once the selling points run in a row, each one must be short so a single line does not overflow; when the product is centred, allow enough whitespace above and below.

**Skeleton C · Stacked banner** (DOM order unchanged, reordered with `order`):
```css
.layout{display:flex;flex-direction:column}
.product{order:-1;flex:1.3;min-height:0}
.copy{flex:1;min-height:0;justify-content:flex-start;width:100%}
```
Note: `.copy` needs `width:100%` added, otherwise the template's leftover `align-items:center` narrows and centres the information bar instead of letting it span the full width; this skeleton only looks good when the product image carries a complete background or scene — a cut-out image floating on a banner looks empty and needs a code-built or generated background.

**Skeleton D · Diagonal dynamism**:
```css
.layout{display:block}
.product{position:absolute;right:0;bottom:0;width:62%;height:62%}
.copy{position:absolute;left:0;top:0;width:60%}
```
Note: **the product itself stays as it is — no rotation, no distortion** (the original-asset protection rule); create movement with the product's position plus background decoration (gradient bars, geometric shapes). Setting the product to **62% width/height** is skeleton D's designed size, already above the global hard lower bound (height ≥ 55% of the short side, width ≥ 30% of the canvas width — see "Minimum product footprint"); it is consistent with the global rule. After switching to absolute positioning, **the text area and the product area may overlap, and the machine audit does not check overlaps** — inspect a local screenshot by eye for unintended occlusion; **decoration lines must carry `data-check`** (see `SKILL.md`, production · audit coverage) — once attached, running past the canvas is caught by the audit as a warning instead of being clipped silently. When the product sits in a corner, make sure its outline does not cross the safe area.

**Skeleton E · Price block first**:
```css
.layout{display:flex;flex-direction:column}
.offer{order:-1;align-self:flex-start;background:var(--primary);color:#fff;padding:.4em .8em;border-radius:8px}
.copy{width:100%}
.product{flex:1;min-height:0}
```
Note: add `width:100%` to `.copy` to stop the information area narrowing; `order` acts **inside `.copy`** — the effect is to move the price block to the front of the text column (visually, to the top of the canvas). **To put the price at the bottom**, `order` cannot do it (it only sorts within its own parent): move the offer/conditions/cta elements after the product block in the DOM instead. Once the price block is enlarged, the headline is still the reference for the information hierarchy (you may put the price first in the hierarchy for this direction, but the block should not exceed a quarter of the canvas height); the tension between promotional feel and brand tone must be checked separately at acceptance.

## Landscape adaptation (16:9, 16:10 and other wide canvases)

In the table above, skeletons A/B/D/E are listed as portrait/square, and skeleton C is listed as landscape but notes that "a cutout floating on a banner looks empty". **Landscape + a cut-out product image is a common combination** (store banners, feeds, ad banners), and the library previously offered nothing actionable for it, so this section fills that gap:

- **Minimum product footprint (hard lower bound across all skeletons / all formats, stated first)**: the product subject in the finished image must occupy **height ≥ 55% of the canvas short side and width ≥ 30% of the canvas width** — this is a **hard lower bound** that applies to every skeleton and every aspect ratio; below it the product is too small and you must switch skeleton or re-lay-out (this is the same act as "recompute the container from the trimmed bounds" — see Workflow 1). Landscape also has a **height ≤ 60% of the short side** upper bound (to stop the info bar being squeezed; see "Hard cap on the info-bar height" below); **55% ≤ height ≤ 60%, width ≥ 30%** is the compliant landscape range. Skeleton D sets the product to 62% width/height — that is skeleton D's designed size, already **above** the global lower bound (62% ≥ 55%, 62% ≥ 30%), so it is consistent with this rule; skeleton D is for portrait/square and is not subject to the landscape 60% ceiling.

- **Recommended start: the landscape variant of skeleton A** (text-left / image-right is the most stable on a wide canvas):
  ```css
  .layout{display:grid;grid-template-columns:46% 1fr;align-items:center;gap:4%}
  .copy{min-width:0}
  .product{width:100%;height:100%;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center}
  .product img{max-width:100%;max-height:100%;object-fit:contain}
  ```
  Key points: text column **42–48%**, product column **52–58%**; vertical space is tight on a wide canvas, so **keep selling points to ≤4 and each one short**; inside the product column the **minimum footprint is height ≥ 55% of the canvas short side and width ≥ 30% of the canvas width** (the hard lower bound across all skeletons; see "Minimum product footprint" above — below it the product is too small and you must switch skeleton or re-lay-out).
- **How to verify the product footprint**: do not measure it by "pixel difference between the finished image and a no-product reference" — **low-contrast subjects are systematically underestimated** (a white body on a pale wall measures 5–6% smaller in pixel-diff than its true rendered box, which can falsely read as "below 55%"). The right way: **render a reference image with a solid-colour stand-in of the same pixel size as the asset, subtract the no-product version, take the bbox** — that gives the exact rendered box; check its height/width against the minimum footprint above.
- **Product height has a ceiling**: on a landscape canvas every bit of height given to the product band is taken from the info bar — in practice, on a 16:9 canvas a product band at about 58% of the height leaves the info bar only about 30%, and English copy already nearly fills that. **Before enlarging the product, compute the height the info bar needs** (take the largest across languages); if both sides are pinned, use a smaller type size or a two-line info bar instead of forcing it — the symptom of forcing it is English fine print getting clipped or pushed off the canvas.
- **Hard cap on the info-bar height (anti-overstuff)**: on a landscape canvas the **info-bar (text column) height must be ≤ 45% of the canvas height**; equivalently the **product height should be ≤ 60% of the canvas short side** (the two together leave a safety margin). When the product must exceed this, switch the skeleton (e.g. portrait, or skeleton B/C centre/full-bleed) — do not compress the text bar below 45%; the symptom of hitting the limit is English fine print clipped or pushed off the canvas.
- **Cross-format use must be declared**: using a skeleton listed as "portrait/square" on a landscape canvas (or the reverse) is outside the library's stated fit, so **write one line in both the direction proposal table and an HTML comment**: "this direction uses the <landscape/portrait> variant of skeleton X, because: …". **Not declaring it counts as an incomplete proposal record** — a reviewer cannot tell from the finished image whether this was "re-laid out per the material" or "silently reusing the default skeleton".
- When skeleton C is used on a landscape canvas, a cut-out product must be backed with a code-built or generated background (see skeleton C's note) — do not leave it floating.
- After any change of format, re-check against usage criterion 4: does a line break clip text, does the subject cross the safe area, is the hierarchy still readable at 300px.

## Applicable prerequisites and alternatives for reference-image techniques

The reference images in the case library use some techniques, but not all can be copied unconditionally — each has an **applicable prerequisite**, and when the prerequisite is not met you **switch to an alternative** rather than forcing it or skipping it:

- **Leader-line annotation (a line pointing to a product part with a caption)**: the prerequisite is **part-coordinate assets** (so you can point precisely at "this is the suction port / that is the filter"). Without coordinates it is unusable — a wrong pointer misleads. Alternative: use a "part-to-point text column", listing "part → the selling point it supports" in the info area, without drawing a line.
- **Full-bleed dark tone (a dark background across the whole image)**: the prerequisite is **a light-version logo, or permission to recolour the brand**. When the logo exists only in a dark version it is unusable — a dark logo on a dark ground is invisible. Alternative: overlay a **semi-transparent dark scrim (`rgba(0,0,0,.35)`)** on the background, plus give the logo a **light outline/glow** (`filter:drop-shadow(0 0 6px rgba(255,255,255,.6))`) so the dark logo stays readable on the dark ground.

These two are **hard capability boundaries, not defects**; at the direction proposal and acceptance, state plainly "this technique was not used this task because the prerequisite was not met (an alternative was used)" — that fits the "protect original assets / keep the brand recognisable" rule better than forcing it.

## Usage criteria

1. **Each direction must be bound to a different skeleton**; state the skeleton number plus a one-line compositional difference for every direction in the proposal table. When the user specifies how many directions, follow that number (do not force three), but **directions must still not share one skeleton**.
2. **Every direction must also carry a "visual style" column** (3–5 concrete colour values + mood word + light/material note) — an adjective such as "healing" alone does not count. **The skeleton decides "where it goes", the visual style decides "what tone it reads as", and one column without the other is not a usable direction**; when two directions share much the same colour values, the user has no stylistic choice.
3. **Once a direction is chosen, build on the bound skeleton** — do not quietly fall back to skeleton A. If you genuinely need to change the skeleton, return to G3, explain why, and leave a record.
4. After changing the skeleton, always check: does any line break clip text, does the subject cross the safe area, is the hierarchy still readable at 300px; judge each machine warning against the main file's rule as "not clipped / genuinely defective / unconfirmed", and do not take "zero warnings" as the pass condition.
5. Language versions reuse the same skeleton (across the language versions of one product, the layout stays the same, or is adapted only in line breaks, type size and necessary local layout).
