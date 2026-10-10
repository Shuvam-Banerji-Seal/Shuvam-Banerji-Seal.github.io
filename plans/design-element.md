# Element: the site's visual system (v4, 2026-10-09)

Replaces the 9-theme "terminal / quantum / creamy coffee" system. Every page on
the site follows this file. Agents editing pages: read all of it before you
touch anything, and run `node scripts/lint-design.js <files>` before you finish.

## Subject

Shuvam Banerji Seal, fifth-year BS-MS student at IISER Kolkata (chemistry major,
CS minor). Publishes retrieval and LLM research (ECIR 2026, FIRE 2025, TREC
2024), works in computational chemistry (DFT, LAMMPS), builds scientific
software (Molecule3D / lammps-web-gui), co-founded iFiNN and UnderWater AI, and
hosts ~20 browser tools on this site.

Readers: PIs and admissions committees, collaborators, recruiters, and students
who use the tools. The site's job: show in ten seconds who he is and what he
has made, then route people to the CV, the papers, the code, and the tools.

## Palette: the CPK atom colours

The colours come from CPK, the colour code every molecular viewer (including
his own Molecule3D) uses for atoms. Each token has one job.

| Token        | Light     | Dark      | Job                                                 |
| ------------ | --------- | --------- | --------------------------------------------------- |
| `--paper`    | `#F7F8FA` | `#1B1E23` | Page ground (hydrogen white / epoxy lab bench)      |
| `--surface`  | `#FFFFFF` | `#24282E` | Inputs, tool work areas, dropdowns, dialogs         |
| `--ink`      | `#1A1D22` | `#ECEEF1` | Text (carbon)                                       |
| `--graphite` | `#59606A` | `#A2A9B3` | Secondary text, captions                            |
| `--rule`     | `#DADDE3` | `#363C44` | Hairlines, input borders                            |
| `--nitrogen` | `#2445C2` | `#8FA4FF` | Links, primary actions, focus ring, orbital − phase |
| `--oxygen`   | `#C92A39` | `#FF6170` | Orbital + phase, errors, recording. Sparingly       |
| `--sulfur`   | `#F2C94C` | `#E9C547` | `::selection` and `<mark>` only                     |

Legacy variable names (`--accent`, `--accent-cyan`, `--bg-card`, ...) still
exist and are mapped onto these in `assets/css/theme.css`. Prefer the new
names in new code. Never hard-code hex colours in pages; use tokens.

Only two modes exist: light and dark. The old theme names (`quantum`, `dracula`,
`tokyo-night`, ...) are aliases of dark so saved preferences keep working.
Default follows `prefers-color-scheme`; the navbar toggle flips and saves.

## Type

- **Archivo** (variable, `wdth` 62–125, `wght` 100–900) for all reading and UI.
  - Display: `font-stretch: 68%`, weight 760–820, tracking -0.01em,
    line-height 0.95–1.05. Sentence case.
  - Body: `font-stretch: 100%`, weight 400, 17px / 1.6. Max 68ch per line.
  - UI and small text: 14–15px, weight 500. Never all caps, never tracked out.
- **IBM Plex Mono** only inside code, terminals, numeric/formula inputs and
  data tables where columns must align. Never for labels, kickers or captions.
- Google Fonts URL (use exactly this; remove Inter, Space Grotesk, JetBrains
  Mono, Source Code Pro links):
  `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=IBM+Plex+Mono:wght@400;500;600&display=swap`
- Scale (px): 13 · 15 · 17 · 21 · 26 · 34 · 44 · 60 · 84. Headings use
  `--font-display` settings, body uses `--font-body`.
- Chemical formulas use real `<sub>`/`<sup>`, e.g. C<sub>10</sub>H<sub>16</sub>N<sub>5</sub>O<sub>13</sub>P<sub>3</sub>.

## Shape, depth, space

- Radii by hierarchy: `--r-s: 4px` (tags, small controls), `--r-m: 8px`
  (buttons, inputs), `--r-l: 14px` (tool panels, dialogs). Sections: 0.
- Shadows only on layers that float above the page (dropdown, dialog, toast):
  `--lift`. Cards and panels sit flat with a 1px `--rule` border or none.
- Space scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 · 112. Sections separate by
  space (72–112px), not by dividers.
- Layout: left aligned. Container `min(1200px, 100% - 2 * gutter)`, gutter
  `clamp(16px, 4vw, 48px)`. No horizontal scroll at 360px.

## Motion

- One signature moment: the homepage orbital (`assets/js/orbital.js`).
  Samples accumulate on load; buttons morph between orbitals; drag rotates.
- The `thinking-orb` component (`assets/js/thinking-orb.js`) is the only
  waiting/"thinking" indicator (LLM tools, long jobs). Monochrome ink dots.
- Motion that answers an action is fine (open, expand, confirm, 150–250ms).
- No scroll-triggered fade-ups on every section, no hover lift on every card,
  no infinite pulses or blinking dots (a terminal caret is the one exception).
- `prefers-reduced-motion: reduce` turns off all non-essential motion.

## Writing

- Plain, specific sentences. Say what a thing is or does. Sentence case.
- No marketing words: supercharge, unlock, seamless, elevate, cutting-edge,
  next-gen, blazing, powerful, effortless, revolutionary, "Introducing".
