// Build Verification & Runtime Tests
import assert from 'assert';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

console.log('Running build verification & runtime tests...\n');

let passedTests = 0;
let failedTests = 0;
const bugs = [];

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passedTests++;
    } catch (error) {
        console.log(`✗ ${name}`);
        console.log(`  Bug: ${error.message}`);
        bugs.push({ test: name, error: error.message });
        failedTests++;
    }
}

// Helper: Get all files recursively
function getAllFiles(dir, ext) {
    const files = [];
    if (!existsSync(dir)) return files;
    const items = readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = join(dir, item.name);
        if (item.isDirectory() && item.name !== 'node_modules') {
            files.push(...getAllFiles(fullPath, ext));
        } else if (item.isFile() && (!ext || extname(item.name) === ext)) {
            files.push(fullPath);
        }
    }
    return files;
}

// ═══════════════════════════════════════════════════════════════
// TEST 1: Build Output Verification
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Build Output Tests ---');

test('dist directory exists', () => {
    assert(existsSync(DIST), 'dist directory not found - run vite build first');
});

test('dist/index.html exists', () => {
    assert(existsSync(join(DIST, 'index.html')), 'dist/index.html not found');
});

test('dist has CSS assets', () => {
    const cssFiles = getAllFiles(join(DIST, 'assets'), '.css');
    assert(cssFiles.length > 0, 'No CSS files in dist/assets');
});

test('dist has JS assets', () => {
    const jsFiles = getAllFiles(join(DIST, 'assets'), '.js');
    assert(jsFiles.length > 0, 'No JS files in dist/assets');
});

test('All source HTML pages have dist counterparts', () => {
    const srcPages = [
        'index.html', 'pages/blog.html', 'pages/resume.html', 'pages/tools.html',
        'pages/gallery.html', 'pages/music.html', 'pages/reader.html',
        'pages/tools/audio-studio.html', 'pages/tools/llm-chat.html',
        'pages/tools/pdf-studio.html', 'pages/tools/youtube-downloader.html'
    ];
    for (const page of srcPages) {
        assert(existsSync(join(DIST, page)), `Missing dist/${page}`);
    }
});

test('CSS files are minified (no excessive whitespace)', () => {
    const cssFiles = getAllFiles(join(DIST, 'assets'), '.css');
    for (const cssFile of cssFiles) {
        const content = readFileSync(cssFile, 'utf8');
        const lines = content.split('\n');
        // Minified CSS should have few newlines
        if (lines.length > 50 && content.length > 1000) {
            const ratio = content.length / lines.length;
            assert(ratio > 50, `${cssFile.replace(ROOT + '/', '')}: CSS may not be properly minified (${ratio.toFixed(0)} chars/line)`);
        }
    }
});

