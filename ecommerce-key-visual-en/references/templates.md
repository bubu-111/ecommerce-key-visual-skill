# Working and evaluation record templates

Fill these in for the actual task. Do not copy a source and a confirmation status twice for the same fact; when it belongs to two categories, register one row in each and point both at the same source (see below). Simple tasks may merge tables. Write "unknown" for what is unknown, and "not verified" for a check that was not done.

## Asset ledger

Register "input" by the unit actually received: one file is one row, and a block of text is also one row. Anything not used must state why.

**Default asset material is a transparent PNG**; if a file name disagrees with the real format/content (an exception), register and flag it as it is — check that "file extension ↔ real format ↔ actual content" agree; when they disagree, say so in the "Format/size/transparency and edge conclusion" column (e.g. "named .png, actually a solid image with no alpha channel") and **use the asset as it is** — do not stop work, and do not ask the other side to rename. For a cutout, also record the **before/after trim sizes** (see the trim rule in workflow 1).

| Input (file or text block) | Format/size/transparency and edge conclusion | Role: must-use / optional / reference | Where used, or why not used |
| --- | --- | --- | --- |

## Facts and requirements table (hereafter "facts table")

| Field | Original value and necessary conditions | Source location/version | Confirmation status | Distilled/translated value | Position in image |
| --- | --- | --- | --- | --- | --- |

Covers product identity and parameters, brand constraints, selling points, price type, campaign conditions/timing, audience, language, quantity and size. Fill in as needed; not every item has to exist. Leave "position in image" empty when creating the table and fill it in after production; when one fact belongs to two categories, register it in both rows.

Summary: goal, must-show list, adopted specification and basis, gaps/conflicts, unclassified original text, design assumptions, items needing a user decision. Change log: field, old value → new value, basis, date.

## Template fields ↔ record mapping (`window.design` in `assets/main-image-template.html`)

Check this table before editing the template, so the image and the ledger do not disagree.

| Template field | Taken from | Note |
| --- | --- | --- |
| `width` / `height` / `safe` / `maxBytes` | The specification record: width×height, safe area on four sides, size cap | Must match the width/height given to the export command; with no basis, use the default 800×800 and a safe area of 5% of the short side, and declare it |
| `colors.primary` / `ink` / `bg` | Facts table · brand constraints (colour values) | With no brand guidelines, mark it "temporary visual scheme" and do not write it as an official guideline |
| `font` | Facts table · brand constraints (typeface) | Write the actual and substitute fonts into the environment pre-check field of the acceptance record; re-check line breaks after a font change |
| `productImage` / `logoImage` / `backgroundImage` | Asset ledger: file, role, where used | The product and logo must be the original assets; the background may be generated or built in code |
| `versions.<language key>.brand` / `.name` / `.cta` | Facts table · brand name, product name, call to action (**all three one copy per language**) | Ask first when missing; do not invent one. These three are the easiest to change in one language and forget in the other; comparing them side by side across Chinese and English is the first step of the language check (the "English brand line mixed with Chinese" defect, seen in six rounds, came from here) |
| `versions.<language key>.lang` / `headline` / `points` / `offer` / `conditions` | The corresponding fields in the facts and requirements table: language, core value, selling points, price and campaign conditions | Translations go into the "translation/generation" comparison table; price and schedule may only come from a source or from user confirmation |

Two notes. **Default specification** (800×800, safe area 5% of the short side) follows `SKILL.md` "Inputs and handling of gaps · size"; this table and `references/platforms.md` quote the same values, so a change must be made in all three places. **Type sizes scale automatically** — the template derives `--gap / --title / --body / --small / --price / --logo-h` proportionally from `min(width,height)/800`, so spacing and type size follow a change of canvas size; override those variables in the page when you need precise control.

## Line width → type size reference (aid for manual English line breaks)

