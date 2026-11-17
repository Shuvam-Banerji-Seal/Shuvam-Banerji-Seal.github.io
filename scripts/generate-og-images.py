#!/usr/bin/env python3
"""Render a 1200x630 preview image for every blog article.

    python3 scripts/generate-og-images.py            # only articles without an image
    python3 scripts/generate-og-images.py --all      # redraw every image

Reads assets/data/blog-index.json (written by scripts/build-blog.mjs) and
writes assets/img/og/<slug>.png. build-blog.mjs uses these for og:image,
twitter:image and the BlogPosting image; run it again after this script.
Needs Python Playwright with Chromium and network access for Google Fonts.
"""
import asyncio
import html
import json
import sys
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/img/og"
FONTS = (
    "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600"
    "&family=Newsreader:opsz,wght@6..72,500..700&family=Martian+Mono:wght@400;500&display=swap"
)
MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()


def card(post):
    y, m, d = post["date"].split("-")
    date = f"{int(d)} {MONTHS[int(m) - 1]} {y}"
    tags = "".join(f"<span>{html.escape(t)}</span>" for t in post["tags"][:3])
    title = html.escape(post["title"])
    size = 74 if len(post["title"]) <= 48 else 62 if len(post["title"]) <= 72 else 54
    return f"""<!doctype html><html><head><meta charset="utf-8"><link href="{FONTS}" rel="stylesheet">
<style>
html,body{{margin:0;width:1200px;height:630px;background:#0b1311;color:#e7f0eb;overflow:hidden}}
.wrap{{position:absolute;inset:64px 72px 56px;display:flex;flex-direction:column}}
.top{{display:flex;align-items:center;gap:14px;font:600 22px/1 "Hanken Grotesk",sans-serif;color:#cfe0d8}}
.top svg{{width:34px;height:34px;fill:none;stroke:#e7f0eb;stroke-width:1.6;stroke-linejoin:round}}
.top svg circle{{stroke:#3ccfc4}}
.top em{{font-style:normal;color:#8ea69b;font-weight:500}}
h1{{margin:auto 0 0;font:620 {size}px/1.04 Newsreader,serif;letter-spacing:-0.018em;
   font-variation-settings:"opsz" 72;text-wrap:balance;max-width:1030px}}
p{{margin:22px 0 0;font:500 25px/1.4 "Hanken Grotesk",sans-serif;color:#b9cdc4;max-width:1000px;
   display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}}
.foot{{margin-top:34px;padding-top:20px;border-top:1px solid #2a3d38;display:flex;justify-content:space-between;
   align-items:center;font:400 17px/1 "Martian Mono",monospace;color:#8ea69b}}
.tags span{{display:inline-block;margin-left:10px;padding:7px 11px;border:1px solid #2a3d38;border-radius:4px;
   font:500 16px/1 "Hanken Grotesk",sans-serif;color:#cfe0d8}}
</style></head><body><div class="wrap">
<div class="top"><svg viewBox="0 0 24 24"><path d="M12 2.6 20.1 7.3v9.4L12 21.4 3.9 16.7V7.3Z"/><circle cx="12" cy="12" r="4.4"/></svg>
Shuvam Banerji Seal <em>· blog · {date}</em></div>
<h1>{title}</h1>
<p>{html.escape(post["description"])}</p>
<div class="foot"><span>shuvam-banerji-seal.github.io</span><span class="tags">{tags}</span></div>
</div></body></html>"""


async def main():
    posts = json.loads((ROOT / "assets/data/blog-index.json").read_text())
    redraw = "--all" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    todo = [p for p in posts if redraw or not (OUT / f"{p['slug']}.png").exists()]
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page(viewport={"width": 1200, "height": 630})
        for post in todo:
            await page.set_content(card(post), wait_until="networkidle")
            await page.evaluate("document.fonts.ready")
            await page.screenshot(path=str(OUT / f"{post['slug']}.png"))
            print("og image:", post["slug"])
        await browser.close()
    print(f"{len(todo)} drawn, {len(posts) - len(todo)} already present")


asyncio.run(main())