test('JS files are minified', () => {
    const jsFiles = getAllFiles(join(DIST, 'assets'), '.js');
    for (const jsFile of jsFiles) {
        const content = readFileSync(jsFile, 'utf8');
        if (content.length > 5000) {
            const lines = content.split('\n');
            const ratio = content.length / lines.length;
            assert(ratio > 30, `${jsFile.replace(ROOT + '/', '')}: JS may not be properly minified`);
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// TEST 2: dist/index.html Integrity
// ═══════════════════════════════════════════════════════════════
console.log('\n--- dist/index.html Integrity Tests ---');

const distIndex = readFileSync(join(DIST, 'index.html'), 'utf8');

test('dist/index.html has DOCTYPE', () => {
    assert(distIndex.includes('<!doctype html>') || distIndex.includes('<!DOCTYPE html>'),
        'Missing DOCTYPE');
});

test('dist/index.html has theme script', () => {
    assert(distIndex.includes('data-theme') || distIndex.includes('localStorage.getItem'),
        'Missing theme initialization script');
});

test('dist/index.html has loading screen', () => {
    assert(distIndex.includes('loading-screen') || distIndex.includes('loading-bar'),
        'Missing loading screen');
});

test('dist/index.html has navbar container', () => {
    assert(distIndex.includes('navbar-container') || distIndex.includes('navbar'),
        'Missing navbar container');
});

test('dist/index.html has hero terminal', () => {
    assert(distIndex.includes('terminal') || distIndex.includes('hero'),
        'Missing terminal/hero section');
});

test('dist/index.html has contact form', () => {
    assert(distIndex.includes('contact') || distIndex.includes('form'),
        'Missing contact form');
});

test('dist/index.html references built assets', () => {
    assert(distIndex.includes('/assets/'), 'Should reference built assets');
});

// ═══════════════════════════════════════════════════════════════
// TEST 3: CSS Variable Consistency
// ═══════════════════════════════════════════════════════════════
console.log('\n--- CSS Variable Consistency Tests ---');

const themeCSS = readFileSync(join(ROOT, 'assets/css/theme.css'), 'utf8');
const mainCSS = readFileSync(join(ROOT, 'assets/css/main.css'), 'utf8');

test('All themes define --bg-deep', () => {
    const themes = ['dark', 'dark-coffee', 'amber', 'tokyo-night', 'absolute-dark', 'forest', 'dracula'];
    for (const theme of themes) {
        const pattern = new RegExp(`data-theme="${theme}"[^}]*--bg-deep`);
        assert(pattern.test(themeCSS), `Theme ${theme} missing --bg-deep`);
    }
});

test('All themes define --text-primary', () => {
    const themes = ['dark', 'dark-coffee', 'amber', 'tokyo-night', 'absolute-dark', 'forest', 'dracula'];
    for (const theme of themes) {
        const pattern = new RegExp(`data-theme="${theme}"[^}]*--text-primary`);
        assert(pattern.test(themeCSS), `Theme ${theme} missing --text-primary`);
    }
});

test('All themes define --accent-cyan', () => {
    const themes = ['dark', 'dark-coffee', 'amber', 'tokyo-night', 'absolute-dark', 'forest', 'dracula'];
    for (const theme of themes) {
        const pattern = new RegExp(`data-theme="${theme}"[^}]*--accent-cyan`);
        assert(pattern.test(themeCSS), `Theme ${theme} missing --accent-cyan`);
    }
});

test('main.css uses CSS variables (not hardcoded colors)', () => {
    const hardcodedPatterns = [
        /color:\s*#2c1a0e/g,
        /color:\s*#faf3e8/g,
        /background:\s*#faf3e8/g,
        /background:\s*#f2e6d0/g
    ];
    for (const pattern of hardcodedPatterns) {
        const matches = mainCSS.match(pattern);
        if (matches) {
            assert(matches.length < 3, `main.css has ${matches.length} hardcoded light theme colors`);
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// TEST 4: JavaScript Module Integrity
// ═══════════════════════════════════════════════════════════════
console.log('\n--- JavaScript Module Tests ---');

test('navbar.js exports or initializes', () => {
    const navbarJS = readFileSync(join(ROOT, 'assets/js/navbar.js'), 'utf8');
    assert(navbarJS.includes('initThemeToggle') || navbarJS.includes('DOMContentLoaded'),
        'navbar.js should initialize on DOMContentLoaded');
});

test('main.js has theme toggle logic', () => {
    const mainJS = readFileSync(join(ROOT, 'assets/js/main.js'), 'utf8');
    assert(mainJS.includes('theme') || mainJS.includes('Theme'),
        'main.js should have theme logic');
});

test('audio-studio.js has AudioContext check', () => {
    const audioJS = readFileSync(join(ROOT, 'assets/js/audio-studio.js'), 'utf8');
    assert(audioJS.includes('AudioContext') || audioJS.includes('webkitAudioContext'),
        'audio-studio.js should check for AudioContext');
});

test('audio-studio.js has recording functionality', () => {
    const audioJS = readFileSync(join(ROOT, 'assets/js/audio-studio.js'), 'utf8');
    assert(audioJS.includes('MediaRecorder') || audioJS.includes('getUserMedia'),
        'audio-studio.js should have recording capability');
});

// ═══════════════════════════════════════════════════════════════
// TEST 5: HTML/CSS Integration
// ═══════════════════════════════════════════════════════════════
console.log('\n--- HTML/CSS Integration Tests ---');

const srcHTMLFiles = getAllFiles(join(ROOT, 'pages'), '.html');
srcHTMLFiles.push(join(ROOT, 'index.html'));

for (const htmlFile of srcHTMLFiles) {
    const relPath = htmlFile.replace(ROOT + '/', '');
    const content = readFileSync(htmlFile, 'utf8');

    test(`No broken CSS references: ${relPath}`, () => {
        const cssRefs = content.match(/href="([^"]*\.css[^"]*)"/g) || [];
        for (const ref of cssRefs) {
            const href = ref.match(/href="([^"]+)"/)[1];
            if (href.startsWith('http')) continue;

            let targetPath;
            if (href.startsWith('/')) {
                targetPath = join(ROOT, href);
            } else {
                targetPath = join(dirname(htmlFile), href);
            }
            targetPath = targetPath.split('?')[0];

            if (!existsSync(targetPath)) {
                assert(false, `Broken CSS reference: ${href}`);
            }
        }
    });

    test(`No broken JS references: ${relPath}`, () => {
        const jsRefs = content.match(/src="([^"]*\.js[^"]*)"/g) || [];
        for (const ref of jsRefs) {
            const src = ref.match(/src="([^"]+)"/)[1];
            if (src.startsWith('http')) continue;

            let targetPath;
            if (src.startsWith('/')) {
                targetPath = join(ROOT, src);
            } else {
                targetPath = join(dirname(htmlFile), src);
            }
            targetPath = targetPath.split('?')[0];

            if (!existsSync(targetPath)) {
                assert(false, `Broken JS reference: ${src}`);
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// TEST 6: Audio Studio Specific Tests
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Audio Studio Tests ---');

const audioHTML = readFileSync(join(ROOT, 'pages/tools/audio-studio.html'), 'utf8');
const audioCSS = readFileSync(join(ROOT, 'assets/css/audio-studio.css'), 'utf8');
const audioJS = readFileSync(join(ROOT, 'assets/js/audio-studio.js'), 'utf8');

test('Audio Studio has transport controls', () => {
    assert(audioHTML.includes('play-btn'), 'Missing play button');
    assert(audioHTML.includes('stop-btn'), 'Missing stop button');
    assert(audioHTML.includes('record-btn'), 'Missing record button');
});

test('Audio Studio has visualizer canvas', () => {
    assert(audioHTML.includes('visualizer-canvas'), 'Missing visualizer canvas');
});

test('Audio Studio has effects rack', () => {
    assert(audioHTML.includes('effects-rack') || audioHTML.includes('effect-panel'),
        'Missing effects rack');
});

test('Audio Studio has mixer panel', () => {
    assert(audioHTML.includes('mixer-panel') || audioHTML.includes('mixer'),
        'Missing mixer panel');
});

test('Audio Studio CSS has no duplicate selectors', () => {
    // Check for duplicate compound selectors (not just class names)
    const compoundSelectors = audioCSS.match(/\.[a-zA-Z][a-zA-Z0-9-]*(?:\.[a-zA-Z][a-zA-Z0-9-]*)+\s*\{/g) || [];
    const seen = new Set();
    const duplicates = [];
    for (const sel of compoundSelectors) {
        const trimmed = sel.trim();
        if (seen.has(trimmed)) {
            duplicates.push(trimmed);
        }
        seen.add(trimmed);
    }
    if (duplicates.length > 0) {
        assert(false, `Duplicate compound selectors: ${duplicates.slice(0, 3).join(', ')}`);
    }
});

test('Audio Studio has proper layout structure', () => {
    assert(audioCSS.includes('.studio-container'), 'Missing .studio-container');
    assert(audioCSS.includes('.studio-topbar'), 'Missing .studio-topbar');
    assert(audioCSS.includes('.studio-main'), 'Missing .studio-main');
    assert(audioCSS.includes('.track-panel'), 'Missing .track-panel');
});

// ═══════════════════════════════════════════════════════════════
// TEST 7: YouTube Downloader Tests
// ═══════════════════════════════════════════════════════════════
console.log('\n--- YouTube Downloader Tests ---');

const ytHTML = readFileSync(join(ROOT, 'pages/tools/youtube-downloader.html'), 'utf8');

test('YouTube Downloader has URL input', () => {
    assert(ytHTML.includes('video-url') || ytHTML.includes('youtube-url'),
        'Missing URL input field');
});

test('YouTube Downloader has format selection', () => {
    assert(ytHTML.includes('mp4') || ytHTML.includes('mp3') || ytHTML.includes('format'),
        'Missing format selection');
});

test('YouTube Downloader uses noembed for video info', () => {
    assert(ytHTML.includes('noembed.com'), 'Should use noembed.com for video info');
});

test('YouTube Downloader has download service links', () => {
    assert(ytHTML.includes('y2mate.com') || ytHTML.includes('savefrom.net') || ytHTML.includes('cobalt.tools'),
        'Should have download service links');
});

test('YouTube Downloader has proper error handling', () => {
    assert(ytHTML.includes('catch') || ytHTML.includes('error'),
        'Should have error handling');
});

// ═══════════════════════════════════════════════════════════════
// TEST 8: PDF Studio Tests
// ═══════════════════════════════════════════════════════════════
console.log('\n--- PDF Studio Tests ---');

const pdfHTML = readFileSync(join(ROOT, 'pages/tools/pdf-studio.html'), 'utf8');

test('PDF Studio has compress functionality', () => {
    assert(pdfHTML.includes('compress') || pdfHTML.includes('Compress'),
        'Missing compress feature');
});

test('PDF Studio has merge functionality', () => {
    assert(pdfHTML.includes('merge') || pdfHTML.includes('Merge'),
        'Missing merge feature');
});

test('PDF Studio has split functionality', () => {
    assert(pdfHTML.includes('split') || pdfHTML.includes('Split'),
        'Missing split feature');
});

test('PDF Studio has rotate functionality', () => {
    assert(pdfHTML.includes('rotate') || pdfHTML.includes('Rotate'),
        'Missing rotate feature');
});

test('PDF Studio has watermark functionality', () => {
    assert(pdfHTML.includes('watermark') || pdfHTML.includes('Watermark'),
        'Missing watermark feature');
});

// ═══════════════════════════════════════════════════════════════
// TEST 9: Performance Budget
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Performance Budget Tests ---');

test('Total CSS size < 500KB', () => {
    const cssFiles = getAllFiles(join(DIST, 'assets'), '.css');
    let totalSize = 0;
    for (const f of cssFiles) totalSize += statSync(f).size;
    assert(totalSize < 500 * 1024, `Total CSS size ${(totalSize / 1024).toFixed(0)}KB exceeds 500KB`);
});

test('Total JS size < 5MB', () => {
    const jsFiles = getAllFiles(join(DIST, 'assets'), '.js');
    let totalSize = 0;
    for (const f of jsFiles) totalSize += statSync(f).size;
    assert(totalSize < 5 * 1024 * 1024, `Total JS size ${(totalSize / 1024 / 1024).toFixed(1)}MB exceeds 5MB`);
});

test('No single CSS file > 100KB', () => {
    const cssFiles = getAllFiles(join(DIST, 'assets'), '.css');
    for (const f of cssFiles) {
        const size = statSync(f).size;
        assert(size < 100 * 1024, `${f.replace(ROOT + '/', '')} is ${(size / 1024).toFixed(0)}KB`);
    }
});

test('index.html < 200KB', () => {
    const size = statSync(join(DIST, 'index.html')).size;
    assert(size < 200 * 1024, `index.html is ${(size / 1024).toFixed(0)}KB`);
});

// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(50));
console.log('BUILD VERIFICATION & RUNTIME TEST SUMMARY');
console.log('═'.repeat(50));
console.log(`✓ Passed: ${passedTests}`);
console.log(`✗ Failed: ${failedTests}`);
console.log(`Total: ${passedTests + failedTests}`);

if (bugs.length > 0) {
    console.log('\n🐛 BUGS FOUND:');
    bugs.forEach((bug, i) => {
        console.log(`  ${i + 1}. ${bug.test}`);
        console.log(`     ${bug.error}`);
    });
}

if (failedTests > 0) {
    process.exit(1);
} else {
    console.log('\n✅ All build & runtime tests passed!');
}
