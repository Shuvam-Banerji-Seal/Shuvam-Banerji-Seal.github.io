/**
 * Dynamic Navbar Generator
 * Ensures consistency across all pages
 */

document.addEventListener('DOMContentLoaded', function () {
    const navbarContainer = document.getElementById('navbar-container');
    if (!navbarContainer) return;

    // Determine current page and path depth
    const currentPath = window.location.pathname;
    const isHome = currentPath.endsWith('index.html') || currentPath.endsWith('/');
    const pathDepth = isHome ? '' : '../';

    // Define navigation links
    const navLinks = [
        { name: 'About', href: isHome ? '#about' : '../index.html#about' },
        { name: 'Resume', href: isHome ? 'pages/resume.html' : 'resume.html' },
        { name: 'Projects', href: isHome ? '#projects' : '../index.html#projects' },
        { name: 'GitHub', href: isHome ? 'pages/github-projects.html' : 'github-projects.html' },
        { name: 'Gallery', href: isHome ? 'pages/gallery.html' : 'gallery.html' },
        { name: 'Blog', href: isHome ? 'pages/blog.html' : 'blog.html' },
        { name: 'E-Reader', href: isHome ? 'pages/reader.html' : 'reader.html' },
        { name: 'Notes', href: isHome ? 'pages/notes.html' : 'notes.html' },
        { name: 'Thermo', href: isHome ? 'pages/thermodynamics.html' : 'thermodynamics.html' },
        { name: 'Music', href: isHome ? 'pages/music.html' : 'music.html' },
        { name: 'Tools', href: isHome ? 'pages/tools.html' : 'tools.html' },
    ];

    // Build Navbar HTML
    const navbarHTML = `
    <nav id="navbar" class="${!isHome ? 'scrolled' : ''}">
        <div class="container nav-content glassmorphic">
            <a href="${isHome ? 'index.html' : '../index.html'}" class="nav-logo">
                <i data-lucide="atom" class="mr-2"></i>
                <span>Shuvam Banerji Seal</span>
            </a>
            <div class="nav-links">
                ${navLinks.map(link => `
                    <a href="${link.href}" class="nav-link ${isActive(link.href) ? 'active' : ''}">
                        ${link.name}
                    </a>
                `).join('')}
                <a href="${isHome ? '#contact' : '../index.html#contact'}" class="btn btn-primary">Contact</a>
            </div>
            <div class="nav-actions">
                <button data-theme-toggle class="theme-toggle-btn" aria-label="Toggle theme">
                    <i data-lucide="moon" class="w-5 h-5"></i>
                </button>
                <button id="menu-btn" aria-label="Open mobile menu">
                    <i data-lucide="menu" class="w-6 h-6"></i>
                </button>
            </div>
        </div>
    </nav>
    `;

    navbarContainer.innerHTML = navbarHTML;

    // Create Mobile Menu separately and append to body
    const mobileMenuHTML = `
    <div id="mobile-menu">
        <button id="close-menu-btn">
            <i data-lucide="x" class="w-8 h-8"></i>
        </button>
        ${navLinks.map(link => `
            <a href="${link.href}" class="mobile-menu-link ${isActive(link.href) ? 'active' : ''}">
                ${link.name}
            </a>
        `).join('')}
        <a href="${isHome ? '#contact' : '../index.html#contact'}" class="btn btn-primary mobile-menu-link">Contact</a>
        <button data-theme-toggle class="theme-toggle-btn mobile-menu-link">Toggle Theme</button>
    </div>
    <div id="mobile-menu-backdrop"></div>
    `;

    // Remove existing mobile menu if any (to prevent duplicates on re-run)
    const existingMenu = document.getElementById('mobile-menu');
    if (existingMenu) existingMenu.remove();
    const existingBackdrop = document.getElementById('mobile-menu-backdrop');
    if (existingBackdrop) existingBackdrop.remove();

    document.body.insertAdjacentHTML('beforeend', mobileMenuHTML);

    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Initialize Mobile Menu Logic Directly
    initMobileMenuLogic();
});

function initMobileMenuLogic() {
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const backdrop = document.getElementById('mobile-menu-backdrop');
    const mobileLinks = document.querySelectorAll('.mobile-menu-link');

    function openMenu() {
        if (mobileMenu) mobileMenu.classList.add('active');
        if (backdrop) backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (backdrop) backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openMenu();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeMenu();
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', closeMenu);
    }

    // Close menu when clicking a link
    mobileLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });

    // Dispatch event to signal navbar is ready
    document.dispatchEvent(new Event('navbarLoaded'));
}

function isActive(href) {
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop() || 'index.html';

    // Handle anchor links on home page
    if (href.startsWith('#') && (filename === 'index.html' || filename === '')) {
        return false; // Let scroll spy handle this
    }

    // Handle page links
    if (href.includes(filename) && filename !== 'index.html') {
        return true;
    }

    return false;
}
