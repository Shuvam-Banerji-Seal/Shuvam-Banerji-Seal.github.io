# design.md — Homepage redesign spec (Ricardo Chance–inspired, chemistry identity)

Status: ACTIVE spec — written 2026-08-25. Reference: ricardochance.com (design-engineer portfolio).
Note: intended to be authored by an independent agent; provider outage → authored in-session. Same content either way.

## 0. Reference analysis (what makes ricardochance.com work)

1. **One unforgettable sentence** in the hero — not a job title, a claim.
2. **Dual CTA** — primary action + low-commitment "view work".
3. **Positioning paragraph** directly under the hero — one paragraph, first person, no buzzwords.
4. **Editorial typographic bands** between sections — huge type, no cards, pure statement.
5. **Featured work as the centerpiece** — few projects, large cards, "See live" links.
6. **Numbered capabilities** — 01…06, each: number, title, one-line hook, two-sentence body.
7. **Numbered process** — 01→04 short steps.
8. **Giant contact closer** — "Interested in working together?" + huge email link.
9. Generous whitespace, restrained motion, typography does the talking.

## 1. Design principles (adapted to a scientist portfolio)

- **Claim, don't list.** The hero states what Shuvam builds, not what he studies.
- **Chemistry is the material, code is the medium.** Every decorative element is a real molecule or a real command — never abstract decoration.
- **Few projects, shown big.** Six featured works with live links beat twenty thumbnails.
- **Solid ink.** No gradients — flat surfaces, one accent per theme, hairline borders.
- **Type is the interface.** Space Grotesk display for statements, JetBrains Mono for the "lab instrument" voice, Inter for reading.
- **Motion as evidence of craft** — reveals and drift only where they explain something; everything respects prefers-reduced-motion.
- **Numbers are content** — 186 LAMMPS commands, 4 structure formats, 448-track library: real metrics as design elements.

## 2. Section-by-section spec

### 2.1 Hero — "The Claim" (rework of existing hero)

