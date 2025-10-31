// Molecule Background Animation using Three.js

(function() {
    const canvas = document.getElementById('molecules-canvas');
    if (!canvas) return;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true,
        antialias: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.position.z = 30;
    
    // Particle system for atoms
    const atoms = [];
    const bonds = [];
    const moleculeGroups = [];
    
    // Colors for different atoms
    const atomColors = {
        carbon: 0x222222,
        oxygen: 0xff0000,
        nitrogen: 0x0000ff,
        hydrogen: 0xffffff,
        sulfur: 0xffff00,
        phosphorus: 0xff8800
    };
    
    // Create molecule structures
    function createMolecule(type, position) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const atomGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const bondGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        
        if (type === 'water') {
            // H2O
            const o = new THREE.Mesh(atomGeometry, new THREE.MeshPhongMaterial({ color: atomColors.oxygen }));
            o.scale.set(1.2, 1.2, 1.2);
            group.add(o);
            
            const h1 = new THREE.Mesh(atomGeometry, new THREE.MeshPhongMaterial({ color: atomColors.hydrogen }));
            h1.position.set(-1, 0.7, 0);
            h1.scale.set(0.8, 0.8, 0.8);
            group.add(h1);
            
            const h2 = new THREE.Mesh(atomGeometry, new THREE.MeshPhongMaterial({ color: atomColors.hydrogen }));
            h2.position.set(1, 0.7, 0);
            h2.scale.set(0.8, 0.8, 0.8);
            group.add(h2);
            
            // Bonds
            const bond1 = new THREE.Mesh(bondGeometry, new THREE.MeshBasicMaterial({ color: 0x888888 }));
            bond1.position.set(-0.5, 0.35, 0);
            bond1.rotation.z = Math.PI / 6;
            group.add(bond1);
            
            const bond2 = new THREE.Mesh(bondGeometry, new THREE.MeshBasicMaterial({ color: 0x888888 }));
            bond2.position.set(0.5, 0.35, 0);
            bond2.rotation.z = -Math.PI / 6;
            group.add(bond2);
        } else if (type === 'methane') {
            // CH4
            const c = new THREE.Mesh(atomGeometry, new THREE.MeshPhongMaterial({ color: atomColors.carbon }));
            group.add(c);
            
            const positions = [
                [0, 1, 0],
                [0.94, -0.33, 0],
                [-0.47, -0.33, 0.82],
                [-0.47, -0.33, -0.82]
            ];
            
            positions.forEach(pos => {
                const h = new THREE.Mesh(atomGeometry, new THREE.MeshPhongMaterial({ color: atomColors.hydrogen }));
                h.position.set(pos[0], pos[1], pos[2]);
                h.scale.set(0.8, 0.8, 0.8);
                group.add(h);
            });
        } else if (type === 'benzene') {
            // C6H6 - simplified
            const radius = 1.5;
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI * 2) / 6;
                const c = new THREE.Mesh(atomGeometry, new THREE.MeshPhongMaterial({ color: atomColors.carbon }));
                c.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
                group.add(c);
            }
        } else if (type === 'ammonia') {
            // NH3
            const n = new THREE.Mesh(atomGeometry, new THREE.MeshPhongMaterial({ color: atomColors.nitrogen }));
            group.add(n);
            
            const positions = [
                [0, 1, 0],
                [0.87, -0.5, 0],
                [-0.87, -0.5, 0]
            ];
            
            positions.forEach(pos => {
                const h = new THREE.Mesh(atomGeometry, new THREE.MeshPhongMaterial({ color: atomColors.hydrogen }));
                h.position.set(pos[0], pos[1], pos[2]);
                h.scale.set(0.8, 0.8, 0.8);
                group.add(h);
            });
        }
        
        // Random rotation speed
        group.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02
        };
        
        // Random drift
        group.drift = {
            x: (Math.random() - 0.5) * 0.01,
            y: (Math.random() - 0.5) * 0.01,
            z: (Math.random() - 0.5) * 0.01
        };
        
        return group;
    }
    
    // Create multiple molecules
    const moleculeTypes = ['water', 'methane', 'benzene', 'ammonia'];
    
    for (let i = 0; i < 15; i++) {
        const type = moleculeTypes[Math.floor(Math.random() * moleculeTypes.length)];
        const position = new THREE.Vector3(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50
        );
        
        const molecule = createMolecule(type, position);
        moleculeGroups.push(molecule);
        scene.add(molecule);
    }
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0x3b82f6, 0.5, 50);
    pointLight.position.set(-10, -10, 10);
    scene.add(pointLight);
    
    // Add floating particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 100;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.1,
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.6
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotate and move molecules
        moleculeGroups.forEach((molecule, index) => {
            molecule.rotation.x += molecule.rotationSpeed.x;
            molecule.rotation.y += molecule.rotationSpeed.y;
            molecule.rotation.z += molecule.rotationSpeed.z;
            
            molecule.position.x += molecule.drift.x;
            molecule.position.y += molecule.drift.y;
            molecule.position.z += molecule.drift.z;
            
            // Bounce off boundaries
            if (Math.abs(molecule.position.x) > 30) molecule.drift.x *= -1;
            if (Math.abs(molecule.position.y) > 30) molecule.drift.y *= -1;
            if (Math.abs(molecule.position.z) > 30) molecule.drift.z *= -1;
        });
        
        // Animate particles
        particlesMesh.rotation.y += 0.0005;
        
        // Camera follows mouse slightly
        camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 2 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Parallax effect on scroll
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        camera.position.z = 30 + scrollY * 0.01;
    });
})();
