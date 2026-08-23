# 04 — Decisions / Discoveries / Reversals

## Decisions
| ID | Decision | Rationale | Rejected |
|----|----------|-----------|----------|
| D1 | Dev server (:5199) primary test target; vite preview (:4173) of deploy-sim dist for prod fidelity | dev ≠ bundled prod paths | testing only live site (no iteration on fixes) |
| D2 | B17 fix = remove key from source + external optional config; NOT full auth overhaul | minimal, reversible; key already leaked → rotation is the real fix, owner action | rewrite with serverless backend (out of scope) |
| D3 | Invidious list refreshed + timeouts, NOT feature removal | playlist fetch may work for real users who pass bot challenges; graceful error otherwise | delete playlist feature (scope cut) |
| D4 | B38/B38': honest result UI when compression grows files; download original | truthful UX over broken metric | fake a capped 0% silently (same, but kept misleading label) |

## Discoveries
| ID | Finding | Impact | Status |
|----|---------|--------|--------|
| X1 | Vite bundles page-local JS into hashed chunks; deploy copies root assets/ over dist (pre-existing), which masks stale hashed-bundle refs | explains mermaid 404-in-bare-dist vs green-in-CP/CI | documented, no change |
| X2 | CI deploy.yml checks out submodules → generate-music works in CI even without local submodule | local build needs `git submodule update --init` | env note |
| X3 | Edit regression possible when target file was reformatted since first read (music.html B27 orphan `return`) | caught by loop-back crawl, fixed | lesson logged |

## Reversals
| ID | What changed | From→To | Why |
|----|--------------|---------|-----|
| R1 | B03 severity | med bug → cosmetic | module dedupe by URL: navbar ran once always |
| R2 | B04, B05, B23 | suspected bugs → NOT bugs | playwright/curl evidence contradicted static suspicion |
| R3 | B14 | "never wired" bug → dormant intentional UI | button hidden + all 96 repos render |

## Session 2026-08-23 additions
| ID | Decision | Rationale | Rejected |
|----|----------|-----------|----------|
| D5 | Footer small text uses --text-secondary, not a new per-theme --text-soft | secondary passes AA in all 9 themes (computed); 9 new variables = more code for same result; hierarchy kept via size/tracking/uppercase | per-theme soft tokens |
| D6 | --text-muted left below AA elsewhere | muted is decorative hierarchy (hints, large text ≥3:1 large-text threshold); axe serious=0 restored with footer-only change | sitewide muted bump (would flatten hierarchy) |
| D7 | CSS size gate asserts gzip <30KB + raw <200KB | guard's intent is wire cost; raw-only threshold false-positives the by-design B49 aggregated index bundle | raising raw limit silently |
| D8 | mermaid-tool excluded from polish/progress-bar | page is self-contained React chrome without main.css; adding main.css risked global style collisions for marginal gain | adding main.css there |
| D9 | Stub pages get full heads | old URLs are crawler-landed; comprehensive suite requires parity; zero runtime risk (inline style block still wins cascade) | leaving stubs bare |
