/**
 * orbital.js: the homepage figure. A hydrogen orbital drawn as Monte Carlo
 * samples of |ψ|², the way chemistry textbooks draw electron density.
 *
 * Sampling is exact, not decorative. For the nodeless orbitals used here
 * (1s, 2p, 3d, 4f, i.e. l = n − 1) the radial density r²R(r)² is a Gamma
 * distribution with shape 2l + 3 and scale n / 2, so r is drawn directly;
 * the direction is rejection-sampled from the real angular part |Y|².
 * Dot colour is the sign of ψ: oxygen (vermilion) for +, nitrogen (teal) for −.
 * On a figure marked data-accent (the homepage), the page accent
 * --accent-now eases to the active orbital's own hue (--orb-<id>).
 *
 * The depth painter (dot size and ink fall off with distance), the absolute
 * clock and the offscreen/hidden-tab pausing follow thinking-orbs by Jakub
 * Antalik, MIT licence: https://github.com/Jakubantalik/thinking-orbs
 *
 * Markup contract (see index.html):
 *   [data-orbital-root]
 *     canvas[data-orbital-canvas]
 *     button[data-orbital="3dz2"] ...      orbital picker
 *     [data-orbital-name] [data-orbital-qn] [data-orbital-count]
 */

const ORBITALS = {
  "1s": {
    n: 1,
    l: 0,
    m: "0",
    html: "1s",
    spoken: "1s",
    ang: () => 1,
    max: 1,
  },
  "2pz": {
    n: 2,
    l: 1,
    m: "0",
    html: "2p<sub>z</sub>",
    spoken: "2p z",
    ang: (x, y, z) => z,
    max: 1,
  },
  "3dz2": {
    n: 3,
    l: 2,
    m: "0",
    html: "3d<sub>z²</sub>",
    spoken: "3d z squared",
    ang: (x, y, z) => 3 * z * z - 1,
    max: 2,
  },
  "3dxy": {
    n: 3,
    l: 2,
    m: "±2",
    html: "3d<sub>xy</sub>",
    spoken: "3d x y",
    ang: (x, y) => x * y,
    max: 0.5,
  },
  "4fxyz": {
    n: 4,
    l: 3,
    m: "±2",
    html: "4f<sub>xyz</sub>",
    spoken: "4f x y z",
    ang: (x, y, z) => x * y * z,
    max: 1 / (3 * Math.sqrt(3)),
  },
};
const ORDER = ["3dz2", "2pz", "3dxy", "1s", "4fxyz"];

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
const BINS = 7;
const MORPH_MS = 1300;
const INTRO_MS = 1700;
const CYCLE_MS = 8000;

// Small seeded PRNG so the figure looks the same on every visit.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleOrbital(o, count, rand) {
  const pos = new Float32Array(count * 3);
  const sign = new Int8Array(count);
  const radii = new Float32Array(count);
  const shape = 2 * o.l + 3;
  const scale = o.n / 2;
  let i = 0;
  while (i < count) {
    // direction: uniform on the sphere, accepted with |Y|² / max²
    const u = 2 * rand() - 1;
    const phi = 2 * Math.PI * rand();
    const s = Math.sqrt(1 - u * u);
    const x = s * Math.cos(phi);
    const y = s * Math.sin(phi);
    const z = u;
    const a = o.ang(x, y, z);
    if (rand() * o.max * o.max > a * a) continue;
    // radius: Gamma(shape, scale) as a sum of exponentials
    let prod = 1;
    for (let k = 0; k < shape; k++) prod *= 1 - rand();
    const r = -scale * Math.log(prod);
    pos[i * 3] = x * r;
    pos[i * 3 + 1] = y * r;
    pos[i * 3 + 2] = z * r;
    sign[i] = a < 0 ? -1 : 1;
    radii[i] = r;
    i++;
  }
  // Fit: the 94th-percentile radius maps to 1 so every orbital fills the frame.
  const sorted = Array.from(radii).sort((p, q) => p - q);
  const fit = sorted[Math.floor(count * 0.94)] || 1;
  for (let k = 0; k < pos.length; k++) pos[k] /= fit;

  // Order samples by latitude band, then longitude, so a morph moves each
  // dot to a nearby region of the next orbital instead of across the cloud.
  const idx = Array.from({ length: count }, (_, k) => k);
  const key = (k) => {
    const px = pos[k * 3];
    const py = pos[k * 3 + 1];
    const pz = pos[k * 3 + 2];
    const r = Math.hypot(px, py, pz) || 1;
    const band = Math.round((pz / r + 1) * 5);
    return band * 10 + (Math.atan2(py, px) + Math.PI) / (2 * Math.PI);
  };
  const keys = idx.map(key);
  idx.sort((p, q) => keys[p] - keys[q]);
  const pos2 = new Float32Array(count * 3);
  const sign2 = new Int8Array(count);
  idx.forEach((from, to) => {
    pos2[to * 3] = pos[from * 3];
    pos2[to * 3 + 1] = pos[from * 3 + 1];
    pos2[to * 3 + 2] = pos[from * 3 + 2];
    sign2[to] = sign[from];
  });
  return { pos: pos2, sign: sign2 };
}

