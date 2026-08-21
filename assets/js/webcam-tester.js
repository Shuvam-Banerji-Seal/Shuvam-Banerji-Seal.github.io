// ── Webcam Tester + Air Guitar ──────────────────────────────────────────
// Everything runs locally: getUserMedia feed, live stats, snapshots, and
// (optionally) MediaPipe hand-tracking for the air-guitar mode.

import "./air-guitar.js";

class WebcamTester {
  constructor() {
    this.stream = null;
    this.video = document.getElementById("cam");
    this.stage = document.getElementById("stage");
    this.mirrored = true;
    this.gridOn = false;
    this.fpsFrames = 0;
    this.fpsLast = performance.now();
    this.fpsValue = 0;
    this.rafId = null;
    this.vfcId = null;
  }

  // ── lifecycle ─────────────────────────────────────────────────────────
  async start() {
    const errBox = document.getElementById("err-box");
    errBox.classList.remove("show");
    const deviceId = document.getElementById("device-select").value;
    const wantW = parseInt(document.getElementById("res-select").value, 10);

    const constraints = {
      audio: false,
      video: {
        width: { ideal: wantW },
        height: { ideal: Math.round((wantW * 9) / 16) },
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      },
    };

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw Object.assign(
          new Error("This browser does not expose camera APIs here."),
          { name: "InsecureContext" },
        );
      }
      this.stop();
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      await this.video.play().catch(() => {});