English long lines (price combinations, condition notes, selling points) must have break points set manually (see `SKILL.md` "Production"); the table below gives the **baseline type size** for "at most N English/digit characters per line (line width)", to pick a size that will not burst the safe area.

- **Baseline**: canvas short side **1080**, safe area 5% of the short side, usable text width ≈ 1080 − 2×(5%×1080) = **972px**. The "baseline type size" below is given for a 1080 short side.
- **Scaling**: when the actual canvas short side is S, actual type size = baseline type size × (S / 1080). **Note: the template's built-in type-size anchor (title 48px × min(width,height)/800) is a "generic hierarchy starting point" — it is not the same system as the table below and the values are not convertible.** For English long lines, use the table below; when the two disagree, start from the table, then verify against the actual rendered width (the same string rendered in the target font must fit within the safe-area width).
- **This is a starting point, not a hard rule**: verify against the actual rendered width in the end (the rendered width of the same string in the target font ≤ the safe-area width). Adjust up or down for mixed Chinese/English/digits by the actual character widths; a monospaced or narrow font may go up, a wide (e.g. serif) font must come down.

| Max characters per line (line width) | Baseline type size (1080 short side) | Typical use |
| --- | --- | --- |
| ≤ 8 | 140 | Large headline, very short tagline |
| 9–14 | 110 | Main headline |
| 15–22 | 84 | Short selling-point phrase |
| 23–32 | 60 | Price combination, short condition line |
| 33–45 | 46 | Longer condition note |
| 46–60 | 36 | Multi-line note, footnote |

> Example: canvas 1080×1920 (short side 1080), line width 28 → take 60; canvas 800×800 (short side 800), same line width → 60 × (800/1080) ≈ 44.

## Direction and information hierarchy

A direction **must give both columns; one without the other is not a direction**:

| Column | What to fill in | Required fields |
| --- | --- | --- |
| **Layout** | Skeleton A / B / C / D / E (see `references/layouts.md`) | Skeleton number + a one-line compositional difference + a **rendered comp (that one panel of the three-direction comparison image)** |
| **Visual style** | Colours / mood / material / light | **3–5 concrete colour values** + a mood word (e.g. "creamy calm", "neon night market") + a light/material note |

Each direction also needs: concept/target audience, the core visual anchor, the information hierarchy, and how it differs from the others. Selection: the direction and the basis of confirmation/authorisation (**a general delegation such as "just do it" or "run the test" does not include the direction; only "direction authorisation" — a delegation of the choice, or the user having chosen a direction themselves — counts**). Do not force three when the user specifies a quantity or a direction. **When two directions share much the same colour values, no stylistic choice has been offered — redo them.**

