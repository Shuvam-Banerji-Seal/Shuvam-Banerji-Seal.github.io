/**
 * terminal.js: the homepage hero terminal. A typed boot sequence, then a
 * working input line. Commands are a fixed registry (see COMMANDS); nothing
 * is sent anywhere. Click the terminal to skip the boot sequence.
 *
 * Output classes (term-*) are styled with Element tokens in home.css, so the
 * terminal follows light and dark themes without its own palette.
 */
/* ----- Terminal typewriter + interactive shell ----- */
(function () {
  const termBody = document.getElementById("term-body");
  if (!termBody) return;

  // Output lines are written as HTML, so anything the visitor typed is
  // escaped before it is echoed back.
  const esc = (t) =>
    String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ── Command registry ────────────────────────────────────────────────────
  const COMMANDS = {
    help: () => [
      // Column convention: cmd padded to 18 mono chars, then ": desc".
      '<span class="term-help-title">Available commands:</span>',
      '  <span class="term-help-cmd">whoami            </span>  display current user',
      '  <span class="term-help-cmd">cat role.txt      </span>  show current role',
      '  <span class="term-help-cmd">ls research/      </span>  list research areas',
      '  <span class="term-help-cmd">ls projects/      </span>  list featured projects',
      '  <span class="term-help-cmd">cat about.txt     </span>  brief biography',
      '  <span class="term-help-cmd">cat skills.md     </span>  technical skills',
      '  <span class="term-help-cmd">cat contacts.txt  </span>  contact info',
      '  <span class="term-help-cmd">git log           </span>  recent activity',
      '  <span class="term-help-cmd">pwd               </span>  print working directory',
      '  <span class="term-help-cmd">date              </span>  current date/time',
      '  <span class="term-help-cmd">uname -a          </span>  system info',
      '  <span class="term-help-cmd">python3 demo.py   </span>  run a quick demo',
      '  <span class="term-help-cmd">tools              </span>  list launchable tools',
      '  <span class="term-help-cmd">open &lt;tool&gt;        </span>  jump straight to a tool',
      '  <span class="term-help-cmd">neofetch           </span>  system info, arch-style',
      '  <span class="term-help-cmd">history            </span>  recent commands',
      '  <span class="term-help-cmd">echo &lt;text&gt;        </span>  say it back',
      '  <span class="term-help-cmd">orbital &lt;name&gt;     </span>  redraw the figure: 1s 2p 3dz2 3dxy 4f',
      '  <span class="term-help-cmd">./run-research.sh </span>  show research pipeline',
      '  <span class="term-help-cmd">clear             </span>  clear terminal',
      '  <span class="term-help-cmd">exit              </span>  close terminal',
    ],
    whoami: () => ["Shuvam Banerji Seal"],
    pwd: () => ["/home/shuvam/portfolio"],
    date: () => [new Date().toString()],
    "uname -a": () => [
      "ArchBox GNU/Linux x86_64 6.6.68-LTS, shuvam@archbox",
    ],
    "cat role.txt": () => [
      '<span class="term-arrow">&gt;</span> Computational Chemist &amp; AI Researcher',
      '<span class="term-arrow">&gt;</span> BS-MS Student, IISER Kolkata (2022–2027)',
      '<span class="term-arrow">&gt;</span> Chemistry Major · Computer Science Minor',
    ],
    "ls research/": () => [
      // even 3-space separation between directory columns.
      '<span class="term-dir">DFT-Catalysis/</span>   <span class="term-dir">RAG-Systems/</span>   <span class="term-dir">TREC-NLP/</span>   <span class="term-dir">Mol-Dynamics/</span>',
      '<span class="term-dir">Protein-Struct/</span>   <span class="term-dir">LLM-Inference/</span>   <span class="term-dir">IR-Research/</span>',
    ],
    "ls projects/": () => [
      // project dir padded to 18 mono chars, then ": desc".
      '<span class="term-project">hybrid-rag/       </span>  RAG pipeline for IISER-K intranet',
      '<span class="term-project">trec-retrieval/   </span>  TREC 2024 NLP retrieval system',
      '<span class="term-project">dft-catalyst/     </span>  DFT modelling of transition states',
      '<span class="term-project">mol-dynamics-sim/ </span>  GROMACS protein folding study',
      '<span class="term-project">sbs-portfolio/    </span>  this website :)',
    ],
    "cat about.txt": () => [
      "I'm Shuvam, a BS-MS student at IISER Kolkata pursuing",
      "Chemistry with a Computer Science minor. My research",
      "focuses on computational chemistry, information retrieval",
      "systems, and AI-driven solutions for scientific challenges.",
      "",
      "I've developed advanced RAG architectures for verifiable",
      "answer synthesis, engineered retrieval models for TREC,",
      "and conducted DFT computational modeling of catalysts.",
    ],
    "cat skills.md": () => [
      '<span class="term-skill-comp"># Computational</span>: DFT/B3LYP · Gaussian 16 · ORCA · VASP · PyMOL',
      '<span class="term-skill-ai"># AI/ML</span>: RAG Systems · FAISS · Transformers · LLMs · BM25',
      '<span class="term-skill-prog"># Programming</span>: Python · Java · C/C++ · JavaScript · Three.js',
      '<span class="term-skill-tools"># Tools</span>: Git · Docker · Streamlit · Lucene · SQLite',
    ],
    "cat interests.md": () => [
      "> Hybrid RAG for Scientific QA",
      "> DFT Modelling of Catalysts",
      "> Protein Structure & Molecular Dynamics",
    ],
    "cat contacts.txt": () => [
      // labels padded to 8 chars so the colons align.
      '<span class="term-contact-label">email   </span>: sbs22ms076@iiserkol.ac.in',
      '<span class="term-contact-gh">github  </span>: github.com/Shuvam-Banerji-Seal',
      '<span class="term-contact-li">linkedin</span>: linkedin.com/in/mastersbs',
      '<span class="term-contact-orcid">orcid   </span>: orcid.org/0009-0000-0714-569X',
    ],
    "git log": () => [
      '<span class="term-commit">commit a8f3c2d</span> (HEAD -&gt; main)  Add ATP 3D viewer',
      "Author: Shuvam Banerji Seal &lt;sbs22ms076@iiserkol.ac.in&gt;",
      "Date:   " + new Date().toDateString(),
      "",
      '<span class="term-commit">commit 34ff07b</span>  fix: resolve npm ci lockfile drift',
      '<span class="term-commit">commit 91ed23a</span>  feat: resume page redesign (molecular terminal)',
      '<span class="term-commit">commit 5b2918e</span>  feat: unified theme system + FOUC fix',
    ],
    "python3 demo.py": () => [
      "Python 3.12.3 | IISER-K Research Environment",
      '&gt;&gt;&gt; <span class="term-code">import rag_pipeline as rag</span>',
      '&gt;&gt;&gt; <span class="term-code">docs = rag.retrieve("DFT catalyst", top_k=5)</span>',
      '<span class="term-status-ok">Retrieving...</span> BM25 + dense vectors',
      '<span class="term-status-ok">Found 5 relevant documents. Generating answer...</span>',
      '&gt;&gt;&gt; <span class="term-code">print(docs[0].score)</span>',
      "0.9421",
      '&gt;&gt;&gt; <span class="term-comment"># Try: cat projects/ for more</span>',
    ],
    "./run-research.sh": () => [
      '<span class="term-status-ok">[INIT]</span>   Loading molecular environment...',
      '<span class="term-status-ok">[LOAD]</span>   ATP.pdb → 44 atoms parsed ✓',
      '<span class="term-status-ok">[LOAD]</span>   RAG index: 12,847 documents ✓',
      '<span class="term-status-ok">[RUN]</span>    DFT geometry optimisation (B3LYP/6-31G*)...',
      '<span class="term-status-wait">[WAIT]</span>   Gaussian 16 running... converged in 42 cycles',
      '<span class="term-status-ok">[DONE]</span>   ΔG‡ = 18.4 kcal/mol (transition state)',
      '<span class="term-status-ok">[DONE]</span>   Research pipeline complete.',
    ],
    tools: () => [
      '<span class="term-help-title">Launchable tools. Use: open &lt;name&gt;</span>',
      '  <span class="term-help-cmd">open balancer      </span>  equation balancer',
      '  <span class="term-help-cmd">open molweight     </span>  molecular weight calc',
      '  <span class="term-help-cmd">open periodic      </span>  periodic table explorer',
      '  <span class="term-help-cmd">open pdfstudio     </span>  13-mode PDF suite',
      '  <span class="term-help-cmd">open audiostudio   </span>  browser DAW',
      '  <span class="term-help-cmd">open webcam        </span>  webcam tester + air guitar',
      '  <span class="term-help-cmd">open playground    </span>  live HTML/CSS/JS editor',
      '  <span class="term-help-cmd">open beam          </span>  P2P file sharing',
      '  <span class="term-help-cmd">open papers        </span>  multi-source paper search',
      '  <span class="term-help-cmd">open mermaid       </span>  diagram editor',
      '  <span class="term-help-cmd">open games         </span>  chemistry games',
      '  <span class="term-help-cmd">open resume        </span>  CV page',
    ],
    history: () =>
      history.length
        ? history
            .slice(0, 12)
            .reverse()
            .map((h, i) => `  ${(i + 1).toString().padStart(3)}  ${h}`)
        : ["(no history yet)"],
    echo: (...args) => [esc(args.join(" "))],
    neofetch: () => {
      const cur =
        document.documentElement.getAttribute("data-theme") || "dark";
      return [
        '<span class="term-nf-head">        shuvam@iiserk</span>',
        '<span class="term-nf-head">        -------------</span>',
        '  <span class="term-nf-key">OS</span>       Arch Linux (btw)',
        '  <span class="term-nf-key">Shell</span>    zsh 5.9',
        '  <span class="term-nf-key">Editor</span>   Neovim',
        '  <span class="term-nf-key">Field</span>    Comp. Chemistry + AI',
        '  <span class="term-nf-key">Focus</span>    DFT \u00B7 RAG \u00B7 ML potentials',
        '  <span class="term-nf-key">Theme</span>    ' + cur,
        '  <span class="term-nf-key">Uptime</span>   since 2022 @ IISER Kolkata',
      ];
    },
    // Drives the orbital figure beside the terminal (orbital.js listens).
    orbital: (arg) => {
      const names = {
        "1s": ["1s", "1s", 1, 0],
        "2p": ["2pz", "2p z", 2, 1],
        "2pz": ["2pz", "2p z", 2, 1],
        "3d": ["3dz2", "3d z²", 3, 2],
        "3dz2": ["3dz2", "3d z²", 3, 2],
        dz2: ["3dz2", "3d z²", 3, 2],
        "3dxy": ["3dxy", "3d xy", 3, 2],
        dxy: ["3dxy", "3d xy", 3, 2],
        "4f": ["4fxyz", "4f xyz", 4, 3],
        "4fxyz": ["4fxyz", "4f xyz", 4, 3],
      };
      if (!arg)
        return ["usage: orbital &lt;name&gt;   (1s, 2p, 3dz2, 3dxy or 4f)"];
      const hit = names[arg.toLowerCase().replace(/[\s_²]/g, (c) => (c === "²" ? "2" : ""))];
      if (!hit) return [`orbital: no orbital called '${esc(arg)}'  (try 1s, 2p, 3dz2, 3dxy, 4f)`];
      document.dispatchEvent(
        new CustomEvent("orbital:select", { detail: { id: hit[0] } }),
      );
      return [`Drawing the ${hit[1]} orbital: n = ${hit[2]}, l = ${hit[3]}. Watch the figure.`];
    },
    open: (arg) => {
      const routes = {
        balancer: "pages/tools/equation-balancer.html",
        molweight: "pages/tools/mol-weight.html",
        periodic: "pages/tools/periodic-table.html",
        ph: "pages/tools/ph-calculator.html",
        units: "pages/tools/unit-converter.html",
        pdfstudio: "pages/tools/pdf-studio.html",
        audiostudio: "pages/tools/audio-studio.html",
        webcam: "pages/tools/webcam-tester.html",
        guitar: "pages/tools/webcam-tester.html",
        playground: "pages/tools/playground.html",
        beam: "pages/tools/file-share.html",
        papers: "pages/tools/paper-finder.html",
        mermaid: "pages/mermaid-tool.html",
        games: "pages/tools/games.html",
        resume: "pages/resume.html",
        blog: "pages/blog.html",
        music: "pages/music.html",
      };
      if (!arg)
        return ["usage: open &lt;tool&gt;   (try 'tools' for the list)"];
      const route = routes[arg];
      if (!route) return [`open: unknown tool '${esc(arg)}'  (try 'tools')`];
      setTimeout(() => (window.location.href = route), 450);
      return [`Launching ${esc(arg)}\u2026`];
    },
    exit: () => [
      '<span class="term-error">Nice try. This terminal is load-bearing. Reload the page to reset it.</span>',
    ],
    clear: () => {
      termBody.innerHTML = "";
      return [];
    },
  };

  // ── Intro typewriter sequence ────────────────────────────────────────────
  const lines = [
    { type: "cmd", text: "whoami" },
    { type: "out", text: "Shuvam Banerji Seal", cls: "title-line" },
    { type: "cmd", text: "cat role.txt" },
    {
      type: "out",
      text: "> Computational Chemist & AI Researcher",
      cls: "highlight",
    },
    { type: "out", text: "> BS-MS Student, IISER Kolkata (2022-2027)" },
    { type: "cmd", text: "ls research/" },
    {
      type: "out",
      text: "DFT-Catalysis/   RAG-Systems/   TREC-NLP/   Mol-Dynamics/",
    },
    { type: "cmd", text: "cat interests.md" },
    { type: "out", text: "> Hybrid RAG for Scientific QA" },
    { type: "out", text: "> DFT Modelling of Catalysts" },
    { type: "out", text: "> Protein Structure & Molecular Dynamics" },
    { type: "hint", text: '# Type "help" for available commands' },
  ];

  let li = 0,
    ci = 0,
    el = null;
  const CD = 26,
    LD = 110;

  function mkLine(l) {
    if (l.type === "cmd") {
      const d = document.createElement("div");
      d.innerHTML =
        '<span class="term-prompt">[shuvam@archbox ~/portfolio]$ </span>';
      const s = document.createElement("span");
      s.className = "term-cmd";
      d.appendChild(s);
      termBody.appendChild(d);
      return s;
    } else if (l.type === "hint") {
      const d = document.createElement("div");
      d.className = "term-output term-hint";
      termBody.appendChild(d);
      return d;
    } else {
      const d = document.createElement("div");
      d.className = "term-output" + (l.cls ? " " + l.cls : "");
      termBody.appendChild(d);
      return d;
    }
  }

  // click-to-skip: flush the intro instantly (the boot runs about 7s)
  // The typewriter runs on chained timeouts; skipping must stop the chain,
  // or the pending type() call spawns a second input row.
  let skipped = false;
  // Focus the prompt only after the visitor has touched the terminal:
  // auto-focusing on load steals keyboard focus and can raise the
  // on-screen keyboard on phones.
  let engaged = false;
  termBody.addEventListener("pointerdown", () => (engaged = true));
  function flushIntro() {
    skipped = true;
    termBody.innerHTML = "";
    lines.forEach((l) => {
      const el = mkLine(l);
      el.innerHTML = l.text;
    });
    li = lines.length;
    spawnInput();
  }
  termBody.addEventListener("click", function skipIntro() {
    if (li >= lines.length) return;
    termBody.removeEventListener("click", skipIntro);
    flushIntro();
  });

  function type() {
    if (skipped) return;
    if (li >= lines.length) {
      spawnInput();
      return;
    }
    const l = lines[li];
    if (!el) {
      el = mkLine(l);
      ci = 0;
    }
    if (ci < l.text.length) {
      el.textContent += l.text[ci++];
      termBody.scrollTop = termBody.scrollHeight;
      setTimeout(
        type,
        l.type === "out" || l.type === "hint" ? CD / 2 : CD,
      );
    } else {
      el = null;
      li++;
      setTimeout(type, LD);
    }
  }

  // ── Interactive input ────────────────────────────────────────────────────
  function spawnInput() {
    const existing = termBody.querySelector(".term-input");
    if (existing) {
      if (engaged) existing.focus({ preventScroll: true });
      return;
    }
    const row = document.createElement("div");
    row.className = "term-input-row";
    row.innerHTML =
      '<span class="term-prompt">[shuvam@archbox ~/portfolio]$ </span><span class="term-field"><span class="term-measure" aria-hidden="true"></span><span class="term-caret" aria-hidden="true"></span></span>';
    const field = row.querySelector(".term-field");
    const measure = row.querySelector(".term-measure");
    const caret = row.querySelector(".term-caret");
    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "term-input";
    inp.autocomplete = "new-password";
    inp.spellcheck = false;
    inp.setAttribute("aria-label", "Terminal command");
    inp.setAttribute("data-lpignore", "true");
    inp.setAttribute("data-form-type", "other");
    inp.setAttribute("autocorrect", "off");
    inp.setAttribute("autocapitalize", "off");
    field.prepend(inp);
    termBody.appendChild(row);

    // The native caret blinks and cannot be stopped from CSS, so the
    // input's caret is hidden and a steady bar is placed after the
    // typed text, measured from a hidden copy of it.
    const placeCaret = () => {
      measure.textContent = inp.value.slice(
        0,
        inp.selectionStart ?? inp.value.length,
      );
      caret.style.transform = `translateX(${measure.offsetWidth}px)`;
    };
    ["input", "keyup", "click", "focus", "select"].forEach((type) =>
      inp.addEventListener(type, placeCaret),
    );
    // preventScroll: without it, this focus yanks the user back to
    // the hero mid-read (global scroll-behavior:smooth animates it).
    if (engaged) inp.focus({ preventScroll: true });
    placeCaret();
    termBody.addEventListener("click", () =>
      inp.focus({ preventScroll: true }),
    );

    // history
    let history = [],
      hIdx = -1;

    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const cmd = inp.value.trim();
        inp.value = "";
        // echo command
        const echo = document.createElement("div");
        echo.innerHTML = `<span class="term-prompt">[shuvam@archbox ~/portfolio]$ </span><span class="term-cmd">${cmd.replace(/</g, "&lt;")}</span>`;
        termBody.insertBefore(echo, row);
        if (cmd) {
          history.unshift(cmd);
          hIdx = -1;
        }

        if (cmd === "clear") {
          termBody.innerHTML = "";
          spawnInput();
          return;
        }
        let fn = COMMANDS[cmd];
        let args = [];
        if (!fn) {
          // prefix commands that take arguments (echo/open)
          const sp = cmd.indexOf(" ");
          if (sp > -1) {
            const base = cmd.slice(0, sp);
            if (base === "echo" || base === "open" || base === "orbital") {
              fn = COMMANDS[base];
              args = [cmd.slice(sp + 1)];
            }
          }
        }
        if (fn) {
          const out = fn(...args);
          out.forEach((line) => {
            const d = document.createElement("div");
            d.className = "term-output";
            d.innerHTML = line;
            termBody.insertBefore(d, row);
          });
        } else if (cmd !== "") {
          const d = document.createElement("div");
          d.className = "term-output term-error";
          d.textContent = `bash: ${cmd}: command not found (try 'help')`;
          termBody.insertBefore(d, row);
        }
        termBody.scrollTop = termBody.scrollHeight;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (hIdx < history.length - 1) {
          hIdx++;
          inp.value = history[hIdx];
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (hIdx > 0) {
          hIdx--;
          inp.value = history[hIdx];
        } else {
          hIdx = -1;
          inp.value = "";
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        const partial = inp.value.trim();
        const match = Object.keys(COMMANDS).filter((k) =>
          k.startsWith(partial),
        );
        if (match.length === 1) inp.value = match[0];
        else if (match.length > 1) {
          const d = document.createElement("div");
          d.className = "term-output term-hint";
          d.textContent = match.join("   ");
          termBody.insertBefore(d, row);
          termBody.scrollTop = termBody.scrollHeight;
        }
      }
    });
  }

  // Typing is motion: with reduced motion the boot text appears at once.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    flushIntro();
  else setTimeout(type, 400);
})();
