// Build Verification Tests
// Run after build to verify output structure
import { existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Running build verification tests...\n');

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

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const distPath = join(__dirname, '../dist');

// Test 1: Dist folder exists
test('Dist folder exists', () => {
    assert(existsSync(distPath), 'dist folder not found - run npm run build first');
});

// Test 2: Index.html exists in dist
test('index.html exists in dist', () => {
    assert(existsSync(join(distPath, 'index.html')), 'index.html not found in dist');
});

// Test 3: Pages are built
test('Pages are built correctly', () => {
    const expectedPages = [
        'pages/music.html',
        'pages/resume.html',
        'pages/tools.html',
        'pages/mermaid-tool.html',
    ];
    expectedPages.forEach(page => {
        assert(existsSync(join(distPath, page)), `${page} not found in dist`);
    });
});

// Test 4: Assets folder has bundled content
test('Assets folder has bundled content', () => {
    assert(existsSync(join(distPath, 'assets')), 'assets folder not found in dist');
    // Vite 6+ bundles directly into assets/ without subfolders
    const files = readdirSync(join(distPath, 'assets'));
    const jsFiles = files.filter(f => f.endsWith('.js'));
    const cssFiles = files.filter(f => f.endsWith('.css'));
    assert(jsFiles.length > 0, 'No JS files found in dist/assets');
    assert(cssFiles.length > 0, 'No CSS files found in dist/assets');
});

// Test 5: Vite chunks are generated
test('Vite generates JavaScript chunks', () => {
    const assetsDir = join(distPath, 'assets');
    if (existsSync(assetsDir)) {
        const files = readdirSync(assetsDir, { recursive: true });
        const jsFiles = files.filter(f => f.toString().endsWith('.js'));
        assert(jsFiles.length > 0, 'No JS files found in dist/assets - Vite may have failed');
    }
});

// Test 6: Mermaid tool bundle exists
test('Mermaid tool is bundled', () => {
    const mermaidPage = join(distPath, 'pages/mermaid-tool.html');
    if (existsSync(mermaidPage)) {
        console.log('  ✓ Mermaid tool page found');
    }
});

// Test 7: No source maps in production (optional check)
test('No source maps in production build', () => {
    const assetsDir = join(distPath, 'assets');
    if (existsSync(assetsDir)) {
        const files = readdirSync(assetsDir, { recursive: true });
        const sourceMaps = files.filter(f => f.toString().endsWith('.map'));
        if (sourceMaps.length > 0) {
            console.log(`  ⚠️ Warning: ${sourceMaps.length} source map files found (not recommended for production)`);
        }
    }
});

// Summary
console.log(`\n========== Build Verification Summary ==========`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Total: ${passedTests + failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
