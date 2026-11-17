/**
 * benzene-stage.js: the homepage hero figure. Benzene in ball-and-stick,
 * wrapped in one of its six π molecular orbitals drawn as Monte Carlo
 * samples of |ψ|² (see chem/benzene.js). The picker is the MO energy
 * diagram itself; choosing a level morphs the cloud to that orbital.
 *
 * Markup contract (index.html):
 *   [data-stage]
 *     canvas[data-stage-canvas]
 *     button[data-mo="pi1"] ...              energy-level buttons
 *     [data-mo-name] [data-mo-sym] [data-mo-energy] [data-mo-note]
 *
 * Phase colours come from tokens: --oxygen for ψ > 0, --nitrogen for ψ < 0.
 * Drag or arrow keys rotate; keys 1–6 pick an orbital. Pauses offscreen and
 * in hidden tabs; still under prefers-reduced-motion.
 */
import {
  ATOMS,
  BONDS,
  MOS,
  MO_BY_ID,
  sampleMO,
  makeRotation,
  mulberry32,
  tokenRGB,
} from "./chem/benzene.js";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
const N = 2600;
const MORPH_MS = 1100;
const ASSEMBLE_MS = 1500;
const SPIN = 0.16; // rad/s about the ring normal
const BINS = 6;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

export function initStage(root) {
  const canvas = root.querySelector("[data-stage-canvas]");
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  const buttons = Array.from(root.querySelectorAll("[data-mo]"));
  const out = {
    name: root.querySelector("[data-mo-name]"),
    sym: root.querySelector("[data-mo-sym]"),
    energy: root.querySelector("[data-mo-energy]"),
    note: root.querySelector("[data-mo-note]"),
  };

  let W = 0;
  let H = 0;
  let dpr = 1;
  let scale = 1;
  let yaw = 0.35;
  let pitch = -1.08; // ring seen from ~62° above its plane
  let current = "pi1";
  let colors = {};

  // Point state: from → to morph with a per-point delay.
  const pos = new Float32Array(N * 3);
  const from = new Float32Array(N * 3);
  const sign = new Float32Array(N);
  const nextSign = new Float32Array(N);
  const delay = new Float32Array(N);
  const rnd = mulberry32(42);
  for (let i = 0; i < N; i++) delay[i] = rnd() * 0.35;
  let target = sampleMO(current, N);
  let morphT0 = 0;
  let morphing = false;
  let morphDur = MORPH_MS;

  function setTargets(id) {
    target = sampleMO(id, N);
    for (let i = 0; i < N; i++) nextSign[i] = target[i * 4 + 3];
  }

  // Start scattered on a wide shell, so the molecule assembles on first view.
  function scatter() {
    for (let i = 0; i < N; i++) {
      const u = rnd() * 2 - 1;
      const t = rnd() * Math.PI * 2;
      const r = 7 + rnd() * 5;
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(t);
      pos[i * 3 + 1] = r * s * Math.sin(t);
      pos[i * 3 + 2] = r * u;
    }
  }

  function settle() {
    for (let i = 0; i < N; i++) {
      pos[i * 3] = target[i * 4];
      pos[i * 3 + 1] = target[i * 4 + 1];
      pos[i * 3 + 2] = target[i * 4 + 2];
      sign[i] = target[i * 4 + 3];
    }
  }

  function beginMorph(dur) {
    from.set(pos);
    morphT0 = performance.now();
    morphDur = dur;
    morphing = true;
  }

  function readColors() {
    colors = {
      plus: tokenRGB("--oxygen", [224, 67, 42]),
      minus: tokenRGB("--nitrogen", [0, 119, 111]),
      ink: tokenRGB("--ink", [15, 27, 24]),
      graphite: tokenRGB("--graphite", [77, 95, 88]),
      surface: tokenRGB("--surface", [251, 252, 249]),
      dark: document.documentElement.getAttribute("data-theme") !== "light",
    };
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(r.width * dpr);
    H = Math.round(r.height * dpr);
    canvas.width = W;
    canvas.height = H;
    // 8.4 Å across the shorter side: the H atoms and the cloud's edge fit.
    scale = Math.min(W, H) / 8.4;
    draw(performance.now());
  }

  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

  // Reused buffers for the per-frame projection.
  const px = new Float32Array(N);
  const py = new Float32Array(N);
  const pz = new Float32Array(N);

  function draw(now) {
    if (!W) return;
    // advance morph
    if (morphing) {
      const T = (now - morphT0) / morphDur;
      let done = true;
      for (let i = 0; i < N; i++) {
        const t = clamp01((T - delay[i]) / 0.65);
        if (t < 1) done = false;
        const e = easeInOut(t);
        pos[i * 3] = from[i * 3] + (target[i * 4] - from[i * 3]) * e;
        pos[i * 3 + 1] = from[i * 3 + 1] + (target[i * 4 + 1] - from[i * 3 + 1]) * e;
        pos[i * 3 + 2] = from[i * 3 + 2] + (target[i * 4 + 2] - from[i * 3 + 2]) * e;
        if (t > 0.5) sign[i] = nextSign[i];
      }
      if (done) morphing = false;
    }

    ctx.clearRect(0, 0, W, H);
    const rot = makeRotation(yaw, pitch);
    const cx = W / 2;
    const cy = H / 2;
    const D = 16; // camera distance in Å, for a mild perspective

    for (let i = 0; i < N; i++) {
      const [x, y, z] = rot(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      const k = D / (D - z);
      px[i] = cx + x * scale * k;
      py[i] = cy - y * scale * k;
      pz[i] = z;
    }

    // Atoms and bonds, projected once.
    const A = ATOMS.map((a) => {
      const [x, y, z] = rot(a.x, a.y, a.z);
      const k = D / (D - z);
      return { el: a.el, x: cx + x * scale * k, y: cy - y * scale * k, z, k };
    });

    // Painter: far cloud, then the molecule (depth-sorted), then near cloud.
    const dot = Math.max(1.1, scale * 0.045) ;
    const paintCloud = (front) => {
      for (let b = 0; b < BINS; b++) {
        for (const sgn of [1, -1]) {
          ctx.beginPath();
          let any = false;
          for (let i = 0; i < N; i++) {
            if (sign[i] !== sgn) continue;
            const z = pz[i];
            if (front ? z < 0 : z >= 0) continue;
            const depth = clamp01((z + 4) / 8); // 0 far → 1 near
            const bin = Math.min(BINS - 1, (depth * BINS) | 0);
            if (bin !== b) continue;
            const r = dot * (0.7 + 0.6 * depth);
            ctx.moveTo(px[i] + r, py[i]);
            ctx.arc(px[i], py[i], r, 0, 6.2832);
            any = true;
          }
          if (any) {
            const depth = (b + 0.5) / BINS;
            const a = (colors.dark ? 0.32 : 0.36) + 0.5 * depth;
            ctx.fillStyle = rgba(sgn > 0 ? colors.plus : colors.minus, a);
            ctx.fill();
          }
        }
      }
    };

    paintCloud(false);

    const items = [];
    for (const [i, j, kind] of BONDS) {
      items.push({ t: "b", a: A[i], b: A[j], z: (A[i].z + A[j].z) / 2, kind });
    }
    for (const a of A) items.push({ t: "a", a, z: a.z });
    items.sort((p, q) => p.z - q.z);
    ctx.lineCap = "round";
    for (const it of items) {
      if (it.t === "b") {
        ctx.strokeStyle = rgba(colors.graphite, 0.9);
        ctx.lineWidth = scale * (it.kind === "CC" ? 0.11 : 0.08);
        ctx.beginPath();
        ctx.moveTo(it.a.x, it.a.y);
        ctx.lineTo(it.b.x, it.b.y);
        ctx.stroke();
      } else {
        const a = it.a;
        const r = scale * (a.el === "C" ? 0.3 : 0.19) * a.k;
        ctx.beginPath();
        ctx.arc(a.x, a.y, r, 0, 6.2832);
        if (a.el === "C") {
          ctx.fillStyle = rgba(colors.ink, 1);
          ctx.fill();
        } else {
          ctx.fillStyle = rgba(colors.surface, 1);
          ctx.fill();
          ctx.lineWidth = Math.max(1, scale * 0.045);
          ctx.strokeStyle = rgba(colors.ink, 0.85);
          ctx.stroke();
        }
      }
    }

    paintCloud(true);
  }

  // ---------- loop ----------
  let raf = 0;
  let last = 0;
  let visible = true;
  let idleUntil = 0;
  const still = () => REDUCED.matches;

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    if (!still() && now > idleUntil) yaw += SPIN * dt;
    draw(now);
    schedule();
  }
  function schedule() {
    if (raf || !visible || document.hidden) return;
    if (still() && !morphing && !dragging) return;
    raf = requestAnimationFrame(frame);
  }
  function kick() {
    last = 0;
    schedule();
    if (still()) draw(performance.now());
  }

  // ---------- picker ----------
  function paintPicker() {
    const mo = MO_BY_ID[current];
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mo === current)));
    if (out.name) out.name.innerHTML = mo.html;
    if (out.sym) out.sym.innerHTML = mo.sym;
    if (out.energy) out.energy.textContent = mo.energy;
    if (out.note) out.note.innerHTML = mo.note;
    canvas.setAttribute(
      "aria-label",
      `Benzene with its ${mo.label} molecular orbital, ${mo.energy}, drawn as ${N.toLocaleString("en")} sampled points. Drag or use arrow keys to rotate.`,
    );
  }

  function select(id) {
    if (!MO_BY_ID[id] || id === current) return;
    current = id;
    setTargets(id);
    paintPicker();
    if (still()) {
      settle();
      draw(performance.now());
    } else {
      beginMorph(MORPH_MS);
      kick();
    }
  }

  buttons.forEach((b) => b.addEventListener("click", () => select(b.dataset.mo)));
  // The hero terminal's `orbital` command.
  document.addEventListener("stage:select", (e) => select(e.detail));

  // ---------- rotate by drag / keys ----------
  let dragging = false;
  let lx = 0;
  let ly = 0;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lx = e.clientX;
    ly = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    kick();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    yaw += (e.clientX - lx) * 0.01;
    pitch = Math.max(-2.6, Math.min(-0.1, pitch + (e.clientY - ly) * 0.01));
    lx = e.clientX;
    ly = e.clientY;
    idleUntil = performance.now() + 3000;
    if (still()) draw(performance.now());
  });
  const endDrag = () => {
    dragging = false;
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("keydown", (e) => {
    const step = 0.12;
    if (e.key === "ArrowLeft") yaw -= step;
    else if (e.key === "ArrowRight") yaw += step;
    else if (e.key === "ArrowUp") pitch = Math.max(-2.6, pitch - step);
    else if (e.key === "ArrowDown") pitch = Math.min(-0.1, pitch + step);
    else if (/^[1-6]$/.test(e.key)) select(MOS[Number(e.key) - 1].id);
    else return;
    e.preventDefault();
    idleUntil = performance.now() + 3000;
    draw(performance.now());
  });

  // ---------- lifecycle ----------
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) kick();
  }).observe(canvas);
  document.addEventListener("visibilitychange", kick);
  REDUCED.addEventListener("change", () => {
    if (still()) {
      morphing = false;
      settle();
    }
    kick();
  });
  new MutationObserver(() => {
    readColors();
    draw(performance.now());
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette"] });

  readColors();
  setTargets(current);
  paintPicker();
  new ResizeObserver(resize).observe(canvas);

  let assembled = false;
  function assemble() {
    if (assembled) return;
    assembled = true;
    if (still()) {
      settle();
      draw(performance.now());
      return;
    }
    scatter();
    for (let i = 0; i < N; i++) sign[i] = nextSign[i];
    beginMorph(ASSEMBLE_MS);
    kick();
  }

  // Assemble when the intro hands over (or at once if there is no intro).
  if (document.documentElement.classList.contains("intro-running")) {
    settle();
    document.addEventListener("intro:done", assemble, { once: true });
    // Hide the settled cloud until the intro finishes.
    scatter();
  } else {
    assemble();
  }

  return { select, assemble };
}

document.querySelectorAll("[data-stage]").forEach(initStage);
