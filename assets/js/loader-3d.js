// ── 3D Loading Screen — assembling benzene ──────────────────────────────
// A real Three.js scene: carbon/hydrogen atoms fly in and bond into a
// benzene ring with physically-based materials while the camera orbits.
// Progress % is driven by the assembly itself. Any failure (no WebGL,
// CDN blocked, slow GPU) falls back to the CSS orbital loader that is
// already on screen — this file ALWAYS fires 'fl-loader-done' exactly
// once, whatever happens.

const DONE_EVENT = "fl-loader-done";
const MIN_SHOW_MS = 2100;
const MAX_WAIT_MS = 5200;

const state = { fired: false };

function fireDone() {
  if (state.fired) return;
  state.fired = true;
  window.dispatchEvent(new CustomEvent(DONE_EVENT));
}

function setPct(p) {
  const el = document.getElementById("fl-pct");
  if (el) el.textContent = Math.round(p) + "%";
}

// Linear percentage used by the fallback path.
function linearPct(ms, onDone) {
  const t0 = performance.now();
  (function tick(t) {
    const p = Math.min(100, ((t - t0) / ms) * 100);
    setPct(p);
    if (p < 100) requestAnimationFrame(tick);
    else onDone();
  })(t0);
}

function webglOK() {
  try {
    return !!document.createElement("canvas").getContext("webgl");
  } catch (e) {
    return false;
  }
}

function loadScript(src, timeoutMs = 3500) {
  return new Promise((resolve, reject) => {
    if (window.THREE) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("three.js failed to load"));
    document.head.appendChild(s);
    setTimeout(() => reject(new Error("three.js timed out")), timeoutMs);
  });
}

/* ── pure geometry (unit-testable) ─────────────────────────────────── */
export function benzeneGeometry(R = 2.3, chLen = 1.75) {
  const atoms = [];
  const bonds = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const cx = Math.cos(a) * R;
    const cy = Math.sin(a) * R;
    atoms.push({ el: "C", x: cx, y: cy, z: 0 });
    atoms.push({
      el: "H",
      x: Math.cos(a) * (R + chLen),
      y: Math.sin(a) * (R + chLen),
      z: 0,
    });
    bonds.push([i * 2, ((i + 1) % 6) * 2]); // C–C around the ring
    bonds.push([i * 2, i * 2 + 1]); // C–H
  }
  return { atoms, bonds };
}

export function assemblyProgress(atomsDone, bondsDone, totalAtoms, totalBonds) {
  const a = Math.max(0, Math.min(1, atomsDone / totalAtoms));
  const b = Math.max(0, Math.min(1, bondsDone / totalBonds));
  return 70 * a + 30 * b;
}

// exposed for headless unit tests (?fl3dtest=1)
if (new URLSearchParams(location.search).has("fl3dtest")) {
  window.__fl3dTest = { benzeneGeometry, assemblyProgress };
}

/* ── boot ──────────────────────────────────────────────────────────── */
(async () => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || !webglOK()) {
    linearPct(MIN_SHOW_MS - 200, fireDone);
    return;
  }

  try {
    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    );
    run3D();
  } catch (e) {
    // CDN blocked/slow → CSS orbital already visible; finish gracefully.
    linearPct(1200, fireDone);
  }

  // hard cap: never hold the page hostage
  setTimeout(fireDone, MAX_WAIT_MS);
})();

