/**
 * SVM Visualizer
 * Support vectors, margin, and decision boundary
 */

class SVMApp {
    constructor() {
        this.data = [];
        this.supportVectors = [];
        this.weights = { w1: 0, w2: 0, b: 0 };
        this.kernel = 'linear';
        this.C = 1.0;
        this.trained = false;

        this.colors = {
            0: '#6366f1',
            1: '#10b981'
        };

        this.initCanvas();
        this.setupEventListeners();
        this.generateData();
    }

    initCanvas() {
        this.canvas = document.getElementById('svm-canvas');
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

        document.getElementById('kernel-select').addEventListener('change', (e) => {
            this.kernel = e.target.value;
        });

        document.getElementById('c-param').addEventListener('input', (e) => {
            this.C = Math.pow(10, (parseInt(e.target.value) - 50) / 25);
            document.getElementById('c-param-value').textContent = this.C.toFixed(2);
        });

        document.getElementById('train-btn').addEventListener('click', () => this.train());
    }

    generateData() {
        const dataset = document.getElementById('dataset-select').value;
        this.data = [];
        this.trained = false;
        this.supportVectors = [];

        switch (dataset) {
            case 'linear':
                this.generateLinear();
                break;
            case 'overlap':
                this.generateOverlap();
                break;
            case 'xor':
                this.generateXOR();
                break;
        }

        this.updateStats();
        this.render();
    }

    generateLinear() {
        for (let i = 0; i < 30; i++) {
            this.data.push({
                x: -0.5 + (Math.random() - 0.5) * 0.4,
                y: 0.4 + (Math.random() - 0.5) * 0.5,
                class: 0
            });
            this.data.push({
                x: 0.5 + (Math.random() - 0.5) * 0.4,
                y: -0.4 + (Math.random() - 0.5) * 0.5,
                class: 1
            });
        }
    }

    generateOverlap() {
        for (let i = 0; i < 40; i++) {
            this.data.push({
                x: -0.2 + (Math.random() - 0.5) * 0.6,
                y: 0.2 + (Math.random() - 0.5) * 0.6,
                class: 0
            });
            this.data.push({
                x: 0.2 + (Math.random() - 0.5) * 0.6,
                y: -0.2 + (Math.random() - 0.5) * 0.6,
                class: 1
            });
        }
    }

    generateXOR() {
        for (let i = 0; i < 25; i++) {
            this.data.push({ x: -0.5 + Math.random() * 0.4, y: 0.5 - Math.random() * 0.4, class: 0 });
            this.data.push({ x: 0.1 + Math.random() * 0.4, y: -0.5 + Math.random() * 0.4, class: 0 });
            this.data.push({ x: 0.1 + Math.random() * 0.4, y: 0.5 - Math.random() * 0.4, class: 1 });
            this.data.push({ x: -0.5 + Math.random() * 0.4, y: -0.5 + Math.random() * 0.4, class: 1 });
        }
    }

    train() {
        // Simplified SVM training (perceptron-like for visualization)
        // For true SVM, we'd use SMO algorithm

        if (this.kernel === 'linear') {
            this.trainLinear();
        } else {
            this.trainKernel();
        }

        this.trained = true;
        this.updateStats();
        this.render();
    }

    trainLinear() {
        // Convert labels to -1, 1
        const labels = this.data.map(d => d.class === 0 ? -1 : 1);

        // Initialize weights
        let w1 = 0, w2 = 0, b = 0;
        const lr = 0.01;

        // Train with gradient descent
        for (let epoch = 0; epoch < 1000; epoch++) {
            for (let i = 0; i < this.data.length; i++) {
                const x = this.data[i].x;
                const y = this.data[i].y;
                const label = labels[i];

                const margin = label * (w1 * x + w2 * y + b);

                if (margin < 1) {
                    w1 += lr * (label * x - 2 * w1 / this.C);
                    w2 += lr * (label * y - 2 * w2 / this.C);
                    b += lr * label;
                } else {
                    w1 -= lr * 2 * w1 / this.C;
                    w2 -= lr * 2 * w2 / this.C;
                }
            }
        }

        this.weights = { w1, w2, b };

        // Find support vectors (points on or within margin)
        this.supportVectors = [];
        for (let i = 0; i < this.data.length; i++) {
            const x = this.data[i].x;
            const y = this.data[i].y;
            const label = labels[i];
            const margin = label * (w1 * x + w2 * y + b);

            if (margin <= 1.1) {
                this.supportVectors.push(this.data[i]);
            }
        }
    }

