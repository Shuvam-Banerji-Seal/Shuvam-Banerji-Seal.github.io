/**
 * molecule-figure.js: a small ball-and-stick view of a PDB file, drawn on a
 * 2D canvas with CPK colours (the palette this site is built from).
 * Same depth painter as orbital.js; pauses offscreen; still under reduced
 * motion; drag to rotate; hovering an atom names it.
 *
 * Markup contract:
 *   <figure data-molecule-root data-src="assets/pdb/ATP.pdb">
 *     <canvas data-molecule-canvas></canvas>
 *     <span data-molecule-atom></span>     (hover readout)
 *   </figure>
 */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

const ELEMENT_NAMES = {
  H: "hydrogen",
  C: "carbon",
  N: "nitrogen",
  O: "oxygen",
  P: "phosphorus",
  S: "sulfur",
};
// Display radii in Å (ball-and-stick, not van der Waals).
const RADIUS = { H: 0.24, C: 0.42, N: 0.4, O: 0.38, P: 0.55, S: 0.55 };

function parsePDB(text) {
  const atoms = [];
  const serialToIndex = new Map();
  const bonds = new Set();
  for (const line of text.split("\n")) {
    const rec = line.slice(0, 6).trim();
    if (rec === "ATOM" || rec === "HETATM") {
      const serial = parseInt(line.slice(6, 11), 10);
      const name = line.slice(12, 16).trim();
      const x = parseFloat(line.slice(30, 38));
      const y = parseFloat(line.slice(38, 46));
      const z = parseFloat(line.slice(46, 54));
      let el = (line.slice(76, 78).trim() || name[0]).replace(/[^A-Za-z]/g, "");
      el = el.charAt(0).toUpperCase() + el.slice(1).toLowerCase();
      serialToIndex.set(serial, atoms.length);
      atoms.push({ name, el, x, y, z });
    } else if (rec === "CONECT") {
      const nums = line
        .slice(6)
        .trim()
        .split(/\s+/)
        .map((n) => parseInt(n, 10))
        .filter(Number.isFinite);
      const a = serialToIndex.get(nums[0]);
      for (const n of nums.slice(1)) {
        const b = serialToIndex.get(n);
        if (a == null || b == null || a === b) continue;
        bonds.add(a < b ? `${a}-${b}` : `${b}-${a}`);
      }
    }
  }
  // Fallback when a file has no CONECT records: bond by distance.
  if (bonds.size === 0) {
    for (let i = 0; i < atoms.length; i++)
      for (let j = i + 1; j < atoms.length; j++) {
        const p = atoms[i];
        const q = atoms[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
        const max = p.el === "H" || q.el === "H" ? 1.25 : 1.9;
        if (d > 0.4 && d < max) bonds.add(`${i}-${j}`);
      }
  }
  // Centre on the centroid.
  const n = atoms.length || 1;
  const cx = atoms.reduce((s, a) => s + a.x, 0) / n;
  const cy = atoms.reduce((s, a) => s + a.y, 0) / n;
  const cz = atoms.reduce((s, a) => s + a.z, 0) / n;
  let extent = 0;
  for (const a of atoms) {
    a.x -= cx;
    a.y -= cy;
    a.z -= cz;
    extent = Math.max(extent, Math.hypot(a.x, a.y, a.z));
  }
  alignToPrincipalAxes(atoms);
  return {
    atoms,
    bonds: [...bonds].map((k) => k.split("-").map(Number)),
    extent: extent || 1,
  };
}

// Rotate coordinates so the longest principal axis is x and the second is
// y: the molecule then spins about its own length and always fills the frame.
function alignToPrincipalAxes(atoms) {
  const C = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (const a of atoms) {
    const v = [a.x, a.y, a.z];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) C[i][j] += v[i] * v[j];
  }
  const mul = (M, v) => M.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
  const norm = (v) => {
    const l = Math.hypot(...v) || 1;
    return v.map((c) => c / l);
  };
  const power = (M, seed) => {
    let v = norm(seed);
    for (let k = 0; k < 60; k++) v = norm(mul(M, v));
    return v;
  };
  const e1 = power(C, [1, 0.3, 0.2]);
  const l1 = mul(C, e1).reduce((s, c, i) => s + c * e1[i], 0);
  const D = C.map((row, i) => row.map((c, j) => c - l1 * e1[i] * e1[j]));
  let e2 = power(D, [0.2, 1, 0.3]);
  const d = e2.reduce((s, c, i) => s + c * e1[i], 0);
  e2 = norm(e2.map((c, i) => c - d * e1[i]));
  const e3 = [
    e1[1] * e2[2] - e1[2] * e2[1],
    e1[2] * e2[0] - e1[0] * e2[2],
    e1[0] * e2[1] - e1[1] * e2[0],
  ];
  for (const a of atoms) {
    const v = [a.x, a.y, a.z];
    const dot = (e) => e[0] * v[0] + e[1] * v[1] + e[2] * v[2];
    a.x = dot(e1);
    a.y = dot(e2);
    a.z = dot(e3);
  }
}

