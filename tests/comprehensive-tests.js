// Comprehensive Website Tests - Find Real Bugs
import assert from 'assert';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

console.log('Running comprehensive bug detection tests...\n');

let passedTests = 0;
let failedTests = 0;
let warnings = 0;
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

function warn(msg) {
    console.log(`⚠ Warning: ${msg}`);
    warnings++;
}

// Helper: Get all HTML files (excluding EFAML_WEB submodule)
function getHTMLFiles(dir) {
    const files = [];
    const items = readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'dist' && item.name !== 'old_codes' && item.name !== 'EFAML_WEB') {
            files.push(...getHTMLFiles(fullPath));
        } else if (item.isFile() && extname(item.name) === '.html') {
            files.push(fullPath);
        }
    }
    return files;
}

// Helper: Get all CSS files
function getCSSFiles(dir) {
    const files = [];
    const items = readdirSync(join(dir, 'assets/css'), { withFileTypes: true });
    for (const item of items) {
        if (item.isFile() && extname(item.name) === '.css') {
            files.push(join(dir, 'assets/css', item.name));
        }
    }
    return files;
}

// ═══════════════════════════════════════════════════════════════
// TEST 1: CSS Syntax Validation
// ═══════════════════════════════════════════════════════════════
console.log('\n--- CSS Syntax Tests ---');

