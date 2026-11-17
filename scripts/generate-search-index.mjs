#!/usr/bin/env node
/**
 * Build public/search-index.json for the site search (assets/js/site-search.js).
 *
 * One document per HTML page (title, meta description, h1–h3 headings), plus
 * one per publication (assets/data/research.json) and per public repository
 * (assets/data/github-repos.json). The browser computes BM25 statistics from
 * this file, so it only has to carry text.
 *
 *   node scripts/generate-search-index.mjs
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public/search-index.json");

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;/g, "–")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const strip = (s) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

function kindOf(rel) {
  if (rel.startsWith("pages/blogs/")) return "Article";
  if (rel.startsWith("pages/apis/")) return "API list";
  if (
    rel.startsWith("pages/tools/") ||
    /pages\/(music|reader|mermaid-tool|thermodynamics|apis)\.html$/.test(rel)
  )
    return "Tool";
  return "Page";
}

const docs = [];
const files = [join(ROOT, "index.html"), ...walk(join(ROOT, "pages"))];
for (const file of files) {
  const html = readFileSync(file, "utf8");
  if (/http-equiv=["']refresh["']/i.test(html)) continue; // redirect stubs
  if (/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) continue;
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const title = strip((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ""])[1])
    .replace(/\s*[|·–-]\s*(Shuvam Banerji Seal|SBS Tools)\s*$/i, "")
    .trim();
  const desc = decode(
    (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || [, ""])[1],
  );
  const body = html.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "");
  const heads = [...body.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map((m) => strip(m[2]))
    .filter(Boolean);
  const uniq = [...new Set(heads)].slice(0, 40);
  docs.push({
    u: rel === "index.html" ? "/" : "/" + rel,
    t: rel === "index.html" ? "Shuvam Banerji Seal, home" : title || uniq[0] || rel,
    d: desc,
    h: uniq.join(" · "),
    k: kindOf(rel),
  });
}

const research = JSON.parse(readFileSync(join(ROOT, "assets/data/research.json"), "utf8"));
for (const p of research.publications) {
  const first = Object.values(p.links || {})[0];
  docs.push({
    u: first || "/pages/research.html#" + p.id,
    t: p.title,
    d: `${p.venue}. ${p.summary}`,
    h: p.authors.join(", "),
    k: "Paper",
  });
}

const reposFile = join(ROOT, "assets/data/github-repos.json");
if (existsSync(reposFile)) {
  for (const r of JSON.parse(readFileSync(reposFile, "utf8")).repos) {
    if (!r.description) continue; // undescribed repos make poor results
    docs.push({
      u: r.homepage && /^https?:/.test(r.homepage) ? r.homepage : r.url,
      t: r.name.replace(/[-_]+/g, " "),
      d: r.description,
      h: [r.language, ...(r.topics || [])].filter(Boolean).join(" · "),
      k: "Repository",
    });
  }
}

writeFileSync(OUT, JSON.stringify(docs));
console.log(`search index: ${docs.length} documents → ${relative(ROOT, OUT)}`);
