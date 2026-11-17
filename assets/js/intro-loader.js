/**
 * intro-loader.js: the homepage intro. Particles scattered across the whole
 * screen converge into benzene (atoms and bonds first, then the π₁ cloud
 * sampled from |ψ|²), hold while the page finishes loading, then the
 * molecule flies through the camera and the page underneath is revealed.
 *
 * The inline script in index.html's <head> decides whether to play
 * (once per tab session; never for reduced motion or crawlers; ?intro
 * forces it) by adding html.intro-running. This module does nothing if that
 * class is absent. Click, any key, or the Skip button jumps to the exit.
 * On finish it removes the class and dispatches `intro:done` on document.
 */
import {
  ATOMS,
  BONDS,
  sampleMO,
  makeRotation,
  mulberry32,
  ball,
  tokenRGB,
} from "./chem/benzene.js";

const root = document.documentElement;
const overlay = document.getElementById("intro");

if (overlay && root.classList.contains("intro-running")) run();

function run() {
  const canvas = overlay.querySelector("canvas");
  const log = overlay.querySelector("[data-intro-log]");
  const skipBtn = overlay.querySelector("[data-intro-skip]");
  const ctx = canvas.getContext("2d");
  const rnd = mulberry32(7);

  // ---------- particles ----------
  // kind: 0 π+, 1 π−, 2 carbon, 3 hydrogen, 4 bond
  const parts = [];
  const cloud = sampleMO("pi1", 1700, 99);
  for (let i = 0; i < 1700; i++) {
    parts.push({
      tx: cloud[i * 4], ty: cloud[i * 4 + 1], tz: cloud[i * 4 + 2],
      kind: cloud[i * 4 + 3] > 0 ? 0 : 1,
      delay: 520 + rnd() * 520,
    });
  }
  ATOMS.forEach((a) => {
    const n = a.el === "C" ? 64 : 26;
    const r = a.el === "C" ? 0.3 : 0.19;
    for (let i = 0; i < n; i++) {
      const [x, y, z] = ball(rnd, a.x, a.y, a.z, r);
      parts.push({ tx: x, ty: y, tz: z, kind: a.el === "C" ? 2 : 3, delay: 140 + rnd() * 360 });
    }
  });
  BONDS.forEach(([i, j, kind]) => {
    const a = ATOMS[i];
    const b = ATOMS[j];
    const n = kind === "CC" ? 36 : 16;
    for (let s = 0; s < n; s++) {
      const t = (s + 0.5) / n;
      parts.push({
        tx: a.x + (b.x - a.x) * t + (rnd() - 0.5) * 0.035,
        ty: a.y + (b.y - a.y) * t + (rnd() - 0.5) * 0.035,
        tz: a.z + (b.z - a.z) * t + (rnd() - 0.5) * 0.035,
        kind: 4,
        delay: 300 + rnd() * 380,
      });
    }
  });

  let W = 0;
  let H = 0;
  let dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(innerWidth * dpr);
    H = Math.round(innerHeight * dpr);
    canvas.width = W;
    canvas.height = H;
  }
  resize();
  addEventListener("resize", resize);

  // Start positions: anywhere on screen, some just beyond the edges, so the
  // particles visibly arrive from all around.
  parts.forEach((p) => {
    p.sx = (rnd() * 1.24 - 0.12);
    p.sy = (rnd() * 1.24 - 0.12);
    p.wob = rnd() * Math.PI * 2;
  });

  const colors = {
    paper: tokenRGB("--paper", [241, 244, 238]),
    plus: tokenRGB("--oxygen", [224, 67, 42]),
    minus: tokenRGB("--nitrogen", [0, 119, 111]),
    ink: tokenRGB("--ink", [15, 27, 24]),
    graphite: tokenRGB("--graphite", [77, 95, 88]),
  };
  const kindColor = [colors.plus, colors.minus, colors.ink, colors.graphite, colors.graphite];
  const kindAlpha = [0.72, 0.72, 0.95, 0.85, 0.85];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, a).toFixed(3)})`;

  // ---------- timeline ----------
  const CONVERGE = 1150; // per-particle travel time
  const HOLD_MIN = 2350; // earliest exit start
  const HOLD_MAX = 4800; // exit even if the page is still loading
  const EXIT = 950;
  const t0 = performance.now();
  let exitAt = 0;
  let exitDur = EXIT;
  let ready = false;

  const pageReady = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((r) => addEventListener("load", r, { once: true })),
  ]);
  pageReady.then(() => {
    ready = true;
  });

  const lines = [
    [80, "sampling |ψ|² for benzene, π₁"],
    [1150, "C₆H₆: 6 carbons, 6 hydrogens, 6 π electrons"],
    [2050, "ready"],
  ];
  let lineIdx = 0;
  function writeLog(t) {
    while (lineIdx < lines.length && t >= lines[lineIdx][0]) {
      if (lines[lineIdx][1] === "ready" && !ready && t < HOLD_MAX) break;
      const p = document.createElement("p");
      p.textContent = lines[lineIdx][1];
      log.appendChild(p);
      lineIdx++;
    }
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeIn = (t) => t * t * t;
  const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

  let done = false;
  function startExit(now, dur) {
    if (exitAt) return;
    exitAt = now;
    exitDur = dur;
    root.classList.add("intro-exit");
  }

  function finish() {
    if (done) return;
    done = true;
    removeEventListener("resize", resize);
    root.classList.remove("intro-running", "intro-exit");
    overlay.hidden = true;
    try {
      sessionStorage.setItem("sbs-intro", "1");
    } catch (_) {
      /* the intro will just play again next time */
    }
    document.dispatchEvent(new CustomEvent("intro:done"));
  }

  function skip() {
    startExit(performance.now(), 520);
  }
  skipBtn?.addEventListener("click", skip);
  overlay.addEventListener("pointerdown", (e) => {
    if (e.target !== skipBtn) skip();
  });
  addEventListener("keydown", function onKey(e) {
    if (done) return removeEventListener("keydown", onKey);
    if (e.key === "Tab") return; // let keyboard users reach the Skip button
    skip();
  });

  function frame(now) {
    if (done) return;
    const t = now - t0;
    writeLog(t);
    if (!exitAt && t >= HOLD_MIN && (ready || t >= HOLD_MAX)) startExit(now, EXIT);

    const yaw = 0.6 + t * 0.00042;
    const pitch = -1.0 + Math.sin(t * 0.0006) * 0.06;
    const rot = makeRotation(yaw, pitch);
    const cx = W / 2;
    const cy = H / 2;
    const scale = Math.min(W, H) / 8.2;

    // Exit: the camera moves through the molecule.
    const e = exitAt ? clamp01((now - exitAt) / exitDur) : 0;
    const D0 = 26;
    const D = D0 - easeIn(e) * (D0 + 1.5);
    const fade = 1 - clamp01((e - 0.35) / 0.65);

    ctx.clearRect(0, 0, W, H);
    overlay.style.backgroundColor = rgba(colors.paper, 1 - ease(clamp01((e - 0.15) / 0.75)));

    const fadeIn = clamp01(t / 380);
    const dotBase = Math.max(1.2, dpr * 1.45);

    // Bucket by colour so each colour is one path.
    const paths = kindColor.map(() => [new Path2D(), new Path2D()]); // [far, near]
    for (const p of parts) {
      const [x, y, z] = rot(p.tx, p.ty, p.tz);
      const depthGap = D - z;
      if (depthGap < 0.6) continue; // behind the camera
      const k = D0 / depthGap;
      const mx = cx + x * scale * k;
      const my = cy - y * scale * k;

      const u = ease(clamp01((t - p.delay) / CONVERGE));
      const wob = (1 - u) * 6 * dpr;
      const sx = p.sx * W + Math.cos(p.wob + t * 0.0012) * wob;
      const sy = p.sy * H + Math.sin(p.wob + t * 0.0011) * wob;
      const X = sx + (mx - sx) * u;
      const Y = sy + (my - sy) * u;
      const r = dotBase * (p.kind >= 2 ? 1.05 : 0.95) * (1 + (k - 1) * 0.55 * u) * (0.85 + 0.3 * clamp01((z + 3) / 6));
      const path = paths[p.kind][z >= 0 ? 1 : 0];
      path.moveTo(X + r, Y);
      path.arc(X, Y, r, 0, 6.2832);
    }
    // Far half of the cloud, then bonds and atoms, then the near half.
    const fill = (kind, layer) => {
      ctx.fillStyle = rgba(kindColor[kind], kindAlpha[kind] * fadeIn * fade);
      ctx.fill(paths[kind][layer]);
    };
    fill(0, 0);
    fill(1, 0);
    for (const kind of [4, 3, 2]) {
      fill(kind, 0);
      fill(kind, 1);
    }
    fill(0, 1);
    fill(1, 1);

    if (exitAt && e >= 1) return finish();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Safety net: never trap the page behind the overlay.
  setTimeout(finish, HOLD_MAX + EXIT + 2500);
}
