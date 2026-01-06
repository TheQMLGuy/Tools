/**
 * K-Means Clustering Visualizer
 * Animated centroid movement and cluster formation
 */

class KMeansApp {
    constructor() {
        this.data = [];
        this.centroids = [];
        this.assignments = [];
        this.k = 3;
        this.iteration = 0;
        this.isRunning = false;
        this.converged = false;

        this.colors = [
            '#6366f1', '#10b981', '#f59e0b', '#ef4444',
            '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'
        ];

        this.initCanvas();
        this.setupEventListeners();
        this.generateData();
    }

    initCanvas() {
        this.canvas = document.getElementById('cluster-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.render();
    }

    setupEventListeners() {
        document.getElementById('dataset-select').addEventListener('change', () => this.generateData());

        document.getElementById('num-points').addEventListener('input', (e) => {
            document.getElementById('num-points-value').textContent = e.target.value;
        });

        document.getElementById('num-clusters').addEventListener('input', (e) => {
            this.k = parseInt(e.target.value);
            document.getElementById('num-clusters-value').textContent = e.target.value;
            this.initCentroids();
            this.render();
        });

        document.getElementById('generate-btn').addEventListener('click', () => this.generateData());
        document.getElementById('run-btn').addEventListener('click', () => this.toggleRunning());
        document.getElementById('step-btn').addEventListener('click', () => this.step());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
    }

    generateData() {
        const n = parseInt(document.getElementById('num-points').value);
        const dataset = document.getElementById('dataset-select').value;

        this.data = [];

        switch (dataset) {
            case 'blobs':
                this.generateBlobs(n);
                break;
            case 'circles':
                this.generateCircles(n);
                break;
            case 'moons':
                this.generateMoons(n);
                break;
            case 'random':
                this.generateRandom(n);
                break;
        }

        this.reset();
    }

    generateBlobs(n) {
        const centers = [
            { x: -0.5, y: -0.5 },
            { x: 0.5, y: 0.5 },
            { x: -0.5, y: 0.5 }
        ];

        for (let i = 0; i < n; i++) {
            const center = centers[i % centers.length];
            const x = center.x + (Math.random() - 0.5) * 0.4;
            const y = center.y + (Math.random() - 0.5) * 0.4;
            this.data.push({ x, y });
        }
    }

    generateCircles(n) {
        for (let i = 0; i < n; i++) {
            const radius = i < n / 2 ? 0.3 : 0.7;
            const angle = Math.random() * Math.PI * 2;
            const r = radius + (Math.random() - 0.5) * 0.1;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            this.data.push({ x, y });
        }
    }

    generateMoons(n) {
        for (let i = 0; i < n; i++) {
            const isMoon1 = i < n / 2;
            const angle = (i / (n / 2)) * Math.PI;
            const noise = (Math.random() - 0.5) * 0.1;

            if (isMoon1) {
                const x = Math.cos(angle) * 0.5;
                const y = Math.sin(angle) * 0.5 + noise;
                this.data.push({ x, y });
            } else {
                const x = 0.5 + Math.cos(angle) * 0.5;
                const y = 0.3 - Math.sin(angle) * 0.5 + noise;
                this.data.push({ x, y });
            }
        }
    }

    generateRandom(n) {
        for (let i = 0; i < n; i++) {
            const x = (Math.random() - 0.5) * 2;
            const y = (Math.random() - 0.5) * 2;
            this.data.push({ x, y });
        }
    }

    reset() {
        this.iteration = 0;
        this.isRunning = false;
        this.converged = false;
        this.assignments = [];
        document.getElementById('run-btn').textContent = '▶ Run';
        document.getElementById('status').textContent = 'Ready';

        this.initCentroids();
        this.updateStats();
        this.render();
    }

    initCentroids() {
        // Random initialization
        this.centroids = [];
        const shuffled = [...this.data].sort(() => Math.random() - 0.5);

        for (let i = 0; i < this.k; i++) {
            if (shuffled[i]) {
                this.centroids.push({ x: shuffled[i].x, y: shuffled[i].y });
            } else {
                this.centroids.push({
                    x: (Math.random() - 0.5) * 2,
                    y: (Math.random() - 0.5) * 2
                });
            }
        }

        this.assignments = new Array(this.data.length).fill(-1);
        this.updateCentroidList();
    }

    toggleRunning() {
        if (this.converged) {
            this.reset();
            return;
        }

        this.isRunning = !this.isRunning;
        document.getElementById('run-btn').textContent = this.isRunning ? '⏸ Pause' : '▶ Run';

        if (this.isRunning) {
            this.runLoop();
        }
    }

    runLoop() {
        if (!this.isRunning || this.converged) return;

        this.step();

        setTimeout(() => this.runLoop(), 300);
    }

    step() {
        if (this.converged) return;

        // Assign points to nearest centroid
        const oldAssignments = [...this.assignments];

        for (let i = 0; i < this.data.length; i++) {
            let minDist = Infinity;
            let nearest = 0;

            for (let j = 0; j < this.centroids.length; j++) {
                const dist = this.distance(this.data[i], this.centroids[j]);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = j;
                }
            }

            this.assignments[i] = nearest;
        }

        // Update centroids
        const newCentroids = [];

        for (let j = 0; j < this.k; j++) {
            const assigned = this.data.filter((_, i) => this.assignments[i] === j);

            if (assigned.length > 0) {
                const meanX = assigned.reduce((sum, p) => sum + p.x, 0) / assigned.length;
                const meanY = assigned.reduce((sum, p) => sum + p.y, 0) / assigned.length;
                newCentroids.push({ x: meanX, y: meanY });
            } else {
                newCentroids.push(this.centroids[j]);
            }
        }

        // Check convergence
        let moved = false;
        for (let j = 0; j < this.k; j++) {
            if (this.distance(this.centroids[j], newCentroids[j]) > 0.001) {
                moved = true;
                break;
            }
        }

        this.centroids = newCentroids;
        this.iteration++;

        if (!moved || this.iteration >= 100) {
            this.converged = true;
            this.isRunning = false;
            document.getElementById('run-btn').textContent = '↻ Restart';
            document.getElementById('status').textContent = 'Converged!';
        } else {
            document.getElementById('status').textContent = 'Running...';
        }

        this.updateStats();
        this.updateCentroidList();
        this.render();
    }

