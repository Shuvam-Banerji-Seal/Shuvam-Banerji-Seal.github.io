#!/usr/bin/env node
/**
 * generate-apis-pages.js
 *
 * Builds the Public APIs section from the public-apis/public-apis list:
 *   1. Fetches the raw README (master branch) — falls back to the last
 *      committed snapshot if the network is unavailable.
 *   2. Parses every `### Category` markdown table, keeping ONLY entries
 *      whose Auth column is `No` (no API key / no auth of any kind).
 *   3. Emits:
 *        public/apis.json            — full no-auth dataset (for search)
 *        pages/apis.html             — hub: search + category cards
 *        pages/apis/<slug>.html      — one static subpage per category
 *   4. Prints the vite.config.mjs rollup input entries to paste.
 *
 * Usage:
 *   node scripts/generate-apis-pages.js [--source <readme.md>] [--no-fetch]
 *
 * The generated pages are committed (like public/music-library.json) so
 * the site builds even when the upstream README is unreachable.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const README_URL =
  "https://raw.githubusercontent.com/public-apis/public-apis/master/README.md";
const SNAPSHOT = join(ROOT, "scripts", "fixtures", "public-apis-readme.md");
const OUT_JSON = join(ROOT, "public", "apis.json");
const OUT_DIR = join(ROOT, "pages", "apis");
const SITE = "https://shuvam-banerji-seal.github.io";

const args = process.argv.slice(2);
const noFetch = args.includes("--no-fetch");
const srcIdx = args.indexOf("--source");
const srcFile = srcIdx >= 0 ? args[srcIdx + 1] : null;

async function loadReadme() {
  if (srcFile) return readFileSync(srcFile, "utf8");
  if (!noFetch) {
    try {
      const res = await fetch(README_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text.length < 50000)
        throw new Error("suspiciously short README, refusing");
      mkdirSync(dirname(SNAPSHOT), { recursive: true });
      writeFileSync(SNAPSHOT, text);
      console.log(`fetched README (${text.length} chars), snapshot saved`);
      return text;
    } catch (e) {
      console.warn(`fetch failed (${e.message}), using snapshot`);
    }
  }
  if (!existsSync(SNAPSHOT))
    throw new Error("no snapshot and fetch disabled/failed");
  console.log("using committed snapshot");
  return readFileSync(SNAPSHOT, "utf8");
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanMd(s) {
  return String(s)
    .replace(/`/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*?([^*]*)\*\*?/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseReadme(text) {
  const sections = text.split(/\n### /).slice(1);
  const categories = [];
  const usedSlugs = new Set();
  for (const sec of sections) {
    const name = sec.split("\n", 1)[0].trim();
    if (!name || /^(APIs Covered|Index)/i.test(name)) continue;
    const apis = [];
    for (const line of sec.split("\n")) {
      const t = line.trim();
      if (!t.startsWith("| [")) continue;
      const cells = t
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim());
      if (cells.length < 5) continue;
      const m = cells[0].match(/\[([^\]]*)\]\(([^)]*)\)/);
      if (!m) continue;
      const auth = cells[2].replace(/`/g, "").trim().toLowerCase();
      if (auth !== "no") continue; // ← no-auth only
      const url = m[2].trim();
      if (!/^https?:\/\//i.test(url)) continue;
      apis.push({
        name: cleanMd(m[1]),
        url,
        desc: cleanMd(cells[1]),
        https: /^yes$/i.test(cells[3].trim()) ? "Yes" : "No",
        cors: /^yes$/i.test(cells[4].trim())
          ? "Yes"
          : /^no$/i.test(cells[4].trim())
            ? "No"
            : "Unknown",
      });
    }
    if (apis.length === 0) continue;
    // de-duplicate identical names within a category
    const seen = new Set();
    const uniq = apis.filter((a) => {
      const k = a.name.toLowerCase() + "|" + a.url;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    let slug = slugify(name) || "misc";
    let n = 2;
    while (usedSlugs.has(slug)) slug = `${slugify(name)}-${n++}`;
    usedSlugs.add(slug);
    categories.push({ name, slug, apis: uniq });
  }
  categories.sort((a, b) => a.name.localeCompare(b.name));
  return categories;
}

const HEAD = (o) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="google-site-verification"
      content="YrLWgqBYsHm8f4f6UHH8RrbiXvd9PJwR1lb4BmgjC9g"
    />
    <script>
      (function () {
        var DARK_THEMES=["dark","dark-coffee","amber","tokyo-night","absolute-dark","forest","dracula"];var t=localStorage.getItem("theme")||DARK_THEMES[Math.floor(Math.random()*DARK_THEMES.length)];
        document.documentElement.setAttribute("data-theme", t);
        document.documentElement.style.colorScheme = t;
      })();
    </script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${esc(o.desc)}" />
    <link rel="canonical" href="${SITE}${o.path}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(o.title)}" />
    <meta property="og:description" content="${esc(o.desc)}" />
    <meta property="og:url" content="${SITE}${o.path}" />
    <meta property="og:image" content="${SITE}/assets/img/og-image.svg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${SITE}/assets/img/og-image.svg" />
    <meta name="twitter:title" content="${esc(o.title)}" />
    <meta name="twitter:description" content="${esc(o.desc)}" />
    <meta name="robots" content="index, follow" />
    <title>${esc(o.title)}</title>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
    <script defer src="https://cdn.jsdelivr.net/npm/lucide@1.33.0/dist/umd/lucide.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Source+Code+Pro:wght@400;600&family=Space+Grotesk:wght@500;600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="${o.css}/mobile-fixes.css" />
    <link rel="stylesheet" href="${o.css}/theme.css" />
    <link rel="stylesheet" href="${o.css}/main.css" />
    <link rel="stylesheet" href="${o.css}/animations.css" />
    <link rel="stylesheet" href="${o.css}/mobile.css" />
    <link rel="stylesheet" href="${o.css}/chemistry-theme.css" />
    <!-- Overrides - Must be last -->
    <link rel="stylesheet" href="${o.css}/overrides.css" />
    <style>
      .apis-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1rem;
      }
      .apis-hero h1 {
        font-size: clamp(1.8rem, 4vw, 2.6rem);
      }
      .api-search {
        width: 100%;
        max-width: 560px;
        margin: 1.25rem auto 0;
        display: block;
        padding: 0.7rem 1rem;
        border-radius: 10px;
        border: 1px solid var(--border-color);
        background: var(--card-bg);
        color: var(--text-primary);
        font-size: 1rem;
      }
      .api-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.25rem;
        margin-top: 2rem;
      }
      .api-card {
        padding: 1.25rem;
        border-radius: 12px;
        background: var(--card-bg);
        border: 2px solid var(--border-color);
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }
      .api-card:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-card);
      }
      .api-card h3 {
        font-size: 1.05rem;
        margin: 0;
      }
      .api-card h3 a {
        color: var(--text-primary);
        text-decoration: none;
      }
      .api-card h3 a:hover {
        color: var(--accent-cyan);
        text-decoration: underline;
      }
      .api-card p {
        color: var(--text-secondary);
        font-size: 0.92rem;
        flex: 1;
      }
      .api-badges {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .api-badge {
        font-family: var(--font-mono);
        font-size: 0.68rem;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
      }
      .api-badge.ok {
        border-color: var(--accent-green);
        color: var(--accent-green);
      }
      .api-badge.no {
        opacity: 0.65;
      }
      .cat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1rem;
        margin-top: 2rem;
      }
      .cat-card {
        padding: 1.1rem 1.25rem;
        border-radius: 12px;
        background: var(--card-bg);
        border: 2px solid var(--border-color);
        color: var(--text-primary);
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }
      .cat-card:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-card);
        color: var(--text-primary);
      }
      .cat-card .count {
        margin-left: auto;
        font-family: var(--font-mono);
        font-size: 0.8rem;
        color: var(--text-secondary);
        background: var(--bg-elevated);
        border-radius: 999px;
        padding: 0.1rem 0.6rem;
        white-space: nowrap;
      }
      .crumb {
        font-family: var(--font-mono);
        font-size: 0.82rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }
      .crumb a {
        color: var(--accent-cyan);
        text-decoration: none;
      }
      .attr-note {
        margin-top: 2.5rem;
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    </style>
  </head>

  <body>
    <div id="navbar-container"></div>
    <script type="module" src="${o.js}/navbar.js"></script>

    <div id="mobile-menu-backdrop"></div>

    <main class="container">
`;

const FOOT = (js) => `    </main>

    <footer>
      <div class="footer-social">
        <a
          href="https://github.com/Shuvam-Banerji-Seal"
          target="_blank"
          class="social-link"
          aria-label="GitHub"
        >
          <i data-lucide="code-2" class="social-icon"></i>
        </a>
        <a
          href="https://linkedin.com/in/mastersbs"
          target="_blank"
          class="social-link"
          aria-label="LinkedIn"
        >
          <i data-lucide="briefcase" class="social-icon"></i>
        </a>
        <a
          href="https://orcid.org/0009-0000-0714-569X"
          target="_blank"
          class="social-link"
          aria-label="ORCID"
        >
          <i data-lucide="award" class="social-icon"></i>
        </a>
        <a
          href="mailto:sbs22ms076@iiserkol.ac.in"
          class="social-link"
          aria-label="Email"
        >
          <i data-lucide="mail" class="social-icon"></i>
        </a>
      </div>
      <p>
        &copy; <span id="year"></span> Shuvam Banerji Seal &middot; Built with
        Chemistry &amp; Code
      </p>
      <p style="margin-top: 0.5rem; font-size: 0.75rem">
        IISER Kolkata &middot; Computational Chemistry Lab &middot; SBS
        Portfolio v3.0
      </p>
    </footer>

    <script>
      document.getElementById("year").textContent = new Date().getFullYear();
      if (typeof lucide !== "undefined") lucide.createIcons();
    </script>

    <script type="module" src="${js}/main.js"></script>
    <script type="module" src="${js}/enhanced.js"></script>
  </body>
</html>
`;

/* ════════════════ page builders ════════════════ */

