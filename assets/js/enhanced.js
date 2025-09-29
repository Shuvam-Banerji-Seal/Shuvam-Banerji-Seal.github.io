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

// Contact Form Enhancement Class
class ContactFormEnhancer {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.inputs = document.querySelectorAll('.form-input');
        this.submitButton = document.querySelector('#contact-form button[type="submit"]');
        this.statusElement = document.getElementById('form-status');
        
        if (this.form) {
            this.init();
        }
    }

    init() {
        this.setupInputAnimations();
        this.setupFormSubmission();
        this.setupValidation();
    }

    setupInputAnimations() {
        this.inputs.forEach(input => {
            // Focus animations with ripple effect
            input.addEventListener('focus', (e) => {
                this.createRipple(e.target, e);
                this.clearValidationState(e.target);
            });

            // Hover effects
            input.addEventListener('mouseenter', (e) => {
                if (document.activeElement !== e.target) {
                    e.target.style.transform = 'translateY(-2px)';
                }
            });

            input.addEventListener('mouseleave', (e) => {
                if (document.activeElement !== e.target) {
                    e.target.style.transform = 'translateY(0)';
                }
            });

            // Real-time validation
            input.addEventListener('input', (e) => {
                this.clearValidationState(e.target);
                clearTimeout(e.target.validationTimer);
                e.target.validationTimer = setTimeout(() => {
                    this.validateField(e.target);
                }, 500);
            });

            // Blur validation
            input.addEventListener('blur', (e) => {
                this.validateField(e.target);
            });
        });
    }

    createRipple(element, event) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = (event.clientX - rect.left - size / 2);
        const y = (event.clientY - rect.top - size / 2);

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
            z-index: 1;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;

        this.clearValidationState(field);

        if (field.hasAttribute('required') && !value) {
            isValid = false;
        } else if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailRegex.test(value);
        }

        if (value) {
            field.classList.add(isValid ? 'success' : 'error');
        }

        return isValid;
    }

    clearValidationState(field) {
        field.classList.remove('success', 'error');
    }

    setupFormSubmission() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validate all fields
            let isValid = true;
            this.inputs.forEach(input => {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            });

            if (isValid) {
                await this.submitWithAnimation();
            } else {
                this.shakeForm();
            }
        });
    }

    async submitWithAnimation() {
        // Add loading state
        this.submitButton.classList.add('loading');
        this.submitButton.disabled = true;
        const originalText = this.submitButton.innerHTML;

        try {
            const formData = new FormData(this.form);
            const response = await fetch(this.form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                this.showSuccess();
                setTimeout(() => {
                    this.resetForm(originalText);
                }, 2000);
            } else {
                throw new Error('Network response was not ok');
            }
        } catch (error) {
            this.showError();
            setTimeout(() => {
                this.resetForm(originalText);
            }, 2000);
        }
    }

    showSuccess() {
        this.submitButton.innerHTML = '✓ Sent Successfully!';
        this.submitButton.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        this.statusElement.textContent = 'Thank you! Your message has been sent.';
        this.statusElement.className = 'text-center text-sm mt-4 text-green-400';
    }

    showError() {
        this.submitButton.innerHTML = '✗ Error Occurred';
        this.submitButton.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        this.statusElement.textContent = 'Sorry, there was an error sending your message. Please try again.';
        this.statusElement.className = 'text-center text-sm mt-4 text-red-400';
    }

    resetForm(originalText) {
        this.submitButton.classList.remove('loading');
        this.submitButton.disabled = false;
        this.submitButton.innerHTML = originalText;
        this.submitButton.style.background = '';
        this.form.reset();
        this.statusElement.textContent = '';
        
        // Clear all validation states
        this.inputs.forEach(input => {
            this.clearValidationState(input);
        });
    }

    shakeForm() {
        this.form.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            this.form.style.animation = '';
        }, 500);
    }

    setupValidation() {
        // Add real-time validation feedback
        this.inputs.forEach(input => {
            input.addEventListener('keyup', () => {
                if (input.value.length > 0) {
                    this.validateField(input);
                }
            });
        });
    }
}

// Initialize contact form enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ContactFormEnhancer();
});

// Export for potential external use
window.EnhancedFeatures = {
    AnimationController,
    MobileNavigation,
    PerformanceMonitor,
    LazyLoader,
    ThemeController,
    ContactFormEnhancer
};