const easeInOut = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

// ---------- homepage accent ----------
// Each orbital has its own accent hue (--orb-<id> in home.css, per theme).
// --accent-now eases between them in OKLCH along the shorter hue arc, so the
// colour stays saturated through the change. (Mixing the two lobe colours
// directly passed through grey-brown, because teal and vermilion are close to
// complementary.)
const ACCENT_MS = 600;

function parseRGB(value) {
  const hex = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const fn = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(value);
  return fn ? [Number(fn[1]), Number(fn[2]), Number(fn[3])] : null;
}

const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const fromLinear = (v) => {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.round(clamp01(c) * 255);
};

function toOklab([r, g, b]) {
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

function mixRGB(a, b, t) {
  const [L1, a1, b1] = toOklab(a);
  const [L2, a2, b2] = toOklab(b);
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const h1 = Math.atan2(b1, a1);
  let dh = Math.atan2(b2, a2) - h1;
  if (dh > Math.PI) dh -= 2 * Math.PI;
  if (dh < -Math.PI) dh += 2 * Math.PI;
  const L = L1 + (L2 - L1) * t;
  const C = C1 + (C2 - C1) * t;
  const h = h1 + dh * t;
  return fromOklab([L, C * Math.cos(h), C * Math.sin(h)]);
}

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const get = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
  return {
    plus: get("--oxygen", "#c92a39"),
    minus: get("--nitrogen", "#2445c2"),
    ink: get("--ink", "#1a1d22"),
    axis: get("--rule-strong", "#b9bec7"),
    label: get("--graphite", "#59606a"),
  };
}

