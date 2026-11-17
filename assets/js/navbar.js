/**
 * Shared site navigation (plans/design-element.md, rev 2026-11).
 *
 * Injects the top bar into #navbar-container on every page and owns the
 * light/dark preference. Markup is namespaced (.sn-*) and styled by the CSS
 * string below, so it looks the same whatever stylesheets a page loads.
 *
 * Desktop: links with a sliding indicator, disclosure menus for Projects,
 * Tools and Writing (hover on fine pointers, click and keyboard everywhere),
 * search button, theme toggle. Narrow screens: a menu button that morphs to
 * a close icon and opens a full-height sheet; the rest of the page becomes
 * inert while it is open and focus returns to the button on close.
 * The bar hides while scrolling down and returns on the way up.
 * Search: "/" or Ctrl/Cmd+K opens the BM25 site search (site-search.js).
 */

// ---------- Theme: a mode (light | dark) plus an optional named palette ----------
// Keep in step with the inline head script on every page and with the
// [data-palette] blocks in assets/css/theme.css. Swatches: paper, ink,
// accent (nitrogen), + lobe (oxygen).
const THEMES = [
  { id: "light", name: "Light", mode: "light", desc: "Lab-bench paper, teal and vermilion", sw: ["#F1F4EE", "#0F1B18", "#00776F", "#E0432A"] },
  { id: "dark", name: "Dark", mode: "dark", desc: "The same bench after hours", sw: ["#0B1311", "#E7F0EB", "#3CCFC4", "#FF7458"] },
  { id: "cpk", name: "CPK", mode: "light", desc: "Atom colours: nitrogen blue, oxygen red", sw: ["#F7F8FA", "#1A1D22", "#2445C2", "#D3303F"] },
  { id: "pencil", name: "Pencil", mode: "light", desc: "Graphite on paper, red-pen links", sw: ["#F2F2F1", "#141414", "#B3261E", "#2E2E2E"] },
  { id: "cyanotype", name: "Cyanotype", mode: "dark", desc: "White on Prussian blue", sw: ["#0B2545", "#EEF4FB", "#8FD3FF", "#FFB08A"] },
  { id: "sodium", name: "Sodium lamp", mode: "dark", desc: "Amber of the sodium D line, 589 nm", sw: ["#110C05", "#FFDCA8", "#FFB01F", "#FF6A3D"] },
  { id: "contrast", name: "High contrast", mode: "dark", desc: "Black and white, yellow links (AAA)", sw: ["#000000", "#FFFFFF", "#FFE14D", "#FF9A8F"] },
];
const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t]));
// Theme names from earlier versions of the site all meant "dark".
const DARK_ALIASES = ["dark", "quantum", "dark-coffee", "amber", "tokyo-night", "absolute-dark", "forest", "dracula"];

function isDarkTheme(theme) {
  return DARK_ALIASES.includes(theme) || THEME_BY_ID[theme]?.mode === "dark";
}

function savedTheme() {
  try {
    return localStorage.getItem("theme");
  } catch (_) {
    return null; /* storage blocked: follow the system */
  }
}

function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme() {
  const s = savedTheme();
  if (s && THEME_BY_ID[s]) return s;
  if (s) return "dark"; // a legacy dark alias
  return systemTheme();
}

function setThemeAttr(id) {
  const t = THEME_BY_ID[id] || THEME_BY_ID[isDarkTheme(id) ? "dark" : "light"];
  for (const el of [document.documentElement, document.body]) {
    if (!el) continue;
    el.setAttribute("data-theme", t.mode);
    if (t.id !== t.mode) el.setAttribute("data-palette", t.id);
    else el.removeAttribute("data-palette");
  }
  document.documentElement.style.colorScheme = t.mode;
  // Browser chrome (mobile address bar) follows the page colour.
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  if (metas.length) metas.forEach((m) => (m.content = t.sw[0]));
  else if (document.head) {
    const m = document.createElement("meta");
    m.name = "theme-color";
    m.content = t.sw[0];
    document.head.appendChild(m);
  }
}

setThemeAttr(resolveTheme());
// main.js binds its own theme toggles unless this flag is set.
window.__themeToggleWired = true;
window.SITE_THEMES = THEMES;

