/**
 * SBS Audio Studio - Professional Web-Based DAW
 * A comprehensive audio recording, editing, and processing application
 */

class AudioStudio {
    constructor() {
        this.audioContext = null;
        this.mediaRecorder = null;
        this.audioBuffer = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.analyser = null;

        // State
        this.isRecording = false;
        this.isPlaying = false;
        this.isTunerActive = false;
        this.isLooping = false;

        // Playback
        this.startTime = 0;
        this.pauseTime = 0;
        this.playbackRate = 1;

        // Selection
        this.selection = { start: 0, end: 0 };
        this.hasSelection = false;

        // Waveform
        this.waveformData = null;
        this.zoom = 1;
        this.scrollOffset = 0;

        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;

        // Clipboard
        this.clipboard = null;

        // Effects chain
        this.effects = {
            eq: null,
            compressor: null,
            reverb: null,
            delay: null
        };

        // Recording
        this.recordedChunks = [];
        this.recordingStartTime = 0;

        // DOM Elements
        this.canvas = null;
        this.ctx = null;

        this.init();
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;

            this.gainNode.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.setupEffectsChain();
            this.bindEvents();
            await this.populateInputDevices();
            this.initializeCanvas();

            console.log('Audio Studio initialized');
        } catch (error) {
            console.error('Failed to initialize Audio Studio:', error);
        }
    }

    setupEffectsChain() {
        // Create EQ bands
        this.effects.eq = {
            bands: [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000].map(freq => {
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'peaking';
                filter.frequency.value = freq;
                filter.Q.value = 1.5;
                filter.gain.value = 0;
                return filter;
            }),
            enabled: false
        };

        // Compressor
        this.effects.compressor = this.audioContext.createDynamicsCompressor();
        this.effects.compressor.threshold.value = -24;
        this.effects.compressor.ratio.value = 4;
        this.effects.compressor.attack.value = 0.01;
        this.effects.compressor.release.value = 0.25;

        // Delay
        this.effects.delay = {
            node: this.audioContext.createDelay(5.0),
            feedback: this.audioContext.createGain(),
            mix: this.audioContext.createGain(),
            enabled: false
        };
        this.effects.delay.node.delayTime.value = 0.25;
        this.effects.delay.feedback.gain.value = 0.3;
        this.effects.delay.mix.gain.value = 0.25;
    }

    async populateInputDevices() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(d => d.kind === 'audioinput');

            const select = document.getElementById('audio-input-select');
            if (select) {
                select.innerHTML = '<option value="">Select Microphone...</option>';
                audioInputs.forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.textContent = device.label || `Microphone ${select.options.length}`;
                    select.appendChild(option);
                });

                if (audioInputs.length > 0) {
                    select.value = audioInputs[0].deviceId;
                }
            }
        } catch (error) {
            console.error('Error accessing audio devices:', error);
        }
    }

    initializeCanvas() {
        this.canvas = document.getElementById('waveform-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = container.clientWidth * dpr;
        this.canvas.height = (container.clientHeight - 25) * dpr;
        this.canvas.style.width = container.clientWidth + 'px';
        this.canvas.style.height = (container.clientHeight - 25) + 'px';
        this.ctx.scale(dpr, dpr);
        if (this.audioBuffer) this.drawWaveform();
    }

    bindEvents() {
        // Source tabs
        document.querySelectorAll('.source-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchSourceTab(tab.dataset.source));
        });

        // Record button
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => this.toggleRecording());
        }

        // Upload zone
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('audio-file-input');
        if (uploadZone && fileInput) {
            uploadZone.addEventListener('click', () => fileInput.click());
            uploadZone.addEventListener('dragover', e => {
                e.preventDefault();
                uploadZone.classList.add('dragover');
            });
            uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
            uploadZone.addEventListener('drop', e => {
                e.preventDefault();
                uploadZone.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('audio/')) {
                    this.loadAudioFile(file);
                }
            });
            fileInput.addEventListener('change', e => {
                if (e.target.files[0]) this.loadAudioFile(e.target.files[0]);
            });
        }

        // Transport controls
        document.getElementById('play-btn')?.addEventListener('click', () => this.togglePlayback());
        document.getElementById('stop-btn')?.addEventListener('click', () => this.stop());
        document.getElementById('skip-start-btn')?.addEventListener('click', () => this.skipToStart());
        document.getElementById('skip-end-btn')?.addEventListener('click', () => this.skipToEnd());
        document.getElementById('loop-btn')?.addEventListener('click', () => this.toggleLoop());

        // Zoom controls
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out-btn')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-slider')?.addEventListener('input', e => {
            this.zoom = parseFloat(e.target.value) / 10;
            this.drawWaveform();
        });

        // Edit controls
        document.getElementById('cut-btn')?.addEventListener('click', () => this.cut());
        document.getElementById('copy-btn')?.addEventListener('click', () => this.copy());
        document.getElementById('paste-btn')?.addEventListener('click', () => this.paste());
        document.getElementById('delete-btn')?.addEventListener('click', () => this.deleteSelection());
        document.getElementById('undo-btn')?.addEventListener('click', () => this.undo());
        document.getElementById('redo-btn')?.addEventListener('click', () => this.redo());
        document.getElementById('select-all-btn')?.addEventListener('click', () => this.selectAll());
        document.getElementById('trim-btn')?.addEventListener('click', () => this.trimToSelection());
        document.getElementById('split-btn')?.addEventListener('click', () => this.split());

        // Master volume
        document.getElementById('master-volume')?.addEventListener('input', e => {
            const value = parseFloat(e.target.value) / 100;
            this.gainNode.gain.value = value;
            document.getElementById('volume-value').textContent = e.target.value;
        });

        // Effects toggles
        this.bindEffectControls();

        // Export
        document.getElementById('export-btn')?.addEventListener('click', () => this.exportAudio());
        document.getElementById('export-selection-btn')?.addEventListener('click', () => this.exportSelection());
        document.getElementById('export-format')?.addEventListener('change', e => {
            const mp3Group = document.getElementById('mp3-quality-group');
            if (mp3Group) mp3Group.style.display = e.target.value === 'mp3' ? 'block' : 'none';
        });

        // Tuner
        document.getElementById('tuner-toggle')?.addEventListener('click', () => this.toggleTuner());

        // Fade controls
        document.getElementById('fade-in-btn')?.addEventListener('click', () => this.applyFadeIn());
        document.getElementById('fade-out-btn')?.addEventListener('click', () => this.applyFadeOut());
        document.getElementById('fade-duration')?.addEventListener('input', e => {
            document.getElementById('fade-duration-val').textContent = (e.target.value / 1000).toFixed(1) + 's';
        });

        // Normalize
        document.getElementById('apply-normalize')?.addEventListener('click', () => this.normalize());
        document.getElementById('normalize-level')?.addEventListener('input', e => {
            document.getElementById('normalize-level-val').textContent = e.target.value + ' dB';
        });

        // Effect card toggles
        document.querySelectorAll('.effect-expand').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                btn.closest('.effect-card').classList.toggle('expanded');
            });
        });

        // Waveform interaction
        if (this.canvas) {
            this.canvas.addEventListener('mousedown', e => this.handleWaveformMouseDown(e));
            this.canvas.addEventListener('mousemove', e => this.handleWaveformMouseMove(e));
            this.canvas.addEventListener('mouseup', e => this.handleWaveformMouseUp(e));
            this.canvas.addEventListener('click', e => this.handleWaveformClick(e));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', e => this.handleKeyboard(e));
    }

    bindEffectControls() {
        // EQ sliders
        ['60', '170', '310', '600', '1k', '3k', '6k', '12k', '14k', '16k'].forEach((freq, i) => {
            const slider = document.getElementById(`eq-${freq}`);
            if (slider) {
                slider.addEventListener('input', e => {
                    if (this.effects.eq.bands[i]) {
                        this.effects.eq.bands[i].gain.value = parseFloat(e.target.value);
                    }
                });
            }
        });

        // Compressor controls
        const compControls = [
            { id: 'comp-threshold', param: 'threshold', suffix: ' dB' },
            { id: 'comp-ratio', param: 'ratio', suffix: ':1' },
            { id: 'comp-attack', param: 'attack', suffix: ' ms', scale: 0.001 },
            { id: 'comp-release', param: 'release', suffix: ' ms', scale: 0.001 }
        ];

        compControls.forEach(ctrl => {
            const el = document.getElementById(ctrl.id);
            if (el) {
                el.addEventListener('input', e => {
                    const value = parseFloat(e.target.value);
                    const scaledValue = ctrl.scale ? value * ctrl.scale : value;
                    if (this.effects.compressor[ctrl.param]) {
                        this.effects.compressor[ctrl.param].value = scaledValue;
                    }
                    const display = document.getElementById(`${ctrl.id}-val`);
                    if (display) display.textContent = value + ctrl.suffix;
                });
            }
        });

        // Delay controls
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

    switchSourceTab(source) {
        document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.source-panel').forEach(p => p.classList.remove('active'));
        document.querySelector(`[data-source="${source}"]`)?.classList.add('active');
        document.getElementById(`${source}-panel`)?.classList.add('active');
    }

    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        try {
            const deviceId = document.getElementById('audio-input-select')?.value;
            const constraints = {
                audio: deviceId ? { deviceId: { exact: deviceId } } : true
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Create analyser for input metering
            const inputSource = this.audioContext.createMediaStreamSource(stream);
            const inputAnalyser = this.audioContext.createAnalyser();
            inputAnalyser.fftSize = 256;
            inputSource.connect(inputAnalyser);

            // Start input level monitoring
            this.monitorInputLevel(inputAnalyser);

            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });

            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) this.recordedChunks.push(e.data);
            };

            this.mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType });
                await this.loadAudioBlob(blob);
            };

            this.mediaRecorder.start(100);
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            const recordBtn = document.getElementById('record-btn');
            if (recordBtn) recordBtn.classList.add('recording');

            this.updateRecordingTime();

        } catch (error) {
            console.error('Recording failed:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;

            const recordBtn = document.getElementById('record-btn');
            if (recordBtn) recordBtn.classList.remove('recording');
        }
    }

    monitorInputLevel(analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const meter = document.getElementById('input-meter');

        const update = () => {
            if (!this.isRecording) return;

            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const level = (average / 255) * 100;

            if (meter) meter.style.width = level + '%';

            requestAnimationFrame(update);
        };

        update();
    }

    updateRecordingTime() {
        const timeDisplay = document.getElementById('record-time');

        const update = () => {
            if (!this.isRecording) return;

            const elapsed = Date.now() - this.recordingStartTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);

            if (timeDisplay) {
                timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }

            requestAnimationFrame(update);
        };

        update();
    }

    async loadAudioFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.saveToHistory();
            this.showWaveform();
            this.drawWaveform();
            this.updateTimeDisplay();
        } catch (error) {
            console.error('Error loading audio file:', error);
            alert('Could not load audio file. Please try a different format.');
        }
    }

    async loadAudioBlob(blob) {
        const arrayBuffer = await blob.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.saveToHistory();
        this.showWaveform();
        this.drawWaveform();
        this.updateTimeDisplay();
    }

    showWaveform() {
        document.getElementById('waveform-placeholder')?.classList.add('hidden');
        document.getElementById('waveform-wrapper')?.classList.add('active');
    }

    drawWaveform() {
        if (!this.audioBuffer || !this.ctx) return;

        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        const data = this.audioBuffer.getChannelData(0);

        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#0a0a12';
        this.ctx.fillRect(0, 0, width, height);

        // Draw centerline
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, height / 2);
        this.ctx.lineTo(width, height / 2);
        this.ctx.stroke();

        // Draw waveform
        const samplesPerPixel = Math.floor(data.length / (width * this.zoom));
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#06b6d4');

        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();

        const visibleWidth = width * this.zoom;
        const startSample = Math.floor(this.scrollOffset * data.length);

        for (let x = 0; x < width; x++) {
            const sampleIndex = startSample + Math.floor(x * samplesPerPixel);

            // Find min/max in this pixel's range
            let min = 1, max = -1;
            for (let i = 0; i < samplesPerPixel && sampleIndex + i < data.length; i++) {
                const sample = data[sampleIndex + i];
                if (sample < min) min = sample;
                if (sample > max) max = sample;
            }

            const yMin = (1 - min) * height / 2;
            const yMax = (1 - max) * height / 2;

            if (x === 0) {
                this.ctx.moveTo(x, yMin);
            }
            this.ctx.lineTo(x, yMin);
            this.ctx.lineTo(x, yMax);
        }

        this.ctx.stroke();

        // Draw selection
        if (this.hasSelection) {
            const selStart = (this.selection.start / this.audioBuffer.duration) * width;
            const selEnd = (this.selection.end / this.audioBuffer.duration) * width;

            this.ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
            this.ctx.fillRect(selStart, 0, selEnd - selStart, height);

            this.ctx.strokeStyle = '#06b6d4';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(selStart, 0);
            this.ctx.lineTo(selStart, height);
            this.ctx.moveTo(selEnd, 0);
            this.ctx.lineTo(selEnd, height);
            this.ctx.stroke();
        }

        // Draw time ruler
        this.drawTimeRuler();
    }

    drawTimeRuler() {
        const ruler = document.getElementById('time-ruler');
        if (!ruler || !this.audioBuffer) return;

        const width = ruler.clientWidth;
        const duration = this.audioBuffer.duration;

        // Calculate tick interval
        let interval = 1; // seconds
        if (duration > 60) interval = 10;
        if (duration > 300) interval = 30;
        if (duration > 600) interval = 60;

        ruler.innerHTML = '';

        for (let t = 0; t < duration; t += interval) {
            const x = (t / duration) * width;
            const tick = document.createElement('div');
            tick.className = 'ruler-tick';
            tick.style.left = x + 'px';
            tick.textContent = this.formatTime(t);
            ruler.appendChild(tick);
        }
    }

    formatTime(seconds, includeMs = false) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);

        if (includeMs) {
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateTimeDisplay() {
        if (!this.audioBuffer) return;

        document.getElementById('current-time').textContent = this.formatTime(this.pauseTime, true);
        document.getElementById('total-time').textContent = this.formatTime(this.audioBuffer.duration, true);
    }

    togglePlayback() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (!this.audioBuffer) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.connect(this.gainNode);
        this.sourceNode.playbackRate.value = this.playbackRate;

        if (this.isLooping && this.hasSelection) {
            this.sourceNode.loop = true;
            this.sourceNode.loopStart = this.selection.start;
            this.sourceNode.loopEnd = this.selection.end;
        }

        const offset = this.pauseTime;
        this.startTime = this.audioContext.currentTime - offset;
        this.sourceNode.start(0, offset);

        this.sourceNode.onended = () => {
            if (!this.isLooping) {
                this.isPlaying = false;
                this.pauseTime = 0;
                this.updatePlayButton();
                this.updatePlayhead();
            }
        };

        this.isPlaying = true;
        this.updatePlayButton();
        this.animatePlayhead();
    }

    pause() {
        if (!this.isPlaying || !this.sourceNode) return;

        this.pauseTime = this.audioContext.currentTime - this.startTime;
        this.sourceNode.stop();
        this.sourceNode.disconnect();
        this.isPlaying = false;
        this.updatePlayButton();
    }

    stop() {
        if (this.sourceNode) {
            try { this.sourceNode.stop(); } catch (e) { }
            this.sourceNode.disconnect();
        }
        this.isPlaying = false;
        this.pauseTime = 0;
        this.updatePlayButton();
        this.updatePlayhead();
        this.updateTimeDisplay();
    }

    skipToStart() {
        this.pauseTime = 0;
        if (this.isPlaying) {
            this.sourceNode.stop();
            this.play();
        } else {
            this.updatePlayhead();
            this.updateTimeDisplay();
        }
    }

    skipToEnd() {
        if (!this.audioBuffer) return;
        this.pauseTime = this.audioBuffer.duration;
        if (this.isPlaying) {
            this.sourceNode.stop();
        }
        this.updatePlayhead();
        this.updateTimeDisplay();
    }

    toggleLoop() {
        this.isLooping = !this.isLooping;
        const btn = document.getElementById('loop-btn');
        if (btn) btn.classList.toggle('active', this.isLooping);
    }

    updatePlayButton() {
        const btn = document.getElementById('play-btn');
        if (btn) btn.classList.toggle('playing', this.isPlaying);
    }

    updatePlayhead() {
        if (!this.audioBuffer) return;

        const playhead = document.getElementById('playhead');
        const container = document.getElementById('waveform-wrapper');
        if (!playhead || !container) return;

        const progress = this.pauseTime / this.audioBuffer.duration;
        const x = progress * container.clientWidth;
        playhead.style.left = x + 'px';
    }

    animatePlayhead() {
        if (!this.isPlaying) return;

        const currentTime = this.audioContext.currentTime - this.startTime;
        this.pauseTime = currentTime;
        this.updatePlayhead();
        this.updateTimeDisplay();

        requestAnimationFrame(() => this.animatePlayhead());
    }

    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.5, 10);
        document.getElementById('zoom-slider').value = this.zoom * 10;
        this.drawWaveform();
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.5, 1);
        document.getElementById('zoom-slider').value = this.zoom * 10;
        this.drawWaveform();
    }

    // Selection handlers
    handleWaveformClick(e) {
        if (!this.audioBuffer) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = x / rect.width;

        this.pauseTime = progress * this.audioBuffer.duration;
        this.updatePlayhead();
        this.updateTimeDisplay();
    }

    handleWaveformMouseDown(e) {
        if (!this.audioBuffer) return;

        this.isSelecting = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = x / rect.width;

        this.selection.start = progress * this.audioBuffer.duration;
        this.selection.end = this.selection.start;
    }

    handleWaveformMouseMove(e) {
        if (!this.isSelecting || !this.audioBuffer) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const progress = x / rect.width;

        this.selection.end = progress * this.audioBuffer.duration;
        this.hasSelection = Math.abs(this.selection.end - this.selection.start) > 0.01;

        this.drawWaveform();
        this.updateSelectionInfo();
    }

    handleWaveformMouseUp() {
        this.isSelecting = false;

        // Ensure start < end
        if (this.selection.start > this.selection.end) {
            [this.selection.start, this.selection.end] = [this.selection.end, this.selection.start];
        }
    }

    updateSelectionInfo() {
        const info = document.getElementById('selection-info');
        if (!info) return;

        if (this.hasSelection) {
            info.style.display = 'flex';
            document.getElementById('selection-start').textContent = this.formatTime(this.selection.start, true);
            document.getElementById('selection-end').textContent = this.formatTime(this.selection.end, true);
            document.getElementById('selection-duration').textContent = (this.selection.end - this.selection.start).toFixed(3);
        } else {
            info.style.display = 'none';
        }
    }

    // Edit operations
    saveToHistory() {
        if (!this.audioBuffer) return;

        // Remove any redo states
        this.history = this.history.slice(0, this.historyIndex + 1);

        // Save current state
        const bufferCopy = this.copyBuffer(this.audioBuffer);
        this.history.push(bufferCopy);

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        this.historyIndex = this.history.length - 1;
    }

    copyBuffer(buffer) {
        const newBuffer = this.audioContext.createBuffer(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
        );

        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);
            newBuffer.copyToChannel(new Float32Array(data), channel);
        }

        return newBuffer;
    }

    undo() {
        if (this.historyIndex <= 0) return;

        this.historyIndex--;
        this.audioBuffer = this.copyBuffer(this.history[this.historyIndex]);
        this.drawWaveform();
        this.updateTimeDisplay();
    }

    redo() {
        if (this.historyIndex >= this.history.length - 1) return;

        this.historyIndex++;
        this.audioBuffer = this.copyBuffer(this.history[this.historyIndex]);
        this.drawWaveform();
        this.updateTimeDisplay();
    }

    selectAll() {
        if (!this.audioBuffer) return;

        this.selection.start = 0;
        this.selection.end = this.audioBuffer.duration;
        this.hasSelection = true;
        this.drawWaveform();
        this.updateSelectionInfo();
    }

    cut() {
        if (!this.hasSelection || !this.audioBuffer) return;

        this.copy();
        this.deleteSelection();
    }

    copy() {
        if (!this.hasSelection || !this.audioBuffer) return;

        const startSample = Math.floor(this.selection.start * this.audioBuffer.sampleRate);
        const endSample = Math.floor(this.selection.end * this.audioBuffer.sampleRate);
        const length = endSample - startSample;

        this.clipboard = this.audioContext.createBuffer(
            this.audioBuffer.numberOfChannels,
            length,
            this.audioBuffer.sampleRate
        );

        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
            const sourceData = this.audioBuffer.getChannelData(channel);
            const clipData = this.clipboard.getChannelData(channel);

            for (let i = 0; i < length; i++) {
                clipData[i] = sourceData[startSample + i];
            }
        }
    }

    paste() {
        if (!this.clipboard || !this.audioBuffer) return;

        const insertPosition = Math.floor(this.pauseTime * this.audioBuffer.sampleRate);
        const newLength = this.audioBuffer.length + this.clipboard.length;

        const newBuffer = this.audioContext.createBuffer(
            this.audioBuffer.numberOfChannels,
            newLength,
            this.audioBuffer.sampleRate
        );

        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
            const sourceData = this.audioBuffer.getChannelData(channel);
            const clipData = this.clipboard.getChannelData(channel);
            const newData = newBuffer.getChannelData(channel);

            // Copy before insert point
            for (let i = 0; i < insertPosition; i++) {
                newData[i] = sourceData[i];
            }

            // Insert clipboard
            for (let i = 0; i < this.clipboard.length; i++) {
                newData[insertPosition + i] = clipData[i];
            }

            // Copy after insert point
            for (let i = insertPosition; i < this.audioBuffer.length; i++) {
                newData[this.clipboard.length + i] = sourceData[i];
            }
        }

        this.audioBuffer = newBuffer;
        this.saveToHistory();
        this.drawWaveform();
        this.updateTimeDisplay();
    }

    deleteSelection() {
        if (!this.hasSelection || !this.audioBuffer) return;

        const startSample = Math.floor(this.selection.start * this.audioBuffer.sampleRate);
        const endSample = Math.floor(this.selection.end * this.audioBuffer.sampleRate);
        const newLength = this.audioBuffer.length - (endSample - startSample);

        const newBuffer = this.audioContext.createBuffer(
            this.audioBuffer.numberOfChannels,
            newLength,
            this.audioBuffer.sampleRate
        );

        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
            const sourceData = this.audioBuffer.getChannelData(channel);
            const newData = newBuffer.getChannelData(channel);

            let writePos = 0;
            for (let i = 0; i < this.audioBuffer.length; i++) {
                if (i < startSample || i >= endSample) {
                    newData[writePos++] = sourceData[i];
                }
            }
        }

        this.audioBuffer = newBuffer;
        this.hasSelection = false;
        this.saveToHistory();
        this.drawWaveform();
        this.updateTimeDisplay();
        this.updateSelectionInfo();
    }

    trimToSelection() {
        if (!this.hasSelection || !this.audioBuffer) return;

        const startSample = Math.floor(this.selection.start * this.audioBuffer.sampleRate);
        const endSample = Math.floor(this.selection.end * this.audioBuffer.sampleRate);
        const length = endSample - startSample;

        const newBuffer = this.audioContext.createBuffer(
            this.audioBuffer.numberOfChannels,
            length,
            this.audioBuffer.sampleRate
        );

        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
            const sourceData = this.audioBuffer.getChannelData(channel);
            const newData = newBuffer.getChannelData(channel);

            for (let i = 0; i < length; i++) {
                newData[i] = sourceData[startSample + i];
            }
        }

        this.audioBuffer = newBuffer;
        this.hasSelection = false;
        this.pauseTime = 0;
        this.saveToHistory();
        this.drawWaveform();
        this.updateTimeDisplay();
        this.updateSelectionInfo();
    }

    split() {
        // Split functionality - creates a visual marker
        // In a full DAW, this would create separate regions
        console.log('Split at', this.pauseTime);
    }

    // Effects
    applyFadeIn() {
        if (!this.audioBuffer) return;

        const duration = parseInt(document.getElementById('fade-duration')?.value || 1000) / 1000;
        const curve = document.getElementById('fade-curve')?.value || 'linear';

        const startSample = this.hasSelection ?
            Math.floor(this.selection.start * this.audioBuffer.sampleRate) : 0;
        const fadeSamples = Math.floor(duration * this.audioBuffer.sampleRate);

        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
            const data = this.audioBuffer.getChannelData(channel);

            for (let i = 0; i < fadeSamples && startSample + i < data.length; i++) {
                let gain = i / fadeSamples;

                if (curve === 'exponential') gain = Math.pow(gain, 2);
                else if (curve === 'logarithmic') gain = Math.sqrt(gain);
                else if (curve === 'scurve') gain = (1 - Math.cos(gain * Math.PI)) / 2;

                data[startSample + i] *= gain;
            }
        }

        this.saveToHistory();
        this.drawWaveform();
    }

    applyFadeOut() {
        if (!this.audioBuffer) return;

        const duration = parseInt(document.getElementById('fade-duration')?.value || 1000) / 1000;
        const curve = document.getElementById('fade-curve')?.value || 'linear';

        const endSample = this.hasSelection ?
            Math.floor(this.selection.end * this.audioBuffer.sampleRate) :
            this.audioBuffer.length;
        const fadeSamples = Math.floor(duration * this.audioBuffer.sampleRate);
        const startSample = endSample - fadeSamples;

        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
            const data = this.audioBuffer.getChannelData(channel);

            for (let i = 0; i < fadeSamples; i++) {
                let gain = 1 - (i / fadeSamples);

                if (curve === 'exponential') gain = Math.pow(gain, 2);
                else if (curve === 'logarithmic') gain = Math.sqrt(gain);
                else if (curve === 'scurve') gain = (1 + Math.cos((1 - gain) * Math.PI)) / 2;

                if (startSample + i >= 0) {
                    data[startSample + i] *= gain;
                }
            }
        }

        this.saveToHistory();
        this.drawWaveform();
    }

    normalize() {
        if (!this.audioBuffer) return;

        const targetDb = parseFloat(document.getElementById('normalize-level')?.value || -1);
        const targetGain = Math.pow(10, targetDb / 20);

        // Find peak
        let maxPeak = 0;
        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
            const data = this.audioBuffer.getChannelData(channel);
            for (let i = 0; i < data.length; i++) {
                maxPeak = Math.max(maxPeak, Math.abs(data[i]));
            }
        }

        if (maxPeak === 0) return;

        const gain = targetGain / maxPeak;

        // Apply gain
        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
            const data = this.audioBuffer.getChannelData(channel);
            for (let i = 0; i < data.length; i++) {
                data[i] *= gain;
            }
        }

        this.saveToHistory();
        this.drawWaveform();
    }

    // Tuner
    async toggleTuner() {
        if (this.isTunerActive) {
            this.stopTuner();
        } else {
            await this.startTuner();
        }
    }

    async startTuner() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(stream);
            const analyser = this.audioContext.createAnalyser();
            analyser.fftSize = 4096;
            source.connect(analyser);

            this.tunerStream = stream;
            this.tunerAnalyser = analyser;
            this.isTunerActive = true;

            document.getElementById('tuner-toggle').innerHTML = '<i data-lucide="radio"></i> Stop Tuner';
            lucide.createIcons();

            this.runTuner();
        } catch (error) {
            console.error('Tuner error:', error);
        }
    }

    stopTuner() {
        if (this.tunerStream) {
            this.tunerStream.getTracks().forEach(t => t.stop());
        }
        this.isTunerActive = false;

        document.getElementById('tuner-toggle').innerHTML = '<i data-lucide="radio"></i> Start Tuner';
        document.getElementById('tuner-note').textContent = '--';
        document.getElementById('tuner-freq').textContent = '-- Hz';
        document.getElementById('tuner-needle').style.left = '50%';
        lucide.createIcons();
    }

    runTuner() {
        if (!this.isTunerActive) return;

        const dataArray = new Float32Array(this.tunerAnalyser.fftSize);
        this.tunerAnalyser.getFloatTimeDomainData(dataArray);

        const frequency = this.autoCorrelate(dataArray, this.audioContext.sampleRate);

        if (frequency > 0) {
            const noteData = this.getNoteFromFrequency(frequency);
            document.getElementById('tuner-note').textContent = noteData.note;
            document.getElementById('tuner-freq').textContent = frequency.toFixed(1) + ' Hz';

            // Move needle based on cents
            const cents = noteData.cents;
            const needlePos = 50 + (cents / 50) * 45;
            document.getElementById('tuner-needle').style.left = needlePos + '%';
        }

        requestAnimationFrame(() => this.runTuner());
    }

    autoCorrelate(buffer, sampleRate) {
        let SIZE = buffer.length;
        let rms = 0;

        for (let i = 0; i < SIZE; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / SIZE);

        if (rms < 0.01) return -1;

        let r1 = 0, r2 = SIZE - 1;
        const threshold = 0.2;

        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buffer[i]) < threshold) { r1 = i; break; }
        }

        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buffer[SIZE - i]) < threshold) { r2 = SIZE - i; break; }
        }

        buffer = buffer.slice(r1, r2);
        SIZE = buffer.length;

        const c = new Array(SIZE).fill(0);

        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] += buffer[j] * buffer[j + i];
            }
        }

        let d = 0;
        while (c[d] > c[d + 1]) d++;

        let maxVal = -1, maxPos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxVal) {
                maxVal = c[i];
                maxPos = i;
            }
        }

        let T0 = maxPos;

        return sampleRate / T0;
    }

    getNoteFromFrequency(frequency) {
        const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        const noteIndex = Math.round(noteNum) + 69;
        const noteName = noteStrings[noteIndex % 12];
        const octave = Math.floor(noteIndex / 12) - 1;
        const cents = Math.round((noteNum - Math.round(noteNum)) * 100);

        return { note: noteName + octave, cents };
    }

    // Export
    async exportAudio() {
        if (!this.audioBuffer) return;

        const format = document.getElementById('export-format')?.value || 'wav';
        const sampleRate = parseInt(document.getElementById('sample-rate')?.value || 44100);

        this.showProcessingModal('Exporting audio...');

        try {
            let blob;

            if (format === 'wav') {
                blob = this.audioBufferToWav(this.audioBuffer);
            } else {
                // For other formats, use MediaRecorder
                blob = await this.encodeWithMediaRecorder(format);
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audio_export.${format === 'wav' ? 'wav' : format}`;
            a.click();
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed: ' + error.message);
        }

        this.hideProcessingModal();
    }

    exportSelection() {
        if (!this.hasSelection || !this.audioBuffer) {
            alert('Please make a selection first');
            return;
        }

        // Create a buffer with just the selection
        const startSample = Math.floor(this.selection.start * this.audioBuffer.sampleRate);
        const endSample = Math.floor(this.selection.end * this.audioBuffer.sampleRate);
        const length = endSample - startSample;

        const selectionBuffer = this.audioContext.createBuffer(
            this.audioBuffer.numberOfChannels,
            length,
            this.audioBuffer.sampleRate
        );

        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
            const sourceData = this.audioBuffer.getChannelData(channel);
            const newData = selectionBuffer.getChannelData(channel);

            for (let i = 0; i < length; i++) {
                newData[i] = sourceData[startSample + i];
            }
        }

        const blob = this.audioBufferToWav(selectionBuffer);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'selection.wav';
        a.click();
        URL.revokeObjectURL(url);
    }

    audioBufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        const dataLength = buffer.length * blockAlign;
        const bufferLength = 44 + dataLength;

        const arrayBuffer = new ArrayBuffer(bufferLength);
        const view = new DataView(arrayBuffer);

        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, bufferLength - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, dataLength, true);

        const channels = [];
        for (let i = 0; i < numChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, channels[channel][i]));
                const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset, intSample, true);
                offset += 2;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    async encodeWithMediaRecorder(format) {
        return new Promise((resolve, reject) => {
            const offlineCtx = new OfflineAudioContext(
                this.audioBuffer.numberOfChannels,
                this.audioBuffer.length,
                this.audioBuffer.sampleRate
            );

            const source = offlineCtx.createBufferSource();
            source.buffer = this.audioBuffer;

            const dest = offlineCtx.createMediaStreamDestination();
            source.connect(dest);
            source.start();

            const mimeType = format === 'mp3' ? 'audio/webm' : `audio/${format}`;
            const recorder = new MediaRecorder(dest.stream, { mimeType });
            const chunks = [];

            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
            recorder.onerror = e => reject(e);

            recorder.start();

            offlineCtx.startRendering().then(() => {
                setTimeout(() => recorder.stop(), 100);
            });
        });
    }

    showProcessingModal(title) {
        const modal = document.getElementById('processing-modal');
        const titleEl = document.getElementById('processing-title');
        if (modal) modal.classList.add('show');
        if (titleEl) titleEl.textContent = title;
    }

    hideProcessingModal() {
        const modal = document.getElementById('processing-modal');
        if (modal) modal.classList.remove('show');
    }

    // Keyboard shortcuts
    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

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
                case ' ': e.preventDefault(); this.togglePlayback(); break;
                case 'Delete': case 'Backspace': this.deleteSelection(); break;
                case 'Home': this.skipToStart(); break;
                case 'End': this.skipToEnd(); break;
                case 'l': this.toggleLoop(); break;
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.audioStudio = new AudioStudio();
});