- Avoid em dashes in visible copy. Use a full stop, comma, colon or brackets.
- Buttons say what happens: "Download PDF", "Balance equation", "Open tool".
- No `// comment`-style or `file.ext` kicker labels above headings.

## Banned (the lint script checks these)

1. Purple/violet/indigo gradients, or any decorative gradient (`linear-gradient`,
   `radial-gradient`, `conic-gradient`) used as a background wash.
   Allowed: functional gradients inside data visualisation (spectra, colour
   maps, waveform meters, the periodic-table legend), with a comment `/* data */`.
2. Inter, Space Grotesk, JetBrains Mono, Poppins, Montserrat as typefaces.
3. Gradient text (`background-clip: text`, `-webkit-text-fill-color: transparent`).
4. "Introducing"/"New"/"Beta" pill badges; `border-radius: 999px/9999px/50px`
   on text labels (allowed on round controls like play buttons, sliders, avatars).
5. Glows and halos: coloured `box-shadow`/`text-shadow`/`drop-shadow` with blur
   ≥ 12px used for glow, `--glow-*` variables, blurred blobs behind content.
6. Frosted glass: `backdrop-filter`, `.glassmorphic` styling.
7. Rounded-square icon tiles above headings (emoji/icon in a tinted square).
   An icon may sit inline before a label at text size, or not at all.
8. Identical N-card grids where a list or table would carry the content better.
9. Cards nested inside cards.
10. Coloured side stripes (`border-left` ≥ 2px accent) on cards/blocks.
    Allowed: blockquote in long-form reading, with `--rule` colour.
11. Oversized statistic numbers with tiny labels ("10M+", "450+ tracks").
12. Tiny 01/02/03 labels on things that are not a real sequence.
13. Pulsing "online"/"operational" dots; infinite pulse/glow animations.
14. Marketing copy and em-dash-heavy phrasing (see Writing).
15. Beige/cream/parchment backgrounds.
16. Decorative italic serif display type.

## Components (in `assets/css/element.css`, loaded last on every page)

- `.btn` (secondary: ink text, 1px rule border, surface bg) and `.btn-primary`
  (nitrogen bg, white text). 8px radius, 40px min height, no lift on hover;
  hover darkens/underlines.
- Links: nitrogen, underline offset 0.18em, thickness 1px; hover thickness 2px.
- Inputs: surface bg, 1px rule border, 8px radius; focus = 2px nitrogen ring.
- `.panel`: surface bg, 1px rule border, `--r-l`. The single container for a
  tool's work area. Never put a panel in a panel; use spacing and headings.
- `.tag`: 13px text, `--r-s`, 1px rule border, graphite text. Not pills.
- Lists of things (projects, posts, tools, papers): rows separated by space or
  a 1px rule, with title + one-line description + plain-text links.

## Page checklist for agents

1. Replace the Google Fonts link with the URL above.
2. Add `<link rel="stylesheet" href="/assets/css/element.css" />` as the LAST
   stylesheet in `<head>` (after every other link and after inline `<style>`
   blocks in the head).
3. In the page's own inline `<style>` and markup, remove every banned pattern.
   Replace hard-coded colours with tokens.
4. Rewrite visible copy that breaks the Writing rules. Keep facts, names, links.
5. Do not change JavaScript behaviour, element IDs, form actions, or links,
   except where JS injects banned styles or copy.
6. Run `node scripts/lint-design.js <your files>` until it reports 0 errors,
   then `node tests/basic-tests.js` and `node tests/comprehensive-tests.js`.

## Rev 2026-10-11: palette and type v2 (supersedes the CPK colours and Archivo above)

The CPK palette and Archivo read as stale. v2 keeps the chemistry idea (a lab bench,
two signs of a wavefunction) but the colours are chosen for this site, not for a
viewer.

| Token | Light | Dark | Job |
| --- | --- | --- | --- |
| `--paper` | `#F1F4EE` | `#0B1311` | page: lab-bench green-grey |
| `--surface` | `#FBFCF9` | `#132120` | panels, inputs |
| `--surface-2` | `#E4EAE2` | `#1B2D2A` | fills, code, hover |
| `--ink` | `#0F1B18` | `#E7F0EB` | text |
| `--graphite` | `#4D5F58` | `#9AAEA5` | secondary text |
| `--rule` / `--rule-strong` | `#D2DBD3` / `#A9B8AE` | `#2A3D39` / `#4A605A` | lines |
| `--nitrogen` | `#00776F` (teal) | `#3CCFC4` | links, primary actions, focus |
| `--oxygen` | `#E0432A` (vermilion) | `#FF7458` | the + lobe, alerts, record |
| `--sulfur` | `#FFC93C` | `#F2C94C` | selection, one highlight |

Dynamic colour: the homepage accent takes the colour of the orbital's active lobes
(teal for the negative sign, vermilion for the positive), and it eases between them
when the orbital changes. Other pages use the static tokens above.

Type v2:
- Display: **Newsreader** (roman, never italic), 500 to 700, optical size on. Large
  headings and the name only.
- Body: **Hanken Grotesk** 400/500/600, 17px / 1.6.
- Terminal and code only: **Martian Mono**. Never for labels or captions.
- Sentence case everywhere. No all-caps tracking.