function apiCard(a) {
  const httpsBadge =
    a.https === "Yes"
      ? `<span class="api-badge ok">HTTPS</span>`
      : `<span class="api-badge no">HTTP</span>`;
  const corsBadge =
    a.cors === "Yes"
      ? `<span class="api-badge ok">CORS</span>`
      : a.cors === "No"
        ? `<span class="api-badge no">No CORS</span>`
        : `<span class="api-badge">CORS ?</span>`;
  return `          <article class="api-card">
            <h3>
              <a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.name)}</a>
            </h3>
            <p>${esc(a.desc)}</p>
            <div class="api-badges">
              <span class="api-badge ok">No auth</span>
              ${httpsBadge}
              ${corsBadge}
              <a class="api-badge" href="${esc(a.url)}" target="_blank" rel="noopener" style="text-decoration:none">Visit ↗</a>
            </div>
          </article>`;
}

function hubPage(categories, total) {
  const cards = categories
    .map(
      (c) => `        <a class="cat-card" href="apis/${c.slug}.html">
          <i data-lucide="layers"></i>
          <span>${esc(c.name)}</span>
          <span class="count">${c.apis.length} free</span>
        </a>`,
    )
    .join("\n");
  const index = categories
    .map((c) => ({ slug: c.slug, name: c.name, count: c.apis.length }))
    .map((c) => ({ ...c, q: (c.name + " apis").toLowerCase() }));
  return (
    HEAD({
      title: "Public APIs — No Key Needed - Shuvam Banerji Seal",
      desc: `Browse ${total} free public APIs that need no API key, across ${categories.length} categories. Curated from the public-apis directory.`,
      path: "/pages/apis.html",
      css: "../assets/css",
      js: "../assets/js",
    }) +
    `    <div class="apis-container">
      <header class="apis-hero text-center animate-fade-in-up">
        <h1 class="page-title">
          <i data-lucide="globe" class="inline-block"></i>
          Public APIs — No Key Needed
        </h1>
        <p class="page-subtitle">
          ${total} free APIs across ${categories.length} categories that work
          with <strong>no signup and no API key</strong> — curated from the
          <a href="https://github.com/public-apis/public-apis" target="_blank" rel="noopener">public-apis</a>
          directory. Perfect for prototypes, hackathons and learning.
        </p>
        <input
          type="search"
          id="api-search"
          class="api-search"
          placeholder="Search all ${total} APIs… (e.g. weather, cats, NASA)"
          aria-label="Search APIs"
        />
      </header>
      <div id="search-results" class="api-grid" hidden></div>
      <div id="cat-grid" class="cat-grid">
${cards}
      </div>
      <p class="attr-note">
        Dataset: <a href="https://github.com/public-apis/public-apis" target="_blank" rel="noopener">public-apis/public-apis</a>
        (MIT). "No auth" entries only — anything needing a key, OAuth or signup is excluded.
        Statuses (HTTPS/CORS) are as listed upstream and may drift; the linked docs are authoritative.
      </p>
    </div>
    <script>
      (function () {
        const input = document.getElementById("api-search");
        const results = document.getElementById("search-results");
        const grid = document.getElementById("cat-grid");
        let data = null;
        async function load() {
          try {
            const r = await fetch("../apis.json");
            const j = await r.json();
            data = j.categories;
          } catch (e) {
            return;
          }
        }
        function escHtml(s) {
          return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        input.addEventListener("input", () => {
          const q = input.value.trim().toLowerCase();
          if (!q || !data) {
            results.hidden = true;
            results.innerHTML = "";
            grid.style.display = "";
            return;
          }
          const hits = [];
          for (const c of data) {
            for (const a of c.apis) {
              if (
                a.name.toLowerCase().includes(q) ||
                a.desc.toLowerCase().includes(q) ||
                c.name.toLowerCase().includes(q)
              ) {
                hits.push({ c, a });
                if (hits.length >= 60) break;
              }
            }
            if (hits.length >= 60) break;
          }
          grid.style.display = "none";
          results.hidden = false;
          results.innerHTML =
            hits.length === 0
              ? '<p style="color:var(--text-secondary)">No matches. Try another keyword.</p>'
              : hits
                  .map(
                    (h) =>
                      '<article class="api-card"><h3><a href="' +
                      h.a.url +
                      '" target="_blank" rel="noopener">' +
                      escHtml(h.a.name) +
                      '</a></h3><p>' +
                      escHtml(h.a.desc) +
                      '</p><div class="api-badges"><span class="api-badge">' +
                      escHtml(h.c.name) +
                      '</span><span class="api-badge ok">No auth</span></div></article>',
                  )
                  .join("");
          if (typeof lucide !== "undefined") lucide.createIcons();
        });
        load();
      })();
    </script>
` +
    FOOT("../assets/js")
  );
}

