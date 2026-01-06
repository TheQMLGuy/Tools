/**
 * DBSCAN Visualizer
 * Density-based clustering with epsilon neighborhood
 */

class DBSCANApp {
    constructor() {
        this.data = [];
        this.labels = [];
        this.epsilon = 0.15;
        this.minPts = 4;
        this.corePoints = new Set();

        this.colors = [
            '#6366f1', '#10b981', '#f59e0b', '#ec4899',
            '#8b5cf6', '#06b6d4', '#ef4444', '#14b8a6'
        ];

        this.initCanvas();
        this.setupEventListeners();
        this.generateData();
    }

    initCanvas() {
        this.canvas = document.getElementById('dbscan-canvas');
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
        document.getElementById('generate-btn').addEventListener('click', () => this.generateData());

        document.getElementById('epsilon').addEventListener('input', (e) => {
            this.epsilon = parseInt(e.target.value) / 100;
            document.getElementById('epsilon-value').textContent = this.epsilon.toFixed(2);
        });

        document.getElementById('min-pts').addEventListener('input', (e) => {
            this.minPts = parseInt(e.target.value);
            document.getElementById('min-pts-value').textContent = this.minPts;
        });

        document.getElementById('run-btn').addEventListener('click', () => this.runDBSCAN());
    }

    generateData() {
        const dataset = document.getElementById('dataset-select').value;
        this.data = [];
        this.labels = [];
        this.corePoints = new Set();

        switch (dataset) {
            case 'blobs':
                this.generateBlobs();
                break;
            case 'moons':
                this.generateMoons();
                break;
            case 'circles':
                this.generateCircles();
                break;
            case 'noise':
                this.generateWithNoise();
                break;
        }

        this.updateStats();
        this.render();
    }

    generateBlobs() {
        const centers = [
            { x: -0.5, y: 0.4 },
            { x: 0.5, y: 0.4 },
            { x: 0, y: -0.4 }
        ];

        for (const c of centers) {
            for (let i = 0; i < 30; i++) {
                this.data.push({
                    x: c.x + (Math.random() - 0.5) * 0.3,
                    y: c.y + (Math.random() - 0.5) * 0.3
                });
            }
        }
    }

    generateMoons() {
        for (let i = 0; i < 60; i++) {
            const angle = (i / 60) * Math.PI;
            const noise = (Math.random() - 0.5) * 0.08;

            // Upper moon
            this.data.push({
                x: Math.cos(angle) * 0.5,
                y: Math.sin(angle) * 0.5 + noise
            });

            // Lower moon
            this.data.push({
                x: 0.5 + Math.cos(angle + Math.PI) * 0.5,
                y: 0.25 + Math.sin(angle + Math.PI) * 0.5 + noise
            });
        }
    }

    generateCircles() {
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            const noise = (Math.random() - 0.5) * 0.05;

            // Inner circle
            this.data.push({
                x: Math.cos(angle) * 0.2 + noise,
                y: Math.sin(angle) * 0.2 + noise
            });

            // Outer circle
            this.data.push({
                x: Math.cos(angle) * 0.5 + noise,
                y: Math.sin(angle) * 0.5 + noise
            });
        }
    }

    generateWithNoise() {
        // Two clusters
        for (let i = 0; i < 30; i++) {
            this.data.push({
                x: -0.4 + (Math.random() - 0.5) * 0.3,
                y: 0 + (Math.random() - 0.5) * 0.3
            });
            this.data.push({
                x: 0.4 + (Math.random() - 0.5) * 0.3,
                y: 0 + (Math.random() - 0.5) * 0.3
            });
        }

        // Random noise
        for (let i = 0; i < 20; i++) {
            this.data.push({
                x: (Math.random() - 0.5) * 1.6,
                y: (Math.random() - 0.5) * 1.2
            });
        }
    }

    distance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    getNeighbors(pointIdx) {
        const neighbors = [];
        for (let i = 0; i < this.data.length; i++) {
            if (i !== pointIdx && this.distance(this.data[pointIdx], this.data[i]) <= this.epsilon) {
                neighbors.push(i);
            }
        }
        return neighbors;
    }

    runDBSCAN() {
        const n = this.data.length;
        this.labels = new Array(n).fill(-1); // -1 = unvisited, -2 = noise
        this.corePoints = new Set();
        let clusterId = 0;

        for (let i = 0; i < n; i++) {
            if (this.labels[i] !== -1) continue;

            const neighbors = this.getNeighbors(i);

            if (neighbors.length < this.minPts - 1) {
                this.labels[i] = -2; // Noise
            } else {
                this.corePoints.add(i);
                this.expandCluster(i, neighbors, clusterId);
                clusterId++;
            }
        }

        this.updateStats();
        this.render();
    }

    expandCluster(pointIdx, neighbors, clusterId) {
        this.labels[pointIdx] = clusterId;

        const queue = [...neighbors];
        const visited = new Set([pointIdx]);

        while (queue.length > 0) {
            const current = queue.shift();

            if (visited.has(current)) continue;
            visited.add(current);

            if (this.labels[current] === -2) {
                this.labels[current] = clusterId; // Border point
            }

            if (this.labels[current] !== -1) continue;

            this.labels[current] = clusterId;

            const currentNeighbors = this.getNeighbors(current);
            if (currentNeighbors.length >= this.minPts - 1) {
                this.corePoints.add(current);
                for (const n of currentNeighbors) {
                    if (!visited.has(n)) {
                        queue.push(n);
                    }
                }
            }
        }
    }

    updateStats() {
        const clusters = new Set(this.labels.filter(l => l >= 0));
        const noise = this.labels.filter(l => l === -2).length;

        document.getElementById('num-clusters').textContent = clusters.size || '-';
        document.getElementById('noise-points').textContent = noise || '-';
        document.getElementById('core-points').textContent = this.corePoints.size || '-';
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        const scale = Math.min(w, h) * 0.4;
        const cx = w / 2;
        const cy = h / 2;

        // Draw epsilon circles for core points
        for (const idx of this.corePoints) {
            const p = this.data[idx];
            const px = cx + p.x * scale;
            const py = cy - p.y * scale;

            ctx.beginPath();
            ctx.arc(px, py, this.epsilon * scale, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw data points
        for (let i = 0; i < this.data.length; i++) {
            const p = this.data[i];
            const px = cx + p.x * scale;
            const py = cy - p.y * scale;
            const label = this.labels[i];
            const isCore = this.corePoints.has(i);

            let color;
            if (label === -2 || label === -1) {
                color = '#666';
            } else {
                color = this.colors[label % this.colors.length];
            }

            ctx.beginPath();
            ctx.arc(px, py, isCore ? 8 : 5, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            if (isCore) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Legend
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '11px Inter';
        ctx.fillText('● Core points (with ring)', 10, h - 30);
        ctx.fillStyle = '#666';
        ctx.fillText('● Noise points (gray)', 10, h - 15);
    }
}

// Additional CSS
const style = document.createElement('style');
style.textContent = `
    .single-viz { flex: 1; min-height: 0; }
    .single-viz canvas { width: 100%; height: 100%; }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    window.app = new DBSCANApp();
});
