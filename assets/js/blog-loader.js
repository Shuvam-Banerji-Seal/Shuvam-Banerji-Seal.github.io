document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postFile = urlParams.get('post');

    if (postFile) {
        loadBlogPost(postFile);
    } else {
        loadBlogList();
    }
});

// Active tag filter state
let activeTag = 'all';
let allPosts = [];

async function loadBlogList() {
    const container = document.getElementById('blog-content');
    if (!container) return;

    try {
        let response;
        try {
            response = await fetch('../blog-manifest.json?v=' + Date.now());
            if (!response.ok) throw new Error('Relative path failed');
        } catch (e) {
            response = await fetch('/blog-manifest.json?v=' + Date.now());
        }

        if (!response.ok) throw new Error(`Failed to load blog manifest: ${response.status}`);

        const posts = await response.json();
        allPosts = posts;

        // Update stat count
        const statEl = document.getElementById('stat-count');
        if (statEl) statEl.textContent = posts.length + ' post' + (posts.length !== 1 ? 's' : '');

        if (posts.length === 0) {
            container.innerHTML = '<div class="blog-empty">// no posts found</div>';
            return;
        }

        // Build tag list
        const allTags = ['all', ...new Set(posts.flatMap(p => p.tags || []))];
        const tagContainer = document.getElementById('tag-filters');
        if (tagContainer) {
            tagContainer.innerHTML = allTags.map(tag =>
                `<button class="tag-filter-btn${tag === 'all' ? ' active' : ''}" data-tag="${tag}">${tag}</button>`
            ).join('');
            tagContainer.querySelectorAll('.tag-filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    activeTag = btn.dataset.tag;
                    tagContainer.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderCards(allPosts);
                });
            });
        }

        // Show filter bar
        const filterBar = document.getElementById('filter-bar');
        if (filterBar) filterBar.style.display = 'flex';

        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => renderCards(allPosts));
        }

        renderCards(posts);

    } catch (error) {
        console.error('Error loading blog list:', error);
        container.innerHTML = `<div class="blog-empty">// error loading posts<br><span style="color:var(--text-muted);font-size:.8rem">${error.message}</span></div>`;
    }
}

function renderCards(posts) {
    const container = document.getElementById('blog-content');
    if (!container) return;

    const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase();

    const filtered = posts.filter(post => {
        const matchTag = activeTag === 'all' || (post.tags || []).map(t => t.toLowerCase()).includes(activeTag.toLowerCase());
        const matchSearch = !searchVal ||
            post.title.toLowerCase().includes(searchVal) ||
            (post.description || '').toLowerCase().includes(searchVal) ||
            (post.tags || []).some(t => t.toLowerCase().includes(searchVal));
        return matchTag && matchSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<div class="blog-empty">// no matching posts</div>';
        return;
    }

    let html = '<div class="blog-grid">';
    filtered.forEach(post => {
        const dateStr = post.date ? new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        const tags = (post.tags || []).map(t => `<span class="card-tag">${t}</span>`).join('');
        const filename = post.filename || '';
        html += `
            <article class="blog-card">
                <div class="card-titlebar">
                    <div class="card-dots">
                        <span class="cdot cdot-r"></span>
                        <span class="cdot cdot-y"></span>
                        <span class="cdot cdot-g"></span>
                    </div>
                    <span class="card-file">${filename.replace('.md', '')}.md</span>
                </div>
                <div class="card-body">
                    <div class="card-tags">${tags}</div>
                    <a href="?post=${filename}" class="card-title">${post.title}</a>
                    <div class="card-excerpt">${post.description || 'Click to read more...'}</div>
                    <div class="card-footer">
                        <span class="card-date">${dateStr}</span>
                        <a href="?post=${filename}" class="card-read">read <span class="card-read-arrow">&rarr;</span></a>
                    </div>
                </div>
            </article>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

async function loadBlogPost(filename) {
    const container = document.getElementById('blog-content');
    if (!container) return;

    container.innerHTML = '<div class="blog-loading"><span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span><span style="margin-left:.5rem;">loading post&hellip;</span></div>';

    try {
        let response;
        try {
            response = await fetch(`../posts/${filename}`);
            if (!response.ok) throw new Error('Relative path failed');
        } catch (e) {
            response = await fetch(`/posts/${filename}`);
        }

        if (!response.ok) throw new Error('Failed to load post');

        const text = await response.text();

        // Separate frontmatter and content
        const parts = text.split(/^---\s*$/m);
        let content = text;
        let metadata = {};

        if (parts.length >= 3) {
            const frontMatter = parts[1];
            content = parts.slice(2).join('---');
            metadata = parseFrontMatter(frontMatter);
        }

        // Configure Marked
        marked.setOptions({
            highlight: function (code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true
        });

        // Render Markdown
        let htmlContent = marked.parse(content);

        // Render Math (KaTeX)
        htmlContent = htmlContent.replace(/\$\$([\s\S]+?)\$\$/g, (match, equation) => {
            try { return katex.renderToString(equation, { displayMode: true }); } catch (e) { return match; }
        });
        htmlContent = htmlContent.replace(/\$([^$]+?)\$/g, (match, equation) => {
            try { return katex.renderToString(equation, { displayMode: false }); } catch (e) { return match; }
        });

        const title = metadata.title || 'Untitled Post';
        const tags = (metadata.tags || []).map(t => `<span class="post-tag">${t}</span>`).join('');
        const dateStr = metadata.date ? new Date(metadata.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        const wordCount = content.trim().split(/\s+/).length;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));

        const pageHtml = `
            <a href="blog.html" class="post-back-link">&larr; back to blog</a>
            <div class="post-container">
                <div class="post-terminal">
                    <div class="post-titlebar">
                        <div class="titlebar-dots" style="display:flex;gap:5px;">
                            <span style="width:11px;height:11px;border-radius:50%;background:#ff5f57;display:inline-block;"></span>
                            <span style="width:11px;height:11px;border-radius:50%;background:#febc2e;display:inline-block;"></span>
                            <span style="width:11px;height:11px;border-radius:50%;background:#28c840;display:inline-block;"></span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:.72rem;color:var(--text-muted);">${filename}</span>
                        <span style="font-family:var(--font-mono);font-size:.72rem;color:var(--text-muted);">${readTime} min read</span>
                    </div>
                    <div class="post-header">
                        <div class="post-tags">${tags}</div>
                        <h1 class="post-title">${title}</h1>
                        <div class="post-meta">
                            <span>${dateStr}</span>
                            <span>&bull; ~${readTime} min read</span>
                            <span>&bull; ${wordCount} words</span>
                        </div>
                    </div>
                    <div class="post-body">
                        <div class="prose">${htmlContent}</div>
                    </div>
                </div>
            </div>`;

        container.innerHTML = pageHtml;
        window.scrollTo(0, 0);

        // Re-run highlight.js on newly inserted code blocks
        document.querySelectorAll('.prose pre code').forEach(block => hljs.highlightElement(block));

    } catch (error) {
        console.error('Error loading blog post:', error);
        container.innerHTML = `<div class="blog-empty">// error loading post<br><span style="font-size:.8rem;color:var(--text-muted)">${error.message}</span></div>`;
    }
}

function parseFrontMatter(frontMatter) {
    const metadata = {};
    frontMatter.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
            let value = valueParts.join(':').trim();
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
            }
            metadata[key.trim()] = value;
        }
    });
    return metadata;
}
