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

/* ── 2. Interactive constellation behind the hero ──────────────────── */
function initConstellation() {
  if (REDUCED) return;
  const host = document.querySelector(".hero");
  if (!host) return;

  const canvas = document.createElement("canvas");
  canvas.className = "constellation";
  host.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let W = 0,
    H = 0,
    dpr = Math.min(2, devicePixelRatio || 1);
  const NODES = [];
  const COUNT = innerWidth < 768 ? 26 : 46;
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
    NODES.length = 0;
    for (let i = 0; i < COUNT; i++) {
      NODES.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1 + Math.random() * 1.8,
        hue: Math.random() > 0.5 ? 190 : 262, // cyan / violet
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

  const LINK_DIST = 130;
  const MOUSE_RADIUS = 160;

  (function frame() {
    requestAnimationFrame(frame);
    if (H === 0 || host.getBoundingClientRect().bottom < 0) return; // off-screen

    ctx.clearRect(0, 0, W, H);

    for (const n of NODES) {
      // drift
      n.x += n.vx;
      n.y += n.vy;
      // cursor repulsion — the field "gets out of your way"
      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < MOUSE_RADIUS * MOUSE_RADIUS && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const push = ((MOUSE_RADIUS - d) / MOUSE_RADIUS) * 0.9;
        n.x += (dx / d) * push;
        n.y += (dy / d) * push;
      }
      // wrap
      if (n.x < -20) n.x = W + 20;
      if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20;
      if (n.y > H + 20) n.y = -20;
    }

    // links
    for (let i = 0; i < NODES.length; i++) {
      for (let j = i + 1; j < NODES.length; j++) {
        const a = NODES[i],
          b = NODES[j];
        const dx = a.x - b.x,
          dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK_DIST) {
          const alpha = (1 - d / LINK_DIST) * 0.28;
          ctx.strokeStyle = `hsla(${a.hue}, 90%, 65%, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // nodes
    for (const n of NODES) {
      ctx.fillStyle = `hsla(${n.hue}, 90%, 70%, 0.85)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
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