// ---------- Site map ----------
const TOOL_GROUPS = [
  {
    group: "Chemistry",
    items: [
      ["Periodic table", "/pages/tools/periodic-table.html", "Properties, configurations, isotopes"],
      ["Molecular weight", "/pages/tools/mol-weight.html", "Molar mass with a per-element breakdown"],
      ["Equation balancer", "/pages/tools/equation-balancer.html", "Balances reactions, shows the matrix"],
      ["pH calculator", "/pages/tools/ph-calculator.html", "Acids, bases and buffers"],
      ["Molecule viewer", "/pages/tools/molecule-viz.html", "PDB and SDF files in 3D"],
      ["Thermodynamics notes", "/pages/thermodynamics.html", "Open course notes"],
      ["Chemistry games", "/pages/tools/games.html", "Element quizzes"],
    ],
  },
  {
    group: "Documents and research",
    items: [
      ["PDF Studio", "/pages/tools/pdf-studio.html", "Compress, merge, split, convert"],
      ["Paper finder", "/pages/tools/paper-finder.html", "Semantic Scholar and arXiv"],
      ["Reader", "/pages/reader.html", "Markdown, maths and e-books"],
      ["Mermaid editor", "/pages/mermaid-tool.html", "Diagrams from text"],
      ["Unit converter", "/pages/tools/unit-converter.html", "Scientific units"],
    ],
  },
  {
    group: "Audio, image and video",
    items: [
      ["Audio Studio", "/pages/tools/audio-studio.html", "Record, edit, tune a guitar"],
      ["Image Studio", "/pages/tools/image-studio.html", "Compress and convert images"],
      ["Music player", "/pages/music.html", "My library, in the browser"],
      ["Webcam and air guitar", "/pages/tools/webcam-tester.html", "Strum with hand tracking"],
      ["YouTube downloader", "/pages/tools/youtube-downloader.html", "Video and audio"],
    ],
  },
  {
    group: "Language models and code",
    items: [
      ["LLM Studio", "/pages/tools/llm-studio.html", "GLM, GPT, Claude, Gemini, Groq"],
      ["LLM chat", "/pages/tools/llm-chat.html", "Bring your own key"],
      ["HTML playground", "/pages/tools/playground.html", "Edit and preview"],
      ["Public APIs", "/pages/apis.html", "800+ that need no key"],
      ["Beam file sharing", "/pages/tools/file-share.html", "Browser to browser"],
      ["Fullscreen timer", "/pages/tools/fullscreen-timer.html", "Talk timer with overtime"],
    ],
  },
];

const NAV = [
  { name: "Research", href: "/pages/research.html" },
  {
    name: "Projects",
    id: "projects",
    items: [
      ["Selected projects", "/pages/projects.html", "Software, research code and teaching"],
      ["Molecule3D", "https://shuvam-banerji-seal.github.io/lammps-web-gui/", "LAMMPS workbench in the browser"],
      ["GitHub repositories", "/pages/github-projects.html", "Every public repository, searchable"],
      ["Gallery", "/pages/gallery.html", "Figures and photographs"],
    ],
  },
  { name: "Tools", id: "tools", mega: true, groups: TOOL_GROUPS, footer: ["Every tool on one page", "/pages/tools.html"] },
  {
    name: "Writing",
    id: "writing",
    items: [
      ["Blog", "/pages/blog.html", "Retrieval, chemistry and code"],
      ["Notes", "/pages/notes.html", "Course and research notes"],
      ["Reader", "/pages/reader.html", "Markdown, maths and e-books"],
    ],
  },
  { name: "CV", href: "/pages/resume.html" },
];

const ICON = {
  theme: '<svg class="sn-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none"/></svg>',
  caret: '<svg class="sn-caret" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>',
  search: '<svg class="sn-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  moon: '<svg class="sn-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>',
  sun: '<svg class="sn-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  // Kekulé hexagon with the aromatic ring: benzene, the site's mark.
  mark: '<svg class="sn-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6 20.1 7.3v9.4L12 21.4 3.9 16.7V7.3Z"/><circle cx="12" cy="12" r="4.4"/></svg>',
};