function categoryPage(cat, prev, next) {
  const cards = cat.apis.map(apiCard).join("\n");
  const nav =
    `      <nav class="crumb" aria-label="Breadcrumb">
        <a href="../apis.html">Public APIs</a> / ${esc(cat.name)}
        <span style="float:right">${
          prev
            ? `<a href="${prev.slug}.html">← ${esc(prev.name)}</a>`
            : ""
        }${
          prev && next ? " · " : ""
        }${
          next
            ? `<a href="${next.slug}.html">${esc(next.name)} →</a>`
            : ""
        }</span>
      </nav>`;
  return (
    HEAD({
      title: `${cat.name} APIs (No Key Needed) - Shuvam Banerji Seal`,
      desc: `${cat.apis.length} free ${cat.name} APIs that need no API key: ` +
        cat.apis
          .slice(0, 5)
          .map((a) => a.name)
          .join(", ") +
        (cat.apis.length > 5 ? ", and more." : "."),
      path: `/pages/apis/${cat.slug}.html`,
      css: "../../assets/css",
      js: "../../assets/js",
    }) +
    `    <div class="apis-container">
${nav}
      <header class="apis-hero">
        <h1 class="page-title">
          <i data-lucide="layers" class="inline-block"></i>
          ${esc(cat.name)} APIs
        </h1>
        <p class="page-subtitle">
          ${cat.apis.length} free APIs with <strong>no signup and no API
          key</strong>. Data from
          <a href="https://github.com/public-apis/public-apis" target="_blank" rel="noopener">public-apis</a>
          (MIT).
        </p>
      </header>
      <div class="api-grid">
${cards}
      </div>
      <p class="attr-note">
        <a href="../apis.html">← All categories</a> · HTTPS/CORS badges are
        as listed upstream and may drift — the linked docs are authoritative.
      </p>
    </div>
` +
    FOOT("../../assets/js")
  );
}