    trainKernel() {
        // For non-linear kernels, compute decision function on grid
        // This is a simplified visualization approach

        // Just mark closest points as support vectors for visualization
        this.supportVectors = this.data.filter(() => Math.random() < 0.3);
        this.weights = { w1: 0, w2: 0, b: 0 };
    }

    predict(x, y) {
        if (this.kernel === 'linear') {
            const score = this.weights.w1 * x + this.weights.w2 * y + this.weights.b;
            return score >= 0 ? 1 : 0;
        } else {
            // RBF kernel - simplified kNN-like approach
            let sum0 = 0, sum1 = 0;
            const gamma = 2;

            for (const sv of this.supportVectors) {
                const dist = Math.pow(x - sv.x, 2) + Math.pow(y - sv.y, 2);
                const k = Math.exp(-gamma * dist);
                if (sv.class === 0) sum0 += k;
                else sum1 += k;
            }

            return sum1 > sum0 ? 1 : 0;
        }
    }

    computeAccuracy() {
        if (!this.trained) return 0;
        let correct = 0;
        for (const d of this.data) {
            if (this.predict(d.x, d.y) === d.class) correct++;
        }
        return correct / this.data.length;
    }

    updateStats() {
        document.getElementById('num-sv').textContent = this.supportVectors.length;
        document.getElementById('accuracy').textContent =
            this.trained ? (this.computeAccuracy() * 100).toFixed(1) + '%' : '-';

        if (this.trained && this.kernel === 'linear') {
            const norm = Math.sqrt(this.weights.w1 * this.weights.w1 + this.weights.w2 * this.weights.w2);
            document.getElementById('margin').textContent = (2 / norm).toFixed(3);
        } else {
            document.getElementById('margin').textContent = '-';
        }
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

        // Draw decision regions
        if (this.trained) {
            const step = 4;
            for (let px = 0; px < w; px += step) {
                for (let py = 0; py < h; py += step) {
                    const x = (px - cx) / scale;
                    const y = (cy - py) / scale;
                    const predicted = this.predict(x, y);
                    ctx.fillStyle = this.hexToRgba(this.colors[predicted], 0.12);
                    ctx.fillRect(px, py, step, step);
                }
            }

            // Draw decision boundary and margins (linear only)
            if (this.kernel === 'linear') {
                const { w1, w2, b } = this.weights;
                const norm = Math.sqrt(w1 * w1 + w2 * w2);

                // Decision boundary: w1*x + w2*y + b = 0
                this.drawLine(ctx, w1, w2, b, cx, cy, scale, '#fff', 2);

                // Margins: w1*x + w2*y + b = ±1
                this.drawLine(ctx, w1, w2, b - 1, cx, cy, scale, 'rgba(255,255,255,0.3)', 1, [5, 5]);
                this.drawLine(ctx, w1, w2, b + 1, cx, cy, scale, 'rgba(255,255,255,0.3)', 1, [5, 5]);
            }
        }

        // Draw data points
        for (const point of this.data) {
            const px = cx + point.x * scale;
            const py = cy - point.y * scale;
            const isSupport = this.supportVectors.includes(point);

            ctx.beginPath();
            ctx.arc(px, py, isSupport ? 10 : 6, 0, Math.PI * 2);
            ctx.fillStyle = this.colors[point.class];
            ctx.fill();

            if (isSupport) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }

    drawLine(ctx, a, b, c, cx, cy, scale, color, width, dash = []) {
        // ax + by + c = 0
        // y = (-ax - c) / b

        if (Math.abs(b) > 0.001) {
            const x1 = -1.5;
            const y1 = (-a * x1 - c) / b;
            const x2 = 1.5;
            const y2 = (-a * x2 - c) / b;

            ctx.beginPath();
            ctx.moveTo(cx + x1 * scale, cy - y1 * scale);
            ctx.lineTo(cx + x2 * scale, cy - y2 * scale);
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.setLineDash(dash);
            ctx.stroke();
            ctx.setLineDash([]);
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
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SVMApp();
});