const CSS = `
#site-nav{position:fixed;inset:0 0 auto 0;height:60px;z-index:1000;background:var(--paper);color:var(--ink);
  border-bottom:1px solid transparent;transition:transform .3s cubic-bezier(.2,.7,.2,1),border-color .2s}
#site-nav.is-scrolled{border-bottom-color:var(--rule)}
#site-nav.is-hidden{transform:translateY(-101%)}
#site-nav *{box-sizing:border-box}
#site-nav .sn-in{position:relative;width:min(1200px,100% - 2 * clamp(16px,4vw,48px));height:100%;margin:0 auto;
  display:flex;align-items:center;gap:16px}
#site-nav a{text-decoration:none}
#sn-sheet a{text-decoration:none}
#site-nav .sn-brand{display:inline-flex;align-items:center;gap:10px;color:var(--ink);font-family:var(--font-display);
  font-weight:650;font-size:19px;letter-spacing:-.005em;white-space:nowrap;padding:8px 0}
#site-nav .sn-mark{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linejoin:round}
#site-nav .sn-mark circle{stroke:var(--nitrogen);stroke-width:1.5}
#site-nav .sn-brand:hover .sn-mark{transform:rotate(60deg)}
#site-nav .sn-mark{transition:transform .5s cubic-bezier(.2,.7,.2,1)}
#site-nav .sn-links{display:flex;align-items:center;gap:2px;margin:0 0 0 auto;padding:0;list-style:none}
#site-nav .sn-item{position:relative}
#site-nav .sn-item--mega{position:static}
#site-nav .sn-link{display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 12px;border:0;background:none;
  border-radius:8px;color:var(--ink);font:500 15px/1 var(--font-body);cursor:pointer;white-space:nowrap}
#site-nav .sn-link:hover,#site-nav .sn-link[aria-expanded="true"],#site-nav .sn-link[aria-current="page"],#site-nav .sn-link.is-current{color:var(--nitrogen)}
#site-nav .sn-link:focus-visible,#site-nav .sn-icon:focus-visible,#site-nav .sn-search:focus-visible,#site-nav .sn-burger:focus-visible,#site-nav .sn-brand:focus-visible,#site-nav .sn-panel a:focus-visible,#sn-sheet a:focus-visible,#sn-sheet button:focus-visible{outline:2px solid var(--nitrogen);outline-offset:2px}
#site-nav .sn-caret,#sn-sheet .sn-caret{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.6;transition:transform .2s}
#site-nav .sn-link[aria-expanded="true"] .sn-caret{transform:rotate(180deg)}
#site-nav .sn-ind{position:absolute;left:0;top:0;height:2px;width:0;background:var(--nitrogen);border-radius:1px;
  opacity:0;pointer-events:none;transition:left .25s cubic-bezier(.2,.7,.2,1),width .25s cubic-bezier(.2,.7,.2,1),opacity .2s}
#site-nav .sn-ind.is-instant{transition:opacity .2s}
#site-nav .sn-panel{position:absolute;top:calc(100% + 6px);left:50%;min-width:280px;padding:10px;background:var(--surface);
  border:1px solid var(--rule);border-radius:14px;box-shadow:var(--lift);opacity:0;visibility:hidden;
  transform:translate(-50%,-6px);transition:opacity .16s,transform .16s,visibility 0s .16s}
#site-nav .sn-item.is-open>.sn-panel{opacity:1;visibility:visible;transform:translate(-50%,0);transition:opacity .16s,transform .16s}
#site-nav .sn-item--mega>.sn-panel{left:0;right:0;transform:translateY(-6px);padding:20px 20px 12px}
#site-nav .sn-item--mega.is-open>.sn-panel{transform:none}
#site-nav .sn-panel ul{list-style:none;margin:0;padding:0}
#site-nav .sn-panel a{display:block;padding:9px 12px;border-radius:8px;color:var(--ink)}
#site-nav .sn-panel a:hover{background:var(--surface-2)}
#site-nav .sn-panel a[aria-current="page"]{color:var(--nitrogen)}
#site-nav .sn-panel b{display:block;font:600 15px/1.3 var(--font-body)}
#site-nav .sn-panel small{display:block;margin-top:2px;font:400 13px/1.35 var(--font-body);color:var(--graphite)}
#site-nav .sn-mega{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 16px}
#site-nav .sn-mega h3{margin:0 0 4px;padding:0 12px;font:600 13px/1.4 var(--font-body);color:var(--graphite)}
#site-nav .sn-mega a{padding:6px 12px}
#site-nav .sn-mega b{font-size:14.5px}
#site-nav .sn-panel-foot{display:flex;justify-content:flex-end;margin-top:8px;padding-top:10px;border-top:1px solid var(--rule)}
#site-nav .sn-panel-foot a{color:var(--nitrogen);font:500 14px/1 var(--font-body);padding:8px 12px}
#site-nav .sn-actions{display:flex;align-items:center;gap:6px;margin-left:8px}
#site-nav .sn-svg,#sn-sheet .sn-svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
#site-nav .sn-search{display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 8px 0 12px;border:1px solid var(--rule);
  border-radius:8px;background:var(--surface);color:var(--graphite);font:500 14px/1 var(--font-body);cursor:pointer}
#site-nav .sn-search:hover{border-color:var(--rule-strong,var(--graphite));color:var(--ink)}
#site-nav .sn-search kbd{font:500 12px/1 var(--font-mono);padding:4px 6px;border:1px solid var(--rule);border-radius:4px;color:var(--graphite)}
#site-nav .sn-icon{display:inline-grid;place-items:center;width:40px;height:40px;border:0;border-radius:8px;background:none;color:var(--ink);cursor:pointer}
#site-nav .sn-icon:hover{background:var(--surface-2)}
#site-nav .sn-burger{display:none;position:relative;width:44px;height:44px;border:0;border-radius:8px;background:none;cursor:pointer;color:var(--ink)}
#site-nav .sn-burger span{position:absolute;left:12px;width:20px;height:2px;border-radius:1px;background:currentColor;
  transition:transform .3s cubic-bezier(.2,.7,.2,1),opacity .2s}
#site-nav .sn-burger span:nth-child(1){top:15px}#site-nav .sn-burger span:nth-child(2){top:21px}#site-nav .sn-burger span:nth-child(3){top:27px}
#site-nav .sn-burger[aria-expanded="true"] span:nth-child(1){transform:translateY(6px) rotate(45deg)}
#site-nav .sn-burger[aria-expanded="true"] span:nth-child(2){opacity:0;transform:scaleX(.2)}
#site-nav .sn-burger[aria-expanded="true"] span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}
#sn-sheet{position:fixed;inset:60px 0 0 0;z-index:999;background:var(--paper);color:var(--ink);overflow-y:auto;
  overscroll-behavior:contain;visibility:hidden;clip-path:inset(0 0 100% 0);
  transition:clip-path .34s cubic-bezier(.2,.7,.2,1),visibility 0s .34s}
#sn-sheet.is-open{visibility:visible;clip-path:inset(0 0 0 0);transition:clip-path .34s cubic-bezier(.2,.7,.2,1)}
#sn-sheet .sn-sheet-in{width:min(640px,100% - 32px);margin:0 auto;padding:16px 0 calc(32px + env(safe-area-inset-bottom))}
#sn-sheet .sn-anim{opacity:0;transform:translateY(10px);transition:opacity .28s,transform .28s;transition-delay:calc(var(--i,0) * 35ms + 70ms)}
#sn-sheet.is-open .sn-anim{opacity:1;transform:none}
#sn-sheet .sn-sheet-search{display:flex;align-items:center;gap:10px;width:100%;min-height:48px;padding:0 14px;border:1px solid var(--rule);
  border-radius:8px;background:var(--surface);color:var(--graphite);font:400 16px/1 var(--font-body);cursor:pointer;text-align:left}
#sn-sheet .sn-sheet-main{list-style:none;margin:20px 0 0;padding:0}
#sn-sheet .sn-sheet-main>li{border-bottom:1px solid var(--rule)}
#sn-sheet .sn-sheet-main>li>a,#sn-sheet .sn-sheet-main>li>button{display:flex;align-items:center;justify-content:space-between;width:100%;
  min-height:60px;padding:6px 2px;border:0;background:none;color:var(--ink);font:600 26px/1.15 var(--font-display);cursor:pointer;text-align:left}
#sn-sheet .sn-sheet-main>li>a[aria-current="page"]{color:var(--nitrogen)}
#sn-sheet .sn-sheet-main .sn-caret{width:18px;height:18px}
#sn-sheet .sn-sheet-main button[aria-expanded="true"] .sn-caret{transform:rotate(180deg)}
#sn-sheet .sn-sub{padding:2px 0 18px}
#sn-sheet .sn-sub[hidden]{display:none}
#sn-sheet .sn-sub h3{margin:14px 0 4px;font:600 13px/1.4 var(--font-body);color:var(--graphite)}
#sn-sheet .sn-sub ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:0 12px}
#sn-sheet .sn-sub a{display:flex;align-items:center;min-height:44px;color:var(--ink);font:500 16px/1.25 var(--font-body)}
#sn-sheet .sn-sub a[aria-current="page"]{color:var(--nitrogen)}
#sn-sheet .sn-sheet-foot{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center;margin-top:24px}
#sn-sheet .sn-sheet-foot a,#sn-sheet .sn-sheet-foot button{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0;border:0;
  background:none;color:var(--nitrogen);font:500 16px/1 var(--font-body);cursor:pointer}
@media (max-width:1020px){#site-nav .sn-search span,#site-nav .sn-search kbd{display:none}#site-nav .sn-search{padding:0 10px}}
@media (max-width:900px){#site-nav .sn-links,#site-nav .sn-ind{display:none}#site-nav .sn-burger{display:inline-block}
  #site-nav .sn-actions{margin-left:auto;gap:2px}#site-nav .sn-search{border:0;background:none;width:40px;padding:0;justify-content:center;color:var(--ink)}}
@media (max-width:420px){#sn-sheet .sn-sub ul{grid-template-columns:1fr}#site-nav .sn-brand{font-size:18px}}
@media (prefers-reduced-motion:reduce){#site-nav,#sn-sheet,#sn-sheet .sn-anim,#site-nav .sn-ind,#site-nav .sn-panel,#site-nav .sn-mark,#site-nav .sn-burger span{transition:none!important}}
html.sn-lock{overflow:hidden}
#site-nav .sn-theme{position:relative}
#site-nav .sn-theme-pop{position:absolute;right:0;top:calc(100% + 8px);width:min(320px,calc(100vw - 24px));max-height:calc(100vh - 84px);overflow-y:auto;
  padding:6px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;box-shadow:var(--lift);
  opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .16s,transform .16s,visibility 0s .16s}
#site-nav .sn-theme.is-open .sn-theme-pop{opacity:1;visibility:visible;transform:none;transition:opacity .16s,transform .16s}
#site-nav .sn-theme-pop button,#sn-sheet .sn-theme-grid button{display:grid;grid-template-columns:44px minmax(0,1fr) 16px;align-items:center;gap:10px;
  width:100%;min-height:48px;padding:7px 10px;border:0;border-radius:8px;background:none;color:var(--ink);text-align:left;cursor:pointer}
#site-nav .sn-theme-pop button:hover,#site-nav .sn-theme-pop button:focus-visible,#sn-sheet .sn-theme-grid button:hover{background:var(--surface-2)}
#site-nav .sn-theme-pop button:focus-visible,#sn-sheet .sn-theme-grid button:focus-visible{outline:2px solid var(--nitrogen);outline-offset:-2px}
#site-nav .sn-theme-pop [aria-checked="true"],#sn-sheet .sn-theme-grid [aria-checked="true"]{background:var(--surface-2)}
#site-nav .sn-sw,#sn-sheet .sn-sw{display:flex;height:22px;border:1px solid var(--rule-strong);border-radius:4px;overflow:hidden}
#site-nav .sn-sw i,#sn-sheet .sn-sw i{flex:1}
#site-nav .sn-tn b,#sn-sheet .sn-tn b{display:block;font:600 14.5px/1.25 var(--font-body)}
#site-nav .sn-tn small,#sn-sheet .sn-tn small{display:block;margin-top:1px;font:400 12.5px/1.35 var(--font-body);color:var(--graphite)}
#site-nav .sn-check,#sn-sheet .sn-check{color:var(--nitrogen);font:700 14px/1 var(--font-body);visibility:hidden}
#site-nav [aria-checked="true"] .sn-check,#sn-sheet [aria-checked="true"] .sn-check{visibility:visible}
#sn-sheet .sn-sheet-theme{margin-top:28px}
#sn-sheet .sn-sheet-theme h3{margin:0 0 6px;font:600 13px/1.4 var(--font-body);color:var(--graphite)}
#sn-sheet .sn-theme-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 8px}
@media (max-width:520px){#sn-sheet .sn-theme-grid{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){#site-nav .sn-theme-pop{transition:none!important}}
dialog.ss{width:min(680px,calc(100vw - 24px));max-height:min(72vh,640px);margin:12vh auto auto;padding:0;border:1px solid var(--rule);
  border-radius:14px;background:var(--surface);color:var(--ink);box-shadow:var(--lift);overflow:hidden;flex-direction:column}
dialog.ss[open]{display:flex}
dialog.ss::backdrop{background:rgba(6,12,10,.45)}
dialog.ss .ss-bar{display:flex;align-items:center;gap:10px;padding:10px 12px 10px 16px;border-bottom:1px solid var(--rule)}
dialog.ss .ss-icon{width:20px;height:20px;flex:none;fill:none;stroke:var(--graphite);stroke-width:1.8;stroke-linecap:round}
dialog.ss .ss-label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
dialog.ss input{flex:1;min-width:0;height:40px;border:0;background:transparent;color:var(--ink);font:400 17px/1.3 var(--font-body);outline:none}
dialog.ss input::-webkit-search-cancel-button{display:none}
dialog.ss .ss-close{height:32px;padding:0 10px;border:1px solid var(--rule);border-radius:6px;background:none;color:var(--graphite);font:500 13px/1 var(--font-body);cursor:pointer}
dialog.ss .ss-results{list-style:none;margin:0;padding:6px;overflow-y:auto;flex:1}
dialog.ss .ss-results a{display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:2px 12px;padding:10px 12px;border-radius:8px;color:var(--ink);text-decoration:none}
dialog.ss .ss-results [aria-selected="true"]>a{background:var(--surface-2)}
dialog.ss .ss-kind{grid-row:1 / span 2;padding-top:3px;font:500 13px/1.3 var(--font-body);color:var(--graphite)}
dialog.ss .ss-title{font:600 16px/1.35 var(--font-body)}
dialog.ss .ss-desc{grid-column:2;font:400 14px/1.45 var(--font-body);color:var(--graphite);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
dialog.ss .ss-score{grid-column:3;grid-row:1;padding-top:3px;font:500 12px/1.3 var(--font-mono);color:var(--graphite)}
dialog.ss .ss-empty{padding:18px 12px;color:var(--graphite)}
dialog.ss .ss-foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px 16px;margin:0;padding:10px 16px;border-top:1px solid var(--rule);
  font:400 13px/1.4 var(--font-body);color:var(--graphite)}
dialog.ss .ss-foot a{color:var(--nitrogen)}
@media (max-width:600px){dialog.ss{margin:8px auto auto;max-height:calc(100dvh - 16px)}
  dialog.ss .ss-results a{grid-template-columns:minmax(0,1fr) auto}dialog.ss .ss-kind{grid-row:auto;grid-column:1}dialog.ss .ss-score{grid-column:2;grid-row:1}
  dialog.ss .ss-title,dialog.ss .ss-desc{grid-column:1 / -1}}
`;

