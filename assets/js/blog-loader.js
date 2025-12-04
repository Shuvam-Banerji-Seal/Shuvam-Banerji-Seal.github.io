document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postFile = urlParams.get('post');

    if (postFile) {
        loadBlogPost(postFile);
    } else {
        loadBlogList();
    }
});

async function loadBlogList() {
    const container = document.getElementById('blog-content');
    if (!container) return;

    container.innerHTML = '<div class="text-center"><span class="loading-spinner"></span> Loading posts...</div>';

    try {
        const response = await fetch('../assets/blog-manifest.json');
        if (!response.ok) throw new Error('Failed to load blog manifest');

        const posts = await response.json();

        if (posts.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">No posts found.</p>';
            return;
        }

        let html = '<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">';

        posts.forEach(post => {
            html += `
                <article class="card glassmorphic blog-post-card animate-on-scroll">
                    <header>
                        <div class="mb-2">
                            ${post.tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('')}
                        </div>
                        <h2 class="blog-title">
                            <a href="?post=${post.filename}">${post.title}</a>
                        </h2>
                        <p class="blog-meta">Published on: ${new Date(post.date).toLocaleDateString()}</p>
                    </header>
                    <p class="blog-excerpt">
                        ${post.description || 'Click to read more...'}
                    </p>
                    <a href="?post=${post.filename}" class="read-more-link">Read More <i data-lucide="arrow-right" class="inline-block w-4 h-4 ml-1"></i></a>
                </article>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Re-initialize icons and animations
        if (typeof lucide !== 'undefined') lucide.createIcons();
        observeScrollAnimations();

    } catch (error) {
        console.error('Error loading blog list:', error);
        container.innerHTML = `<p class="text-center text-red-500">Error loading posts. Please try again later.</p>`;
    }
}

async function loadBlogPost(filename) {
    const container = document.getElementById('blog-content');
    if (!container) return;

    container.innerHTML = '<div class="text-center"><span class="loading-spinner"></span> Loading post...</div>';

    try {
        const response = await fetch(`../assets/posts/${filename}`);
        if (!response.ok) throw new Error('Failed to load post');

        const text = await response.text();

        // Separate frontmatter and content
        const parts = text.split(/^---\s*$/m);
        let content = text;
        let metadata = {};

        if (parts.length >= 3) {
            // Has frontmatter
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
        // Replace $$...$$ block math
        htmlContent = htmlContent.replace(/\$\$([\s\S]+?)\$\$/g, (match, equation) => {
            try {
                return katex.renderToString(equation, { displayMode: true });
            } catch (e) {
                return match;
            }
        });

        // Replace $...$ inline math
        htmlContent = htmlContent.replace(/\$([^$]+?)\$/g, (match, equation) => {
            try {
                return katex.renderToString(equation, { displayMode: false });
            } catch (e) {
                return match;
            }
        });

        // Build Page
        const pageHtml = `
            <div class="max-w-4xl mx-auto">
                <a href="blog.html" class="btn btn-secondary mb-8 inline-flex items-center">
                    <i data-lucide="arrow-left" class="mr-2"></i> Back to Blog
                </a>
                
                <article class="glassmorphic p-8 rounded-xl">
                    <header class="mb-8 text-center">
                        <div class="mb-4">
                            ${(metadata.tags || []).map(tag => `<span class="tech-tag mr-2">${tag}</span>`).join('')}
                        </div>
                        <h1 class="text-4xl font-bold mb-4 gradient-text">${metadata.title || 'Untitled Post'}</h1>
                        <p class="text-gray-500 dark:text-gray-400">
                            Published on: ${metadata.date ? new Date(metadata.date).toLocaleDateString() : 'Unknown Date'}
                        </p>
                    </header>
                    
                    <div class="prose dark:prose-invert max-w-none">
                        ${htmlContent}
                    </div>
                </article>
            </div>
        `;

        container.innerHTML = pageHtml;

        // Re-initialize icons
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Scroll to top
        window.scrollTo(0, 0);

    } catch (error) {
        console.error('Error loading blog post:', error);
        container.innerHTML = `<p class="text-center text-red-500">Error loading post. Please try again later.</p>`;
    }
}

function parseFrontMatter(frontMatter) {
    const metadata = {};
    frontMatter.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
            let value = valueParts.join(':').trim();
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(s => s.trim());
            }
            metadata[key.trim()] = value;
        }
    });
    return metadata;
}

function observeScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
}
