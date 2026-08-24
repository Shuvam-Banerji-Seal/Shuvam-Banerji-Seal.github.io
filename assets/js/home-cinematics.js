// ── Home page cinematics ────────────────────────────────────────────────
// Cursor aura + magnetic hover, scroll-driven reveals (anime.js), hero
// parallax, and an interactive constellation field behind the hero.
// All effects respect prefers-reduced-motion and are skipped on touch
// devices where they'd be invisible anyway.

import { animate } from "animejs";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE_POINTER = window.matchMedia("(pointer: fine)").matches;

/* ── 1. Custom cursor aura ─────────────────────────────────────────── */
function initCursor() {
  if (REDUCED || !FINE_POINTER) return;

  const dot = document.createElement("div");
  const ring = document.createElement("div");
  dot.className = "cur-dot";
  ring.className = "cur-ring";
  document.body.append(dot, ring);

  let mx = innerWidth / 2,
    my = innerHeight / 2;
  let rx = mx,
    ry = my;

  window.addEventListener(
    "mousemove",
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    },
    { passive: true },
  );

  (function followRing() {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(followRing);
  })();

  // grow the ring over interactive elements ("magnetic" feel)
  const HOVER_SEL =
    'a, button, [role="button"], input, textarea, select, .terminal-window';
  document.addEventListener(
    "mouseover",
    (e) => {
      ring.classList.toggle("big", !!e.target.closest(HOVER_SEL));
    },
    { passive: true },
  );
}

/* ── 2. Chemical-molecule constellation behind the hero ────────────────
   Instead of abstract star dots, real molecules — benzene, water,
   methane, CO2, N2 — drift as atom-and-bond structures. Cursor
   repulsion still pushes them aside. */
function initConstellation() {
  if (REDUCED) return;
  const host = document.querySelector(".hero");
  if (!host) return;

  const canvas = document.createElement("canvas");
  canvas.className = "constellation";
  host.prepend(canvas);
  const ctx = canvas.getContext("2d");

  // 2D molecule templates: atoms [x, y, element], bonds [i, j] (unit = bond length)
  const ELEMENT_COLORS = {
    C: "#8a97ab",
    H: "#dfe7f1",
    O: "#f87171",
    N: "#60a5fa",
  };
  const MOLECULES = [
    {
      // benzene C6H6
      atoms: [
        [1, 0, "C"],
        [0.5, 0.866, "C"],
        [-0.5, 0.866, "C"],
        [-1, 0, "C"],
        [-0.5, -0.866, "C"],
        [0.5, -0.866, "C"],
        [1.9, 0, "H"],
        [0.95, 1.645, "H"],
        [-0.95, 1.645, "H"],
        [-1.9, 0, "H"],
        [-0.95, -1.645, "H"],
        [0.95, -1.645, "H"],
      ],
      bonds: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 0],
        [0, 6],
        [1, 7],
        [2, 8],
        [3, 9],
        [4, 10],
        [5, 11],
      ],
    },
    {
      // water H2O (bent ~104.5°)
      atoms: [
        [0, 0, "O"],
        [0.96, 0.33, "H"],
        [-0.96, 0.33, "H"],
      ],
      bonds: [
        [0, 1],
        [0, 2],
      ],
    },
    {
      // methane CH4 (2D projection)
      atoms: [
        [0, 0, "C"],
        [1, 0, "H"],
        [0, 1, "H"],
        [-1, 0, "H"],
        [0, -1, "H"],
      ],
      bonds: [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
      ],
    },
    {
      // carbon dioxide O=C=O (linear)
      atoms: [
        [-1.1, 0, "O"],
        [0, 0, "C"],
        [1.1, 0, "O"],
      ],
      bonds: [
        [0, 1],
        [1, 2],
      ],
    },
    {
      // nitrogen N≡N
      atoms: [
        [-0.55, 0, "N"],
        [0.55, 0, "N"],
      ],
      bonds: [[0, 1]],
    },
  ];

  let W = 0,
    H = 0,
    dpr = Math.min(2, devicePixelRatio || 1);
  const mols = [];
  const COUNT = innerWidth < 768 ? 7 : 12;
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    const r = host.getBoundingClientRect();
    W = r.width;
    H = r.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    mols.length = 0;
    for (let i = 0; i < COUNT; i++) {
      const tmpl = MOLECULES[i % MOLECULES.length];
      mols.push({
        tmpl,
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.0035,
        scale: 14 + Math.random() * 16,
        alpha: 0.5 + Math.random() * 0.35,
      });
    }
  }

  resize();
  seed();
  window.addEventListener("resize", () => {
    resize();
    seed();
  });

  host.addEventListener(
    "mousemove",
    (e) => {
      const r = host.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    },
    { passive: true },
  );
  host.addEventListener("mouseleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  const MOUSE_RADIUS = 150;

  function drawMolecule(m) {
    const { tmpl, scale } = m;
    const cos = Math.cos(m.rot);
    const sin = Math.sin(m.rot);
    const pts = tmpl.atoms.map(([ax, ay, el]) => ({
      x: m.x + (ax * cos - ay * sin) * scale,
      y: m.y + (ax * sin + ay * cos) * scale,
      el,
    }));
    // bonds
    ctx.strokeStyle = `rgba(139,155,180,${0.4 * m.alpha})`;
    ctx.lineWidth = 1.6;
    for (const [a, b] of tmpl.bonds) {
      ctx.beginPath();
      ctx.moveTo(pts[a].x, pts[a].y);
      ctx.lineTo(pts[b].x, pts[b].y);
      ctx.stroke();
    }
    // atoms
    const radii = { C: 5.2, O: 5.4, N: 5.2, H: 3.4 };
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, radii[p.el] || 4.5, 0, Math.PI * 2);
      ctx.fillStyle = ELEMENT_COLORS[p.el] || "#8a97ab";
      ctx.globalAlpha = m.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  (function frame() {
    requestAnimationFrame(frame);
    if (H === 0 || host.getBoundingClientRect().bottom < 0) return; // off-screen

    ctx.clearRect(0, 0, W, H);

    for (const m of mols) {
      // drift + slow tumble
      m.x += m.vx;
      m.y += m.vy;
      m.rot += m.vr;
      // cursor repulsion — molecules get out of your way
      const dx = m.x - mouse.x;
      const dy = m.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < MOUSE_RADIUS * MOUSE_RADIUS && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const push = ((MOUSE_RADIUS - d) / MOUSE_RADIUS) * 0.8;
        m.x += (dx / d) * push;
        m.y += (dy / d) * push;
      }
      // wrap (with molecule radius margin)
      const margin = m.scale * 2.2;
      if (m.x < -margin) m.x = W + margin;
      if (m.x > W + margin) m.x = -margin;
      if (m.y < -margin) m.y = H + margin;
      if (m.y > H + margin) m.y = -margin;

      drawMolecule(m);
    }
  })();
}

