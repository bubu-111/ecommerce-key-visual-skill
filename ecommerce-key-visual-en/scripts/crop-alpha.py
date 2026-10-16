#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Product cutout crop script (replicates the real-run C8 cutout logic)

Purpose
-------
Cutout product images often carry large transparent margins. Dropping them in
as-is shrinks the product inside the final key visual — a defect that should be
caught at the inventory stage. This script crops away the surrounding
transparent margins by the "content bounding box" and saves the result, printing
both pre/post sizes so they can be logged into the asset ledger (see SKILL.md
"Make & Export · cutout").

Decision rule (identical to real-run C8)
---------------------------------------
- Use the alpha channel: pixels with alpha > threshold count as "opaque subject".
- Default threshold 200 (replicates the v3.2 opaque_subject_bbox rule: alpha>200).
- Take the minimal bounding box of opaque pixels and crop to it.
- Also prints bbox at thresholds 128/200/250 so a human can judge edge over-cut.

Dependency
----------
Pillow. Install example (use your local python3):
  python3 -m pip install Pillow
If missing, the script errors explicitly — it never silently emits a wrong result.

Usage
-----
  python3 crop-alpha.py <input.png> <output.png> [threshold]
  python3 crop-alpha.py orig.png cropped.png          # default thr=200
  python3 crop-alpha.py orig.png cropped.png 250      # custom threshold

Notes
-----
- Input must be an RGBA image (typical for PNG); non-alpha raises an error.
- If the whole image is transparent (no opaque subject), it errors out, no empty file written.
- Output keeps RGBA so it can keep being used as a transparent product asset.
"""

import sys
import os

try:
    from PIL import Image
except ImportError:
    sys.stderr.write(
        "Missing Pillow. Install first:\n"
        "  python3 -m pip install Pillow\n"
    )
    sys.exit(2)


def bbox_of_opaque(im, thr):
    """Return the minimal bounding box (minx, miny, maxx, maxy) of pixels with alpha>thr, or None."""
    if im.mode != "RGBA":
        raise ValueError("Input image must have an alpha channel (RGBA); current mode is %s" % im.mode)
    w, h = im.size
    px = im.load()
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > thr:
                if x < minx:
                    minx = x
                if x > maxx:
                    maxx = x
                if y < miny:
                    miny = y
                if y > maxy:
                    maxy = y
    if maxx < 0:
        return None
    return (minx, miny, maxx, maxy)


def main(argv):
    if len(argv) < 3 or len(argv) > 4:
        sys.stderr.write("Usage: python3 crop-alpha.py <input.png> <output.png> [threshold]\n")
        return 1
    src = argv[1]
    dst = argv[2]
    thr = 200
    if len(argv) == 4:
        try:
            thr = int(argv[3])
        except ValueError:
            sys.stderr.write("Threshold must be an integer: %s\n" % argv[3])
            return 1
        if not (0 <= thr <= 255):
            sys.stderr.write("Threshold must be 0-255: %s\n" % argv[3])
            return 1

    if not os.path.isfile(src):
        sys.stderr.write("Input file not found: %s\n" % src)
        return 1

    im = Image.open(src).convert("RGBA")
    w, h = im.size

    for t in (128, 200, 250):
        b = bbox_of_opaque(im, t)
        if b is None:
            sys.stderr.write("thr=%d: fully transparent, no subject\n" % t)
        else:
            minx, miny, maxx, maxy = b
            sys.stderr.write(
                "thr=%d: bbox [%d,%d,%d,%d] size %dx%d\n"
                % (t, minx, miny, maxx, maxy, maxx - minx + 1, maxy - miny + 1)
            )

    b = bbox_of_opaque(im, thr)
    if b is None:
        sys.stderr.write("Error: no opaque subject found at threshold %d; nothing written.\n" % thr)
        return 1
    minx, miny, maxx, maxy = b
    crop = im.crop((minx, miny, maxx + 1, maxy + 1))
    crop.save(dst)
    sys.stderr.write(
        "Cropped (alpha>%d): %dx%d  bbox=[%d,%d,%d,%d]  out=%s\n"
        % (thr, crop.size[0], crop.size[1], minx, miny, maxx, maxy, dst)
    )
    sys.stdout.write(
        '{"src":"%s","dst":"%s","thr":%d,"bbox":[%d,%d,%d,%d],"size":[%d,%d],"orig":[%d,%d]}\n'
        % (src, dst, thr, minx, miny, maxx, maxy, crop.size[0], crop.size[1], w, h)
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
