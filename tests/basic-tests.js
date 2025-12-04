// Simple test suite
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running basic tests...\n');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passedTests++;
    } catch (error) {
        console.log(`✗ ${name}`);
        console.log(`  Error: ${error.message}`);
        failedTests++;
    }
}

// Test 1: Check if music manifest exists
test('Music manifest exists', () => {
    const manifestPath = path.join(__dirname, '../public/music-library.json');
    assert(fs.existsSync(manifestPath), 'Music manifest file not found');
});

// Test 2: Check if music manifest is valid JSON
test('Music manifest is valid JSON', () => {
    const manifestPath = path.join(__dirname, '../public/music-library.json');
    const content = fs.readFileSync(manifestPath, 'utf8');
    const json = JSON.parse(content);
    assert(Array.isArray(json), 'Music manifest should be an array');
});

// Test 3: Check if all HTML pages exist
test('All HTML pages exist', () => {
    const pages = ['index.html', 'pages/music.html', 'pages/resume.html', 'pages/tools.html'];
    pages.forEach(page => {
        const pagePath = path.join(__dirname, '..', page);
        assert(fs.existsSync(pagePath), `Page ${page} not found`);
    });
});

// Test 4: Check if required CSS files exist
test('Required CSS files exist', () => {
    const cssFiles = ['assets/css/main.css', 'assets/css/mobile.css'];
    cssFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        assert(fs.existsSync(filePath), `CSS file ${file} not found`);
    });
});

// Test 5: Check if required JS files exist
test('Required JS files exist', () => {
    const jsFiles = ['assets/js/navbar.js', 'assets/js/music-player-enhanced.js', 'assets/js/mobile-menu-fix.js'];
    jsFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        assert(fs.existsSync(filePath), `JS file ${file} not found`);
    });
});

// Test 6: Check if package.json has required scripts
test('Package.json has required scripts', () => {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    assert(packageJson.scripts.build, 'Build script not found');
    assert(packageJson.scripts['generate:music'], 'Generate music script not found');
});

// Test 7: Check if music library has tracks with absolute paths
test('Music manifest has correct path format', () => {
    const manifestPath = path.join(__dirname, '../public/music-library.json');
    const content = fs.readFileSync(manifestPath, 'utf8');
    const tracks = JSON.parse(content);
    assert(tracks.length > 0, 'Music library should have tracks');
    // Check first track has absolute path
    assert(tracks[0].file.startsWith('/assets_for_my_website/'),
        'Track paths should be absolute (start with /assets_for_my_website/)');
});

// Test 8: Verify sample music file is not an LFS pointer (only if file exists)
test('Sample music file is not an LFS pointer', () => {
    const sampleFile = path.join(__dirname, '../assets_for_my_website/Music/Ishaan/BODMAS.mp3');
    if (fs.existsSync(sampleFile)) {
        const buffer = Buffer.alloc(50);
        const fd = fs.openSync(sampleFile, 'r');
        fs.readSync(fd, buffer, 0, 50, 0);
        fs.closeSync(fd);
        const content = buffer.toString('utf8');
        assert(!content.includes('version https://git-lfs'),
            'Music file should not be an LFS pointer - run git lfs pull');
    } else {
        console.log('  (Skipped - sample file not found, assuming CI environment)');
    }
});

// Test 9: Verify sample music file has reasonable size
test('Sample music file has reasonable size', () => {
    const sampleFile = path.join(__dirname, '../assets_for_my_website/Music/Ishaan/BODMAS.mp3');
    if (fs.existsSync(sampleFile)) {
        const stats = fs.statSync(sampleFile);
        assert(stats.size > 10000,
            `Music file too small (${stats.size} bytes) - likely an LFS pointer`);
    } else {
        console.log('  (Skipped - sample file not found, assuming CI environment)');
    }
});

// Summary
console.log(`\n========== Test Summary ==========`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Total: ${passedTests + failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