const DEPTH_BINS = 6;
const probe = document.createElement("canvas").getContext("2d");
function toRGB(color) {
  probe.fillStyle = "#000";
  probe.fillStyle = color;
  const hex = probe.fillStyle;
  if (hex.startsWith("#"))
    return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const m = hex.match(/\d+(\.\d+)?/g) || [0, 0, 0];
  return m.slice(0, 3).map(Number);
}
const mix = (a, b, t) =>
  `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * t)).join(",")})`;

// For each element, DEPTH_BINS shades from far (tinted toward the page
// colour) to near (the pure CPK colour). Opaque, so overlaps stay crisp.
function shades(colors, paper) {
  const out = {};
  const bg = toRGB(paper);
  for (const k of ["C", "H", "N", "O", "P", "S", "outline"]) {
    const c = toRGB(colors[k]);
    out[k] = Array.from({ length: DEPTH_BINS }, (_, b) =>
      mix(c, bg, 0.55 * (1 - b / (DEPTH_BINS - 1))),
    );
  }
  return out;
}

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const v = (name, fb) => cs.getPropertyValue(name).trim() || fb;
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return {
    C: v("--graphite", "#59606a"),
    H: v("--surface", "#ffffff"),
    N: v("--nitrogen", "#2445c2"),
    O: v("--oxygen", "#c92a39"),
    P: dark ? "#f59a4a" : "#d9731a", // CPK phosphorus orange
    S: v("--sulfur", "#f2c94c"),
    outline: v("--rule-strong", "#b9bec7"),
    ink: v("--ink", "#1a1d22"),
    paper: v("--surface", "#ffffff"),
  };
}

