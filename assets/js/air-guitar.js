// ── Air Guitar ──────────────────────────────────────────────────────────
// MediaPipe Hands tracks fingertips through the webcam feed; crossing a
// string "plucks" it. Sound is real Karplus–Strong plucked-string
// synthesis (Web Audio), precomputed per chord change so playback is
// instant and CPU-cheap. Everything runs locally; only the MediaPipe
// model files come from a CDN, loaded lazily on first enable.

const STRINGS = [
  { name: "E2", openFreq: 82.41 },
  { name: "A2", openFreq: 110.0 },
  { name: "D3", openFreq: 146.83 },
  { name: "G3", openFreq: 196.0 },
  { name: "B3", openFreq: 246.94 },
  { name: "E4", openFreq: 329.63 },
];

// Six-string voicings (frequency per string index).
const CHORDS = {
  Em: [82.41, 123.47, 164.81, 196.0, 246.94, 329.63],
  G: [98.0, 123.47, 146.83, 196.0, 246.94, 392.0],
  C: [130.81, 164.81, 196.0, 261.63, 329.63, 392.0],
  D: [146.83, 220.0, 293.66, 369.99, 440.0, 587.33],
  Am: [110.0, 164.81, 220.0, 261.63, 329.63, 440.0],
  E: [82.41, 123.47, 164.81, 207.65, 246.94, 329.63],
};

// MediaPipe hand skeleton connections (landmark index pairs).
const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

const TIPS = [8, 12]; // index + middle fingertips (strumming fingers)

class AirGuitar {
  constructor() {
    this.active = false;
    this.visible = false;
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.ctx2d = null;
    this.hands = null;
    this.handsReady = false;
    this.loadingModel = false;
    this.results = null;
    this.chord = "G";
    this.volume = 0.7;
    this.audioCtx = null;
    this.master = null;
    this.stringBuffers = []; // precomputed KS buffers per string
    this.stringYs = []; // px positions of the 6 strings
    // pluck state: prev y per fingertip + per-string debounce stamps
    this.prevTipY = new Map();
    this.lastPluckByString = new Map();
    this.pluckFx = []; // active visual ripples {stringIdx, t0}
    this.rafId = null;
    this.lastSendT = 0;
  }

  // ── public API (called from webcam-tester.js) ─────────────────────────
  attach(videoStream) {
    this.stream = videoStream;
    // webcam-tester.js hands us the MediaStream; the <video> element it
    // feeds is the frame source MediaPipe needs. Without this reference
    // the send-gate in loop() never opens and tracking never runs.
    this.video = document.getElementById("cam") || this.video;
    if (this.active && !this.hands) this.enable(); // auto-start once enabled
  }

  show() {
    this.visible = true;
    if (!this.canvas) {
      this.canvas = document.getElementById("overlay");
      this.ctx2d = this.canvas.getContext("2d");
    }
    this.video = document.getElementById("cam") || this.video;
    if (!this.audioCtx) this.initAudio();
    // A context created outside a gesture (or before the first click)
    // starts suspended — resume it so plucks are actually audible.
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    if (this.stream && !this.hands && !this.loadingModel) {
      // user switched to guitar tab before enabling — arm automatically
      this.enable();
    }
    if (!this.rafId) this.loop();
  }

  hide() {
    this.visible = false;
    document.getElementById("guitar-status").textContent =
      "Point your hand at the camera and strum through the strings.";
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  setChord(name) {
    if (!CHORDS[name]) return;
    this.chord = name;
    this.renderStringBuffers();
  }

  // ── audio: Karplus–Strong ─────────────────────────────────────────────
  initAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AC();
    this.master = this.audioCtx.createGain();
    this.master.gain.value = this.volume;

    // gentle warmth + safety limiter-ish curve
    const shelf = this.audioCtx.createBiquadFilter();
    shelf.type = "lowpass";
    shelf.frequency.value = 5200;
    this.master.connect(shelf);
    shelf.connect(this.audioCtx.destination);

    this.renderStringBuffers();
  }

