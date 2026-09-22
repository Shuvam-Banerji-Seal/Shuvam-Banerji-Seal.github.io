# 08 — Fullscreen Timer app (feature spec, Rev 1 — 2026-09-18)

Status: IN PROGRESS. Requested by user: add https://github.com/alphakevin/fullscreen-timer as an
app, plus (a) negative timer after zero, (b) buzzer on time-up, (c) light-crimson overtime colour,
(d) sequences of labelled segments ("Talk 15" → "Q&A 5") running one after another.

## 1. Reference analysis (alphakevin/fullscreen-timer, MIT)

Verified this session by fetching README + `src/App.js` [VERIFIED: GitHub, this session]:
| Behaviour | Reference | Our decision |
|---|---|---|
| Big MM:SS clock, 500 ms interval | `setInterval(tick, 500)` | Replaced: `requestAnimationFrame` + wall-clock deltas (background-tab safe) |
| Countdown OR stopwatch (`S`) | `mode` state | Kept: `S` toggles both modes |
| Fullscreen toggle (`F`, double-click) | `requestFullscreen()` no catch | Kept + try/catch (headless/blocked browsers must not throw) |
| Edit time with arrows | ±1 s / ±60 s | Kept: ↑/↓ ±1 min on the selected segment; ←/→ move selection |
| Reset (`R`), start/pause (`Space`) | | Kept |
| Wake Lock while running | `navigator.wakeLock` | Kept, best-effort |
| At zero | clamps to 0 and pauses | **Changed (requirement): keep going negative, count up** |

## 2. Feature spec (locked)

1. **Negative timer.** Countdown crosses zero and keeps counting up; display `-MM:SS`; progress bar
   saturates; the clock switches to `--ft-overtime`. Only the operator advances or resets.
2. **Buzzer on time-up.** Web Audio only (no asset files): 3 short beeps (square 880 Hz + 660 Hz
   undertone), gain-enveloped to avoid clicks. Fires once per segment crossing (guarded by
   `buzzedIndex`). AudioContext is created lazily on a user gesture and `resume()`d (autoplay policy).
3. **Light crimson overtime.** `--ft-overtime: #ff8fa3` on dark themes; light theme override
   `#d94a63` so the crimson keeps ≥ 4.5:1 on the cream background. Warning colour `--ft-warning`
   for the final 10 s.
4. **Sequence of labelled segments.** Default `Talk 15:00` → `Q&A 5:00`; add/remove/reorder/edit;
   stage shows current label, index `i / n`, and "Next: <label> <time>"; `N` advances.
   - "Next" at zero: manual by default (so overtime is visible), or automatic when
     _Auto-advance_ is on (advances exactly at zero; no overtime shown for that segment).
   - Last segment: overtime runs until reset/exit (no next).
5. **Extras kept from reference + ours:** stopwatch mode, fullscreen, wake lock, keyboard map,
   custom durations (`15`, `15:00`, `0:06`, `1:02:03`), final-10s tick sound (toggleable),
   mute toggle, last-10s warning colour, localStorage persistence (`ft:v1`), 9 theme support,
   reduced-motion guards, live-region announcements.

## 3. Keyboard map (documented in-page)

| Key   | Action                       |
| ----- | ---------------------------- |
| Space | start / pause                |
| N     | next segment                 |
| B     | previous segment             |
| R     | reset current segment        |
| S     | toggle countdown / stopwatch |
| F     | toggle fullscreen            |
| M     | mute / unmute                |
| Esc   | exit fullscreen (browser)    |

Guarded: keys are ignored while typing in `input`/`textarea`.

## 4. Files

| File                                | Role                                                             |
| ----------------------------------- | ---------------------------------------------------------------- |
| `pages/tools/fullscreen-timer.html` | Page (tool-page shell + setup view + stage view)                 |
| `assets/css/fullscreen-timer.css`   | All styles (no inline styles; solid colours only)                |
| `assets/js/fullscreen-timer.js`     | Engine: parse/format, rAF loop, audio, segments, keys, wake lock |
| `assets/js/navbar.js`               | Apps dropdown entry                                              |
| `pages/tools.html`                  | Tool card + `openTool` mapping                                   |
| `vite.config.mjs`                   | Rollup input (dist survival)                                     |
| `public/sitemap.xml`                | URL entry                                                        |
| `tests/comprehensive-tests.js`      | Wiring assertions (page/js/css/navbar/vite/sitemap)              |

## 5. Acceptance criteria — all verified 2026-09-18 (deployed 574a7d5)

- [x] Countdown 0:12 → 0:00 → `-00:03` while `#ft-clock` carries `.is-overtime`; computed colour equals
      `--ft-overtime` (`#ff8fa3`; `#d94a63` on the light theme) — verified live on production.
- [x] Exactly one buzzer burst per zero-crossing: engine-level counters show `timeUp = 1` and 6 tones
      (3×880 Hz + 3×659.25 Hz); oscillator tallies were instrumentation noise (nested wrappers).
- [x] Default `Talk 15:00 → Q&A 05:00`; `N` advances label/index/duration live; auto-advance moves at zero.
- [x] Space/R/S/F/M verified; typing in an input does not trigger shortcuts; arrows edit the selected segment.
- [x] Fullscreen request succeeds (or is caught when denied); exit restores title, scroll lock and setup view.
- [x] 9 themes: overtime crimson resolves; primary control ≥ 5.79:1 contrast in every theme; no horizontal
      overflow at 390/800/1440.
- [x] Suites green: `npm test` 11/11, comprehensive 1247/1247 with 0 warnings, build 208/208; the page passes
      every automated page check (meta, links, icons, a11y, duplicate IDs).
- [x] dist + production contain the page and its assets; live URLs return 200; mermaid editor still renders
      with the lazy engine; github-projects shows 109/109 valid links live.