// ---------- helpers ----------
const norm = (p) => p.replace(/\/index\.html$/, "/").replace(/\/+$/, "/") || "/";
const HERE = norm(location.pathname);
const isHere = (href) => !/^https?:/.test(href) && norm(href) === HERE;
const cur = (href) => (isHere(href) ? ' aria-current="page"' : "");

function linkRow([name, href, desc]) {
  return `<li><a href="${href}"${cur(href)}><b>${name}</b>${desc ? `<small>${desc}</small>` : ""}</a></li>`;
}

function barHTML() {
  const items = NAV.map((item) => {
    if (item.href) {
      return `<li class="sn-item"><a class="sn-link" href="${item.href}"${cur(item.href)}>${item.name}</a></li>`;
    }
    const all = item.groups ? item.groups.flatMap((g) => g.items) : item.items;
    const current = all.some(([, h]) => isHere(h)) ? " is-current" : "";
    const body = item.mega
      ? `<div class="sn-mega">${item.groups
          .map((g) => `<section><h3>${g.group}</h3><ul>${g.items.map(linkRow).join("")}</ul></section>`)
          .join("")}</div>
         <div class="sn-panel-foot"><a href="${item.footer[1]}">${item.footer[0]}</a></div>`
      : `<ul>${item.items.map(linkRow).join("")}</ul>`;
    return `
      <li class="sn-item${item.mega ? " sn-item--mega" : ""}" data-sn-menu>
        <button class="sn-link${current}" type="button" aria-expanded="false" aria-controls="sn-p-${item.id}">${item.name}${ICON.caret}</button>
        <div class="sn-panel" id="sn-p-${item.id}">${body}</div>
      </li>`;
  }).join("");

  return `
  <header class="sn" id="site-nav">
    <nav class="sn-in" aria-label="Main">
      <a class="sn-brand" href="/" aria-label="Shuvam Banerji Seal, home">${ICON.mark}<span>Shuvam Banerji Seal</span></a>
      <ul class="sn-links">${items}</ul>
      <span class="sn-ind" aria-hidden="true"></span>
      <div class="sn-actions">
        <button class="sn-search" type="button" data-sn-search aria-label="Search this site" aria-keyshortcuts="/ Control+K">${ICON.search}<span>Search</span><kbd>/</kbd></button>
        <div class="sn-theme">
          <button class="sn-icon sn-icon--keep" type="button" data-theme-menu aria-haspopup="menu" aria-expanded="false" aria-controls="sn-theme-pop" aria-label="Change theme">${ICON.theme}</button>
          <div class="sn-theme-pop" id="sn-theme-pop" role="menu" aria-label="Theme">${themeItems("menuitemradio")}</div>
        </div>
        <button class="sn-burger" type="button" aria-expanded="false" aria-controls="sn-sheet" aria-label="Open menu"><span></span><span></span><span></span></button>
      </div>
    </nav>
  </header>`;
}

