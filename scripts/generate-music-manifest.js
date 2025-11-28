#!/usr/bin/env node

/**
 * Generate Music Library Manifest
 * Scans the assets_for_my_website/Music directory and creates a JSON manifest
 */

const fs = require('fs');
const path = require('path');

const MUSIC_DIR = path.join(__dirname, '../assets_for_my_website/Music');
const OUTPUT_FILE = path.join(__dirname, '../public/music-library.json');

function scanMusicDirectory(dir, baseFolder = '') {
    const tracks = [];

    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            const relativePath = path.relative(path.join(__dirname, '../assets_for_my_website'), fullPath);

            if (item.isDirectory()) {
                // Recursively scan subdirectories
                const folderName = baseFolder ? `${baseFolder}` : item.name;
                tracks.push(...scanMusicDirectory(fullPath, folderName));
            } else if (item.isFile()) {
                // Check if it's a music file
                const ext = path.extname(item.name).toLowerCase();
                if (['.mp3', '.opus', '.m4a', '.ogg', '.wav'].includes(ext)) {
                    // Extract metadata from filename and path
                    const folder = baseFolder || path.basename(dir);
                    const title = path.basename(item.name, ext);

                    tracks.push({
                        title: title,
                        artist: inferArtist(folder, title),
                        folder: folder,
                        file: `../assets_for_my_website/${relativePath.replace(/\\/g, '/')}`
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Error scanning directory ${dir}:`, error.message);
    }

    return tracks;
}

function inferArtist(folder, title) {
    // Try to infer artist from folder name or title
    if (folder.includes('Ishaan')) return 'Ishaan OST';
    if (folder.includes('Pokemon') || folder.includes('Pokémon')) return 'Pokémon';
    if (folder.includes('Suka')) return '終末なにしてますか';
    if (folder.includes('Hannah') || folder.includes('Hanna')) return 'Hannah Montana';
    if (folder.includes('Kuraki')) return 'Mai Kuraki';
    if (folder.includes('See')) return 'See & Feel';

    // Try to extract from title
    if (title.includes('-')) {
        const parts = title.split('-');
        if (parts.length > 1) {
            return parts[0].trim();
        }
    }

    return folder; // Fallback to folder name
}

function main() {
    console.log('Scanning music directory...');
    console.log('Music directory:', MUSIC_DIR);

    if (!fs.existsSync(MUSIC_DIR)) {
        console.error('Music directory not found! Make sure the submodule is initialized.');
        console.error('Run: git submodule update --init --recursive');
        process.exit(1);
    }

    const tracks = scanMusicDirectory(MUSIC_DIR);

    console.log(`Found ${tracks.length} music files`);

    // Ensure public directory exists
    const publicDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write the manifest
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tracks, null, 2));

    console.log(`Music library manifest created: ${OUTPUT_FILE}`);
    console.log(`Total tracks: ${tracks.length}`);

    // Group by folder for summary
    const byFolder = {};
    tracks.forEach(track => {
        byFolder[track.folder] = (byFolder[track.folder] || 0) + 1;
    });

    console.log('\nTracks by folder:');
    Object.entries(byFolder).sort().forEach(([folder, count]) => {
        console.log(`  ${folder}: ${count} songs`);
    });
}

main();
