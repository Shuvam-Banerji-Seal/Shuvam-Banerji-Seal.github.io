# 01 — Research

## Sources consulted (this session)
| Topic | Source | Finding | Confidence |
|-------|--------|---------|------------|
| Repo structure | local read | 26 HTML entries + 3 blogs; vite 6; publicDir=public | [VERIFIED: local files] |
| Deploy flow | .github/workflows/deploy.yml | build → copy assets+submodule → Pages action (NOT gh-pages branch) | [VERIFIED: file] |
| Music manifest | scripts/generate-music-manifest.js | reads assets_for_my_website/Music (submodule, empty locally) → public/music-library.json | [VERIFIED: file] |
| Blog system | public/posts + blog-loader.js | 5 posts in public/posts; stale duplicate at assets/blog-manifest.json | [VERIFIED: files] |
| Test suites | tests/*.js | basic wired to npm; comprehensive/build-verification README-only; many always-pass tests | [VERIFIED: files] |

## Key environment facts
- node v24.18.0, npm 12.0.1; `npm install` OK (465 pkgs); esbuild works despite blocked postinstall script [VERIFIED: run]
- Network: available (cdn.jsdelivr.net reachable) [VERIFIED: curl]
- Browsers: /usr/bin/chromium-browser and google-chrome present; playwright 1.62.1 via npx [VERIFIED]
- git: clean tree, branch main, HEAD 81bd5d2 [VERIFIED: git status]

## Explore-agent findings
See plans/05-audit-log.md wave 0 (28 items with file:line citations from 3 parallel explore agents + my own full read of index.html, navbar.js, theme.css, vite.config.mjs, deploy.yml).

## Open / conflicts
- Root `music-library.json` vs `public/music-library.json`: both exist, different sizes; music.html fetch hits served public version in both dev & prod. Root file is stale artifact → quarantine later if not referenced (verified: only scripts/validate-music.js reads public one; nothing reads root one except stale reference). [DERIVED: grep]
