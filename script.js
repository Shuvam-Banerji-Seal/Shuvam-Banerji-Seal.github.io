/**
 * Portfolio Website Script
 * Handles:
 * - Navbar behavior (scroll background, mobile menu)
 * - Scroll animations
 * - Three.js background animation
 * - Contact form submission status (using Formspree)
 * - Footer year update
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Navbar Functionality ---
    const navbar = document.getElementById('navbar');
    const menuBtn = document.getElementById('menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuLinks = mobileMenu.querySelectorAll('.mobile-menu-link');

    // Toggle navbar background on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Open mobile menu
    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.remove('-translate-x-full');
        mobileMenu.classList.add('translate-x-0');
    });

    // Close mobile menu
    closeMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.add('-translate-x-full');
        mobileMenu.classList.remove('translate-x-0');
    });

    // Close mobile menu when a link is clicked
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('-translate-x-full');
            mobileMenu.classList.remove('translate-x-0');
        });
    });

    // --- Scroll Animations ---
    const scrollElements = document.querySelectorAll('.animate-on-scroll');

    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        // Trigger animation slightly before element is fully in view
        return (
            elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend
        );
    };

    const displayScrollElement = (element) => {
        element.classList.add('is-visible');
    };

    const hideScrollElement = (element) => {
        element.classList.remove('is-visible');
    };

    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 1.15)) { // Adjust dividend for earlier/later trigger
                displayScrollElement(el);
            }
            // Optional: Uncomment to hide element when scrolled out of view
            // else {
            //     hideScrollElement(el);
            // }
        });
    };

    // Initial check on load
    handleScrollAnimation();
    // Add scroll event listener
    window.addEventListener('scroll', handleScrollAnimation);


    // --- Three.js Background Animation ---
    const canvasContainer = document.getElementById('canvas-container');
    let scene, camera, renderer, particles, particleSystem;

    function initThreeJS() {
        // Scene
        scene = new THREE.Scene();

        // Camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 50; // Adjusted camera position for better view

        // Renderer
        renderer = new THREE.WebGLRenderer({ alpha: true }); // alpha: true for transparent background
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio); // Adjust for device pixel ratio
        canvasContainer.appendChild(renderer.domElement);

        // Particles
        const particleCount = 5000; // Increased particle count
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3); // For colored particles

        const color = new THREE.Color();

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Position particles within a larger sphere
            const radius = 200; // Increased radius
            const phi = Math.acos(-1 + (2 * Math.random()));
            const theta = Math.sqrt(particleCount * Math.PI) * phi; // More uniform distribution
            positions[i3] = radius * Math.cos(theta) * Math.sin(phi);
            positions[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Assign colors (e.g., shades of cyan and purple)
            color.setHSL(0.5 + Math.random() * 0.1, 0.7, 0.5 + Math.random() * 0.2); // Cyan range
            // color.setHSL(0.75 + Math.random() * 0.1, 0.7, 0.5 + Math.random() * 0.2); // Purple range (optional mix)
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); // Add color attribute

        const material = new THREE.PointsMaterial({
            size: 0.5, // Slightly larger particle size
            vertexColors: true, // Use vertex colors
            // sizeAttenuation: true, // Particles smaller further away
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending // Brighter where particles overlap
        });

        particleSystem = new THREE.Points(geometry, material);
        scene.add(particleSystem);

        // Handle window resize
        window.addEventListener('resize', onWindowResize, false);

        // Start animation loop
        animate();
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);

        // Subtle rotation animation
        const time = Date.now() * 0.0001; // Slower rotation speed
        if (particleSystem) {
             particleSystem.rotation.y = time * 0.5;
             particleSystem.rotation.x = time * 0.2;
        }


        renderer.render(scene, camera);
    }

    // Initialize Three.js only if the container exists
    if (canvasContainer) {
        initThreeJS();
    } else {
        console.warn("Three.js canvas container not found.");
    }


    // --- Contact Form Handling (Formspree) ---
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    async function handleSubmit(event) {
        event.preventDefault();
        const status = formStatus;
        const data = new FormData(event.target);

        // Basic validation check (Formspree handles more)
        if (!data.get('name') || !data.get('email') || !data.get('subject') || !data.get('message')) {
             status.textContent = "Please fill out all fields.";
             status.style.color = 'orange';
             return;
        }

        fetch(event.target.action, {
            method: contactForm.method,
            body: data,
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                status.textContent = "Thanks for your submission!";
                status.style.color = 'var(--primary-color)'; // Use CSS variable or a specific color
                contactForm.reset();
            } else {
                response.json().then(data => {
                    if (Object.hasOwn(data, 'errors')) {
                        status.textContent = data["errors"].map(error => error["message"]).join(", ");
                        status.style.color = 'red';
                    } else {
                        status.textContent = "Oops! There was a problem submitting your form";
                        status.style.color = 'red';
                    }
                });
            }
        }).catch(error => {
            status.textContent = "Oops! There was a problem submitting your form";
            status.style.color = 'red';
            console.error("Form submission error:", error);
        });
         // Clear status message after a few seconds
        setTimeout(() => {
            status.textContent = "";
        }, 5000);
    }

    if (contactForm) {
        // Check if the action URL is the placeholder
        if (contactForm.action.includes("https://formspree.io/f/manepvkq")) {
             const warning = document.createElement('p');
            //  warning.textContent = "Warning: Contact form is not configured. Please replace 'YOUR_FORMSPREE_ENDPOINT' in index.html with your actual Formspree URL.";
             warning.style.color = 'orange';
             warning.style.textAlign = 'center';
             warning.style.fontSize = '0.8rem';
             contactForm.parentNode.insertBefore(warning, contactForm.nextSibling);
             console.warn("Contact form action URL is not set. Please configure Formspree.");
        } else {
            contactForm.addEventListener("submit", handleSubmit);
        }
    }


    // --- Footer Year ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Initialize Lucide Icons ---
    // Ensure this runs after the script tag for lucide.js
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        console.warn("Lucide icons library not loaded.");
    }

}); // End DOMContentLoaded
