// Enhanced Animation Controller
class AnimationController {
    constructor() {
        this.observedElements = new Set();
        this.init();
    }

    init() {
        this.createIntersectionObserver();
        this.initParallaxElements();
        this.initMagneticElements();
        this.initTypewriterEffect();
        this.initMobileOptimizations();
    }

    createIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, options);

        // Observe all animation elements
        document.querySelectorAll('[data-animate]').forEach(el => {
            this.observer.observe(el);
        });
    }

    animateElement(element) {
        const animationType = element.dataset.animate;
        const delay = element.dataset.delay || 0;

        setTimeout(() => {
            switch (animationType) {
                case 'fade-in':
                    element.style.animation = 'staggerFadeIn 0.6s ease-out forwards';
                    break;
                case 'slide-left':
                    element.style.animation = 'slideInLeft 0.8s ease-out forwards';
                    break;
                case 'slide-right':
                    element.style.animation = 'slideInRight 0.8s ease-out forwards';
                    break;
                case 'scale-up':
                    element.style.animation = 'scaleUp 0.6s ease-out forwards';
                    break;
                case 'rotate-in':
                    element.style.animation = 'rotateIn 0.8s ease-out forwards';
                    break;
                default:
                    element.classList.add('is-visible');
            }
        }, delay);
    }

    initParallaxElements() {
        if (window.innerWidth <= 768) return; // Skip on mobile for performance

        const parallaxElements = document.querySelectorAll('.parallax-element');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            parallaxElements.forEach(element => {
                const rate = scrolled * -0.5;
                element.style.transform = `translateY(${rate}px)`;
            });
        });
    }

    initMagneticElements() {
        const magneticElements = document.querySelectorAll('.magnetic');
        
        magneticElements.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                if (window.innerWidth <= 768) return; // Skip on mobile
                
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                element.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.05)`;
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translate(0px, 0px) scale(1)';
            });
        });
    }

    initTypewriterEffect() {
        const typewriterElements = document.querySelectorAll('.typewriter');
        
        typewriterElements.forEach(element => {
            const text = element.textContent;
            const speed = element.dataset.speed || 50;
            
            element.textContent = '';
            element.style.borderRight = '2px solid #06b6d4';
            element.style.animation = 'blink 1s infinite';
            
            let i = 0;
            const typeInterval = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(typeInterval);
                    setTimeout(() => {
                        element.style.borderRight = 'none';
                        element.style.animation = 'none';
                    }, 1000);
                }
            }, speed);
        });
    }

    initMobileOptimizations() {
        if (window.innerWidth <= 768) {
            // Disable expensive animations on mobile
            document.documentElement.style.setProperty('--animation-duration', '0.3s');
            
            // Add touch feedback to interactive elements
            const interactiveElements = document.querySelectorAll('.btn, .card, .social-link');
            
            interactiveElements.forEach(element => {
                element.addEventListener('touchstart', () => {
                    element.style.transform = 'scale(0.95)';
                });
                
                element.addEventListener('touchend', () => {
                    element.style.transform = 'scale(1)';
                });
            });
        }
    }
}

// Enhanced Mobile Navigation
class MobileNavigation {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createMobileNav();
        this.bindEvents();
    }

    createMobileNav() {
        // Enhanced mobile navigation with better animations
        const mobileNav = document.getElementById('mobile-menu');
        if (mobileNav) {
            mobileNav.classList.add('enhanced-mobile-nav');
        }
    }

    bindEvents() {
        const menuBtn = document.getElementById('menu-btn');
        const closeBtn = document.getElementById('close-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const backdrop = document.getElementById('mobile-menu-backdrop');

        if (menuBtn && mobileMenu) {
            menuBtn.addEventListener('click', () => this.openNav());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeNav());
        }

        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeNav());
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeNav();
            }
        });
    }

    openNav() {
        const mobileMenu = document.getElementById('mobile-menu');
        const backdrop = document.getElementById('mobile-menu-backdrop');
        
        if (mobileMenu && backdrop) {
            mobileMenu.classList.add('is-open');
            backdrop.classList.add('is-open');
            document.body.style.overflow = 'hidden';
            this.isOpen = true;

            // Animate menu items
            const menuLinks = mobileMenu.querySelectorAll('.mobile-menu-link');
            menuLinks.forEach((link, index) => {
                link.style.animation = `slideInRight 0.3s ease-out ${index * 0.1}s forwards`;
            });
        }
    }

    closeNav() {
        const mobileMenu = document.getElementById('mobile-menu');
        const backdrop = document.getElementById('mobile-menu-backdrop');
        
        if (mobileMenu && backdrop) {
            mobileMenu.classList.remove('is-open');
            backdrop.classList.remove('is-open');
            document.body.style.overflow = '';
            this.isOpen = false;

            // Reset animations
            const menuLinks = mobileMenu.querySelectorAll('.mobile-menu-link');
            menuLinks.forEach(link => {
                link.style.animation = '';
            });
        }
    }
}

// Performance Monitor for Mobile
class PerformanceMonitor {
    constructor() {
        this.init();
    }

    init() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.optimizeForDevice();
            });
        } else {
            setTimeout(() => this.optimizeForDevice(), 100);
        }
    }

    optimizeForDevice() {
        const isLowEndDevice = this.detectLowEndDevice();
        
        if (isLowEndDevice) {
            // Disable expensive animations
            document.body.classList.add('low-performance-mode');
            
            // Reduce animation complexity
            const style = document.createElement('style');
            style.textContent = `
                .low-performance-mode * {
                    animation-duration: 0.2s !important;
                    transition-duration: 0.2s !important;
                }
                .low-performance-mode .parallax-element {
                    transform: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    detectLowEndDevice() {
        // Simple heuristics to detect low-end devices
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const memory = navigator.deviceMemory;
        const cores = navigator.hardwareConcurrency;

        if (memory && memory < 4) return true;
        if (cores && cores < 4) return true;
        if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) return true;
        
        return false;
    }
}