function themeItems(role) {
  const sw = (cols) => `<span class="sn-sw" aria-hidden="true">${cols.map((c) => `<i style="background:${c}"></i>`).join("")}</span>`;
  const item = (id, name, desc, cols) =>
    `<button type="button" role="${role}" aria-checked="false" data-set-theme="${id}" tabindex="-1">${sw(cols)}<span class="sn-tn"><b>${name}</b><small>${desc}</small></span><span class="sn-check" aria-hidden="true">✓</span></button>`;
  return (
    item("system", "Match system", "Light or dark, as your device is set", ["#F1F4EE", "#F1F4EE", "#0B1311", "#0B1311"]) +
    THEMES.map((t) => item(t.id, t.name, t.desc, t.sw)).join("")
  );
}

function sheetHTML() {
  let i = 0;
  const n = () => `style="--i:${i++}"`;
  const tools = TOOL_GROUPS.map(
    (g) =>
      `<h3>${g.group}</h3><ul>${g.items
        .map(([name, href]) => `<li><a href="${href}"${cur(href)}>${name}</a></li>`)
        .join("")}</ul>`,
  ).join("");
  const main = [
    ["Home", "/"],
    ["Research", "/pages/research.html"],
    ["Projects", "/pages/projects.html"],
    ["Tools", null],
    ["Writing", "/pages/blog.html"],
    ["GitHub repositories", "/pages/github-projects.html"],
    ["CV", "/pages/resume.html"],
  ]
    .map(([name, href]) =>
      href
        ? `<li class="sn-anim" ${n()}><a href="${href}"${cur(href)}>${name}</a></li>`
        : `<li class="sn-anim" ${n()}><button type="button" aria-expanded="false" aria-controls="sn-sheet-tools">${name}${ICON.caret}</button>
             <div class="sn-sub" id="sn-sheet-tools" hidden>${tools}<p><a href="/pages/tools.html">Every tool on one page</a></p></div></li>`,
    )
    .join("");
  return `
  <nav class="sn-sheet" id="sn-sheet" aria-label="Site menu">
    <div class="sn-sheet-in">
      <button class="sn-sheet-search sn-anim" ${n()} type="button" data-sn-search>${ICON.search}<span>Search pages, tools and papers</span></button>
      <ul class="sn-sheet-main">${main}</ul>
      <section class="sn-sheet-theme sn-anim" ${n()} aria-labelledby="sn-theme-h">
        <h3 id="sn-theme-h">Theme</h3>
        <div class="sn-theme-grid" role="radiogroup" aria-labelledby="sn-theme-h">${themeItems("radio")}</div>
      </section>
      <div class="sn-sheet-foot sn-anim" ${n()}>
        <a href="https://github.com/Shuvam-Banerji-Seal">GitHub</a>
        <a href="mailto:sbs22ms076@iiserkol.ac.in">Email</a>
      </div>
    </div>
  </nav>`;
}

