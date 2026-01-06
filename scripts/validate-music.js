import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MANIFEST_PATH = join(__dirname, '../public/music-library.json');

async function validateMusicLibrary() {
    console.log('Validating music library...');

    if (!existsSync(MANIFEST_PATH)) {
        console.error('❌ Manifest not found at:', MANIFEST_PATH);
        process.exit(1);
    }

    const library = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
    console.log(`Found ${library.length} tracks in manifest.`);

    let errors = 0;
    let warnings = 0;

    for (const track of library) {
        // 1. Check local file existence (if running locally)
        // track.file example: /assets_for_my_website/Music/Folder/Song.mp3
        const diskPath = join(__dirname, '../public', track.file);

        if (!existsSync(diskPath)) {
            // It might be that the user hasn't run the setup script or it's a symlink issue
            // But let's check the source directory too
            const sourcePath = join(__dirname, '..', track.file.substring(1)); // remove leading slash
            if (!existsSync(sourcePath)) {
                console.error(`❌ File not found locally: ${track.title} (${track.file})`);
                errors++;
            }
        }

        // 2. Check CDN URL (Production check)
        if (track.cdnUrl) {
            try {
                await checkUrl(track.cdnUrl);
                // console.log(`✅ CDN OK: ${track.title}`);
            } catch (e) {
                console.warn(`⚠️ CDN Check Failed for ${track.title}: ${e.message}`);
                warnings++;
            }
        }
    }

    console.log('\nValidation Summary:');
    console.log(`Total Tracks: ${library.length}`);
    console.log(`Errors: ${errors}`);
    console.log(`Warnings: ${warnings}`);

    if (errors > 0) {
        process.exit(1);
    }
}

function checkUrl(url) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'HEAD' }, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                resolve();
            } else {
                reject(new Error(`Status code: ${res.statusCode}`));
            }
        });
        req.on('error', reject);
        req.end();
    });
}

validateMusicLibrary();