**The comp comparison image is required, not a bonus**: a skeleton number is just a letter — the user cannot see the difference between A and C from it, **nor how the colours feel together**. Render one thumbnail comp per direction (using that direction's skeleton **and its actual colour values**) and show the three side by side; requirements and method are in "Three-direction comp comparison" in `references/layouts.md`. Character wireframes are a fallback only, when nothing can be rendered, and must be labelled "not the finished look" — **falling back to character boxes while rendering is available counts as having given no image**.

> **Right vs wrong**: wrong — "direction 1: skeleton A, text left / image right; direction 2: skeleton C, top/bottom banner": a letter plus eight words, leaving the user to render it in their head before they can compare. Also wrong — pasting three `┌─┐` character boxes into the markdown: that still *describes* the layout rather than showing the picture. Right — three thumbnails rendered with the real colour values and the real skeleton, side by side, where the product slot, the headline hierarchy and the price block can all be compared at a glance.

**How the proposal reaches the user**: after writing the directions, **ask for the choice inside the current conversational turn and wait there for the reply** — do not end the turn as soon as the file is written, or the user must start a new message, one continuous task gets split in two, and afterwards the artefacts do not reveal whether the run is stuck at G3 or already delivered. Interaction style and the fallback when the environment has no interactive facility are in `SKILL.md`, workflow 2, "Direction selection is a mid-turn interaction".

The information hierarchy table uses an "Information class" column to force grouping — **same class may share a line; different classes must be on separate lines**:

| Information | **Information class** | Required/optional | Priority and display conditions | Position and thumbnail reading goal |
| --- | --- | --- | --- | --- |

> **Right/wrong example**: wrong — putting "online/offline sale timing" and "regular/hidden edition probability" on **the same line** (two classes crammed into one line, unreadable at thumbnail size); right — **the probability class on its own line/paragraph, the sale-timing class on its own line/paragraph**, with the grouping boundary visible in the table.

## Finished-image acceptance

The table in this section is the **acceptance table** (the blank template); once filled in, it and its evidence together are the **acceptance record**.

| Check | Conclusion: pass/fail/not verified | Evidence or specific problem |
| --- | --- | --- |
| Input files taken stock of, extracted correctly and with sources (unclassified material broken down and filed, nothing missed) | | |
| Where each input went: position marked if used / reason stated if not | | |
| Required information and assets appear completely; price/units/conditions accurate; nothing unsupported added; every content element in the image traces back to a material-pack asset or the task brief (incl.: information already expressed by the logo, such as the brand name, must not be typed out again) | | |
| Product/logo appearance preserved; no unintended occlusion at outline, structure, marks or contact areas | | |
| Elements' spatial relationships (position, size, spacing, alignment, overlap) match the facts table / asset ledger / direction proposal | | |
| Width/height, format, byte size, safe area; no placeholders or clipped text | | |
| Language content correspondence and typographic fit | | |
| Version numbers stay in sync across languages (same version number for Chinese and English within one iteration round) | | |
| The same element (headline/brand/price) keeps the same colour, weight and hierarchy across languages | | |
| The set of retained sub-facts lines up across languages (any per-language compression/merge is stated in the acceptance record) | | |
| Layout matches the skeleton bound to the G3-chosen direction (no switching back to the default skeleton partway) | | |
| Composition, typeface, colour, compositing, brand and communication goal; decoration/pseudo-elements re-checked | | |
| Source code/assets complete, can be edited and re-exported | | |

Evidence may be a comparison table, the actual image, a 300px thumbnail and machine-check results; screenshots of every field are not required. For scoring and rework criteria see `references/quality-rubric.md`: record the **scores, reasons and who scored** for the five dimensions in this section (on a separate line, or in the evidence/notes); no image means no score. **Self-scoring is only a self-check and does not replace the user's review — whether it passes is still decided by the user.** **Division of labour between this table and the scoring rubric**: this table judges "does it meet the requirements" (pass/fail/not verified), while the five scores in `quality-rubric.md` judge "how well it was done"; the same problem may be recorded once in each, and neither replaces the other.

Environment pre-check: renderer/fonts, whether start-up and saving succeeded, output size, alternative path and blockers. **Fonts must be measured** — write "typeface specified by the brief / typeface actually used / how it was determined (width comparison or font directory) / reason for substitution / licensing status"; **never** write "no substitute" on the strength of `document.fonts.check()` alone; also record here that a missing font was raised with the user and what they chose. **Also record the list of tools found missing before starting and the user's answers.** **Machine-warning field**: object, metric, **overflow in pixels**, clipping condition, local evidence, human conclusion (not clipped / genuinely defective / unconfirmed).

Fixes: old version, error position, root cause, change, new version, number of attempts, re-check result; keep before-and-after evidence and do not overwrite historical failures. Still failing: draft status, blocker, inputs or tools needed.

## Translation/generation (where applicable)

| Source text | Translation | Proper nouns/numbers/conditions kept | Unconfirmed terms |
| --- | --- | --- | --- |

Background: the actual prompt, tool, file, number of attempts/reasons for re-generating; check for no text watermark, no redrawn product, whitespace, light and cropping.

## Evaluation and iteration (where applicable)

Use `references/evaluation.md` and set the test baseline for the current task; record the real output and its limits.