  renderStringBuffers() {
    if (!this.audioCtx) return;
    const freqs = CHORDS[this.chord];
    this.stringBuffers = freqs.map((f) => this.ksBuffer(f));
  }

  // Numerically integrate the Karplus–Strong algorithm into a buffer.
  ksBuffer(freq, seconds = 2.4, damping = 0.996) {
    const sr = this.audioCtx.sampleRate;
    const N = Math.max(2, Math.round(sr / freq));
    const len = Math.floor(sr * seconds);
    const buf = this.audioCtx.createBuffer(1, len, sr);
    const out = buf.getChannelData(0);
    const ring = new Float32Array(N);
    for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    let idx = 0;
    for (let i = 0; i < len; i++) {
      const cur = ring[idx];
      const nxt = ring[(idx + 1) % N];
      out[i] = cur;
      ring[idx] = (cur + nxt) * 0.5 * damping; // lowpass in the loop = decay
      idx = (idx + 1) % N;
    }
    // tiny fade-out tail to avoid clicks at buffer end
    const fade = Math.min(2000, len);
    for (let i = 0; i < fade; i++) {
      out[len - 1 - i] *= i / fade;
    }
    return buf;
  }

  pluck(stringIdx, velocity = 1) {
    if (!this.audioCtx || !this.stringBuffers[stringIdx]) return;
    const src = this.audioCtx.createBufferSource();
    src.buffer = this.stringBuffers[stringIdx];
    src.playbackRate.value = 0.995 + Math.random() * 0.01; // human detune
    const g = this.audioCtx.createGain();
    const vol = Math.min(1, 0.35 + velocity * 0.65);
    g.gain.value = vol;
    src.connect(g);
    g.connect(this.master);
    src.start();

    this.pluckFx.push({ stringIdx, t0: performance.now() });
    if (navigator.vibrate) navigator.vibrate(8);
  }

