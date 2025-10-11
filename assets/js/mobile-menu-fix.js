// Mobile Navigation Fix
(function() {
    'use strict';
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }
    
    function initMobileMenu() {
        const menuBtn = document.getElementById('menu-btn');
        const closeBtn = document.getElementById('close-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const backdrop = document.getElementById('mobile-menu-backdrop');
        const body = document.body;
        
        console.log('Mobile Menu Initialization:', {
            menuBtn: !!menuBtn,
            closeBtn: !!closeBtn,
            mobileMenu: !!mobileMenu,
            backdrop: !!backdrop
        });
        
        if (!menuBtn || !mobileMenu || !backdrop) {
            console.error('Mobile menu elements not found');
            return;
        }
        
        // Open mobile menu
        menuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Opening mobile menu');
            openMenu();
        });
        
        // Close mobile menu
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Closing mobile menu (close button)');
                closeMenu();
            });
        }
        
        // Close menu when clicking backdrop
        backdrop.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Closing mobile menu (backdrop)');
            closeMenu();
        });
        
        // Close menu when clicking links
        const menuLinks = mobileMenu.querySelectorAll('.mobile-menu-link:not([data-theme-toggle])');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                console.log('Closing mobile menu (link click)');
                closeMenu();
            });
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
                console.log('Closing mobile menu (escape key)');
                closeMenu();
            }
        });
        
        function openMenu() {
            mobileMenu.classList.add('is-open');
            backdrop.classList.add('is-open');
            body.style.overflow = 'hidden';
            console.log('Menu opened, classes added');
        }
        
        function closeMenu() {
            mobileMenu.classList.remove('is-open');
            backdrop.classList.remove('is-open');
            body.style.overflow = '';
            console.log('Menu closed, classes removed');
        }
    }
})();
