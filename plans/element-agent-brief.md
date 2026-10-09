# Element migration: brief for page agents

Read this whole file, then plans/design-element.md, before editing.

You are fixing part of the personal website at /store/shuvam/Shuvam-Banerji-Seal.github.io (static HTML/CSS/JS, built with Vite). The site is moving to a new visual system called "Element". FIRST read plans/design-element.md completely: it is your spec. Also read assets/css/theme.css (tokens) and assets/css/element.css (shared components), but DO NOT edit those two files, assets/js/navbar.js, index.html, assets/css/home.css, assets/js/orbital.js, assets/js/thinking-orb.js, scripts/lint-design.js, tests/*, or any file outside YOUR SCOPE (listed at the end). If you need something changed in those files, say so in your final report instead.

Goal for your files: remove every generic AI/SaaS design cliché and make them follow the spec, WITHOUT breaking any functionality.

How to fix each pattern (in CSS files, inline <style> blocks, style="" attributes, and JS strings that write styles or markup):
- Decorative gradients (linear/radial/conic) -> a solid token: page areas var(--paper), panels/inputs var(--surface), subtle fills var(--surface-2), primary fills var(--nitrogen), selected/active wash var(--nitrogen-wash). Keep a gradient ONLY if it encodes data (spectrum, colour scale, audio level meter, a value's progress); then add the comment /* data */ on the same line.
- Gradient/clipped text (background-clip:text, -webkit-text-fill-color: transparent) -> delete those properties, use color: var(--ink).
- Glow/halo shadows (box-shadow/text-shadow/drop-shadow with "0 0 Npx" blur, --glow-* variables) -> delete. Floating layers (dropdowns, modals, toasts, popovers) may use box-shadow: var(--lift). Cards/panels: box-shadow: none.
- backdrop-filter / glassmorphism -> delete; use a solid background var(--surface).
- Fonts: Inter / Space Grotesk / Poppins / Montserrat -> var(--font-body) (big headings may use var(--font-display) with font-stretch: 68%). JetBrains Mono / Source Code Pro -> var(--font-mono), and use mono ONLY for code, terminals, numeric/formula inputs or column-aligned data. Labels and captions must not be monospace. Remove Google Fonts links/imports for banned fonts if any remain (the correct link is already in each page head).
- Cream/beige colours (#faf3e8, #f2e6d0, #ede0c8, #fef5e7, rgba(255,248,235,...) etc.) -> tokens.
- Pills (border-radius 999px/9999px/50px) on TEXT labels, badges, tags or chips -> var(--r-s). Round controls (play buttons, slider thumbs, avatars, colour swatches, toggle knobs, status dots that are not animated) may stay round.
- Tracked-out ALL-CAPS labels (text-transform: uppercase with letter-spacing) -> remove both properties and write the label in sentence case.
- Infinite pulse / glow / float / shimmer animations -> remove. A spinner that shows real loading and a blinking terminal caret may stay.
- Coloured side stripes (border-left >= 2px in an accent colour on cards/blocks) -> remove, or use a full 1px var(--rule) border. A blockquote in long-form reading may keep a 2px var(--rule) left border.
- Rounded-square icon tiles above headings (emoji/icon inside a tinted square box) -> remove the box; keep a small inline icon beside the text at text size, or drop it.
- Cards nested in cards -> flatten (remove the inner card's border/background/shadow).
- Big "stat" numbers with tiny labels -> ordinary text size ("448 tracks").
- 01/02/03 labels on things that are not a real sequence -> remove. Real step-by-step sequences may keep numbers.
- Kicker labels styled as code comments or file names ("// Submit Request", "/* BIOGRAPHY */", "SKILLS.json", "STATUS: ONLINE") -> remove, or turn into a plain sentence-case heading. No "all systems operational" or pulsing "online" dots.
- Hard-coded colours (#hex/rgb/rgba) used for UI chrome -> tokens (--ink, --graphite, --rule, --rule-strong, --surface, --surface-2, --paper, --nitrogen, --nitrogen-wash, --oxygen, --oxygen-wash, --on-nitrogen). Functional data colours (element categories, chart series, waveform colours) may stay.
- Old theme-specific selectors ([data-theme="quantum"], "dracula", "tokyo-night", "amber", "forest", "dark-coffee", "absolute-dark") are dead: delete those rules. Keep a [data-theme="dark"] rule only when tokens truly cannot express it.
- Hover effects: no translateY lift, no scale, no glow. Use a border-color or background change (150ms).
- Visible copy: no em dashes (— or &mdash;): rewrite with a comma, colon, full stop or brackets. No marketing words (supercharge, unlock, seamless, elevate, cutting-edge, next-gen, blazing, powerful, effortless, revolutionary, introducing). Button text says what happens ("Download PDF", "Balance equation"). Sentence case. Keep every fact, number, name and link.

Hard constraints:
- Do not change JavaScript behaviour, element IDs, form actions, URLs, or any class name that JS or other CSS relies on (grep before renaming anything; prefer not renaming at all).
- Do not delete features, sections, tools, or content. Only restyle and rewrite copy.
- Keep files valid (balanced braces, well-formed HTML). For every JS file you edit, run `node --check <file>`.
- Do NOT use any browser / Playwright / chrome-devtools tools (the lead agent is using the browser). Do NOT run git commands that change state (no commit, checkout, reset, stash, restore). Do not start servers.
- Prefer small, precise edits (Edit tool) over rewriting whole large files.

Verification you must run before finishing:
1. `node scripts/lint-design.js <each file in your scope>` must report 0 errors for your files. Fix warnings that are real clichés (caps labels, pills on text, infinite pulses, side stripes); leave justified ones (e.g. a round play button) and list them.
2. `node tests/basic-tests.js` and `node tests/comprehensive-tests.js` must still pass. Other agents are editing other files at the same time, so if a failure is in a file outside your scope, report it and do not touch it.

Final report (short): files changed; lint errors before -> after per file; warnings you intentionally kept and why; anything you could not fix; any class/ID you renamed (should be none).

Your scope is given in your task prompt.
