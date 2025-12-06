/**
 * MusicPlayer Class
 * Handles audio playback, state management, and logging for the music player.
 */
class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.state = {
            playlist: [],
            currentIndex: -1,
            isPlaying: false,
            repeatMode: 'off', // 'off', 'one', 'all', 'folder'
            shuffle: false,
            currentFolder: null,
            volume: 1.0,
            favorites: JSON.parse(localStorage.getItem('music_favorites')) || [],
            playlists: JSON.parse(localStorage.getItem('music_playlists')) || []
        };

        // Bind methods
        this.handleTrackEnd = this.handleTrackEnd.bind(this);
        this.handleError = this.handleError.bind(this);
        this.updateProgress = this.updateProgress.bind(this);

        // Initialize listeners
        if (this.audio) {
            this.audio.crossOrigin = 'anonymous'; // Enable CORS for Web Audio API
            this.audio.addEventListener('ended', this.handleTrackEnd);
            this.audio.addEventListener('error', this.handleError);
            this.audio.addEventListener('timeupdate', this.updateProgress);
            this.audio.addEventListener('play', () => this.updateState({ isPlaying: true }));
            this.audio.addEventListener('pause', () => this.updateState({ isPlaying: false }));
        }

        // Initialize Audio Context for Visualizer
        this.initAudioContext();

        this.log('MusicPlayer initialized - Version 3.1 (CORS Fix)');
    }

    toggleFavorite(track) {
        const index = this.state.favorites.findIndex(t => t.file === track.file);
        if (index === -1) {
            this.state.favorites.push(track);
            this.log(`Added to favorites: ${track.title}`);
        } else {
            this.state.favorites.splice(index, 1);
            this.log(`Removed from favorites: ${track.title}`);
        }
        localStorage.setItem('music_favorites', JSON.stringify(this.state.favorites));
        this.updateUI(this.state.playlist[this.state.currentIndex]);

        // Dispatch event for UI updates
        document.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: this.state.favorites }));
    }

    createPlaylist(name) {
        const playlist = { id: Date.now(), name, tracks: [] };
        this.state.playlists.push(playlist);
        localStorage.setItem('music_playlists', JSON.stringify(this.state.playlists));
        document.dispatchEvent(new CustomEvent('playlistsUpdated', { detail: this.state.playlists }));
    }

    addToPlaylist(playlistId, track) {
        const playlist = this.state.playlists.find(p => p.id === playlistId);
        if (playlist) {
            if (!playlist.tracks.some(t => t.file === track.file)) {
                playlist.tracks.push(track);
                localStorage.setItem('music_playlists', JSON.stringify(this.state.playlists));
                this.log(`Added ${track.title} to playlist ${playlist.name}`);
            }
        }
    }

    isFavorite(track) {
        return this.state.favorites.some(t => t.file === track.file);
    }


    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 256;

            // EQ State - 10 band equalizer
            this.eqBands = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
            this.filters = [];
            this.state.eqValues = JSON.parse(localStorage.getItem('music_eq_values')) || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            // Create Filters
            this.eqBands.forEach((freq, index) => {
                const filter = this.audioCtx.createBiquadFilter();
                filter.type = index === 0 ? 'lowshelf' : (index === this.eqBands.length - 1 ? 'highshelf' : 'peaking');
                filter.frequency.value = freq;
                filter.gain.value = this.state.eqValues[index];
                filter.Q.value = 1;
                this.filters.push(filter);
            });

            // Connect audio element to analyser
            if (this.audio) {
                if (!this.source) {
                    this.source = this.audioCtx.createMediaElementSource(this.audio);

                    // Chain: Source -> Filters -> Analyser -> Destination
                    let currentNode = this.source;
                    this.filters.forEach(filter => {
                        currentNode.connect(filter);
                        currentNode = filter;
                    });
                    currentNode.connect(this.analyser);
                    this.analyser.connect(this.audioCtx.destination);
                }
            }
        } catch (e) {
            this.error('Failed to initialize AudioContext', e);
        }
    }

    setEqualizer(bandIndex, value) {
        if (!this.audioCtx || !this.filters[bandIndex]) return;

        const val = parseFloat(value);
        this.filters[bandIndex].gain.value = val;
        this.state.eqValues[bandIndex] = val;

        // Update dB display
        const dbDisplay = document.getElementById(`db-${bandIndex}`);
        if (dbDisplay) {
            dbDisplay.textContent = `${val > 0 ? '+' : ''}${val}dB`;
            dbDisplay.className = 'db-value ' + (val > 0 ? 'positive' : (val < 0 ? 'negative' : ''));
        }

        // Save to local storage
        localStorage.setItem('music_eq_values', JSON.stringify(this.state.eqValues));
    }

    applyPreset(presetName) {
        // 10-band presets: 31Hz, 63Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz
        const presets = {
            'flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            'bass-boost': [8, 7, 6, 4, 2, 0, 0, 0, 0, 0],
            'bass-reduce': [-6, -5, -4, -3, -1, 0, 0, 0, 0, 0],
            'treble-boost': [0, 0, 0, 0, 0, 0, 2, 4, 6, 8],
            'rock': [5, 4, 3, -2, -3, 0, 2, 4, 5, 6],
            'pop': [2, 3, 4, 2, 0, -2, -1, 2, 3, 4],
            'jazz': [4, 3, 2, -2, -2, 0, 2, 3, 4, 5],
            'classical': [5, 4, 2, -2, -2, -2, 0, 2, 3, 5],
            'electronic': [8, 7, 5, 2, -1, -2, 2, 4, 6, 7],
            'custom': this.state.eqValues
        };

        const values = presets[presetName] || presets['flat'];

        values.forEach((val, index) => {
            this.setEqualizer(index, val);
            // Update UI slider if exists
            const slider = document.querySelector(`input[data-band="${this.eqBands[index]}"]`);
            if (slider) slider.value = val;
        });

        this.log(`Applied EQ preset: ${presetName}`);
    }

    saveCustomPreset() {
        localStorage.setItem('music_eq_custom', JSON.stringify(this.state.eqValues));
        this.log('Custom preset saved');
        // Show feedback
        const btn = document.querySelector('.btn-save');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✓ Saved!';
            btn.style.background = '#10b981';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 1500);
        }
    }

    resetEq() {
        this.applyPreset('flat');
        document.getElementById('eq-preset').value = 'flat';
    }

    setVolume(value) {
        // Value between 0 and 1
        this.state.volume = Math.max(0, Math.min(1, value));
        if (this.audio) {
            this.audio.volume = this.state.volume;
        }
        this.updateVolumeUI();
    }

    updateVolumeUI() {
        const volumeFill = document.querySelector('.volume-fill');
        if (volumeFill) {
            volumeFill.style.width = `${this.state.volume * 100}%`;
        }
    }


    /**
     * Load the music library from the manifest
     * 
     * ROLLBACK: To revert to CDN-only loading, set USE_JSDELIVR_FALLBACK to false
     */
    async loadLibrary() {
        // === ROLLBACK CONFIG ===
        // Set to false to disable jsDelivr fallback and use only GitHub Pages CDN
        const USE_JSDELIVR_FALLBACK = true;
        // jsDelivr CDN mirrors GitHub repos with proper CORS support
        const JSDELIVR_URL = 'https://cdn.jsdelivr.net/gh/Shuvam-Banerji-Seal/Shuvam-Banerji-Seal.github.io@gh-pages/music-library.json';
        const EXPECTED_MIN_TRACKS = 100; // If CDN returns fewer, it's likely stale
        // === END ROLLBACK CONFIG ===

        try {
            this.log('Loading music library...');
            const cacheBuster = `?v=${Date.now()}`;

            let data = null;

            // Try GitHub Pages CDN first (faster when working)
            try {
                const fetchOptions = { cache: 'no-store' };
                let response = await fetch(`../music-library.json${cacheBuster}`, fetchOptions);
                if (!response.ok) {
                    response = await fetch(`/music-library.json${cacheBuster}`, fetchOptions);
                }
                if (response.ok) {
                    data = await response.json();
                    this.log(`GitHub Pages CDN returned: ${data.length} tracks`);

                    // Check if CDN data looks stale
                    if (USE_JSDELIVR_FALLBACK && data.length < EXPECTED_MIN_TRACKS) {
                        this.log(`CDN returned only ${data.length} tracks (expected ${EXPECTED_MIN_TRACKS}+). Trying jsDelivr...`);
                        data = null; // Force fallback
                    }
                }
            } catch (e) {
                this.log('GitHub Pages CDN fetch failed, trying jsDelivr...');
            }

            // Fallback to jsDelivr CDN if GitHub Pages failed or returned stale data
            if (!data && USE_JSDELIVR_FALLBACK) {
                try {
                    this.log('Fetching from jsDelivr CDN...');
                    // jsDelivr has proper CORS, use simple fetch without custom headers
                    const response = await fetch(`${JSDELIVR_URL}${cacheBuster}`);
                    if (response.ok) {
                        data = await response.json();
                        this.log(`jsDelivr CDN returned: ${data.length} tracks`);
                    }
                } catch (e) {
                    this.error('jsDelivr fetch also failed', e);
                }
            }

            if (!data || data.length === 0) {
                throw new Error('Failed to load music library from any source');
            }

            this.state.playlist = data;
            this.log(`Library loaded: ${data.length} tracks`);

            // Expose globally for UI rendering
            window.musicLibrary = data;

            // Trigger UI update event
            document.dispatchEvent(new CustomEvent('libraryLoaded', { detail: data }));

            return data;
        } catch (error) {
            this.error('Failed to load library', error);
            return [];
        }
    }

    /**
     * Play a track by its global index
     * @param {number} index 
     */
    async playTrack(index) {
        if (index < 0 || index >= this.state.playlist.length) {
            this.error(`Invalid track index: ${index}`);
            return;
        }

        const track = this.state.playlist[index];
        this.state.currentIndex = index;
        this.state.currentFolder = track.folder;

        this.log(`Preparing to play: ${track.title} (${track.artist})`);

        // Determine URL (Production vs Local)
        // We use the CDN URL if we are on GitHub Pages OR if we are testing locally but want to verify CDN links
        const isProduction = window.location.hostname.includes('github.io') || window.location.hostname.includes('shuvam-banerji-seal.github.io');
        let src = track.file;

        if (isProduction) {
            if (track.cdnUrl) {
                src = track.cdnUrl;
                this.log(`Using CDN URL (Production): ${src}`);
            } else {
                this.error('CDN URL missing for track in production mode. Attempting to construct fallback...');
                // Fallback: Construct CDN URL dynamically
                // Base: https://media.githubusercontent.com/media/Shuvam-Banerji-Seal/assets_for_my_website/main
                // File path: /assets_for_my_website/Music/...

                // Remove /assets_for_my_website prefix
                const relativePath = track.file.replace(/^\/assets_for_my_website\//, '');
                // Split and encode each segment
                const encodedPath = relativePath.split('/').map(segment => encodeURIComponent(segment)).join('/');

                src = `https://media.githubusercontent.com/media/Shuvam-Banerji-Seal/assets_for_my_website/main/${encodedPath}`;
                this.log(`Generated Fallback CDN URL: ${src}`);
            }
        } else {
            // Use encodeURI to handle spaces but preserve special chars like &, +, ,
            // which might be valid in the path and over-encoded by encodeURIComponent
            src = encodeURI(track.file);
            this.log(`Using local path (Dev): ${src}`);
        }

        this.audio.src = src;
        this.audio.load();

        try {
            await this.audio.play();
            this.updateState({ isPlaying: true });
            this.updateUI(track);
            this.log(`Playback started: ${track.title}`);
        } catch (e) {
            this.error(`Playback failed for ${track.title}`, e);
            // Auto-skip on error if not user initiated pause? 
            // Maybe wait a bit and try next
        }
    }

    togglePlayPause() {
        if (this.state.currentIndex === -1) {
            // If nothing playing, play first track or random
            this.playTrack(0);
            return;
        }

        if (this.audio.paused) {
            this.audio.play().catch(e => this.error('Play error', e));
        } else {
            this.audio.pause();
        }
    }

    next() {
        if (this.state.shuffle) {
            this.playRandom();
        } else {
            let nextIndex = this.state.currentIndex + 1;
            if (nextIndex >= this.state.playlist.length) {
                if (this.state.repeatMode === 'all') {
                    nextIndex = 0;
                } else {
                    return; // Stop at end
                }
            }
            this.playTrack(nextIndex);
        }
    }

    previous() {
        // If played more than 3 seconds, restart track
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        let prevIndex = this.state.currentIndex - 1;
        if (prevIndex < 0) {
            prevIndex = this.state.playlist.length - 1;
        }
        this.playTrack(prevIndex);
    }

    playRandom() {
        const index = Math.floor(Math.random() * this.state.playlist.length);
        this.playTrack(index);
    }

    toggleShuffle() {
        this.state.shuffle = !this.state.shuffle;
        this.updateControlsUI();
        this.log(`Shuffle: ${this.state.shuffle}`);

        // Update tooltip and trigger pulse animation
        const btn = document.getElementById('shuffle-btn');
        if (btn) {
            btn.setAttribute('data-tooltip', `Shuffle: ${this.state.shuffle ? 'On' : 'Off'}`);
            btn.classList.add('pulse');
            setTimeout(() => btn.classList.remove('pulse'), 400);
        }
    }

    toggleRepeat() {
        const modes = ['off', 'one', 'all', 'folder'];
        const modeLabels = { off: 'Off', one: 'One', all: 'All', folder: 'Folder' };
        const idx = modes.indexOf(this.state.repeatMode);
        this.state.repeatMode = modes[(idx + 1) % modes.length];
        this.updateControlsUI();
        this.log(`Repeat mode: ${this.state.repeatMode}`);

        // Update tooltip and trigger pulse animation
        const btn = document.getElementById('repeat-btn');
        if (btn) {
            btn.setAttribute('data-tooltip', `Repeat: ${modeLabels[this.state.repeatMode]}`);
            btn.classList.add('pulse');
            setTimeout(() => btn.classList.remove('pulse'), 400);
        }
    }

    handleTrackEnd() {
        this.log('Track ended');
        if (this.state.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.audio.play();
        } else if (this.state.repeatMode === 'folder') {
            this.playNextInFolder();
        } else {
            this.next();
        }
    }

    playNextInFolder() {
        // Find next track in same folder
        let nextIndex = -1;
        for (let i = this.state.currentIndex + 1; i < this.state.playlist.length; i++) {
            if (this.state.playlist[i].folder === this.state.currentFolder) {
                nextIndex = i;
                break;
            }
        }

        if (nextIndex !== -1) {
            this.playTrack(nextIndex);
        } else {
            // Loop back to start of folder?
            const firstInFolder = this.state.playlist.findIndex(t => t.folder === this.state.currentFolder);
            if (firstInFolder !== -1) {
                this.playTrack(firstInFolder);
            }
        }
    }

    handleError(e) {
        const error = this.audio.error;
        let msg = 'Unknown error';
        if (error) {
            switch (error.code) {
                case 1: msg = 'Aborted'; break;
                case 2: msg = 'Network error'; break;
                case 3: msg = 'Decode error'; break;
                case 4: msg = 'Source not supported'; break;
            }
        }
        this.error(`Media Error: ${msg}`, error);

        // Update UI to show error
        const titleEl = document.getElementById('current-track-title');
        if (titleEl) titleEl.textContent = `Error: ${msg}`;
    }

    updateProgress() {
        const current = this.audio.currentTime;
        const duration = this.audio.duration || 0;

        // Update time labels
        const curTimeEl = document.getElementById('current-time');
        const totTimeEl = document.getElementById('total-time');
        const fillEl = document.getElementById('progress-fill');

        if (curTimeEl) curTimeEl.textContent = this.formatTime(current);
        if (totTimeEl) totTimeEl.textContent = this.formatTime(duration);

        if (fillEl) {
            const percent = (current / duration) * 100;
            fillEl.style.width = `${percent}%`;
        }
    }

    seek(percent) {
        if (this.audio.duration) {
            this.audio.currentTime = percent * this.audio.duration;
        }
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    updateState(updates) {
        Object.assign(this.state, updates);
        this.updateControlsUI();
    }

    updateUI(track) {
        // Update Now Playing Info
        document.getElementById('current-track-title').textContent = track.title;
        document.getElementById('current-track-artist').textContent = track.artist;

        // Update Favorite Icon
        const heartBtn = document.getElementById('favorite-btn');
        if (heartBtn) {
            const isFav = this.isFavorite(track);
            // Lucide replaces <i> with <svg>, so we need to check for both
            const icon = heartBtn.querySelector('svg') || heartBtn.querySelector('i');
            if (icon) {
                if (isFav) {
                    icon.setAttribute('fill', '#1db954');
                    icon.setAttribute('stroke', '#1db954');
                } else {
                    icon.setAttribute('fill', 'none');
                    icon.setAttribute('stroke', 'currentColor');
                }
            }
        }

        // Update Active Track in List
        document.querySelectorAll('.song-card').forEach(card => {
            card.classList.remove('playing');
        });
        // This assumes we can find the card by some ID or index. 
        // We might need to add IDs to the cards in the HTML generation.
    }

    updateControlsUI() {
        // Play/Pause Icon
        const playBtn = document.querySelector('.play-pause-btn');
        if (playBtn) {
            // Re-create the element to ensure Lucide picks it up
            const iconName = this.state.isPlaying ? 'pause' : 'play';
            playBtn.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5" id="play-pause-icon" style="color: #000;"></i>`;
        }

        // Shuffle Button
        const shuffleBtn = document.getElementById('shuffle-btn');
        if (shuffleBtn) {
            shuffleBtn.classList.toggle('active', this.state.shuffle);
        }

        // Repeat Button
        const repeatBtn = document.getElementById('repeat-btn');
        if (repeatBtn) {
            repeatBtn.classList.toggle('active', this.state.repeatMode !== 'off');
            // Optionally update icon based on mode
        }

        // Re-render icons
        if (window.lucide) window.lucide.createIcons();
    }

    log(msg) {
        console.log(`[MusicPlayer] ${msg}`);
    }

    error(msg, err) {
        console.error(`[MusicPlayer] ${msg}`, err);
    }
}

// Initialize
window.musicPlayer = new MusicPlayer();

// Expose global functions for HTML onclick handlers (backward compatibility)
window.playTrackByIndex = (index) => window.musicPlayer.playTrack(index);
window.togglePlayPause = () => window.musicPlayer.togglePlayPause();
window.nextTrack = () => window.musicPlayer.next();
window.previousTrack = () => window.musicPlayer.previous();
window.toggleShuffle = () => window.musicPlayer.toggleShuffle();
window.toggleRepeat = () => window.musicPlayer.toggleRepeat();
window.toggleFavorite = () => {
    const track = window.musicPlayer.state.playlist[window.musicPlayer.state.currentIndex];
    if (track) {
        window.musicPlayer.toggleFavorite(track);
    }
};
window.seekTrack = (event) => {
    const progressBar = event.currentTarget;
    const percent = event.offsetX / progressBar.offsetWidth;
    window.musicPlayer.seek(percent);
};
window.setVolume = (event) => {
    const slider = event.currentTarget;
    const rect = slider.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const volume = x / width;
    window.musicPlayer.setVolume(volume);
};
window.updateEqBand = (index, value) => {
    window.musicPlayer.setEqualizer(index, value);
};
window.applyEqPreset = (preset) => {
    window.musicPlayer.applyPreset(preset);
};
window.resetEq = () => {
    window.musicPlayer.resetEq();
};
window.saveCustomPreset = () => {
    window.musicPlayer.saveCustomPreset();
};
window.openEqModal = () => {
    document.getElementById('eq-modal').style.display = 'block';
    // Sync sliders and dB displays with current state
    const values = window.musicPlayer.state.eqValues;
    const bands = window.musicPlayer.eqBands;
    values.forEach((val, index) => {
        const slider = document.querySelector(`input[data-band="${bands[index]}"]`);
        if (slider) slider.value = val;
        // Update dB display
        const dbDisplay = document.getElementById(`db-${index}`);
        if (dbDisplay) {
            dbDisplay.textContent = `${val > 0 ? '+' : ''}${val}dB`;
            dbDisplay.className = 'db-value ' + (val > 0 ? 'positive' : (val < 0 ? 'negative' : ''));
        }
    });
};
window.closeEqModal = () => {
    document.getElementById('eq-modal').style.display = 'none';
};

// Start loading when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.musicPlayer.loadLibrary();

    // Resume AudioContext on first interaction
    document.body.addEventListener('click', () => {
        if (window.musicPlayer.audioCtx && window.musicPlayer.audioCtx.state === 'suspended') {
            window.musicPlayer.audioCtx.resume();
        }
    }, { once: true });

    // Start visualizer loop
    function drawVisualizer() {
        requestAnimationFrame(drawVisualizer);

        if (!window.musicPlayer.analyser) return;

        const canvas = document.getElementById('visualizer');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const bufferLength = window.musicPlayer.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        window.musicPlayer.analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#121212'; // Background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;

            // Gradient fill
            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, '#1db954');
            gradient.addColorStop(1, '#1ed760');

            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }

        // Update Stats
        const modal = document.getElementById('stats-modal');
        if (modal && modal.style.display !== 'none' && window.musicPlayer.audioCtx) {
            document.getElementById('stat-ctx').textContent = window.musicPlayer.audioCtx.state;
            document.getElementById('stat-sr').textContent = window.musicPlayer.audioCtx.sampleRate;
            document.getElementById('stat-ch').textContent = window.musicPlayer.analyser.channelCount;
            document.getElementById('stat-buf').textContent = window.musicPlayer.analyser.fftSize;
            document.getElementById('stat-time').textContent = window.musicPlayer.audio.currentTime.toFixed(3);
            document.getElementById('stat-vol').textContent = Math.round(window.musicPlayer.audio.volume * 100) + '%';
            document.getElementById('stat-src').textContent = window.musicPlayer.audio.src;
        }
    }

    drawVisualizer();
});

