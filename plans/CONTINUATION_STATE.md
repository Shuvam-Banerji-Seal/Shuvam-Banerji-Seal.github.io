# CONTINUATION STATE — 2026-08-21 (DEPLOYED)

## Status: DEPLOYED & VERIFIED LIVE ✅

Commit 9a8c080 pushed to origin/main → "Deploy Portfolio to GitHub Pages"
run 32495709189 completed green.

### Follow-up: hero side-by-side fix (B48) — DEPLOYED

Vite hoists inline <style> above bundled CSS in dist → mobile.css flattened
the hero grid. Fixed via `body section.hero` specificity bump (all 4 rules).
Commit 00dcc8c pushed → run 32499930621 success → live HTML contains the
`body section.hero` selectors (curl-verified).

### Systematic cascade-loss audit — DONE, DEPLOYED (commit 2b33718, run 32506029392)

B49: index inline CSS externalized into ordered @import entry
(assets/css/index-page.css → index-overrides.css last). Dev↔prod
computed-style diff now **0**; index loads 1 CSS file instead of 5.
Other pages audited — no losses (unique selectors).

B50: mermaid-tool rewired to REAL source (/src/mermaid-tool/main.jsx

- previously-missing mermaid-tool.css import). Stale-bundle preload-
  manifest 404s eliminated. Bare-dist crawl 26/26 clean — first ever.

LIVE-VERIFIED after deploy:

- live index serves single bundle main-D_2_eRYG.css; inside it,
  mobile flex .hero @27649 < body section.hero override @71758 ✓
- live mermaid bundle mermaid-tool-Ct5x-TMK.js: 60 chunk refs,
  ALL resolve on the live server ✓

### Mobile navbar fix (B51) — DEPLOYED (commit 02b5e90)

The slide-out menu had NO item-layout CSS: accordions permanently
expanded, chevrons/icons stacked wrong, translucent bleed-through.
Fixed via new layout block in mobile-fixes.css (opaque backing, flex
rows, 44px targets, collapse/expand, arrow rotation). Full functional
battery green (X/backdrop/Escape close, scroll-lock+aria, single-open,
navigate-and-close from subpages), axe 0 violations, dark theme clean.
LIVE-VERIFIED: collapse rule present in live bundle.

### Studio improvement loop (2026-08-22) — LOOPS 1+2 DEPLOYED

LOOP 1 (commit 43b1db8):

- B52 critical: pdf-studio Protect produced FAKE-encrypted PDFs (pdf-lib
  ignores password opts). Now lazy-loads @cantoo/pdf-lib, real AES-256,
  /Encrypt sanity check before download. Live-verified.
- A1: audio export filename = "<track>-mix.<ext>" not "export.wav".

LOOP 2 (commit 8b19a03):