/* ── 3. Scroll reveals (anime.js staggered) ────────────────────────── */
function initReveals() {
  if (REDUCED) return;
  const targets = document.querySelectorAll(
    ".fade-in:not(.visible), .section-header, .log-block, .card",
  );
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);
        animate(el, {
          opacity: [0, 1],
          translateY: [34, 0],
          duration: 750,
          ease: "outCubic",
          delay: 60,
        });
        el.classList.add("visible"); // keep legacy CSS hooks happy
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );
  targets.forEach((t) => io.observe(t));
}

/* ── 4. Hero parallax on pointer ───────────────────────────────────── */
function initParallax() {
  if (REDUCED || !FINE_POINTER) return;
  const hero = document.querySelector(".hero");
  const term = document.getElementById("hero-terminal");
  const panel = document.querySelector(".protein-panel");
  if (!hero || !term || !panel) return;

  hero.addEventListener(
    "mousemove",
    (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      term.style.transform = `perspective(1100px) rotateY(${nx * 4}deg) rotateX(${-ny * 3}deg)`;
      panel.style.transform = `perspective(1100px) rotateY(${nx * -3.2}deg) rotateX(${ny * 2.4}deg)`;
    },
    { passive: true },
  );
  hero.addEventListener(
    "mouseleave",
    () => {
      term.style.transform = "";
      panel.style.transform = "";
    },
    { passive: true },
  );
}

/* ── boot ───────────────────────────────────────────────────────────── */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initCursor();
    initConstellation();
    initReveals();
    initParallax();
    initToTop();
    initScrollProgress();
  });
} else {
  initCursor();
  initConstellation();
  initReveals();
  initParallax();
  initToTop();
  initScrollProgress();
}

/* ── 5. Back-to-top ─────────────────────────────────────────────────── */
function initToTop() {
  const btn = document.getElementById("to-top-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ── 6. Scroll progress bar ─────────────────────────────────────────── */
function initScrollProgress() {
  if (REDUCED) return;
  // navbar.js also creates this bar site-wide; never allow two.
  if (document.getElementById("scroll-progress")) return;
  const bar = document.createElement("div");
  bar.id = "scroll-progress";
  document.body.appendChild(bar);
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        bar.style.transform = `scaleX(${p})`;
        ticking = false;
      });
    },
    { passive: true },
  );
}
