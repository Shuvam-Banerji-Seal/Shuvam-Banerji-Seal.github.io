"""Inject theme.css link into all HTML pages (before main.css)."""
import os, re

ROOT = "/home/shuvam/codes/Shuvam-Banerji-Seal.github.io"

pages_depth = {
    "pages":       "../assets/css/theme.css",
    "pages/tools": "../../assets/css/theme.css",
    "pages/blogs": "../../assets/css/theme.css",
}

def inject_theme_css(filepath, css_href):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    link_tag = f'<link rel="stylesheet" href="{css_href}">'
    if css_href in content:
        print(f"SKIP (already has): {filepath}")
        return
    pattern = r'(<link[^>]+main\.css[^>]*>)'
    m = re.search(pattern, content)
    if m:
        content = content[:m.start()] + link_tag + "\n    " + content[m.start():]
        print(f"INJECTED (before main.css): {filepath}")
    else:
        pattern2 = r'(<link[^>]+rel=["\']stylesheet["\'][^>]*>)'
        m2 = re.search(pattern2, content)
        if m2:
            content = content[:m2.start()] + link_tag + "\n    " + content[m2.start():]
            print(f"INJECTED (before first CSS): {filepath}")
        else:
            print(f"WARNING: no CSS link found in {filepath}")
            return
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

for fname in os.listdir(os.path.join(ROOT, "pages")):
    if fname.endswith(".html"):
        inject_theme_css(os.path.join(ROOT, "pages", fname), pages_depth["pages"])

tools_dir = os.path.join(ROOT, "pages", "tools")
if os.path.isdir(tools_dir):
    for fname in os.listdir(tools_dir):
        if fname.endswith(".html"):
            inject_theme_css(os.path.join(tools_dir, fname), pages_depth["pages/tools"])

blogs_dir = os.path.join(ROOT, "pages", "blogs")
if os.path.isdir(blogs_dir):
    for fname in os.listdir(blogs_dir):
        if fname.endswith(".html"):
            inject_theme_css(os.path.join(blogs_dir, fname), pages_depth["pages/blogs"])

print("DONE")
