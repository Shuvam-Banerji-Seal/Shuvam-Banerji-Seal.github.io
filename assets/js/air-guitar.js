// ── Air Guitar ──────────────────────────────────────────────────────────
// MediaPipe Hands tracks fingertips through the webcam feed; crossing a
// string "plucks" it. Sound is real Karplus–Strong plucked-string
// synthesis (Web Audio), precomputed per chord change so playback is
// instant and CPU-cheap. Everything runs locally; only the MediaPipe
// model files come from a CDN, loaded lazily on first enable.
//
// Tracking model (v3):
//  • all 5 fingertips of up to 2 hands (thumb..pinky), not just 2 fingers
//  • per-tip exponential velocity smoothing → musical dynamics
//  • down/up strum articulation (up-strums are brighter + softer)
//  • sensitivity slider scales the pluck threshold
//  • finger-picking: a fingertip TAPPING a string (dwell + lift) picks
//    that single string — no full strum needed
//  • palm-mute: flat-hand pose (tips near palm) muffles every pluck
//    (heavily damped, short KS buffer + lowpass)
//  • vibrato: a fingertip held on a ringing string with horizontal
//    oscillation modulates the pitch of the last pluck via playbackRate
//  • gesture chord-switch: hold up N fingers (2..5) briefly to jump to
//    the N-th chord in the palette
// Extras: 8 chords, metronome with BPM, session recording to WAV,
// fingertip light-trails, chord flash, tracking indicator.

const STRINGS = [
  { name: "E2", openFreq: 82.41 },
  { name: "A2", openFreq: 110.0 },
  { name: "D3", openFreq: 146.83 },
  { name: "G3", openFreq: 196.0 },
  { name: "B3", openFreq: 246.94 },
  { name: "E4", openFreq: 329.63 },
];

// Voicings (frequency per string index, low→high).
const CHORDS = {
  Em: [82.41, 123.47, 164.81, 196.0, 246.94, 329.63],
  G: [98.0, 123.47, 146.83, 196.0, 246.94, 392.0],
  C: [130.81, 164.81, 196.0, 261.63, 329.63, 392.0],
  D: [146.83, 220.0, 293.66, 369.99, 440.0, 587.33],
  Am: [110.0, 164.81, 220.0, 261.63, 329.63, 440.0],
  E: [82.41, 123.47, 164.81, 207.65, 246.94, 329.63],
  Dm: [146.83, 220.0, 293.66, 349.23, 440.0, 587.33],
  Em7: [82.41, 123.47, 164.81, 196.0, 246.94, 392.0],
};

// Chord palette for finger-count gestures (2..5 fingers → these chords).
const GESTURE_CHORDS = ["Em", "G", "C", "D"];

