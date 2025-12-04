// Enhanced Music Player - Dynamic Loading
// Loads music library from generated manifest

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
        console.log('Loading music library from manifest...');
        const response = await fetch('/music-library.json');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        completeMusicLibrary = await response.json();
        console.log(`Loaded ${completeMusicLibrary.length} songs from manifest`);

        return completeMusicLibrary;
    } catch (error) {
        console.error('Error loading music library:', error);
        console.log('Falling back to empty library');
        return [];
    }
}

// Initialize enhanced player
async function initEnhancedPlayer() {
    console.log('Initializing enhanced player...');

    // Load the library
    await loadMusicLibrary();

    // Expose globally
    if (typeof window !== 'undefined') {
        window.musicLibrary = completeMusicLibrary;
        window.playerState = playerState;
    }

    // Render music list
    renderEnhancedMusicList();

    // Add control handlers
    setupPlayerControls();

    console.log(`Enhanced player initialized with ${completeMusicLibrary.length} songs`);
}

// Expose globally
window.initEnhancedPlayer = initEnhancedPlayer;

// Render music list organized by folders
function renderEnhancedMusicList() {
    const musicList = document.getElementById('music-list');

    // Skip if music-list doesn't exist (e.g., in Spotify UI)
    if (!musicList) {
        console.log('Skipping renderEnhancedMusicList - using custom UI');
        return;
    }

    if (completeMusicLibrary.length === 0) {
        musicList.innerHTML = '<li class="music-item text-center py-4">No music files found. Please check the manifest.</li>';
        return;
    }

    console.log('Rendering music list...');

    // Group by folder
    const byFolder = {};
    completeMusicLibrary.forEach((track, index) => {
        if (!byFolder[track.folder]) {
            byFolder[track.folder] = [];
        }
        byFolder[track.folder].push({ ...track, index });
    });

    // Build HTML
    let html = '';
    Object.keys(byFolder).sort().forEach(folder => {
        const songs = byFolder[folder];
        html += `
            <div class="folder-section">
                <div class="folder-title" onclick="toggleFolder('${folder}')">
                    <span>📁 ${folder} (${songs.length} songs)</span>
                    <span id="folder-icon-${folder.replace(/[^a-z0-9]/gi, '_')}">▼</span>
                </div>
                <div class="folder-songs" id="folder-${folder.replace(/[^a-z0-9]/gi, '_')}">
                    ${songs.map(track => `
                        <div class="music-item" onclick="playTrackByIndex(${track.index})" data-index="${track.index}">
                            <div class="music-info">
                                <i data-lucide="play-circle" class="w-5 h-5 text-cyan-400"></i>
                                <div>
                                    <p class="music-title">${track.title}</p>
                                    <p class="music-artist">${track.artist}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    musicList.innerHTML = html;

    console.log('Music list rendered with', Object.keys(byFolder).length, 'folders');

    // Reinitialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Update song count
    const songCount = document.getElementById('song-count');
    if (songCount) {
        songCount.textContent = `(${completeMusicLibrary.length} songs in ${Object.keys(byFolder).length} folders)`;
    }
}

// Toggle folder visibility
window.toggleFolder = function (folder) {
    const folderId = `folder-${folder.replace(/[^a-z0-9]/gi, '_')}`;
    const folderEl = document.getElementById(folderId);
    const iconEl = document.getElementById(`folder-icon-${folder.replace(/[^a-z0-9]/gi, '_')}`);

    if (folderEl) {
        folderEl.classList.toggle('collapsed');
        if (iconEl) {
            iconEl.textContent = folderEl.classList.contains('collapsed') ? '▶' : '▼';
        }
    }
};

// Play track by index
window.playTrackByIndex = function (index) {
    // Validate index
    if (index < 0 || index >= completeMusicLibrary.length) {
        console.error('Invalid track index:', index);
        return;
    }

    console.log('Playing track index:', index);
    if (window.playTrack) {
        window.playTrack(index);
    } else {
        console.error('playTrack function not yet defined');
    }
};

// Update active track styling
function updateActiveTrack(index) {
    document.querySelectorAll('.music-item').forEach((item) => {
        item.classList.remove('active', 'playing');
        if (parseInt(item.dataset.index) === index) {
            item.classList.add('active', 'playing');
        }
    });
}

// Setup player controls
function setupPlayerControls() {
    window.toggleShuffle = function () {
        playerState.shuffleMode = !playerState.shuffleMode;
        const btn = document.getElementById('shuffle-btn');
        if (btn) {
            btn.classList.toggle('active', playerState.shuffleMode);
        }
        console.log('Shuffle:', playerState.shuffleMode);
    };

    window.toggleRepeat = function () {
        const modes = ['off', 'one', 'all', 'folder'];
        const currentIndex = modes.indexOf(playerState.repeatMode);
        playerState.repeatMode = modes[(currentIndex + 1) % modes.length];

        const btn = document.getElementById('repeat-btn');
        if (btn) {
            btn.classList.toggle('active', playerState.repeatMode !== 'off');
            btn.title = `Repeat: ${playerState.repeatMode}`;
        }
        console.log('Repeat mode:', playerState.repeatMode);
    };

    window.previousTrack = function () {
        if (playerState.currentIndex > 0) {
            window.playTrackByIndex(playerState.currentIndex - 1);
        }
    };

    window.nextTrack = function () {
        if (playerState.currentIndex < completeMusicLibrary.length - 1) {
            window.playTrackByIndex(playerState.currentIndex + 1);
        } else if (playerState.repeatMode === 'all') {
            window.playTrackByIndex(0);
        }
    };

    window.togglePlayPause = function () {
        const player = document.getElementById('audio-player');
        if (player) {
            if (player.paused) {
                player.play().catch(e => console.error('Play error:', e));
            } else {
                player.pause();
            }
        }
    };

    window.handleTrackEnd = function () {
        const player = document.getElementById('audio-player');
        if (!player) return;

        if (playerState.repeatMode === 'one') {
            player.currentTime = 0;
            player.play();
        } else if (playerState.repeatMode === 'folder') {
            const nextInFolder = completeMusicLibrary.find((t, i) =>
                i > playerState.currentIndex && t.folder === playerState.currentFolder
            );
            if (nextInFolder) {
                window.playTrackByIndex(completeMusicLibrary.indexOf(nextInFolder));
            } else {
                const firstInFolder = completeMusicLibrary.find(t => t.folder === playerState.currentFolder);
                if (firstInFolder) {
                    window.playTrackByIndex(completeMusicLibrary.indexOf(firstInFolder));
                }
            }
        } else if (playerState.shuffleMode) {
            const randomIndex = Math.floor(Math.random() * completeMusicLibrary.length);
            window.playTrackByIndex(randomIndex);
        } else {
            window.nextTrack();
        }
    };

    window.updateProgress = function () {
        const player = document.getElementById('audio-player');
        if (!player) return;

        const currentTime = document.getElementById('current-time');
        const totalTime = document.getElementById('total-time');

        if (currentTime) {
            const minutes = Math.floor(player.currentTime / 60);
            const seconds = Math.floor(player.currentTime % 60);
            currentTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        if (totalTime && player.duration) {
            const minutes = Math.floor(player.duration / 60);
            const seconds = Math.floor(player.duration % 60);
            totalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    };
}

// Play track function
window.playTrack = function (index) {
    const track = completeMusicLibrary[index];
    const audioPlayer = document.getElementById('audio-player');
    const audioSource = document.getElementById('audio-source');
    const trackTitle = document.getElementById('current-track-title');
    const trackArtist = document.getElementById('current-track-artist');
    const trackFolder = document.getElementById('current-track-folder');

    if (!audioPlayer || !track) {
        console.error('Audio player or track not found');
        return;
    }

    console.log('Loading track:', track.title);

    // Encode the URL properly by splitting path segments
    // This handles special characters in filenames (like ?, #) correctly while preserving path structure
    const encodedFile = track.file.split('/').map(segment => encodeURIComponent(segment)).join('/');

    console.log('Original file path:', track.file);
    console.log('Encoded file URL:', encodedFile);

    // Update source
    audioSource.src = encodedFile;

    // Add explicit error listener for loading errors
    const errorHandler = (e) => {
        const error = audioPlayer.error;
        let errorMessage = 'Unknown error';
        if (error) {
            switch (error.code) {
                case error.MEDIA_ERR_ABORTED:
                    errorMessage = 'Aborted';
                    break;
                case error.MEDIA_ERR_NETWORK:
                    errorMessage = 'Network error';
                    break;
                case error.MEDIA_ERR_DECODE:
                    errorMessage = 'Decode error';
                    break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = 'Source not supported (404 or bad format)';
                    break;
                default:
                    errorMessage = `Error code: ${error.code}`;
            }
        }
        console.error(`Media load error for ${track.title}: ${errorMessage}`, error);

        // Try to recover or show message
        if (trackTitle) trackTitle.textContent = `Error: ${track.title} (${errorMessage})`;

        // Remove listener to prevent memory leaks (though it's one-time usually)
        audioPlayer.removeEventListener('error', errorHandler);
    };

    audioPlayer.addEventListener('error', errorHandler, { once: true });

    audioPlayer.load();

    // Play audio with error handling
    const playPromise = audioPlayer.play();

    if (playPromise !== undefined) {
        playPromise.then(_ => {
            playerState.isPlaying = true;
            updatePlayPauseIcon();
            console.log('Playing:', track.title);
            // Remove error listener if playback started successfully
            audioPlayer.removeEventListener('error', errorHandler);
        })
            .catch(error => {
                // AbortError is harmless - happens when switching tracks quickly
                if (error.name === 'AbortError') {
                    return; // Silently ignore abort errors
                }
                console.error('Error playing audio:', error);
                playerState.isPlaying = false;
                updatePlayPauseIcon();
                if (trackTitle) trackTitle.textContent = track.title + ' (Click play to start)';
            });
    }

    // Update track info
    if (trackTitle) trackTitle.textContent = track.title;
    if (trackArtist) trackArtist.textContent = track.artist;
    if (trackFolder) trackFolder.textContent = `Folder: ${track.folder}`;

    // Update player state
    playerState.currentIndex = index;
    playerState.currentFolder = track.folder;

    // Highlight current track
    updateActiveTrack(index);
};

function updatePlayPauseIcon() {
    const icon = document.getElementById('play-pause-icon');
    if (icon) {
        if (playerState.isPlaying) {
            icon.setAttribute('data-lucide', 'pause');
        } else {
            icon.setAttribute('data-lucide', 'play');
        }
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedPlayer);
} else {
    initEnhancedPlayer();
}