// ---------- behaviour ----------
function initMenus(bar) {
  const menus = [...bar.querySelectorAll("[data-sn-menu]")];
  const hoverable = window.matchMedia("(hover: hover) and (pointer: fine)");
  let openItem = null;
  const timers = new WeakMap();

  function setOpen(item, open) {
    const btn = item.querySelector(".sn-link");
    item.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
    if (open) {
      if (openItem && openItem !== item) setOpen(openItem, false);
      openItem = item;
    } else if (openItem === item) {
      openItem = null;
    }
  }
  const later = (item, fn, ms) => {
    clearTimeout(timers.get(item));
    timers.set(item, setTimeout(fn, ms));
  };

  menus.forEach((item) => {
    const btn = item.querySelector(".sn-link");
    const panel = item.querySelector(".sn-panel");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      // A click right after hover-open keeps it open instead of closing it.
      const justOpened = item.dataset.hoverAt && performance.now() - item.dataset.hoverAt < 450;
      setOpen(item, justOpened ? true : !item.classList.contains("is-open"));
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(item, true);
        panel.querySelector("a")?.focus();
      }
    });
    item.addEventListener("mouseenter", () => {
      if (!hoverable.matches) return;
      later(item, () => {
        if (!item.classList.contains("is-open")) item.dataset.hoverAt = performance.now();
        setOpen(item, true);
      }, 70);
    });
    item.addEventListener("mouseleave", () => {
      if (!hoverable.matches) return;
      later(item, () => setOpen(item, false), 160);
    });
    item.addEventListener("focusout", (e) => {
      if (!item.contains(e.relatedTarget)) setOpen(item, false);
    });
    panel.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const links = [...panel.querySelectorAll("a")];
      const i = links.indexOf(document.activeElement);
      e.preventDefault();
      links[(i + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length]?.focus();
    });
  });

  document.addEventListener("click", (e) => {
    if (openItem && !openItem.contains(e.target)) setOpen(openItem, false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openItem) {
      const btn = openItem.querySelector(".sn-link");
      setOpen(openItem, false);
      btn.focus();
    }
  });
  return () => !!openItem;
}

