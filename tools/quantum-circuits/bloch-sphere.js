/**
 * Multi-Qubit Bloch Sphere Visualization
 * Shows all qubits' Bloch spheres in a single view using 2D canvas
 */

class BlochSphereMulti {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.spheres = []; // Array of {x, y, z} state vectors
        this.numQubits = 2;
        this.init();
    }

    init() {
        this.updateSpheres(2);
    }

    setNumQubits(n) {
        this.numQubits = n;
        this.updateSpheres(n);
    }

    updateSpheres(numQubits) {
        this.container.innerHTML = '';
        this.canvases = [];
        this.contexts = [];
        this.spheres = [];

        for (let i = 0; i < numQubits; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'bloch-sphere-item';

            const label = document.createElement('div');
            label.className = 'bloch-label';
            label.textContent = `q${i}`;
            wrapper.appendChild(label);

            const canvas = document.createElement('canvas');
            canvas.width = 120;
            canvas.height = 120;
            canvas.className = 'bloch-canvas-item';
            wrapper.appendChild(canvas);

            this.container.appendChild(wrapper);
            this.canvases.push(canvas);
            this.contexts.push(canvas.getContext('2d'));
            this.spheres.push({ x: 0, y: 0, z: 1 }); // Default |0⟩
        }

        this.render();
    }

    setState(qubitIndex, x, y, z) {
        if (qubitIndex < this.spheres.length) {
            const len = Math.sqrt(x * x + y * y + z * z);
            if (len > 0.001) {
                this.spheres[qubitIndex] = { x: x / len, y: y / len, z: z / len };
            } else {
                this.spheres[qubitIndex] = { x: 0, y: 0, z: 1 };
            }
            this.renderSphere(qubitIndex);
        }
    }

    render() {
        for (let i = 0; i < this.spheres.length; i++) {
            this.renderSphere(i);
        }
    }

    renderSphere(index) {
        const ctx = this.contexts[index];
        const canvas = this.canvases[index];
        const state = this.spheres[index];
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const r = 45;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw sphere outline
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // Draw equator (ellipse, viewed from angle)
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Draw meridian (vertical circle)
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 0.3, r, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Draw axes
        // Z axis (vertical)
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r - 8);
        ctx.lineTo(cx, cy + r + 8);
        ctx.stroke();

        // X axis (horizontal)
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.beginPath();
        ctx.moveTo(cx - r - 8, cy);
        ctx.lineTo(cx + r + 8, cy);
        ctx.stroke();

        // Draw |0⟩ and |1⟩ labels
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = '#3b82f6';
        ctx.textAlign = 'center';
        ctx.fillText('|0⟩', cx, cy - r - 12);
        ctx.fillText('|1⟩', cx, cy + r + 16);

        // Draw state vector
        // Project 3D to 2D (simple isometric)
        const projX = state.x * r + state.y * r * 0.3;
        const projY = -state.z * r + state.y * r * 0.15;

        // Arrow from center to state
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + projX, cy + projY);
        ctx.stroke();

        // State point (glowing)
        const gradient = ctx.createRadialGradient(
            cx + projX, cy + projY, 0,
            cx + projX, cy + projY, 8
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx + projX, cy + projY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Inner point
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + projX, cy + projY, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Export for use
window.BlochSphereMulti = BlochSphereMulti;
