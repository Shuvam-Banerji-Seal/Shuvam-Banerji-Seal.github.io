"""Add FOUC-prevention early theme script to all pages/*.html files."""
import os, re

ROOT = "/home/shuvam/codes/Shuvam-Banerji-Seal.github.io"

EARLY_THEME = """<script>(function(){var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;})()</script>"""

def inject_fouc_script(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Skip if already has early theme script
    if "localStorage.getItem('theme')" in content and "<script>(function" in content:
        print(f"SKIP (already has FOUC script): {filepath}")
        return
    
    # Insert after <meta charset="UTF-8"> or after <head>
    pattern = r'(<meta charset=["\']UTF-8["\'][^>]*>)'
    m = re.search(pattern, content, re.IGNORECASE)
    if m:
        content = content[:m.end()] + "\n    " + EARLY_THEME + content[m.end():]
        print(f"INJECTED FOUC script: {filepath}")
    else:
        print(f"WARNING: no charset meta found in {filepath}")
        return
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

# Process pages/ 
for fname in os.listdir(os.path.join(ROOT, "pages")):
    if fname.endswith(".html"):
        inject_fouc_script(os.path.join(ROOT, "pages", fname))

# Process pages/tools/
tools_dir = os.path.join(ROOT, "pages", "tools")
if os.path.isdir(tools_dir):
    for fname in os.listdir(tools_dir):
        if fname.endswith(".html"):
            inject_fouc_script(os.path.join(tools_dir, fname))

print("DONE")
