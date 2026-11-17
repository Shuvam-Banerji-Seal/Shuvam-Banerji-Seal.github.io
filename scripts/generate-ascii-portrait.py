#!/usr/bin/env python3
"""Build the homepage ASCII portrait from assets/img/sbs_001.webp.

The hero terminal (assets/js/hero-terminal.js) prints this file as the
"photo" in its neofetch-style readout. Steps: segment the subject with a
seeded random walker (scikit-image), clean the matte, equalise local
contrast, then map each character cell to a glyph by brightness, with
strong edges drawn as line glyphs so glasses, jaw and arms keep their shape.

    python3 scripts/generate-ascii-portrait.py            # writes assets/data/portrait-ascii.json
    python3 scripts/generate-ascii-portrait.py --preview out.png
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from skimage import segmentation, morphology, measure, color, transform, exposure, filters

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/img/sbs_001.webp"
OUT = ROOT / "assets/data/portrait-ascii.json"
RAMP = " .,:;+=*?%#@"        # dark to bright on a dark terminal
CELL_ASPECT = 0.54            # glyph width / line height in the terminal
CROP = (0.24, 0.17, 0.80, 0.64)  # x0, y0, x1, y1 as fractions of the photo


def matte(im):
    H, W = im.shape[:2]
    sm = transform.resize(im, (H // 4, W // 4), anti_aliasing=True)
    h, w = sm.shape[:2]
    lab = color.rgb2lab(sm)
    seeds = np.zeros((h, w), int)
    seeds[: int(h * 0.12), :] = 1
    seeds[int(h * 0.35):, : int(w * 0.10)] = 1
    seeds[int(h * 0.40):, int(w * 0.94):] = 1
    seeds[: int(h * 0.30), : int(w * 0.30)] = 1
    seeds[: int(h * 0.30), int(w * 0.75):] = 1

    def box(y0, y1, x0, x1, v=2):
        seeds[int(h * y0): int(h * y1), int(w * x0): int(w * x1)] = v

    box(0.22, 0.29, 0.46, 0.58)  # hair
    box(0.30, 0.42, 0.42, 0.55)  # face
    box(0.45, 0.95, 0.35, 0.65)  # torso
    box(0.62, 0.72, 0.25, 0.75)  # crossed arms
    labels = segmentation.random_walker(lab, seeds, beta=60, mode="cg_j", channel_axis=-1)
    m = labels == 2
    # sky that leaked in beside the neck: bright, upper half, away from the face
    L = lab[..., 0] / 100
    yy, xx = np.mgrid[0:h, 0:w]
    face = (yy > h * 0.2) & (yy < h * 0.43) & (xx > w * 0.36) & (xx < w * 0.64)
    m &= ~((L > 0.55) & (yy < h * 0.5) & ~face)
    m = morphology.binary_opening(m, morphology.disk(3))
    m = morphology.remove_small_holes(m, 400)
    lbl = measure.label(m)
    big = max(measure.regionprops(lbl), key=lambda p: p.area).label
    m = lbl == big
    m = filters.gaussian(m.astype(float), 1.0)
    return transform.resize(m, (H, W))


def build(cols):
    im = np.asarray(Image.open(SRC).convert("RGB")).astype(float) / 255
    H, W = im.shape[:2]
    a = matte(im)
    x0, y0, x1, y1 = (int(CROP[0] * W), int(CROP[1] * H), int(CROP[2] * W), int(CROP[3] * H))
    im, a = im[y0:y1, x0:x1], a[y0:y1, x0:x1]
    h, w = a.shape
    rows = int(round(cols * (h / w) * CELL_ASPECT))
    gray = color.rgb2gray(im)
    gray = exposure.equalize_adapthist(gray, clip_limit=0.03, kernel_size=max(8, w // 12))
    lo, hi = np.percentile(gray[a > 0.5], [8, 99.5])
    gray = np.clip((gray - lo) / (hi - lo), 0, 1) ** 1.0
    g = transform.resize(gray, (rows, cols), anti_aliasing=True)
    al = transform.resize(a, (rows, cols), anti_aliasing=True)
    # edges on a finer grid, then pooled per cell
    gx = filters.sobel_h(transform.resize(gray, (rows * 2, cols * 2), anti_aliasing=True))
    gy = filters.sobel_v(transform.resize(gray, (rows * 2, cols * 2), anti_aliasing=True))
    gx = gx.reshape(rows, 2, cols, 2).mean((1, 3)); gy = gy.reshape(rows, 2, cols, 2).mean((1, 3))
    mag = np.hypot(gx, gy)
    thr = np.quantile(mag[al > 0.5], 0.99)
    lines, levels = [], []
    for r in range(rows):
        s, lv = [], []
        for c in range(cols):
            if al[r, c] < 0.45:
                s.append(" "); lv.append("0")
                continue
            v = g[r, c] ** 0.9
            lv.append(str(min(3, int(v * 4))))
            if mag[r, c] > thr:
                ang = (np.degrees(np.arctan2(gy[r, c], gx[r, c])) + 180) % 180
                s.append("-" if ang < 22.5 or ang >= 157.5 else "\\" if ang < 67.5 else "|" if ang < 112.5 else "/")
                continue
            i = 1 + int(v * (len(RAMP) - 1.001))
            s.append(RAMP[min(i, len(RAMP) - 1)])
        lines.append("".join(s).rstrip())
        levels.append("".join(lv)[: len(lines[-1])])
    return {"cols": cols, "rows": rows, "lines": lines, "levels": levels}


def preview(art, path, fg=(207, 227, 218), bg=(11, 19, 17)):
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 12)
    cw, lh = 7.2, 7.2 / CELL_ASPECT
    img = Image.new("RGB", (int(art["cols"] * cw) + 20, int(art["rows"] * lh) + 20), bg)
    d = ImageDraw.Draw(img)
    alpha = [0.42, 0.62, 0.82, 1.0]
    for i, line in enumerate(art["lines"]):
        for j, ch in enumerate(line):
            a = alpha[int(art["levels"][i][j])]
            col = tuple(int(bg[k] + (fg[k] - bg[k]) * a) for k in range(3))
            d.text((10 + j * cw, 10 + i * lh), ch, font=font, fill=col)
    img.save(path)


if __name__ == "__main__":
    data = {"source": "assets/img/sbs_001.webp", "ramp": RAMP, "wide": build(96), "narrow": build(60)}
    if "--preview" in sys.argv:
        p = sys.argv[sys.argv.index("--preview") + 1]
        preview(data["wide"], p)
        preview(data["narrow"], p.replace(".png", "-narrow.png"))
    else:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(data, separators=(",", ":")))
        print("wrote", OUT, data["wide"]["rows"], "rows wide,", data["narrow"]["rows"], "rows narrow")
