# General evaluation and iteration

The baseline comes from the current user task and the original material, not from one fixed product case. List the required fields, assets, design constraints and communication goal first, freeze the version, then test. The accuracy test keeps one fixed reference baseline (the same assets and the same requirement text), to avoid judging only from an impression of the previous version.

| Dimension | Method | Evidence |
| --- | --- | --- |
| Accuracy | Run the same baseline several times independently, and check in two steps: ① **check the content** — whether extraction, distilling, copy and compositing constraints are accurate; ② **check the execution** — whether the workflow ran through as expected, and whether it exposed places where the original material is unclear, self-contradictory or unsupported | Input sources, omissions/errors/unsupported additions, the finished image; nodes where the workflow stalled or needed an ad-hoc decision; a DOM check is not a substitute for a visual check |
| Stability | Keep the task unchanged while paraphrasing (distinguishing "reworded" from "the task has changed"); also test changes in the supported environment and fonts, separating "can be invoked" from "completes reliably" | Intent, workflow, key fields and delivery; a changed task is recorded separately |
| Quality | **Do one round of simplification first** (merge duplicates, delete restatements that can be derived from other entries), **then go through the core rules of `SKILL.md` item by item and check that each still has a corresponding statement — those core rules are the "core capability list" referred to here**, and only then compare versions and cost with the same input/model/environment | Facts and asset coverage, independent visual review, completion rate, lines/characters/tokens/time/calls/rework |
| Usability | Let someone who did not write it run and revise it independently; the inputs must cover **ordinary requirements, abnormal requirements, boundary cases and complex chains** (including out-of-scope requests that should be correctly refused) | Six review areas: comprehension / execution / quality / experience / stability / transfer; record the specific obstacles, hand them back to the author, and attach the re-test conclusion |

Swapping Skills with a peer is one recommended way to organise the four test types above — its purpose is to test stability, accuracy, quality and usability, and it is not a fifth item on top of those four. With no peer available, a stand-in runner with no memory of writing it is equally valid evidence, but the form and scope of the test must be stated honestly.

Evaluate information accuracy, file specification and visual quality separately, and do not use one passing item to prove that everything passes. **Whether the finished image itself is good (aesthetics, hierarchy, asset compositing) is rated with the 1–5 rubric in `references/quality-rubric.md`**, and a score needs a reason and a scorer; do not invent a score where none was given. This file is about "was this Skill tested correctly"; that one is about "is this image good". Both are needed.

Count lines separately for the main file, the reference documents, the template and the scripts; moving a file or compressing line breaks does not automatically mean lower cost. For quality, freeze a baseline version first, then compare before and after. A re-export does not count as running an independent task twice; a feedback re-check is not the same as a peer starting from scratch. Write "unknown" for metrics you cannot obtain; a report covers only what was tested and does not claim untested capabilities.

| Version/date | Input and test conditions | Symptom/evidence | Cause and change | Re-test result | Still to test |
| --- | --- | --- | --- | --- | --- |

After every change, re-test the original failing case first, then regress the key capabilities; record the old failure and the new result. Cases serve to find transferable problems; a product name, parameters, colours, number of selling points, language and aspect ratio must not be written into a general rule. The value of an added rule must be demonstrated by real output and a cost comparison.

## Conventions for iteration records (the four easiest to fill in wrongly)

**① Never fill "secondary errors" with 0 across the board.** A secondary error means "after fixing one thing, did you go back and check the other elements that fix did not directly affect". Where that regression check was not done, **write "not assessed" rather than 0**; a blanket 0 yields the false conclusion that "fixing never causes new problems" (in practice about a third of problems are knock-on effects of a fix). Consider splitting the column into "knock-on problems found and fixed" + "items with no regression check".

**② Scores and defect counts must not come only from the executor.** If the five-dimension scores, the defect count and the iteration count all come from the executing agent, treat them as **self-assessed** and mark them as such; add one independent review (a different executor, or the author re-scoring against the same rubric). Automate what can be automated:

| Metric | How to decide | Reference implementation |
| --- | --- | --- |
| Size / format | Read the image file header + pixel dimensions | `scripts/png-check.cjs` |
| Exceeding canvas / clipped text | Element rect vs canvas rect | `scripts/layout-audit.cjs` (reports overflow in pixels) |
| How much of the frame the product fills | Bounding box of the largest connected region in the product's signature colours | Requires a purpose-written script (usable only after baseline calibration) |
| Whether Chinese leaked into the English version | Scan the English copy / image recognition | By eye |
| Whether version numbers stay in sync across languages | Compare the delivered file names | Flagged by hand |
| Whether directions are bound to different skeletons | Inspect the proposal document | Compared by hand |

**③ Continuous metrics require a same-condition control run.** The same Skill and the same input can differ widely between two runs (measured on one frozen version: product render height 308–496px). Therefore:

- **A module that shows "no visible difference" may only be written as "no stable difference observed", never "this module is useless"**;
- Prefer discrete metrics such as "yes / no" and "count", and use "how much does it measure" style continuous metrics sparingly;
- **The comparison baseline must have the same conditions as the experimental group** (e.g. an added "same environment + full version" control run). If the comparison is a historical round run "with feedback and context", the conditions differ: it can serve only as a **baseline row**, not as an **experimental control**.

**④ Any conclusion that "a regulated carrier file was modified" must be verified at file level.** When an executor claims "I changed the template / script", compare that file's hash against the frozen version byte by byte, and establish whether the thing changed is the **regulated carrier file** or **the executor's own output** — the two are entirely different in nature, must not be conflated, and the claim must not be taken at face value.
