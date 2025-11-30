// Enhanced Music Player - Dynamic Loading & Controlled Initialization
let completeMusicLibrary = [];
let playerState = {
    currentIndex: -1,
    isPlaying: false,
    repeatMode: 'off',
    shuffleMode: false,
    queue: [],
    currentFolder: null
};

// Load music library from JSON manifest
async function loadMusicLibrary() {
    try {
        const baseUrl = import.meta.env.BASE_URL || '/';
        const manifestUrl = `${baseUrl}music-library.json`.replace(/\/\//g, '/');

        console.log(`Loading music library from manifest: ${manifestUrl}`);
        const response = await fetch(manifestUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        completeMusicLibrary = await response.json();
        console.log(`Loaded ${completeMusicLibrary.length} songs from manifest`);

        // Expose globally for UI rendering
        window.musicLibrary = completeMusicLibrary;
        window.playerState = playerState;

    } catch (error) {
        console.error('Error loading music library:', error);
        window.musicLibrary = []; // Ensure library is empty on failure
    }
}

// Play track function - this is now the single source of truth for playing a track
window.playTrack = function (index) {
    const track = completeMusicLibrary[index];
    const audioPlayer = document.getElementById('audio-player');
    const audioSource = document.getElementById('audio-source');
    const trackTitle = document.getElementById('current-track-title');
    const trackArtist = document.getElementById('current-track-artist');
    const playPauseIcon = document.getElementById('play-pause-icon');

    if (!audioPlayer || !track) {
        console.error('Audio player or track not found for index:', index);
        return;
    }

    console.log('Loading track:', track.title);

    // Construct the final URL using BASE_URL for deployment compatibility
    const baseUrl = import.meta.env.BASE_URL || '/';
    const encodedFile = track.file.split('/').map(segment => encodeURIComponent(segment)).join('/');
    const finalUrl = `${baseUrl}${encodedFile}`.replace(/\/\//g, '/');

    console.log('Final song URL:', finalUrl);

    // Update source and load
    audioSource.src = finalUrl;
    audioPlayer.load();

    // Play audio with error handling
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            playerState.isPlaying = true;
            updatePlayPauseIcon();
        }).catch(error => {
            if (error.name !== 'AbortError') {
                console.error('Error playing audio:', error);
                playerState.isPlaying = false;
                updatePlayPauseIcon();
                if (trackTitle) trackTitle.textContent = track.title + ' (Click play to start)';
            }
        });
    }

    // Update track info display
    if (trackTitle) trackTitle.textContent = track.title;
    if (trackArtist) trackArtist.textContent = track.artist;

    // Update player state
    playerState.currentIndex = index;
    playerState.currentFolder = track.folder;

    // Highlight current track in UI
    updateActiveTrack(index);
};


// Simple alias for playing by index
window.playTrackByIndex = function (index) {
    if (index < 0 || index >= completeMusicLibrary.length) {
        console.error('Invalid track index:', index);
        return;
    }
    window.playTrack(index);
};

// Update active track styling in the song list
function updateActiveTrack(index) {
    document.querySelectorAll('.song-card').forEach((item) => {
        item.classList.remove('active', 'playing');
        const itemIndex = item.getAttribute('onclick')?.match(/playTrackByIndex\((\d+)\)/);
        if (itemIndex && parseInt(itemIndex[1]) === index) {
            item.classList.add('active', 'playing');
        }
    });
}

function updatePlayPauseIcon() {
    const icon = document.getElementById('play-pause-icon');
    if (icon) {
        icon.setAttribute('data-lucide', playerState.isPlaying ? 'pause' : 'play');
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Setup player controls
function setupPlayerControls() {
    window.togglePlayPause = function () {
        const player = document.getElementById('audio-player');
        if (!player || playerState.currentIndex === -1) {
            if (completeMusicLibrary.length > 0) playTrackByIndex(0); // Play first song if none selected
            return;
        };

        if (player.paused) {
            player.play().catch(e => console.error('Play error:', e));
            playerState.isPlaying = true;
        } else {
            player.pause();
            playerState.isPlaying = false;
        }
        updatePlayPauseIcon();
    };

    window.toggleShuffle = function () {
        playerState.shuffleMode = !playerState.shuffleMode;
        document.getElementById('shuffle-btn')?.classList.toggle('active', playerState.shuffleMode);
        console.log('Shuffle:', playerState.shuffleMode);
    };

    window.toggleRepeat = function () {
        const modes = ['off', 'one', 'all'];
        const currentIndex = modes.indexOf(playerState.repeatMode);
        playerState.repeatMode = modes[(currentIndex + 1) % modes.length];

        const btn = document.getElementById('repeat-btn');
        if(btn) {
          btn.classList.toggle('active', playerState.repeatMode !== 'off');
          btn.title = `Repeat: ${playerState.repeatMode}`;
        }
        console.log('Repeat mode:', playerState.repeatMode);
    };

    window.previousTrack = function () {
        let newIndex = playerState.currentIndex - 1;
        if (newIndex < 0) {
            newIndex = completeMusicLibrary.length - 1; // Wrap around
        }
        playTrackByIndex(newIndex);
    };

    window.nextTrack = function () {
        let newIndex = playerState.currentIndex + 1;
        if (newIndex >= completeMusicLibrary.length) {
            newIndex = 0; // Wrap around
        }
        playTrackByIndex(newIndex);
    };

    window.handleTrackEnd = function () {
        if (playerState.repeatMode === 'one') {
            playTrackByIndex(playerState.currentIndex);
        } else if (playerState.shuffleMode) {
            const randomIndex = Math.floor(Math.random() * completeMusicLibrary.length);
            playTrackByIndex(randomIndex);
        } else if (playerState.repeatMode === 'all' || playerState.currentIndex < completeMusicLibrary.length - 1) {
            nextTrack();
        } else {
            // End of playlist
            playerState.isPlaying = false;
            updatePlayPauseIcon();
        }
    };

    window.updateProgress = function () {
        const player = document.getElementById('audio-player');
        if (!player) return;

        const currentTimeEl = document.getElementById('current-time');
        const totalTimeEl = document.getElementById('total-time');
        const progressFill = document.getElementById('progress-fill');

        if (player.duration) {
            const progress = (player.currentTime / player.duration) * 100;
            if(progressFill) progressFill.style.width = `${progress}%`;

            const formatTime = (time) => {
                const minutes = Math.floor(time / 60);
                const seconds = Math.floor(time % 60);
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            };
            if(currentTimeEl) currentTimeEl.textContent = formatTime(player.currentTime);
            if(totalTimeEl) totalTimeEl.textContent = formatTime(player.duration);
        }
    };
}

// The main entry point to be called from the HTML page
async function initializeMusicPlayer() {
    console.log('Initializing music player...');
    await loadMusicLibrary();
    setupPlayerControls();
    console.log('Music player initialized.');
}

// Expose the main initializer to the global scope
window.initializeMusicPlayer = initializeMusicPlayer;
