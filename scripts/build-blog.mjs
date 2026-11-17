#!/usr/bin/env node
/**
 * Static blog build. Every article is a real HTML page, so search engines
 * index it and readers without JavaScript can read it.
 *
 *   node scripts/build-blog.mjs
 *
 * Reads   content/blog/*.md       articles (front matter + GitHub Markdown,
 *                                  $…$ and $$…$$ maths rendered by KaTeX here)
 *         public/posts/*.md       earlier posts (welcome.md is skipped)
 * Writes  pages/blogs/<slug>.html one page per article
 *         pages/blog.html         the blog index
 *         index.html              the homepage "Writing" list (between markers)
 *         public/feed.xml         RSS 2.0
 *         assets/data/blog-index.json
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { Marked, Renderer } from "marked";
import katex from "katex";

const require = createRequire(import.meta.url);
const KATEX_VER = require("katex/package.json").version;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://shuvam-banerji-seal.github.io";
const AUTHOR = "Shuvam Banerji Seal";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const fmtDate = (d) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// ------------------------------------------------------------ front matter
function parse(src, file) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      v = v.slice(1, -1).split(",").map((t) => t.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else {
      v = v.replace(/^["']|["']$/g, "");
    }
    meta[key] = v;
  }
  return { meta, body: src.slice(m[0].length) };
}

// ------------------------------------------------------------ markdown + maths
function render(md) {
  const stash = [];
  const keep = (html) => `KXMATH${stash.push(html) - 1}XK`;
  // 1. code is never maths
  const code = [];
  let text = md.replace(/^(```|~~~)[^\n]*\n[\s\S]*?\n\1[ \t]*$/gm, (m) => `\u0001${code.push(m) - 1}\u0001`);
  text = text.replace(/`[^`\n]+`/g, (m) => `\u0001${code.push(m) - 1}\u0001`);
  // 2. display maths, then inline maths
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) =>
    `\n\n${keep(`<div class="math-display" tabindex="0">${katex.renderToString(tex.trim(), { displayMode: true, throwOnError: true, output: "htmlAndMathml" })}</div>`)}\n\n`,
  );
  text = text.replace(/(^|[^\\$])\$(?!\s)([^$\n]+?)(?<!\s)\$(?!\d)/g, (_, pre, tex) =>
    pre + keep(katex.renderToString(tex, { throwOnError: true, output: "htmlAndMathml" })),
  );
  text = text.replace(/\u0001(\d+)\u0001/g, (_, i) => code[+i]);

  const toc = [];
  const used = new Set();
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        let id = slugify(inner) || "section";
        while (used.has(id)) id += "-x";
        used.add(id);
        if (depth === 2) toc.push({ id, html: inner });
        return `<h${depth} id="${id}"><a class="h-anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${inner}</h${depth}>\n`;
      },
      table(token) {
        const html = Renderer.prototype.table.call(this, token);
        return `<div class="table-wrap" tabindex="0">${html}</div>`;
      },
    },
  });
  let html = marked.parse(text);
  // Wide code, tables and display maths scroll sideways; keyboard users
  // need to be able to focus them to scroll (WCAG 2.1.1).
  html = html.replace(/<pre>/g, '<pre tabindex="0">');
  html = html
    .replace(/<p>\s*KXMATH(\d+)XK\s*<\/p>/g, (_, i) => stash[+i])
    .replace(/KXMATH(\d+)XK/g, (_, i) => stash[+i]);
  if (/KXMATH\d+XK/.test(html)) throw new Error("unresolved maths placeholder");
  return { html, toc };
}

// ------------------------------------------------------------ collect posts
const posts = [];
const contentDir = join(ROOT, "content/blog");
if (existsSync(contentDir)) {
  for (const f of readdirSync(contentDir).filter((f) => f.endsWith(".md")).sort()) {
    const { meta, body } = parse(readFileSync(join(contentDir, f), "utf8"), f);
    // `earlier: true` lists a post under "Earlier posts" on the blog index.
    posts.push({ ...meta, slug: meta.slug || basename(f, ".md"), body, tags: meta.tags || [], legacy: meta.earlier === "true", file: join(contentDir, f) });
  }
}
const legacyDir = join(ROOT, "public/posts");
if (existsSync(legacyDir)) {
  for (const f of readdirSync(legacyDir).filter((f) => f.endsWith(".md") && f !== "welcome.md")) {
    const { meta, body } = parse(readFileSync(join(legacyDir, f), "utf8"), f);
    // Earlier posts open with their own H1; the template prints the title.
    posts.push({ ...meta, slug: basename(f, ".md"), body: body.replace(/^\s*#\s[^\n]*\n/, ""), tags: meta.tags || [], legacy: true, file: join(legacyDir, f) });
  }
}
// "updated" is the source file's last commit date (today while it has
// uncommitted edits), unless front matter sets it; shown when it differs.
function lastChanged(file) {
  try {
    const rel = file.slice(ROOT.length + 1);
    if (execFileSync("git", ["status", "--porcelain", "--", rel], { cwd: ROOT, encoding: "utf8" }).trim())
      return new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10); // IST
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", rel], { cwd: ROOT, encoding: "utf8" }).trim() || null;
  } catch {
    return null;
  }
}

for (const p of posts) {
  if (!p.updated) {
    const changed = lastChanged(p.file);
    if (changed && changed > p.date) p.updated = changed;
  }
  for (const k of ["title", "description", "date"]) if (!p[k]) throw new Error(`${p.slug}: missing ${k}`);
  const r = render(p.body);
  p.html = r.html;
  p.toc = r.toc;
  p.words = p.body.replace(/```[\s\S]*?```/g, "").split(/\s+/).filter(Boolean).length;
  p.minutes = Math.max(1, Math.round(p.words / 220));
}
const all = [...posts].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
const current = all.filter((p) => !p.legacy);
const earlier = all.filter((p) => p.legacy);

// ------------------------------------------------------------ shared head
const THEME_SCRIPT = `<script>
      (function () {
        // Theme: saved choice wins, else follow the system. data-theme is the
        // mode (light | dark); data-palette names a palette (assets/js/navbar.js).
        var d = document.documentElement;
        var s = null;
        try {
          s = localStorage.getItem("theme");
        } catch (e) {}
        var light = { light: 1, cpk: 1, pencil: 1 };
        var dark = { dark: 1, cyanotype: 1, sodium: 1, contrast: 1 };
        var p = light[s] || dark[s] ? s : s ? "dark" : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        var m = light[p] ? "light" : "dark";
        d.setAttribute("data-theme", m);
        if (p !== m) d.setAttribute("data-palette", p);
        d.style.colorScheme = m;
      })();
    </script>`;
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300..800&family=Newsreader:opsz,wght@6..72,300..800&family=Martian+Mono:wdth,wght@75..112,100..800&display=swap" rel="stylesheet" />`;
const ICONS = `<link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="alternate" type="application/rss+xml" title="Shuvam Banerji Seal, blog" href="${SITE}/feed.xml" />`;
const FOOTER = `<footer class="site-foot">
      <div class="wrap">
        <p>© <span data-year>2026</span> Shuvam Banerji Seal. Source on <a href="https://github.com/Shuvam-Banerji-Seal/Shuvam-Banerji-Seal.github.io">GitHub</a>.</p>
        <nav class="foot-nav" aria-label="Footer">
          <a href="/">Home</a><a href="/pages/research.html">Research</a><a href="/pages/projects.html">Projects</a><a href="/pages/tools.html">Tools</a><a href="/pages/blog.html">Blog</a><a href="/feed.xml">RSS</a>
        </nav>
      </div>
    </footer>
    <script>document.querySelectorAll("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });</script>`;

// ------------------------------------------------------------ SEO helpers
// Author identity, repeated in full on every article: search engines read
// each page on its own and do not resolve @id references across pages.
const PERSON = {
  "@type": "Person",
  "@id": `${SITE}/#person`,
  name: AUTHOR,
  url: `${SITE}/`,
  image: `${SITE}/assets/img/sbs_001.jpg`,
  jobTitle: "BS-MS student and researcher in computational chemistry and information retrieval",
  affiliation: { "@type": "CollegeOrUniversity", name: "Indian Institute of Science Education and Research Kolkata", url: "https://www.iiserkol.ac.in/" },
  sameAs: [
    "https://github.com/Shuvam-Banerji-Seal",
    "https://www.linkedin.com/in/mastersbs",
    "https://orcid.org/0009-0000-0714-569X",
    "https://huggingface.co/ShuvBan",
  ],
};
// Dates in front matter are days; publish them as India Standard Time.
const isoDate = (d) => `${d}T09:00:00+05:30`;
// Google shows about 60 to 70 characters of a title; keep the site name
// only when it fits.
const pageTitle = (t) => (t.length + 22 <= 70 ? `${t} | Shuvam Banerji Seal` : t);
// Per-article preview images (scripts/generate-og-images.py); default otherwise.
const ogImage = (slug) =>
  existsSync(join(ROOT, `assets/img/og/${slug}.png`)) ? `${SITE}/assets/img/og/${slug}.png` : `${SITE}/assets/img/og-image.png`;

// Filters on the blog index group the many tags into a few topics.
const TOPICS = [
  ["Retrieval", ["information retrieval", "bm25", "search", "rag", "hybrid search", "query reformulation", "trec", "reciprocal rank fusion", "agriculture"]],
  ["Language models", ["llms", "llm", "sycophancy", "legal ai", "evaluation", "datasets"]],
  ["Quantum chemistry", ["quantum chemistry", "hückel theory", "density functional theory", "electronic structure", "dft"]],
  ["Simulation", ["molecular dynamics", "lammps", "statistical mechanics"]],
  ["Software", ["software", "python", "visualisation"]],
];
const topicsOf = (p) => TOPICS.filter(([, tags]) => p.tags.some((t) => tags.includes(t.toLowerCase()))).map(([n]) => n);

const tagChips = (tags) => (tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join(" ");

// ------------------------------------------------------------ article page
function articlePage(p) {
  const url = `${SITE}/pages/blogs/${p.slug}.html`;
  const related = all
    .filter((q) => q.slug !== p.slug && !q.legacy)
    .map((q) => ({ q, n: q.tags.filter((t) => p.tags.includes(t)).length }))
    .sort((a, b) => b.n - a.n || b.q.date.localeCompare(a.q.date))
    .slice(0, 3)
    .map(({ q }) => q);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: p.title,
        description: p.description,
        datePublished: isoDate(p.date),
        dateModified: isoDate(p.updated || p.date),
        inLanguage: "en",
        keywords: p.tags.join(", "),
        articleSection: topicsOf(p)[0] || "Notes",
        wordCount: p.words,
        timeRequired: `PT${p.minutes}M`,
        isAccessibleForFree: true,
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        image: { "@type": "ImageObject", url: ogImage(p.slug), width: 1200, height: 630 },
        author: PERSON,
        publisher: PERSON,
        isPartOf: { "@type": "Blog", "@id": `${SITE}/pages/blog.html#blog`, name: "Shuvam Banerji Seal, blog" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/pages/blog.html` },
          { "@type": "ListItem", position: 3, name: p.title, item: url },
        ],
      },
    ],
  };
  const toc =
    p.toc.length > 2
      ? `<nav class="toc" aria-labelledby="toc-h"><details open><summary id="toc-h">Contents</summary><ol>${p.toc
          .map((t) => `<li><a href="#${t.id}">${t.html}</a></li>`)
          .join("")}</ol></details></nav>`
      : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ${THEME_SCRIPT}
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${esc(pageTitle(p.seotitle || p.title))}</title>
    <meta name="description" content="${esc(p.description)}" />
    <meta name="author" content="${AUTHOR}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${url}" />
    ${ICONS}
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Shuvam Banerji Seal" />
    <meta property="og:title" content="${esc(p.title)}" />
    <meta property="og:description" content="${esc(p.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${ogImage(p.slug)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(p.title)}" />
    <meta property="og:locale" content="en_GB" />
    <meta property="article:published_time" content="${isoDate(p.date)}" />
    <meta property="article:modified_time" content="${isoDate(p.updated || p.date)}" />
    <meta property="article:author" content="${SITE}/" />
    <meta property="article:section" content="${esc(topicsOf(p)[0] || "Notes")}" />
${p.tags.map((t) => `    <meta property="article:tag" content="${esc(t)}" />`).join("\n")}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(p.title)}" />
    <meta name="twitter:description" content="${esc(p.description)}" />
    <meta name="twitter:image" content="${ogImage(p.slug)}" />
    <meta name="twitter:image:alt" content="${esc(p.title)}" />
    <link rel="alternate" type="text/markdown" title="${esc(p.title)} (Markdown)" href="/pages/blogs/${p.slug}.md" />
    <script type="application/ld+json">${JSON.stringify(ld)}</script>
    ${FONTS}
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${KATEX_VER}/dist/katex.min.css" crossorigin="anonymous" />
    <link rel="stylesheet" href="/assets/css/article.css" />
  </head>
  <body class="article-page">
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div id="navbar-container"></div>
    <script type="module" src="/assets/js/navbar.js"></script>
    <main id="main-content" class="wrap art-layout">
      <article class="art" aria-labelledby="art-title">
        <header class="art-head">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/pages/blog.html">Blog</a></nav>
          <h1 id="art-title">${esc(p.title)}</h1>
          <p class="art-desc">${esc(p.description)}</p>
          <p class="art-meta"><span>${AUTHOR}</span> <span aria-hidden="true">·</span> <time datetime="${p.date}">${fmtDate(p.date)}</time>${p.updated ? ` <span aria-hidden="true">·</span> <span>updated <time datetime="${p.updated}">${fmtDate(p.updated)}</time></span>` : ""} <span aria-hidden="true">·</span> <span>${p.minutes} min read</span></p>
          <p class="art-tags">${tagChips(p.tags)}</p>
        </header>
        ${toc}
        <div class="prose">
${p.html}
        </div>
        <footer class="art-foot">
          <div class="byline">
            <img src="/assets/img/sbs_001.webp" alt="" width="64" height="64" loading="lazy" />
            <p><b>Shuvam Banerji Seal</b> is a BS-MS student at IISER Kolkata working on information retrieval, language-model evaluation and computational chemistry. <a href="/">More about me</a>, or write to <a href="mailto:sbs22ms076@iiserkol.ac.in">sbs22ms076@iiserkol.ac.in</a>.</p>
          </div>
          ${
            related.length
              ? `<section aria-labelledby="rel-h"><h2 id="rel-h">Read next</h2><ul class="post-list">${related.map(postItem).join("")}</ul></section>`
              : ""
          }
        </footer>
      </article>
    </main>
    ${FOOTER}
  </body>
</html>
`;
}

function postItem(p) {
  return `<li data-tags="${esc(topicsOf(p).join("|"))}"><a href="/pages/blogs/${p.slug}.html">${esc(p.title)}</a><time datetime="${p.date}">${fmtDate(p.date)}</time><p class="post-desc">${esc(p.description)}</p></li>`;
}

// ------------------------------------------------------------ blog index
function indexPage() {
  const tags = TOPICS.map(([n]) => n).filter((n) => current.some((p) => topicsOf(p).includes(n)));
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${SITE}/pages/blog.html#blog`,
        url: `${SITE}/pages/blog.html`,
        name: "Shuvam Banerji Seal, blog",
        description: "Articles on information retrieval, quantum chemistry, molecular simulation and scientific software.",
        author: PERSON,
        blogPost: current.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: `${SITE}/pages/blogs/${p.slug}.html`,
          datePublished: p.date,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/pages/blog.html` },
        ],
      },
    ],
  };
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ${THEME_SCRIPT}
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Blog | Shuvam Banerji Seal</title>
    <meta name="description" content="Articles by Shuvam Banerji Seal on information retrieval, BM25 and RAG, LLM sycophancy, Hückel and DFT theory, molecular dynamics and LAMMPS." />
    <meta name="author" content="${AUTHOR}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${SITE}/pages/blog.html" />
    ${ICONS}
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Blog | Shuvam Banerji Seal" />
    <meta property="og:description" content="Information retrieval, quantum chemistry, molecular simulation and the software behind them." />
    <meta property="og:url" content="${SITE}/pages/blog.html" />
    <meta property="og:image" content="${SITE}/assets/img/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${JSON.stringify(ld)}</script>
    ${FONTS}
    <link rel="stylesheet" href="/assets/css/article.css" />
  </head>
  <body class="article-page blog-index">
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div id="navbar-container"></div>
    <script type="module" src="/assets/js/navbar.js"></script>
    <main id="main-content" class="wrap">
      <header class="page-head">
        <h1>Writing</h1>
        <p>Notes on the methods I use, written so that a second-year student can follow them: retrieval and language models, quantum chemistry, molecular simulation, and the software in between. Every worked example was run before it was published.</p>
        <p class="page-links"><a href="/feed.xml">RSS feed</a> <a href="/pages/notes.html">Notes</a></p>
      </header>
      <div class="filters" role="group" aria-label="Show articles on one topic">
        <button type="button" aria-pressed="true" data-tag="">All</button>
${tags.map((t) => `        <button type="button" aria-pressed="false" data-tag="${esc(t)}">${esc(t)}</button>`).join("\n")}
      </div>
      <p class="filter-status" role="status" aria-live="polite"></p>
      <ul class="post-list post-list--main">
${current.map((p) => "        " + postItem(p).replace("</p></li>", `</p><p class="post-tags">${tagChips(p.tags)} <span>${p.minutes} min</span></p></li>`)).join("\n")}
      </ul>
      ${
        earlier.length
          ? `<section class="earlier" aria-labelledby="earlier-h"><h2 id="earlier-h">Earlier posts</h2><ul class="post-list">${earlier
              .map(postItem)
              .join("")}</ul></section>`
          : ""
      }
    </main>
    ${FOOTER}
    <script>
      (function () {
        var buttons = document.querySelectorAll(".filters [data-tag]");
        var items = document.querySelectorAll(".post-list--main > li");
        var status = document.querySelector(".filter-status");
        buttons.forEach(function (b) {
          b.addEventListener("click", function () {
            var tag = b.getAttribute("data-tag");
            var shown = 0;
            buttons.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
            items.forEach(function (li) {
              var on = !tag || li.getAttribute("data-tags").split("|").indexOf(tag) >= 0;
              li.hidden = !on;
              if (on) shown++;
            });
            status.textContent = tag ? shown + " article" + (shown === 1 ? "" : "s") + " on " + tag : "";
          });
        });
      })();
    </script>
  </body>
</html>
`;
}

// ------------------------------------------------------------ write
mkdirSync(join(ROOT, "pages/blogs"), { recursive: true });
for (const p of posts) writeFileSync(join(ROOT, `pages/blogs/${p.slug}.html`), articlePage(p));
writeFileSync(join(ROOT, "pages/blog.html"), indexPage());

// Homepage list: the six newest current articles.
const home = join(ROOT, "index.html");
const homeHtml = readFileSync(home, "utf8");
const list = `<!-- posts:start (generated by scripts/build-blog.mjs) -->
          <ul class="posts">
${current
  .slice(0, 6)
  .map((p) => `            <li><a href="/pages/blogs/${p.slug}.html">${esc(p.title)}</a><time datetime="${p.date}">${fmtDate(p.date)}</time><p class="post-desc">${esc(p.description)}</p></li>`)
  .join("\n")}
          </ul>
          <!-- posts:end -->`;
const re = /<!-- posts:start[\s\S]*?<!-- posts:end -->/;
if (re.test(homeHtml)) writeFileSync(home, homeHtml.replace(re, list));

// RSS
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Shuvam Banerji Seal, blog</title>
    <link>${SITE}/pages/blog.html</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Information retrieval, quantum chemistry, molecular simulation and scientific software.</description>
    <language>en</language>
${current
  .map(
    (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE}/pages/blogs/${p.slug}.html</link>
      <guid>${SITE}/pages/blogs/${p.slug}.html</guid>
      <pubDate>${new Date(p.date + "T00:00:00Z").toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join("\n")}
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>
`;
writeFileSync(join(ROOT, "public/feed.xml"), rss);

// Plain Markdown copies for language-model crawlers and readers, and an
// llms.txt index (https://llmstxt.org) that points at them.
mkdirSync(join(ROOT, "public/pages/blogs"), { recursive: true });
for (const p of posts) {
  const md = `# ${p.title}\n\n> ${p.description}\n\nBy ${AUTHOR}, ${fmtDate(p.date)}. Canonical page: ${SITE}/pages/blogs/${p.slug}.html\n\n${p.body.trim()}\n`;
  writeFileSync(join(ROOT, `public/pages/blogs/${p.slug}.md`), md);
}
const llmLine = (p) => `- [${p.title}](${SITE}/pages/blogs/${p.slug}.html): ${p.description} Markdown: ${SITE}/pages/blogs/${p.slug}.md`;
const research = JSON.parse(readFileSync(join(ROOT, "assets/data/research.json"), "utf8"));
writeFileSync(
  join(ROOT, "public/llms.txt"),
  `# Shuvam Banerji Seal

> BS-MS student at IISER Kolkata (chemistry major, computer science minor). Research in information retrieval and language-model evaluation (ECIR 2026, FIRE 2025, TREC 2024), computational chemistry (DFT, molecular dynamics), and scientific software such as Molecule3D, a LAMMPS workbench that runs in the browser.

## Pages

- [Home](${SITE}/): overview, research, projects, tools and contact
- [Research](${SITE}/pages/research.html): publications, thesis, datasets, talks and service
- [Projects](${SITE}/pages/projects.html): selected software, research code and teaching material
- [CV](${SITE}/pages/resume.html): full curriculum vitae
- [GitHub repositories](${SITE}/pages/github-projects.html): every public repository
- [Tools](${SITE}/pages/tools.html): chemistry, document, media and language-model tools that run in the browser

## Articles

${current.map(llmLine).join("\n")}

## Publications

${research.publications.map((r) => `- ${r.title} (${r.venue}). ${r.authors.join(", ")}. ${Object.values(r.links || {})[0] || ""}`).join("\n")}

## Optional

${earlier.map(llmLine).join("\n")}
`,
);
writeFileSync(
  join(ROOT, "assets/data/blog-index.json"),
  JSON.stringify(all.map(({ slug, title, description, date, tags, legacy }) => ({ slug, title, description, date, tags, legacy })), null, 1) + "\n",
);
console.log(`blog: ${posts.length} pages built (${current.length} current, ${earlier.length} earlier), feed, llms.txt, Markdown copies`);
