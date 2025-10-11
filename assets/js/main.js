/**
 * Portfolio Website Script
 * Handles:
 * - Navbar behavior (scroll background, mobile menu)
 * - Scroll animations
 * - Three.js background animation
 * - Contact form submission status
 * - Footer year update
 * - GitHub repository fetching
 * - Theme toggling
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Theme Toggle ---
    const themeToggleButtons = document.querySelectorAll('[data-theme-toggle]');
    
    // Function to apply the saved theme or system preference
    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateToggleIcons(theme);
    }

    // Function to update toggle icons
    function updateToggleIcons(theme) {
        themeToggleButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
            }
        });
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Function to toggle the theme
    function toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
    }

    // Set initial theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);

    // Add click listeners to all theme toggle buttons
    themeToggleButtons.forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });

    // --- Navbar Functionality ---
    const navbar = document.getElementById('navbar');

    // Toggle navbar background on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- Scroll Animations ---
    let scrollElements = document.querySelectorAll('.animate-on-scroll');

    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
            elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend
        );
    };

    const displayScrollElement = (element) => {
        element.classList.add('is-visible');
    };

    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 1.15)) {
                displayScrollElement(el);
            }
        });
    };

    // Initial check on load and on scroll
    handleScrollAnimation();
    window.addEventListener('scroll', handleScrollAnimation);

    // --- Three.js Background Animation ---
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer && typeof THREE !== 'undefined') {
        let scene = new THREE.Scene();
        let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 50;

        let renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        canvasContainer.appendChild(renderer.domElement);

        const particleCount = 5000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const color = new THREE.Color();

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const radius = 200;
            const phi = Math.acos(-1 + (2 * Math.random()));
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            positions[i3] = radius * Math.cos(theta) * Math.sin(phi);
            positions[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
            positions[i3 + 2] = radius * Math.cos(phi);
            color.setHSL(0.5 + Math.random() * 0.1, 0.7, 0.5 + Math.random() * 0.2);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });

        let particleSystem = new THREE.Points(geometry, material);
        scene.add(particleSystem);

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);

        function animate() {
            requestAnimationFrame(animate);
            const time = Date.now() * 0.0001;
            particleSystem.rotation.y = time * 0.5;
            particleSystem.rotation.x = time * 0.2;
            renderer.render(scene, camera);
        }
        animate();
    }

    // --- Contact Form Handling ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formStatus = document.getElementById('form-status');
            const data = new FormData(event.target);

            try {
                const response = await fetch(event.target.action, {
                    method: contactForm.method,
                    body: data,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    formStatus.textContent = "Thanks for your submission!";
                    formStatus.style.color = 'green';
                    contactForm.reset();
                } else {
                    const responseData = await response.json();
                    if (Object.hasOwn(responseData, 'errors')) {
                        formStatus.textContent = responseData["errors"].map(error => error["message"]).join(", ");
                    } else {
                        formStatus.textContent = "Oops! There was a problem submitting your form";
                    }
                    formStatus.style.color = 'red';
                }
            } catch (error) {
                formStatus.textContent = "Oops! There was a problem submitting your form";
                formStatus.style.color = 'red';
            } finally {
                setTimeout(() => { formStatus.textContent = ""; }, 5000);
            }
        });
    }

    // --- Footer Year ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- GitHub Projects Loader ---
    async function fetchGitHubRepos(username, perPage = 6) {
        const url = `https://api.github.com/users/${username}/repos?per_page=${perPage}&sort=updated`;
        const response = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        const repos = await response.json();
        return repos.filter(r => !r.fork && !r.archived);
    }

    function renderRepoCard(repo) {
        const topics = (repo.topics || []).slice(0, 4).map(t => `<span class="tech-tag">${t}</span>`).join('');
        const language = repo.language ? `<span class="tech-tag">${repo.language}</span>` : '';
        return `
        <div class="card glassmorphic project-card animate-on-scroll">
            <div>
                <h3 class="project-title">
                    <i data-lucide="github"></i>
                    <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
                </h3>
                <p class="project-description">${repo.description || ''}</p>
                <div class="tech-tags">${language}${topics}</div>
            </div>
            <div class="project-stats">
                <span>★ ${repo.stargazers_count}</span>
                <span>Updated: ${new Date(repo.updated_at).toLocaleDateString()}</span>
            </div>
        </div>`;
    }

    async function hydrateRepoSections() {
        const containers = document.querySelectorAll('[data-github-repos]');
        for (const el of containers) {
            const username = el.getAttribute('data-github-repos');
            const perPage = Number(el.getAttribute('data-per-page') || '6');
            try {
                el.innerHTML = `<p class="loading-text">Loading repositories...</p>`;
                const repos = await fetchGitHubRepos(username, perPage);
                el.innerHTML = repos.map(renderRepoCard).join('');
                
                // Re-initialize scroll elements and animations
                scrollElements = document.querySelectorAll('.animate-on-scroll');
                handleScrollAnimation();

                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            } catch (e) {
                console.error(e);
                el.innerHTML = `<p class="error-text">Failed to load repositories.</p>`;
            }
        }
    }

    hydrateRepoSections();

    // --- Initialize Lucide Icons ---
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

}); // End DOMContentLoaded