// All 5 fingertips per hand (thumb, index, middle, ring, pinky).
const TIPS = [4, 8, 12, 16, 20];
// Knuckle base indices matching TIPS (for extension tests).
const TIP_BASES = [2, 5, 9, 13, 17];
// Palm reference landmarks (wrist + MCP row).
const PALM = [0, 5, 9, 13, 17];

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
    this.sensitivity = 0.5; // 0 = forgiving, 1 = only fast strums
    this.audioCtx = null;
    this.master = null;
    this.stringBuffers = []; // down-strum buffers per string
    this.stringBuffersUp = []; // up-strum variants (brighter, softer)
    this.stringYs = []; // px positions of the 6 strings
    this.prevTipY = new Map(); // "hand:tip" -> prev y
    this.tipVel = new Map(); // "hand:tip" -> EMA velocity
    this.lastPluckByString = new Map();
    this.pluckFx = []; // active visual ripples {stringIdx, t0, dir}
    this.trails = []; // fingertip trails {hand, tip, pts: [{x,y,t}]}
    this.chordFlash = 0; // timestamp of last chord change
    this.rafId = null;
    this.lastSendT = 0;
    this._sending = false;
    // metronome
    this.metroOn = false;
    this.metroBpm = 90;
    this.metroTimer = null;
    this.metroNext = 0;
    // recording
    this.recDest = null;
    this.recorder = null;
    this.recChunks = [];
    this.recording = false;
    // ── v3 gesture state ──
    this.palmMute = false; // flat-hand pose active
    this.ringingSources = []; // [{src, gain, stringIdx}] for vibrato/mute
    this.pickState = new Map(); // "h:tip" -> {stringIdx, sinceMs, lifted}
    this.gestureHold = { count: 0, sinceMs: 0 }; // finger-count chord switch
    this.lastGestureChord = null;
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
    const el = document.getElementById("guitar-status");
    if (el)
      el.textContent =
        "Point your hand at the camera and strum through the strings.";
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  setSensitivity(v) {
    this.sensitivity = Math.max(0, Math.min(1, v));
  }

  setChord(name) {
    if (!CHORDS[name]) return;
    this.chord = name;
    this.chordFlash = performance.now();
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
    // up-strums: brighter (less damping) + shorter → articulation contrast
    this.stringBuffersUp = freqs.map((f) => this.ksBuffer(f, 1.6, 0.9985));
    // palm-mute bank: very short + heavily damped → thuddy chug
    this.stringBuffersMute = freqs.map((f) => this.ksBuffer(f, 0.35, 0.972));
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

  pluck(stringIdx, velocity = 1, dir = "down") {
    if (!this.audioCtx) return;
    let bank = dir === "up" ? this.stringBuffersUp : this.stringBuffers;
    if (this.palmMute && this.stringBuffersMute) bank = this.stringBuffersMute;
    const buf = bank[stringIdx] || this.stringBuffers[stringIdx];
    if (!buf) return;
    const src = this.audioCtx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = 0.995 + Math.random() * 0.01; // human detune
    const g = this.audioCtx.createGain();
    const vol = Math.min(1, 0.3 + velocity * 0.7);
    g.gain.value = this.palmMute ? vol * 0.75 : vol;
    src.connect(g);
    g.connect(this.master);
    src.start();

    // track the ringing voice for vibrato / palm-mute choke
    this.ringingSources.push({ src, gain: g, stringIdx });
    if (this.ringingSources.length > 24) this.ringingSources.shift();
    src.onended = () => {
      const i = this.ringingSources.findIndex((r) => r.src === src);
      if (i >= 0) this.ringingSources.splice(i, 1);
    };

    this.pluckFx.push({
      stringIdx,
      t0: performance.now(),
      dir,
      muted: this.palmMute,
    });
    if (navigator.vibrate) navigator.vibrate(8);
  }

  // Choke all ringing voices (palm-mute engage) — instant damp.
  chokeAll() {
    const t = this.audioCtx.currentTime;
    this.ringingSources.forEach(({ src, gain }) => {
      try {
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(0.0001, t + 0.06);
        src.stop(t + 0.08);
      } catch (e) {
        /* already ended */
      }
    });
    this.ringingSources.length = 0;
  }

  // Vibrato: modulate playbackRate of the most recent ringing voice on
  // this string by ±cents around its current rate.
  applyVibrato(stringIdx, cents) {
    const r = [...this.ringingSources]
      .reverse()
      .find((v) => v.stringIdx === stringIdx);
    if (!r) return;
    const base = r.src.playbackRate.value;
    const factor = Math.pow(2, cents / 1200);
    // gentle clamp so vibrato never drifts the pitch permanently
    r.src.playbackRate.value = Math.min(
      base * 1.06,
      Math.max(base * 0.94, base * factor),
    );
  }

  // ── metronome ─────────────────────────────────────────────────────────
  toggleMetronome() {
    this.metroOn = !this.metroOn;
    if (this.metroOn) this.startMetronome();
    else this.stopMetronome();
    const btn = document.getElementById("metro-btn");
    if (btn) {
      btn.classList.toggle("active", this.metroOn);
      btn.setAttribute("aria-pressed", this.metroOn);
    }
  }

  startMetronome() {
    if (!this.audioCtx) this.initAudio();
    if (this.audioCtx.state === "suspended")
      this.audioCtx.resume().catch(() => {});
    this.metroNext = this.audioCtx.currentTime + 0.1;
    // lookahead scheduler: accurate timing regardless of timer jitter
    this.metroTimer = setInterval(() => {
      while (this.metroNext < this.audioCtx.currentTime + 0.15) {
        this.click(this.metroNext);
        this.metroNext += 60 / (this.metroBpm || 90);
      }
    }, 50);
  }

  stopMetronome() {
    if (this.metroTimer) clearInterval(this.metroTimer);
    this.metroTimer = null;
  }

  setMetroBpm(v) {
    this.metroBpm = Math.max(30, Math.min(240, v | 0));
  }

  click(when) {
    const o = this.audioCtx.createOscillator();
    const g = this.audioCtx.createGain();
    o.frequency.value = 1568; // G6 — small, woody tick
    g.gain.setValueAtTime(0.25, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.05);
    o.connect(g);
    g.connect(this.master);
    o.start(when);
    o.stop(when + 0.06);
  }

  // ── session recording (WAV) ───────────────────────────────────────────
  toggleRecord() {
    if (this.recording) this.stopRecording();
    else this.startRecording();
  }

  startRecording() {
    if (!this.audioCtx) this.initAudio();
    if (this.audioCtx.state === "suspended")
      this.audioCtx.resume().catch(() => {});
    try {
      this.recDest = this.audioCtx.createMediaStreamDestination();
      this.master.connect(this.recDest);
      this.recorder = new MediaRecorder(this.recDest.stream);
      this.recChunks = [];
      this.recorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recChunks.push(e.data);
      };
      this.recorder.onstop = async () => {
        try {
          const blob = new Blob(this.recChunks, {
            type: this.recorder.mimeType || "audio/webm",
          });
          const ab = await blob.arrayBuffer();
          const buf = await this.audioCtx.decodeAudioData(ab);
          const wav = this.encodeWAV(buf);
          const url = URL.createObjectURL(wav);
          const a = document.createElement("a");
          a.href = url;
          a.download = `air-guitar-session-${new Date()
            .toISOString()
            .slice(11, 19)
            .replace(/:/g, "")}.wav`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 4000);
          const st = document.getElementById("guitar-status");
          if (st) st.textContent = "Session saved as WAV ✓";
        } catch (e) {
          const st = document.getElementById("guitar-status");
          if (st) st.textContent = "Recording save failed: " + e.message;
        }
        if (this.recDest) {
          try {
            this.master.disconnect(this.recDest);
          } catch (e) {}
          this.recDest = null;
        }
      };
      this.recorder.start(250);
      this.recording = true;
      const btn = document.getElementById("record-session-btn");
      if (btn) {
        btn.classList.add("recording");
        btn.innerHTML = '<i data-lucide="square"></i> Stop & Save';
        if (typeof lucide !== "undefined") lucide.createIcons();
      }
    } catch (e) {
      const st = document.getElementById("guitar-status");
      if (st) st.textContent = "Recording unavailable: " + e.message;
    }
  }

  stopRecording() {
    if (this.recorder && this.recording) {
      this.recorder.stop();
      this.recording = false;
      const btn = document.getElementById("record-session-btn");
      if (btn) {
        btn.classList.remove("recording");
        btn.innerHTML = '<i data-lucide="disc-3"></i> Record Session';
        if (typeof lucide !== "undefined") lucide.createIcons();
      }
    }
  }

  // Minimal 16-bit PCM WAV encoder for the recorded session.
  encodeWAV(buffer) {
    const numCh = Math.min(2, buffer.numberOfChannels);
    const sr = buffer.sampleRate;
    const dataLen = buffer.length * numCh * 2;
    const ab = new ArrayBuffer(44 + dataLen);
    const v = new DataView(ab);
    const ws = (o, s) => {
      for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
    };
    ws(0, "RIFF");
    v.setUint32(4, ab.byteLength - 8, true);
    ws(8, "WAVE");
    ws(12, "fmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, numCh, true);
    v.setUint32(24, sr, true);
    v.setUint32(28, sr * numCh * 2, true);
    v.setUint16(32, numCh * 2, true);
    v.setUint16(34, 16, true);
    ws(36, "data");
    v.setUint32(40, dataLen, true);
    const chs = [];
    for (let i = 0; i < numCh; i++) chs.push(buffer.getChannelData(i));
    let off = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numCh; ch++) {
        const s = Math.max(-1, Math.min(1, chs[ch][i]));
        v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        off += 2;
      }
    }
    return new Blob([ab], { type: "audio/wav" });
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
          modelComplexity: 1, // full model — steadier landmarks for picking
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
      this.drawTrails(now);
    } else if (this.handsReady) {
      this.updateTrackingStatus(-1);
      this.drawTrails(now);
    }

    this.drawStrings(now);
  }

  // ── v3 pose helpers ───────────────────────────────────────────────────
  // Hand scale = wrist→middle-MCP distance (normalizes pose math to any
  // distance from the camera). All thresholds are in hand-scale units.
  handScale(lm) {
    const w = lm[0];
    const mcp = lm[9];
    if (!w || !mcp) return 0.1;
    return Math.max(0.02, Math.hypot(mcp.x - w.x, mcp.y - w.y));
  }

  // Finger extended = tip clearly farther from wrist than its knuckle.
  extendedFingers(lm, s) {
    const w = lm[0];
    if (!w) return [];
    const out = [];
    TIPS.forEach((tip, i) => {
      const t = lm[tip];
      const base = lm[TIP_BASES[i]];
      if (!t || !base) return;
      const dTip = Math.hypot(t.x - w.x, t.y - w.y);
      const dBase = Math.hypot(base.x - w.x, base.y - w.y);
      if (dTip > dBase + s * 0.12) out.push(i); // 0..4 finger index
    });
    return out;
  }

  // Flat-hand (palm-mute): zero or one extended fingers AND tips near
  // the palm plane → the classic mute pose.
  isPalmFlat(lm, s) {
    const ext = this.extendedFingers(lm, s);
    if (ext.length > 1) return false;
    // average tip distance to palm center
    const cx = PALM.reduce((a, i) => a + (lm[i]?.x || 0), 0) / PALM.length;
    const cy = PALM.reduce((a, i) => a + (lm[i]?.y || 0), 0) / PALM.length;
    let sum = 0;
    let n = 0;
    for (const tip of TIPS) {
      const p = lm[tip];
      if (!p) continue;
      sum += Math.hypot(p.x - cx, p.y - cy);
      n++;
    }
    if (!n) return false;
    return sum / n < s * 0.62;
  }

  // ── gesture pipeline: pose → mute / chord-switch, then plucks ────────
  detectPlucks(hands) {
    const canvasH = this.canvas.height;
    const canvasW = this.canvas.width;
    const nowMs = performance.now();

    // Tracking-gap teleport guard
    if (nowMs - (this._lastHandSeenMs || 0) > 250) {
      this.prevTipY.clear();
      this.tipVel.clear();
      this.pickState.clear();
    }
    if (hands.length > 0) this._lastHandSeenMs = nowMs;

    const minSpeed = 1.2 + this.sensitivity * 6;

    // ── pose pass (palm-mute + finger-count chord switch) ──
    let muteNow = false;
    for (let h = 0; h < hands.length; h++) {
      const lm = hands[h];
      if (!lm || !lm[0]) continue;
      const s = this.handScale(lm);

      // palm-mute
      if (this.isPalmFlat(lm, s)) {
        muteNow = true;
        break; // any flat hand mutes
      }

      // finger-count chord switch: hand raised (wrist in top 35%) with
      // exactly 2..5 extended fingers, held ~500ms → jump chords.
      const ext = this.extendedFingers(lm, s);
      const wristY = lm[0].y;
      if (wristY < 0.35 && ext.length >= 2 && ext.length <= 5) {
        if (
          this.gestureHold.count === ext.length &&
          nowMs - this.gestureHold.sinceMs > 500
        ) {
          const chordName = GESTURE_CHORDS[ext.length - 2];
          if (chordName && chordName !== this.lastGestureChord) {
            this.lastGestureChord = chordName;
            this.setChord(chordName);
            // reflect in the UI buttons
            document
              .querySelectorAll(".chord-btn")
              .forEach((b) =>
                b.classList.toggle("active", b.dataset.chord === chordName),
              );
            const st = document.getElementById("guitar-status");
            if (st)
              st.textContent = `Gesture: ${ext.length} fingers → chord ${chordName}`;
          }
        } else if (this.gestureHold.count !== ext.length) {
          this.gestureHold = { count: ext.length, sinceMs: nowMs };
        }
      } else {
        this.gestureHold = { count: 0, sinceMs: 0 };
      }
    }

    // engage/disengage palm-mute with hysteresis
    if (muteNow && !this.palmMute) {
      this.palmMute = true;
      this.chokeAll();
      const st = document.getElementById("guitar-status");
      if (st) st.textContent = "Palm mute ON — chug away 🤘";
    } else if (!muteNow && this.palmMute) {
      this.palmMute = false;
      const st = document.getElementById("guitar-status");
      if (st) st.textContent = "Palm mute off";
    }

    // ── strum + pick pass ──
    for (let h = 0; h < hands.length; h++) {
      const lm = hands[h];
      if (!lm) continue;
      const crossing = new Map(); // stringIdx -> {speed, dir}
      for (const tip of TIPS) {
        const p = lm[tip];
        if (!p || typeof p.y !== "number") continue;
        const y = p.y * canvasH;
        const x = p.x * canvasW;
        const key = h + ":" + tip;
        const prev = this.prevTipY.get(key);
        this.prevTipY.set(key, y);
        // exponential velocity smoothing → musical dynamics
        const inst = prev === undefined ? 0 : Math.abs(y - prev);
        const vel = (this.tipVel.get(key) ?? 0) * 0.6 + inst * 0.4;
        this.tipVel.set(key, vel);
        if (prev === undefined) continue;

        // nearest string for pick/vibrato logic
        let nearSi = -1;
        let nearD = 1e9;
        this.stringYs.forEach((sy, si) => {
          const d = Math.abs(y - sy);
          if (d < nearD) {
            nearD = d;
            nearSi = si;
          }
        });
        const s = this.handScale(lm);

        // ── finger-pick: dwell ON a string then lift ──
        const st = this.pickState.get(key);
        if (nearD < s * canvasH * 0.035 && inst < 1.2) {
          // resting on a string
          if (!st || st.stringIdx !== nearSi) {
            this.pickState.set(key, {
              stringIdx: nearSi,
              sinceMs: nowMs,
              x,
              lifted: false,
            });
          } else {
            st.x = x; // track for vibrato
            // vibrato: resting ≥250ms with horizontal wiggle
            if (nowMs - st.sinceMs > 250) {
              const dx = Math.abs(x - (st.lastX ?? x));
              if (dx > 1.5) {
                const cents = Math.max(
                  -45,
                  Math.min(45, (x - (st.lastX ?? x)) * 3),
                );
                this.applyVibrato(nearSi, cents);
              }
              st.lastX = x;
            }
          }
        } else if (st && !st.lifted && inst >= 1.2) {
          // lifted OFF the string → fire the pick
          st.lifted = true;
          const dwell = nowMs - st.sinceMs;
          if (dwell > 60 && dwell < 900) {
            const last = this.lastPluckByString.get(st.stringIdx) || 0;
            if (nowMs - last > 90) {
              this.lastPluckByString.set(st.stringIdx, nowMs);
              this.pluck(st.stringIdx, 0.85, "pick");
            }
          }
          this.pickState.delete(key);
        } else if (st && nearD > s * canvasH * 0.08) {
          this.pickState.delete(key);
        }

        // ── strum crossing (as before) ──
        this.stringYs.forEach((sy, si) => {
          const crossed = (prev < sy && y >= sy) || (prev > sy && y <= sy);
          if (!crossed) return;
          const speed = Math.max(inst, vel);
          if (speed < minSpeed) return;
          const dir = y > prev ? "down" : "up";
          const cur = crossing.get(si);
          if (!cur || speed > cur.speed) crossing.set(si, { speed, dir });
        });
      }
      // fire at most one pluck per string per hand per debounce window
      crossing.forEach(({ speed, dir }, si) => {
        const last = this.lastPluckByString.get(si) || 0;
        if (nowMs - last < 90) return;
        this.lastPluckByString.set(si, nowMs);
        const vel = Math.min(1, (speed / 22) * (dir === "up" ? 0.8 : 1));
        this.pluck(si, vel, dir);
      });
    }
    // prune stale keys occasionally
    if (this.prevTipY.size > 600) this.prevTipY.clear();
    if (this.tipVel.size > 600) this.tipVel.clear();
  }

  updateTrackingStatus(handCount) {
    const el = document.getElementById("guitar-status");
    if (!el) return;
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
        amp = Math.sin(t * Math.PI * 14) * (1 - t) * (fx.muted ? 3 : 7);
      }
      const grad = ctx.createLinearGradient(0, y - 8, 0, y + 8);
      const hot = fx
        ? fx.muted
          ? "rgba(248,113,113,"
          : "rgba(34,211,238,"
        : "rgba(167,139,250,";
      grad.addColorStop(0, hot + "0)");
      grad.addColorStop(0.5, hot + (fx ? 0.95 : 0.55) + ")");
      grad.addColorStop(1, hot + "0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, y - 8, W, 16);

      ctx.strokeStyle = fx
        ? fx.muted
          ? "rgba(252,165,165,0.95)"
          : "rgba(125,252,238,0.95)"
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

    // chord badge — flashes on change
    const flash = Math.max(0, 1 - (nowMs - this.chordFlash) / 500);
    this.drawLabel(
      this.chord,
      W - 74,
      this.stringYs[0] - 26,
      `700 ${22 + flash * 6}px 'JetBrains Mono', monospace`,
      `rgba(34,211,238,${0.75 + flash * 0.25})`,
    );

    // tracking indicator dot
    const seen = nowMs - (this._lastHandSeenMs || 0) < 400 && this.handsReady;
    ctx.beginPath();
    ctx.arc(W - 18, 18, 5, 0, Math.PI * 2);
    ctx.fillStyle = seen
      ? "rgba(52,211,153,0.95)"
      : this.handsReady
        ? "rgba(245,158,11,0.8)"
        : "rgba(100,116,139,0.6)";
    ctx.fill();

    // palm-mute badge (top-left, mirrors-safe)
    if (this.palmMute) {
      this.drawLabel(
        "PALM MUTE",
        10,
        22,
        "700 12px 'JetBrains Mono', monospace",
        "rgba(248,113,113,0.95)",
      );
      ctx.fillStyle = "rgba(248,113,113,0.14)";
      ctx.fillRect(0, 0, W, 34);
    }
  }

  drawHands(hands) {
    const ctx = this.ctx2d;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const nowMs = performance.now();
    for (let h = 0; h < hands.length; h++) {
      const lm = hands[h];
      // skeleton
      ctx.strokeStyle = "rgba(34,211,238,0.75)";
      ctx.lineWidth = 2;
      for (const [a, b] of HAND_CONNECTIONS) {
        if (!lm[a] || !lm[b]) continue;
        ctx.beginPath();
        ctx.moveTo(lm[a].x * W, lm[a].y * H);
        ctx.lineTo(lm[b].x * W, lm[b].y * H);
        ctx.stroke();
      }
      // joints
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (const p of lm) {
        if (!p) continue;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // fingertip glow + trails (all five fingers)
      for (const tip of TIPS) {
        const p = lm[tip];
        if (!p) continue;
        const x = p.x * W;
        const y = p.y * H;
        ctx.fillStyle = "rgba(253,224,71,0.95)";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        // trail bookkeeping
        const key = h + ":" + tip;
        let trail = this.trails.find((t) => t.key === key);
        if (!trail) {
          trail = { key, pts: [] };
          this.trails.push(trail);
        }
        trail.pts.push({ x, y, t: nowMs });
      }
    }
    // drop trails for hands/fingers no longer present
    const live = new Set();
    hands.forEach((lm, h) => TIPS.forEach((tip) => live.add(h + ":" + tip)));
    this.trails = this.trails.filter((t) => live.has(t.key));
  }

  drawTrails(nowMs) {
    const ctx = this.ctx2d;
    const LIFE = 320; // ms
    this.trails.forEach((trail) => {
      trail.pts = trail.pts.filter((p) => nowMs - p.t < LIFE);
      if (trail.pts.length < 2) return;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      for (let i = 1; i < trail.pts.length; i++) {
        const a = trail.pts[i - 1];
        const b = trail.pts[i];
        const age = (nowMs - b.t) / LIFE;
        ctx.strokeStyle = `rgba(253,224,71,${(1 - age) * 0.55})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    });
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
document.getElementById("guitar-sens")?.addEventListener("input", (e) => {
  window.AirGuitar.setSensitivity(e.target.value / 100);
});
document.getElementById("metro-btn")?.addEventListener("click", () => {
  window.AirGuitar.toggleMetronome();
});
document.getElementById("metro-bpm")?.addEventListener("change", (e) => {
  window.AirGuitar.setMetroBpm(parseInt(e.target.value) || 90);
});
document.getElementById("record-session-btn")?.addEventListener("click", () => {
  window.AirGuitar.toggleRecord();
});
