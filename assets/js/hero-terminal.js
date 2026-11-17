/**
 * hero-terminal.js: the homepage terminal. It types `neofetch`, builds the
 * ASCII portrait (assets/data/portrait-ascii.json, made by
 * scripts/generate-ascii-portrait.py) cell by cell while the facts beside it
 * appear, then hands over a working prompt.
 *
 * Commands are a fixed registry (see COMMANDS). `search` and `open` use the
 * site's BM25 index (site-search.js); `orbital` drives the benzene figure.
 * Nothing typed here leaves the browser.
 *
 * The facts are plain HTML in index.html, so crawlers and no-JS readers get
 * them; this script only animates their arrival.
 */
import { search } from "./site-search.js";

const root = document.getElementById("hero-terminal");
if (root) init(root);

function init(root) {
  const body = root.querySelector("[data-term-body]");
  const out = root.querySelector("[data-term-out]");
  const form = root.querySelector("[data-term-form]");
  const input = form.querySelector("input");
  const art = root.querySelector("[data-portrait]");
  const nf = root.querySelector(".nf");
  const typed = root.querySelector("[data-type]");
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PS1 = '<span class="ps1">shuvam@iiserkol <b>~</b> $</span>';

  const esc = (t) =>
    String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ------------------------------------------------------------ portrait
  const portrait = fetch("/assets/data/portrait-ascii.json")
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  const CELL_ASPECT = 0.54; // glyph advance / line height, as generated
  const NOISE = "#%@*+=-:;/\\|<>?";
  let layers = [];
  let variant = null;
  let ratio = 0.6;

  async function measureFont() {
    try {
      await document.fonts.load('400 20px "Martian Mono"');
    } catch (_) {
      /* fall back to the system mono metrics */
    }
    const probe = document.createElement("span");
    probe.textContent = "M".repeat(50);
    probe.style.cssText =
      "position:absolute;visibility:hidden;white-space:pre;font:400 100px var(--font-mono);font-variation-settings:'wdth' 100";
    root.appendChild(probe);
    ratio = probe.getBoundingClientRect().width / 50 / 100 || 0.6;
    probe.remove();
  }

  function layout(data) {
    if (!data || !art) return null;
    const bw = body.clientWidth - 24;
    const wide = bw >= 560;
    const v = wide ? data.wide : data.narrow;
    const w = wide ? Math.min(360, Math.max(260, bw * 0.46)) : Math.min(bw, 380);
    const fs = w / (v.cols * ratio);
    const lh = (fs * ratio) / CELL_ASPECT;
    art.style.setProperty("--art-w", `${w}px`);
    art.style.setProperty("--art-h", `${Math.ceil(v.rows * lh)}px`);
    art.style.setProperty("--art-fs", `${fs}px`);
    art.style.setProperty("--art-lh", `${lh}px`);
    return v;
  }

  function makeLayers() {
    art.textContent = "";
    layers = ["l0", "l1", "l2", "l3", "l4"].map((c) => {
      const pre = document.createElement("pre");
      pre.className = c;
      art.appendChild(pre);
      return pre;
    });
  }

  // Paint the grid at time t (ms since start); returns true when settled.
  function paint(v, start, end, t) {
    const rows = v.rows;
    const bufs = [[], [], [], [], []];
    let settled = true;
    for (let r = 0; r < rows; r++) {
      const line = v.lines[r] || "";
      const lev = v.levels[r] || "";
      const rowB = ["", "", "", "", ""];
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === " ") {
          for (let k = 0; k < 5; k++) rowB[k] += " ";
          continue;
        }
        const i = r * 200 + c;
        let k;
        let g = ch;
        if (t < start[i]) {
          g = " ";
          k = -1;
          settled = false;
        } else if (t < end[i]) {
          g = NOISE[(i * 7 + ((t / 45) | 0)) % NOISE.length];
          k = 4;
          settled = false;
        } else {
          k = Math.min(3, +lev[c] || 0);
        }
        for (let q = 0; q < 5; q++) rowB[q] += q === k ? g : " ";
      }
      for (let q = 0; q < 5; q++) bufs[q].push(rowB[q]);
    }
    layers.forEach((pre, q) => (pre.textContent = bufs[q].join("\n")));
    return settled;
  }

  async function buildPortrait(animate) {
    const data = await portrait;
    if (!data) return;
    await measureFont();
    variant = layout(data);
    if (!variant) return;
    makeLayers();
    const v = variant;
    const start = new Float32Array(v.rows * 200);
    const end = new Float32Array(v.rows * 200);
    let seed = 1234567;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let r = 0; r < v.rows; r++) {
      for (let c = 0; c < 200; c++) {
        const i = r * 200 + c;
        // A sweep from the top, with noise so the edge looks like decoding.
        start[i] = (r / v.rows) * 950 + rnd() * 260 + (c / 200) * 120;
        end[i] = start[i] + 120 + rnd() * 260;
      }
    }
    if (!animate) {
      paint(v, start, end, 1e9);
      return;
    }
    const t0 = performance.now();
    await new Promise((resolve) => {
      function step(now) {
        if (paint(v, start, end, now - t0)) return resolve();
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  let lastW = 0;
  new ResizeObserver(async () => {
    const w = body.clientWidth;
    if (!variant || Math.abs(w - lastW) < 8) return;
    lastW = w;
    const data = await portrait;
    const v = layout(data);
    if (v !== variant) {
      variant = v;
      makeLayers();
      paint(v, new Float32Array(v.rows * 200), new Float32Array(v.rows * 200), 1);
    }
  }).observe(body);

  // ------------------------------------------------------------ boot
  async function revealInfo(animate) {
    const rows = [...nf.querySelectorAll(".nf-info > *, .nf-info dl > div")].filter(
      (el) => el.tagName !== "DL",
    );
    for (const el of rows) {
      el.classList.add("is-shown");
      if (animate) await sleep(70);
    }
    nf.classList.remove("is-pending");
  }

  async function boot() {
    const animate = !REDUCED;
    if (animate && typed) {
      const word = typed.dataset.type;
      typed.textContent = "";
      for (const ch of word) {
        typed.textContent += ch;
        await sleep(55 + Math.random() * 40);
      }
      await sleep(180);
    }
    await Promise.all([buildPortrait(animate), revealInfo(animate)]);
    lastW = body.clientWidth;
  }

  if (!REDUCED) nf.classList.add("is-pending");
  if (document.documentElement.classList.contains("intro-running")) {
    document.addEventListener("intro:done", boot, { once: true });
  } else {
    boot();
  }

  // ------------------------------------------------------------ commands
  const PAPERS = [
    ["2026", "ECIR", "AgriIR: domain-specific knowledge retrieval", "https://doi.org/10.1007/978-3-032-21324-2_37"],
    ["2026", "CIKM*", "SycoLex: sycophancy in legal case reasoning", "https://huggingface.co/datasets/ShuvBan/SycoLex"],
    ["2025", "FIRE", "Hierarchical opinion classification with LLMs", "https://ceur-ws.org/Vol-4173/T10-3.pdf"],
    ["2024", "TREC", "Tip-of-tongue retrieval: reformulation + layered BM25", "https://trec.nist.gov/pubs/trec33/papers/IISER-K.tot.pdf"],
  ];
  const PROJECTS = [
    ["molecule3d", "LAMMPS workbench in the browser", "https://shuvam-banerji-seal.github.io/lammps-web-gui/"],
    ["agriir", "configurable RAG with citations", "https://github.com/Shuvam-Banerji-Seal/AgriIR"],
    ["iiserkonnect", "campus app, 2,000+ testers", "https://github.com/Shuvam-Banerji-Seal/iiserkonnect-website"],
    ["dft-notes", "DFT from Hohenberg–Kohn up", "https://shuvam-banerji-seal.github.io/DFT-notes/"],
    ["mol-sim-intro", "molecular simulation talk", "https://github.com/Shuvam-Banerji-Seal/introduction-to-molecular-simulation"],
    ["shaders", "GLSL for beginners", "https://shuvam-banerji-seal.github.io/shaders-for-beginners/"],
  ];
  const link = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`;
  const pad = (s, n) => (s + " ".repeat(n)).slice(0, Math.max(n, s.length));

  const COMMANDS = {
    help: () => [
      '<span class="t-acc">commands</span>',
      "  whoami            who this is",
      "  about             a short biography",
      "  papers            publications",
      "  projects          things I have built",
      "  tools             tools that run on this site",
      "  search &lt;words&gt;    BM25 search over the whole site",
      "  open &lt;tool&gt;       jump to a tool, e.g. open pdf",
      "  orbital &lt;1-6&gt;     pick a benzene π orbital (or homo, lumo)",
      "  cv, contact       CV and how to reach me",
      "  theme light|dark  switch the colour theme",
      "  neofetch, intro   replay the portrait or the intro",
      "  clear, history    tidy up",
    ],
    whoami: () => ["Shuvam Banerji Seal"],
    about: () => [
      "Fifth-year BS-MS student at IISER Kolkata: chemistry major,",
      "computer science minor. I work on information retrieval and",
      "language-model evaluation, simulate molecules with DFT and",
      "molecular dynamics, and write the software both need.",
      "Co-founder of iFiNN and UnderWater AI. Reviewer for AAAI and ICWSM.",
    ],
    papers: () => [
      ...PAPERS.map(([y, v, t, u]) => `<span class="t-dim">${y}</span>  ${pad(v, 6)} ${link(u, t)}`),
      '<span class="t-dim">* under review.  all:</span> ' + link("/pages/research.html", "/pages/research.html"),
    ],
    projects: () => [
      ...PROJECTS.map(([n, d, u]) => `${link(u, pad(n, 14))} ${esc(d)}`),
      '<span class="t-dim">more:</span> ' + link("/pages/projects.html", "/pages/projects.html"),
    ],
    tools: () => [
      "chemistry   periodic-table  mol-weight  equation-balancer  ph  molecule-viz",
      "documents   pdf-studio  paper-finder  reader  mermaid  units",
      "media       audio-studio  image-studio  music  air-guitar  youtube",
      "code, llm   llm-studio  llm-chat  playground  apis  beam  timer",
      '<span class="t-dim">open one with</span> open &lt;name&gt;',
    ],
    cv: () => [
      `web  ${link("/pages/resume.html", "/pages/resume.html")}`,
      `code ${link("https://github.com/Shuvam-Banerji-Seal/My-CV", "github.com/Shuvam-Banerji-Seal/My-CV")}`,
    ],
    contact: () => [
      `email     ${link("mailto:sbs22ms076@iiserkol.ac.in", "sbs22ms076@iiserkol.ac.in")}`,
      `github    ${link("https://github.com/Shuvam-Banerji-Seal", "Shuvam-Banerji-Seal")}`,
      `linkedin  ${link("https://www.linkedin.com/in/mastersbs", "mastersbs")}`,
      `orcid     ${link("https://orcid.org/0009-0000-0714-569X", "0009-0000-0714-569X")}`,
    ],
    ls: () => ['<span class="t-acc">research/  projects/  tools/  writing/</span>  about.txt  cv.pdf'],
    pwd: () => ["/home/shuvam"],
    date: () => [new Date().toString()],
    "uname -a": () => ["Linux iiserkol 6.12-arch x86_64 GNU/Linux"],
    sudo: () => ['<span class="t-err">shuvam is not in the sudoers file. This incident will be reported.</span>'],
    exit: () => ["There is no leaving. Try clear."],
  };
  COMMANDS.research = COMMANDS.papers;
  COMMANDS.email = COMMANDS.contact;
  COMMANDS["cat about.txt"] = COMMANDS.about;
  const NAMES = [...Object.keys(COMMANDS), "search", "open", "orbital", "theme", "neofetch", "intro", "clear", "history", "echo", "cat"];

  const history = [];
  let hIdx = 0;

  function print(lines, cls = "") {
    for (const l of lines) {
      const p = document.createElement("p");
      if (cls) p.className = cls;
      p.innerHTML = l;
      out.appendChild(p);
    }
    body.scrollTop = body.scrollHeight;
  }

  async function run(raw) {
    const cmd = raw.trim();
    print([`${PS1}${esc(cmd)}`]);
    if (!cmd) return;
    history.push(cmd);
    hIdx = history.length;
    const [head, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(" ");
    const lower = cmd.toLowerCase();

    if (COMMANDS[lower]) return print(COMMANDS[lower]());
    switch (head.toLowerCase()) {
      case "clear":
        out.textContent = "";
        return;
      case "history":
        return print(history.map((h, i) => `${String(i + 1).padStart(3)}  ${esc(h)}`));
      case "echo":
        return print([esc(arg)]);
      case "cat":
        return print([`<span class="t-err">cat: ${esc(arg)}: try about, papers or cv</span>`]);
      case "neofetch":
        nf.scrollIntoView({ block: "nearest", behavior: REDUCED ? "auto" : "smooth" });
        return buildPortrait(!REDUCED);
      case "intro":
        try {
          sessionStorage.removeItem("sbs-intro");
        } catch (_) {}
        location.href = "/?intro";
        return;
      case "theme": {
        const t = arg === "light" || arg === "dark" ? arg : document.documentElement.dataset.theme === "light" ? "dark" : "light";
        if (window.setSiteTheme) window.setSiteTheme(t);
        return print([`theme set to ${t}`]);
      }
      case "orbital":
      case "mo": {
        const key = arg.toLowerCase().replace(/^pi/, "").replace("π", "");
        const map = { homo: "2", lumo: "4" };
        const n = map[key] || key;
        if (!/^[1-6]$/.test(n)) return print(['<span class="t-err">usage: orbital 1-6, homo or lumo</span>']);
        document.dispatchEvent(new CustomEvent("stage:select", { detail: `pi${n}` }));
        return print([`showing π${n} in the figure`]);
      }
      case "search":
      case "grep":
      case "find": {
        if (!arg) return print(['<span class="t-err">usage: search &lt;words&gt;</span>']);
        const res = await search(arg, 6);
        if (!res.length) return print([`no matches for “${esc(arg)}”`]);
        return print([
          `<span class="t-dim">bm25 k1=1.2 b=0.75, ${res.length} best of the site index</span>`,
          ...res.map(
            (r) =>
              `<span class="t-score">${r.score.toFixed(2).padStart(5)}</span>  ${pad(r.doc.k || "Page", 10)} ${link(r.doc.u, r.doc.t)}`,
          ),
        ]);
      }
      case "open":
      case "cd": {
        if (!arg) return print(['<span class="t-err">usage: open &lt;tool or page&gt;</span>']);
        const res = await search(arg, 5);
        const best = res.find((r) => /Tool|Page|Article/.test(r.doc.k)) || res[0];
        if (!best) return print([`nothing called “${esc(arg)}”. Try tools.`]);
        print([`opening ${link(best.doc.u, best.doc.t)}…`]);
        setTimeout(() => (location.href = best.doc.u), 450);
        return;
      }
      default:
        return print([`<span class="t-err">zsh: command not found: ${esc(head)}</span>  <span class="t-dim">type help</span>`]);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = "";
    run(v);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      hIdx = Math.max(0, hIdx - 1);
      input.value = history[hIdx];
    } else if (e.key === "ArrowDown" && history.length) {
      e.preventDefault();
      hIdx = Math.min(history.length, hIdx + 1);
      input.value = history[hIdx] || "";
    } else if (e.key === "Tab" && input.value.trim()) {
      const v = input.value.trim().toLowerCase();
      const hit = NAMES.filter((n) => n.startsWith(v));
      if (hit.length === 1) {
        e.preventDefault();
        input.value = hit[0] + " ";
      } else if (hit.length > 1) {
        e.preventDefault();
        print([`${PS1}${esc(input.value)}`, hit.join("  ")]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      out.textContent = "";
    }
  });
  root.querySelectorAll("[data-cmd]").forEach((b) =>
    b.addEventListener("click", () => {
      run(b.dataset.cmd);
      input.focus({ preventScroll: true });
    }),
  );
  body.addEventListener("click", (e) => {
    if (e.target.closest("a, button") || String(getSelection())) return;
    input.focus({ preventScroll: true });
  });
}
