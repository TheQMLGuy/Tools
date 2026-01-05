/**
 * Bloch Sphere - 3D WebGL Visualization using Three.js
 * A beautiful, interactive 3D Bloch sphere
 */

class BlochSphere {
    constructor(canvasId) {
        this.container = document.getElementById(canvasId).parentElement;
        this.canvas = document.getElementById(canvasId);
        this.stateVector = { x: 0, y: 0, z: 1 }; // |0⟩ state

        this.init();
        this.animate();
    }

    async init() {
        // Load Three.js dynamically
        await this.loadThreeJS();

        const width = 220;
        const height = 220;

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(3, 2, 3);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);

        // Controls (orbit)
        this.setupControls();

        // Create Bloch sphere elements
        this.createSphere();
        this.createAxes();
        this.createStateVector();
        this.createLabels();

        // Handle resize
        window.addEventListener('resize', () => this.resize());
    }

    async loadThreeJS() {
        if (window.THREE) return;

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            // Rotate camera around origin
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position);

            spherical.theta -= deltaX * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + deltaY * 0.01));

            this.camera.position.setFromSpherical(spherical);
            this.camera.lookAt(0, 0, 0);

            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Auto-rotate when not interacting
        this.autoRotate = true;
        this.canvas.addEventListener('mouseenter', () => this.autoRotate = false);
        this.canvas.addEventListener('mouseleave', () => this.autoRotate = true);
    }

    createSphere() {
        // Wireframe sphere
        const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x8b5cf6,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });
        this.wireframeSphere = new THREE.Mesh(sphereGeometry, wireframeMaterial);
        this.scene.add(this.wireframeSphere);

        // Glass-like inner sphere
        const glassMaterial = new THREE.MeshBasicMaterial({
            color: 0x6366f1,
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide
        });
        const glassSphere = new THREE.Mesh(new THREE.SphereGeometry(0.99, 32, 32), glassMaterial);
        this.scene.add(glassSphere);

        // Equator ring
        const equatorGeometry = new THREE.TorusGeometry(1, 0.01, 16, 100);
        const equatorMaterial = new THREE.MeshBasicMaterial({
            color: 0x8b5cf6,
            transparent: true,
            opacity: 0.5
        });
        const equator = new THREE.Mesh(equatorGeometry, equatorMaterial);
        equator.rotation.x = Math.PI / 2;
        this.scene.add(equator);

        // Meridian rings (0° and 90°)
        const meridianMaterial = new THREE.MeshBasicMaterial({
            color: 0x8b5cf6,
            transparent: true,
            opacity: 0.3
        });

        const meridian1 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.008, 16, 100), meridianMaterial);
        this.scene.add(meridian1);

        const meridian2 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.008, 16, 100), meridianMaterial);
        meridian2.rotation.y = Math.PI / 2;
        this.scene.add(meridian2);
    }

    createAxes() {
        const axisLength = 1.4;

        // X axis (red)
        const xAxisGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-axisLength, 0, 0),
            new THREE.Vector3(axisLength, 0, 0)
        ]);
        const xAxis = new THREE.Line(xAxisGeom, new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.7 }));
        this.scene.add(xAxis);

        // Y axis (green)
        const yAxisGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -axisLength, 0),
            new THREE.Vector3(0, axisLength, 0)
        ]);
        const yAxis = new THREE.Line(yAxisGeom, new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.7 }));
        this.scene.add(yAxis);

        // Z axis (blue)
        const zAxisGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, -axisLength),
            new THREE.Vector3(0, 0, axisLength)
        ]);
        const zAxis = new THREE.Line(zAxisGeom, new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.7 }));
        this.scene.add(zAxis);

        // Axis endpoint spheres
        const dotGeometry = new THREE.SphereGeometry(0.04, 16, 16);

        // |0⟩ at +Z (top)
        const zPlusDot = new THREE.Mesh(dotGeometry, new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
        zPlusDot.position.set(0, 0, 1.1);
        this.scene.add(zPlusDot);

        // |1⟩ at -Z (bottom)
        const zMinusDot = new THREE.Mesh(dotGeometry, new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
        zMinusDot.position.set(0, 0, -1.1);
        this.scene.add(zMinusDot);
    }

    createStateVector() {
        // State vector arrow
        const arrowDir = new THREE.Vector3(this.stateVector.x, this.stateVector.y, this.stateVector.z);
        arrowDir.normalize();

        this.stateArrow = new THREE.ArrowHelper(
            arrowDir,
            new THREE.Vector3(0, 0, 0),
            1,
            0x8b5cf6,
            0.15,
            0.08
        );
        this.scene.add(this.stateArrow);

        // Glowing tip sphere
        const tipGeometry = new THREE.SphereGeometry(0.08, 32, 32);
        const tipMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.stateTip = new THREE.Mesh(tipGeometry, tipMaterial);
        this.stateTip.position.copy(arrowDir);
        this.scene.add(this.stateTip);

        // Outer glow
        const glowGeometry = new THREE.SphereGeometry(0.12, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x8b5cf6,
            transparent: true,
            opacity: 0.4
        });
        this.stateGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.stateGlow.position.copy(arrowDir);
        this.scene.add(this.stateGlow);
    }

    createLabels() {
        // Create text labels using sprites
        this.labels = [];

        const labelConfigs = [
            { text: '|0⟩', position: [0, 0, 1.35], color: '#3b82f6' },
            { text: '|1⟩', position: [0, 0, -1.35], color: '#3b82f6' },
            { text: 'X', position: [1.5, 0, 0], color: '#ef4444' },
            { text: 'Y', position: [0, 1.5, 0], color: '#22c55e' }
        ];

        labelConfigs.forEach(config => {
            const sprite = this.makeTextSprite(config.text, config.color);
            sprite.position.set(...config.position);
            sprite.scale.set(0.4, 0.2, 1);
            this.scene.add(sprite);
            this.labels.push(sprite);
        });
    }

    makeTextSprite(text, color) {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size;
        canvas.height = size / 2;

        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 40px Inter, sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, size / 2, size / 4);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false
        });

        return new THREE.Sprite(material);
    }

    setState(x, y, z) {
        const len = Math.sqrt(x * x + y * y + z * z);
        if (len > 0.001) {
            this.stateVector = { x: x / len, y: y / len, z: z / len };
        } else {
            this.stateVector = { x: 0, y: 0, z: 1 };
        }

        this.updateStateVector();
    }

    updateStateVector() {
        if (!this.stateArrow) return;

        const dir = new THREE.Vector3(this.stateVector.x, this.stateVector.y, this.stateVector.z);
        dir.normalize();

        // Update arrow
        this.stateArrow.setDirection(dir);

        // Update tip position
        this.stateTip.position.copy(dir);
        this.stateGlow.position.copy(dir);
    }

    resize() {
        const width = 220;
        const height = 220;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (!this.renderer) return;

        // Gentle auto-rotation when not interacting
        if (this.autoRotate) {
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position);
            spherical.theta += 0.002;
            this.camera.position.setFromSpherical(spherical);
            this.camera.lookAt(0, 0, 0);
        }

        // Make labels always face camera
        if (this.labels) {
            this.labels.forEach(label => {
                label.quaternion.copy(this.camera.quaternion);
            });
        }

        // Pulse effect on state tip
        if (this.stateGlow) {
            const scale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
            this.stateGlow.scale.set(scale, scale, scale);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Export for use
window.BlochSphere = BlochSphere;
