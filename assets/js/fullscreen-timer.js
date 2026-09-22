/* ================================================================
   FULLSCREEN TIMER — presenter timer engine
   Spec: plans/08-fullscreen-timer.md
   - countdown that keeps going negative (overtime) and counts up
   - Web-Audio buzzer at time-up (no asset files), final-10s ticks
   - labelled segment sequences: "Talk 15" -> "Q&A 5"
   - countdown | stopwatch, fullscreen, wake lock, keyboard map
   ================================================================ */

const STORAGE_KEY = "ft:v1";
const MAX_SECONDS = 99 * 3600;

const PRESETS = [
  {
    id: "talk15-qna5",
    name: "Talk 15 + Q&A 5",
    segments: [
      { label: "Talk", seconds: 900 },
      { label: "Q&A", seconds: 300 },
    ],
  },
  {
    id: "talk10-qna5",
    name: "Talk 10 + Q&A 5",
    segments: [
      { label: "Talk", seconds: 600 },
      { label: "Q&A", seconds: 300 },
    ],
  },
  {
    id: "talk20-qna10",
    name: "Talk 20 + Q&A 10",
    segments: [
      { label: "Talk", seconds: 1200 },
      { label: "Q&A", seconds: 600 },
    ],
  },
  {
    id: "keynote45",
    name: "Keynote 45",
    segments: [{ label: "Keynote", seconds: 2700 }],
  },
  {
    id: "defense45-qna15",
    name: "Defense 45 + Q&A 15",
    segments: [
      { label: "Defense", seconds: 2700 },
      { label: "Q&A", seconds: 900 },
    ],
  },
  {
    id: "lightning5",
    name: "Lightning 5",
    segments: [{ label: "Lightning talk", seconds: 300 }],
  },
  {
    id: "poster3",
    name: "Poster 3",
    segments: [{ label: "Poster pitch", seconds: 180 }],
  },
];

const DEFAULT_CONFIG = {
  segments: PRESETS[0].segments.map((s) => ({ ...s })),
  sound: true,
  ticks: true,
  autoAdvance: false,
  mode: "countdown",
};

/* ---------------------------------------------------------------- */
/* Pure helpers (unit-tested through the DOM harness in Playwright)  */
/* ---------------------------------------------------------------- */

/** Parse "15" (minutes), "15:00", "1:02:03"; null when invalid. */
export function parseTime(raw) {
  if (typeof raw !== "string") return null;
  const text = raw.trim().replace(/\s+/g, "");
  if (!text) return null;

  if (text.includes(":")) {
    const parts = text.split(":");
    if (parts.length < 2 || parts.length > 3) return null;
    let total = 0;
    for (const part of parts) {
      if (!/^\d{1,3}$/.test(part)) return null;
      total = total * 60 + Number(part);
    }
    return total > MAX_SECONDS ? null : total;
  }

  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text)) return null;
  const total = Math.round(parseFloat(text) * 60);
  return total > MAX_SECONDS ? null : total;
}

/** "MM:SS" or "H:MM:SS" for a non-negative number of seconds. */
export function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds + 1e-9));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Clock text plus overtime/warning flags for a countdown or stopwatch. */
export function computeDisplay(mode, segmentSeconds, elapsed) {
  if (mode === "stopwatch") {
    return { text: formatClock(elapsed), overtime: false, warning: false };
  }
  const remaining = segmentSeconds - elapsed;
  if (remaining >= 0) {
    return {
      text: formatClock(Math.ceil(remaining)),
      overtime: false,
      warning: remaining <= 10,
    };
  }
  return {
    text: `-${formatClock(Math.floor(-remaining))}`,
    overtime: true,
    warning: false,
  };
}

/* ---------------------------------------------------------------- */
/* Audio (Web Audio only, lazily created after a user gesture)       */
/* ---------------------------------------------------------------- */

class Buzzer {
  constructor() {
    this.ctx = null;
    this.master = null;
  }

