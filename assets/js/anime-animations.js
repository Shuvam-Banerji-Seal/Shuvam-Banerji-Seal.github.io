/**
 * Anime.js Animations for Portfolio
 * Advanced animations using anime.js library
 */

class PortfolioAnimations {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM and anime.js to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAnimations());
        } else {
            this.setupAnimations();
        }
    }

    setupAnimations() {
        // Check if anime.js is available
        if (typeof anime === 'undefined') {
            console.warn('Anime.js not loaded, skipping animations');
            return;
        }

        // Show loading screen initially
        this.showLoadingScreen();

        // Start animations after a brief delay
        setTimeout(() => {
            this.animateHero();
            this.animateNavbar();
            this.animateCards();
            this.animateSocialLinks();
            this.animateMobileMenu();
            this.setupScrollAnimations();

            // Hide loading screen
            this.hideLoadingScreen();
        }, 500);
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            anime({
                targets: loadingScreen,
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutQuad'
            });
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            anime({
                targets: loadingScreen,
                opacity: [1, 0],
                duration: 500,
                easing: 'easeInQuad',
                complete: () => {
                    loadingScreen.style.display = 'none';
                }
            });
        }
    }

    animateHero() {
        // Hero title animation with typing effect
        const heroTitle = document.querySelector('.hero h1');
        if (heroTitle) {
            // Split text into characters for animation
            const text = heroTitle.textContent;
            heroTitle.innerHTML = text.split('').map(char =>
                char === ' ' ? '<span>&nbsp;</span>' : `<span>${char}</span>`
            ).join('');

            const chars = heroTitle.querySelectorAll('span');

            // Animate characters with stagger
            anime({
                targets: chars,
                opacity: [0, 1],
                translateY: [20, 0],
                delay: anime.stagger(50, {start: 500}),
                duration: 800,
                easing: 'easeOutExpo'
            });
        }

        // Subtitle animation
        const subtitle = document.querySelector('.hero .subtitle');
        if (subtitle) {
            anime({
                targets: subtitle,
                opacity: [0, 1],
                translateY: [30, 0],
                delay: 1500,
                duration: 1000,
                easing: 'easeOutCubic'
            });
        }

        // Description animation
        const description = document.querySelector('.hero .description');
        if (description) {
            anime({
                targets: description,
                opacity: [0, 1],
                translateY: [20, 0],
                delay: 2000,
                duration: 800,
                easing: 'easeOutQuad'
            });
        }

        // Button animations
        const buttons = document.querySelectorAll('.hero .btn');
        if (buttons.length) {
            anime({
                targets: buttons,
                opacity: [0, 1],
                translateY: [40, 0],
                delay: anime.stagger(200, {start: 2500}),
                duration: 1000,
                easing: 'easeOutElastic(1, .8)'
            });
        }
    }

    animateNavbar() {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            // Navbar slide down animation
            anime({
                targets: navbar,
                translateY: [-100, 0],
                opacity: [0, 1],
                duration: 800,
                easing: 'easeOutCubic',
                delay: 200
            });

            // Logo animation
            const logo = document.querySelector('.nav-logo');
            if (logo) {
                anime({
                    targets: logo,
                    scale: [0.8, 1],
                    opacity: [0, 1],
                    duration: 600,
                    easing: 'easeOutBack',
                    delay: 400
                });
            }

            // Nav links animation
            const navLinks = document.querySelectorAll('.nav-link');
            if (navLinks.length) {
                anime({
                    targets: navLinks,
                    opacity: [0, 1],
                    translateY: [-20, 0],
                    delay: anime.stagger(100, {start: 600}),
                    duration: 500,
                    easing: 'easeOutQuad'
                });
            }
        }
    }

    animateCards() {
        // Project cards entrance animation
        const cards = document.querySelectorAll('.card');
        if (cards.length) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        // Staggered entrance animation
                        anime({
                            targets: entry.target,
                            opacity: [0, 1],
                            translateY: [80, 0],
                            scale: [0.8, 1],
                            rotateY: [-15, 0],
                            delay: index * 150,
                            duration: 1000,
                            easing: 'easeOutElastic(1, .8)'
                        });

                        // Add glow effect after entrance
                        setTimeout(() => {
                            anime({
                                targets: entry.target,
                                boxShadow: ['0 4px 6px rgba(0,0,0,0.1)', '0 10px 30px rgba(6, 182, 212, 0.2)'],
                                duration: 800,
                                easing: 'easeOutQuad'
                            });
                        }, (index * 150) + 1000);

                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            cards.forEach(card => observer.observe(card));
        }

        // Enhanced card hover animations
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                anime({
                    targets: card,
                    scale: 1.05,
                    rotateY: 5,
                    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
                    duration: 400,
                    easing: 'easeOutQuad'
                });

                // Animate child elements
                const title = card.querySelector('h3');
                if (title) {
                    anime({
                        targets: title,
                        color: '#06b6d4',
                        duration: 300,
                        easing: 'easeOutQuad'
                    });
                }
            });

            card.addEventListener('mouseleave', () => {
                anime({
                    targets: card,
                    scale: 1,
                    rotateY: 0,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    duration: 400,
                    easing: 'easeOutQuad'
                });

                // Reset title color
                const title = card.querySelector('h3');
                if (title) {
                    anime({
                        targets: title,
                        color: '',
                        duration: 300,
                        easing: 'easeOutQuad'
                    });
                }
            });
        });
    }

    animateSocialLinks() {
        const socialLinks = document.querySelectorAll('.social-link');
        if (socialLinks.length) {
            // Entrance animation
            anime({
                targets: socialLinks,
                opacity: [0, 1],
                translateY: [30, 0],
                delay: anime.stagger(100, {start: 3000}),
                duration: 600,
                easing: 'easeOutBack'
            });

            // Hover animations
            socialLinks.forEach(link => {
                link.addEventListener('mouseenter', () => {
                    anime({
                        targets: link,
                        scale: 1.2,
                        rotate: 5,
                        duration: 300,
                        easing: 'easeOutBack'
                    });
                });

                link.addEventListener('mouseleave', () => {
                    anime({
                        targets: link,
                        scale: 1,
                        rotate: 0,
                        duration: 300,
                        easing: 'easeOutBack'
                    });
                });
            });
        }
    }

    animateMobileMenu() {
        const menuBtn = document.getElementById('menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const backdrop = document.getElementById('mobile-menu-backdrop');
        const menuLinks = document.querySelectorAll('.mobile-menu-link');

        if (menuBtn && mobileMenu) {
            // Menu button pulse animation
            anime({
                targets: menuBtn,
                scale: [1, 1.1, 1],
                duration: 2000,
                easing: 'easeInOutQuad',
                loop: true,
                direction: 'alternate'
            });

            // Override the existing mobile menu animations with anime.js
            let originalOpenMenu = window.openMenu || (() => {});
            let originalCloseMenu = window.closeMenu || (() => {});

            window.openMenu = () => {
                // Show menu with anime.js
                anime({
                    targets: mobileMenu,
                    translateX: ['-100%', '0%'],
                    opacity: [0, 1],
                    duration: 400,
                    easing: 'easeOutCubic'
                });

                anime({
                    targets: backdrop,
                    opacity: [0, 1],
                    duration: 300,
                    easing: 'easeOutQuad'
                });

                // Animate menu links
                anime({
                    targets: menuLinks,
                    opacity: [0, 1],
                    translateX: [-20, 0],
                    delay: anime.stagger(50, {start: 200}),
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            };

            window.closeMenu = () => {
                anime({
                    targets: mobileMenu,
                    translateX: ['0%', '-100%'],
                    opacity: [1, 0],
                    duration: 300,
                    easing: 'easeInCubic'
                });

                anime({
                    targets: backdrop,
                    opacity: [1, 0],
                    duration: 250,
                    easing: 'easeInQuad'
                });
            };
        }
    }

    setupScrollAnimations() {
        // Parallax effect for hero section
        const hero = document.querySelector('.hero');
        if (hero) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.5;
                anime({
                    targets: hero,
                    translateY: rate,
                    duration: 0,
                    easing: 'linear'
                });
            });
        }

        // Floating animation for cards
        const floatingCards = document.querySelectorAll('.float-on-hover');
        floatingCards.forEach(card => {
            anime({
                targets: card,
                translateY: [0, -10, 0],
                duration: 4000,
                easing: 'easeInOutSine',
                loop: true,
                delay: Math.random() * 1000
            });
        });

        // Mouse follow effect for background particles
        this.setupMouseInteraction();
    }

    setupMouseInteraction() {
        const canvas = document.getElementById('canvas-container');
        if (!canvas) return;

        let mouseX = 0;
        let mouseY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX / window.innerWidth;
            mouseY = e.clientY / window.innerHeight;
        });

        // Animate particles based on mouse position
        const animateParticles = () => {
            const particles = canvas.querySelectorAll('canvas');
            if (particles.length) {
                anime({
                    targets: particles[0],
                    scale: [1, 1.1, 1],
                    duration: 2000,
                    easing: 'easeInOutQuad',
                    loop: true
                });
            }
            requestAnimationFrame(animateParticles);
        };
        animateParticles();
    }
}

// Initialize animations when DOM is ready
new PortfolioAnimations();