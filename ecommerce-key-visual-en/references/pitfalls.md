# Common pitfalls (symptom + remedy)

Source: pitfalls that recurred across the end-to-end test runs of this project (multiple iteration cycles, multiple rounds of independent review, and one ablation experiment). Only those that "someone else would hit again" are included; one-off mistakes are not. **Not bound to any specific product, brand or platform** — the examples only illustrate the symptom.

Each entry has three parts: **symptom** (what it looks like) → **why the machine cannot catch it** (where applicable) → **remedy** (just do this). Bracketed pointers name the relevant rules in this Skill.

---

## 1. Text and typography

### Pitfall 1 · Text sits on the background — "readable" but in fact illegible
- **Symptom**: the text colour and the background sit at similar lightness; it looks readable at normal size, but at 300px or with eyes half-closed it smears into a block. Mid-dark text on a dark background is the worst case.
- **Why the machine cannot catch it**: the diagnostics only judge "does it overflow" and "is it clipped", not "is the contrast sufficient".
- **Remedy**: give the text area a light backing or increase the lightness difference; before delivery you must look at a 300px thumbnail, per workflow 4 item 6.

### Pitfall 2 · A headline broken in the middle of a word
- **Symptom**: a two-character word, a brand name or a model number is split across two lines and the meaning is chopped up. The template allows breaking anywhere by default (`overflow-wrap:anywhere`), so it will break inside a word.
- **Why the machine cannot catch it**: the diagnostics report "clipped or overflowing text", not "broken inside a word".
- **Remedy**: stop the headline from breaking automatically (CSS `word-break: keep-all`) and decide where the line breaks by hand (insert a manual break in the headline, or narrow the headline container). **Watch the side effect**: once it no longer breaks, insufficient width makes the whole line overflow, which in turn triggers "exceeding the canvas = failure, the script does not export" (see pitfall 13) — so give it enough width or break manually at the same time, and re-run the export after the change. **Whenever the typeface or type size changes, re-check the line breaks.** (workflow 3)

### Pitfall 3 · The core message is unreadable in the thumbnail
- **Symptom**: the full-size image looks clear, but at listing-page size the core theme or the price that is required to stand out cannot be read.
- **Remedy**: make the thumbnail one of the acceptance criteria — it must let the core theme/value of this task and any price that is required to stand out be read; not every detail has to be legible. (workflow 4 item 6)

### Pitfall 4 · Brand name, product name and button text changed in only one language
- **Symptom**: when producing a bilingual version, the Chinese version reads "some brand" and the English version still carries Chinese in that line — because these three used to sit in a **shared global field** that did not follow the language. Measured at **six rounds out of six**, a high-probability problem rather than an occasional one.
- **Why the machine cannot catch it**: the diagnostics only check overflow and size, not "which language is this line in".
- **Remedy**: **keep the brand name, product name and button text in one copy per language** (`versions.<language key>.brand / .name / .cta`); comparing these three across the Chinese and English versions side by side is the first step of the language check. (workflow 3 · production; template `assets/main-image-template.html`)

### Pitfall 5 · Different classes of information crammed onto one line
- **Symptom**: "sale timing" and "probability statement" placed on **the same line** — two classes in one line, unreadable at thumbnail size, and the information hierarchy is weakened.
- **Remedy**: **group information by "class" as the smallest unit: the same class may share a line, different classes must be on separate lines or paragraphs**, with the grouping boundary visible in the information hierarchy table (which uses an "Information class" column to force grouping). (core rules · distilling; `references/templates.md`)

### Pitfall 6 · English long text left to automatic wrapping — split numbers, orphan characters
- **Symptom**: the English version repeatedly breaks lines in odd places — a word split down the middle, a price figure cut in two, a single character stranded on its own line, a hyphen stretched into a dash. Measured at **six rounds**, the same problem re-hit over and over.
- **Why the machine cannot catch it**: the diagnostics report "clipped text", not "the break position is wrong".
- **Remedy**: **long text (price combinations, condition notes, selling points) must have its break points set manually** and must not be left to automatic wrapping; for English, also pick the type size from the template's "line width → type size" reference and, where needed, give that language its own **Latin-first font stack** (`versions.<key>.font`). Re-run the export and check. (workflow 3 · production; `assets/main-image-template.html`)

---

## 2. Assets and compositing

### Pitfall 7 · "The file is a PNG, so it must have a transparent background"
- **Symptom**: a PNG may be RGBA with an alpha channel, or RGB with a solid background. Cutting out an image that is already cut out only damages its edges.
- **Remedy**: look at the transparency distribution, and composite it **once on a light background and once on a dark one** to see the real effect; use a good mask as it is, and only fix a bad one. (workflow 1; core rules · protecting original assets)

