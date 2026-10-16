#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
商品抠底裁边脚本（复刻真实跑 C8 抠底逻辑）

用途
----
商品抠底图往往四周带大片透明边距。直接上图会把商品在成图里挤小，属于
体检阶段就该发现的缺陷。本脚本按「有内容的范围」裁掉四周透明边再输出，
并把裁前/裁后尺寸打印出来，方便记进素材台账（见 SKILL.md 制作与导出·抠底）。

判定口径（与真实跑 C8 一致）
---------------------------
- 以 alpha 通道为准，alpha > 阈值 的像素视为「不透明主体」。
- 默认阈值 200（复刻 v3.2 opaque_subject_bbox 口径：alpha>200）。
- 取不透明像素的最小外接矩形（bbox），裁出该区域保存。
- 同时打印 128/200/250 三档阈值下的 bbox，便于人工判断边缘是否过切。

依赖
----
Pillow。安装示例（用你本机的 python3 即可）：
  python3 -m pip install Pillow
未安装时脚本会明确报错，不会静默产出错误结果。

用法
----
  python3 crop-alpha.py <输入.png> <输出.png> [阈值]
  python3 crop-alpha.py 原图.png 裁后.png          # 默认 thr=200
  python3 crop-alpha.py 原图.png 裁后.png 250      # 指定阈值

说明
----
- 输入须为带 alpha 通道的图片（PNG 常见）；无 alpha 时报错退出。
- 若无任何不透明像素（整图透明），报错退出，不产出空图。
- 输出保留 RGBA，便于继续作为透明商品素材使用。
"""

import sys
import os

try:
    from PIL import Image
except ImportError:
    sys.stderr.write(
        "缺少 Pillow。请先安装：\n"
        "  python3 -m pip install Pillow\n"
    )
    sys.exit(2)


def bbox_of_opaque(im, thr):
    """返回 alpha>thr 像素的最小外接矩形 (minx, miny, maxx, maxy)，无则 None。"""
    if im.mode != "RGBA":
        raise ValueError("输入图片须带 alpha 通道（RGBA）；当前模式为 %s" % im.mode)
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
        sys.stderr.write("用法: python3 crop-alpha.py <输入.png> <输出.png> [阈值]\n")
        return 1
    src = argv[1]
    dst = argv[2]
    thr = 200
    if len(argv) == 4:
        try:
            thr = int(argv[3])
        except ValueError:
            sys.stderr.write("阈值须为整数：%s\n" % argv[3])
            return 1
        if not (0 <= thr <= 255):
            sys.stderr.write("阈值须介于 0–255：%s\n" % argv[3])
            return 1

    if not os.path.isfile(src):
        sys.stderr.write("输入文件不存在：%s\n" % src)
        return 1

    im = Image.open(src).convert("RGBA")
    w, h = im.size

    # 三档诊断（与真实跑 C8 一致：128/200/250），便于人工判断边缘过切
    for t in (128, 200, 250):
        b = bbox_of_opaque(im, t)
        if b is None:
            sys.stderr.write("thr=%d: 全图透明，无主体\n" % t)
        else:
            minx, miny, maxx, maxy = b
            sys.stderr.write(
                "thr=%d: bbox [%d,%d,%d,%d] size %dx%d\n"
                % (t, minx, miny, maxx, maxy, maxx - minx + 1, maxy - miny + 1)
            )

    b = bbox_of_opaque(im, thr)
    if b is None:
        sys.stderr.write("错误：在阈值 %d 下未找到任何不透明主体，未输出。\n" % thr)
        return 1
    minx, miny, maxx, maxy = b
    crop = im.crop((minx, miny, maxx + 1, maxy + 1))
    crop.save(dst)
    sys.stderr.write(
        "已裁出（alpha>%d）: %dx%d  bbox=[%d,%d,%d,%d] 输出=%s\n"
        % (thr, crop.size[0], crop.size[1], minx, miny, maxx, maxy, dst)
    )
    #  stdout 给机器调用方一个干净的 JSON 摘要
    sys.stdout.write(
        '{"src":"%s","dst":"%s","thr":%d,"bbox":[%d,%d,%d,%d],"size":[%d,%d],"orig":[%d,%d]}\n'
        % (src, dst, thr, minx, miny, maxx, maxy, crop.size[0], crop.size[1], w, h)
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
