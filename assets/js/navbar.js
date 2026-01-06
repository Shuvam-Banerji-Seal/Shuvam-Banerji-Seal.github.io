/**
 * Dynamic Navbar Generator with Dropdown Menus
 * Modern responsive navigation with organized menu structure
 */

document.addEventListener('DOMContentLoaded', function () {
    const navbarContainer = document.getElementById('navbar-container');
    if (!navbarContainer) return;

    // Determine current page and path depth
    const currentPath = window.location.pathname;
    const isHome = currentPath.endsWith('index.html') || currentPath.endsWith('/');
    const isToolsPage = currentPath.includes('/tools/');
    const pathDepth = isHome ? '' : isToolsPage ? '../../' : '../';

    // Define navigation structure with dropdowns
    const navStructure = [
        { name: 'About', href: isHome ? '#about' : pathDepth + 'index.html#about', type: 'link' },
        { name: 'Resume', href: isHome ? 'pages/resume.html' : (isToolsPage ? '../resume.html' : 'resume.html'), type: 'link' },
        { name: 'Projects', href: isHome ? '#projects' : pathDepth + 'index.html#projects', type: 'link' },
        {
            name: 'Resources',
            type: 'dropdown',
            items: [
                { name: 'GitHub Projects', href: isHome ? 'pages/github-projects.html' : (isToolsPage ? '../github-projects.html' : 'github-projects.html'), icon: 'github' },
                { name: 'Gallery', href: isHome ? 'pages/gallery.html' : (isToolsPage ? '../gallery.html' : 'gallery.html'), icon: 'image' },
                { name: 'Blog', href: isHome ? 'pages/blog.html' : (isToolsPage ? '../blog.html' : 'blog.html'), icon: 'book-open' },
                { name: 'Notes', href: isHome ? 'pages/notes.html' : (isToolsPage ? '../notes.html' : 'notes.html'), icon: 'file-text' },
            ]
        },
        {
            name: 'Apps',
            type: 'dropdown',
            items: [
                { name: 'E-Reader', href: isHome ? 'pages/reader.html' : (isToolsPage ? '../reader.html' : 'reader.html'), icon: 'book' },
                { name: 'Music Player', href: isHome ? 'pages/music.html' : (isToolsPage ? '../music.html' : 'music.html'), icon: 'music' },
                { name: 'Mermaid Editor', href: isHome ? 'pages/mermaid-tool.html' : (isToolsPage ? '../mermaid-tool.html' : 'mermaid-tool.html'), icon: 'git-branch' },
                { name: 'Audio Studio', href: isHome ? 'pages/tools/audio-studio.html' : (isToolsPage ? 'audio-studio.html' : 'tools/audio-studio.html'), icon: 'mic' },
                { name: 'Thermodynamics', href: isHome ? 'pages/thermodynamics.html' : (isToolsPage ? '../thermodynamics.html' : 'thermodynamics.html'), icon: 'thermometer' },
            ]
        },
        {
            name: 'Tools',
            type: 'dropdown',
            items: [
                { name: 'All Tools', href: isHome ? 'pages/tools.html' : (isToolsPage ? '../tools.html' : 'tools.html'), icon: 'wrench', divider: true },
                { name: 'LLM Chat', href: isHome ? 'pages/tools/llm-chat.html' : (isToolsPage ? 'llm-chat.html' : 'tools/llm-chat.html'), icon: 'message-circle' },
                { name: 'Research Papers', href: isHome ? 'pages/tools/paper-finder.html' : (isToolsPage ? 'paper-finder.html' : 'tools/paper-finder.html'), icon: 'search' },
                { name: 'PDF to JPG', href: isHome ? 'pages/tools/pdf-to-jpg.html' : (isToolsPage ? 'pdf-to-jpg.html' : 'tools/pdf-to-jpg.html'), icon: 'image' },
                { name: 'PDF Compressor', href: isHome ? 'pages/tools/pdf-reducer.html' : (isToolsPage ? 'pdf-reducer.html' : 'tools/pdf-reducer.html'), icon: 'minimize-2' },
                { name: 'Molecule 3D', href: isHome ? 'pages/tools/molecule-viz.html' : (isToolsPage ? 'molecule-viz.html' : 'tools/molecule-viz.html'), icon: 'atom' },
                { name: 'Periodic Table', href: isHome ? 'pages/tools/periodic-table.html' : (isToolsPage ? 'periodic-table.html' : 'tools/periodic-table.html'), icon: 'table-2' },
                { name: 'Unit Converter', href: isHome ? 'pages/tools/unit-converter.html' : (isToolsPage ? 'unit-converter.html' : 'tools/unit-converter.html'), icon: 'ruler' },
                { name: 'Mol. Weight Calc', href: isHome ? 'pages/tools/mol-weight.html' : (isToolsPage ? 'mol-weight.html' : 'tools/mol-weight.html'), icon: 'calculator' },
                { name: 'Equation Balancer', href: isHome ? 'pages/tools/equation-balancer.html' : (isToolsPage ? 'equation-balancer.html' : 'tools/equation-balancer.html'), icon: 'scale' },
                { name: 'pH Calculator', href: isHome ? 'pages/tools/ph-calculator.html' : (isToolsPage ? 'ph-calculator.html' : 'tools/ph-calculator.html'), icon: 'droplet' },
                { name: 'Chemistry Games', href: isHome ? 'pages/tools/games.html' : (isToolsPage ? 'games.html' : 'tools/games.html'), icon: 'gamepad-2' },
            ]
        },
    ];

    // Build Navbar HTML
    const navbarHTML = `
    <nav id="navbar" class="${!isHome ? 'scrolled' : ''}">
        <div class="container nav-content glassmorphic">
            <a href="${isHome ? 'index.html' : pathDepth + 'index.html'}" class="nav-logo">
                <i data-lucide="atom" class="mr-2"></i>
                <span>SBS</span>
            </a>
            <div class="nav-links">
                ${navStructure.map(item => {
        if (item.type === 'dropdown') {
            return `
                        <div class="nav-dropdown">
                            <button class="nav-link dropdown-toggle">
                                ${item.name}
                                <i data-lucide="chevron-down" class="dropdown-arrow"></i>
                            </button>
                            <div class="dropdown-menu">
                                ${item.items.map(subItem => `
                                    <a href="${subItem.href}" class="dropdown-item ${subItem.divider ? 'has-divider' : ''}">
                                        <i data-lucide="${subItem.icon}"></i>
                                        <span>${subItem.name}</span>
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                        `;
        } else {
            return `<a href="${item.href}" class="nav-link ${isActive(item.href) ? 'active' : ''}">${item.name}</a>`;
        }
    }).join('')}
                <a href="${isHome ? '#contact' : pathDepth + 'index.html#contact'}" class="btn btn-primary nav-contact-btn">Contact</a>
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

    // Create Mobile Menu with accordion-style dropdowns
    const mobileMenuHTML = `
    <div id="mobile-menu">
        <div class="mobile-menu-header">
            <span class="mobile-menu-title">Menu</span>
            <button id="close-menu-btn">
                <i data-lucide="x" class="w-8 h-8"></i>
            </button>
        </div>
        <div class="mobile-menu-content">
            ${navStructure.map(item => {
        if (item.type === 'dropdown') {
            return `
                    <div class="mobile-accordion">
                        <button class="mobile-accordion-toggle">
                            <span>${item.name}</span>
                            <i data-lucide="chevron-down" class="accordion-arrow"></i>
                        </button>
                        <div class="mobile-accordion-content">
                            ${item.items.map(subItem => `
                                <a href="${subItem.href}" class="mobile-menu-link mobile-submenu-link">
                                    <i data-lucide="${subItem.icon}"></i>
                                    <span>${subItem.name}</span>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                    `;
        } else {
            return `<a href="${item.href}" class="mobile-menu-link">${item.name}</a>`;
        }
    }).join('')}
            <a href="${isHome ? '#contact' : pathDepth + 'index.html#contact'}" class="btn btn-primary mobile-menu-link">Contact</a>
        </div>
    </div>
    <div id="mobile-menu-backdrop"></div>
    `;

    // Remove existing mobile menu if any
    const existingMenu = document.getElementById('mobile-menu');
    if (existingMenu) existingMenu.remove();
    const existingBackdrop = document.getElementById('mobile-menu-backdrop');
    if (existingBackdrop) existingBackdrop.remove();

    document.body.insertAdjacentHTML('beforeend', mobileMenuHTML);

    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Initialize all navbar functionality
    initDropdowns();
    initMobileMenuLogic();
});

function initDropdowns() {
    const dropdowns = document.querySelectorAll('.nav-dropdown');

    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');

        // Desktop hover behavior
        dropdown.addEventListener('mouseenter', () => {
            menu.classList.add('show');
            toggle.classList.add('active');
        });

        dropdown.addEventListener('mouseleave', () => {
            menu.classList.remove('show');
            toggle.classList.remove('active');
        });

        // Click behavior for touch devices
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = menu.classList.contains('show');

            // Close all other dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
            document.querySelectorAll('.dropdown-toggle').forEach(t => t.classList.remove('active'));

            if (!isOpen) {
                menu.classList.add('show');
                toggle.classList.add('active');
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
        document.querySelectorAll('.dropdown-toggle').forEach(t => t.classList.remove('active'));
    });
}

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

    // Close menu when clicking a link (but not accordion toggles)
    mobileLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Mobile accordion functionality
    const accordionToggles = document.querySelectorAll('.mobile-accordion-toggle');
    accordionToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const accordion = toggle.closest('.mobile-accordion');
            const content = accordion.querySelector('.mobile-accordion-content');

            // Toggle current accordion
            const isOpen = accordion.classList.contains('open');

            // Close all accordions
            document.querySelectorAll('.mobile-accordion').forEach(acc => {
                acc.classList.remove('open');
                acc.querySelector('.mobile-accordion-content').style.maxHeight = null;
            });

            // Open clicked accordion if it was closed
            if (!isOpen) {
                accordion.classList.add('open');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
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

    if (href.startsWith('#') && (filename === 'index.html' || filename === '')) {
        return false;
    }

    if (href.includes(filename) && filename !== 'index.html') {
        return true;
    }

    return false;
}