      document.getElementById("live-dot").classList.add("live");
      await this.populateDevices();
      this.readTrackStats();
      this.startFps();
      window.AirGuitar?.attach(this.stream);
    } catch (e) {
      this.renderError(e);
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
      this.video.srcObject = null;
    }
    document.getElementById("live-dot").classList.remove("live");
    this.stopFps();
    ["stat-res", "stat-fps", "stat-aspect", "stat-device"].forEach((id) => {
      document.getElementById(id).textContent = "\u2014";
    });
  }

  renderError(e) {
    const box = document.getElementById("err-box");
    let html;
    switch (e.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        html =
          "<strong>Camera permission was denied.</strong><br>" +
          "Click the camera icon in your browser's address bar and allow " +
          "access for this site, then press Start again.";
        break;
      case "NotFoundError":
      case "OverconstrainedError":
        html =
          "<strong>No camera matched the request.</strong><br>" +
          "Connect a webcam (or lower the requested resolution) and retry.";
        break;
      case "NotReadableError":
        html =
          "<strong>The camera is busy.</strong><br>Another app appears to " +
          "be using it exclusively. Close that app and retry.";
        break;
      case "InsecureContext":
        html =
          "<strong>Camera requires a secure context.</strong><br>Open this " +
          "page over HTTPS (or localhost).";
        break;
      default:
        html = `<strong>Camera error:</strong> ${e.message || e.name}`;
    }
    box.innerHTML = html;
    box.classList.add("show");
  }

  // ── devices & stats ───────────────────────────────────────────────────
  async populateDevices() {
    const sel = document.getElementById("device-select");
    const current = sel.value;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");
    sel.innerHTML =
      '<option value="">Default camera</option>' +
      cams
        .map(
          (d, i) =>
            `<option value="${d.deviceId}">${d.label || `Camera ${i + 1}`}</option>`,
        )
        .join("");
    if (current && cams.some((d) => d.deviceId === current))
      sel.value = current;
    const active = this.stream?.getVideoTracks()[0];
    if (active) {
      const match = cams.find(
        (d) => d.deviceId === active.getSettings().deviceId,
      );
      document.getElementById("stat-device").textContent = this.shorten(
        match?.label || active.label || "camera",
        22,
      );
    }
  }

  readTrackStats() {
    const track = this.stream?.getVideoTracks()[0];
    if (!track) return;
    const s = track.getSettings();
    document.getElementById("stat-res").textContent = s.width
      ? `${s.width}\u00D7${s.height}`
      : "\u2014";
    document.getElementById("stat-aspect").textContent = s.aspectRatio
      ? this.ratio(s.aspectRatio)
      : "\u2014";
    if (s.frameRate)
      document.getElementById("stat-fps").textContent =
        `${Math.round(s.frameRate)} fps`;
  }

  startFps() {
    // Prefer requestVideoFrameCallback (per-frame truth), fall back to rAF.
    this.fpsFrames = 0;
    this.fpsLast = performance.now();
    const tickFps = () => {
      this.fpsFrames++;
      const now = performance.now();
      if (now - this.fpsLast >= 1000) {
        this.fpsValue = Math.round(
          (this.fpsFrames * 1000) / (now - this.fpsLast),
        );
        document.getElementById("stat-fps").textContent =
          `${this.fpsValue} fps`;
        this.fpsFrames = 0;
        this.fpsLast = now;
      }
      if (this.stream) {
        if (this.video.requestVideoFrameCallback) {
          this.vfcId = this.video.requestVideoFrameCallback(tickFps);
        } else {
          this.rafId = requestAnimationFrame(tickFps);
        }
      }
    };
    if (this.video.requestVideoFrameCallback) {
      this.vfcId = this.video.requestVideoFrameCallback(tickFps);
    } else {
      this.rafId = requestAnimationFrame(tickFps);
    }
  }

  stopFps() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.vfcId = null;
  }

  // ── snapshot ──────────────────────────────────────────────────────────
  snapshot() {
    const v = this.video;
    if (!v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    ctx.save();
    if (this.mirrored) {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    ctx.restore();

    const url = c.toDataURL("image/png");
    const name = `webcam-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19)}.png`;

    const item = document.createElement("div");
    item.className = "snap-item";
    item.innerHTML = `<img src="${url}" alt="snapshot"><a download="${name}" href="${url}">save</a>`;
    const snaps = document.getElementById("snaps");
    snaps.prepend(item);
    while (snaps.children.length > 6) snaps.lastChild.remove();

    // auto-download as well — a tester's purpose is to prove saving works
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    this.toast(`Saved ${name}`);
  }

  toggleGrid() {
    this.gridOn = !this.gridOn;
    document
      .getElementById("grid-btn")
      .classList.toggle("toggled", this.gridOn);
    this.drawGrid();
  }

  drawGrid() {
    let g = document.getElementById("grid-canvas");
    if (!this.gridOn) {
      g?.remove();
      return;
    }
    if (!g) {
      g = document.createElement("canvas");
      g.id = "grid-canvas";
      g.className = "overlay";
      g.style.pointerEvents = "none";
      this.stage.appendChild(g);
    }
    const r = this.stage.getBoundingClientRect();
    g.width = r.width;
    g.height = r.height;
    const ctx = g.getContext("2d");
    ctx.clearRect(0, 0, g.width, g.height);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const x = (g.width / 3) * i;
      const y = (g.height / 3) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, g.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(g.width, y);
      ctx.stroke();
    }
    // center crosshair
    ctx.strokeStyle = "rgba(125,211,252,0.9)";
    ctx.beginPath();
    ctx.arc(g.width / 2, g.height / 2, 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  toggleMirror() {
    this.mirrored = !this.mirrored;
    this.stage.classList.toggle("mirrored", this.mirrored);
    document
      .getElementById("mirror-btn")
      .classList.toggle("toggled", this.mirrored);
  }

  fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else this.stage.requestFullscreen?.();
  }

  toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText =
      "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);" +
      "background:#0f172a;color:#e2e8f0;padding:.6rem 1rem;border-radius:8px;" +
      "font-family:var(--font-mono);font-size:.82rem;z-index:99999;border:1px solid #334155";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  shorten(s, n) {
    return s.length > n ? s.slice(0, n - 1) + "\u2026" : s;
  }

  ratio(ar) {
    const known = [
      [16 / 9, "16:9"],
      [4 / 3, "4:3"],
      [21 / 9, "21:9"],
      [3 / 2, "3:2"],
      [1, "1:1"],
      [9 / 16, "9:16"],
    ];
    for (const [v, label] of known) {
      if (Math.abs(ar - v) < 0.02) return label;
    }
    return ar.toFixed(2);
  }
}

const tester = new WebcamTester();
window.webcamTester = tester;

// ── UI wiring ───────────────────────────────────────────────────────────
document
  .getElementById("start-btn")
  ?.addEventListener("click", () => tester.start());
document
  .getElementById("snapshot-btn")
  ?.addEventListener("click", () => tester.snapshot());
document
  .getElementById("mirror-btn")
  ?.addEventListener("click", () => tester.toggleMirror());
document
  .getElementById("grid-btn")
  ?.addEventListener("click", () => tester.toggleGrid());
document
  .getElementById("fs-btn")
  ?.addEventListener("click", () => tester.fullscreen());
document
  .getElementById("device-select")
  ?.addEventListener("change", () => tester.start());
document
  .getElementById("res-select")
  ?.addEventListener("change", () => tester.start());

// mode switching
let guitarActive = false;
document.querySelectorAll(".wc-mode-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    document
      .querySelectorAll(".wc-mode-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const guitar = btn.dataset.wcmode === "guitar";
    guitarActive = guitar;
    document.getElementById("tester-controls").style.display = guitar
      ? "none"
      : "";
    document.getElementById("guitar-controls").style.display = guitar
      ? ""
      : "none";
    if (guitar) {
      if (!tester.stream) await tester.start();
      window.AirGuitar?.show();
    } else {
      window.AirGuitar?.hide();
    }
  });
});

if (!window.isSecureContext) {
  tester.renderError(Object.assign(new Error(""), { name: "InsecureContext" }));
}

if (typeof lucide !== "undefined") lucide.createIcons();
