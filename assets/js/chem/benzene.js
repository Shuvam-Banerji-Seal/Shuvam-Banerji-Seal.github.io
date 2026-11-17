/**
 * benzene.js: geometry and Hückel π molecular orbitals of benzene, and a
 * sampler that draws points from |ψ|². Used by the homepage intro
 * (intro-loader.js) and the hero figure (benzene-stage.js). The method is
 * written up in pages/blogs/benzene-pi-orbitals-huckel.html.
 *
 *   - Planar ring, C–C 1.39 Å, C–H 1.09 Å, carbon k at angle 2πk/6.
 *   - Hückel MOs for a six-ring: c_jk = cos(2πjk/6) or sin(2πjk/6),
 *     normalised ignoring overlap; E = α + 2β cos(2πj/6).
 *   - Each carbon contributes a Slater 2p_z orbital, φ ∝ z·exp(−ζr),
 *     ζ = 1.625 bohr⁻¹ (Slater's rules: Z_eff = 3.25, n = 2).
 *   - Points are rejection-sampled from |ψ|² in a bounding box; each keeps
 *     the sign of ψ so the figure can colour the two phases.
 *
 * Coordinates returned to callers are in ångström, ring in the xy plane.
 */

export const BOHR = 0.529177; // Å per bohr
export const R_CC = 1.39; // Å
export const R_CH = 1.09; // Å
export const ZETA = 1.625; // bohr⁻¹

const TAU = Math.PI * 2;
const angle = (k) => (TAU * k) / 6;

export const ATOMS = [];
for (let k = 0; k < 6; k++) {
  ATOMS.push({ el: "C", x: R_CC * Math.cos(angle(k)), y: R_CC * Math.sin(angle(k)), z: 0 });
}
for (let k = 0; k < 6; k++) {
  const r = R_CC + R_CH;
  ATOMS.push({ el: "H", x: r * Math.cos(angle(k)), y: r * Math.sin(angle(k)), z: 0 });
}

export const BONDS = [];
for (let k = 0; k < 6; k++) {
  BONDS.push([k, (k + 1) % 6, "CC"]);
  BONDS.push([k, k + 6, "CH"]);
}

const S3 = 1 / Math.sqrt(3);
const S6 = 1 / Math.sqrt(6);

/**
 * The six π MOs, lowest energy first. `planes` counts the vertical nodal
 * planes (every π MO also has the molecular plane as a node).
 */
export const MOS = [
  {
    id: "pi1", label: "π₁", html: "π<sub>1</sub>", sym: "a<sub>2u</sub>",
    energy: "α + 2β", occ: 2, planes: 0,
    note: "All six 2p<sub>z</sub> orbitals in phase: one ring of density above the plane and one below, with opposite signs.",
    c: () => S6,
  },
  {
    id: "pi2", label: "π₂", html: "π<sub>2</sub>", sym: "e<sub>1g</sub>",
    energy: "α + β", occ: 2, planes: 1, homo: true,
    note: "One of the two degenerate HOMOs. A single vertical nodal plane cuts the ring through two carbons.",
    c: (k) => S3 * Math.cos(angle(k)),
  },
  {
    id: "pi3", label: "π₃", html: "π<sub>3</sub>", sym: "e<sub>1g</sub>",
    energy: "α + β", occ: 2, planes: 1, homo: true,
    note: "The HOMO partner of π<sub>2</sub>: same energy, nodal plane turned by 90°, passing through two C–C bonds.",
    c: (k) => S3 * Math.sin(angle(k)),
  },
  {
    id: "pi4", label: "π₄*", html: "π<sub>4</sub>*", sym: "e<sub>2u</sub>",
    energy: "α − β", occ: 0, planes: 2, lumo: true,
    note: "One of the two degenerate LUMOs, empty in the ground state. Two vertical nodal planes.",
    c: (k) => S3 * Math.cos(2 * angle(k)),
  },
  {
    id: "pi5", label: "π₅*", html: "π<sub>5</sub>*", sym: "e<sub>2u</sub>",
    energy: "α − β", occ: 0, planes: 2, lumo: true,
    note: "The LUMO partner of π<sub>4</sub>*. Two vertical nodal planes, turned by 45°.",
    c: (k) => S3 * Math.sin(2 * angle(k)),
  },
  {
    id: "pi6", label: "π₆*", html: "π<sub>6</sub>*", sym: "b<sub>2g</sub>",
    energy: "α − 2β", occ: 0, planes: 3,
    note: "The most antibonding π orbital: the sign flips at every carbon, giving three vertical nodal planes.",
    c: (k) => S6 * (k % 2 ? -1 : 1),
  },
];