- B53 high: audio mp3/ogg exports were dead code paths
  (OfflineAudioContext.createMediaStreamDestination doesn't exist).
  MP3 via lazy lamejs (verified: MPEG layer III 192kbps stereo);
  OGG realtime MediaRecorder with honest MP3 fallback.
- Verified healthy: normalize, undo, keyboard shortcuts, watermark
  (pdf.js text-extraction ground truth), all pdf-studio modes.

### NEW TOOL: Webcam Tester + Air Guitar — DEPLOYED (commit aaa8e30)

- pages/tools/webcam-tester.html + webcam-tester.js + air-guitar.js
- Tester: device picker, res presets, mirror/grid/fullscreen, snapshots,
  live res/fps/aspect stats, per-error-type guidance
- Air guitar: MediaPipe Hands (lazy CDN) + Karplus-Strong synth; strum
  detection unit-tested (down/up sweeps exact, teleport+jitter guarded)
- Wired: vite entry, tools card, navbar Tools dropdown
- LIVE-VERIFIED: page 200, bundle served, tools card present, navbar
  bundle contains the entry

### Feature wave 2026-08-22 (evening) — LOOPS A–G DEPLOYED

| Loop  | Commit  | What                                                                                                                                                                                                                           |
| ----- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A     | 0eb287f | HTML Playground: live sandboxed iframe preview, console capture shim, auto-run, layout toggle, download, share links, persistence                                                                                              |
| B     | 0eb287f | PDF consolidation: pdf-to-jpg/pdf-reducer → redirect stubs into pdf-studio#tojpg/#compress; navbar de-scattered                                                                                                                |
| C     | 0eb287f | Beam file sharing: serverless WebRTC DataChannel, compressed copy-paste signaling, chunked transfer w/ backpressure. SHA-256-verified byte-exact P2P delivery                                                                  |
| D     | 0eb287f | Research engine: +OpenAlex +Crossref +Europe PMC, parallel all-source search, dedupe, badges (80 papers/4 sources verified for "benzene")                                                                                      |
| E+F+G | 3e54fc6 | Terminal: tools/open/neofetch/history/echo commands w/ arg routing. Loader: orbital-molecular cinematic (2.2s). Homepage: cursor aura, constellation field w/ cursor repulsion, anime.js scroll reveals, hero pointer parallax |
| —     | 90d1843 | Playground null-safety hardening (intermittent race)                                                                                                                                                                           |

Final regression: 29-page crawl clean after hardening; tests 11/11.

### Live URLs

- /pages/tools/playground.html · /pages/tools/file-share.html
- /pages/tools/webcam-tester.html · /pages/tools/paper-finder.html (All sources)

### 3D loading screen — DEPLOYED (commit b76a1bd)

Real Three.js scene replaces the CSS orbital loader when WebGL exists:
benzene assembles atom-by-atom (eased fly-in, staggered), bonds grow
after their atoms land, aromatic inner double-bonds, MeshPhysical
materials, key+cyan/violet rim lights, fog, starfield, ACES tone
mapping. Camera drift-orbits then dollies through the ring center with
FOV punch + cyan flash on exit. Percentage = real assembly progress.
Fallback (no WebGL/CDN fail/reduced-motion): CSS orbital + linear pct,
'fl-loader-done' always fires; hard cap 5.2s. Unit-tested geometry +
progress via ?fl3dtest=1 (6/6 PASS headless). Live: code merged into
main bundle by vite, present on production HTML.

### Loader v2 + quantum theme — DEPLOYED (commit c7f9282)

- cmatrix rain (chemistry glyphs: element symbols/Greek/hex) behind the
  3D molecule; stops on loader completion
- π-electron clouds: two additive tori above/below benzene ring, inflate
  during final assembly, counter-rotate + breathe
- QUANTUM theme: new signature dark look (#04060d canvas, #22d3ee cyan,
  #a78bfa violet); homepage defaults to it on first visit
- Fixed 3 theme-stompers (main.js/enhanced.js/index inline script) that
  re-rolled random themes over FOUC choice; quantum added to all theme
  lists + 425 enumerated CSS selector lines across main/mobile/
  index-overrides/theme css
- Fixed #fl-matrix flex-crush bug (unpositioned canvas crushed orbital
  to 0 height)
- LIVE-VERIFIED: quantum default in HTML, matrix canvas present,
  141 quantum selectors in live CSS bundle, pi/matrix code in JS bundle

### No outstanding bugs. Remaining optional items:

- Tree-shaken lucide ESM per page (~90KB gz savings; large refactor)
- Inline critical CSS for the ~1s emulated font-CSS chain
- Bump actions/\* versions in deploy.yml (Node 20 deprecation annotation)

### Live-site smoke verification (post-deploy)

- https://shuvam-banerji-seal.github.io/robots.txt → 200, correct content
- /sitemap.xml → 200 (25 URLs)
- index.html serves lucide@1.33.0 (pinned), NO eager three.js tag
  (dynamic WebGL-gated loader present)
- github-projects.html contains B39 fix code (fetchAllRepos/cache)

### Done this session (after recovering from interrupted prior session)

1. **B39 (critical)** github-projects infinite API loop → fixed+verified (ok-checks, array guard,
   early-exit, page cap, 15-min cache w/ stale-while-error).
2. Wave B regression sweep: every previously-fixed bug re-verified intact (B01,B02,B17,B18,
   B32,B33,B34,B35,B38,B38', terminal alignment, theme toggle) — see 05-audit-log.md.
3. Optimizations O1–O6: repo cache; three.js lazy-load on WebGL probe (index); lucide pinned
   @1.33.0 (28 files); font @import removed → per-page links carry Source Code Pro;
   tools-main.js libs on-demand (ensureLib); tools.html 60KB script → inline openTool shim.
4. Lighthouse audits (mobile+desktop): robots.txt created (+sitemap.xml) → SEO 100;
   a11y fixes B41–B47 (aria-labels incl. 448 music buttons, contrast ≥4.5:1 everywhere,
   body-margin overflow reset) → axe serious/critical = 0 on 7 key pages.
5. Responsive: 10 pages × 390/800/1440 = zero horizontal overflow.
6. Final gates green: npm test 11/11, blog tests pass, vite build ✓.

### Deploy step — COMPLETE

- Staged all source + robots.txt + sitemap.xml + llm-config.json; excluded
  .playwright-mcp/, wave\*.png, plans/, .rigor-trash/ (local artifacts/docs).
- Commit 9a8c080 → pushed → Actions run green → live smoke checks pass.

### Optional next steps (no bugs outstanding)

- Tree-shaken lucide ESM per page (~90KB gz savings; large refactor).
- Inline critical CSS to cut the ~1s emulated font-CSS chain.
- Bump actions/\* versions in deploy.yml (Node 20 deprecation annotation).

### Known-env-only (not bugs)

- Headless WebGL (three.js/3Dmol now gracefully skipped entirely).
- GitHub API rate limits (handled: fast-fail + cache fallback).
- corsproxy 429 on paper-finder semantic source (graceful alert).

### Owner action items (out of code scope)

- Rotate the Modal API key leaked in git history (commit 3f41677, B17).
