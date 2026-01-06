import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const POSTS_DIR = join(__dirname, '../public/posts');
const OUTPUT_FILE = join(__dirname, '../public/blog-manifest.json');

// Ensure posts directory exists
if (!existsSync(POSTS_DIR)) {
    console.error(`Posts directory not found: ${POSTS_DIR}`);
    process.exit(1);
}

const posts = [];

readdirSync(POSTS_DIR).forEach(file => {
    if (extname(file) === '.md') {
        const content = readFileSync(join(POSTS_DIR, file), 'utf-8');
        const metadata = parseFrontMatter(content);

        if (metadata) {
            posts.push({
                filename: file,
                ...metadata
            });
        }
    }
});

// Sort by date descending
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));
console.log(`Generated blog manifest with ${posts.length} posts.`);

function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
        const frontMatter = match[1];
        const metadata = {};

        frontMatter.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                let value = valueParts.join(':').trim();

                // Handle arrays (e.g., tags: [a, b, c])
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1).split(',').map(s => s.trim());
                }

                metadata[key.trim()] = value;
            }
        });

        return metadata;
    }
    return null;
}