export const MO_BY_ID = Object.fromEntries(MOS.map((m) => [m.id, m]));

/** Small seeded PRNG so the figure is identical on every visit. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Carbon positions in bohr for the wavefunction.
const CB = ATOMS.slice(0, 6).map((a) => [a.x / BOHR, a.y / BOHR]);

/** ψ at (x, y, z) in bohr for coefficient vector c (length 6). */
export function psi(c, x, y, z) {
  let s = 0;
  for (let k = 0; k < 6; k++) {
    const ck = c[k];
    if (ck === 0 || Math.abs(ck) < 1e-12) continue;
    const dx = x - CB[k][0];
    const dy = y - CB[k][1];
    s += ck * z * Math.exp(-ZETA * Math.sqrt(dx * dx + dy * dy + z * z));
  }
  return s;
}

const cache = new Map();

/**
 * Draw n points from |ψ|² for MO `id`. Returns Float32Array [x, y, z, sign]*n
 * with positions in Å.
 */
export function sampleMO(id, n = 2400, seed = 20261117) {
  const key = `${id}:${n}:${seed}`;
  if (cache.has(key)) return cache.get(key);
  const mo = MO_BY_ID[id];
  const c = Array.from({ length: 6 }, (_, k) => mo.c(k));
  const RX = R_CC / BOHR + 3.4; // box half-width in bohr
  const RZ = 3.2;

  // Envelope: the densest points sit ~1/ζ above or below the ring. Scan a
  // grid, then pad, so rejection sampling stays (very nearly) exact.
  let max = 0;
  const G = 48;
  for (let i = 0; i <= G; i++) {
    for (let j = 0; j <= G; j++) {
      const x = -RX + (2 * RX * i) / G;
      const y = -RX + (2 * RX * j) / G;
      for (let m = 1; m <= 24; m++) {
        const z = (RZ * m) / 24;
        const p = psi(c, x, y, z);
        if (p * p > max) max = p * p;
      }
    }
  }
  max *= 1.15;

  const rnd = mulberry32(seed + id.charCodeAt(2) * 977);
  const out = new Float32Array(n * 4);
  let got = 0;
  let guard = 0;
  while (got < n && guard < n * 4000) {
    guard++;
    const x = (rnd() * 2 - 1) * RX;
    const y = (rnd() * 2 - 1) * RX;
    const z = (rnd() * 2 - 1) * RZ;
    const v = psi(c, x, y, z);
    if (rnd() * max < v * v) {
      out[got * 4] = x * BOHR;
      out[got * 4 + 1] = y * BOHR;
      out[got * 4 + 2] = z * BOHR;
      out[got * 4 + 3] = v >= 0 ? 1 : -1;
      got++;
    }
  }
  cache.set(key, out);
  return out;
}

/** Points scattered inside a sphere of radius r (Å) around (cx, cy, cz). */
export function ball(rnd, cx, cy, cz, r) {
  for (;;) {
    const x = rnd() * 2 - 1;
    const y = rnd() * 2 - 1;
    const z = rnd() * 2 - 1;
    if (x * x + y * y + z * z <= 1) return [cx + x * r, cy + y * r, cz + z * r];
  }
}

/** Rotation: yaw about z (the ring normal), then pitch about x. */
export function makeRotation(yaw, pitch) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return (x, y, z) => {
    const x1 = cy * x - sy * y;
    const y1 = sy * x + cy * y;
    return [x1, cp * y1 - sp * z, sp * y1 + cp * z];
  };
}

/** Read a CSS custom property as an [r, g, b] triple. */
export function tokenRGB(name, fallback = [0, 0, 0]) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!v) return fallback;
  if (v.startsWith("#")) {
    const h = v.length === 4 ? v.replace(/#(.)(.)(.)/, "#$1$1$2$2$3$3") : v;
    return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const m = v.match(/\d+(\.\d+)?/g);
  return m ? m.slice(0, 3).map(Number) : fallback;
}