export async function initMolecule(root) {
  const canvas = root.querySelector("[data-molecule-canvas]");
  const readout = root.querySelector("[data-molecule-atom]");
  if (!canvas) return;
  let mol;
  try {
    const res = await fetch(root.dataset.src);
    if (!res.ok) throw new Error(res.status);
    mol = parsePDB(await res.text());
  } catch {
    root.hidden = true;
    return;
  }
  const ctx = canvas.getContext("2d");
  let colors = readColors();
  let tint = shades(colors, colors.paper);
  let spin = 0;
  let yaw = 0.35;
  let pitch = -0.2;
  let vYaw = 0;
  let vPitch = 0;
  let lastInteract = -Infinity;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let projected = [];
  const defaultReadout = readout ? readout.textContent : "";

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = r.width;
    height = r.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    draw();
  }

  function draw() {
    if (!width) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const S = (Math.min(width, height) * 0.46) / mol.extent;
    const cyw = Math.cos(yaw);
    const syw = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cam = mol.extent * 4;

    const cs = Math.cos(spin);
    const ss = Math.sin(spin);
    projected = mol.atoms.map((a) => {
      const ay = a.y * cs - a.z * ss;
      const az = a.y * ss + a.z * cs;
      const x1 = a.x * cyw - az * syw;
      const z1 = a.x * syw + az * cyw;
      const y2 = ay * cp - z1 * sp;
      const z2 = ay * sp + z1 * cp;
      const f = cam / (cam - z2);
      return {
        x: width / 2 + x1 * S * f,
        y: height / 2 - y2 * S * f,
        z: z2,
        f,
        a,
      };
    });

    const near = (z) => Math.min(1, Math.max(0, (z / mol.extent + 1) / 2));
    const items = [];
    for (const [i, j] of mol.bonds) {
      const p = projected[i];
      const q = projected[j];
      const mx = (p.x + q.x) / 2;
      const my = (p.y + q.y) / 2;
      items.push({ kind: "bond", z: (p.z * 3 + q.z) / 4 - 0.01, p, mx, my });
      items.push({ kind: "bond", z: (q.z * 3 + p.z) / 4 - 0.01, p: q, mx, my });
    }
    for (const p of projected) items.push({ kind: "atom", z: p.z, p });
    items.sort((s, t) => s.z - t.z);

    ctx.lineCap = "round";
    const binOf = (z) =>
      Math.min(DEPTH_BINS - 1, Math.floor(near(z) * DEPTH_BINS));
    for (const it of items) {
      const p = it.p;
      const b = binOf(it.z);
      if (it.kind === "bond") {
        const el = p.a.el === "H" ? "outline" : tint[p.a.el] ? p.a.el : "C";
        ctx.strokeStyle = tint[el][b];
        ctx.lineWidth = Math.max(1.5, 0.16 * S * p.f);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(it.mx, it.my);
        ctx.stroke();
      } else {
        const r = (RADIUS[p.a.el] || 0.4) * S * p.f;
        ctx.fillStyle = (tint[p.a.el] || tint.C)[b];
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = tint.outline[b];
        ctx.stroke();
        p.r = r;
      }
    }
  }

  let raf = 0;
  let running = false;
  let visible = false;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!REDUCED.matches && now - lastInteract > 2500) spin += 0.45 * dt;
    yaw += vYaw;
    pitch = Math.max(-1.3, Math.min(1.3, pitch + vPitch));
    vYaw *= 0.9;
    vPitch *= 0.9;
    draw();
    const settled =
      REDUCED.matches && Math.abs(vYaw) < 1e-4 && Math.abs(vPitch) < 1e-4;
    if (running && !settled) raf = requestAnimationFrame(frame);
    else running = false;
  }
  function kick() {
    if (running || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    visible ? kick() : stop();
  }).observe(canvas);
  document.addEventListener("visibilitychange", () =>
    document.hidden ? stop() : kick(),
  );

  let dragging = false;
  let px = 0;
  let py = 0;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    px = e.clientX;
    py = e.clientY;
    lastInteract = performance.now();
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) {
      vYaw = (e.clientX - px) * 0.01;
      vPitch = (e.clientY - py) * 0.008;
      yaw += vYaw;
      pitch = Math.max(-1.3, Math.min(1.3, pitch + vPitch));
      px = e.clientX;
      py = e.clientY;
      lastInteract = performance.now();
      kick();
      return;
    }
    if (!readout) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    let best = null;
    for (const p of projected) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d <= (p.r || 6) + 2 && (!best || p.z > best.z)) best = p;
    }
    readout.textContent = best
      ? `${best.a.name}, ${ELEMENT_NAMES[best.a.el] || best.a.el}`
      : defaultReadout;
  });
  const end = () => {
    dragging = false;
    lastInteract = performance.now();
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", () => {
    if (readout && !dragging) readout.textContent = defaultReadout;
  });
  canvas.addEventListener("keydown", (e) => {
    const k = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.08], ArrowDown: [0, 0.08] }[e.key];
    if (!k) return;
    e.preventDefault();
    vYaw = k[0];
    vPitch = k[1];
    lastInteract = performance.now();
    kick();
  });

  const onTheme = () => {
    colors = readColors();
    tint = shades(colors, colors.paper);
    draw();
  };
  document.addEventListener("themechange", onTheme);
  new MutationObserver(onTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  new ResizeObserver(resize).observe(canvas);
  resize();
}

function boot() {
  document.querySelectorAll("[data-molecule-root]").forEach(initMolecule);
}
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", boot);
else boot();
