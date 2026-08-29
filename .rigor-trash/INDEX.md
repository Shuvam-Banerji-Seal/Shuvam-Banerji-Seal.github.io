| 2026-08-18 03:39:55 | pages/tools/mol-weight.html (backup pre-edit) | removing duplicate calculate/parseFormula/parseGroup/displayResults v2 block (B01) | restore file from this backup |
| 2026-08-18 03:47:46 | pages/tools/equation-balancer.html (backup pre-edit) | B32 regex + B33 stale card fix | restore from backup |
| 2026-08-18 03:56:15 | pages/tools/games.html (backup pre-edit) | B35 pendingGameType null-order fix | restore from backup |
| 2026-08-18 04:02:41 | assets/js/music-player-enhanced.js (backup pre-edit) | B08 localStorage JSON.parse crash fix | restore from backup |
| 2026-08-18 04:07:32 | pages/reader.html (backup pre-edit) | B02 lucide guard fix | restore from backup |
| 2026-08-18 04:12:09 | .github/workflows/deploy.yml (backup pre-edit) | B06 books/ not deployed — add cp step | restore from backup |
| 2026-08-18 04:13:32 | assets/js/navbar.js, pages/github-projects.html, pages/music.html (backups pre-edit batch1) | B30, B13, B03 fixes | restore from backups |
| 2026-08-18 04:20 | pages/mermaid-tool.html line 19 | B07 og:image pointed to nonexistent /assets/images/mermaid-editor-preview.png; replaced with standard og-image.svg | `git show HEAD:pages/mermaid-tool.html` (original line recorded here) |
| 2026-08-18 04:20 | pages/music.html line 508 | B03 removed duplicate `<script src="/assets/js/navbar.js?v=1.0">` (already loaded line 76; same absolute URL so module ran once anyway) | git show HEAD:pages/music.html |
| 2026-08-18 04:18:40 | assets/blog-manifest.json | stale 3-post duplicate of public/blog-manifest.json (5 posts); no code references after test-script fix (B19) | quarantined copy in .rigor-trash |
| 2026-08-18 04:18:40 | scripts/_, assets/js/blog-loader.js (backups pre-edit) | B19/B21/B24/B25 fixes | restore from backups |
| 2026-08-18 04:20:39 | assets/blog-manifest.json | B19 stale 3-post manifest (superseded by public/blog-manifest.json regenerated with quote-fix) | quarantined copy |
| 2026-08-18 04:35:06 | pages/tools/youtube-downloader.html (backup pre-edit) | B18 dead Invidious instances + timeout fix | restore from backup |
| 2026-08-18 04:41:36 | pages/tools/pdf-reducer.html (backup pre-edit) | B38 negative-reduction display fix | restore from backup |
| 2026-08-18 04:45:07 | pages/tools/pdf-studio.html (backup pre-edit) | B38 negative-reduction display fix in Compress pane | restore from backup |
| 2026-08-18 04:48:14 | pages/tools/llm-studio.html (backup pre-edit) | B17 hardcoded API key removal | restore from backup |
| 2026-08-18 04:53:31 | assets/js/main.js (backup pre-edit) | B10 navbar null-guard fix | restore from backup |
| 2026-08-18 04:54:19 | pages/tools/ph-calculator.html (backup pre-edit) | B34 out-of-range validation | restore from backup |
| 2026-08-18 04:55:41 | pages/music.html, scripts/inject-_.py (backups pre-edit staticbatch) | B27 dead hash removal, B22 portable ROOT | restore from backups |
| 2026-08-18 04:56:12 | assets/js/benzene-loader.js (backup pre-edit) | B12 start() null guard | restore |
| 2026-08-18 04:57:02 | music-library.json (root, 69-track) | B20 stale duplicate of public/music-library.json (448 tracks); shadowed by publicDir, never deployed (deploy only copies dist+assets+assets*for_my_website) | quarantined copy |
| 20260818-105438 | root:terminal-alignment-{before,after-desktop,after-mobile}.png | fix verified, screenshots are evidence not repo content | restoring from .rigor-trash |
| 20260825-110000 | assets/js/{tools-main,enhanced-particles,anime-animations,molecule-background,dna-helix,benzene-loader}.js | orphaned modules — zero references in any HTML/JS (grep-verified; tools-main appears only in a comment). Superseded by home-cinematics.js and per-page inline scripts | `mv .rigor-trash/20260825-110000-orphan-js/<name>.js assets/js/<name>.js` |
| 20260825-110500 | assets/*.{js,css} (68 hashed bundles: arc-_, gantt-_, katex-\_, etc. + mermaid-tool-CcQdSQuu.js/.css) | stale Vite prebuilt chunks committed to root assets/ — no HTML/JS references them (grep count 0; only a history comment mentions mermaid-tool-CcQdSQuu.js). The mermaid-tool's ~50 chunk dependencies are reachable ONLY from that stale bundle, so the whole cluster is dead. Fresh bundles are generated into dist/assets/ on each build | `mv .rigor-trash/20260825-110500-stale-bundles/<name> assets/<name>` |
| 20260825-130000 | root:_.png + scr/_.png (35 temp screenshots: daw-_, deg-_, ds-_, hp-_, live-_, music-premium_, studio-cursor, wave\*) | test artifacts from Playwright verification — not repo content; scr/ top-level pngs are copies of plans/scrutiny evidence | `mv .rigor-trash/20260825-130000-temp-screenshots/<name> ./` or `scr/<name>` |
