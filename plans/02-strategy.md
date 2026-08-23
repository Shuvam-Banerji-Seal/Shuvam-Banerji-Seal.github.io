# 02 — Strategy

## Chosen strategy (Rev 1 — 2026-08-18)

1. **Serve the source tree with Vite dev server** (`npx vite --port 5199`) — this is exactly what CI builds; `public/` files served at root; module resolution works for all 26 entries.
2. **Playwright MCP browser tools** (user-directed): drive the real browser via `playwright_browser_*` MCP tools — per page: `navigate` → wait → `console_messages` (errors) → `network_requests` (404s/failures) → `snapshot`/`click`/`type` for feature tests. Classification:
   - CDN/external failures → record but not a repo bug (unless UI breaks because of it)
   - local asset 404 / JS exception / console.error → repo bug
3. **Feature tests** (wave 2+): scripted interaction for terminal commands, theme toggle x7, nav dropdowns, mobile menu, contact form (mock route), music player UI, each tool's core computation (equation balancer, mol weight, pH, unit converter, periodic table, games), mermaid editor render, blog loader, github projects fetch (live), paper-finder, youtube metadata.
4. Fix bugs step-locked (one commit-worthy change at a time), re-run affected page tests, then **loop back** to bug identification for a full wave. Exit when a full wave is clean.
5. Keep `npm test` + `vite build` green at all times.

## Rejected alternatives

- `python3 http.server`: can't resolve vite-specific things (modulepreload for mermaid tool is fine, but no publicDir merge semantics identical to CI) and no HMR; slower feedback. Rejected.
- Fix-by-static-only: violates A3; runtime testing is mandated by user. Rejected.
- Testing production URL (shuvam-banerji-seal.github.io): user said "read all files here" — the deliverable is this repo's state; prod may be stale. Use local only. Rejected.

## Loop definition

```
WAVE N:
  1. identify: run full crawl + console/network capture          ← loops back here
  2. triage: add confirmed bugs to plans/05-audit-log.md
  3. fix: one bug → verify with targeted Playwright test
  4. regression: re-run affected pages + npm test
  END WAVE when audit-log has no open S/P items of high/med severity
FINAL WAVE: full crawl must be clean; then npm test; then vite build; report.
```