/* ════════════════ main ════════════════ */

const readme = await loadReadme();
const categories = parseReadme(readme);
const total = categories.reduce((s, c) => s + c.apis.length, 0);
console.log(
  `parsed ${categories.length} categories, ${total} no-auth APIs`,
);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  OUT_JSON,
  JSON.stringify(
    {
      updated: new Date().toISOString().slice(0, 10),
      source: "https://github.com/public-apis/public-apis (master)",
      filter: "auth == No (no API key, no OAuth, no signup)",
      total,
      categories: categories.map((c) => ({
        name: c.name,
        slug: c.slug,
        count: c.apis.length,
        apis: c.apis,
      })),
    },
    null,
    1,
  ),
);
console.log(`wrote ${OUT_JSON}`);

writeFileSync(join(ROOT, "pages", "apis.html"), hubPage(categories, total));
console.log("wrote pages/apis.html");

categories.forEach((cat, i) => {
  const prev = i > 0 ? categories[i - 1] : null;
  const next = i < categories.length - 1 ? categories[i + 1] : null;
  writeFileSync(join(OUT_DIR, `${cat.slug}.html`), categoryPage(cat, prev, next));
});
console.log(`wrote ${categories.length} category pages`);

console.log("\n── vite.config.mjs input entries (paste into rollupOptions.input) ──");
console.log(`        "apis": resolve(__dirname, "pages/apis.html"),`);
for (const c of categories) {
  console.log(
    `        "apis-${c.slug}": resolve(__dirname, "pages/apis/${c.slug}.html"),`,
  );
}
