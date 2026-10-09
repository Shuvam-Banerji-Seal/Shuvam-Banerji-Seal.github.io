/**
 * <thinking-orb> — the site's only "waiting / thinking" indicator.
 *
 *   <thinking-orb size="20" label="Generating reply"></thinking-orb>
 *
 * Attributes: size (px, default 20), speed (multiplier, default 1),
 * label (aria-label, default "Working"). Ink is currentColor, so the orb
 * follows the surrounding text colour in both themes.
 *
 * Ported from the "working" state of thinking-orbs (orbits.ts + core.ts
 * painter, React wrapper replaced by a custom element).
 *
 * MIT License
 * Copyright (c) 2026 Jakub Antalik
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the
 * following conditions: The above copyright notice and this permission
 * notice shall be included in all copies or substantial portions of the
 * Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 * https://github.com/Jakubantalik/thinking-orbs
 */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

const hash = (a, b) => {
  const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return h - Math.floor(h);
};

function frame(size, t) {
  // Small orbs get fewer, larger particles (the original's 20px preset).
  const small = size < 40;
  const orbitN = 12;
  const ghostN = small ? 10 : 40;
  const partR = small ? 2.4 : 1.2;
  const RS = Math.pow(size / 300, 0.6);
  const R = (size / 2) * 0.82;
  const yaw = t * 0.12;
  const tilt = 0.3;
  const sy = Math.sin(yaw);
  const cw = Math.cos(yaw);
  const st = Math.sin(tilt);
  const ct = Math.cos(tilt);
  const dots = [];

  for (let orb = 0; orb < orbitN; orb++) {
    const h1 = hash(orb, 1.7);
    const h2 = hash(orb, 5.2);
    const h3 = hash(orb, 8.9);
    const ro = R * (0.45 + 0.52 * h1);
    const th = h1 * 2 * Math.PI;
    const phi = Math.acos(2 * h2 - 1);
    const nx = Math.sin(phi) * Math.cos(th);
    const ny = Math.cos(phi);
    const nz = Math.sin(phi) * Math.sin(th);
    let ux = -ny;
    let uy = nx;
    const ul = Math.max(1e-6, Math.hypot(ux, uy));
    ux /= ul;
    uy /= ul;
    const vx = -nz * uy;
    const vy = nz * ux;
    const vz = nx * uy - ny * ux;
    const sp = (0.25 + 0.55 * h3) * (h3 > 0.5 ? 1 : -1);

    const at = (a) => {
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const x = (ux * ca + vx * sa) * ro;
      const y = (uy * ca + vy * sa) * ro;
      const z = vz * sa * ro;
      const x1 = x * cw + z * sy;
      const z1 = -x * sy + z * cw;
      const y1 = y * ct - z1 * st;
      const z2 = y * st + z1 * ct;
      return [size / 2 + x1, size / 2 - y1, z2, (z2 / ro + 1) / 2];
    };

    for (let k = 0; k < ghostN; k++) {
      const [x, y, z, d] = at((k / ghostN) * 2 * Math.PI);
      dots.push({ x, y, z, r: 0.9 * RS, a: 0.22 * (0.4 + 0.6 * d) });
    }
    for (let m = 0; m < 3; m++) {
      const [x, y, z, d] = at(t * sp + (m / 3) * 2 * Math.PI + h2 * 6);
      dots.push({ x, y, z, r: (partR + 1.6 * d) * RS, a: 0.55 + 0.45 * d });
    }
  }
  return dots.sort((p, q) => p.z - q.z);
}

class ThinkingOrb extends HTMLElement {
  connectedCallback() {
    const size = Math.max(12, parseInt(this.getAttribute("size") || "20", 10));
    const speed = parseFloat(this.getAttribute("speed") || "1") * 1.885;
    this.classList.add("thinking-orb");
    this.setAttribute("role", "img");
    if (!this.hasAttribute("aria-label"))
      this.setAttribute("aria-label", this.getAttribute("label") || "Working");
    this.style.width = this.style.height = size + "px";

    const canvas = document.createElement("canvas");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = canvas.height = Math.round(size * dpr);
    canvas.style.width = canvas.style.height = size + "px";
    canvas.style.display = "block";
    this.replaceChildren(canvas);
    const ctx = canvas.getContext("2d");

    const paint = (t) => {
      const ink = getComputedStyle(this).color;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = ink;
      for (const d of frame(size, t)) {
        if (d.a < 0.02) continue;
        ctx.globalAlpha = d.a;
        ctx.beginPath();
        ctx.arc(d.x, d.y, Math.max(0.35, d.r), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    let running = false;
    let visible = true;
    const now = () => (performance.now() / 1000) * speed;
    const loop = () => {
      paint(now());
      if (running) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || REDUCED.matches || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    paint(REDUCED.matches ? 0.6 : now());
    this._io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible ? start() : stop();
    });
    this._io.observe(this);
    this._onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", this._onVis);
    this._stop = stop;
    start();
  }

  disconnectedCallback() {
    this._stop?.();
    this._io?.disconnect();
    document.removeEventListener("visibilitychange", this._onVis);
  }
}

if (!customElements.get("thinking-orb"))
  customElements.define("thinking-orb", ThinkingOrb);