function initIndicator(bar) {
  const list = bar.querySelector(".sn-links");
  const ind = bar.querySelector(".sn-ind");
  const box = bar.querySelector(".sn-in");
  if (!list || !ind || !box) return;
  const home = () => list.querySelector('.sn-link[aria-current="page"], .sn-link.is-current');
  let shown = false;
  function moveTo(el) {
    if (!el) {
      ind.style.opacity = "0";
      shown = false;
      return;
    }
    const a = el.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    // First placement jumps; later moves slide between links.
    ind.classList.toggle("is-instant", !shown);
    ind.style.left = a.left - b.left + 12 + "px";
    ind.style.top = a.bottom - b.top - 6 + "px";
    ind.style.width = Math.max(0, a.width - 24) + "px";
    ind.style.opacity = "1";
    shown = true;
  }
  list.querySelectorAll(".sn-link").forEach((el) => {
    el.addEventListener("mouseenter", () => moveTo(el));
    el.addEventListener("focus", () => moveTo(el));
  });
  list.addEventListener("mouseleave", () => moveTo(home()));
  list.addEventListener("focusout", (e) => {
    if (!list.contains(e.relatedTarget)) moveTo(home());
  });
  addEventListener("resize", () => moveTo(home()));
  // Fonts change link widths; place the indicator once they are in.
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => moveTo(home()));
}

function initSheet(bar, sheet) {
  const btn = bar.querySelector(".sn-burger");
  const toolsBtn = sheet.querySelector('[aria-controls="sn-sheet-tools"]');
  const toolsSub = sheet.querySelector("#sn-sheet-tools");
  let open = false;

  function inertSiblings(on) {
    for (const el of document.body.children) {
      if (el === sheet || el.contains(bar) || el.tagName === "SCRIPT" || el.tagName === "DIALOG") continue;
      if (on) {
        if (!el.inert) {
          el.inert = true;
          el.dataset.snInert = "1";
        }
      } else if (el.dataset.snInert) {
        el.inert = false;
        delete el.dataset.snInert;
      }
    }
  }

  function setOpen(v, restoreFocus = true) {
    open = v;
    btn.setAttribute("aria-expanded", String(v));
    btn.setAttribute("aria-label", v ? "Close menu" : "Open menu");
    sheet.classList.toggle("is-open", v);
    document.documentElement.classList.toggle("sn-lock", v);
    bar.classList.remove("is-hidden");
    inertSiblings(v);
    if (v) {
      setTimeout(() => sheet.querySelector("a,button")?.focus({ preventScroll: true }), 60);
    } else if (restoreFocus && sheet.contains(document.activeElement)) {
      btn.focus();
    }
  }

  btn.addEventListener("click", () => setOpen(!open));
  toolsBtn?.addEventListener("click", () => {
    const ex = toolsBtn.getAttribute("aria-expanded") === "true";
    toolsBtn.setAttribute("aria-expanded", String(!ex));
    toolsSub.hidden = ex;
  });
  sheet.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false, false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) setOpen(false);
  });
  window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => {
    if (e.matches && open) setOpen(false, false);
  });
  return () => open;
}

function initScroll(bar, busy) {
  let lastY = scrollY;
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY;
    bar.classList.toggle("is-scrolled", y > 8);
    if (busy() || bar.contains(document.activeElement)) {
      bar.classList.remove("is-hidden");
    } else if (y > 120 && y > lastY + 6) {
      bar.classList.add("is-hidden");
    } else if (y < lastY - 6 || y < 120) {
      bar.classList.remove("is-hidden");
    }
    lastY = y;
  }
  addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  bar.addEventListener("focusin", () => bar.classList.remove("is-hidden"));
  onScroll();
}

function initSearch() {
  const open = (q = "") =>
    import("./site-search.js").then((m) => m.openSearch(q)).catch(() => {
      location.href = "/pages/tools.html";
    });
  document.querySelectorAll("[data-sn-search]").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelector(".sn-burger[aria-expanded='true']")?.click();
      open();
    }),
  );
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      open();
    } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      open();
    }
  });
  window.openSiteSearch = open;
}

