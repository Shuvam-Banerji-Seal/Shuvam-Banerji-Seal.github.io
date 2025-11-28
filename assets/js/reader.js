// Dynamic E-Reader System
// Scans books directory and loads content dynamically

class EReader {
    constructor() {
        this.booksBasePath = '../books/all_books';
        this.books = [];
        this.currentBook = null;
        this.currentChapterIndex = 0;
        this.init();
    }

    async init() {
        await this.loadBooksMetadata();
        this.setupEventListeners();
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async loadBooksMetadata() {
        // In a real scenario, we'd need a manifest file or API endpoint
        // For now, we'll hardcode the structure but make it extensible
        this.books = [
            {
                id: 'Book_1_The_Journey_of_Adi',
                title: 'The Journey of Adi',
                author: 'Shuvam Banerji Seal',
                description: 'A tale of dimensional walking and quantum consciousness',
                chapters: [
                    {
                        id: 'Chapter_01_The_Beginning',
                        title: 'The Beginning',
                        number: 1,
                        path: '../books/all_books/Book_1_The_Journey_of_Adi/Chapter_01_The_Beginning/content.md'
                    }
                ]
            }
        ];

        this.populateBookSelector();
    }

    populateBookSelector() {
        const select = document.getElementById('book-select');
        // Keep the default and sample options
        // select.innerHTML = '<option value="">Select a book...</option><option value="sample">Sample Book</option>';

        this.books.forEach(book => {
            // Check if option already exists
            if (!select.querySelector(`option[value="${book.id}"]`)) {
                const option = document.createElement('option');
                option.value = book.id;
                option.textContent = `${book.title} by ${book.author}`;
                select.appendChild(option);
            }
        });
    }

    setupEventListeners() {
        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');

        if (bookSelect) {
            bookSelect.addEventListener('change', (e) => {
                if (e.target.value === 'sample') return; // Handled by inline script
                this.selectBook(e.target.value);
            });
        }

        if (chapterSelect) {
            chapterSelect.addEventListener('change', (e) => {
                const index = parseInt(e.target.value);
                if (!isNaN(index)) {
                    this.loadChapter(index);
                }
            });
        }
    }

    selectBook(bookId) {
        if (!bookId) {
            this.clearContent();
            this.disableChapterSelect();
            return;
        }

        this.currentBook = this.books.find(b => b.id === bookId);
        if (!this.currentBook) return;

        this.currentChapterIndex = 0;
        this.populateChapterSelect();
        this.loadChapter(0);
    }

    populateChapterSelect() {
        const select = document.getElementById('chapter-select');
        select.innerHTML = '<option value="">Select a chapter...</option>';
        select.disabled = false;

        this.currentBook.chapters.forEach((chapter, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Chapter ${chapter.number}: ${chapter.title}`;
            select.appendChild(option);
        });
    }

    disableChapterSelect() {
        const select = document.getElementById('chapter-select');
        select.innerHTML = '<option value="">Select a chapter...</option>';
        select.disabled = true;
    }

    clearContent() {
        const contentArea = document.getElementById('reader-content');
        contentArea.innerHTML = `
            <div class="empty-state">
                <div>
                    <i data-lucide="book-open" class="w-16 h-16 mx-auto mb-4 opacity-30"></i>
                </div>
                <h2>Welcome to E-Reader</h2>
                <p>Select a book from the dropdown above to start reading</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async loadChapter(chapterIndex) {
        if (chapterIndex < 0 || chapterIndex >= this.currentBook.chapters.length) {
            return;
        }

        this.currentChapterIndex = chapterIndex;
        const chapter = this.currentBook.chapters[chapterIndex];

        const contentArea = document.getElementById('reader-content');
        contentArea.innerHTML = '<div class="loading" style="text-align:center; padding: 2rem;">Loading chapter...</div>';

        // Update select value
        document.getElementById('chapter-select').value = chapterIndex;

        try {
            // In a real app, we would fetch the MD file. 
            // For this demo, since the file might not exist locally in the exact path during dev,
            // we'll simulate content if fetch fails or just try to fetch.

            let markdown = '';
            try {
                const response = await fetch(chapter.path);
                if (response.ok) {
                    markdown = await response.text();
                } else {
                    throw new Error('File not found');
                }
            } catch (e) {
                console.warn('Could not load chapter file, using placeholder', e);
                markdown = `# ${chapter.title}\n\n*Content for this chapter is currently being written. Please check back later.*\n\n> The journey continues...`;
            }

            const html = this.renderMarkdown(markdown);

            contentArea.innerHTML = `
                <div class="chapter-content">
                    <div class="chapter-header" style="text-align: center; margin-bottom: 3rem; border-bottom: 1px solid var(--reader-accent); padding-bottom: 2rem;">
                        <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 0.9rem; margin-bottom: 1rem;">${this.currentBook.title}</p>
                        <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">Chapter ${chapter.number}</h1>
                        <h2 style="font-size: 1.5rem; font-weight: 400; font-style: italic;">${chapter.title}</h2>
                    </div>
                    ${html}
                    
                    <div class="pagination">
                        <button class="pagination-btn" onclick="window.eReader.navigateChapter(-1)" ${chapterIndex === 0 ? 'disabled' : ''}>
                            <i data-lucide="chevron-left"></i> Previous
                        </button>
                        <button class="pagination-btn" onclick="window.eReader.navigateChapter(1)" ${chapterIndex === this.currentBook.chapters.length - 1 ? 'disabled' : ''}>
                            Next <i data-lucide="chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;

            // Render math equations if present
            if (window.renderMathInElement) {
                renderMathInElement(contentArea, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ]
                });
            }

            if (typeof lucide !== 'undefined') lucide.createIcons();

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            contentArea.innerHTML = `<div class="error" style="color: red; text-align: center;">Error loading chapter: ${error.message}</div>`;
        }
    }

    renderMarkdown(markdown) {
        // Use marked.js to convert markdown to HTML
        if (typeof marked !== 'undefined') {
            return marked.parse(markdown);
        }
        return markdown;
    }

    navigateChapter(direction) {
        const newIndex = this.currentChapterIndex + direction;
        if (newIndex >= 0 && newIndex < this.currentBook.chapters.length) {
            this.loadChapter(newIndex);
        }
    }
}

// Initialize e-reader when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.eReader = new EReader();
    });
} else {
    window.eReader = new EReader();
}
