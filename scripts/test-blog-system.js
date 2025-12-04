const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Running Blog System Tests...');

// Test 1: Verify Manifest Generation Logic
console.log('Test 1: Verifying Manifest Generator...');
try {
    const manifestPath = path.join(__dirname, '../assets/blog-manifest.json');
    if (!fs.existsSync(manifestPath)) {
        throw new Error('Manifest file does not exist');
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    assert(Array.isArray(manifest), 'Manifest should be an array');
    assert(manifest.length > 0, 'Manifest should not be empty');

    const post = manifest[0];
    assert(post.title, 'Post should have a title');
    assert(post.date, 'Post should have a date');
    assert(post.filename, 'Post should have a filename');
    assert(Array.isArray(post.tags), 'Tags should be an array');

    console.log('✅ Manifest structure is valid.');
} catch (error) {
    console.error('❌ Test 1 Failed:', error.message);
    process.exit(1);
}

// Test 2: Verify Markdown Frontmatter Parsing
console.log('Test 2: Verifying Sample Post Frontmatter...');
try {
    const postPath = path.join(__dirname, '../assets/posts/welcome.md');
    const content = fs.readFileSync(postPath, 'utf-8');

    const match = content.match(/^---\n([\s\S]*?)\n---/);
    assert(match, 'Post should have frontmatter');

    const frontMatter = match[1];
    assert(frontMatter.includes('title:'), 'Frontmatter should contain title');
    assert(frontMatter.includes('date:'), 'Frontmatter should contain date');

    console.log('✅ Sample post frontmatter is valid.');
} catch (error) {
    console.error('❌ Test 2 Failed:', error.message);
    process.exit(1);
}

console.log('🎉 All Blog System Tests Passed!');
