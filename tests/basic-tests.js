// Simple test suite (ES Module version)
import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    const manifestPath = join(__dirname, '../public/music-library.json');
    assert(existsSync(manifestPath), 'Music manifest file not found');
});

// Test 2: Check if music manifest is valid JSON
test('Music manifest is valid JSON', () => {
    const manifestPath = join(__dirname, '../public/music-library.json');
    const content = readFileSync(manifestPath, 'utf8');
    const json = JSON.parse(content);
    assert(Array.isArray(json), 'Music manifest should be an array');
});

// Test 3: Check if all HTML pages exist
test('All HTML pages exist', () => {
    const pages = ['index.html', 'pages/music.html', 'pages/resume.html', 'pages/tools.html', 'pages/mermaid-tool.html'];
    pages.forEach(page => {
        const pagePath = join(__dirname, '..', page);
        assert(existsSync(pagePath), `Page ${page} not found`);
    });
});

// Test 4: Check if required CSS files exist
test('Required CSS files exist', () => {
    const cssFiles = ['assets/css/main.css', 'assets/css/mobile.css'];
    cssFiles.forEach(file => {
        const filePath = join(__dirname, '..', file);
        assert(existsSync(filePath), `CSS file ${file} not found`);
    });
});

// Test 5: Check if required JS files exist
test('Required JS files exist', () => {
    const jsFiles = ['assets/js/navbar.js', 'assets/js/music-player-enhanced.js'];
    jsFiles.forEach(file => {
        const filePath = join(__dirname, '..', file);
        assert(existsSync(filePath), `JS file ${file} not found`);
    });
});

// Test 6: Check if package.json has required scripts
test('Package.json has required scripts', () => {
    const packagePath = join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    assert(packageJson.scripts.build, 'Build script not found');
    assert(packageJson.scripts['generate:music'], 'Generate music script not found');
    assert(packageJson.scripts.test, 'Test script not found');
});

// Test 7: Check if music library has tracks with absolute paths
test('Music manifest has correct path format', () => {
    const manifestPath = join(__dirname, '../public/music-library.json');
    const content = readFileSync(manifestPath, 'utf8');
    const tracks = JSON.parse(content);
    assert(tracks.length > 0, 'Music library should have tracks');
    // Check first track has absolute path
    assert(tracks[0].file.startsWith('/assets_for_my_website/'),
        'Track paths should be absolute (start with /assets_for_my_website/)');
});

// Test 8: Verify vite.config.mjs exists (not .js)
test('Vite config uses .mjs extension', () => {
    const configPath = join(__dirname, '../vite.config.mjs');
    assert(existsSync(configPath), 'vite.config.mjs not found');

    // Verify old .js config is removed
    const oldConfigPath = join(__dirname, '../vite.config.js');
    assert(!existsSync(oldConfigPath), 'Old vite.config.js should be removed');
});

// Test 9: Verify Mermaid tool source exists
test('Mermaid tool source exists', () => {
    const mermaidDir = join(__dirname, '../src/mermaid-tool');
    assert(existsSync(mermaidDir), 'src/mermaid-tool directory not found');
    assert(existsSync(join(mermaidDir, 'main.jsx')), 'src/mermaid-tool/main.jsx not found');
    assert(existsSync(join(mermaidDir, 'App.jsx')), 'src/mermaid-tool/App.jsx not found');
});

// Test 10: Verify tools are in the tools directory
test('Tools pages exist', () => {
    const toolsDir = join(__dirname, '../pages/tools');
    assert(existsSync(toolsDir), 'pages/tools directory not found');

    const expectedTools = ['llm-chat.html', 'paper-finder.html', 'audio-studio.html'];
    expectedTools.forEach(tool => {
        const toolPath = join(toolsDir, tool);
        assert(existsSync(toolPath), `Tool ${tool} not found`);
    });
});

// Test 11: Verify package.json has type:module
test('Package.json has type:module for ESM', () => {
    const packagePath = join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    assert(packageJson.type === 'module', 'package.json should have "type": "module" for ESM');
});

// Summary
console.log(`\n========== Test Summary ==========`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Total: ${passedTests + failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