export function initOrbital(root) {
  const canvas = root.querySelector("[data-orbital-canvas]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const nameEl = root.querySelector("[data-orbital-name]");
  const qnEl = root.querySelector("[data-orbital-qn]");
  const countEl = root.querySelector("[data-orbital-count]");
  const buttons = Array.from(root.querySelectorAll("[data-orbital]"));
  // data-static: draw on demand only (no intro, spin or cycling). Used where
  // several figures share a page, e.g. the gallery.
  const STATIC = root.hasAttribute("data-static");
  const still = () => REDUCED.matches || STATIC;
  // data-accent: this figure drives the page accent (--accent-now).
  const ACCENT = root.hasAttribute("data-accent");

  const N = STATIC ? 1600 : window.innerWidth < 640 ? 1500 : 2400;
  const rand = mulberry32(20221122);
  const cache = {};
  const get = (id) => (cache[id] ||= sampleOrbital(ORBITALS[id], N, rand));

  // Per-dot morph stagger, fixed for the session.
  const stagger = new Float32Array(N);
  for (let i = 0; i < N; i++) stagger[i] = rand() * 0.35;

  let colors = readColors();
  let current =
    root.dataset.orbital ||
    buttons.find((b) => b.getAttribute("aria-pressed") === "true")?.dataset
      .orbital;
  if (!ORBITALS[current]) current = ORDER[0];
  let from = get(current);
  let to = from;
  let morphStart = -Infinity;
  let introStart = performance.now();
  let introDone = still();

  let yaw = 0.6;
  let pitch = 0.32;
  let vYaw = 0;
  let vPitch = 0;
  let lastInteract = -Infinity;
  let userTouched = false;
  let lastCycle = performance.now();

  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    draw(performance.now());
  }

  function updateCaption(id) {
    const o = ORBITALS[id];
    if (nameEl) nameEl.innerHTML = o.html;
    if (qnEl) qnEl.textContent = `n = ${o.n}, l = ${o.l}, m = ${o.m}`;
    canvas.setAttribute(
      "aria-label",
      `Dot-density plot of the hydrogen ${o.spoken} orbital, ${N.toLocaleString()} samples. Drag or use arrow keys to rotate.`,
    );
    buttons.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.orbital === id)),
    );
  }

  // Homepage accent: eases between the orbitals' hues over ACCENT_MS.
  let accentNow = null;
  let accentFrom = null;
  let accentTo = null;
  let accentT0 = 0;
  let accentRaf = 0;

  function accentFor(id) {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(`--orb-${id}`)
      .trim();
    return parseRGB(v) || parseRGB(colors.minus) || [0, 119, 111];
  }

  function applyAccent(rgb) {
    document.documentElement.style.setProperty(
      "--accent-now",
      `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
    );
  }

  function stepAccent(now) {
    const t = clamp01((now - accentT0) / ACCENT_MS);
    accentNow = mixRGB(accentFrom, accentTo, easeInOut(t));
    applyAccent(accentNow);
    accentRaf = t < 1 ? requestAnimationFrame(stepAccent) : 0;
  }

  // Retargets from the colour on screen now, so a fast click never jumps.
  function tweenAccent(target, animate) {
    if (!ACCENT) return;
    cancelAnimationFrame(accentRaf);
    accentRaf = 0;
    if (!animate || !accentNow || still()) {
      accentNow = target;
      applyAccent(target);
      return;
    }
    accentFrom = accentNow;
    accentTo = target;
    accentT0 = performance.now();
    accentRaf = requestAnimationFrame(stepAccent);
  }

  function select(id, byUser) {
    if (!ORBITALS[id] || id === current) return;
    if (byUser) userTouched = true;
    const now = performance.now();
    // Start from wherever the dots are right now.
    from = snapshot(now);
    to = get(id);
    current = id;
    morphStart = still() ? -Infinity : now;
    if (still()) from = to;
    updateCaption(id);
    tweenAccent(accentFor(id), true);
    kick();
  }

  // Current interpolated positions, used when a new morph interrupts one.
  function snapshot(now) {
    const p = (now - morphStart) / MORPH_MS;
    if (p >= 1.35 || from === to) return to;
    const pos = new Float32Array(N * 3);
    const sign = new Int8Array(N);
    for (let i = 0; i < N; i++) {
      const e = easeInOut(clamp01((p - stagger[i]) / 0.65));
      for (let k = 0; k < 3; k++) {
        const j = i * 3 + k;
        pos[j] = from.pos[j] + (to.pos[j] - from.pos[j]) * e;
      }
      sign[i] = e < 0.5 ? from.sign[i] : to.sign[i];
    }
    return { pos, sign };
  }

  const paths = Array.from({ length: BINS * 2 }, () => null);

  function draw(now) {
    if (!width) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const S = Math.min(width, height) * 0.37;
    const cyw = Math.cos(yaw);
    const syw = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);

    const project = (x, y, z) => {
      const x1 = x * cyw - y * syw;
      const y1 = x * syw + y * cyw;
      const y2 = y1 * cp - z * sp;
      const z2 = y1 * sp + z * cp;
      const f = 1 / (1 + y2 * 0.12);
      return [cx + x1 * S * f, cy - z2 * S * f, y2];
    };

    // Axes through the nucleus, labelled like a figure.
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.axis;
    ctx.fillStyle = colors.label;
    ctx.font = '500 12px "Hanken Grotesk", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const L = 1.12;
    for (const [ax, ay, az, label] of [
      [1, 0, 0, "x"],
      [0, 1, 0, "y"],
      [0, 0, 1, "z"],
    ]) {
      const a = project(-ax * L, -ay * L, -az * L);
      const b = project(ax * L, ay * L, az * L);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
      const t = project(ax * (L + 0.07), ay * (L + 0.07), az * (L + 0.07));
      ctx.fillText(label, t[0], t[1]);
    }

    // Dots, binned by depth and phase so each bin is one fill call.
    for (let b = 0; b < paths.length; b++) paths[b] = new Path2D();
    const morphP = (now - morphStart) / MORPH_MS;
    const morphing = from !== to && morphP < 1.35;
    const introP = introDone ? 1 : (now - introStart) / INTRO_MS;
    const base = Math.max(0.9, Math.min(1.7, S / 150));
    let shown = 0;

    for (let i = 0; i < N; i++) {
      let grow = 1;
      if (!introDone) {
        const birth = (i / N) * 0.85;
        grow = easeOut(clamp01((introP - birth) / 0.15));
        if (grow <= 0) continue;
      }
      shown++;
      let x;
      let y;
      let z;
      let sg;
      if (morphing) {
        const e = easeInOut(clamp01((morphP - stagger[i]) / 0.65));
        const j = i * 3;
        x = from.pos[j] + (to.pos[j] - from.pos[j]) * e;
        y = from.pos[j + 1] + (to.pos[j + 1] - from.pos[j + 1]) * e;
        z = from.pos[j + 2] + (to.pos[j + 2] - from.pos[j + 2]) * e;
        sg = e < 0.5 ? from.sign[i] : to.sign[i];
      } else {
        const j = i * 3;
        x = to.pos[j];
        y = to.pos[j + 1];
        z = to.pos[j + 2];
        sg = to.sign[i];
      }
      const [px, py, depth] = project(x, y, z);
      const near = clamp01((1.25 - depth) / 2.5); // 1 = closest to viewer
      const bin = Math.min(BINS - 1, Math.floor(near * BINS));
      const r = base * (0.45 + 0.85 * near) * grow;
      const path = paths[bin * 2 + (sg < 0 ? 1 : 0)];
      path.moveTo(px + r, py);
      path.arc(px, py, r, 0, Math.PI * 2);
    }

    for (let bin = 0; bin < BINS; bin++) {
      ctx.globalAlpha = 0.28 + 0.72 * ((bin + 0.5) / BINS);
      ctx.fillStyle = colors.plus;
      ctx.fill(paths[bin * 2]);
      ctx.fillStyle = colors.minus;
      ctx.fill(paths[bin * 2 + 1]);
    }
    ctx.globalAlpha = 1;

    // Nucleus.
    const nuc = project(0, 0, 0);
    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.arc(nuc[0], nuc[1], 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (countEl) {
      const n = introDone ? N : Math.min(N, shown);
      countEl.textContent = n.toLocaleString();
    }
    if (!introDone && introP >= 1) introDone = true;
  }

  // ---------- loop with offscreen + hidden-tab pausing ----------
  let raf = 0;
  let running = false;
  let visible = true;
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const idle = now - lastInteract > 2500;
    if (!still() && idle) yaw += 0.16 * dt;
    yaw += vYaw;
    pitch = Math.max(-1.2, Math.min(1.2, pitch + vPitch));
    vYaw *= 0.92;
    vPitch *= 0.92;

    if (
      !still() &&
      !userTouched &&
      introDone &&
      now - lastCycle > CYCLE_MS
    ) {
      lastCycle = now;
      const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
      select(next, false);
    }

    draw(now);
    const settled =
      still() &&
      Math.abs(vYaw) < 1e-4 &&
      Math.abs(vPitch) < 1e-4 &&
      introDone;
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

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) kick();
    else stop();
  }).observe(canvas);
  document.addEventListener("visibilitychange", () =>
    document.hidden ? stop() : kick(),
  );

  // ---------- direct manipulation ----------
  let dragging = false;
  let px0 = 0;
  let py0 = 0;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    userTouched = true;
    px0 = e.clientX;
    py0 = e.clientY;
    lastInteract = performance.now();
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    vYaw = (e.clientX - px0) * 0.008;
    vPitch = (e.clientY - py0) * 0.006;
    yaw += vYaw;
    pitch = Math.max(-1.2, Math.min(1.2, pitch + vPitch));
    px0 = e.clientX;
    py0 = e.clientY;
    lastInteract = performance.now();
    kick();
  });
  const endDrag = () => {
    dragging = false;
    lastInteract = performance.now();
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("keydown", (e) => {
    const step = 0.12;
    if (e.key === "ArrowLeft") vYaw = -step;
    else if (e.key === "ArrowRight") vYaw = step;
    else if (e.key === "ArrowUp") vPitch = -step * 0.6;
    else if (e.key === "ArrowDown") vPitch = step * 0.6;
    else return;
    e.preventDefault();
    userTouched = true;
    lastInteract = performance.now();
    kick();
  });

  buttons.forEach((b) =>
    b.addEventListener("click", () => select(b.dataset.orbital, true)),
  );
  // The homepage terminal's `orbital <name>` command.
  if (ACCENT)
    document.addEventListener("orbital:select", (e) =>
      select(e.detail && e.detail.id, true),
    );

  const onTheme = () => {
    colors = readColors();
    tweenAccent(accentFor(current), false);
    draw(performance.now());
  };
  document.addEventListener("themechange", onTheme);
  new MutationObserver(onTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  REDUCED.addEventListener("change", () => {
    introDone = true;
    kick();
  });
  if (document.fonts) document.fonts.ready.then(() => draw(performance.now()));

  new ResizeObserver(resize).observe(canvas);
  updateCaption(current);
  tweenAccent(accentFor(current), false);
  resize();
  introStart = performance.now();
  kick();
}

function boot() {
  document.querySelectorAll("[data-orbital-root]").forEach(initOrbital);
}
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", boot);
else boot();
