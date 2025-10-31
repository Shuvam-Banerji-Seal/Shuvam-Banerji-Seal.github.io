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
        lucide.createIcons();
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
        select.innerHTML = '<option value="">Select a book...</option>';
        
        this.books.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = `${book.title} by ${book.author}`;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        document.getElementById('book-select').addEventListener('change', (e) => {
            this.selectBook(e.target.value);
        });

        document.getElementById('prev-chapter').addEventListener('click', () => {
            this.navigateChapter(-1);
        });

        document.getElementById('next-chapter').addEventListener('click', () => {
            this.navigateChapter(1);
        });
    }

    selectBook(bookId) {
        if (!bookId) {
            this.hideChapterNavigation();
            this.clearContent();
            return;
        }

        this.currentBook = this.books.find(b => b.id === bookId);
        if (!this.currentBook) return;

        this.currentChapterIndex = 0;
        this.displayChapterNavigation();
        this.loadChapter(0);
    }

    displayChapterNavigation() {
        const navDiv = document.getElementById('chapter-navigation');
        const chapterList = document.getElementById('chapter-list');
        
        navDiv.style.display = 'block';
        chapterList.innerHTML = '';

        this.currentBook.chapters.forEach((chapter, index) => {
            const btn = document.createElement('button');
            btn.className = 'chapter-btn';
            btn.textContent = `Chapter ${chapter.number}: ${chapter.title}`;
            btn.onclick = () => this.loadChapter(index);
            chapterList.appendChild(btn);
        });
    }

    hideChapterNavigation() {
        document.getElementById('chapter-navigation').style.display = 'none';
        document.getElementById('reader-controls').style.display = 'none';
    }

    clearContent() {
        document.getElementById('reader-content-area').innerHTML = '';
    }

    async loadChapter(chapterIndex) {
        if (chapterIndex < 0 || chapterIndex >= this.currentBook.chapters.length) {
            return;
        }

        this.currentChapterIndex = chapterIndex;
        const chapter = this.currentBook.chapters[chapterIndex];

        const contentArea = document.getElementById('reader-content-area');
        contentArea.innerHTML = '<div class="loading">Loading chapter...</div>';

        try {
            const response = await fetch(chapter.path);
            if (!response.ok) throw new Error('Failed to load chapter');

            const markdown = await response.text();
            const html = this.renderMarkdown(markdown);

            contentArea.innerHTML = `
                <div class="reader-content glassmorphic card">
                    <div class="chapter-info" style="text-align: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid var(--border-color);">
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">${this.currentBook.title}</p>
                        <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">Chapter ${chapter.number}</h1>
                        <h2 style="font-size: 1.8rem; color: var(--accent-color);">${chapter.title}</h2>
                    </div>
                    ${html}
                </div>
            `;

            // Update chapter buttons
            document.querySelectorAll('.chapter-btn').forEach((btn, idx) => {
                if (idx === chapterIndex) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Show/hide navigation buttons
            this.updateNavigationButtons();

            // Render math equations if present
            if (window.renderMathInElement) {
                renderMathInElement(document.getElementById('reader-content-area'), {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false}
                    ]
                });
            }

            lucide.createIcons();
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            contentArea.innerHTML = `<div class="loading" style="color: red;">Error loading chapter: ${error.message}</div>`;
        }
    }

    renderMarkdown(markdown) {
        // Use marked.js to convert markdown to HTML
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: true,
                mangle: false
            });
            return marked.parse(markdown);
        }
        
        // Fallback simple markdown rendering
        let html = markdown;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold and italic
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Horizontal rules
        html = html.replace(/^---$/gim, '<hr>');
        
        // Paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        // Lists
        html = html.replace(/<p>- (.*?)<\/p>/g, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        return html;
    }

    updateNavigationButtons() {
        const controls = document.getElementById('reader-controls');
        controls.style.display = 'flex';

        const prevBtn = document.getElementById('prev-chapter');
        const nextBtn = document.getElementById('next-chapter');

        prevBtn.disabled = this.currentChapterIndex === 0;
        nextBtn.disabled = this.currentChapterIndex === this.currentBook.chapters.length - 1;

        if (prevBtn.disabled) {
            prevBtn.style.opacity = '0.5';
            prevBtn.style.cursor = 'not-allowed';
        } else {
            prevBtn.style.opacity = '1';
            prevBtn.style.cursor = 'pointer';
        }

        if (nextBtn.disabled) {
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
        } else {
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
        }
    }

    navigateChapter(direction) {
        const newIndex = this.currentChapterIndex + direction;
        if (newIndex >= 0 && newIndex < this.currentBook.chapters.length) {
            this.loadChapter(newIndex);
        }
    }

    // Utility method to extract book title from folder name
    static extractTitleFromFolderName(folderName) {
        // Example: "Book_1_(The_Journey_of_Adi)" -> "The Journey of Adi"
        const match = folderName.match(/\(([^)]+)\)/);
        if (match) {
            return match[1].replace(/_/g, ' ');
        }
        return folderName.replace(/_/g, ' ');
    }

    // Utility method to extract chapter info from folder name
    static extractChapterInfo(folderName) {
        // Example: "Chapter_01_(The_Beginning)" -> { number: 1, title: "The Beginning" }
        const numberMatch = folderName.match(/Chapter_(\d+)/);
        const titleMatch = folderName.match(/\(([^)]+)\)/);
        
        return {
            number: numberMatch ? parseInt(numberMatch[1]) : 0,
            title: titleMatch ? titleMatch[1].replace(/_/g, ' ') : 'Untitled'
        };
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