    distance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    computeInertia() {
        let inertia = 0;
        for (let i = 0; i < this.data.length; i++) {
            if (this.assignments[i] >= 0) {
                const dist = this.distance(this.data[i], this.centroids[this.assignments[i]]);
                inertia += dist * dist;
            }
        }
        return inertia;
    }

    updateStats() {
        document.getElementById('iteration').textContent = this.iteration;

        if (this.iteration > 0) {
            document.getElementById('inertia').textContent = this.computeInertia().toFixed(4);
        }
    }

    updateCentroidList() {
        const list = document.getElementById('centroid-list');
        list.innerHTML = this.centroids.map((c, i) => `
            <div class="centroid-item" style="border-left-color: ${this.colors[i]}">
                <span class="centroid-label">Cluster ${i + 1}</span>
                <span class="centroid-coords">(${c.x.toFixed(2)}, ${c.y.toFixed(2)})</span>
            </div>
        `).join('');
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;

        for (let i = 0; i <= 20; i++) {
            const x = w * i / 20;
            const y = h * i / 20;

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        const scale = Math.min(w, h) * 0.4;
        const cx = w / 2;
        const cy = h / 2;

        // Draw Voronoi regions (simplified)
        if (this.iteration > 0) {
            for (let px = 0; px < w; px += 10) {
                for (let py = 0; py < h; py += 10) {
                    const x = (px - cx) / scale;
                    const y = (cy - py) / scale;

                    let minDist = Infinity;
                    let nearest = 0;

                    for (let j = 0; j < this.centroids.length; j++) {
                        const dist = Math.pow(x - this.centroids[j].x, 2) + Math.pow(y - this.centroids[j].y, 2);
                        if (dist < minDist) {
                            minDist = dist;
                            nearest = j;
                        }
                    }

                    ctx.fillStyle = this.hexToRgba(this.colors[nearest], 0.08);
                    ctx.fillRect(px, py, 10, 10);
                }
            }
        }

        // Draw data points
        for (let i = 0; i < this.data.length; i++) {
            const point = this.data[i];
            const px = cx + point.x * scale;
            const py = cy - point.y * scale;

            const color = this.assignments[i] >= 0 ? this.colors[this.assignments[i]] : '#666';

            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }

        // Draw centroids
        for (let i = 0; i < this.centroids.length; i++) {
            const c = this.centroids[i];
            const px = cx + c.x * scale;
            const py = cy - c.y * scale;

            // Outer ring
            ctx.beginPath();
            ctx.arc(px, py, 18, 0, Math.PI * 2);
            ctx.strokeStyle = this.colors[i];
            ctx.lineWidth = 3;
            ctx.stroke();

            // Inner cross
            ctx.beginPath();
            ctx.moveTo(px - 8, py);
            ctx.lineTo(px + 8, py);
            ctx.moveTo(px, py - 8);
            ctx.lineTo(px, py + 8);
            ctx.strokeStyle = this.colors[i];
            ctx.lineWidth = 2;
            ctx.stroke();

            // Center dot
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
        }
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// Add additional CSS for centroid list
const style = document.createElement('style');
style.textContent = `
    .single-viz {
        flex: 1;
        min-height: 0;
    }
    
    .single-viz canvas {
        width: 100%;
        height: 100%;
    }
    
    .centroid-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .centroid-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: var(--bg-secondary);
        border-radius: 6px;
        border-left: 3px solid;
    }
    
    .centroid-label {
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--text-primary);
    }
    
    .centroid-coords {
        font-size: 0.75rem;
        font-family: var(--font-mono);
        color: var(--text-muted);
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new KMeansApp();
});