### Pitfall 8 · A cutout goes on the canvas with a large transparent margin, squeezing the product
- **Symptom**: the cut-out product image keeps a large transparent margin around it (measured at about **45%** of the whole image), so the product looks clearly too small in the finished image; this should have been caught **at the inspection stage**, and discovering it only in the finished image costs an extra rework round.
- **Why the machine cannot catch it**: a transparent area does not count as "exceeding the canvas" and triggers no warning.
- **Remedy**: **a cutout must be trimmed to its content bounds (all transparent margins removed) before it goes on the canvas**, and the **before/after trim sizes** recorded in the asset ledger; after trimming, recompute the product container's position and size from the trimmed bounds (do not reuse pre-trim coordinates). (workflow 1; workflow 3)
- **Field-path when reusing old HTML**: older templates read the global `d.brand`, while the current template reads `v.brand` per language. **If you lift an old HTML into the new version, remap `d.brand` to `v.brand`**, or the brand name will not resolve; do not "unify" by changing the current template back to `d.brand` — that would break the "brand stored per language" rule (see `SKILL.md`, production · field paths). (field mapping in `references/templates.md`)

### Pitfall 9 · Overlapping bounding boxes mistaken for "the subject is covered"
- **Symptom**: the bounding box of a transparent PNG overlaps another element and the machine reports "occlusion", although the visible subject is in fact not covered.
- **Remedy**: for a candidate overlap, look at the **actual pixels and a local screenshot**, not the bounding box. (workflow 3; workflow 4 item 3)

### Pitfall 10 · A generated background carries a watermark or "redraws" the product
- **Symptom**: a text watermark or signature appears in the generated image, or it draws a plausible-looking product subject from the description.
- **Remedy**: before delivery, check the background for **no text watermark and no redrawn product**; the product subject and logo must use the user's original assets and must not be redrawn with a generation tool. (workflow 3; core rules · protecting original assets)

---

## 3. Specification and export

### Pitfall 11 · The canvas size changed but the safe area was not updated
- **Symptom**: the size is set to 1080×1350 but the safe area still holds the previous value, so it is silently too small. The template only checks whether the canvas and safe area are **valid**, whether the language is configured, and whether a product asset and placeholders are present — **it does not convert the safe area for you**, so nothing is reported here.
- **Remedy**: when changing the size, change the safe area to **5% of the short side** at the same time (1080×1350 → 54px on all four sides); check before exporting. (workflow 3; inputs and handling of gaps · size)

### Pitfall 12 · The language key is written as an environment-variable name, or does not match the template
- **Symptom**: the language key is written as an **environment-variable name** such as `LANG` (which collides with a system variable and is easily picked up by mistake), or it does not match a key in the template's `window.design.versions` — the export finds no content, or produces an empty version.
- **Remedy**: use only a key that already exists in the template, or a short custom identifier that does not collide with an environment variable (e.g. `jp`; it must start with a letter, contain only letters, digits, underscores and hyphens, and be at most 32 characters); when you produce only one language you do not need the other version. (workflow 3 · export)

### Pitfall 13 · Elements exceed the canvas and you only find out after export
- **Symptom**: the page looks fine, and only the screenshot reveals clipped text or a clipped area.
- **Remedy**: treat "exceeding the canvas" as a **failure** in area diagnostics — the script does not export; treat scroll or ancestor clipping as a **warning** and judge each against the screenshot as "not clipped / genuinely defective / unconfirmed", neither taking the warning as a defect outright nor silently ignoring it. **Warnings state the overflow in pixels**: ≤2px is usually line-height rounding (just write "overflows 1px, judged not clipped"); only >2px needs image-by-image magnification. (workflow 3 · export)

### Pitfall 14 · The document structure changed but the pointer sentence did not
- **Symptom**: a table or file was deleted or renamed and the "see X" in the text was not updated, so the next person follows the pointer and finds nothing.
- **Remedy**: after any change, **search the whole document for every "see / refer to" pointer** and confirm the target exists and really contains what is claimed; a matching file name alone is not enough.

---

## 4. Facts and process

### Pitfall 15 · Price or parameters "filled in from a similar product"
- **Symptom**: products with the same name often come in several versions and price points; picking one at random produces an incident if it is wrong.
- **Remedy**: take price, parameters and campaign details only from the user's explicit input or the original material; if missing, ask — **never estimate or invent**; a search among similar products cannot prove that this product has a feature. (core rules · facts and sources)

### Pitfall 16 · Three directions that are three unrelated things, or three copies of one layout
- **Symptom**: without any constraint the three directions each say something different and cannot be compared; over-constrained, the three differ only in colour, which is as good as offering no choice. Another common shape is **layout only, no visual style**: the user thinks they are choosing a style when they are only choosing an arrangement.
- **Remedy**: the three directions share **the same facts and assets**, but must differ clearly, and the differences go into the proposal text. Write the differences in two columns: **① layout** — each direction bound to a different layout skeleton (`references/layouts.md`), where changing only the colours or the typeface does not count as a new direction; **② visual style** — **3–5 concrete colour values** plus a mood word plus a light/material note, where an adjective such as "healing" alone does not count, and two directions with much the same colour values mean no choice was offered. (workflow 2; `references/templates.md` · direction and information hierarchy)