// ============================================
// PERSONAL PLAYLISTS (localStorage)
// ============================================

const PlaylistManager = {
    STORAGE_KEY: 'music_user_playlists',
    STATS_KEY: 'music_listening_stats',

    // Get all playlists from localStorage
    getPlaylists() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    },

    // Save playlists to localStorage
    savePlaylists(playlists) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(playlists));
        this.renderPlaylists();
    },

    // Create a new playlist
    create(name) {
        if (!name || name.trim() === '') return null;
        const playlists = this.getPlaylists();
        const newPlaylist = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            name: name.trim(),
            created: Date.now(),
            tracks: []
        };
        playlists.push(newPlaylist);
        this.savePlaylists(playlists);
        return newPlaylist;
    },

    // Delete a playlist
    delete(playlistId) {
        let playlists = this.getPlaylists();
        playlists = playlists.filter(p => p.id !== playlistId);
        this.savePlaylists(playlists);
    },

    // Add a track to a playlist
    addTrack(playlistId, track) {
        const playlists = this.getPlaylists();
        const playlist = playlists.find(p => p.id === playlistId);
        if (playlist) {
            // Check if track already exists
            const exists = playlist.tracks.some(t =>
                t.file === track.file && t.folder === track.folder
            );
            if (!exists) {
                playlist.tracks.push({
                    title: track.title,
                    artist: track.artist || 'Unknown Artist',
                    folder: track.folder,
                    file: track.file,
                    cdnUrl: track.cdnUrl
                });
                this.savePlaylists(playlists);
                return true;
            }
        }
        return false;
    },

    // Remove a track from a playlist
    removeTrack(playlistId, trackIndex) {
        const playlists = this.getPlaylists();
        const playlist = playlists.find(p => p.id === playlistId);
        if (playlist && playlist.tracks[trackIndex]) {
            playlist.tracks.splice(trackIndex, 1);
            this.savePlaylists(playlists);
        }
    },

    // Play a playlist
    play(playlistId) {
        const playlists = this.getPlaylists();
        const playlist = playlists.find(p => p.id === playlistId);
        if (playlist && playlist.tracks.length > 0) {
            // Set the playlist tracks as the current playlist
            window.musicPlayer.state.playlist = playlist.tracks.map((track, idx) => ({
                ...track,
                $index: idx
            }));
            window.musicPlayer.playTrack(0);
            closeProfileModal();
        }
    },

    // Render playlists in the UI
    renderPlaylists() {
        const container = document.getElementById('user-playlists');
        if (!container) return;

        const playlists = this.getPlaylists();

        if (playlists.length === 0) {
            container.innerHTML = '<div class="empty-playlists">No playlists yet. Create one above!</div>';
            return;
        }

        container.innerHTML = playlists.map(playlist => `
            <div class="playlist-item" onclick="PlaylistManager.play('${playlist.id}')">
                <div class="playlist-item-info">
                    <div class="playlist-item-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                    <div class="playlist-item-details">
                        <span class="playlist-item-name">${playlist.name}</span>
                        <span class="playlist-item-count">${playlist.tracks.length} tracks</span>
                    </div>
                </div>
                <div class="playlist-item-actions">
                    <button class="playlist-action-btn delete" onclick="event.stopPropagation(); PlaylistManager.delete('${playlist.id}')" title="Delete Playlist">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Get and update listening stats
    getStats() {
        return JSON.parse(localStorage.getItem(this.STATS_KEY)) || { tracksPlayed: 0, totalSeconds: 0 };
    },

    incrementTrackPlayed() {
        const stats = this.getStats();
        stats.tracksPlayed++;
        localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    },

    addListeningTime(seconds) {
        const stats = this.getStats();
        stats.totalSeconds += seconds;
        localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    },

    renderStats() {
        const stats = this.getStats();
        const tracksEl = document.getElementById('stat-tracks-played');
        const timeEl = document.getElementById('stat-total-time');

        if (tracksEl) tracksEl.textContent = stats.tracksPlayed;
        if (timeEl) {
            const mins = Math.floor(stats.totalSeconds / 60);
            const hours = Math.floor(mins / 60);
            if (hours > 0) {
                timeEl.textContent = `${hours}h ${mins % 60}m`;
            } else {
                timeEl.textContent = `${mins}m`;
            }
        }
    }
};

// Global functions for playlist management
window.openProfileModal = () => {
    document.getElementById('profile-modal').style.display = 'block';
    PlaylistManager.renderPlaylists();
    PlaylistManager.renderStats();
    lucide.createIcons();
};

window.closeProfileModal = () => {
    document.getElementById('profile-modal').style.display = 'none';
};

window.createPlaylist = () => {
    const input = document.getElementById('new-playlist-name');
    const name = input.value.trim();
    if (name) {
        PlaylistManager.create(name);
        input.value = '';
        lucide.createIcons();
    }
};

// Track when song plays to update stats
const originalPlayTrack = window.musicPlayer?.playTrack?.bind(window.musicPlayer);
if (originalPlayTrack) {
    window.musicPlayer.playTrack = function (index) {
        PlaylistManager.incrementTrackPlayed();
        return originalPlayTrack(index);
    };
}

// Make PlaylistManager globally accessible
window.PlaylistManager = PlaylistManager;

// Add to Playlist Modal functions
window.currentTrackToAdd = null;

window.showAddToPlaylistModal = (trackIndex) => {
    const track = window.musicPlayer?.state?.playlist?.[trackIndex];
    if (!track) return;

    window.currentTrackToAdd = track;
    const modal = document.getElementById('add-to-playlist-modal');
    const list = document.getElementById('playlist-select-list');

    const playlists = PlaylistManager.getPlaylists();
    if (playlists.length === 0) {
        list.innerHTML = '<div class="empty-playlists">No playlists. Create one first!</div>';
    } else {
        list.innerHTML = playlists.map(p => `
            <div class="playlist-select-item" onclick="addCurrentTrackToPlaylist('${p.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                <span>${p.name} (${p.tracks.length} tracks)</span>
            </div>
        `).join('');
    }

    modal.style.display = 'block';
};

window.closeAddToPlaylistModal = () => {
    document.getElementById('add-to-playlist-modal').style.display = 'none';
    window.currentTrackToAdd = null;
};

window.addCurrentTrackToPlaylist = (playlistId) => {
    if (window.currentTrackToAdd) {
        const added = PlaylistManager.addTrack(playlistId, window.currentTrackToAdd);
        if (added) {
            alert('Track added to playlist!');
        } else {
            alert('Track already in playlist.');
        }
    }
    closeAddToPlaylistModal();
};
