# Background generation guidance

The generation tool is responsible for the background only; the product and logo are composited from the original assets, and the text is typeset in code.

Prompt structure: scene/mood + reserved areas for the product and the text + a viewpoint and lighting that match the product + brand colours + material + constraints. Write it for the chosen composition; text-left-image-right is not mandatory.

Example (a generic example — replace it for the current product and direction; it is not a fixed requirement): a simple lifestyle scene, with a place reserved on the right for the real product and flat, low-detail whitespace on the left for the copy; soft side light matching the original product photograph, a light matte surface, a restrained commercial-photography background. The image must not generate text, numbers, logos, watermarks, signatures, interfaces or the product itself.

Express these constraints with whatever prompt/negative parameters the tool supports; not every tool has to accept the same English string verbatim.

Generate one background proof first and overlay the real product and the copy to check it as a whole; when a revision is genuinely needed, state the specific problem. By default, no more than three generation attempts in total; beyond that, report the reason or use a code-built background, and continue only if the user explicitly asks and there is a new direction.

Check each image: no text/logo/watermark; no redrawn product; the text and product areas usable; light direction, viewpoint and colour temperature compatible; the composition still works after cropping and scaling. Decide watermark handling from the export and asset conditions actually available with your tool; do not uniformly crop a fixed proportion; with no usable background, change approach.

Record the actual prompt, tool, background file and the reason for re-generating; for multiple languages, share one background where possible and do not regenerate per language.
