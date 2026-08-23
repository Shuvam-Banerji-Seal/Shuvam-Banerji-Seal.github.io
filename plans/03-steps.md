# 03 — Steps (kept current)

## Rev 1 — Loop structure (completed)
1. Read all repo files (structure, page inventory, scripts, configs)
2. Create plans/ + .rigor-trash discipline
3. Spin up dev server + Playwright MCP harness (dev) and preview (prod build sim)
4. Wave 1 crawl: all 29 pages — errors/404s collected
5. Wave 2 feature tests: every tool page interacted (uploads, formulas, auth, API flows)
6. Fix batch 1: B01–B25, B30, B32–B38 confirmed bugs (each verified at runtime)
7. Wave 2b: github-projects, paper-finder, pdf tools, audio-studio, youtube, llm pages, notes, thermo
8. LOOP-BACK wave 3: full recrawl + regression of ALL pages → found+fixed music.html edit regression
9. Production verification: `npm run build` (3× green) + deploy.yml simulation (`cp -r assets/books/assets_for_my_website`) + preview crawl 29/29 + live-prod spot checks
10. Final verification wave: npm test, blog tests, build, node --check all edited JS

## Rev 2 — Terminal alignment task (2026-08-18)
1. Reproduce+measure alignment defect (geometry audit; could not view screenshot — model lacks image input)
2. Root-cause: read ALL terminal CSS (5 breakpoints + theme overrides) + JS COMMANDS/typewriter/echo
3. Fix: pre-wrap+word-break, explicit text-align:left, normalize 4 COMMANDS tables to fixed-width columns
4. Verify: per-column x-audit desktop/tablet/mobile × themes, wrap/overflow check, build, interactive regression