// Lazy Loading Implementation
class LazyLoader {
    constructor() {
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.createImageObserver();
        } else {
            this.fallbackLoad();
        }
    }

    createImageObserver() {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    imageObserver.unobserve(entry.target);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    loadImage(img) {
        img.classList.add('lazy-load');
        
        const newImg = new Image();
        newImg.onload = () => {
            img.src = newImg.src;
            img.classList.remove('lazy-load');
            img.classList.add('loaded');
        };
        
        newImg.onerror = () => {
            img.classList.remove('lazy-load');
            img.classList.add('error');
        };
        
        newImg.src = img.dataset.src;
    }

    fallbackLoad() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

// Theme Controller with Enhanced Features
class ThemeController {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.bindEvents();
        this.detectSystemTheme();
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        
        // Update theme toggle icons
        const themeButtons = document.querySelectorAll('[data-theme-toggle]');
        themeButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
            }
        });

        // Reinitialize Lucide icons if available
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Animate theme transition
        document.documentElement.style.transition = 'color 0.3s ease, background-color 0.3s ease';
        setTimeout(() => {
            document.documentElement.style.transition = '';
        }, 300);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        
        // Add visual feedback
        const themeButtons = document.querySelectorAll('[data-theme-toggle]');
        themeButtons.forEach(btn => {
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 150);
        });
    }

    detectSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            if (!localStorage.getItem('theme')) {
                this.applyTheme(mediaQuery.matches ? 'dark' : 'light');
            }
            
            mediaQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem('theme-manual')) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    bindEvents() {
        const themeButtons = document.querySelectorAll('[data-theme-toggle]');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                localStorage.setItem('theme-manual', 'true');
                this.toggleTheme();
            });
        });
    }
}

// Initialize all enhanced features
document.addEventListener('DOMContentLoaded', () => {
    // Initialize core systems
    new AnimationController();
    new MobileNavigation();
    new PerformanceMonitor();
    new LazyLoader();
    new ThemeController();

    // Add page transition animation
    document.body.classList.add('page-transition');

    // Initialize existing functionality
    if (window.originalScript) {
        window.originalScript();
    }

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Add stagger animation to main sections
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
        section.setAttribute('data-animate', 'fade-in');
        section.setAttribute('data-delay', index * 200);
    });

    // Enhanced scroll behavior
    if (window.innerWidth > 768) {
        const scrollElements = document.querySelectorAll('.animate-on-scroll');
        scrollElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
        });
    }

    // Add enhanced hover effects to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.add('advanced-hover', 'float-on-hover');
    });

    // Add magnetic effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.classList.add('magnetic', 'pulse-on-hover');
    });
});

// Viewport height fix for mobile browsers
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setViewportHeight();
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);

// Performance optimization: Debounced scroll handler
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced scroll handling with performance optimization
const debouncedScrollHandler = debounce(() => {
    const scrollY = window.pageYOffset;
    
    // Update navbar state
    const navbar = document.getElementById('navbar');
    if (navbar) {
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // Parallax effects (only on desktop)
    if (window.innerWidth > 768) {
        const parallaxElements = document.querySelectorAll('.parallax-element');
        parallaxElements.forEach(element => {
            const rate = scrollY * -0.3;
            element.style.transform = `translateY(${rate}px)`;
        });
    }
}, 10);

window.addEventListener('scroll', debouncedScrollHandler, { passive: true });

// Export for potential external use
window.EnhancedFeatures = {
    AnimationController,
    MobileNavigation,
    PerformanceMonitor,
    LazyLoader,
    ThemeController
};