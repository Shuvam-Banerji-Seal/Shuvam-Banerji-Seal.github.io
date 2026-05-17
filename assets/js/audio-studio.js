/**
 * SBS Audio Studio - Professional Multi-Track DAW
 * Multi-track editing, visualizers, mixer, effects, export
 */

const TRACK_COLORS = [
  '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316',
  '#6366f1', '#84cc16'
];

class AudioTrack {
  constructor(id, name, audioBuffer, ctx) {
    this.id = id;
    this.name = name;
    this.buffer = audioBuffer;
    this.color = TRACK_COLORS[id % TRACK_COLORS.length];
    this.volume = 1.0;
    this.pan = 0;
    this.muted = false;
    this.soloed = false;
    this.gainNode = ctx.createGain();
    this.panNode = ctx.createStereoPanner();
    this.gainNode.connect(this.panNode);
  }
}

class AudioStudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.tracks = [];
    this.selectedTrackId = null;
    this.nextTrackId = 0;
    this.isPlaying = false;
    this.isRecording = false;
    this.startTime = 0;
    this.pauseTime = 0;
    this.playbackRate = 1;
    this.isLooping = false;
    this.selection = { start: 0, end: 0 };
    this.hasSelection = false;
    this.isSelecting = false;
    this.markers = [];
    this.clipboard = null;
    this.zoom = 1;
    this.scrollOffset = 0;
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
    this.activeSources = [];
    this.visMode = 'spectrum';
    this.bpm = 120;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recordingStartTime = 0;
    this.inputAnalyser = null;

    this.effects = {
      eq: { bands: [], enabled: false },
      compressor: { node: null, enabled: false },
      reverb: { convolver: null, wet: null, dry: null, enabled: false },
      delay: { node: null, feedback: null, mix: null, enabled: false }
    };

    this.init();
  }

  async init() {
    try {
      if (!window.AudioContext && !window.webkitAudioContext) {
        this.notify('Web Audio API not supported', 'error');
        return;
      }
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.setupEffects();
      this.initCanvases();
      this.bindEvents();
      this.drawEmptyVisualizer();
      this.drawEmptyEQ();

      console.log('Audio Studio initialized');
    } catch (e) {
      console.error('Init failed:', e);
      this.notify('Failed to initialize: ' + e.message, 'error');
    }
  }

  setupEffects() {
    const freqs = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 16000];
    this.effects.eq.bands = freqs.map(f => {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = f;
      filter.Q.value = 1.5;
      filter.gain.value = 0;
      return filter;
    });

    this.effects.compressor.node = this.ctx.createDynamicsCompressor();
    this.effects.compressor.node.threshold.value = -24;
    this.effects.compressor.node.ratio.value = 4;
    this.effects.compressor.node.attack.value = 0.01;
    this.effects.compressor.node.release.value = 0.25;

    this.effects.reverb.convolver = this.ctx.createConvolver();
    this.effects.reverb.wet = this.ctx.createGain();
    this.effects.reverb.dry = this.ctx.createGain();
    this.effects.reverb.wet.gain.value = 0.3;
    this.effects.reverb.dry.gain.value = 0.7;
    this.effects.reverb.convolver.buffer = this.makeIR(2.0, 2.0);

    this.effects.delay.node = this.ctx.createDelay(5.0);
    this.effects.delay.feedback = this.ctx.createGain();
    this.effects.delay.mix = this.ctx.createGain();
    this.effects.delay.node.delayTime.value = 0.25;
    this.effects.delay.feedback.gain.value = 0.3;
    this.effects.delay.mix.gain.value = 0.25;
  }

  makeIR(duration, decay) {
    const len = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  initCanvases() {
    this.vizCanvas = document.getElementById('visualizer-canvas');
    this.vizCtx = this.vizCanvas?.getContext('2d');
    this.eqCanvas = document.getElementById('eq-canvas');
    this.eqCtx = this.eqCanvas?.getContext('2d');

    if (this.vizCanvas) {
      this.resizeCanvas(this.vizCanvas);
    }
    if (this.eqCanvas) {
      this.resizeCanvas(this.eqCanvas);
    }

    window.addEventListener('resize', () => {
      if (this.vizCanvas) this.resizeCanvas(this.vizCanvas);
      if (this.eqCanvas) this.resizeCanvas(this.eqCanvas);
      this.drawTrackCanvases();
    });
  }

  resizeCanvas(canvas) {
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = parent.clientWidth * dpr;
    canvas.height = parent.clientHeight * dpr;
    canvas.style.width = parent.clientWidth + 'px';
    canvas.style.height = parent.clientHeight + 'px';
    canvas.getContext('2d').scale(dpr, dpr);
  }

  bindEvents() {
    // Transport
    document.getElementById('play-btn')?.addEventListener('click', () => this.togglePlay());
    document.getElementById('stop-btn')?.addEventListener('click', () => this.stop());
    document.getElementById('skip-start-btn')?.addEventListener('click', () => this.skipToStart());
    document.getElementById('skip-end-btn')?.addEventListener('click', () => this.skipToEnd());
    document.getElementById('record-btn')?.addEventListener('click', () => this.toggleRecord());
    document.getElementById('loop-btn')?.addEventListener('click', () => this.toggleLoop());

    // Zoom
    document.getElementById('zoom-in-btn')?.addEventListener('click', () => this.setZoom(this.zoom * 1.5));
    document.getElementById('zoom-out-btn')?.addEventListener('click', () => this.setZoom(this.zoom / 1.5));
    document.getElementById('zoom-slider')?.addEventListener('input', e => {
      this.setZoom(parseFloat(e.target.value) / 10);
    });

    // BPM
    document.getElementById('bpm-input')?.addEventListener('change', e => {
      this.bpm = Math.max(20, Math.min(300, parseInt(e.target.value) || 120));
    });

    // Track management
    document.getElementById('add-track-btn')?.addEventListener('click', () => this.addEmptyTrack());
    document.getElementById('import-audio-btn')?.addEventListener('click', () => {
      document.getElementById('audio-file-input')?.click();
    });
    document.getElementById('audio-file-input')?.addEventListener('change', e => {
      for (const file of e.target.files) {
        this.importFile(file);
      }
      e.target.value = '';
    });

    // Edit toolbar
    document.getElementById('cut-btn')?.addEventListener('click', () => this.cut());
    document.getElementById('copy-btn')?.addEventListener('click', () => this.copy());
    document.getElementById('paste-btn')?.addEventListener('click', () => this.paste());
    document.getElementById('delete-btn')?.addEventListener('click', () => this.deleteSelection());
    document.getElementById('undo-btn')?.addEventListener('click', () => this.undo());
    document.getElementById('redo-btn')?.addEventListener('click', () => this.redo());
    document.getElementById('select-all-btn')?.addEventListener('click', () => this.selectAll());
    document.getElementById('trim-btn')?.addEventListener('click', () => this.trimToSelection());
    document.getElementById('fade-in-btn')?.addEventListener('click', () => this.applyFade('in'));
    document.getElementById('fade-out-btn')?.addEventListener('click', () => this.applyFade('out'));
    document.getElementById('normalize-btn')?.addEventListener('click', () => this.normalize());
    document.getElementById('marker-btn')?.addEventListener('click', () => this.addMarker());

    // Master volume
    document.getElementById('master-volume')?.addEventListener('input', e => {
      const val = parseFloat(e.target.value) / 100;
      this.masterGain.gain.value = val;
      document.getElementById('master-volume-db').textContent = this.toDB(val);
    });

    // Visualizer tabs
    document.querySelectorAll('.viz-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.viz-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.visMode = tab.dataset.viz;
      });
    });

    // Effect tabs
    document.querySelectorAll('.effect-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.effect-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.effect-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.effect}-panel`)?.classList.add('active');
      });
    });

    this.bindEffectsControls();

    // Export
    document.getElementById('export-btn')?.addEventListener('click', () => this.exportAudio());

    // Timeline interaction
    const timeline = document.getElementById('timeline-area');
    if (timeline) {
      timeline.addEventListener('mousedown', e => this.onTimelineMouseDown(e));
      timeline.addEventListener('mousemove', e => this.onTimelineMouseMove(e));
      timeline.addEventListener('mouseup', () => this.onTimelineMouseUp());
    }

    // Keyboard
    document.addEventListener('keydown', e => this.onKeyDown(e));

    // Drag and drop
    const studio = document.querySelector('.studio-container');
    if (studio) {
      studio.addEventListener('dragover', e => { e.preventDefault(); studio.classList.add('dragover'); });
      studio.addEventListener('dragleave', () => studio.classList.remove('dragover'));
      studio.addEventListener('drop', e => {
        e.preventDefault();
        studio.classList.remove('dragover');
        for (const file of e.dataTransfer.files) {
          if (file.type.startsWith('audio/')) this.importFile(file);
        }
      });
    }
  }

  bindEffectsControls() {
    // EQ sliders
    ['60','170','310','600','1k','3k','6k','12k','16k'].forEach((f, i) => {
      document.getElementById(`eq-${f}`)?.addEventListener('input', e => {
        if (this.effects.eq.bands[i]) {
          this.effects.eq.bands[i].gain.value = parseFloat(e.target.value);
        }
        this.drawEQCurve();
      });
    });

    // EQ presets
    document.getElementById('eq-preset')?.addEventListener('change', e => {
      const presets = {
        'flat': [0,0,0,0,0,0,0,0,0],
        'bass-boost': [8,6,4,2,0,0,0,0,0],
        'treble-boost': [0,0,0,0,0,2,4,6,8],
        'vocal': [-2,-1,0,2,4,4,2,0,-1],
        'podcast': [-2,0,2,4,4,2,0,-1,-2]
      };
      const vals = presets[e.target.value] || presets['flat'];
      const freqs = ['60','170','310','600','1k','3k','6k','12k','16k'];
      vals.forEach((v, i) => {
        const s = document.getElementById(`eq-${freqs[i]}`);
        if (s) { s.value = v; this.effects.eq.bands[i].gain.value = v; }
      });
      this.drawEQCurve();
    });

    // Compressor
    const compMap = [
      ['comp-threshold','threshold','',1],['comp-ratio','ratio',':1',1],
      ['comp-attack','attack',' ms',0.001],['comp-release','release',' ms',0.001],
      ['comp-gain','gain',' dB',1]
    ];
    compMap.forEach(([id,param,suffix,scale]) => {
      document.getElementById(id)?.addEventListener('input', e => {
        const v = parseFloat(e.target.value);
        if (this.effects.compressor.node[param]) {
          this.effects.compressor.node[param].value = v * scale;
        }
        const valEl = document.getElementById(`${id}-val`);
        if (valEl) valEl.textContent = v + suffix;
      });
    });

    // Reverb
    document.getElementById('reverb-size')?.addEventListener('input', e => {
      const s = parseFloat(e.target.value) / 100;
      const d = parseFloat(document.getElementById('reverb-damping')?.value || 50) / 50;
      this.effects.reverb.convolver.buffer = this.makeIR(s * 4 + 0.5, d);
      document.getElementById('reverb-size-val').textContent = e.target.value + '%';
    });
    document.getElementById('reverb-damping')?.addEventListener('input', e => {
      const d = parseFloat(e.target.value) / 50;
      const s = parseFloat(document.getElementById('reverb-size')?.value || 50) / 100;
      this.effects.reverb.convolver.buffer = this.makeIR(s * 4 + 0.5, d);
      document.getElementById('reverb-damping-val').textContent = e.target.value + '%';
    });
    document.getElementById('reverb-mix')?.addEventListener('input', e => {
      const w = parseFloat(e.target.value) / 100;
      this.effects.reverb.wet.gain.value = w;
      this.effects.reverb.dry.gain.value = 1 - w;
      document.getElementById('reverb-mix-val').textContent = e.target.value + '%';
    });

    // Delay
    document.getElementById('delay-time')?.addEventListener('input', e => {
      this.effects.delay.node.delayTime.value = e.target.value / 1000;
      document.getElementById('delay-time-val').textContent = e.target.value + ' ms';
    });
    document.getElementById('delay-feedback')?.addEventListener('input', e => {
      this.effects.delay.feedback.gain.value = e.target.value / 100;
      document.getElementById('delay-feedback-val').textContent = e.target.value + '%';
    });
    document.getElementById('delay-mix')?.addEventListener('input', e => {
      this.effects.delay.mix.gain.value = e.target.value / 100;
      document.getElementById('delay-mix-val').textContent = e.target.value + '%';
    });
  }

  // ========== TRACK MANAGEMENT ==========

  addEmptyTrack() {
    const id = this.nextTrackId++;
    const buf = this.ctx.createBuffer(2, this.ctx.sampleRate * 5, this.ctx.sampleRate);
    const track = new AudioTrack(id, `Track ${id + 1}`, buf, this.ctx);
    this.tracks.push(track);
    this.selectedTrackId = id;
    this.saveHistory();
    this.renderTracks();
    this.renderMixer();
    this.drawTrackCanvases();
    this.updateTimeDisplay();
  }

  async importFile(file) {
    try {
      const arrayBuf = await file.arrayBuffer();
      const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
      const id = this.nextTrackId++;
      const name = file.name.replace(/\.[^.]+$/, '');
      const track = new AudioTrack(id, name, audioBuf, this.ctx);
      this.tracks.push(track);
      this.selectedTrackId = id;
      this.saveHistory();
      this.renderTracks();
      this.renderMixer();
      this.drawTrackCanvases();
      this.updateTimeDisplay();
      this.notify(`Imported: ${name}`, 'info');
    } catch (e) {
      console.error('Import error:', e);
      this.notify('Failed to import: ' + e.message, 'error');
    }
  }

  removeTrack(id) {
    const idx = this.tracks.findIndex(t => t.id === id);
    if (idx < 0) return;
    this.tracks.splice(idx, 1);
    if (this.selectedTrackId === id) {
      this.selectedTrackId = this.tracks.length > 0 ? this.tracks[0].id : null;
    }
    this.saveHistory();
    this.renderTracks();
    this.renderMixer();
    this.drawTrackCanvases();
    this.updateTimeDisplay();
  }

  selectTrack(id) {
    this.selectedTrackId = id;
    this.renderTracks();
  }

  get selectedTrack() {
    return this.tracks.find(t => t.id === this.selectedTrackId) || null;
  }

  get totalDuration() {
    if (this.tracks.length === 0) return 0;
    return Math.max(...this.tracks.map(t => t.buffer.duration));
  }

  // ========== RENDERING ==========

  renderTracks() {
    const list = document.getElementById('track-list');
    const canvasContainer = document.getElementById('track-canvas-container');
    if (!list || !canvasContainer) return;

    list.innerHTML = '';
    canvasContainer.innerHTML = '';

    if (this.tracks.length === 0) {
      list.innerHTML = `<div class="empty-state"><i data-lucide="audio-waveform"></i><p>No tracks. Import audio or add an empty track.</p></div>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    this.tracks.forEach(track => {
      // Track item in list
      const item = document.createElement('div');
      item.className = `track-item${track.id === this.selectedTrackId ? ' selected' : ''}`;
      item.onclick = () => this.selectTrack(track.id);
      item.innerHTML = `
        <div class="track-color" style="background:${track.color}"></div>
        <div class="track-info">
          <div class="track-name">${this.esc(track.name)}</div>
          <div class="track-meta">${track.buffer.duration.toFixed(1)}s · ${track.buffer.numberOfChannels}ch · ${(track.buffer.sampleRate/1000).toFixed(1)}kHz</div>
        </div>
        <div class="track-controls">
          <button class="track-btn mute${track.muted ? ' active' : ''}" onclick="event.stopPropagation();window.studio.toggleMute(${track.id})" title="Mute">M</button>
          <button class="track-btn solo${track.soloed ? ' active' : ''}" onclick="event.stopPropagation();window.studio.toggleSolo(${track.id})" title="Solo">S</button>
          <input type="range" class="track-volume" min="0" max="150" value="${Math.round(track.volume*100)}" onclick="event.stopPropagation()" oninput="window.studio.setTrackVolume(${track.id},this.value)" title="Volume" />
          <button class="track-btn delete" onclick="event.stopPropagation();window.studio.removeTrack(${track.id})" title="Remove">
            <i data-lucide="x"></i>
          </button>
        </div>
      `;
      list.appendChild(item);

      // Canvas row
      const row = document.createElement('div');
      row.className = 'track-canvas-row';
      row.dataset.trackId = track.id;
      const canvas = document.createElement('canvas');
      canvas.id = `track-canvas-${track.id}`;
      row.appendChild(canvas);
      canvasContainer.appendChild(row);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
    this.drawTrackCanvases();
  }

  renderMixer() {
    const container = document.getElementById('mixer-channels');
    if (!container) return;
    container.innerHTML = '';

    this.tracks.forEach(track => {
      const ch = document.createElement('div');
      ch.className = 'mixer-channel';
      ch.innerHTML = `
        <div class="channel-label" style="color:${track.color}">${this.esc(track.name)}</div>
        <div class="channel-meter">
          <div class="meter-fill" id="meter-${track.id}-l"></div>
          <div class="meter-fill" id="meter-${track.id}-r"></div>
        </div>
        <input type="range" min="0" max="150" value="${Math.round(track.volume*100)}" class="volume-fader" orient="vertical"
          oninput="window.studio.setTrackVolume(${track.id},this.value)" />
        <div class="volume-db">${this.toDB(track.volume)}</div>
      `;
      container.appendChild(ch);
    });
  }

  drawTrackCanvases() {
    this.tracks.forEach(track => {
      const canvas = document.getElementById(`track-canvas-${track.id}`);
      if (!canvas) return;
      const parent = canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = parent.clientWidth + 'px';
      canvas.style.height = parent.clientHeight + 'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      this.drawTrackWaveform(ctx, track, parent.clientWidth, parent.clientHeight);
    });
  }

  drawTrackWaveform(ctx, track, w, h) {
    const data = track.buffer.getChannelData(0);
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, w, h);

    // Center line
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Waveform
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, track.color);
    grad.addColorStop(0.5, track.color + '80');
    grad.addColorStop(1, track.color);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;

    const spp = Math.max(1, Math.floor(data.length / (w * this.zoom)));
    const start = Math.floor(this.scrollOffset * data.length);

    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const si = start + Math.floor(x * spp);
      let min = 1, max = -1;
      for (let i = 0; i < spp && si + i < data.length; i++) {
        const s = data[si + i];
        if (s < min) min = s;
        if (s > max) max = s;
      }
      const yMin = (1 - min) * h / 2;
      const yMax = (1 - max) * h / 2;
      if (x === 0) ctx.moveTo(x, yMin);
      ctx.lineTo(x, yMin);
      ctx.lineTo(x, yMax);
    }
    ctx.stroke();

    // Selection
    if (this.hasSelection && this.selectedTrackId === track.id) {
      const dur = track.buffer.duration;
      const sx = (this.selection.start / dur) * w;
      const ex = (this.selection.end / dur) * w;
      ctx.fillStyle = 'rgba(6,182,212,0.2)';
      ctx.fillRect(sx, 0, ex - sx, h);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, 0); ctx.lineTo(sx, h);
      ctx.moveTo(ex, 0); ctx.lineTo(ex, h);
      ctx.stroke();
    }
  }

  // ========== TRANSPORT ==========

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  play() {
    if (this.tracks.length === 0) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.stopAllSources();
    this.activeSources = [];

    const hasSolo = this.tracks.some(t => t.soloed);

    this.tracks.forEach(track => {
      if (hasSolo && !track.soloed) return;
      if (track.muted) return;

      const source = this.ctx.createBufferSource();
      source.buffer = track.buffer;
      source.playbackRate.value = this.playbackRate;

      source.connect(track.gainNode);
      track.panNode.connect(this.masterGain);

      if (this.isLooping && this.hasSelection) {
        source.loop = true;
        source.loopStart = this.selection.start;
        source.loopEnd = this.selection.end;
      }

      const offset = this.pauseTime;
      source.start(0, offset);
      this.activeSources.push(source);
    });

    this.startTime = this.ctx.currentTime - this.pauseTime;
    this.isPlaying = true;
    this.updatePlayBtn();
    this.animatePlayhead();
    this.startVisualizer();
  }

  pause() {
    if (!this.isPlaying) return;
    this.pauseTime = this.ctx.currentTime - this.startTime;
    this.stopAllSources();
    this.isPlaying = false;
    this.updatePlayBtn();
  }

  stop() {
    this.stopAllSources();
    this.isPlaying = false;
    this.pauseTime = 0;
    this.updatePlayBtn();
    this.updatePlayhead();
    this.updateTimeDisplay();
  }

  stopAllSources() {
    this.activeSources.forEach(s => { try { s.stop(); } catch(e) {} try { s.disconnect(); } catch(e) {} });
    this.activeSources = [];
  }

  skipToStart() {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) this.stopAllSources();
    this.pauseTime = 0;
    if (wasPlaying) this.play();
    else { this.updatePlayhead(); this.updateTimeDisplay(); }
  }

  skipToEnd() {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) this.stopAllSources();
    this.pauseTime = this.totalDuration;
    if (wasPlaying) this.play();
    else { this.updatePlayhead(); this.updateTimeDisplay(); }
  }

  toggleLoop() {
    this.isLooping = !this.isLooping;
    document.getElementById('loop-btn')?.classList.toggle('active', this.isLooping);
  }

  toggleMute(id) {
    const t = this.tracks.find(t => t.id === id);
    if (!t) return;
    t.muted = !t.muted;
    t.gainNode.gain.value = t.muted ? 0 : t.volume;
    this.renderTracks();
  }

  toggleSolo(id) {
    const t = this.tracks.find(t => t.id === id);
    if (!t) return;
    t.soloed = !t.soloed;
    this.renderTracks();
  }

  setTrackVolume(id, val) {
    const t = this.tracks.find(t => t.id === id);
    if (!t) return;
    t.volume = val / 100;
    if (!t.muted) t.gainNode.gain.value = t.volume;
    this.renderMixer();
  }

  updatePlayBtn() {
    const btn = document.getElementById('play-btn');
    if (btn) {
      btn.classList.toggle('playing', this.isPlaying);
      const icon = btn.querySelector('i, svg');
      if (icon) icon.setAttribute('data-lucide', this.isPlaying ? 'pause' : 'play');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  updatePlayhead() {
    const ph = document.getElementById('playhead');
    const container = document.getElementById('track-canvas-container');
    if (!ph || !container || this.totalDuration === 0) return;
    const progress = this.pauseTime / this.totalDuration;
    ph.style.left = (progress * container.clientWidth) + 'px';
  }

  animatePlayhead() {
    if (!this.isPlaying) return;
    this.pauseTime = this.ctx.currentTime - this.startTime;
    if (this.pauseTime >= this.totalDuration && !this.isLooping) {
      this.stop();
      return;
    }
    this.updatePlayhead();
    this.updateTimeDisplay();
    requestAnimationFrame(() => this.animatePlayhead());
  }

  updateTimeDisplay() {
    const cur = document.getElementById('current-time');
    const tot = document.getElementById('total-time');
    if (cur) cur.textContent = this.fmtTime(this.pauseTime, true);
    if (tot) tot.textContent = this.fmtTime(this.totalDuration, true);
    this.drawTimeRuler();
  }

  // ========== RECORDING ==========

  async toggleRecord() {
    if (this.isRecording) this.stopRecording();
    else await this.startRecording();
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.ctx.createMediaStreamSource(stream);
      this.inputAnalyser = this.ctx.createAnalyser();
      this.inputAnalyser.fftSize = 2048;
      source.connect(this.inputAnalyser);

      this.recordStream = stream;
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      this.recordedChunks = [];
      this.mediaRecorder.ondataavailable = e => { if (e.data.size > 0) this.recordedChunks.push(e.data); };
      this.mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType });
        const arrayBuf = await blob.arrayBuffer();
        const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
        const id = this.nextTrackId++;
        const track = new AudioTrack(id, `Recording ${id + 1}`, audioBuf, this.ctx);
        this.tracks.push(track);
        this.selectedTrackId = id;
        this.saveHistory();
        this.renderTracks();
        this.renderMixer();
        this.drawTrackCanvases();
        this.updateTimeDisplay();
        this.notify('Recording added', 'info');
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      document.getElementById('record-btn')?.classList.add('recording');
    } catch (e) {
      console.error('Record error:', e);
      this.notify('Recording failed: ' + e.message, 'error');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      document.getElementById('record-btn')?.classList.remove('recording');
      this.inputAnalyser = null;
    }
  }

  // ========== VISUALIZERS ==========

  startVisualizer() {
    if (this._visRAF) cancelAnimationFrame(this._visRAF);
    const draw = () => {
      if (!this.isPlaying && !this.isRecording) return;
      this._visRAF = requestAnimationFrame(draw);
      this.drawVisualizer();
      this.drawMeters();
    };
    draw();
  }

  drawVisualizer() {
    if (!this.vizCtx || !this.vizCanvas) return;
    const ctx = this.vizCtx;
    const w = this.vizCanvas.width / (window.devicePixelRatio || 1);
    const h = this.vizCanvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    const analyser = this.isRecording ? this.inputAnalyser : this.analyser;
    if (!analyser) return;

    const bufLen = analyser.frequencyBinCount;

    if (this.visMode === 'spectrum') {
      const data = new Uint8Array(bufLen);
      analyser.getByteFrequencyData(data);
      const barW = (w / bufLen) * 2.5;
      let x = 0;
      for (let i = 0; i < bufLen; i++) {
        const barH = (data[i] / 255) * h;
        const hue = 180 + (data[i] / 255) * 60;
        ctx.fillStyle = `hsla(${hue}, 80%, 55%, ${Math.max(0.3, data[i] / 255)})`;
        ctx.fillRect(x, h - barH, barW, barH);
        x += barW + 1;
      }
    } else if (this.visMode === 'waveform') {
      const data = new Uint8Array(bufLen);
      analyser.getByteTimeDomainData(data);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#06b6d4';
      ctx.beginPath();
      const sliceW = w / bufLen;
      let x = 0;
      for (let i = 0; i < bufLen; i++) {
        const y = (data[i] / 255) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceW;
      }
      ctx.stroke();
    } else if (this.visMode === 'oscilloscope') {
      const data = new Float32Array(bufLen);
      analyser.getFloatTimeDomainData(data);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      const sliceW = w / bufLen;
      let x = 0;
      for (let i = 0; i < bufLen; i++) {
        const y = (0.5 - data[i] * 0.5) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceW;
      }
      ctx.stroke();
    }
  }

  drawMeters() {
    if (!this.analyser) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const level = Math.min(100, (avg / 255) * 120);

    const mL = document.getElementById('master-meter-l');
    const mR = document.getElementById('master-meter-r');
    if (mL) mL.style.height = level + '%';
    if (mR) mR.style.height = (level * 0.95) + '%';
  }

  drawEmptyVisualizer() {
    if (!this.vizCtx || !this.vizCanvas) return;
    const ctx = this.vizCtx;
    const w = this.vizCanvas.width / (window.devicePixelRatio || 1);
    const h = this.vizCanvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, h * (i + 1) / 5);
      ctx.lineTo(w, h * (i + 1) / 5);
      ctx.stroke();
    }
  }

  drawEmptyEQ() {
    if (!this.eqCtx || !this.eqCanvas) return;
    this.drawEQCurve();
  }

  drawEQCurve() {
    if (!this.eqCtx || !this.eqCanvas) return;
    const ctx = this.eqCtx;
    const w = this.eqCanvas.width / (window.devicePixelRatio || 1);
    const h = this.eqCanvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, h * i / 4);
      ctx.lineTo(w, h * i / 4);
      ctx.stroke();
    }

    // Zero line
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // EQ curve
    const gains = this.effects.eq.bands.map(b => b.gain.value);
    const maxGain = 12;
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < gains.length; i++) {
      const x = (i / (gains.length - 1)) * w;
      const y = h / 2 - (gains[i] / maxGain) * (h / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Dots
    for (let i = 0; i < gains.length; i++) {
      const x = (i / (gains.length - 1)) * w;
      const y = h / 2 - (gains[i] / maxGain) * (h / 2);
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawTimeRuler() {
    const ruler = document.getElementById('time-ruler');
    if (!ruler) return;
    const dur = this.totalDuration;
    if (dur === 0) { ruler.innerHTML = ''; return; }

    const w = ruler.clientWidth;
    let interval = 1;
    if (dur > 60) interval = 5;
    if (dur > 300) interval = 15;
    if (dur > 600) interval = 30;

    ruler.innerHTML = '';
    for (let t = 0; t <= dur; t += interval) {
      const x = (t / dur) * w;
      const tick = document.createElement('div');
      tick.className = 'ruler-tick';
      tick.style.left = x + 'px';
      tick.textContent = this.fmtTime(t);
      ruler.appendChild(tick);
    }
  }

  // ========== SELECTION ==========

  onTimelineMouseDown(e) {
    if (this.totalDuration === 0) return;
    const container = document.getElementById('track-canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));

    if (e.shiftKey) {
      this.selection.end = progress * this.totalDuration;
    } else {
      this.selection.start = progress * this.totalDuration;
      this.selection.end = this.selection.start;
      this.pauseTime = this.selection.start;
    }
    this.isSelecting = true;
    this.hasSelection = false;
    this.updatePlayhead();
    this.updateTimeDisplay();
  }

  onTimelineMouseMove(e) {
    if (!this.isSelecting || this.totalDuration === 0) return;
    const container = document.getElementById('track-canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const progress = x / rect.width;
    this.selection.end = progress * this.totalDuration;
    this.hasSelection = Math.abs(this.selection.end - this.selection.start) > 0.01;
    this.updateSelection();
    this.drawTrackCanvases();
  }

  onTimelineMouseUp() {
    this.isSelecting = false;
    if (this.selection.start > this.selection.end) {
      [this.selection.start, this.selection.end] = [this.selection.end, this.selection.start];
    }
  }

  updateSelection() {
    const overlay = document.getElementById('selection-overlay');
    const container = document.getElementById('track-canvas-container');
    if (!overlay || !container || this.totalDuration === 0) return;

    if (this.hasSelection) {
      const w = container.clientWidth;
      const sx = (this.selection.start / this.totalDuration) * w;
      const ex = (this.selection.end / this.totalDuration) * w;
      overlay.style.display = 'block';
      overlay.style.left = sx + 'px';
      overlay.style.width = (ex - sx) + 'px';
    } else {
      overlay.style.display = 'none';
    }
  }

  selectAll() {
    if (this.totalDuration === 0) return;
    this.selection.start = 0;
    this.selection.end = this.totalDuration;
    this.hasSelection = true;
    this.updateSelection();
    this.drawTrackCanvases();
  }

  // ========== EDIT OPERATIONS ==========

  cut() { this.copy(); this.deleteSelection(); }

  copy() {
    if (!this.hasSelection || !this.selectedTrack) return;
    const track = this.selectedTrack;
    const sr = track.buffer.sampleRate;
    const ss = Math.floor(this.selection.start * sr);
    const es = Math.floor(this.selection.end * sr);
    const len = es - ss;
    if (len <= 0) return;

    this.clipboard = this.ctx.createBuffer(track.buffer.numberOfChannels, len, sr);
    for (let ch = 0; ch < track.buffer.numberOfChannels; ch++) {
      const src = track.buffer.getChannelData(ch);
      const dst = this.clipboard.getChannelData(ch);
      for (let i = 0; i < len; i++) dst[i] = src[ss + i] || 0;
    }
    this.notify('Copied selection', 'info');
  }

  paste() {
    if (!this.clipboard || !this.selectedTrack) return;
    const track = this.selectedTrack;
    const sr = track.buffer.sampleRate;
    const insertPos = Math.floor(this.pauseTime * sr);
    const newLen = track.buffer.length + this.clipboard.length;
    const newBuf = this.ctx.createBuffer(track.buffer.numberOfChannels, newLen, sr);

    for (let ch = 0; ch < track.buffer.numberOfChannels; ch++) {
      const src = track.buffer.getChannelData(ch);
      const clip = this.clipboard.getChannelData(ch);
      const dst = newBuf.getChannelData(ch);
      for (let i = 0; i < insertPos; i++) dst[i] = src[i];
      for (let i = 0; i < this.clipboard.length; i++) dst[insertPos + i] = clip[i];
      for (let i = insertPos; i < track.buffer.length; i++) dst[this.clipboard.length + i] = src[i];
    }

    track.buffer = newBuf;
    this.saveHistory();
    this.renderTracks();
    this.drawTrackCanvases();
    this.updateTimeDisplay();
  }

  deleteSelection() {
    if (!this.hasSelection || !this.selectedTrack) return;
    const track = this.selectedTrack;
    const sr = track.buffer.sampleRate;
    const ss = Math.floor(this.selection.start * sr);
    const es = Math.floor(this.selection.end * sr);
    const newLen = track.buffer.length - (es - ss);
    if (newLen <= 0) return;

    const newBuf = this.ctx.createBuffer(track.buffer.numberOfChannels, newLen, sr);
    for (let ch = 0; ch < track.buffer.numberOfChannels; ch++) {
      const src = track.buffer.getChannelData(ch);
      const dst = newBuf.getChannelData(ch);
      let w = 0;
      for (let i = 0; i < track.buffer.length; i++) {
        if (i < ss || i >= es) dst[w++] = src[i];
      }
    }

    track.buffer = newBuf;
    this.hasSelection = false;
    this.saveHistory();
    this.renderTracks();
    this.drawTrackCanvases();
    this.updateTimeDisplay();
    this.updateSelection();
  }

  trimToSelection() {
    if (!this.hasSelection || !this.selectedTrack) return;
    const track = this.selectedTrack;
    const sr = track.buffer.sampleRate;
    const ss = Math.floor(this.selection.start * sr);
    const es = Math.floor(this.selection.end * sr);
    const len = es - ss;

    const newBuf = this.ctx.createBuffer(track.buffer.numberOfChannels, len, sr);
    for (let ch = 0; ch < track.buffer.numberOfChannels; ch++) {
      const src = track.buffer.getChannelData(ch);
      const dst = newBuf.getChannelData(ch);
      for (let i = 0; i < len; i++) dst[i] = src[ss + i] || 0;
    }

    track.buffer = newBuf;
    this.hasSelection = false;
    this.pauseTime = 0;
    this.saveHistory();
    this.renderTracks();
    this.drawTrackCanvases();
    this.updateTimeDisplay();
    this.updateSelection();
  }

  applyFade(dir) {
    if (!this.selectedTrack) return;
    const track = this.selectedTrack;
    const dur = 1.0;
    const sr = track.buffer.sampleRate;
    const fadeSamples = Math.floor(dur * sr);
    const ss = this.hasSelection ? Math.floor(this.selection.start * sr) : (dir === 'in' ? 0 : track.buffer.length - fadeSamples);

    for (let ch = 0; ch < track.buffer.numberOfChannels; ch++) {
      const data = track.buffer.getChannelData(ch);
      for (let i = 0; i < fadeSamples; i++) {
        const idx = dir === 'in' ? ss + i : ss + i;
        if (idx < 0 || idx >= data.length) continue;
        const gain = dir === 'in' ? i / fadeSamples : 1 - (i / fadeSamples);
        data[idx] *= gain;
      }
    }

    this.saveHistory();
    this.drawTrackCanvases();
    this.notify(`Fade ${dir} applied`, 'info');
  }

  normalize() {
    if (!this.selectedTrack) return;
    const track = this.selectedTrack;
    let maxPeak = 0;
    for (let ch = 0; ch < track.buffer.numberOfChannels; ch++) {
      const data = track.buffer.getChannelData(ch);
      for (let i = 0; i < data.length; i++) maxPeak = Math.max(maxPeak, Math.abs(data[i]));
    }
    if (maxPeak === 0) return;

    const gain = 0.95 / maxPeak;
    for (let ch = 0; ch < track.buffer.numberOfChannels; ch++) {
      const data = track.buffer.getChannelData(ch);
      for (let i = 0; i < data.length; i++) data[i] *= gain;
    }

    this.saveHistory();
    this.drawTrackCanvases();
    this.notify('Normalized', 'info');
  }

  addMarker() {
    this.markers.push({ time: this.pauseTime, label: `M${this.markers.length + 1}` });
    this.drawMarkers();
    this.notify(`Marker added at ${this.fmtTime(this.pauseTime, true)}`, 'info');
  }

  drawMarkers() {
    const container = document.getElementById('timeline-area');
    if (!container) return;
    container.querySelectorAll('.marker').forEach(m => m.remove());

    this.markers.forEach(m => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.dataset.label = m.label;
      const x = (m.time / this.totalDuration) * container.clientWidth;
      el.style.left = x + 'px';
      container.appendChild(el);
    });
  }

  // ========== HISTORY ==========

  saveHistory() {
    this.history = this.history.slice(0, this.historyIndex + 1);
    const snapshot = this.tracks.map(t => ({
      id: t.id, name: t.name, color: t.color,
      volume: t.volume, muted: t.muted, soloed: t.soloed,
      buffer: this.cloneBuffer(t.buffer)
    }));
    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) this.history.shift();
    this.historyIndex = this.history.length - 1;
  }

  cloneBuffer(buf) {
    const clone = this.ctx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      clone.copyToChannel(new Float32Array(buf.getChannelData(ch)), ch);
    }
    return clone;
  }

  undo() {
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    this.restoreHistory();
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return;
    this.historyIndex++;
    this.restoreHistory();
  }

  restoreHistory() {
    const snapshot = this.history[this.historyIndex];
    if (!snapshot) return;
    this.tracks = snapshot.map(s => {
      const t = new AudioTrack(s.id, s.name, s.buffer, this.ctx);
      t.color = s.color;
      t.volume = s.volume;
      t.muted = s.muted;
      t.soloed = s.soloed;
      return t;
    });
    this.selectedTrackId = this.tracks.length > 0 ? this.tracks[0].id : null;
    this.renderTracks();
    this.renderMixer();
    this.drawTrackCanvases();
    this.updateTimeDisplay();
  }

  // ========== EXPORT ==========

  async exportAudio() {
    if (this.tracks.length === 0) return;
    this.showModal('Exporting...');

    try {
      const duration = this.totalDuration;
      const sr = parseInt(document.getElementById('sample-rate')?.value || 44100);
      const offline = new OfflineAudioContext(2, Math.ceil(duration * sr), sr);

      const hasSolo = this.tracks.some(t => t.soloed);

      this.tracks.forEach(track => {
        if (hasSolo && !track.soloed) return;
        if (track.muted) return;
        const source = offline.createBufferSource();
        source.buffer = track.buffer;
        const gain = offline.createGain();
        gain.gain.value = track.volume;
        source.connect(gain);
        gain.connect(offline.destination);
        source.start();
      });

      const rendered = await offline.startRendering();
      const format = document.getElementById('export-format')?.value || 'wav';
      let blob;

      if (format === 'wav') {
        blob = this.toWav(rendered);
      } else {
        blob = await this.encodeMedia(rendered, format);
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      this.notify('Export complete', 'info');
    } catch (e) {
      console.error('Export error:', e);
      this.notify('Export failed: ' + e.message, 'error');
    }

    this.hideModal();
  }

  toWav(buffer) {
    const numCh = buffer.numberOfChannels;
    const sr = buffer.sampleRate;
    const bps = 16;
    const blockAlign = numCh * (bps / 8);
    const dataLen = buffer.length * blockAlign;
    const ab = new ArrayBuffer(44 + dataLen);
    const v = new DataView(ab);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };

    ws(0, 'RIFF'); v.setUint32(4, ab.byteLength - 8, true);
    ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, numCh, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * blockAlign, true);
    v.setUint16(32, blockAlign, true); v.setUint16(34, bps, true);
    ws(36, 'data'); v.setUint32(40, dataLen, true);

    const chs = [];
    for (let i = 0; i < numCh; i++) chs.push(buffer.getChannelData(i));
    let off = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numCh; ch++) {
        const s = Math.max(-1, Math.min(1, chs[ch][i]));
        v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        off += 2;
      }
    }
    return new Blob([ab], { type: 'audio/wav' });
  }

  async encodeMedia(buffer, format) {
    return new Promise((resolve, reject) => {
      const offline = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      const source = offline.createBufferSource();
      source.buffer = buffer;
      const dest = offline.createMediaStreamDestination();
      source.connect(dest);
      source.start();
      const mime = format === 'mp3' ? 'audio/webm' : `audio/${format}`;
      const rec = new MediaRecorder(dest.stream, { mimeType: mime });
      const chunks = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
      rec.onerror = e => reject(e);
      rec.start();
      offline.startRendering().then(() => setTimeout(() => rec.stop(), 100));
    });
  }

  // ========== ZOOM ==========

  setZoom(val) {
    this.zoom = Math.max(1, Math.min(20, val));
    const slider = document.getElementById('zoom-slider');
    if (slider) slider.value = this.zoom * 10;
    this.drawTrackCanvases();
  }

  // ========== KEYBOARD ==========

  onKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z': e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); break;
        case 'y': e.preventDefault(); this.redo(); break;
        case 'x': e.preventDefault(); this.cut(); break;
        case 'c': e.preventDefault(); this.copy(); break;
        case 'v': e.preventDefault(); this.paste(); break;
        case 'a': e.preventDefault(); this.selectAll(); break;
        case 's': e.preventDefault(); this.exportAudio(); break;
      }
    } else {
      switch (e.key) {
        case ' ': e.preventDefault(); this.togglePlay(); break;
        case 'Escape': this.stop(); break;
        case 'Delete': case 'Backspace': this.deleteSelection(); break;
        case 'Home': this.skipToStart(); break;
        case 'End': this.skipToEnd(); break;
        case 'l': this.toggleLoop(); break;
        case 'r': this.toggleRecord(); break;
        case 'm': this.addMarker(); break;
        case '=': case '+': this.setZoom(this.zoom * 1.3); break;
        case '-': this.setZoom(this.zoom / 1.3); break;
      }
    }
  }

  // ========== HELPERS ==========

  fmtTime(sec, ms = false) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    if (ms) {
      const ml = Math.floor((sec % 1) * 1000);
      return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ml).padStart(3,'0')}`;
    }
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  toDB(val) {
    if (val <= 0) return '-inf dB';
    const db = 20 * Math.log10(val);
    return db.toFixed(1) + ' dB';
  }

  esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  showModal(title) {
    const m = document.getElementById('processing-modal');
    const t = document.getElementById('processing-title');
    if (m) m.classList.add('show');
    if (t) t.textContent = title;
  }

  hideModal() {
    document.getElementById('processing-modal')?.classList.remove('show');
  }

  notify(msg, type = 'info') {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;top:80px;right:20px;z-index:10000;padding:12px 20px;border-radius:8px;font-size:14px;max-width:400px;animation:slideIn .3s ease;${type === 'error' ? 'background:rgba(239,68,68,.9);color:#fff' : 'background:rgba(6,182,212,.9);color:#fff'}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.animation = 'slideOut .3s ease'; setTimeout(() => el.remove(), 300); }, 3000);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.studio = new AudioStudio();
});
