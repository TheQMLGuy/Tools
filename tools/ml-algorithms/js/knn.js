/**
 * K-Nearest Neighbors Visualizer
 * Interactive classification with neighbor visualization
 */

class KNNApp {
    constructor() {
        this.data = [];
        this.k = 5;
        this.queryPoint = null;
        this.nearestNeighbors = [];
        this.showBoundary = false;
        this.boundaryCache = null;

        this.colors = {
            0: '#6366f1',
            1: '#10b981',
            2: '#f59e0b'
        };

        this.classNames = ['Class A', 'Class B', 'Class C'];

        this.initCanvas();
        this.setupEventListeners();
        this.generateData();
    }

    initCanvas() {
        this.canvas = document.getElementById('knn-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.boundaryCache = null;
        this.render();
    }

    setupEventListeners() {
        document.getElementById('k-value').addEventListener('input', (e) => {
            this.k = parseInt(e.target.value);
            document.getElementById('k-value-display').textContent = this.k;
            this.boundaryCache = null;
            if (this.queryPoint) this.classify(this.queryPoint);
            this.render();
        });

        document.getElementById('distance-metric').addEventListener('change', () => {
            this.boundaryCache = null;
            if (this.queryPoint) this.classify(this.queryPoint);
            this.render();
        });

        document.getElementById('dataset-select').addEventListener('change', () => this.generateData());
        document.getElementById('generate-btn').addEventListener('click', () => this.generateData());

        document.getElementById('show-boundary-btn').addEventListener('click', () => {
            this.showBoundary = !this.showBoundary;
            document.getElementById('show-boundary-btn').textContent =
                this.showBoundary ? 'Hide Boundary' : 'Show Decision Boundary';
            this.render();
        });

        // Click to classify
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const scale = Math.min(this.canvas.width, this.canvas.height) * 0.4;
            const cx = this.canvas.width / 2;
            const cy = this.canvas.height / 2;

            const dataX = (x - cx) / scale;
            const dataY = (cy - y) / scale;

            this.queryPoint = { x: dataX, y: dataY };
            this.classify(this.queryPoint);
            this.render();
        });