- Layout: keep the two-column hero grid (terminal left, molecule viewer right) — it is the signature. ADD above the grid a full-width statement block:
  - Kicker (mono, uppercase, letterspaced, accent): `COMPUTATIONAL CHEMIST × AI RESEARCHER`
  - H1 statement (Space Grotesk 700, clamp(2.4rem → 4.2rem), tight leading):
    "I build software that turns chemistry into something you can touch."
  - Dual CTA row: primary solid accent **View Featured Work** (→ #work) + ghost **Open the Lab** (→ pages/tools.html).
- The terminal keeps its typewriter intro; the ATP viewer stays.
- Delete: nothing structural; the old hero had no statement — this adds it.

### 2.2 Positioning paragraph (new, directly under hero)

- One paragraph, max-width 62ch, Inter 1.05–1.15rem, text-secondary:
  "I work where molecular simulation meets the web. I've published retrieval
  research at TREC, modelled catalysts with DFT, and built browser-native
  tools that scientists actually use — a GPU-accelerated structure viewer, a
  browser DAW, a 448-track player. Not just functional — crafted."
- Motion: fade-up on scroll (existing reveal system).

### 2.3 Featured Work (rework of #projects → id="work")

- Section header: kicker `SELECTED WORK.sdf` + title "Featured Work".
- Grid: 2 columns × 3 rows (1 col mobile). Each card:
  - top row: mono index `01`…`06` + project-type label
  - title (Space Grotesk 600, 1.35rem)
  - 2-line description
  - tech tags (existing .tech-tag)
  - footer row: status + **"See live ↗"** / "Source ↘" links (real URLs)
- Cards (content locked):
  1. **Molecule3D — LAMMPS Web GUI** · WebGPU/3D tooling · GPU-accelerated 3D molecular viewer + LAMMPS workbench: 186-command script builder, compiler helper, dump-trajectory playback, 4 structure formats. Live: https://shuvam-banerji-seal.github.io/lammps-web-gui/ · React 19 · three.js · TypeScript. Status: Live.
  2. **Hybrid RAG Architecture** (existing copy) — status Completed (2025).
  3. **TREC Retrieval Model** (existing) — Published (2024).
  4. **DFT Catalyst Modeling** (existing) — To Be Submitted (2025).
  5. **GTK4 NLP Application** (existing) — Completed (2024).
  6. **Protein Structure Analysis** (existing) — Ongoing.
- Delete: the old "More on GitHub" dashed card (GitHub link moves to footer/contact row).

### 2.4 Capabilities (new section, replaces the skills.json card placement)

- Header: kicker `CAPABILITIES.json` + title "What I do".
- Numbered grid 3×2 (1-col mobile). Each: mono number, title, one-line hook, 2-sentence body.
  01 Molecular Simulation — LAMMPS/GROMACS pipelines…; 02 DFT & Quantum Chemistry — Gaussian 16/ORCA, B3LYP…; 03 RAG & Information Retrieval — FAISS, BM25, TREC…; 04 Scientific Web Tools — browser-native instruments…; 05 3D & Visualization — three.js, WebGL, CPK…; 06 Research Engineering — Python/Java/C, testing, CI.
- The detailed skills matrix STAYS in About (unchanged) — capabilities is the narrative, skills.json is the reference.

### 2.5 Editorial band (new, between Capabilities and About/Contact)

- Full-width, huge Space Grotesk line (clamp(1.8rem → 3.4rem)), max 20ch per line:
  "From bond lengths to build pipelines — the details are the design."
- No card, no border box; hairline top/bottom borders; generous padding.

### 2.6 About (keep, light polish)

- Keep log-blocks, bio, skills.json matrix, profile card, social buttons. No structural change this wave.

### 2.7 Contact closer (rework of #contact tail)

- Above the existing form grid, add the closer block:
  - Kicker `CONTACT.gjf`
  - Huge line: "Interested in working together?" (Space Grotesk, clamp(2rem → 3.6rem))
  - Giant email link: sbs22ms076@iiserkol.ac.in (mono, clamp(1.1rem → 2rem), accent, underline on hover)
- The GJF-styled contact info + Formspree form stay as-is below.

### 2.8 Footer — keep as-is (already redesigned).

## 3. Typography system

- Display: Space Grotesk 600/700; statement sizes clamp(2.4rem, 5vw, 4.2rem); section titles clamp(1.6rem, 3vw, 2.5rem).
- Body: Inter 400/500, 0.95–1.15rem, line-height 1.7.
- Instrument voice: JetBrains Mono for kickers, indexes, statuses (0.7–0.8rem, uppercase, letter-spacing 0.14em).
- Rhythm: section padding-block clamp(4rem, 8vw, 7rem); card gap 1.25rem; max text width 62ch.

## 4. Color & tokens

- Use existing vars: --bg-deep/--bg-primary/--bg-card, --text-primary/secondary/muted, --accent-cyan/--accent-purple, --border. --grad-primary is solid now.
- Accent discipline: ONE accent per surface. Cards: border hairline + accent on hover only. Numbers/kickers: accent at 80% opacity.
- New utility classes (index-overrides.css): `.hero-claim`, `.hero-cta-row`, `.positioning`, `.work-grid`, `.work-card`, `.cap-grid`, `.cap-card`, `.editorial-band`, `.contact-closer`, `.giant-mail`.

## 5. Motion spec

- Reveals: existing IntersectionObserver fade-up (34px, 750ms, outCubic, 60ms delay) applied to new blocks via .fade-in.
- Molecule constellation: drift + slow rotation + cursor repulsion (separate work, home-cinematics.js).
- Hover: cards translate -3px + border-color accent (200ms). Giant mail: underline slides in.
- Reduced motion: all of the above collapse to opacity-only or none (existing REDUCED guards).

## 6. Migration plan (ordered edits)

1. index.html hero: insert claim block above `.hero` grid; add dual CTAs.
2. index.html: insert positioning paragraph section after hero.
3. index.html: rework #projects → id="work" (keep old id as anchor alias), 6 work cards per §2.3 (add Molecule3D card with live link), delete "More on GitHub" card.
4. index.html: insert Capabilities section after work.
5. index.html: insert editorial band after capabilities.
6. index.html: insert contact closer at top of #contact.
7. index-overrides.css: append §2 utility styles (solid colors, no gradients).
8. home-cinematics.js: molecule constellation (separate task — molecules replace star dots).
9. Verify: build, axe, 390/800/1440 widths, both themes.

## 7. Acceptance criteria

- [ ] Hero shows claim + dual CTA before the fold content.
- [ ] Featured Work shows 6 cards incl. Molecule3D with working live link.
- [ ] Capabilities grid 01–06 renders; editorial band renders.
- [ ] Contact closer with giant email renders above the form.
- [ ] Zero `linear-gradient` in new CSS; contrast ≥ 4.5:1 for new text.
- [ ] No horizontal overflow at 390/800/1440; axe serious/critical = 0.
- [ ] Terminal, ATP viewer, form, theme toggle all still work.
