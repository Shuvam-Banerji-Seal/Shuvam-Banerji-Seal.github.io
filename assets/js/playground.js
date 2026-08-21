// ── HTML Playground ─────────────────────────────────────────────────────
// Paste HTML/CSS/JS → rendered live in a sandboxed iframe. Console output
// is captured by injecting a shim before user code. Auto-run debounces
// typing; state persists in localStorage; links carry a compressed blob.

const DEFAULT_HTML = `<div class="card">
  <h1>Hello \u{1F44B}</h1>
  <p>Edit the code &mdash; this preview updates live.</p>
  <button id="go">Click me</button>
</div>`;

const DEFAULT_CSS = `body {
  font-family: system-ui, sans-serif;
  display: grid; place-items: center;
  min-height: 100vh; margin: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}
.card {
  background: rgba(255,255,255,.12);
  padding: 2rem 3rem; border-radius: 16px;
  text-align: center; backdrop-filter: blur(8px);
}
button {
  padding: .6rem 1.4rem; border: none; border-radius: 8px;
  background: white; color: #5b21b6;
  font-weight: 700; cursor: pointer;
}`;

const DEFAULT_JS = `document.getElementById("go").addEventListener("click", () => {
  console.log("clicked at", new Date().toLocaleTimeString());
});`;

const els = {
  html: document.getElementById("ed-html"),
  css: document.getElementById("ed-css"),
  js: document.getElementById("ed-js"),
  frame: document.getElementById("pg-frame"),
  consoleBox: document.getElementById("pg-console"),
  renderInfo: document.getElementById("render-info"),
};

// ── console capture shim injected into every render ─────────────────────
const CONSOLE_SHIM = `
<script>
(function () {
  var send = function (level, args) {
    try {
      parent.postMessage({
        __pg: true, level: level,
        text: Array.from(args).map(function (a) {
          try {
            if (a instanceof Error) return a.stack || a.message;
            if (typeof a === "object" && a !== null) return JSON.stringify(a, null, 1);
            return String(a);
          } catch (e) { return String(a); }
        }).join(" ")
      }, "*");
    } catch (e) {}
  };
  ["log", "warn", "error", "info"].forEach(function (level) {
    var orig = console[level] ? console[level].bind(console) : function () {};
    console[level] = function () { send(level, arguments); orig.apply(console, arguments); };
  });
  window.addEventListener("error", function (e) {
    send("error", [e.message + "  (line " + e.lineno + ")"]);
  });
  window.addEventListener("unhandledrejection", function (e) {
    send("error", ["Unhandled promise rejection: " + e.reason]);
  });
})();
<\/script>`;

// ── build & run ─────────────────────────────────────────────────────────
function buildDocument() {
  const html = els.html.value;
  const css = els.css.value;
  const js = els.js.value;
  // Inject user CSS/JS into a full document; shim runs first so even
  // top-level errors are captured.
  return `<!doctype html><html><head><meta charset="utf-8">
<style>${css}</style></head>
<body>
${html}
${CONSOLE_SHIM}
<script>
try {
${js}
} catch (e) { console.error(e); }
<\/script>
</body></html>`;
}

let autoTimer = null;
let dirty = false;

function setChip(id, isDirty) {
  const chip = document.getElementById(id);
  if (!chip) return; // defensive: never crash on a missing status chip
  chip.textContent = isDirty ? "edited" : "synced";
  chip.classList.toggle("dirty", isDirty);
}

function markDirty(which) {
  dirty = true;
  setChip("chip-" + which, true);
  document.getElementById("run-btn").classList.add("primary");
  clearTimeout(autoTimer);
  autoTimer = setTimeout(run, 900); // auto-run debounce
}

function run() {
  clearTimeout(autoTimer);
  clearConsole(true);
  logLine("sys", "\u203A rendering\u2026");
  const doc = buildDocument();
  els.frame.srcdoc = doc;
  const t0 = performance.now();
  els.frame.addEventListener(
    "load",
    () => {
      const info = document.getElementById("render-info");
      if (info)
        info.textContent = `rendered in ${Math.round(performance.now() - t0)} ms`;
    },
    { once: true },
  );
  dirty = false;
  ["html", "css", "js"].forEach((w) => setChip(w, false));
  persist();
}