function initThemeToggle() {
  const choice = () => {
    const s = savedTheme();
    return s && THEME_BY_ID[s] ? s : s ? "dark" : "system";
  };

  function paint() {
    const id = resolveTheme();
    const picked = choice();
    const t = THEME_BY_ID[id];
    document.querySelectorAll("[data-set-theme]").forEach((b) => {
      const on = b.dataset.setTheme === picked;
      b.setAttribute("aria-checked", String(on));
      if (b.getAttribute("role") === "radio") b.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll("[data-theme-menu]").forEach((b) =>
      b.setAttribute("aria-label", `Theme: ${picked === "system" ? `match system (${t.name})` : t.name}. Change theme`),
    );
    // Older pages carry their own light/dark toggle buttons.
    const dark = t.mode === "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      const svg = btn.querySelector("svg.sn-svg");
      if (svg) svg.outerHTML = dark ? ICON.sun : ICON.moon;
      const icon = btn.querySelector("i[data-lucide]");
      if (icon) icon.setAttribute("data-lucide", dark ? "sun" : "moon");
    });
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  function applyTheme(id, persist) {
    if (id === "system") {
      try {
        localStorage.removeItem("theme");
      } catch (_) {}
      id = systemTheme();
    } else if (persist) {
      try {
        localStorage.setItem("theme", id);
      } catch (_) {
        /* preference just won't persist */
      }
    }
    setThemeAttr(id);
    paint();
    const t = THEME_BY_ID[id] || THEME_BY_ID.dark;
    document.dispatchEvent(
      new CustomEvent("themechange", { detail: { theme: t.mode, mode: t.mode, palette: t.id } }),
    );
  }

  applyTheme(resolveTheme(), false);

  document.querySelectorAll("[data-set-theme]").forEach((b) =>
    b.addEventListener("click", () => applyTheme(b.dataset.setTheme, true)),
  );

  // Mobile sheet: a radio group, arrow keys move and select.
  document.querySelectorAll('[role="radiogroup"]').forEach((group) =>
    group.addEventListener("keydown", (e) => {
      const items = [...group.querySelectorAll('[role="radio"]')];
      const i = items.indexOf(document.activeElement);
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (i < 0 || !step) return;
      e.preventDefault();
      const next = items[(i + step + items.length) % items.length];
      next.focus();
      next.click();
    }),
  );

  // Desktop and bar: a menu of radio items.
  let menuOpen = false;
  const wrap = document.querySelector("#site-nav .sn-theme");
  if (wrap) {
    const btn = wrap.querySelector("[data-theme-menu]");
    const pop = wrap.querySelector(".sn-theme-pop");
    const items = () => [...pop.querySelectorAll('[role="menuitemradio"]')];
    const setOpen = (v, focusBtn) => {
      menuOpen = v;
      wrap.classList.toggle("is-open", v);
      btn.setAttribute("aria-expanded", String(v));
      if (v) (pop.querySelector('[aria-checked="true"]') || items()[0]).focus();
      else if (focusBtn) btn.focus();
    };
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setOpen(!menuOpen);
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
      }
    });
    pop.addEventListener("keydown", (e) => {
      const list = items();
      const i = list.indexOf(document.activeElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        list[(i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length].focus();
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        list[e.key === "Home" ? 0 : list.length - 1].focus();
      } else if (e.key === "Enter") {
        e.preventDefault();
        document.activeElement.click();
        setOpen(false, true);
      } else if (e.key === " ") {
        e.preventDefault();
        document.activeElement.click(); // Space applies and keeps the menu open
      } else if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false, true);
      } else if (e.key === "Tab") {
        setOpen(false);
      }
    });
    pop.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", () => menuOpen && setOpen(false));
  }

  // Older pages' own toggles flip the mode.
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    // Replace the node so listeners other scripts attached never double-toggle.
    const fresh = btn.cloneNode(true);
    btn.replaceWith(fresh);
    fresh.addEventListener("click", () => {
      const now = document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(isDarkTheme(now) ? "light" : "dark", true);
    });
  });
  paint();

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (choice() === "system") applyTheme("system", false);
  });
  // Used by the homepage terminal: setSiteTheme("cyanotype"), "system", ...
  window.setSiteTheme = (id) => applyTheme(THEME_BY_ID[id] || id === "system" ? id : "dark", true);
  return () => menuOpen;
}

function mount() {
  const container = document.getElementById("navbar-container");
  if (!container || container.dataset.snMounted) return;
  container.dataset.snMounted = "1";

  if (!document.getElementById("sn-style")) {
    const style = document.createElement("style");
    style.id = "sn-style";
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  container.innerHTML = barHTML();
  document.body.insertAdjacentHTML("beforeend", sheetHTML());
  const bar = container.querySelector(".sn");
  const sheet = document.getElementById("sn-sheet");

  const menuOpen = initMenus(bar);
  const sheetOpen = initSheet(bar, sheet);
  initIndicator(bar);
  initSearch();
  const themeOpen = initThemeToggle();
  initScroll(bar, () => menuOpen() || sheetOpen() || themeOpen());
  if (typeof lucide !== "undefined") lucide.createIcons();
  document.dispatchEvent(new Event("navbarLoaded"));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
else mount();

// Global notification system (used by several tools).
window.showNotification = function (message, type = "error") {
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.setAttribute("role", "status");
    container.style.cssText =
      "position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.style.cssText =
    "padding:12px 16px;border-radius:8px;color:#fff;font-weight:500;box-shadow:var(--lift);transition:opacity 0.3s,transform 0.3s;transform:translateY(20px);opacity:0;";
  toast.style.background =
    type === "error" ? "var(--oxygen)" : type === "success" ? "#1f7a4d" : "var(--nitrogen)";
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};