function run3D() {
  const canvas = document.getElementById("fl3d-canvas");
  const host = document.getElementById("loading-screen");
  if (!canvas || !host || !window.THREE) throw new Error("missing host");

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04060c, 0.038);

  const camera = new THREE.PerspectiveCamera(
    42,
    innerWidth / innerHeight,
    0.1,
    120,
  );
  const camR = 11.5;
  camera.position.set(0, 1.4, camR);

  function sizeToScreen() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  sizeToScreen();
  window.addEventListener("resize", sizeToScreen);

  // 3D is live — retire the CSS orbital fallback rings
  host.classList.add("fl-has3d");

  // lighting — key + chemistry-palette rims + soft ambient
  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(5, 8, 6);
  const rimCyan = new THREE.PointLight(0x22d3ee, 1.5, 60);
  rimCyan.position.set(-8, -3, 5);
  const rimViolet = new THREE.PointLight(0xa78bfa, 1.25, 60);
  rimViolet.position.set(8, 5, -6);
  scene.add(key, rimCyan, rimViolet, new THREE.AmbientLight(0x24303e, 0.9));

  // starfield
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(700 * 3);
  for (let i = 0; i < starPos.length; i += 3) {
    const r = 26 + Math.random() * 34;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    starPos[i] = r * Math.sin(ph) * Math.cos(th);
    starPos[i + 1] = r * Math.sin(ph) * Math.sin(th);
    starPos[i + 2] = r * Math.cos(ph);
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      color: 0x9fd8ff,
      size: 0.07,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(stars);

  // ── benzene ──
  const { atoms, bonds } = benzeneGeometry();
  const mol = new THREE.Group();
  scene.add(mol);

  const cMat = new THREE.MeshPhysicalMaterial({
    color: 0x2b3138,
    metalness: 0.55,
    roughness: 0.32,
    clearcoat: 0.65,
    clearcoatRoughness: 0.25,
  });
  const hMat = new THREE.MeshPhysicalMaterial({
    color: 0xeef2f8,
    metalness: 0.06,
    roughness: 0.26,
  });
  const bondMat = new THREE.MeshStandardMaterial({
    color: 0x8fa3b8,
    metalness: 0.55,
    roughness: 0.34,
  });

  const atomMeshes = [];
  const startStates = [];
  atoms.forEach((a, i) => {
    const isC = a.el === "C";
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(isC ? 0.46 : 0.27, 36, 24),
      isC ? cMat : hMat,
    );
    mesh.position.set(a.x, a.y, a.z);
    mol.add(mesh);
    atomMeshes.push(mesh);
    // scatter start position far from home
    const dir = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5,
    ).normalize();
    startStates.push({
      from: mesh.position
        .clone()
        .add(dir.multiplyScalar(9 + Math.random() * 7)),
      delay: i * 55,
    });
    mesh.position.copy(startStates[i].from);
    mesh.scale.setScalar(0.01);
  });

  const bondMeshes = [];
  const UP = new THREE.Vector3(0, 1, 0);
  bonds.forEach(([ai, bi], k) => {
    const A = new THREE.Vector3(atoms[ai].x, atoms[ai].y, atoms[ai].z);
    const B = new THREE.Vector3(atoms[bi].x, atoms[bi].y, atoms[bi].z);
    const mid = A.clone().add(B).multiplyScalar(0.5);
    const len = A.distanceTo(B);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        k % 2 === 0 ? 0.09 : 0.07,
        k % 2 === 0 ? 0.09 : 0.07,
        len,
        14,
      ),
      bondMat,
    );
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize());
    mesh.scale.y = 0.001;
    mol.add(mesh);
    bondMeshes.push(mesh);
  });

  // aromatic inner bonds (alternating double-bond suggestion)
  for (let i = 0; i < 6; i += 2) {
    const A = new THREE.Vector3(atoms[i].x, atoms[i].y, atoms[i].z);
    const B = new THREE.Vector3(
      atoms[(i + 1) % 6].x,
      atoms[(i + 1) % 6].y,
      atoms[(i + 1) % 6].z,
    );
    const inward = A.clone().add(B).multiplyScalar(0.5).setLength(-0.34);
    A.add(inward.clone().multiplyScalar(0.18));
    B.add(inward.clone().multiplyScalar(0.18));
    const len = A.distanceTo(B);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, len, 12),
      bondMat,
    );
    mesh.position.copy(A.clone().add(B).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize());
    mesh.scale.y = 0.001;
    mol.add(mesh);
    bondMeshes.push(mesh);
  }

  // ── animation loop ──
  const clock = new THREE.Clock();
  const EASE = (t) => 1 - Math.pow(1 - t, 3); // ease-out cubic
  let finished = false;
  let finishT = 0;

  function frame() {
    requestAnimationFrame(frame);
    if (state.fired && performance.now() - finishT > 900) return; // stop after exit

    const t = clock.getElapsedTime() * 1000;

    // atoms converge
    let atomsDone = 0;
    atomMeshes.forEach((mesh, i) => {
      const local = (t - startStates[i].delay) / 950;
      if (local >= 1) {
        mesh.position.set(atoms[i].x, atoms[i].y, atoms[i].z);
        mesh.scale.setScalar(1);
        atomsDone++;
      } else if (local > 0) {
        const e = EASE(local);
        mesh.position.lerpVectors(
          startStates[i].from,
          new THREE.Vector3(atoms[i].x, atoms[i].y, atoms[i].z),
          e,
        );
        mesh.scale.setScalar(0.01 + e * 0.99);
      }
    });

    // bonds grow once both their atoms have landed
    const atomsArrived = atomsDone;
    let bondsDone = 0;
    const totalBondCount = bondMeshes.length;
    bondMeshes.forEach((mesh, k) => {
      const [ai] = bonds[k % bonds.length];
      const readyAt = startStates[ai].delay + 950 + 140;
      const local = (t - readyAt) / 420;
      if (local >= 1) {
        mesh.scale.y = 1;
        bondsDone++;
      } else if (local > 0) {
        mesh.scale.y = EASE(local);
      }
    });

    setPct(
      assemblyProgress(atomsArrived, bondsDone, atoms.length, totalBondCount),
    );

    // gentle rotation + wobble
    mol.rotation.y += 0.0042;
    mol.rotation.x = Math.sin(t / 2400) * 0.12;

    stars.rotation.y += 0.00035;

    // camera drift-orbit
    const ang = t * 0.00016;
    camera.position.x = Math.sin(ang) * 3.2;
    camera.position.z = camR + Math.cos(ang) * 1.4;
    camera.lookAt(0, 0, 0);

    // completion: everything assembled + minimum showtime
    if (
      !finished &&
      atomsArrived === atoms.length &&
      bondsDone === totalBondCount &&
      t >= MIN_SHOW_MS
    ) {
      finished = true;
      finishT = performance.now();
      cinematicExit();
    }

    renderer.render(scene, camera);
  }

  function cinematicExit() {
    // dolly through the ring center while the overlay flashes away
    const startZ = camera.position.z;
    const t0 = performance.now();
    (function push() {
      const p = Math.min(1, (performance.now() - t0) / 480);
      camera.position.z = startZ + (5.2 - startZ) * p * p; // ease-in
      camera.fov = 42 + p * 14;
      camera.updateProjectionMatrix();
      if (p < 1) requestAnimationFrame(push);
    })();
    setTimeout(fireDone, 330);
  }

  frame();
}