// ── console panel ───────────────────────────────────────────────────────
function logLine(level, text) {
  const div = document.createElement("div");
  div.className = "line l-" + level;
  div.textContent = text;
  els.consoleBox.appendChild(div);
  while (els.consoleBox.children.length > 200)
    els.consoleBox.firstChild.remove();
  els.consoleBox.scrollTop = els.consoleBox.scrollHeight;
}

function clearConsole(keepHint) {
  els.consoleBox.innerHTML = "";
  if (keepHint) logLine("sys", "\u203A console reset");
}

window.addEventListener("message", (e) => {
  if (e.data && e.data.__pg)
    logLine(e.data.level === "info" ? "log" : e.data.level, e.data.text);
});

// ── persistence ─────────────────────────────────────────────────────────
const LS_KEY = "pg-code-v1";

function persist() {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ h: els.html.value, c: els.css.value, j: els.js.value }),
    );
  } catch (e) {}
}

function restoreOrSeed() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(LS_KEY));
  } catch (e) {}
  els.html.value = saved?.h ?? DEFAULT_HTML;
  els.css.value = saved?.c ?? DEFAULT_CSS;
  els.js.value = saved?.j ?? DEFAULT_JS;
}

// ── shareable link: deflate-ish via encodeURIComponent + lz fallback ────
// Keep it simple and dependency-free: base64url of UTF-8 JSON.
function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

async function copyShareLink() {
  const payload = b64urlEncode(
    JSON.stringify({ h: els.html.value, c: els.css.value, j: els.js.value }),
  );
  const url = `${location.origin}${location.pathname}#code=${payload}`;
  try {
    await navigator.clipboard.writeText(url);
    flashBtn("copy-link-btn", "Copied!");
  } catch (e) {
    prompt("Copy this link:", url);
  }
}

function loadFromHash() {
  const m = location.hash.match(/#code=([A-Za-z0-9\-_]+)/);
  if (!m) return false;
  try {
    const obj = JSON.parse(b64urlDecode(m[1]));
    els.html.value = obj.h ?? "";
    els.css.value = obj.c ?? "";
    els.js.value = obj.j ?? "";
    return true;
  } catch (e) {
    return false;
  }
}

function downloadStandalone() {
  const blob = new Blob([buildDocument()], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "playground-export.html";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  flashBtn("download-btn", "Saved!");
}

function flashBtn(id, msg) {
  const btn = document.getElementById(id);
  const orig = btn.innerHTML;
  btn.innerHTML = msg;
  setTimeout(() => (btn.innerHTML = orig), 1400);
}

// Tab key inserts spaces inside editors instead of leaving them.
[els.html, els.css, els.js].forEach((ta) => {
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = ta.selectionStart;
      ta.setRangeText("  ", s, ta.selectionEnd, "end");
      ta.dispatchEvent(new Event("input"));
    }
  });
});

["html", "css", "js"].forEach((which) => {
  els[which].addEventListener("input", () => markDirty(which));
});

document.getElementById("run-btn").addEventListener("click", run);
document.getElementById("clear-btn").addEventListener("click", () => {
  els.html.value = "";
  els.css.value = "";
  els.js.value = "";
  run();
});
document
  .getElementById("console-clear-btn")
  .addEventListener("click", () => clearConsole(false));
document
  .getElementById("download-btn")
  .addEventListener("click", downloadStandalone);
document
  .getElementById("copy-link-btn")
  .addEventListener("click", copyShareLink);
document.getElementById("layout-btn").addEventListener("click", () => {
  const grid = document.getElementById("pg-grid");
  grid.dataset.layout = grid.dataset.layout === "col" ? "" : "col";
});

// ── boot ────────────────────────────────────────────────────────────────
restoreOrSeed();
if (!loadFromHash()) run();
else run();

if (typeof lucide !== "undefined") lucide.createIcons();