        // Hover for preview
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.hoverX = e.clientX - rect.left;
            this.hoverY = e.clientY - rect.top;
            this.render();
        });
    }

    generateData() {
        const dataset = document.getElementById('dataset-select').value;
        this.data = [];
        this.queryPoint = null;
        this.nearestNeighbors = [];
        this.boundaryCache = null;

        switch (dataset) {
            case 'two-clusters':
                this.generateTwoClusters();
                break;
            case 'three-clusters':
                this.generateThreeClusters();
                break;
            case 'spiral':
                this.generateSpiral();
                break;
        }

        this.render();
    }

    generateTwoClusters() {
        // Class 0 - top left
        for (let i = 0; i < 40; i++) {
            this.data.push({
                x: -0.5 + (Math.random() - 0.5) * 0.5,
                y: 0.5 + (Math.random() - 0.5) * 0.5,
                class: 0
            });
        }

        // Class 1 - bottom right
        for (let i = 0; i < 40; i++) {
            this.data.push({
                x: 0.5 + (Math.random() - 0.5) * 0.5,
                y: -0.5 + (Math.random() - 0.5) * 0.5,
                class: 1
            });
        }
    }

    generateThreeClusters() {
        const centers = [
            { x: 0, y: 0.6, class: 0 },
            { x: -0.5, y: -0.4, class: 1 },
            { x: 0.5, y: -0.4, class: 2 }
        ];

        for (const center of centers) {
            for (let i = 0; i < 30; i++) {
                this.data.push({
                    x: center.x + (Math.random() - 0.5) * 0.5,
                    y: center.y + (Math.random() - 0.5) * 0.5,
                    class: center.class
                });
            }
        }
    }

    generateSpiral() {
        for (let i = 0; i < 50; i++) {
            const t = i / 50 * 2 * Math.PI;
            const r = t / (2 * Math.PI) * 0.6 + 0.1;

            // Class 0
            this.data.push({
                x: r * Math.cos(t) + (Math.random() - 0.5) * 0.1,
                y: r * Math.sin(t) + (Math.random() - 0.5) * 0.1,
                class: 0
            });

            // Class 1 (rotated)
            this.data.push({
                x: r * Math.cos(t + Math.PI) + (Math.random() - 0.5) * 0.1,
                y: r * Math.sin(t + Math.PI) + (Math.random() - 0.5) * 0.1,
                class: 1
            });
        }
    }

    distance(a, b) {
        const metric = document.getElementById('distance-metric').value;

        if (metric === 'manhattan') {
            return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        }
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    classify(point) {
        // Find K nearest neighbors
        const distances = this.data.map((d, i) => ({
            index: i,
            point: d,
            distance: this.distance(point, d)
        }));

        distances.sort((a, b) => a.distance - b.distance);
        this.nearestNeighbors = distances.slice(0, this.k);

        // Vote
        const votes = {};
        for (const neighbor of this.nearestNeighbors) {
            const c = neighbor.point.class;
            votes[c] = (votes[c] || 0) + 1;
        }

        // Find winner
        let maxVotes = 0;
        let predictedClass = 0;
        for (const [c, count] of Object.entries(votes)) {
            if (count > maxVotes) {
                maxVotes = count;
                predictedClass = parseInt(c);
            }
        }

        // Update UI
        document.getElementById('query-point').textContent =
            `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
        document.getElementById('predicted-class').textContent =
            this.classNames[predictedClass];
        document.getElementById('predicted-class').style.color = this.colors[predictedClass];
        document.getElementById('confidence').textContent =
            `${((maxVotes / this.k) * 100).toFixed(0)}% (${maxVotes}/${this.k})`;

        // Update neighbor list
        const list = document.getElementById('neighbor-list');
        list.innerHTML = this.nearestNeighbors.map((n, i) => `
            <div class="neighbor-item" style="border-left-color: ${this.colors[n.point.class]}">
                <span class="neighbor-rank">#${i + 1}</span>
                <span class="neighbor-class">${this.classNames[n.point.class]}</span>
                <span class="neighbor-dist">d=${n.distance.toFixed(3)}</span>
            </div>
        `).join('');

        return predictedClass;
    }

    computeBoundary() {
        if (this.boundaryCache) return this.boundaryCache;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const scale = Math.min(w, h) * 0.4;
        const cx = w / 2;
        const cy = h / 2;
        const step = 8;

        const boundary = [];

        for (let px = 0; px < w; px += step) {
            for (let py = 0; py < h; py += step) {
                const x = (px - cx) / scale;
                const y = (cy - py) / scale;

                // Find nearest neighbors
                const distances = this.data.map(d => ({
                    d,
                    dist: this.distance({ x, y }, d)
                }));
                distances.sort((a, b) => a.dist - b.dist);

                const nearest = distances.slice(0, this.k);
                const votes = {};
                for (const n of nearest) {
                    votes[n.d.class] = (votes[n.d.class] || 0) + 1;
                }

                let maxVotes = 0;
                let predictedClass = 0;
                for (const [c, count] of Object.entries(votes)) {
                    if (count > maxVotes) {
                        maxVotes = count;
                        predictedClass = parseInt(c);
                    }
                }

                boundary.push({ px, py, class: predictedClass });
            }
        }

        this.boundaryCache = boundary;
        return boundary;
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        const scale = Math.min(w, h) * 0.4;
        const cx = w / 2;
        const cy = h / 2;

        // Decision boundary
        if (this.showBoundary && this.data.length > 0) {
            const boundary = this.computeBoundary();
            const step = 8;

            for (const b of boundary) {
                ctx.fillStyle = this.hexToRgba(this.colors[b.class], 0.15);
                ctx.fillRect(b.px, b.py, step, step);
            }
        }

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;

        for (let i = 0; i <= 10; i++) {
            const x = w * i / 10;
            const y = h * i / 10;

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Draw connections to neighbors
        if (this.queryPoint && this.nearestNeighbors.length > 0) {
            const qx = cx + this.queryPoint.x * scale;
            const qy = cy - this.queryPoint.y * scale;

            for (const neighbor of this.nearestNeighbors) {
                const nx = cx + neighbor.point.x * scale;
                const ny = cy - neighbor.point.y * scale;

                ctx.beginPath();
                ctx.moveTo(qx, qy);
                ctx.lineTo(nx, ny);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Draw training data
        for (const point of this.data) {
            const px = cx + point.x * scale;
            const py = cy - point.y * scale;

            const isNeighbor = this.nearestNeighbors.some(n => n.point === point);

            ctx.beginPath();
            ctx.arc(px, py, isNeighbor ? 10 : 6, 0, Math.PI * 2);
            ctx.fillStyle = this.colors[point.class];
            ctx.fill();

            if (isNeighbor) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Draw query point
        if (this.queryPoint) {
            const qx = cx + this.queryPoint.x * scale;
            const qy = cy - this.queryPoint.y * scale;

            // Cross hair
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(qx - 15, qy);
            ctx.lineTo(qx + 15, qy);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(qx, qy - 15);
            ctx.lineTo(qx, qy + 15);
            ctx.stroke();

            // Center dot
            ctx.beginPath();
            ctx.arc(qx, qy, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
        }

        // Instruction text
        if (!this.queryPoint) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Click anywhere to classify a point', w / 2, h - 30);
        }
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// Additional CSS
const style = document.createElement('style');
style.textContent = `
    .single-viz {
        flex: 1;
        min-height: 0;
    }
    
    .single-viz canvas {
        width: 100%;
        height: 100%;
        cursor: crosshair;
    }
    
    .neighbor-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 200px;
        overflow-y: auto;
    }
    
    .neighbor-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        background: var(--bg-secondary);
        border-radius: 4px;
        border-left: 3px solid;
        font-size: 0.8rem;
    }
    
    .neighbor-rank {
        color: var(--text-muted);
        font-weight: 600;
        min-width: 25px;
    }
    
    .neighbor-class {
        color: var(--text-primary);
        flex: 1;
    }
    
    .neighbor-dist {
        color: var(--text-muted);
        font-family: var(--font-mono);
        font-size: 0.7rem;
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new KNNApp();
});
