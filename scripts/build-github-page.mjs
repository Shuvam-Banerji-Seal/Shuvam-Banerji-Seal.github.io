#!/usr/bin/env node
/**
 * Render the repository list of pages/github-projects.html as static HTML, so
 * crawlers see every repository without running JavaScript.
 *
 *   node scripts/build-github-page.mjs
 *
 * Reads assets/data/github-repos.json (scripts/generate-github-data.mjs) and
 * rewrites the regions between `<!-- NAME:start -->` and `<!-- NAME:end -->`:
 *
 *   repos         the <ul class="rows"> with one <li> per repository
 *   repo-langs    the <option> list of the language filter
 *   repo-count    the repository count in the intro
 *   repo-status   the initial text of the result count
 *   repo-ld       the JSON-LD block (CollectionPage, ItemList, breadcrumbs)
 *
 * Output depends only on the data file, so running it twice changes nothing.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "assets/data/github-repos.json");
const PAGE = join(ROOT, "pages/github-projects.html");
const SITE = "https://shuvam-banerji-seal.github.io";
const PAGE_URL = `${SITE}/pages/github-projects.html`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * GitHub descriptions come with emoji, em dashes and the odd marketing adverb;
 * site copy has none of them (scripts/lint-design.js).
 */
const EM = String.fromCharCode(0x2014);
const INVISIBLE = new RegExp("[" + String.fromCharCode(0x200d, 0xfe0f) + "]", "g");
const EM_AFTER_STOP = new RegExp("([?.!:])\\s+" + EM + "\\s+", "g");
const EM_ANY = new RegExp("\\s*" + EM + "\\s*", "g");
const MARKETING = /\b(?:seamless(?:ly)?|effortless(?:ly)?|blazing(?:ly)?|cutting[- ]edge|revolutionary)\s+/gi;

function cleanDescription(s) {
  return String(s || "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(INVISIBLE, "")
    .replace(MARKETING, "")
    .replace(EM_AFTER_STOP, "$1 ")
    .replace(EM_ANY, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function monthYear(iso) {
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

const byName = (a, b) => a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" });
const byUpdated = (a, b) => b.pushed.localeCompare(a.pushed) || byName(a, b);

function renderRow(r) {
  const desc = cleanDescription(r.description);
  const meta = [];
  if (r.language) meta.push(`<span class="repo-lang">${esc(r.language)}</span>`);
  const n = r.stars || 0;
  meta.push(`<span class="stars" role="img" aria-label="${n} ${n === 1 ? "star" : "stars"}">\u2605 ${n}</span>`);
  meta.push(`updated <time datetime="${esc(r.pushed)}">${monthYear(r.pushed)}</time>`);
  if (r.archived) meta.push(`<span class="repo-note">Archived</span>`);

  const live = r.homepage && /^https?:\/\//i.test(r.homepage)
    ? `\n          <a class="repo-live" href="${esc(r.homepage)}" aria-label="Live site for ${esc(r.name)}">Live site</a>`
    : "";
  const tags = (r.topics || []).length
    ? `\n        <ul class="repo-tags" aria-label="Topics">${r.topics.map((t) => `<li class="tag">${esc(t)}</li>`).join("")}</ul>`
    : "";

  return `      <li data-lang="${esc(r.language || "none")}" data-stars="${n}" data-pushed="${esc(r.pushed)}">
        <div class="repo-head">
          <h2 class="repo-name"><a href="${esc(r.url)}">${esc(r.name)}</a></h2>${live}
        </div>
        <p class="repo-desc${desc ? "" : " is-empty"}">${desc ? esc(desc) : "No description yet."}</p>
        <p class="mono-meta">${meta.join(" \u00b7 ")}</p>${tags}
      </li>`;
}

function renderLanguages(repos) {
  const counts = new Map();
  for (const r of repos) {
    const k = r.language || "none";
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const named = [...counts].filter(([k]) => k !== "none").sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const opts = named.map(([k, c]) => `<option value="${esc(k)}">${esc(k)} (${c})</option>`);
  if (counts.has("none")) opts.push(`<option value="none">No language (${counts.get("none")})</option>`);
  return opts.map((o) => `            ${o}`).join("\n");
}

function renderJsonLd(repos) {
  const items = repos
    .filter((r) => cleanDescription(r.description))
    .map((r, i) => {
      const code = { "@type": "SoftwareSourceCode", name: r.name, url: r.url, codeRepository: r.url };
      if (r.language) code.programmingLanguage = r.language;
      code.description = cleanDescription(r.description);
      return { "@type": "ListItem", position: i + 1, item: code };
    });
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${PAGE_URL}#collection`,
        url: PAGE_URL,
        name: "GitHub repositories",
        description: `Public repositories by Shuvam Banerji Seal, searchable by name, language and topic.`,
        author: { "@id": `${SITE}/#person` },
        mainEntity: { "@type": "ItemList", numberOfItems: items.length, itemListElement: items },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE}/pages/projects.html` },
          { "@type": "ListItem", position: 3, name: "GitHub repositories", item: PAGE_URL },
        ],
      },
    ],
  };
  // "<" must not appear raw inside a script element.
  const json = JSON.stringify(graph, null, 1).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

function replaceRegion(html, name, content) {
  const open = `<!-- ${name}:start -->`;
  const close = `<!-- ${name}:end -->`;
  const a = html.indexOf(open);
  const b = html.indexOf(close);
  if (a < 0 || b < a) throw new Error(`markers for "${name}" not found in ${PAGE}`);
  return html.slice(0, a + open.length) + content + html.slice(b);
}

const data = JSON.parse(readFileSync(DATA, "utf8"));
const repos = [...data.repos].sort(byUpdated);

const list = `\n      <ul class="rows" id="repo-list" data-generated="${esc(data.generated || "")}">\n${repos.map((r) => renderRow(r).replace(/^/gm, "  ")).join("\n")}\n      </ul>\n      `;

let html = readFileSync(PAGE, "utf8");
const before = html;
html = replaceRegion(html, "repos", list);
html = replaceRegion(html, "repo-langs", `\n${renderLanguages(repos)}\n            `);
html = replaceRegion(html, "repo-count", String(repos.length));
html = replaceRegion(html, "repo-status", `${repos.length} repositories`);
html = replaceRegion(html, "repo-ld", renderJsonLd(repos));

if (html !== before) writeFileSync(PAGE, html);
console.log(`github page: ${repos.length} repositories -> pages/github-projects.html${html === before ? " (unchanged)" : ""}`);
