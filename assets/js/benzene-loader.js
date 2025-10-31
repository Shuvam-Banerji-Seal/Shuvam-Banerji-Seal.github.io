// Benzene Molecule Loading Animation
// Creates an animated benzene molecule being constructed from carbon and hydrogen atoms

class BenzeneLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Animation state
        this.animationProgress = 0;
        this.rotationAngle = 0;
        
        // Benzene structure (hexagon with alternating double bonds)
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 80;
        
        // Carbon atoms positions (hexagon vertices)
        this.carbons = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            this.carbons.push({
                x: Math.cos(angle) * this.radius,
                y: Math.sin(angle) * this.radius,
                progress: 0,
                targetProgress: (i + 1) / 6
            });
        }
        
        // Hydrogen atoms (one per carbon, pointing outward)
        this.hydrogens = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const hDistance = this.radius + 35;
            this.hydrogens.push({
                x: Math.cos(angle) * hDistance,
                y: Math.sin(angle) * hDistance,
                progress: 0,
                targetProgress: 0.5 + (i + 1) / 12
            });
        }
        
        // Bonds
        this.bonds = [];
        // Carbon-Carbon bonds
        for (let i = 0; i < 6; i++) {
            this.bonds.push({
                from: i,
                to: (i + 1) % 6,
                type: i % 2 === 0 ? 'double' : 'single',
                progress: 0,
                targetProgress: 0.3 + i / 12
            });
        }
        // Carbon-Hydrogen bonds
        for (let i = 0; i < 6; i++) {
            this.bonds.push({
                from: i,
                to: i + 6, // hydrogen index
                type: 'single',
                progress: 0,
                targetProgress: 0.6 + i / 12
            });
        }
    }
    
    resize() {
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = this.container.offsetHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }
    
    drawAtom(x, y, label, color, progress) {
        if (progress <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = Math.min(progress * 2, 1);
        
        const radius = 20 * Math.min(progress * 1.5, 1);
        
        // Outer glow
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(0.5, color + '20');
        gradient.addColorStop(1, color + '00');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Atom circle
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner highlight
        const highlightGradient = this.ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, 0,
            x, y, radius
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = highlightGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Label
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, x, y);
        
        this.ctx.restore();
    }
    
    drawBond(x1, y1, x2, y2, type, progress) {
        if (progress <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = Math.min(progress * 2, 1);
        
        const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const currentLength = lineLength * Math.min(progress * 1.5, 1);
        const ratio = currentLength / lineLength;
        const currentX2 = x1 + (x2 - x1) * ratio;
        const currentY2 = y1 + (y2 - y1) * ratio;
        
        this.ctx.strokeStyle = '#06b6d4';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        
        if (type === 'single') {
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(currentX2, currentY2);
            this.ctx.stroke();
        } else if (type === 'double') {
            // Calculate perpendicular offset
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const offset = 4;
            const perpX = Math.cos(angle + Math.PI / 2) * offset;
            const perpY = Math.sin(angle + Math.PI / 2) * offset;
            
            // First line
            this.ctx.beginPath();
            this.ctx.moveTo(x1 + perpX, y1 + perpY);
            this.ctx.lineTo(currentX2 + perpX, currentY2 + perpY);
            this.ctx.stroke();
            
            // Second line
            this.ctx.beginPath();
            this.ctx.moveTo(x1 - perpX, y1 - perpY);
            this.ctx.lineTo(currentX2 - perpX, currentY2 - perpY);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    animate(timestamp) {
        if (!this.startTime) this.startTime = timestamp;
        const elapsed = timestamp - this.startTime;
        
        // Update animation progress (0 to 1 over 3 seconds)
        this.animationProgress = Math.min(elapsed / 3000, 1);
        
        // Rotation continues after construction
        if (this.animationProgress >= 0.5) {
            this.rotationAngle += 0.01;
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.rotationAngle);
        
        // Update progress for each element
        this.carbons.forEach(carbon => {
            carbon.progress = Math.max(0, Math.min(1, 
                (this.animationProgress - carbon.targetProgress + 0.3) / 0.3
            ));
        });
        
        this.hydrogens.forEach(hydrogen => {
            hydrogen.progress = Math.max(0, Math.min(1,
                (this.animationProgress - hydrogen.targetProgress + 0.2) / 0.2
            ));
        });
        
        this.bonds.forEach(bond => {
            bond.progress = Math.max(0, Math.min(1,
                (this.animationProgress - bond.targetProgress + 0.2) / 0.2
            ));
        });
        
        // Draw bonds first (behind atoms)
        this.bonds.forEach((bond, i) => {
            if (i < 6) {
                // Carbon-Carbon bonds
                const c1 = this.carbons[bond.from];
                const c2 = this.carbons[bond.to];
                this.drawBond(c1.x, c1.y, c2.x, c2.y, bond.type, bond.progress);
            } else {
                // Carbon-Hydrogen bonds
                const c = this.carbons[bond.from];
                const h = this.hydrogens[bond.to - 6];
                this.drawBond(c.x, c.y, h.x, h.y, bond.type, bond.progress);
            }
        });
        
        // Draw carbon atoms
        this.carbons.forEach(carbon => {
            this.drawAtom(carbon.x, carbon.y, 'C', '#2dd4bf', carbon.progress);
        });
        
        // Draw hydrogen atoms
        this.hydrogens.forEach(hydrogen => {
            this.drawAtom(hydrogen.x, hydrogen.y, 'H', '#60a5fa', hydrogen.progress);
        });
        
        this.ctx.restore();
        
        // Continue animation if not complete or still rotating
        if (this.animationProgress < 1 || this.rotationAngle < Math.PI * 2) {
            requestAnimationFrame((t) => this.animate(t));
        } else {
            // Animation complete, fade out loading screen
            this.fadeOut();
        }
    }
    
    fadeOut() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    start() {
        requestAnimationFrame((t) => this.animate(t));
    }
}

// Initialize benzene loader when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const loader = new BenzeneLoader('benzene-loader-canvas');
        loader.start();
    });
} else {
    const loader = new BenzeneLoader('benzene-loader-canvas');
    loader.start();
}
