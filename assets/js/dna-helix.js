// DNA Helix Animation for Hero Section
(function() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    // Create canvas for DNA helix
    const canvas = document.createElement('canvas');
    canvas.id = 'dna-helix-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.opacity = '0.3';
    heroSection.insertBefore(canvas, heroSection.firstChild);
    
    const ctx = canvas.getContext('2d');
    
    function resize() {
        canvas.width = heroSection.offsetWidth;
        canvas.height = heroSection.offsetHeight;
    }
    
    resize();
    window.addEventListener('resize', resize);
    
    // DNA Helix parameters
    const helixRadius = 50;
    const helixHeight = canvas.height;
    const helixSpeed = 0.005;
    let helixRotation = 0;
    
    // Atom colors
    const colors = {
        adenine: '#3b82f6',    // Blue
        thymine: '#ef4444',    // Red
        guanine: '#10b981',    // Green
        cytosine: '#f59e0b'    // Amber
    };
    
    function drawAtom(x, y, color, size = 6) {
        // Draw atom
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Glow effect
        ctx.beginPath();
        ctx.arc(x, y, size * 2, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
        gradient.addColorStop(0, color + '60');
        gradient.addColorStop(1, color + '00');
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    function drawBond(x1, y1, x2, y2, color = '#ffffff40') {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        helixRotation += helixSpeed;
        
        const centerX = canvas.width / 2;
        const numPairs = 20;
        const spacing = canvas.height / numPairs;
        
        for (let i = 0; i < numPairs; i++) {
            const y = i * spacing + (helixRotation * 100) % spacing;
            
            if (y > canvas.height + 20) continue;
            
            const angle1 = helixRotation + (i * Math.PI / 5);
            const angle2 = angle1 + Math.PI;
            
            // Left strand
            const x1 = centerX + Math.cos(angle1) * helixRadius;
            const y1 = y;
            
            // Right strand
            const x2 = centerX + Math.cos(angle2) * helixRadius;
            const y2 = y;
            
            // Determine base pair
            const pairType = i % 4;
            let color1, color2;
            
            if (pairType === 0) {
                color1 = colors.adenine;
                color2 = colors.thymine;
            } else if (pairType === 1) {
                color1 = colors.guanine;
                color2 = colors.cytosine;
            } else if (pairType === 2) {
                color1 = colors.thymine;
                color2 = colors.adenine;
            } else {
                color1 = colors.cytosine;
                color2 = colors.guanine;
            }
            
            // Draw base pair bond
            drawBond(x1, y1, x2, y2);
            
            // Draw atoms
            drawAtom(x1, y1, color1);
            drawAtom(x2, y2, color2);
            
            // Draw connection to previous pair (backbone)
            if (i > 0) {
                const prevY = (i - 1) * spacing + (helixRotation * 100) % spacing;
                const prevAngle1 = helixRotation + ((i - 1) * Math.PI / 5);
                const prevAngle2 = prevAngle1 + Math.PI;
                
                const prevX1 = centerX + Math.cos(prevAngle1) * helixRadius;
                const prevX2 = centerX + Math.cos(prevAngle2) * helixRadius;
                
                drawBond(x1, y1, prevX1, prevY, '#3b82f680');
                drawBond(x2, y2, prevX2, prevY, '#3b82f680');
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
})();