### Pitfall 17 · Declaring a pass straight after the fix, with no re-test
- **Symptom**: a single change and it is declared good, with no evidence; in the next round you cannot say what state any version was in, should you need to roll back.
- **Remedy**: after every change **re-test the original failing case first, then regress the key capabilities**; keep the old version, the problem, the change and the re-check evidence; a pass after a change must not be written back as a pass for the old version. **Changing without verifying does not count as done.** (workflow 4; `references/evaluation.md`)

---

## 5. Environment and inputs (check before starting; ask about everything missing at once)

### Pitfall 18 · Judging whether a font exists with the "font-check API"
- **Symptom**: the browser's font-check API (`document.fonts.check`) only answers "**does this need to be downloaded at render time**" — a system substitution does not count as a download, so **it returns "true" even for a family that does not exist**. Measured result: **eight rounds all believed the specified font was in effect**, while the machine did not have that font at all.
- **Why the machine cannot catch it**: that API *is* the machine, and it gave the wrong answer.
- **Remedy**: switch to **measuring width** (render the same string in the target font and in a substitute and compare the widths — only a difference proves the target is in effect), or **list the system font directory** and check; **never** treat that API as evidence that a font is available. (workflow 3 · verify the environment first)

### Pitfall 19 · A specified font is not installed, so you substitute one yourself
- **Symptom**: the brief or the brand guidelines specify a typeface that is not installed, and the executor quietly picks a substitute — while the record still says "no substitute". The user neither knows the font changed nor gets to approve it.
- **Remedy**: **when a specified font is not installed, stop and ask the user**: switch to a **substitute font**, or have the user **install the font package** — **never decide the substitution yourself**. When the user chooses a substitute, declare the substitution at the specification lock (G4) (originally specified → actually used → why) and write it into the acceptance table and the delivery note; when the user chooses to install, re-test after installation before continuing. The font's **commercial-licensing status** is likewise a risk item that must be stated. (workflow 3 · verify the environment first)

### Pitfall 20 · The PDF text cannot be read, so work stops — or every round improvises
- **Symptom**: task briefs and spec sheets often arrive as **PDF**, while the runtime may not have a tool to read them. With no fixed procedure, different rounds improvise differently and the same input yields different handling and different results.
- **Remedy**: treat "the input may be a PDF" as the **norm** — ① look first for a plain-text/Markdown version of the same content; ② with no text version, **render the PDF to images** for visual checking; ③ fields and numbers **always follow the frozen text version**; ④ **never stop work because it cannot be read** — record the unreadable parts as "not verified" and list them at G1. (inputs and handling of gaps)

### Pitfall 21 · An asset whose name does not match its content is treated as an error
- **Symptom**: a file named `.png` is in fact a **solid image with no alpha channel**; the brief asks for one file name and a different one arrives. **We do not control naming** (whatever name the requester gives is the name), so "the name does not match the content" is the norm.
- **Remedy**: at inspection, check that "**file extension ↔ real format ↔ actual content**" agree; when they disagree, **flag it in the asset ledger and use the asset as it is** — **do not stop work, and do not ask the other side to rename**. (workflow 1; core rules; `references/templates.md`)

### Pitfall 22 · Hierarchy graded only by px, or using a CSS child selector to grade text injected via textContent
- **Symptom**: the information hierarchy is graded only by "font size" (e.g. headline 40px / secondary 15px / detail 13.5px), and adjacent tiers differ by only 1–2px, so the weight difference is invisible to the eye; or copy is injected as one block via `el.textContent`, then a CSS child selector (e.g. `.conditions .regional`) is used to bold/colour one line — with the result that either the tiers do not separate, or the child selector simply never applies.
- **Root cause**: ① the px gap is too small for the weight difference to show; ② `textContent` injects a **plain-text node** with no real child elements, so a CSS child selector matches nothing — it is a dead rule.
- **Remedy**: ① make the tier difference *visible* — beyond font size, pull the tiers apart with at least one more dimension (weight or colour); a 1–2px gap between adjacent tiers counts as no grading, and a hairline divider helps; ② when one block needs per-line grading, **do not write a CSS child selector for text injected via `textContent`** — instead **create real child elements in JS with `createElement`** (e.g. one `<li>` per point, a `<span class="detail">` for the fine-print line) and style each, or simply grade the whole block at the parent level. **Any child element created under remedy ② that carries visible text must itself carry `data-check`** (audit pass three judges by "is this element registered on itself", so a missing tag warns). This was hit for real: in a first run, the "several spec lines" and the "price conversion / platform / launch" blocks differed by only 1.5px; the user flagged "the two boxes have the same hierarchy", and only in the next round — when the spec lines were raised to semibold and the conversion lines dropped to a light small font — did the tiers separate. (workflow 2 · copy distillation; workflow 3 · set copy on canvas by hierarchy)
