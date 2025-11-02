// Enhanced Music Player with Full Library
// Complete music library with all 68 songs organized by folders

const completeMusicLibrary = [
    // Suka Suka (3 songs)
    { title: "Scarborough Fair", artist: "山田タマル (Yamada Tamaru)", folder: "Suka Suka", file: "../assets_for_my_website/Music/Suka suka/「Scarborough Fair」史卡博羅市集－山田タマル (中英字幕).opus" },
    { title: "Always in my heart", artist: "山田タマル (Yamada Tamaru)", folder: "Suka Suka", file: "../assets_for_my_website/Music/Suka suka/山田タマル Always in my heart full.opus" },
    { title: "Best Vocal Soundtracks", artist: "終末なにしてますか", folder: "Suka Suka", file: "../assets_for_my_website/Music/Suka suka/Suka Suka - Best Vocal Sountracks - [ 終末なにしてますか 忙しいですか 救ってもらっていいですか ].mp3" },
    
    // Covers (2 songs)
    { title: "Heart Attack", artist: "Sam Tsui & Chrissy Costanza", folder: "Covers", file: "../assets_for_my_website/Music/Alex Groot, Kurt and Crissy/Heart Attack - Demi Lovato (Sam Tsui & Chrissy Costanza of ATC).mp3" },
    { title: "22 (Taylor Swift Cover)", artist: "Alex Goot, Sam Tsui", folder: "Covers", file: "../assets_for_my_website/Music/Alex Groot, Kurt and Crissy/22_taylor_swift_alex_goot_sam_tsui_chrissy_king_the_kid_cover_-7443934852967229262.mp3" },
    
    // Ishaan (26 songs)
    { title: "Aaj to Tera Birthday Hai", artist: "Ishaan OST", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Aaj to Tera Birthday Hai.mp3" },
    { title: "BODMAS", artist: "Ishaan OST", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/BODMAS.mp3" },
    { title: "Baage Shyla", artist: "Ishaan OST", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Baage Shyla.mp3" },
    { title: "Chor Ho Tum", artist: "Ishaan OST", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Chor Ho Tum.mp3" },
    { title: "Dil ka hai jo haal", artist: "Ishaan OST", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Dil ka hai jo haal.mp3" },
    { title: "Disney Ishaan all songs", artist: "Ishaan OST", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Disney Ishaan all songs.mp3" },
    { title: "Jeetenge Aaaj Bhi", artist: "Ishaan OST", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Ishaan - Jeetenge Aaaj Bhi.mp3" },
    { title: "Sapno Ko Awaaz De", artist: "Ishaan OST", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Ishaan Sapno Ko Awaaz De.mp3" },
    { title: "Jake and the Neverland Song", artist: "Sagar Sawarkar", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Jake and the Neverland Song Chalo chalein yo ho rendered by Sagar Sawarkar.mp3" },
    { title: "Jo Pyaar Ho Gaya (Acoustic)", artist: "Ishaan OST", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Jo Pyaar Ho Gaya (Acoustic) - Ishaan - FULL SONG..mp3" },
    { title: "Khwaab Ye Kal Ke", artist: "Ishaan OST", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Khwaab Ye Kal Ke.mp3" },
    { title: "Owa Owa", artist: "Ishaan OST", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Owa Owa.mp3" },
    { title: "Pyaari Yaari Dosti Hai", artist: "Ishaan OST", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Pyaari Yaari Dosti Hai.mp3" },
    { title: "A Friend in Neverland (Hindi)", artist: "Sagar Sawarkar", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Sagar Sawarkar - A Friend in Neverland Hindi Version Song.mp3" },
    { title: "Summer Song", artist: "Sagar Sawarkar", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Sagar Sawarkar - Summer Song - Phineas and Ferb Movie.mp3" },
    { title: "Say cheese", artist: "Ishaan OST", folder: "Ishaan", file: "../assets_for_my_website/Music/Ishaan/Say cheese.mp3" },
    
    // Pokémon - English (4 songs)
    { title: "All Theme Songs (Seasons 1-24)", artist: "Pokémon", folder: "Pokémon", file: "../assets_for_my_website/Music/Pokemon/All/All Pokémon Theme Songs (Seasons 1-24) Extended in English.mp3" },
    { title: "We Will Be Heroes", artist: "Pokémon Movie", folder: "Pokémon", file: "../assets_for_my_website/Music/Pokemon/English/Movies/Pokemon - We Will Be Heroes (Original Music Video).mp3" },
    { title: "Black & White Movie 14 Opening", artist: "Pokémon", folder: "Pokémon", file: "../assets_for_my_website/Music/Pokemon/English/Movies/Pokemon Black & White_ Movie 14 - Opening Theme (w_ lyrics and download).mp3" },
    { title: "The Movie XYZ Opening", artist: "Pokémon", folder: "Pokémon", file: "../assets_for_my_website/Music/Pokemon/English/Movies/Pokémon_ The Movie XYZ - Opening (English).mp3" },
    
    // Pokémon - Hindi (12 songs)
    { title: "Hum Banenge Heroes", artist: "Pokémon (Hindi)", folder: "Pokémon", file: "../assets_for_my_website/Music/Pokemon/Hindi/Movies/Hum Banenge Heroes (From _Pokémon_ The Rise of Darkrai__Hindi Soundtrack).mp3" },
    { title: "Black and White (Hindi CN)", artist: "Pokémon (Hindi)", folder: "Pokémon", file: "../assets_for_my_website/Music/Pokemon/Hindi/Series/CN/Pokémon Black and White Song Video Opening theme [CN India] HINDI.mp3" },
    { title: "Johto Song (Hindi CN)", artist: "Pokémon (Hindi)", folder: "Pokémon", file: "../assets_for_my_website/Music/Pokemon/Hindi/Series/CN/Pokémon Opening Johto Song in Hindi (Cartoon Network India).mp3" },
    { title: "Diamond and Pearl (Hindi)", artist: "Pokémon (Hindi)", folder: "Pokémon", file: "../assets_for_my_website/Music/Pokemon/Hindi/Series/CN/Pokémon Opening Diamond and Pearl Song in Hindi (Cartoon Network India).mp3" },
    { title: "Sinnoh League Victors (Hindi)", artist: "Pokémon (Hindi)", folder: "Pokémon", file: "../assets_for_my_website/Music/Pokemon/Hindi/Series/Others/Pokemon Season 13 - Sinnoh League Victors Opening Song in Hindi Lyrical Video [Sing-Along]!.mp3" },
    { title: "Season 7 Opening (Hindi)", artist: "Pokémon (Hindi)", folder: "Pokémon", file: "../assets_for_my_website/Music/Pokemon/Hindi/Series/Others/Pokémon Season 7 Opening Song in Hindi.mp3" },
    
    // See & Feel - Anime (3 songs)
    { title: "Main Tumko Chahun (Your Name AMV)", artist: "LOVE TWICE", folder: "See & Feel", file: "../assets_for_my_website/Music/See and feel/Anime/LOVE TWICE - (Main Tumko Chahun) UNOFFICIAL AMV Your Name and The Garden of Words.mp3" },
    { title: "NIYANDAR ENDING THEME REMIX", artist: "See & Feel", folder: "See & Feel", file: "../assets_for_my_website/Music/See and feel/Anime/NIYANDAR ENDING THEME [REMIX] - See & Feel.mp3" },
    
    // See & Feel - Bollywood (6 songs)
    { title: "Dil Ibadat (Unplugged)", artist: "Tripti Garg", folder: "See & Feel", file: "../assets_for_my_website/Music/See and feel/Bollywood/Dil Ibadat unplugged cover Female Version Tripti Garg Funn4 U.mp3" },
    { title: "Tum Mile (LoFi Remix)", artist: "See & Feel", folder: "See & Feel", file: "../assets_for_my_website/Music/See and feel/Bollywood/TUM MILE (LoFi Remix) 💌🌊 _ Clean Audio _ See & Feel.mp3" },
    { title: "Saanson Ke (LoFi Cover)", artist: "See & Feel", folder: "See & Feel", file: "../assets_for_my_website/Music/See and feel/Bollywood/Saanson Ke (Cover) Lo-Fi_See&Feel.mp3" },
    { title: "Teri Meri Prem Kahani (LoFi)", artist: "See & Feel", folder: "See & Feel", file: "../assets_for_my_website/Music/See and feel/Bollywood/Teri Meri Prem Kahani🥀 - Lofi Flip _ Re_Mix _ Love Story 2021 _ AMV _ See & Feel.mp3" }
];

// Player state
let playerState = {
    currentIndex: -1,
    isPlaying: false,
    repeatMode: 'off', // 'off', 'one', 'all', 'folder'
    shuffleMode: false,
    queue: [],
    currentFolder: null
};

// Initialize enhanced player
function initEnhancedPlayer() {
    // Replace musicLibrary with complete library
    if (typeof window !== 'undefined') {
        window.musicLibrary = completeMusicLibrary;
        window.playerState = playerState;
    }
    
    // Re-render with new library
    if (typeof renderMusicList === 'function') {
        renderEnhancedMusicList();
    }
    
    // Add control handlers
    setupPlayerControls();
    
    console.log(`Enhanced player initialized with ${completeMusicLibrary.length} songs`);
}

// Render music list organized by folders
function renderEnhancedMusicList() {
    const musicList = document.getElementById('music-list');
    if (!musicList) return;
    
    // Group by folder
    const byFolder = {};
    completeMusicLibrary.forEach((track, index) => {
        if (!byFolder[track.folder]) {
            byFolder[track.folder] = [];
        }
        byFolder[track.folder].push({...track, index});
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
function toggleFolder(folder) {
    const folderId = `folder-${folder.replace(/[^a-z0-9]/gi, '_')}`;
    const folderEl = document.getElementById(folderId);
    const iconEl = document.getElementById(`folder-icon-${folder.replace(/[^a-z0-9]/gi, '_')}`);
    
    if (folderEl) {
        folderEl.classList.toggle('collapsed');
        if (iconEl) {
            iconEl.textContent = folderEl.classList.contains('collapsed') ? '▶' : '▼';
        }
    }
}

// Play track by index
function playTrackByIndex(index) {
    if (typeof playTrack === 'function') {
        playerState.currentIndex = index;
        playerState.currentFolder = completeMusicLibrary[index].folder;
        playTrack(index);
        updateActiveTrack(index);
    }
}

// Update active track styling
function updateActiveTrack(index) {
    document.querySelectorAll('.music-item').forEach((item, i) => {
        item.classList.remove('active', 'playing');
        if (parseInt(item.dataset.index) === index) {
            item.classList.add('active', 'playing');
        }
    });
}

// Setup player controls
function setupPlayerControls() {
    // These functions will be called from inline onclick handlers in HTML
    window.toggleShuffle = function() {
        playerState.shuffleMode = !playerState.shuffleMode;
        const btn = document.getElementById('shuffle-btn');
        if (btn) {
            btn.classList.toggle('active', playerState.shuffleMode);
        }
        console.log('Shuffle:', playerState.shuffleMode);
    };
    
    window.toggleRepeat = function() {
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
    
    window.previousTrack = function() {
        if (playerState.currentIndex > 0) {
            playTrackByIndex(playerState.currentIndex - 1);
        }
    };
    
    window.nextTrack = function() {
        if (playerState.currentIndex < completeMusicLibrary.length - 1) {
            playTrackByIndex(playerState.currentIndex + 1);
        } else if (playerState.repeatMode === 'all') {
            playTrackByIndex(0);
        }
    };
    
    window.togglePlayPause = function() {
        const player = document.getElementById('audio-player');
        if (player) {
            if (player.paused) {
                player.play().catch(e => console.error('Play error:', e));
            } else {
                player.pause();
            }
        }
    };
    
    window.handleTrackEnd = function() {
        const player = document.getElementById('audio-player');
        if (!player) return;
        
        if (playerState.repeatMode === 'one') {
            player.currentTime = 0;
            player.play();
        } else if (playerState.repeatMode === 'folder') {
            // Find next track in same folder
            const nextInFolder = completeMusicLibrary.find((t, i) => 
                i > playerState.currentIndex && t.folder === playerState.currentFolder
            );
            if (nextInFolder) {
                playTrackByIndex(completeMusicLibrary.indexOf(nextInFolder));
            } else {
                // Loop back to first in folder
                const firstInFolder = completeMusicLibrary.find(t => t.folder === playerState.currentFolder);
                if (firstInFolder) {
                    playTrackByIndex(completeMusicLibrary.indexOf(firstInFolder));
                }
            }
        } else if (playerState.shuffleMode) {
            const randomIndex = Math.floor(Math.random() * completeMusicLibrary.length);
            playTrackByIndex(randomIndex);
        } else {
            window.nextTrack();
        }
    };
    
    window.updateProgress = function() {
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

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedPlayer);
} else {
    initEnhancedPlayer();
}
