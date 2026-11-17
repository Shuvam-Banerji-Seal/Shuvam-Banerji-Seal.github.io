# Homepage v5 and content pages (2026-11-18)

User request (2026-11-17): redesign the homepage with a particle intro that
converges into benzene with its π clouds and flies into the screen; a terminal
header about Shuvam that builds his portrait from ASCII; a 3D molecule with
orbitals; projects and papers from the CV (My-CV repo) and GitHub; every tool
usable; an animated, accessible navbar; correct layout on phones and
desktops; SEO; more articles. Also redesign the GitHub page and the projects
page.

## What exists now

| Piece | File |
| --- | --- |
| Intro (particles → benzene → fly-through) | `assets/js/intro-loader.js`, gate script in `index.html` head |
| Benzene geometry, Hückel MOs, |ψ|² sampler | `assets/js/chem/benzene.js` |
| Hero figure with MO energy-diagram picker | `assets/js/benzene-stage.js` |
| Terminal: neofetch, ASCII portrait, commands | `assets/js/hero-terminal.js`, data `assets/data/portrait-ascii.json` (from `scripts/generate-ascii-portrait.py`) |
| Navbar (all pages): menus, mobile sheet, search | `assets/js/navbar.js` (self-styled, ids `#site-nav`, `#sn-sheet`) |
| BM25 site search (`/` or Ctrl+K) | `assets/js/site-search.js`, index `public/search-index.json` (`scripts/generate-search-index.mjs`) |
| Publications data | `assets/data/research.json` |
| GitHub snapshot | `assets/data/github-repos.json` (`scripts/generate-github-data.mjs`) |
| Blog | `content/blog/*.md` → `scripts/build-blog.mjs` → `pages/blogs/*.html`, `pages/blog.html`, `public/feed.xml` |
| Sitemap | `scripts/generate-sitemap.mjs` → `public/sitemap.xml` |
| Shared page CSS | `assets/css/site.css` (base, `.wrap`, `.page-main`, `.page-head`, `.sec-h`, `.rows`, `.filters`, `.site-foot`) |
| Build | `npm run build` = generate:site → tests → music manifest → vite (all `pages/**/*.html` are entries) |

## Content-page contract (research, projects, GitHub, CV, tools)

- `<body class="site-page">`, `<link rel="stylesheet" href="/assets/css/site.css" />`
  (then at most one small page `<style>`), `<div id="navbar-container"></div>`
  plus `<script type="module" src="/assets/js/navbar.js"></script>`, a skip link
  to `#main-content`, `<main id="main-content" class="wrap page-main">`, the
  footer markup used in `pages/blog.html`.
- Head: the theme script from `pages/blog.html`, Google Fonts URL from
  `pages/blog.html`, unique `<title>` "X | Shuvam Banerji Seal", meta
  description 120–160 chars, canonical, Open Graph + Twitter tags,
  favicon/apple-touch-icon links, JSON-LD (BreadcrumbList plus the page type).
- Use absolute links (`/pages/...`). Lists of things are `.rows` (title,
  one-line description, plain links), never card grids.
- Type: Newsreader for h1/h2 (`font-family: var(--font-display)`), Hanken
  Grotesk body, Martian Mono only for code/metadata.
- Tokens only (`--paper --surface --surface-2 --ink --graphite --rule
  --rule-strong --nitrogen --oxygen --sulfur`), no hex colours in pages.
- Banned: gradients, glows, glass, pills on labels, icon tiles, nested cards,
  coloured side stripes, big stat numbers, 01/02 labels, em dashes and
  marketing words in copy. Gate: `node scripts/lint-design.js <files>` = 0 errors.
- Must work at 360px with no horizontal scroll, and in both themes.

## Status (2026-11-18): built and verified locally, NOT committed or deployed

| Check | Result |
| --- | --- |
| Lint | `node scripts/lint-design.js` 141 files, 0 errors (13 old warnings: spinners, carets) |
| Tests | basic 11/11, comprehensive 1463/1463, 0 warnings (timer test now accepts auto-discovered Vite inputs) |
| Build | `npm run build` clean; dist served statically: intro, portrait, terminal BM25 search, `orbital` command, Ctrl+K search, repo stats, KaTeX articles, GitHub filters via URL; 0 page errors, 0 4xx |
| Accessibility | axe WCAG 2.1 AA: 0 violations on home, research, projects, GitHub, blog, articles, CV, light and dark |
| Tools | 30 pages load with no JS errors, nav on all (Mermaid keeps its own header), no sideways scroll at 390 px; mol-weight, balancer, pH, unit converter give correct results |

Facts to remember: Molecule3D numbers come from the lammps-web-gui README (185 commands, 46 CMake options, 71 packages, 3,000+ tests, 702/894 examples, 2,736 parity cases, educational non-commercial licence since 22 Sept 2026), not the older CV. AgriIR is FAISS plus web search, not hybrid BM25 + dense. TREC ToT recall@1000 0.8067 is their best run, not the track's best.

Open: the intro plays once per tab session (`/?intro` replays; terminal `intro`). The CV page dropped the WhatsApp bulk-messenger project because the current CV omits it (backup in .rigor-trash/20261118-resume-preedit/). Articles are dated 2026-11-17 and should be read by Shuvam before publishing.
