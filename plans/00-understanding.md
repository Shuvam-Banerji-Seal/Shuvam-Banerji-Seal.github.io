# 00 — Understanding

## Restated Problem

User request: **read all files in this repo, use Playwright to test every feature, fix all bugs, in a continuous long-horizon loop whose To-Do list loops back to step 1 (bug identification) until clean.**

## Repo Nature

- Static portfolio site (GitHub Pages) for Shuvam Banerji Seal: 26 Vite entry HTML pages + 3 blog posts.
- Deploy path: `.github/workflows/deploy.yml` → `npm install` → manifest gen → `vite build` → `cp -r assets/ assets_for_my_website/` → dist → Pages action.
- Locally testable via `vite dev` (publicDir `public/`, root `.`).
- `assets_for_my_website` is an **uninitialized git submodule** → music media files absent locally (404s expected locally for tracks; CDN fallback applies in prod).
- Root `assets/` contains BOTH real sources (`css/`, `js/`, `img/`, `pdb/`) and stale committed Vite build output (hashed `*-ABC123.js` files) referenced only by `pages/mermaid-tool.html` (`/assets/mermaid-tool-CcQdSQuu.js`, `/assets/mermaid-tool-OD-GLX3d.css`).

## Success Criteria

1. Every page loads without JS console errors and without failed local requests under Playwright.
2. Every interactive feature works (terminal, theme toggle, nav, forms, music player UI, all tools, mermaid editor, readers).
3. Every bug found is either fixed + verified, or explicitly deferred with reason.
4. `npm test` (basic-tests) passes; build (`vite build`) succeeds.
5. Loop closes: a final Playwright wave finds zero NEW bugs.

## Constraints / Decisions

- Do NOT commit/push (user did not ask; only fix files).
- Do NOT delete anything; quarantine stale artifacts only if required for correctness, with INDEX entries.
- Network-dependent features (formspree, GitHub API, LLM endpoints, CDNs) are tested for _graceful handling_; external API failures are not "bugs" but must not break the UI.
- Third-party API keys / dead endpoints: fix what is safely fixable (e.g., dead Invidious instances), flag secrets, do NOT invent replacements for unverifiable keys.

## Open Questions