  // ── hand tracking ─────────────────────────────────────────────────────
  async enable() {
    if (this.handsReady || this.loadingModel) return;
    this.loadingModel = true;
    this.active = true;
    const status = document.getElementById("guitar-status");
    try {
      status.textContent = "Loading hand-tracking model\u2026";
      // MediaPipe surfaces some WASM/GL failures via window.alert, which
      // would block the page — route them into the status line instead.
      this._origAlert = window.alert;
      window.alert = (msg) => {
        throw new Error(String(msg).slice(0, 90));
      };
      try {
        await this.loadScript(
          "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js",
        );
        this.hands = new window.Hands({
          locateFile: (f) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}`,
        });
        this.hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 0, // lite — fast enough for strumming
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });
        this.hands.onResults((r) => this.onHands(r));
        await this.hands.initialize();
        window.alert = this._origAlert;
      } catch (e) {
        window.alert = this._origAlert;
        throw e;
      }
      this.handsReady = true;
      status.textContent =
        "Tracking armed \u2014 sweep your fingertips across the strings!";
      const btn = document.getElementById("guitar-enable-btn");
      btn.innerHTML = '<i data-lucide="check"></i> Hand tracking active';
      btn.disabled = true;
      if (typeof lucide !== "undefined") lucide.createIcons();
    } catch (e) {
      status.textContent = /webgl|canvas context/i.test(String(e.message || e))
        ? "This device/browser cannot create the 3D context MediaPipe needs (WebGL). Try a different browser or enable hardware acceleration."
        : "Could not load the hand-tracking model (\u201C" +
          (e.message || e).toString().slice(0, 60) +
          "\u201D). Check your connection and retry.";
    } finally {
      this.loadingModel = false;
    }
  }

  loadScript(src) {
    if (document.querySelector(`script[src="${src}"]`))
      return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.crossOrigin = "anonymous";
      s.onload = resolve;
      s.onerror = () => reject(new Error("network error"));
      document.head.appendChild(s);
    });
  }

  onHands(results) {
    this.results = results;
  }

  // ── main loop: send frames, detect plucks, draw ───────────────────────
  loop() {
    this.rafId = requestAnimationFrame(() => this.loop());
    if (!this.visible) return;

    const canvas = this.canvas || document.getElementById("overlay");
    if (!canvas) return;
    const stage = document.getElementById("stage");
    const rect = stage.getBoundingClientRect();
    if (
      canvas.width !== Math.round(rect.width) ||
      canvas.height !== Math.round(rect.height)
    ) {
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
    }
    this.ctx2d.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.audioCtx) return;

    // string geometry: six lines across the lower 62% of the frame
    const top = canvas.height * 0.34;
    const gap = (canvas.height * 0.56) / (STRINGS.length - 1);
    this.stringYs = STRINGS.map((_, i) => top + gap * i);

    // feed frames to MediaPipe at ~30fps — never stack sends: the
    // solution API rejects concurrent send() calls, so gate on the
    // previous frame's promise settling.
    const now = performance.now();
    if (
      this.hands &&
      this.handsReady &&
      this.stream &&
      !this._sending &&
      now - this.lastSendT > 33 &&
      this.video &&
      this.video.readyState >= 2
    ) {
      this.lastSendT = now;
      this._sending = true;
      this.hands
        .send({ image: this.video })
        .catch(() => {
          /* transient decode hiccup — skip frame */
        })
        .finally(() => {
          this._sending = false;
        });
    }

    if (this.handsReady && this.results?.multiHandLandmarks) {
      this.detectPlucks(this.results.multiHandLandmarks);
      this.drawHands(this.results.multiHandLandmarks);
      this.updateTrackingStatus(this.results.multiHandLandmarks.length);
    } else if (this.handsReady) {
      this.updateTrackingStatus(-1);
    }

    this.drawStrings(now);
  }

  detectPlucks(hands) {
    const canvasH = this.canvas.height;
    const canvasW = this.canvas.width;
    const nowMs = performance.now();

    // Tracking-gap teleport guard: if no hands were seen recently, any
    // stored previous positions are stale — a re-entering hand would
    // otherwise "teleport" and phantom-pluck every string it lands on.
    if (nowMs - (this._lastHandSeenMs || 0) > 250) {
      this.prevTipY.clear();
    }
    if (hands.length > 0) this._lastHandSeenMs = nowMs;

    // Per-STRING debounce: a strum sweeps several fingertips across the
    // same string within a few frames — that must sound ONCE, not once
    // per finger. Velocity = fastest crossing tip.
    for (const lm of hands) {
      const crossing = new Map(); // stringIdx -> {speed, y}
      for (const tip of TIPS) {
        const p = lm[tip];
        const x = p.x * canvasW;
        const y = p.y * canvasH;
        this.stringYs.forEach((sy, si) => {
          const k = tip + ":" + si;
          const prev = this.prevTipY.get(k);
          this.prevTipY.set(k, y);
          if (prev === undefined) return;
          const crossed = (prev < sy && y >= sy) || (prev > sy && y <= sy);
          if (!crossed) return;
          const speed = Math.abs(y - prev);
          if (speed < 2) return; // jitter guard
          const cur = crossing.get(si);
          if (!cur || speed > cur.speed) crossing.set(si, { speed });
        });
      }
      // fire at most one pluck per string per hand per debounce window
      crossing.forEach(({ speed }, si) => {
        const last = this.lastPluckByString.get(si) || 0;
        if (nowMs - last < 100) return;
        this.lastPluckByString.set(si, nowMs);
        this.pluck(si, Math.min(1, speed / 22));
      });
    }
    // prune stale keys occasionally
    if (this.prevTipY.size > 400) this.prevTipY.clear();
  }

  updateTrackingStatus(handCount) {
    const el = document.getElementById("guitar-status");
    if (handCount === -1) {
      if (this._lastStatus !== "idle") {
        el.textContent = "Waiting for hand\u2026 show your palm to the camera.";
        this._lastStatus = "idle";
      }
    } else if (this._lastStatus !== "tracking") {
      el.textContent = `Tracking ${handCount} hand${handCount > 1 ? "s" : ""} \u2014 strum!`;
      this._lastStatus = "tracking";
    } else if (handCount !== this._lastCount) {
      el.textContent = `Tracking ${handCount} hand${handCount > 1 ? "s" : ""} \u2014 strum!`;
    }
    this._lastCount = handCount;
  }

  // ── drawing ───────────────────────────────────────────────────────────
  isMirrored() {
    return document.getElementById("stage")?.classList.contains("mirrored");
  }

  // Draw text that stays readable even though CSS mirrors the overlay.
  drawLabel(text, x, y, font, color) {
    const ctx = this.ctx2d;
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    if (this.isMirrored()) {
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.fillText(text, 0, 0);
    } else {
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  }

  drawStrings(nowMs) {
    const ctx = this.ctx2d;
    const W = this.canvas.width;

    // prune finished ripples
    this.pluckFx = this.pluckFx.filter((f) => nowMs - f.t0 < 700);

    this.stringYs.forEach((y, i) => {
      const fx = this.pluckFx.find((f) => f.stringIdx === i);
      let amp = 0;
      if (fx) {
        const t = (nowMs - fx.t0) / 700; // 0→1
        amp = Math.sin(t * Math.PI * 14) * (1 - t) * 7;
      }
      const grad = ctx.createLinearGradient(0, y - 8, 0, y + 8);
      const hot = fx ? "rgba(34,211,238," : "rgba(167,139,250,";
      grad.addColorStop(0, hot + "0)");
      grad.addColorStop(0.5, hot + (fx ? 0.95 : 0.55) + ")");
      grad.addColorStop(1, hot + "0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, y - 8, W, 16);

      ctx.strokeStyle = fx
        ? "rgba(125,252,238,0.95)"
        : "rgba(255,255,255,0.75)";
      ctx.lineWidth = fx ? 2.4 : 1.4;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 14) {
        const wob = amp ? Math.sin(x / 26 + nowMs / 30) * amp * (x / W) : 0;
        const yy = y + wob;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();

      // string label
      this.drawLabel(
        STRINGS[i].name,
        8,
        y - 6,
        "10px 'JetBrains Mono', monospace",
        "rgba(255,255,255,0.5)",
      );
    });

    // current chord badge
    this.drawLabel(
      this.chord,
      W - 74,
      this.stringYs[0] - 26,
      "700 22px 'JetBrains Mono', monospace",
      "rgba(34,211,238,0.9)",
    );
  }

  drawHands(hands) {
    const ctx = this.ctx2d;
    const W = this.canvas.width;
    const H = this.canvas.height;
    for (const lm of hands) {
      // skeleton
      ctx.strokeStyle = "rgba(34,211,238,0.75)";
      ctx.lineWidth = 2;
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath();
        ctx.moveTo(lm[a].x * W, lm[a].y * H);
        ctx.lineTo(lm[b].x * W, lm[b].y * H);
        ctx.stroke();
      }
      // joints
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (const p of lm) {
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // fingertip glow
      for (const tip of TIPS) {
        const p = lm[tip];
        ctx.fillStyle = "rgba(253,224,71,0.95)";
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

window.AirGuitar = new AirGuitar();

// ── UI wiring ───────────────────────────────────────────────────────────
document.getElementById("guitar-enable-btn")?.addEventListener("click", () => {
  window.AirGuitar.show();
  window.AirGuitar.enable();
});
document.querySelectorAll(".chord-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".chord-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    window.AirGuitar.setChord(btn.dataset.chord);
  });
});
document.getElementById("guitar-vol")?.addEventListener("input", (e) => {
  window.AirGuitar.setVolume(e.target.value / 100);
});
