# Confirming the specification

Do not treat an out-of-date or unsourced recommended value as a hard platform requirement.

1. Extract the user's explicit width, height, aspect ratio, placement, format, byte-size cap, safe area and text limits; ask when the size and the aspect ratio conflict.
2. When a placement is specified but the full specification is not, consult an accessible official source and record the link, the date checked, and the placement/category it applies to; distinguish minimum, recommended and maximum.
3. When it cannot be verified, mark it "platform requirement to be verified", produce a design draft, and do not claim it is guaranteed to upload. A user-specified specification does not mean platform fit has been verified either.
4. With no specification at all, use the project default of 800×800 PNG, with a safe area of **5% of the short side** (1080×1350 → 54px on all four sides), which may be adjusted to the actual requirement. With only an aspect ratio and nothing else to go on, you may take the short side as 800px, derive whole-number dimensions, and state this.

The specification record: purpose/placement, width×height, format, byte-size cap (may be left blank if unknown), safe area on four sides, other limits, basis/link, date checked, open items.

Confirm product hero image, feed ad, note cover and live-stream cover separately; do not apply one table just because of a platform name. After a change of aspect ratio or platform, re-lay-out, re-check the content limits and re-export — do not simply stretch the old image.
