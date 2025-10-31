// Enhanced Particle System for Chemistry Theme
(function() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    document.body.insertBefore(canvas, document.body.firstChild);
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouseX = 0;
    let mouseY = 0;
    let animationId;
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resize();
    window.addEventListener('resize', resize);
    
    // Particle class
    class Particle {
        constructor() {
            this.reset();
            this.y = Math.random() * canvas.height;
            this.fadeDelay = Math.random() * 600;
            this.fadeStart = Date.now() + this.fadeDelay;
            this.fadingOut = false;
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.z = Math.random() * 4;
            this.size = (4 - this.z) * 2;
            
            // Different particle types for chemistry theme
            this.type = Math.random();
            if (this.type < 0.3) {
                this.shape = 'circle'; // Atoms
                this.color = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 4)];
            } else if (this.type < 0.6) {
                this.shape = 'ring'; // Electron orbits
                this.color = '#06b6d4';
            } else {
                this.shape = 'hexagon'; // Benzene rings
                this.color = '#3b82f6';
            }
            
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.life = 0;
            this.opacity = 0;
            this.fadeDelay = Math.random() * 600;
            this.fadeStart = Date.now() + this.fadeDelay;
            this.fadingOut = false;
        }
        
        update() {
            this.life++;
            
            // Fade in effect
            if (Date.now() > this.fadeStart && this.opacity < 1 && !this.fadingOut) {
                this.opacity += 0.01;
            }
            
            // Mouse interaction
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const angle = Math.atan2(dy, dx);
                this.vx -= Math.cos(angle) * 0.1;
                this.vy -= Math.sin(angle) * 0.1;
            }
            
            this.x += this.vx;
            this.y += this.vy;
            
            // Damping
            this.vx *= 0.99;
            this.vy *= 0.99;
            
            // Boundary check with wrap-around
            if (this.x < -50) this.x = canvas.width + 50;
            if (this.x > canvas.width + 50) this.x = -50;
            if (this.y < -50) this.y = canvas.height + 50;
            if (this.y > canvas.height + 50) this.y = -50;
            
            // Fade out after lifetime
            if (this.life > 500) {
                this.fadingOut = true;
                this.opacity -= 0.01;
                if (this.opacity <= 0) {
                    this.reset();
                    this.life = 0;
                    this.fadingOut = false;
                }
            }
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity * (0.3 + this.z / 10);
            
            if (this.shape === 'circle') {
                // Draw atom
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                
                // Glow effect
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
                gradient.addColorStop(0, this.color + '40');
                gradient.addColorStop(1, this.color + '00');
                ctx.fillStyle = gradient;
                ctx.fill();
            } else if (this.shape === 'ring') {
                // Draw electron orbit
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Rotating electron
                const angle = this.life * 0.05;
                ctx.beginPath();
                ctx.arc(
                    this.x + Math.cos(angle) * this.size * 2,
                    this.y + Math.sin(angle) * this.size * 2,
                    2, 0, Math.PI * 2
                );
                ctx.fillStyle = this.color;
                ctx.fill();
            } else {
                // Draw hexagon (benzene ring)
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2) / 6;
                    const x = this.x + Math.cos(angle) * this.size;
                    const y = this.y + Math.sin(angle) * this.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }
    
    // Create particles
    function createParticles() {
        const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 100);
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    createParticles();
    
    // Connect nearby particles with bonds
    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    ctx.save();
                    ctx.globalAlpha = (1 - distance / 150) * 0.2 * Math.min(particles[i].opacity, particles[j].opacity);
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Draw connections
        connectParticles();
        
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    // Mouse tracking
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Touch support
    document.addEventListener('touchmove', (e) => {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    });
    
    // Pause animation when page is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animate();
        }
    });
    
    // Recreate particles on resize
    window.addEventListener('resize', () => {
        createParticles();
    });
})();
