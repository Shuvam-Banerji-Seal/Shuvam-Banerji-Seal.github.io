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
            this.audio.addEventListener('ended', this.handleTrackEnd);
            this.audio.addEventListener('error', this.handleError);
            this.audio.addEventListener('timeupdate', this.updateProgress);
            this.audio.addEventListener('play', () => this.updateState({ isPlaying: true }));
            this.audio.addEventListener('pause', () => this.updateState({ isPlaying: false }));
        }

        // Initialize Audio Context for Visualizer
        this.initAudioContext();

        this.log('MusicPlayer initialized');
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

            // Create Equalizer Bands
            this.bassFilter = this.audioCtx.createBiquadFilter();
            this.bassFilter.type = 'lowshelf';
            this.bassFilter.frequency.value = 200;

            this.midFilter = this.audioCtx.createBiquadFilter();
            this.midFilter.type = 'peaking';
            this.midFilter.frequency.value = 1000;
            this.midFilter.Q.value = 1;

            this.trebleFilter = this.audioCtx.createBiquadFilter();
            this.trebleFilter.type = 'highshelf';
            this.trebleFilter.frequency.value = 3000;

            // Connect audio element to analyser
            // Note: This requires CORS to be handled correctly for cross-origin audio
            if (this.audio) {
                // Check if source already exists to avoid errors on re-init
                if (!this.source) {
                    this.source = this.audioCtx.createMediaElementSource(this.audio);
                    // Chain: Source -> Bass -> Mid -> Treble -> Analyser -> Destination
                    this.source.connect(this.bassFilter);
                    this.bassFilter.connect(this.midFilter);
                    this.midFilter.connect(this.trebleFilter);
                    this.trebleFilter.connect(this.analyser);
                    this.analyser.connect(this.audioCtx.destination);
                }
            }
        } catch (e) {
            this.error('Failed to initialize AudioContext', e);
        }
    }

    setEqualizer(band, value) {
        // Value in dB (-10 to 10)
        if (!this.audioCtx) return;
        switch (band) {
            case 'bass': this.bassFilter.gain.value = value; break;
            case 'mid': this.midFilter.gain.value = value; break;
            case 'treble': this.trebleFilter.gain.value = value; break;
        }
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
     */
    async loadLibrary() {
        try {
            this.log('Loading music library...');
            const response = await fetch('/music-library.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
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
        const isProduction = window.location.hostname.includes('github.io');
        let src = track.file;

        if (isProduction && track.cdnUrl) {
            src = track.cdnUrl;
            this.log(`Using CDN URL: ${src}`);
        } else {
            // Use encodeURI to handle spaces but preserve special chars like &, +, ,
            // which might be valid in the path and over-encoded by encodeURIComponent
            src = encodeURI(track.file);
            this.log(`Using local path: ${src}`);
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
    }

    toggleRepeat() {
        const modes = ['off', 'one', 'all', 'folder'];
        const idx = modes.indexOf(this.state.repeatMode);
        this.state.repeatMode = modes[(idx + 1) % modes.length];
        this.updateControlsUI();
        this.log(`Repeat mode: ${this.state.repeatMode}`);
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
window.setEqualizer = (band, value) => {
    window.musicPlayer.setEqualizer(band, value);
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
        }
    }

    drawVisualizer();
});