- Q1: Is the root `music-library.json` (69 tracks, stale) intended to exist? Deviates from `public/music-library.json` (448). [PENDING]
- Q2: Should stale hashed bundles in root `assets/` be kept (mermaid-tool depends on 2 of them)? [DECISION: keep the 2 mermaid ones + polyfill; they're referenced. Leave others—harmless, not referenced by HTML.]

---

# Rev 2 — 2026-08-23 — Full structural map (session: "read all files")

Read-verified this session against the working tree. Line counts and wirings below are facts observed in the files, not recollections.

## 1. What this repo is

Personal portfolio + tool suite of **Shuvam Banerji Seal** (computational chemist & AI researcher, IISER Kolkata), hosted at `https://shuvam-banerji-seal.github.io`. A **Vite 6 multi-page app**: one root `index.html` + 28 registered HTML entries in `vite.config.mjs` (10 primary pages + 18 tool pages; `pdf-reducer.html`/`pdf-to-jpg.html` are redirect stubs into pdf-studio). Vanilla JS/HTML/CSS everywhere except the Mermaid editor, which is a **React 19** island (`src/mermaid-tool/`). Deployed by GitHub Actions to GitHub Pages on every push to `main`.

## 2. Build & deploy pipeline (verified)

```
push main → .github/workflows/deploy.yml
  ├─ actions/checkout@v4 (submodules recursive)
  ├─ node 20, npm install
  ├─ node scripts/generate-music-manifest.js   → public/music-library.json
  ├─ node scripts/generate-blog-manifest.js    → public/blog-manifest.json
  ├─ npm run build  = npm test && npm run generate:music && vite build
  │     vite build → dist/ (28 inputs hashed-bundled; publicDir=public copied)
  ├─ cp -r assets assets_for_my_website books → dist/   ← RAW sources also shipped
  └─ upload-pages-artifact → actions/deploy-pages@v4
```

Key consequence: the live site serves **both** Vite bundles (hashed) **and** raw `/assets/js/*.js`, because most pages reference source paths directly. `assets_for_my_website` is a git submodule (music media, ~450 tracks); music playback uses `media.githubusercontent.com` CDN URLs baked into the manifest, so audio works even though media isn't in this repo's git objects. Second submodule `EFAML_WEB` is present as an empty dir (not checked out locally).

## 3. Directory map

| Path                                    | Role                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html` (1743 ln)                  | Homepage: FOUC theme script (quantum default), loading screen (CSS orbital fallback + canvases for matrix rain & 3D benzene), navbar mount, hero terminal (interactive shell w/ ~20 commands incl. `open <tool>` router), Three.js ATP ball-and-stick viewer (lazy three.js r128 CDN behind WebGL probe), About/Projects/Contact (Formspree) sections, redesigned footer, inline scroll/theme/form scripts |
| `pages/*.html`                          | Primary pages — blog, gallery, github-projects, mermaid-tool (React mount), music, notes, reader, resume, thermodynamics, tools (hub)                                                                                                                                                                                                                                                                      |
| `pages/blogs/*.html`                    | 3 static long-form posts (dft-catalyst-design, python-chemistry-tools, rag-architecture-explained)                                                                                                                                                                                                                                                                                                         |
| `pages/tools/*.html`                    | 18 tool pages (see §5). Most carry their logic as **inline `<script>` blocks**; external JS only where shared/tested                                                                                                                                                                                                                                                                                       |
| `assets/css/` (14 files)                | theme.css (33 KB, per-theme variable sets), main.css (61 KB components/layout), mobile.css + mobile-fixes.css, index-page.css (ordered @import entry: theme→main→mobile-fixes→mobile→index-overrides), index-overrides.css (53 KB homepage-specific), tool-page.css, tools.css, music-player.css (41 KB), audio-studio.css, resume-enhancements.css, animations.css, chemistry-theme.css, overrides.css    |
| `assets/js/`                            | Active modules vs legacy orphans — see §4                                                                                                                                                                                                                                                                                                                                                                  |
| `src/mermaid-tool/`                     | React 19 app: App.jsx (553 ln) + 7 components (Header/Sidebar/CodeEditor/Preview/StatusBar/Toolbar/VisualBuilder) + Editor.jsx; styles in src/mermaid-tool/styles/. Mounted by pages/mermaid-tool.html via `/src/mermaid-tool/main.jsx`; mermaid v11 bundled by Vite                                                                                                                                       |
| `public/`                               | Copied verbatim to dist: robots.txt, sitemap.xml (25 URLs), favicon.ico, blog-manifest.json (5 posts), music-library.json (~450 tracks w/ cdnUrl), posts/\*.md (5 markdown posts rendered client-side by blog-loader.js via marked+katex+highlight.js)                                                                                                                                                     |
| `books/all_books/...`                   | E-reader content: `Book_1_The_Journey_of_Adi/Chapter_01_The_Beginning/content.md`, fetched by reader.js                                                                                                                                                                                                                                                                                                    |
| `scripts/`                              | generate-music-manifest.js (scans submodule Music/, emits file+cdnUrl), generate-blog-manifest.js (front-matter parser), validate-music.js, test-blog-system.js, inject-fouc-script.py / inject-theme-css.py (one-shot page-migration utilities, already applied), generate-deploy-key.sh                                                                                                                  |
| `tests/`                                | basic-tests.js (11 smoke tests — runs as `npm test` gate inside build), comprehensive-tests.js (469 static checks), build-verification.js (dist checks)                                                                                                                                                                                                                                                    |
| `assets/img/`, `assets/pdb/`            | profile images (webp+jpg), og-image.svg, ATP.pdb + 6O2T.cif structures                                                                                                                                                                                                                                                                                                                                     |
| `.github/workflows/deploy.yml` (+ .bak) | CI/CD described above                                                                                                                                                                                                                                                                                                                                                                                      |
| `old_codes/`                            | archived legacy code + CODEBASE_INFO.md doc (historical reference only)                                                                                                                                                                                                                                                                                                                                    |
| `dist/`                                 | last local build output (regenerated on build)                                                                                                                                                                                                                                                                                                                                                             |
| `.rigor-trash/`                         | quarantine area w/ INDEX.md (per protocol — nothing hard-deleted)                                                                                                                                                                                                                                                                                                                                          |
| `plans/`                                | this working-memory folder                                                                                                                                                                                                                                                                                                                                                                                 |

## 4. JavaScript module inventory — ACTIVE vs ORPHANED

Verified by grepping every HTML + JS for references (static and dynamic):

**Active (referenced):**
| Module | Used by |
|---|---|
| navbar.js (620 ln) | ALL pages — injects desktop nav + mobile accordion menu from a single navStructure array (About/Resume/Projects links + Resources/Apps/Tools dropdowns), theme toggle wiring (`window.__themeToggleWired` guard), `window.showNotification` |
| main.js (311 ln) | most pages — theme apply/toggle, navbar scroll state, scroll-reveal, optional #canvas-container particle bg, contact form, `[data-github-repos]` hydration |
| enhanced.js (814 ln) | gallery/github-projects/notes/resume/thermodynamics — animation controller |
| home-cinematics.js | index only — cursor aura, anime.js reveals, parallax, constellation field (reduced-motion aware) |
| loader-3d.js | index only — WebGL-gated 3D benzene loader; always fires `fl-loader-done`; 5.2 s cap in page script |
| blog-loader.js | blog.html — fetches blog-manifest.json + posts/\*.md, marked/KaTeX/highlight rendering, tag filter |
| reader.js | reader.html — scans /books/, renders md |
| music-player-enhanced.js (1086 ln) | music.html via absolute `/assets/js/music-player-enhanced.js?v=3.7` — reads public/music-library.json |
| audio-studio.js (2108 ln) | audio-studio.html — web DAW |
| playground.js | playground.html — sandboxed iframe editor |
| webcam-tester.js → imports ./air-guitar.js | webcam-tester.html — getUserMedia tester + MediaPipe Karplus-Strong air guitar |

**Orphaned (no references found anywhere — legacy):** `tools-main.js` (1949 ln; tools.html has a comment noting its retirement), `enhanced-particles.js`, `anime-animations.js`, `molecule-background.js`, `dna-helix.js`, `benzene-loader.js`. Stale hashed bundles remain in root `assets/` from old builds; pages/mermaid-tool.html no longer references them (verified: its only script is `/src/mermaid-tool/main.jsx`) — they are dead weight, kept per no-delete protocol.

## 5. Tool page architecture pattern

Standard tool page = head (fonts incl. Space Grotesk after uncommitted wave, theme.css → main.css → mobile.css → mobile-fixes.css → tool-page.css) + lucide@1.33.0 pinned UMD + navbar.js + page-specific inline scripts. External libs per page: pdf-lib (pdf-studio, plus lazy @cantoo/pdf-lib for real AES-256 encrypt), 3Dmol (molecule-viz), marked (llm-chat). Tools list: llm-chat, llm-studio (BYOK multi-provider), paper-finder (arXiv/OpenAlex/Crossref/Europe PMC), periodic-table, mol-weight, equation-balancer, ph-calculator, unit-converter, molecule-viz, pdf-studio (+2 redirect stubs), audio-studio, games, youtube-downloader (cobalt/Y2Mate links), webcam-tester+air-guitar, playground, file-share (WebRTC Beam), llm-chat.

## 6. Theme system

8 dark themes (`quantum` [homepage default], dark, dark-coffee, amber, tokyo-night, absolute-dark, forest, dracula) + light. `data-theme` attr on `<html>`+`<body>`, persisted in localStorage key `theme`. FOUC early script in every page head; toggle flips dark↔light or rolls a random dark. Theme CSS lives in theme.css + per-theme selector lines enumerated across main/mobile/index-overrides (425+ lines added in c7f9282).

## 7. Current working-tree state (IMPORTANT for next session)

- Last commit: `9aa5506` "design-system polish" (Space Grotesk display type, selection/scrollbars, scroll-progress bar, grain, card hover glow, focus rings) — but those polish blocks were placed in **index-overrides.css** (homepage-only).
- **UNCOMMITTED** (32 files, +158/−142): an interrupted follow-up wave that promotes the polish site-wide — moves the block out of index-overrides.css into **main.css**, adds Space Grotesk display-face rules to main.css h1–h3 and tool-page.css, and updates the Google Fonts link (adds `Space+Grotesk:wght@500;600;700`) in all 28 pages. Not yet tested/deployed as far as the tree shows.
- Live deployment corresponds to earlier commits (footer redesign a5f8112 lineage); the design-system work above is ahead of prod.
- Known-env-only caveats (not bugs): headless WebGL skips 3D features; GitHub API rate limits handled w/ cache; corsproxy 429 on paper-finder semantic source.
- Owner action item outstanding: rotate Modal API key leaked in git history (commit 3f41677).

## Open Questions (Rev 2)

- Q3 [RESOLVED-THIS-SESSION]: orphaned JS modules identified (§4) — candidates for future quarantine, no action taken (read-only session).
- Q4: Uncommitted design-system wave needs verification (visual pass + axe + responsive spot checks) before commit/deploy — natural next task if user wants it finished.
