#!/usr/bin/env node
/**
 * lint-design.js — checks HTML/CSS/JS files against plans/design-element.md.
 *
 *   node scripts/lint-design.js                 # whole site
 *   node scripts/lint-design.js pages/tools.html assets/css/main.css
 *   node scripts/lint-design.js --summary       # counts per file only
 *
 * Errors break the build of a page wave; warnings are for review.
 * Escape hatch: a line containing the comment  data  in a CSS comment
 * marker (slash-star data star-slash) is a functional gradient
 * (spectrum, colour map, meter) and is allowed.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const args = process.argv.slice(2);
const summaryOnly = args.includes("--summary");
let files = args.filter((a) => !a.startsWith("--"));

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "old_codes",
  ".rigor-trash",
  "EFAML_WEB",
  "assets_for_my_website",
  "books",
  ".git",
  ".playwright-mcp",
  "plans",
  "tests",
  ".commandcode",
  "public",
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if ([".html", ".css"].includes(extname(p))) out.push(p);
    else if (extname(p) === ".js" && p.includes("/assets/js/")) out.push(p);
  }
  return out;
}

if (files.length === 0) files = walk(ROOT);
else files = files.map((f) => (f.startsWith("/") ? f : join(process.cwd(), f)));

const DATA_OK = /\/\*\s*data\s*\*\//;

// Rules applied line by line to CSS (and to <style> + style="" in HTML,
// and to string literals in JS — we simply scan every line).
const lineRules = [
  {
    id: "gradient",
    level: "error",
    re: /\b(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(/i,
    msg: "decorative gradient (mark functional ones with /* data */)",
  },
  {
    id: "banned-font",
    level: "error",
    re: /(?:family=|font-family\s*:[^;]*|["'])(?:Inter|Space[ +]Grotesk|JetBrains[ +]Mono|Poppins|Montserrat|Source[ +]Code[ +]Pro)\b/,
    msg: "banned typeface (use Archivo / IBM Plex Mono)",
  },
  {
    id: "gradient-text",
    level: "error",
    re: /background-clip\s*:\s*text|-webkit-text-fill-color\s*:\s*transparent/i,
    msg: "gradient/clipped text",
  },
  {
    id: "glass",
    level: "error",
    re: /backdrop-filter\s*:(?!\s*none)/i,
    msg: "frosted glass (backdrop-filter)",
  },
  {
    id: "glow",
    level: "error",
    re: /(?:box-shadow|text-shadow)\s*:[^;]*\b0(?:px)?\s+0(?:px)?\s+(?:1[2-9]|[2-9]\d|\d{3,})px/i,
    msg: "glow/halo shadow (0 0 ≥12px)",
  },
  {
    id: "glow",
    level: "error",
    re: /drop-shadow\(\s*0(?:px)?\s+0(?:px)?\s+(?:1[2-9]|[2-9]\d|\d{3,})px/i,
    msg: "glow drop-shadow",
  },
  {
    id: "glow-var",
    level: "error",
    re: /--glow-[a-z-]+\s*:(?!\s*none)/i,
    msg: "glow variable defined",
  },
  {
    id: "cream",
    level: "error",
    re: /#(?:faf3e8|f2e6d0|ede0c8|fef5e7|fdf8f3|f5edd8|f4f1ea|f5f5dc|faf7f2|fdf6e3|fff8eb|fbf6ee|f5efe0|ede4cc)\b|rgba\(\s*255\s*,\s*248\s*,\s*235/i,
    msg: "beige/cream background colour",
  },
  {
    id: "serif-display",
    level: "error",
    re: /Playfair|DM\+?\s?Serif|Instrument\+?\s?Serif|Fraunces|Cormorant/i,
    msg: "decorative serif display face",
  },
  {
    id: "side-stripe",
    level: "warn",
    re: /border-left\s*:\s*(?:[2-9]|\d{2})px\s+solid\s+(?!var\(--rule)/i,
    msg: "coloured side stripe (only blockquotes, in --rule)",
  },
  {
    id: "pill",
    level: "warn",
    re: /border-radius\s*:\s*(?:999|9999|50)px/i,
    msg: "pill radius (only for round controls, never text labels)",
  },
  {
    id: "infinite",
    level: "warn",
    re: /animation[^;]*\binfinite\b/i,
    msg: "infinite animation (pulses/glows are banned; carets/spinners OK)",
  },
  {
    id: "caps-label",
    level: "warn",
    re: /text-transform\s*:\s*uppercase/i,
    msg: "all-caps text (labels should be sentence case)",
  },
];

const COPY_WORDS =
  /\b(supercharge[sd]?|unlock(?:s|ed)?|seamless(?:ly)?|elevate[sd]?|cutting[- ]edge|next[- ]gen(?:eration)?|blazing(?:ly)?|effortless(?:ly)?|revolutionary|introducing|game[- ]chang(?:er|ing)|all systems operational)\b/i;

function visibleTextLines(html) {
  // Blank out script/style/comments but keep line structure.
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, blank)
    .replace(/<style\b[\s\S]*?<\/style>/gi, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/<[^>]*>/g, (m) => {
      // keep alt/title/aria-label/placeholder text as visible copy
      const attrs = [...m.matchAll(/\b(?:alt|title|aria-label|placeholder)="([^"]*)"/g)]
        .map((a) => a[1])
        .join(" ");
      return " " + attrs + " " + m.replace(/[^\n]/g, "");
    })
    .split("\n");
}

const results = [];
let totalErr = 0;
let totalWarn = 0;

for (const file of files) {
  let src;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const rel = relative(ROOT, file);
  const ext = extname(file);
  const lines = src.split("\n");
  const hits = [];

  // element.css guards and theme.css token aliases are the system itself.
  const isSystem = /assets\/css\/(element|theme)\.css$/.test(rel);

  lines.forEach((line, i) => {
    if (DATA_OK.test(line) || (i > 0 && DATA_OK.test(lines[i - 1]))) return;
    for (const r of lineRules) {
      if (isSystem && (r.id === "glass" || r.id === "gradient-text")) continue;
      if (r.re.test(line)) hits.push({ line: i + 1, ...r, text: line.trim().slice(0, 110) });
    }
  });

  if (ext === ".html") {
    const vis = visibleTextLines(src);
    vis.forEach((line, i) => {
      const t = line.trim();
      if (!t) return;
      if (/—|&mdash;/.test(t))
        hits.push({ line: i + 1, id: "em-dash", level: "error", msg: "em dash in visible copy", text: t.slice(0, 110) });
      const w = t.match(COPY_WORDS);
      if (w)
        hits.push({ line: i + 1, id: "copy", level: "error", msg: `marketing copy: "${w[0]}"`, text: t.slice(0, 110) });
      if (/^\/\/\s*\S/.test(t) || /^\/\*.*\*\/$/.test(t))
        hits.push({ line: i + 1, id: "kicker", level: "error", msg: "code-comment kicker label in visible copy", text: t.slice(0, 110) });
      if (/^0[1-9]$/.test(t))
        hits.push({ line: i + 1, id: "index-label", level: "warn", msg: "01/02-style label (only for real sequences)", text: t });
    });
    // raw &mdash; entity inside JS-built strings is not checked here on purpose
  }

  if (ext === ".js") {
    lines.forEach((line, i) => {
      if (/—/.test(line) && /["'`][^"'`]*—[^"'`]*["'`]/.test(line) && !/^\s*(\/\/|\*)/.test(line))
        hits.push({ line: i + 1, id: "em-dash", level: "warn", msg: "em dash in a JS string (check if visible)", text: line.trim().slice(0, 110) });
    });
  }

  const e = hits.filter((h) => h.level === "error").length;
  const w = hits.length - e;
  totalErr += e;
  totalWarn += w;
  if (hits.length) results.push({ rel, hits, e, w });
}

results.sort((a, b) => b.e - a.e || b.w - a.w);
for (const r of results) {
  console.log(`\n${r.rel}  (${r.e} errors, ${r.w} warnings)`);
  if (summaryOnly) continue;
  for (const h of r.hits) {
    console.log(`  ${h.level === "error" ? "E" : "w"} ${String(h.line).padStart(5)}  ${h.id.padEnd(13)} ${h.msg}\n           ${h.text}`);
  }
}
console.log(`\nlint-design: ${files.length} files, ${totalErr} errors, ${totalWarn} warnings`);
process.exit(totalErr ? 1 : 0);
