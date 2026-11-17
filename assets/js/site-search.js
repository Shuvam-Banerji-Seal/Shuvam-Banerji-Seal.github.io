/**
 * site-search.js: search every page, tool, paper, post and repository on
 * this site, ranked with BM25 (Robertson and Zaragoza, 2009).
 *
 * The index (/search-index.json) is built at deploy time by
 * scripts/generate-search-index.mjs from page titles, descriptions and
 * headings. Scoring is BM25F-style: field term counts are weighted
 * (title 3, headings 1.4, kind and description 1) before the usual
 * saturation, with k1 = 1.2 and b = 0.75 and the non-negative IDF
 * ln(1 + (N − n + 0.5) / (n + 0.5)). The last query word also matches as a
 * prefix, so results appear while typing. Written up in
 * pages/blogs/bm25-explained.html.
 *
 * Exports: search(query, limit) → Promise<results>, openSearch(initial).
 */

export const K1 = 1.2;
export const B = 0.75;
const FIELD_W = { t: 3, h: 1.4, k: 1, d: 1 };
const STOP = new Set(
  "a an and are as at be by for from has have i in is it its me my of on or our so that the this to was we were what with you your how".split(" "),
);

export function stem(w) {
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
  return w;
}

export function tokenize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w))
    .map(stem);
}

let indexPromise = null;
let IDX = null;

function build(docs) {
  const N = docs.length;
  const df = new Map();
  let total = 0;
  const D = docs.map((doc) => {
    const tf = new Map();
    let len = 0;
    for (const f of Object.keys(FIELD_W)) {
      const toks = tokenize(doc[f]);
      len += FIELD_W[f] * toks.length;
      for (const w of toks) tf.set(w, (tf.get(w) || 0) + FIELD_W[f]);
    }
    for (const w of tf.keys()) df.set(w, (df.get(w) || 0) + 1);
    total += len;
    return { doc, tf, len };
  });
  const idf = new Map();
  for (const [w, n] of df) idf.set(w, Math.log(1 + (N - n + 0.5) / (n + 0.5)));
  return { D, idf, avgdl: total / Math.max(1, N), vocab: [...df.keys()] };
}

export function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch("/search-index.json")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((docs) => (IDX = build(docs)));
  }
  return indexPromise;
}

/** Rank documents for a query. Each result: { doc, score, terms }. */
export async function search(query, limit = 8) {
  const idx = IDX || (await loadIndex());
  const raw = String(query || "");
  const terms = tokenize(raw);
  if (!terms.length) return [];
  // Query terms with weights; the unfinished last word also matches as a prefix.
  const q = new Map(terms.map((t) => [t, 1]));
  const last = raw.trim().split(/\s+/).pop().toLowerCase();
  if (last.length >= 2 && !/\s$/.test(raw)) {
    let n = 0;
    for (const w of idx.vocab) {
      if (w !== last && w.startsWith(last) && !q.has(w)) {
        q.set(w, 0.7);
        if (++n >= 12) break;
      }
    }
  }
  const out = [];
  for (const d of idx.D) {
    let score = 0;
    const hit = [];
    for (const [t, wq] of q) {
      const tf = d.tf.get(t);
      if (!tf) continue;
      const norm = K1 * (1 - B + (B * d.len) / idx.avgdl);
      score += wq * idx.idf.get(t) * ((tf * (K1 + 1)) / (tf + norm));
      hit.push(t);
    }
    if (score > 0) out.push({ doc: d.doc, score, terms: hit });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}

// ---------------------------------------------------------------- dialog UI

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const SUGGEST = [
  { t: "Molecule3D, LAMMPS in the browser", u: "https://shuvam-banerji-seal.github.io/lammps-web-gui/", k: "Project" },
  { t: "PDF Studio", u: "/pages/tools/pdf-studio.html", k: "Tool" },
  { t: "Periodic table", u: "/pages/tools/periodic-table.html", k: "Tool" },
  { t: "Research and publications", u: "/pages/research.html", k: "Page" },
  { t: "CV", u: "/pages/resume.html", k: "Page" },
];

let dlg = null;

function ensureDialog() {
  if (dlg) return dlg;
  dlg = document.createElement("dialog");
  dlg.className = "ss";
  dlg.setAttribute("aria-labelledby", "ss-label");
  dlg.innerHTML = `
    <div class="ss-bar" role="search">
      <svg class="ss-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <label id="ss-label" for="ss-q" class="ss-label">Search this site</label>
      <input id="ss-q" type="search" autocomplete="off" spellcheck="false"
        placeholder="Search pages, tools, papers, posts" role="combobox"
        aria-expanded="true" aria-controls="ss-results" aria-autocomplete="list" />
      <button type="button" class="ss-close" data-ss-close>Close</button>
    </div>
    <ul id="ss-results" class="ss-results" role="listbox" aria-label="Results"></ul>
    <p class="ss-foot"><span>Ranked with BM25, k<sub>1</sub> = 1.2, b = 0.75.</span>
      <a href="/pages/blogs/bm25-explained.html">How the ranking works</a></p>`;
  document.body.appendChild(dlg);

  const input = dlg.querySelector("#ss-q");
  const list = dlg.querySelector("#ss-results");
  let items = [];
  let active = -1;
  let seq = 0;

  function setActive(i) {
    active = i;
    list.querySelectorAll("[role=option]").forEach((li, j) => {
      li.setAttribute("aria-selected", String(j === i));
      if (j === i) li.scrollIntoView({ block: "nearest" });
    });
    input.setAttribute("aria-activedescendant", i >= 0 ? `ss-opt-${i}` : "");
  }

  function render(rows, scored, q) {
    items = rows;
    if (!rows.length) {
      list.innerHTML = `<li class="ss-empty">Nothing matches “${esc(q)}”. Try a shorter word.</li>`;
      setActive(-1);
      return;
    }
    list.innerHTML = rows
      .map(
        (r, i) => `
      <li role="option" id="ss-opt-${i}" aria-selected="false">
        <a href="${esc(r.u)}" tabindex="-1">
          <span class="ss-kind">${esc(r.k || "Page")}</span>
          <span class="ss-title">${esc(r.t)}</span>
          ${r.d ? `<span class="ss-desc">${esc(r.d)}</span>` : ""}
          ${scored ? `<span class="ss-score" title="BM25 score">${r.score.toFixed(2)}</span>` : ""}
        </a>
      </li>`,
      )
      .join("");
    list.querySelectorAll("[role=option]").forEach((li, i) => {
      li.addEventListener("mousemove", () => active !== i && setActive(i));
    });
    setActive(0);
  }

  async function run() {
    const q = input.value;
    const my = ++seq;
    if (!q.trim()) return render(SUGGEST, false, q);
    const res = await search(q, 10);
    if (my !== seq) return;
    render(res.map((r) => ({ ...r.doc, score: r.score })), true, q);
  }

  input.addEventListener("input", run);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (items.length) setActive((active + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length) setActive((active - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = items[active];
      if (it) location.href = it.u;
    }
  });
  dlg.querySelector("[data-ss-close]").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close(); // backdrop
  });
  dlg.addEventListener("close", () => {
    document.documentElement.classList.remove("ss-open");
  });
  dlg._run = run;
  return dlg;
}

export function openSearch(initial = "") {
  const d = ensureDialog();
  const input = d.querySelector("#ss-q");
  if (!d.open) d.showModal();
  document.documentElement.classList.add("ss-open");
  input.value = initial;
  input.focus();
  loadIndex();
  d._run();
}