  /** Must be called from a user gesture; safe to call repeatedly. */
  unlock() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    if (!this.ctx) {
      try {
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
      } catch (error) {
        this.ctx = null;
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /** One enveloped tone. `at` is a small offset from "now" (never negative). */
  tone({ freq, duration, at = 0, type = "square", gain = 0.2 }) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const start = ctx.currentTime + Math.max(0, at);
    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(envelope);
    envelope.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  /** Three-beep "time is up" alarm. */
  timeUp() {
    if (!this.ctx) return;
    for (let i = 0; i < 3; i += 1) {
      const at = i * 0.27;
      this.tone({ freq: 880, duration: 0.19, at, type: "square", gain: 0.22 });
      this.tone({
        freq: 659.25,
        duration: 0.19,
        at,
        type: "triangle",
        gain: 0.14,
      });
    }
  }

  /** Short blip for the final ten seconds. */
  tick() {
    if (!this.ctx) return;
    this.tone({
      freq: 1244.5,
      duration: 0.045,
      at: 0,
      type: "square",
      gain: 0.07,
    });
  }

  /** Soft two-note chime when a segment advances. */
  chime() {
    if (!this.ctx) return;
    this.tone({
      freq: 784,
      duration: 0.14,
      at: 0,
      type: "triangle",
      gain: 0.12,
    });
    this.tone({
      freq: 1046.5,
      duration: 0.2,
      at: 0.14,
      type: "triangle",
      gain: 0.12,
    });
  }
}

/* ---------------------------------------------------------------- */
/* Engine                                                            */
/* ---------------------------------------------------------------- */

class FullscreenTimer {
  constructor() {
    this.el = {
      setup: document.getElementById("ft-setup"),
      segList: document.getElementById("ft-seg-list"),
      presets: document.getElementById("ft-presets"),
      add: document.getElementById("ft-add-seg"),
      start: document.getElementById("ft-start"),
      status: document.getElementById("ft-status"),
      summary: document.getElementById("ft-summary"),
      optSound: document.getElementById("ft-opt-sound"),
      optTicks: document.getElementById("ft-opt-ticks"),
      optAuto: document.getElementById("ft-opt-auto"),
      stage: document.getElementById("ft-stage"),
      segName: document.getElementById("ft-seg-name"),
      segIndex: document.getElementById("ft-seg-index"),
      clock: document.getElementById("ft-clock"),
      progress: document.getElementById("ft-progress-bar"),
      nextLabel: document.getElementById("ft-next-label"),
      live: document.getElementById("ft-live"),
      playpause: document.getElementById("ft-playpause"),
      next: document.getElementById("ft-next-btn"),
      prev: document.getElementById("ft-prev-btn"),
      reset: document.getElementById("ft-reset-btn"),
      mode: document.getElementById("ft-mode-btn"),
      fullscreen: document.getElementById("ft-fs-btn"),
      mute: document.getElementById("ft-mute-btn"),
      exit: document.getElementById("ft-exit-btn"),
    };

    this.config = this.loadConfig();
    this.segments = this.config.segments;
    this.opts = {
      sound: this.config.sound,
      ticks: this.config.ticks,
      autoAdvance: this.config.autoAdvance,
    };
    this.mode = this.config.mode;

    this.index = 0;
    this.phase = "idle"; // idle | running | paused
    this.elapsedBefore = 0;
    this.startedAt = 0;
    this.buzzed = new Set();
    this.lastTickSecond = null;
    this.rafId = null;
    this.watchdogId = null;
    this.hideChromeId = null;
    this.wakeLock = null;
    this.lastClockText = "";
    this.lastProgressPercent = -1;
    this.baseTitle = document.title;

    this.audio = new Buzzer();

    this.loopFrame = this.loopFrame.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);

    this.buildPresets();
    this.renderSegments();
    this.syncOptions();
    this.renderSummary();
    this.syncModeButton();
    this.syncMuteButton();
    this.syncTransport();
    this.bindEvents();
  }

  /* ── config ─────────────────────────────────────────────────── */

  loadConfig() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_CONFIG);
      const parsed = JSON.parse(raw);
      const segments = Array.isArray(parsed.segments)
        ? parsed.segments
            .filter((s) => s && typeof s.label === "string")
            .map((s) => ({
              label: String(s.label).slice(0, 60),
              seconds: Number.isFinite(s.seconds)
                ? Math.min(Math.max(Math.round(s.seconds), 1), MAX_SECONDS)
                : 300,
            }))
            .slice(0, 24)
        : [];
      return {
        segments: segments.length
          ? segments
          : structuredClone(DEFAULT_CONFIG.segments),
        sound: parsed.sound !== false,
        ticks: parsed.ticks !== false,
        autoAdvance: parsed.autoAdvance === true,
        mode: parsed.mode === "stopwatch" ? "stopwatch" : "countdown",
      };
    } catch (error) {
      return structuredClone(DEFAULT_CONFIG);
    }
  }

  saveConfig() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          segments: this.segments,
          sound: this.opts.sound,
          ticks: this.opts.ticks,
          autoAdvance: this.opts.autoAdvance,
          mode: this.mode,
        }),
      );
    } catch (error) {
      /* storage disabled — runtime keeps working */
    }
  }

  /* ── setup rendering ────────────────────────────────────────── */

  buildPresets() {
    for (const preset of PRESETS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ft-preset";
      button.dataset.preset = preset.id;
      button.textContent = preset.name;
      button.addEventListener("click", () => {
        this.segments = preset.segments.map((s) => ({ ...s }));
        this.index = 0;
        this.renderSegments();
        this.renderSummary();
        this.saveConfig();
        this.setStatus(`Preset loaded: ${preset.name}`);
      });
      this.el.presets.appendChild(button);
    }
  }

  renderSegments() {
    this.el.segList.textContent = "";
    this.segments.forEach((segment, i) => {
      const row = document.createElement("div");
      row.className = `ft-seg-row${i === this.index ? " is-selected" : ""}`;
      row.dataset.index = String(i);

      const chip = document.createElement("span");
      chip.className = "ft-seg-chip";
      chip.textContent = String(i + 1).padStart(2, "0");

      const label = document.createElement("input");
      label.type = "text";
      label.className = "ft-seg-label";
      label.value = segment.label;
      label.maxLength = 60;
      label.setAttribute("aria-label", `Segment ${i + 1} label`);
      label.addEventListener("input", () => {
        segment.label = label.value;
        this.renderSummary();
        this.saveConfig();
      });
      label.addEventListener("focus", () => this.selectRow(i));

      const time = document.createElement("input");
      time.type = "text";
      time.className = "ft-seg-time";
      time.value = formatClock(segment.seconds);
      time.inputMode = "numeric";
      time.setAttribute("aria-label", `Segment ${i + 1} duration (MM:SS)`);
      time.addEventListener("input", () => {
        const parsed = parseTime(time.value);
        const valid = parsed !== null && parsed >= 1;
        time.classList.toggle("is-invalid", !valid);
        if (valid) {
          segment.seconds = parsed;
          this.renderSummary();
          this.saveConfig();
        }
      });
      time.addEventListener("focus", () => {
        this.selectRow(i);
        time.select();
      });
      time.addEventListener("blur", () => {
        time.classList.remove("is-invalid");
        time.value = formatClock(segment.seconds);
      });

      const actions = document.createElement("div");
      actions.className = "ft-seg-actions";
      actions.appendChild(
        this.makeIconButton(
          "chevron-up",
          `Move segment ${i + 1} up`,
          () => this.moveSegment(i, -1),
          i === 0,
        ),
      );
      actions.appendChild(
        this.makeIconButton(
          "chevron-down",
          `Move segment ${i + 1} down`,
          () => this.moveSegment(i, 1),
          i === this.segments.length - 1,
        ),
      );
      actions.appendChild(
        this.makeIconButton(
          "trash-2",
          `Delete segment ${i + 1}`,
          () => this.removeSegment(i),
          this.segments.length === 1,
          "is-danger",
        ),
      );

      row.append(chip, label, time, actions);
      row.addEventListener("click", () => this.selectRow(i));
      this.el.segList.appendChild(row);
    });
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  makeIconButton(icon, label, onClick, disabled = false, extraClass = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `ft-icon-btn ${extraClass}`.trim();
    button.title = label;
    button.setAttribute("aria-label", label);
    button.disabled = disabled;
    button.innerHTML = `<i data-lucide="${icon}"></i>`;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      onClick();
    });
    return button;
  }

  selectRow(i) {
    if (i < 0 || i >= this.segments.length) return;
    this.index = i;
    [...this.el.segList.children].forEach((row, rowIndex) => {
      row.classList.toggle("is-selected", rowIndex === i);
    });
    this.renderSummary();
  }

  moveSegment(i, delta) {
    const target = i + delta;
    if (target < 0 || target >= this.segments.length) return;
    const [moved] = this.segments.splice(i, 1);
    this.segments.splice(target, 0, moved);
    this.selectRow(target);
    this.renderSegments();
    this.saveConfig();
  }

  removeSegment(i) {
    if (this.segments.length === 1) return;
    this.segments.splice(i, 1);
    this.index = Math.min(this.index, this.segments.length - 1);
    this.renderSegments();
    this.renderSummary();
    this.saveConfig();
  }

  addSegment() {
    this.segments.push({
      label: `Segment ${this.segments.length + 1}`,
      seconds: 300,
    });
    this.index = this.segments.length - 1;
    this.renderSegments();
    this.renderSummary();
    this.saveConfig();
    const lastRow = this.el.segList.querySelector(
      ".ft-seg-row:last-child .ft-seg-label",
    );
    if (lastRow) lastRow.focus();
  }

  totalSeconds() {
    return this.segments.reduce((sum, segment) => sum + segment.seconds, 0);
  }

  renderSummary() {
    const count = this.segments.length;
    const parts = this.segments.map(
      (segment) =>
        `${segment.label || "Untitled"} ${formatClock(segment.seconds)}`,
    );
    this.el.summary.innerHTML = "";
    const line = document.createElement("div");
    line.textContent = parts.join("  →  ");
    const total = document.createElement("div");
    total.style.marginTop = "0.4rem";
    const strong = document.createElement("strong");
    strong.textContent = `Total ${formatClock(this.totalSeconds())}`;
    total.append(
      strong,
      document.createTextNode(` · ${count} segment${count === 1 ? "" : "s"}`),
    );
    this.el.summary.append(line, total);
  }

  syncOptions() {
    this.el.optSound.checked = this.opts.sound;
    this.el.optTicks.checked = this.opts.ticks;
    this.el.optAuto.checked = this.opts.autoAdvance;
  }

  setStatus(text) {
    this.el.status.textContent = text;
  }

  /* ── events ─────────────────────────────────────────────────── */

  bindEvents() {
    this.el.add.addEventListener("click", () => this.addSegment());
    this.el.start.addEventListener("click", () => this.startSession());
    this.el.optSound.addEventListener("change", () => {
      this.opts.sound = this.el.optSound.checked;
      if (this.opts.sound) this.audio.unlock();
      this.syncMuteButton();
      this.saveConfig();
    });
    this.el.optTicks.addEventListener("change", () => {
      this.opts.ticks = this.el.optTicks.checked;
      this.saveConfig();
    });
    this.el.optAuto.addEventListener("change", () => {
      this.opts.autoAdvance = this.el.optAuto.checked;
      this.saveConfig();
    });

    this.el.playpause.addEventListener("click", () => this.togglePlay());
    this.el.next.addEventListener("click", () =>
      this.advance(1, { manual: true }),
    );
    this.el.prev.addEventListener("click", () =>
      this.advance(-1, { manual: true }),
    );
    this.el.reset.addEventListener("click", () => this.resetSegment());
    this.el.mode.addEventListener("click", () => this.toggleMode());
    this.el.fullscreen.addEventListener("click", () => this.toggleFullscreen());
    this.el.mute.addEventListener("click", () => this.toggleMute());
    this.el.exit.addEventListener("click", () => this.exitStage());

    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("fullscreenchange", () =>
      this.syncFullscreenButton(),
    );
    document.addEventListener("visibilitychange", () => {
      if (this.phase === "running") this.renderClock(performance.now());
    });

    this.el.stage.addEventListener("pointermove", this.onPointerMove);
    this.el.stage.addEventListener("pointerdown", this.onPointerMove);
  }

  onPointerMove() {
    this.showChrome();
  }

  showChrome() {
    this.el.stage.classList.remove("is-chrome-hidden");
    if (
      this.phase !== "running" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    window.clearTimeout(this.hideChromeId);
    this.hideChromeId = window.setTimeout(() => {
      if (this.phase === "running") {
        this.el.stage.classList.add("is-chrome-hidden");
      }
    }, 4000);
  }

  onKeyDown(event) {
    const target = event.target;
    const typing =
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable);
    if (typing) return;

    switch (event.key) {
      case " ":
      case "Spacebar":
        event.preventDefault();
        this.togglePlay();
        break;
      case "n":
      case "N":
        this.advance(1, { manual: true });
        break;
      case "b":
      case "B":
        this.advance(-1, { manual: true });
        break;
      case "r":
      case "R":
        this.resetSegment();
        break;
      case "s":
      case "S":
        this.toggleMode();
        break;
      case "f":
      case "F":
        this.toggleFullscreen();
        break;
      case "m":
      case "M":
        this.toggleMute();
        break;
      case "Escape":
        if (!document.fullscreenElement && this.phase !== "idle")
          this.exitStage();
        break;
      case "ArrowUp":
      case "ArrowDown": {
        if (this.phase === "idle") {
          event.preventDefault();
          const step = event.shiftKey ? 10 : 60;
          const delta = event.key === "ArrowUp" ? step : -step;
          const segment = this.segments[this.index];
          if (segment) {
            segment.seconds = Math.min(
              Math.max(segment.seconds + delta, 1),
              MAX_SECONDS,
            );
            this.syncSegmentInputs();
            this.renderSummary();
            this.saveConfig();
          }
        }
        break;
      }
      case "ArrowLeft":
      case "ArrowRight": {
        if (this.phase === "idle") {
          const delta = event.key === "ArrowLeft" ? -1 : 1;
          this.selectRow(this.index + delta);
        }
        break;
      }
      default:
        break;
    }
  }

  syncSegmentInputs() {
    [...this.el.segList.children].forEach((row, i) => {
      const input = row.querySelector(".ft-seg-time");
      const segment = this.segments[i];
      if (input && segment) input.value = formatClock(segment.seconds);
    });
  }

  /* ── runtime ────────────────────────────────────────────────── */

  elapsedSeconds(now = performance.now()) {
    const base = this.elapsedBefore;
    if (this.phase !== "running") return base;
    return base + (now - this.startedAt) / 1000;
  }

  currentSegment() {
    return this.segments[this.index];
  }

  startSession() {
    this.audio.unlock();
    this.index = 0;
    this.buzzed.clear();
    this.elapsedBefore = 0;
    this.startedAt = performance.now();
    this.phase = "running";
    this.lastTickSecond = null;
    this.el.stage.hidden = false;
    document.body.classList.add("ft-locked");
    this.startLoops();
    this.requestWakeLock();
    this.syncTransport();
    this.renderStage();
    this.setStatus("");
    this.announce(`${this.currentSegment().label} started`);
    this.showChrome();
  }

  togglePlay() {
    if (this.phase === "idle") {
      this.startSession();
      return;
    }
    if (this.phase === "running") {
      this.elapsedBefore = this.elapsedSeconds();
      this.phase = "paused";
      this.releaseWakeLock();
      this.stopLoops();
      this.syncTransport();
      this.announce("Timer paused");
      this.el.stage.classList.remove("is-chrome-hidden");
      this.renderStage();
      return;
    }
    this.audio.unlock();
    this.startedAt = performance.now();
    this.phase = "running";
    this.lastTickSecond = null;
    this.startLoops();
    this.requestWakeLock();
    this.syncTransport();
    this.announce("Timer resumed");
    this.showChrome();
  }

  resetSegment() {
    this.elapsedBefore = 0;
    this.startedAt = performance.now();
    this.buzzed.delete(this.index);
    this.lastTickSecond = null;
    if (this.phase === "running") {
      this.startLoops();
    }
    this.renderStage();
    this.announce("Segment reset");
  }

  advance(direction, { manual = false } = {}) {
    const target = this.index + direction;
    if (target < 0 || target >= this.segments.length) return;
    this.index = target;
    this.elapsedBefore = 0;
    this.startedAt = performance.now();
    this.buzzed.delete(this.index);
    this.lastTickSecond = null;
    if (manual && this.opts.sound) this.audio.chime();
    this.renderStage();
    const segment = this.currentSegment();
    this.announce(
      `${direction > 0 ? "Next" : "Previous"} segment: ${segment.label} ${formatClock(segment.seconds)}`,
    );
    if (this.phase === "running") this.showChrome();
  }

  handleTimeUp(now) {
    this.el.stage.classList.add("is-flash");
    if (this.opts.sound) this.audio.timeUp();
    window.setTimeout(() => this.el.stage.classList.remove("is-flash"), 1000);
    const segment = this.currentSegment();
    this.announce(`${segment.label} finished — over time`);
    if (this.opts.autoAdvance && this.index < this.segments.length - 1) {
      this.advance(1, { manual: false });
    }
    this.renderStage(now);
  }

  toggleMode() {
    this.mode = this.mode === "countdown" ? "stopwatch" : "countdown";
    this.lastTickSecond = null;
    this.syncModeButton();
    this.renderStage();
    this.saveConfig();
    this.announce(
      this.mode === "countdown" ? "Countdown mode" : "Stopwatch mode",
    );
  }

  syncModeButton() {
    const label = this.mode === "countdown" ? "Countdown (S)" : "Stopwatch (S)";
    this.el.mode.title = label;
    this.el.mode.setAttribute("aria-label", label);
    const text = this.el.mode.querySelector("span");
    if (text)
      text.textContent = this.mode === "countdown" ? "Countdown" : "Stopwatch";
  }

  toggleMute() {
    this.opts.sound = !this.opts.sound;
    this.el.optSound.checked = this.opts.sound;
    if (this.opts.sound) this.audio.unlock();
    this.syncMuteButton();
    this.saveConfig();
    this.announce(this.opts.sound ? "Sound on" : "Sound off");
  }

  syncMuteButton() {
    const label = this.opts.sound ? "Mute (M)" : "Unmute (M)";
    this.el.mute.title = label;
    this.el.mute.setAttribute("aria-label", label);
    this.el.mute.setAttribute("aria-pressed", String(!this.opts.sound));
    const icon = this.el.mute.querySelector("[data-lucide], svg");
    if (icon) {
      const name = this.opts.sound ? "volume-2" : "volume-x";
      const holder = this.el.mute.querySelector("i, svg");
      if (holder && holder.tagName === "I") {
        holder.setAttribute("data-lucide", name);
      } else if (holder && holder.parentElement) {
        const i = document.createElement("i");
        i.setAttribute("data-lucide", name);
        holder.replaceWith(i);
      }
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    }
  }

  syncTransport() {
    const running = this.phase === "running";
    const label = running ? "Pause (Space)" : "Start (Space)";
    this.el.playpause.title = label;
    this.el.playpause.setAttribute("aria-label", label);
    this.el.playpause.setAttribute("aria-pressed", String(running));
    const holder = this.el.playpause.querySelector("i, svg");
    const wanted = running ? "pause" : "play";
    if (holder) {
      if (holder.tagName === "I") {
        holder.setAttribute("data-lucide", wanted);
      } else if (holder.parentElement) {
        const i = document.createElement("i");
        i.setAttribute("data-lucide", wanted);
        holder.replaceWith(i);
      }
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    }
    const text = this.el.playpause.querySelector("span");
    if (text) text.textContent = running ? "Pause" : "Start";
  }

  async toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      /* denied or unsupported (headless) — stage stays windowed */
    }
    this.syncFullscreenButton();
  }

  syncFullscreenButton() {
    const active = Boolean(document.fullscreenElement);
    const label = active ? "Exit fullscreen (F)" : "Fullscreen (F)";
    this.el.fullscreen.title = label;
    this.el.fullscreen.setAttribute("aria-label", label);
    this.el.fullscreen.setAttribute("aria-pressed", String(active));
  }

  exitStage() {
    if (this.phase === "running") {
      this.elapsedBefore = this.elapsedSeconds();
      this.phase = "paused";
    }
    this.stopLoops();
    this.releaseWakeLock();
    this.el.stage.hidden = true;
    this.el.stage.classList.remove("is-chrome-hidden");
    document.body.classList.remove("ft-locked");
    document.title = this.baseTitle;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    this.phase = "idle";
    this.elapsedBefore = 0;
    this.buzzed.clear();
    this.syncTransport();
    this.renderStage();
    this.setStatus("Timer stopped. Adjust the sequence and start again.");
    this.announce("Timer stopped");
  }

  /* ── loops ──────────────────────────────────────────────────── */

  startLoops() {
    if (this.rafId === null) {
      this.rafId = window.requestAnimationFrame(this.loopFrame);
    }
    if (this.watchdogId === null) {
      // Background tabs throttle rAF; this keeps the time-up alarm honest.
      this.watchdogId = window.setInterval(() => {
        if (this.phase === "running") {
          this.checkTimeUp(performance.now());
        }
      }, 1000);
    }
  }

  stopLoops() {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.watchdogId !== null) {
      window.clearInterval(this.watchdogId);
      this.watchdogId = null;
    }
    window.clearTimeout(this.hideChromeId);
  }

  loopFrame(now) {
    this.rafId = window.requestAnimationFrame(this.loopFrame);
    this.checkTimeUp(now);
    this.renderStage(now);
  }

  checkTimeUp(now) {
    const segment = this.currentSegment();
    if (!segment || this.mode !== "countdown") return;
    const remaining = segment.seconds - this.elapsedSeconds(now);
    if (remaining <= 0) {
      if (!this.buzzed.has(this.index)) {
        this.buzzed.add(this.index);
        this.handleTimeUp(now);
      }
      return;
    }
    if (this.opts.ticks && remaining <= 10) {
      const second = Math.ceil(remaining);
      if (second !== this.lastTickSecond) {
        this.lastTickSecond = second;
        if (second >= 1 && second <= 10 && this.opts.sound) this.audio.tick();
      }
    }
  }

  renderStage(now = performance.now()) {
    const segment = this.currentSegment();
    if (!segment) return;
    const elapsed = this.elapsedSeconds(now);
    const display = computeDisplay(this.mode, segment.seconds, elapsed);

    this.renderClock(display);
    this.el.segName.textContent = segment.label || "Untitled segment";
    this.el.segIndex.textContent = `Segment ${this.index + 1} of ${this.segments.length}`;

    const nextSegment = this.segments[this.index + 1];
    this.el.nextLabel.textContent = nextSegment
      ? `Next: ${nextSegment.label} · ${formatClock(nextSegment.seconds)}`
      : this.segments.length > 1
        ? "Last segment"
        : "";

    let progress;
    if (this.mode === "stopwatch") {
      progress = (elapsed % 60) / 60;
    } else {
      progress = Math.min(elapsed / Math.max(segment.seconds, 1), 1);
    }
    this.el.progress.style.width = `${(progress * 100).toFixed(2)}%`;
    const percent = Math.round(progress * 100);
    if (percent !== this.lastProgressPercent) {
      this.lastProgressPercent = percent;
      const bar = this.el.progress.closest(".ft-progress");
      if (bar) bar.setAttribute("aria-valuenow", String(percent));
    }
    this.el.stage.classList.toggle("is-overtime", display.overtime);

    if (this.phase === "running") {
      document.title = `${display.text} · ${segment.label || "Timer"} — Fullscreen Timer`;
    }
  }

  renderClock(display) {
    const signature = `${display.text}|${display.overtime}|${display.warning}`;
    if (signature === this.lastClockText) return;
    this.lastClockText = signature;
    this.el.clock.textContent = display.text;
    this.el.clock.classList.toggle("is-overtime", display.overtime);
    this.el.clock.classList.toggle(
      "is-warning",
      display.warning && !display.overtime,
    );
  }

  announce(text) {
    if (!this.el.live) return;
    this.el.live.textContent = "";
    window.setTimeout(() => {
      this.el.live.textContent = text;
    }, 30);
  }

  /* ── wake lock ──────────────────────────────────────────────── */

  async requestWakeLock() {
    try {
      if ("wakeLock" in navigator && !this.wakeLock) {
        this.wakeLock = await navigator.wakeLock.request("screen");
        this.wakeLock.addEventListener("release", () => {
          this.wakeLock = null;
        });
      }
    } catch (error) {
      /* not supported / denied — ignore */
    }
  }

  async releaseWakeLock() {
    try {
      if (this.wakeLock) await this.wakeLock.release();
    } catch (error) {
      /* ignore */
    }
    this.wakeLock = null;
  }
}

if (typeof document !== "undefined") {
  const boot = () => {
    const engine = new FullscreenTimer();
    // Expose for end-to-end tests and debugging (no API surface otherwise).
    window.__fullscreenTimer = engine;
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}