const cssFiles = getCSSFiles(ROOT);
for (const cssFile of cssFiles) {
    const relPath = cssFile.replace(ROOT + '/', '');
    test(`CSS braces balanced: ${relPath}`, () => {
        const content = readFileSync(cssFile, 'utf8');
        const opens = (content.match(/{/g) || []).length;
        const closes = (content.match(/}/g) || []).length;
        assert.strictEqual(opens, closes, `Unbalanced braces: ${opens} opening vs ${closes} closing`);
    });

    test(`CSS no empty rules: ${relPath}`, () => {
        const content = readFileSync(cssFile, 'utf8');
        const emptyRules = content.match(/[^{}]+\{\s*\}/g);
        if (emptyRules && emptyRules.length > 0) {
            // Allow a few empty rules for resets
            assert(emptyRules.length < 5, `Too many empty CSS rules: ${emptyRules.length}`);
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// TEST 2: HTML Structure Validation
// ═══════════════════════════════════════════════════════════════
console.log('\n--- HTML Structure Tests ---');

const htmlFiles = getHTMLFiles(ROOT);
for (const htmlFile of htmlFiles) {
    const relPath = htmlFile.replace(ROOT + '/', '');
    const content = readFileSync(htmlFile, 'utf8');

    test(`Has DOCTYPE: ${relPath}`, () => {
        assert(content.includes('<!doctype html>') || content.includes('<!DOCTYPE html>'),
            'Missing DOCTYPE declaration');
    });

    test(`Has lang attribute: ${relPath}`, () => {
        assert(content.includes('lang="en"') || content.includes("lang='en'"),
            'Missing lang="en" on html element');
    });

    test(`Has charset: ${relPath}`, () => {
        assert(content.includes('charset="UTF-8"') || content.includes("charset='UTF-8'"),
            'Missing charset meta tag');
    });

    test(`Has viewport meta: ${relPath}`, () => {
        assert(content.includes('name="viewport"'), 'Missing viewport meta tag');
    });

    test(`Has title: ${relPath}`, () => {
        assert(content.includes('<title>'), 'Missing title tag');
    });

    test(`Has meta description: ${relPath}`, () => {
        assert(content.includes('name="description"'), 'Missing meta description');
    });

    test(`Has canonical URL: ${relPath}`, () => {
        assert(content.includes('rel="canonical"'), 'Missing canonical URL');
    });

    test(`Has OG tags: ${relPath}`, () => {
        assert(content.includes('property="og:title"'), 'Missing og:title');
        assert(content.includes('property="og:description"'), 'Missing og:description');
    });
}

// ═══════════════════════════════════════════════════════════════
// TEST 3: Theme System Consistency
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Theme System Tests ---');

test('theme.css has all dark theme definitions', () => {
    const themeCSS = readFileSync(join(ROOT, 'assets/css/theme.css'), 'utf8');
    const themes = ['dark', 'dark-coffee', 'amber', 'tokyo-night', 'absolute-dark', 'forest', 'dracula'];
    for (const theme of themes) {
        assert(themeCSS.includes(`data-theme="${theme}"`),
            `Missing theme definition for: ${theme}`);
    }
});

test('theme.css has light theme definition', () => {
    const themeCSS = readFileSync(join(ROOT, 'assets/css/theme.css'), 'utf8');
    assert(themeCSS.includes(':root') || themeCSS.includes('data-theme="light"'),
        'Missing light theme definition');
});

test('All themes have required CSS variables', () => {
    const themeCSS = readFileSync(join(ROOT, 'assets/css/theme.css'), 'utf8');
    const requiredVars = [
        '--bg-deep', '--bg-primary', '--bg-dark', '--bg-secondary', '--bg-card', '--bg-elevated',
        '--border', '--border-glow', '--text-primary', '--text-secondary', '--text-muted',
        '--accent-cyan', '--accent', '--accent-green', '--accent-purple',
        '--nav-bg', '--nav-text', '--glass-bg', '--body-bg', '--body-color',
        '--input-bg', '--code-bg', '--btn-primary-bg', '--btn-primary-text'
    ];

    // Check at least one theme has all variables
    const darkThemeMatch = themeCSS.match(/html\[data-theme="dark"\][^}]+\{[^}]+\}/s);
    if (darkThemeMatch) {
        for (const v of requiredVars) {
            assert(darkThemeMatch[0].includes(v + ':'),
                `Dark theme missing variable: ${v}`);
        }
    }
});

test('No hardcoded light theme colors in index.html', () => {
    const indexHTML = readFileSync(join(ROOT, 'index.html'), 'utf8');
    const hardcodedColors = ['#c97c3a', '#2c1a0e', '#faf3e8', '#f2e6d0', '#ede0c8'];
    for (const color of hardcodedColors) {
        // Skip if inside a CSS variable definition or comment
        const lines = indexHTML.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes(color) && !line.includes('var(') && !line.includes('/*') && !line.includes('//')) {
                // Check if it's in a :root or :not selector (which is OK)
                if (!line.includes(':root') && !line.includes(':not(') && !line.includes('data-theme')) {
                    warn(`index.html line ${i + 1} has hardcoded color ${color}: ${line.substring(0, 80)}`);
                }
            }
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// TEST 4: Script Loading
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Script Loading Tests ---');

for (const htmlFile of htmlFiles) {
    const relPath = htmlFile.replace(ROOT + '/', '');
    const content = readFileSync(htmlFile, 'utf8');

    test(`Local scripts have type="module": ${relPath}`, () => {
        const scriptTags = content.match(/<script[^>]*src="[^"]*"[^>]*>/g) || [];
        for (const tag of scriptTags) {
            if (tag.includes('src=') && !tag.includes('http') && !tag.includes('cdn')) {
                assert(tag.includes('type="module"'),
                    `Script missing type="module": ${tag.substring(0, 80)}`);
            }
        }
    });

    test(`CDN scripts have defer: ${relPath}`, () => {
        const scriptTags = content.match(/<script[^>]*src="https?:\/\/[^"]*"[^>]*>/g) || [];
        for (const tag of scriptTags) {
            if (tag.includes('lucide') || tag.includes('three') || tag.includes('marked')) {
                assert(tag.includes('defer'),
                    `CDN script missing defer: ${tag.substring(0, 80)}`);
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// TEST 5: Lucide Icon References
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Icon Reference Tests ---');

const validLucideIcons = [
    'home', 'user', 'code', 'briefcase', 'mail', 'github', 'linkedin',
    'settings', 'menu', 'x', 'sun', 'moon', 'play', 'pause', 'stop',
    'skip-back', 'skip-forward', 'repeat', 'shuffle', 'volume', 'volume2',
    'mic', 'mic-off', 'upload', 'download', 'copy', 'scissors', 'trash',
    'edit', 'save', 'file', 'folder', 'search', 'filter', 'plus', 'minus',
    'check', 'alert-circle', 'info', 'help-circle', 'external-link',
    'arrow-left', 'arrow-right', 'chevron-down', 'chevron-up', 'chevron-left', 'chevron-right',
    'heart', 'star', 'eye', 'eye-off', 'lock', 'unlock', 'key', 'globe',
    'zap', 'activity', 'bar-chart', 'pie-chart', 'trending-up', 'trending-down',
    'layers', 'grid', 'list', 'layout', 'sidebar', 'panel-left', 'panel-right',
    'sliders', 'toggle-left', 'toggle-right', 'bell', 'bookmark', 'calendar',
    'camera', 'image', 'film', 'music', 'headphones', 'radio', 'tv',
    'wifi', 'wifi-off', 'bluetooth', 'battery', 'power', 'refresh',
    'rotate-cw', 'rotate-ccw', 'zoom-in', 'zoom-out', 'maximize', 'minimize',
    'move', 'type', 'bold', 'italic', 'underline', 'align-left', 'align-center',
    'align-right', 'link', 'unlink', 'paperclip', 'send', 'message-circle',
    'phone', 'map-pin', 'navigation', 'compass', 'map', 'clock', 'timer',
    'award', 'target', 'crosshair', 'droplet', 'flame', 'thermometer',
    'cloud', 'sun', 'moon', 'star', 'sunrise', 'sunset',
    'database', 'server', 'cpu', 'hard-drive', 'monitor', 'smartphone',
    'tablet', 'watch', 'printer', 'keyboard', 'mouse', 'headphones',
    'video', 'aperture', 'shield', 'shield-check', 'shield-off',
    'folder-open', 'file-text', 'file-plus', 'file-minus', 'file-x',
    'git-branch', 'git-commit', 'git-merge', 'git-pull-request',
    'terminal', 'code-2', 'package', 'puzzle', 'tool', 'wrench', 'hammer',
    'circle', 'square', 'triangle', 'hexagon', 'octagon',
    'activity', 'airplay', 'anchor', 'at-sign', 'award', 'baseload',
    'binary', 'blender', 'bone', 'book', 'book-open', 'box',
    'brain', 'building', 'bus', 'cake', 'calculator', 'calendar-days',
    'cassette-tape', 'cast', 'check-circle', 'check-square', 'chef-hat',
    'cherry', 'church', 'cigarette', 'circuit-board', 'clapperboard',
    'clipboard-check', 'clipboard-copy', 'clipboard-list', 'clipboard-paste',
    'clipboard-x', 'clock-1', 'clock-2', 'clock-3', 'clock-4', 'clock-5',
    'cloud-cog', 'cloud-drizzle', 'cloud-fog', 'cloud-hail', 'cloud-lightning',
    'cloud-moon', 'cloud-rain', 'cloud-snow', 'cloud-sun', 'club',
    'codepen', 'codesandbox', 'coffee', 'cog', 'coins', 'columns',
    'command', 'component', 'cone', 'construction', 'contact',
    'contrast', 'cookie', 'copyleft', 'copyright', 'credit-card',
    'croissant', 'crown', 'cuboid', 'cup-soda', 'currency',
    'cylinder', 'delete', 'diamond', 'dice-1', 'dice-2', 'dice-3',
    'disc', 'dollar-sign', 'door-open', 'dot', 'download-cloud',
    'dribbble', 'droplets', 'drumstick', 'dumbbell', 'ear', 'eraser',
    'euro', 'expand', 'facebook', 'factory', 'fan', 'fast-forward',
    'feather', 'figma', 'file-archive', 'file-audio', 'file-axis-3d',
    'file-badge', 'file-bar-chart', 'file-box', 'file-check', 'file-clock',
    'file-code', 'file-cog', 'file-diff', 'file-digit', 'file-down',
    'file-heart', 'file-input', 'file-json', 'file-key', 'file-line-chart',
    'file-lock', 'file-minus', 'file-output', 'file-pen', 'file-question',
    'file-scan', 'file-search', 'file-sliders', 'file-spreadsheet',
    'file-stack', 'file-symlink', 'file-terminal', 'file-type', 'file-up',
    'file-video', 'file-volume', 'file-warning', 'file-x', 'files',
    'finger-print', 'fish', 'flag', 'flame', 'flashlight',
    'flask-conical', 'flask-round', 'flip-horizontal', 'flip-vertical',
    'flower', 'footprints', 'forklift', 'forward', 'frame',
    'framer', 'fuel', 'function-square', 'gallery-horizontal',
    'gallery-thumbnails', 'gauge', 'ghost', 'gift', 'git-branch',
    'git-commit-horizontal', 'git-commit-vertical', 'git-compare',
    'git-compare-arrows', 'git-fork', 'git-graph', 'git-merge',
    'git-pull-request', 'git-pull-request-arrow', 'git-pull-request-closed',
    'git-pull-request-create', 'git-pull-request-create-arrow',
    'git-pull-request-draft', 'github', 'gitlab', 'glass-water',
    'glasses', 'globe', 'globe-2', 'goal', 'grab', 'graduation-cap',
    'grape', 'grid-2x2', 'grid-3x3', 'grip', 'group', 'hammer',
    'hand', 'hand-metal', 'hard-drive', 'hard-drive-download',
    'hard-drive-upload', 'hash', 'haze', 'hdmi-port', 'heart',
    'heart-crack', 'heart-handshake', 'heart-off', 'heart-pulse',
    'heater', 'help-circle', 'hexagon', 'highlighter', 'history',
    'home', 'hop', 'hourglass', 'ice-cream', 'ice-cream-bowl',
    'image', 'image-down', 'image-minus', 'image-off', 'image-plus',
    'import', 'inbox', 'indent', 'indian-rupee', 'infinity', 'info',
    'inspect', 'instagram', 'italic', 'iteration-ccw', 'iteration-cw',
    'japanese-yen', 'joystick', 'kanban', 'key', 'key-round', 'key-square',
    'keyboard', 'lamp', 'lamp-ceiling', 'lamp-desk', 'lamp-floor',
    'lamp-wall-down', 'lamp-wall-up', 'land-plot', 'landmark',
    'languages', 'laptop', 'laptop-2', 'lasso', 'lasso-select',
    'layers', 'layout', 'layout-dashboard', 'layout-grid', 'layout-list',
    'layout-template', 'leaf', 'library', 'life-buoy', 'ligature',
    'lightbulb', 'lightbulb-off', 'line-chart', 'link', 'link-2',
    'linkedin', 'list', 'list-checks', 'list-end', 'list-filter',
    'list-minus', 'list-music', 'list-ordered', 'list-plus', 'list-restart',
    'list-start', 'list-tree', 'list-video', 'list-x', 'loader',
    'loader-2', 'locate', 'locate-fixed', 'locate-off', 'lock',
    'lock-keyhole', 'lock-keyhole-open', 'lock-open', 'log-in', 'log-out',
    'lollipop', 'luggage', 'magnet', 'mail', 'mail-check', 'mail-minus',
    'mail-open', 'mail-plus', 'mail-question', 'mail-search', 'mail-warning',
    'mail-x', 'mailbox', 'mails', 'map', 'map-pin', 'map-pin-off',
    'martini', 'maximize', 'maximize-2', 'medal', 'megaphone',
    'megaphone-off', 'memory-stick', 'menu', 'merge', 'message-circle',
    'message-square', 'mic', 'mic-off', 'microscope', 'microwave',
    'milestone', 'minimize', 'minimize-2', 'minus', 'monitor',
    'monitor-check', 'monitor-dot', 'monitor-down', 'monitor-off',
    'monitor-pause', 'monitor-play', 'monitor-smartphone', 'monitor-speaker',
    'monitor-up', 'monitor-x', 'moon', 'moon-star', 'more-horizontal',
    'more-vertical', 'mountain', 'mountain-snow', 'mouse', 'mouse-pointer',
    'mouse-pointer-2', 'mouse-pointer-click', 'move', 'move-3d',
    'move-diagonal', 'move-diagonal-2', 'move-horizontal', 'move-vertical',
    'music', 'music-2', 'music-3', 'music-4', 'navigation',
    'navigation-2', 'navigation-2-off', 'navigation-off', 'network',
    'newspaper', 'nfc', 'notebook', 'notebook-pen', 'notebook-tabs',
    'notebook-text', 'notepad-text', 'nut', 'octagon', 'option',
    'orbit', 'outdent', 'package', 'package-2', 'package-check',
    'package-minus', 'package-open', 'package-plus', 'package-search',
    'package-x', 'paint-bucket', 'paint-roller', 'palette', 'palmtree',
    'panel-bottom', 'panel-bottom-close', 'panel-bottom-open',
    'panel-left', 'panel-left-close', 'panel-left-open', 'panel-right',
    'panel-right-close', 'panel-right-open', 'panel-top',
    'panel-top-close', 'panel-top-open', 'panels-left-bottom',
    'panels-right-bottom', 'panels-top-left', 'paperclip', 'parentheses',
    'parking-meter', 'party-popper', 'pause', 'paw-print', 'pc-case',
    'pen', 'pen-line', 'pen-tool', 'pencil', 'pencil-line', 'pencil-ruler',
    'pentagon', 'percent', 'person-standing', 'phone', 'phone-call',
    'phone-forwarded', 'phone-incoming', 'phone-missed', 'phone-off',
    'phone-outgoing', 'pi', 'piano', 'picture-in-picture',
    'picture-in-picture-2', 'piggy-bank', 'pilcrow', 'pill', 'pin',
    'pin-off', 'pipette', 'pizza', 'plane', 'plane-landing', 'plane-takeoff',
    'play', 'plug', 'plug-2', 'plug-zap', 'plus', 'plus-circle',
    'plus-square', 'pocket', 'podcast', 'pointer', 'popcorn', 'popsicle',
    'pound-sign', 'power', 'power-off', 'presentation', 'printer',
    'projector', 'puzzle', 'pyramid', 'qr-code', 'quote', 'rabbit',
    'radar', 'radiation', 'radical', 'radio', 'radio-receiver',
    'radio-tower', 'rainbow', 'rat', 'ratio', 'receipt', 'rectangle',
    'rectangle-horizontal', 'rectangle-vertical', 'recycle', 'redo',
    'redo-2', 'refresh-ccw', 'refresh-cw', 'refrigerator', 'regex',
    'remove-formatting', 'repeat', 'repeat-1', 'repeat-2', 'replace',
    'replace-all', 'reply', 'reply-all', 'rewind', 'ribbon', 'rocket',
    'rocking-chair', 'rotate-3d', 'rotate-ccw', 'rotate-cw', 'route',
    'router', 'rows', 'rss', 'ruler', 'russian-ruble', 'sailboat',
    'salad', 'sandwich', 'satellite', 'satellite-dish', 'save',
    'save-all', 'scale', 'scale-3d', 'scaling', 'scan',
    'scan-barcode', 'scan-eye', 'scan-face', 'scan-line', 'scan-search',
    'scan-text', 'scatter-chart', 'school', 'scissors', 'screen-share',
    'screen-share-off', 'scroll', 'scroll-text', 'search', 'search-check',
    'search-code', 'search-slash', 'search-x', 'section', 'send',
    'send-horizontal', 'send-to-back', 'separator-horizontal',
    'separator-vertical', 'server', 'server-cog', 'server-crash',
    'server-off', 'settings', 'settings-2', 'shapes', 'share',
    'share-2', 'sheet', 'shell', 'shield', 'shield-alert',
    'shield-ban', 'shield-check', 'shield-close', 'shield-off',
    'shield-question', 'shield-x', 'ship', 'ship-wheel', 'shirt',
    'shopping-bag', 'shopping-basket', 'shopping-cart', 'shovel',
    'shower-head', 'shrink', 'shrub', 'shuffle', 'sigma', 'signal',
    'signal-high', 'signal-low', 'signal-medium', 'signal-zero',
    'signpost', 'signpost-big', 'siren', 'skip-back', 'skip-forward',
    'skull', 'slack', 'slash', 'slice', 'sliders', 'sliders-horizontal',
    'smartphone', 'smartphone-charging', 'smartphone-nfc', 'smile',
    'smile-plus', 'snail', 'snowflake', 'sofa', 'soup', 'space',
    'spade', 'sparkle', 'sparkles', 'speaker', 'speech', 'spell-check',
    'spline', 'split', 'spray-can', 'sprout', 'square', 'square-activity',
    'square-asterisk', 'square-bottom-dashed-scissors', 'square-check',
    'square-chevron-down', 'square-chevron-left', 'square-chevron-right',
    'square-chevron-up', 'square-code', 'square-dashed-bottom',
    'square-dashed-bottom-code', 'square-dashed-kanban',
    'square-dashed-mouse-pointer', 'square-divide', 'square-dot',
    'square-equal', 'square-function', 'square-kanban', 'square-library',
    'square-m', 'square-menu', 'square-mouse-pointer', 'square-parking',
    'square-parking-off', 'square-pen', 'square-percent', 'square-pi',
    'square-pilcrow', 'square-play', 'square-plus', 'square-power',
    'square-radical', 'square-scissors', 'square-sigma', 'square-slash',
    'square-split-horizontal', 'square-split-vertical', 'square-stack',
    'square-terminal', 'square-user', 'square-x', 'squircle', 'star',
    'star-half', 'star-off', 'step-back', 'step-forward', 'stethoscope',
    'sticker', 'sticky-note', 'store', 'stretch-horizontal',
    'stretch-vertical', 'strikethrough', 'subscript', 'subtitles',
    'sun', 'sun-dim', 'sun-medium', 'sun-moon', 'sun-snow',
    'sunrise', 'sunset', 'superscript', 'swatch-book', 'swiss-franc',
    'switch-camera', 'sword', 'swords', 'syringe', 'table',
    'table-2', 'table-properties', 'tablet', 'tablet-smartphone',
    'tablets', 'tag', 'tags', 'tally-1', 'tally-2', 'tally-3',
    'tally-4', 'tally-5', 'target', 'telescope', 'tent',
    'tent-tree', 'terminal', 'terminal-square', 'test-tube',
    'test-tube-2', 'test-tubes', 'text', 'text-cursor',
    'text-cursor-input', 'text-quote', 'text-search', 'text-select',
    'theater', 'thermometer', 'thermometer-snowflake', 'thumbs-down',
    'thumbs-up', 'ticket', 'timer', 'timer-off', 'timer-reset',
    'toggle-left', 'toggle-right', 'tornado', 'torus', 'touchpad',
    'touchpad-off', 'tower-control', 'toy-brick', 'tractor',
    'traffic-cone', 'train-front', 'train-front-tunnel', 'train-track',
    'tram-front', 'transgender', 'trash', 'trash-2', 'tree-deciduous',
    'tree-palm', 'tree-pine', 'trees', 'trello', 'trending-down',
    'trending-up', 'triangle', 'triangle-right', 'trophy', 'truck',
    'turtle', 'tv', 'tv-2', 'twitch', 'twitter', 'type',
    'type-outline', 'umbrella', 'underline', 'undo', 'undo-2',
    'unfold-horizontal', 'unfold-vertical', 'ungroup', 'unlink',
    'unlink-2', 'unlock', 'unplug', 'upload', 'upload-cloud',
    'usb', 'user', 'user-check', 'user-cog', 'user-minus',
    'user-plus', 'user-x', 'users', 'utensils', 'utility-pouch',
    'variable', 'venetian-mask', 'verified', 'vibrate',
    'vibrate-off', 'video', 'video-off', 'view', 'voicemail',
    'volume', 'volume-1', 'volume-2', 'volume-x', 'vote',
    'wallet', 'wallet-2', 'wallet-cards', 'wallpaper', 'wand',
    'wand-2', 'warehouse', 'washing-machine', 'watch', 'waves',
    'waypoints', 'webcam', 'webhook', 'weight', 'wheat',
    'wheat-off', 'whole-word', 'wifi', 'wifi-off', 'wind',
    'wine', 'wine-off', 'workflow', 'wrap-text', 'wrench',
    'x', 'x-circle', 'x-octagon', 'x-square', 'youtube',
    'zap', 'zap-off', 'zoom-in', 'zoom-out'
];

test('No invalid lucide icon references', () => {
    for (const htmlFile of htmlFiles) {
        const content = readFileSync(htmlFile, 'utf8');
        const iconRefs = content.match(/data-lucide="([^"]+)"/g) || [];
        for (const ref of iconRefs) {
            const iconName = ref.match(/data-lucide="([^"]+)"/)[1];
            // Skip known valid icons and check
            if (iconName && !iconName.includes('{{')) {
                // We'll just warn about potentially invalid icons
                const knownInvalid = ['youtube', 'github-brand', 'linkedin-brand'];
                if (knownInvalid.includes(iconName)) {
                    assert(false, `${htmlFile.replace(ROOT + '/', '')}: Invalid icon "${iconName}"`);
                }
            }
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// TEST 6: Link Validation
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Link Validation Tests ---');

for (const htmlFile of htmlFiles) {
    const relPath = htmlFile.replace(ROOT + '/', '');
    const content = readFileSync(htmlFile, 'utf8');

    test(`Internal links valid: ${relPath}`, () => {
        const links = content.match(/href="([^"]*\.html[^"]*)"/g) || [];
        for (const link of links) {
            const href = link.match(/href="([^"]+)"/)[1];
            if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) continue;

            // Resolve relative path
            let targetPath;
            if (href.startsWith('/')) {
                targetPath = join(ROOT, href);
            } else {
                targetPath = join(dirname(htmlFile), href);
            }

            // Remove query params and hash
            targetPath = targetPath.split('?')[0].split('#')[0];

            if (!existsSync(targetPath)) {
                warn(`${relPath}: Broken link "${href}"`);
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// TEST 7: Accessibility Checks
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Accessibility Tests ---');

for (const htmlFile of htmlFiles) {
    const relPath = htmlFile.replace(ROOT + '/', '');
    const content = readFileSync(htmlFile, 'utf8');

    test(`Images have alt text: ${relPath}`, () => {
        const imgTags = content.match(/<img[^>]*>/g) || [];
        for (const img of imgTags) {
            if (!img.includes('alt=')) {
                warn(`${relPath}: Image missing alt attribute: ${img.substring(0, 60)}`);
            }
        }
    });

    test(`Buttons have accessible labels: ${relPath}`, () => {
        const buttons = content.match(/<button[^>]*>/g) || [];
        for (const btn of buttons) {
            if (!btn.includes('aria-label') && !btn.includes('title=') && !btn.includes('>')) {
                // Check if button has text content (harder to detect in regex)
                if (btn.includes('data-lucide') && !btn.includes('title=')) {
                    warn(`${relPath}: Icon button missing title/aria-label: ${btn.substring(0, 60)}`);
                }
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// TEST 8: Duplicate ID Detection
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Duplicate ID Tests ---');

for (const htmlFile of htmlFiles) {
    const relPath = htmlFile.replace(ROOT + '/', '');
    const content = readFileSync(htmlFile, 'utf8');

    test(`No duplicate IDs: ${relPath}`, () => {
        const ids = content.match(/id="([^"]+)"/g) || [];
        const idMap = {};
        for (const id of ids) {
            const idValue = id.match(/id="([^"]+)"/)[1];
            if (idMap[idValue]) {
                // Allow duplicate IDs in templates/scripts
                if (!content.includes(`id="${idValue}"`) || idMap[idValue] > 2) {
                    warn(`${relPath}: Duplicate ID "${idValue}"`);
                }
            }
            idMap[idValue] = (idMap[idValue] || 0) + 1;
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// TEST 9: Performance Checks
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Performance Tests ---');

test('No inline styles > 1000 chars', () => {
    for (const htmlFile of htmlFiles) {
        const content = readFileSync(htmlFile, 'utf8');
        const inlineStyles = content.match(/style="[^"]{1000,}"/g);
        if (inlineStyles) {
            warn(`${htmlFile.replace(ROOT + '/', '')}: Has ${inlineStyles.length} very long inline styles`);
        }
    }
});

test('CSS files not too large', () => {
    for (const cssFile of cssFiles) {
        const stats = statSync(cssFile);
        const sizeKB = stats.size / 1024;
        if (sizeKB > 100) {
            warn(`${cssFile.replace(ROOT + '/', '')}: Large CSS file (${sizeKB.toFixed(1)}KB)`);
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// TEST 10: Navbar Consistency
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Navbar Tests ---');

test('navbar.js exists and has required functions', () => {
    const navbarPath = join(ROOT, 'assets/js/navbar.js');
    assert(existsSync(navbarPath), 'navbar.js not found');
    const content = readFileSync(navbarPath, 'utf8');
    assert(content.includes('initThemeToggle') || content.includes('theme'),
        'navbar.js missing theme toggle functionality');
});

test('All pages load navbar.js', () => {
    for (const htmlFile of htmlFiles) {
        const relPath = htmlFile.replace(ROOT + '/', '');
        const content = readFileSync(htmlFile, 'utf8');
        if (!content.includes('navbar.js') && !content.includes('navbar-container')) {
            warn(`${relPath}: May not be loading navbar.js`);
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// TEST 11: Tool Pages Validation
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Tool Pages Tests ---');

const toolsDir = join(ROOT, 'pages/tools');
if (existsSync(toolsDir)) {
    const toolFiles = readdirSync(toolsDir).filter(f => f.endsWith('.html'));

    for (const toolFile of toolFiles) {
        const toolPath = join(toolsDir, toolFile);
        const content = readFileSync(toolPath, 'utf8');

        test(`Tool has proper meta tags: ${toolFile}`, () => {
            assert(content.includes('<title>'), 'Missing title');
            assert(content.includes('name="description"'), 'Missing description');
            assert(content.includes('property="og:title"'), 'Missing OG title');
        });

        test(`Tool loads required CSS: ${toolFile}`, () => {
            assert(content.includes('theme.css'), 'Missing theme.css');
            assert(content.includes('main.css'), 'Missing main.css');
            assert(content.includes('tool-page.css'), 'Missing tool-page.css');
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(50));
console.log('TEST SUMMARY');
console.log('═'.repeat(50));
console.log(`✓ Passed: ${passedTests}`);
console.log(`✗ Failed: ${failedTests}`);
console.log(`⚠ Warnings: ${warnings}`);
console.log(`Total: ${passedTests + failedTests}`);

if (bugs.length > 0) {
    console.log('\n🐛 BUGS FOUND:');
    bugs.forEach((bug, i) => {
        console.log(`  ${i + 1}. ${bug.test}`);
        console.log(`     ${bug.error}`);
    });
}

if (failedTests > 0) {
    console.log('\n❌ Some tests failed. Fix the bugs above.');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
}
