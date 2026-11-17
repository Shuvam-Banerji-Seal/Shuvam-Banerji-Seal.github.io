#!/usr/bin/env node
/**
 * Write public/sitemap.xml from the HTML pages on disk.
 * lastmod is the page's last commit date (or today for uncommitted edits);
 * redirect stubs and noindex pages are left out.
 *
 *   node scripts/generate-sitemap.mjs
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://shuvam-banerji-seal.github.io";
const today = new Date().toISOString().slice(0, 10);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

function lastmod(file) {
  try {
    const dirty = execFileSync("git", ["status", "--porcelain", "--", file], { cwd: ROOT, encoding: "utf8" }).trim();
    if (dirty) return today;
    const d = execFileSync("git", ["log", "-1", "--format=%cs", "--", file], { cwd: ROOT, encoding: "utf8" }).trim();
    return d || today;
  } catch {
    return statSync(file).mtime.toISOString().slice(0, 10);
  }
}

function rank(rel) {
  if (rel === "index.html") return ["1.0", "weekly"];
  if (/^pages\/(research|projects|resume)\.html$/.test(rel)) return ["0.9", "monthly"];
  if (/^pages\/(blog|tools|github-projects)\.html$/.test(rel)) return ["0.8", "weekly"];
  if (rel.startsWith("pages/blogs/")) return ["0.7", "monthly"];
  if (rel.startsWith("pages/tools/")) return ["0.6", "monthly"];
  if (rel.startsWith("pages/apis/")) return ["0.3", "yearly"];
  return ["0.5", "monthly"];
}

const urls = [];
for (const file of [join(ROOT, "index.html"), ...walk(join(ROOT, "pages"))]) {
  const html = readFileSync(file, "utf8");
  if (/http-equiv=["']refresh["']/i.test(html)) continue;
  if (/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) continue;
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const [priority, freq] = rank(rel);
  const loc = rel === "index.html" ? `${SITE}/` : `${SITE}/${rel}`;
  urls.push(`  <url><loc>${loc}</loc><lastmod>${lastmod(file)}</lastmod><changefreq>${freq}</changefreq><priority>${priority}</priority></url>`);
}
urls.sort((a, b) => Number(b.match(/<priority>([\d.]+)/)[1]) - Number(a.match(/<priority>([\d.]+)/)[1]) || a.localeCompare(b));
writeFileSync(
  join(ROOT, "public/sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
);
console.log(`sitemap: ${urls.length} URLs → public/sitemap.xml`);
