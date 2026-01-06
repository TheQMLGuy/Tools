/**
 * Naive Bayes Visualizer
 * Gaussian Naive Bayes with probability contours
 */

class NaiveBayesApp {
    constructor() {
        this.data = [];
        this.trained = false;
        this.classParams = {};
        this.priors = {};
        this.classes = [];

        this.colors = ['#6366f1', '#10b981', '#f59e0b'];

        this.initCanvas();
        this.setupEventListeners();
        this.generateData();
    }

    initCanvas() {
        this.canvas = document.getElementById('bayes-canvas');
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
        document.getElementById('train-btn').addEventListener('click', () => this.train());
    }

    generateData() {
        const dataset = document.getElementById('dataset-select').value;
        this.data = [];
        this.trained = false;

        switch (dataset) {
            case 'gaussian':
                this.generateGaussian();
                break;
            case 'overlap':
                this.generateOverlap();
                break;
            case 'three-class':
                this.generateThreeClass();
                break;
        }

        this.classes = [...new Set(this.data.map(d => d.class))];
        this.updateUI();
        this.render();
    }

    generateGaussian() {
        for (let i = 0; i < 40; i++) {
            this.data.push({ x: -0.5 + this.randn() * 0.2, y: 0.4 + this.randn() * 0.15, class: 0 });
            this.data.push({ x: 0.5 + this.randn() * 0.2, y: -0.4 + this.randn() * 0.15, class: 1 });
        }
    }

    generateOverlap() {
        for (let i = 0; i < 40; i++) {
            this.data.push({ x: -0.1 + this.randn() * 0.3, y: 0.1 + this.randn() * 0.3, class: 0 });
            this.data.push({ x: 0.1 + this.randn() * 0.3, y: -0.1 + this.randn() * 0.3, class: 1 });
        }
    }

    generateThreeClass() {
        const centers = [
            { x: 0, y: 0.5, class: 0 },
            { x: -0.4, y: -0.3, class: 1 },
            { x: 0.4, y: -0.3, class: 2 }
        ];

        for (const c of centers) {
            for (let i = 0; i < 30; i++) {
                this.data.push({
                    x: c.x + this.randn() * 0.2,
                    y: c.y + this.randn() * 0.2,
                    class: c.class
                });
            }
        }
    }

    randn() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    train() {
        // Calculate class priors and Gaussian parameters
        this.classParams = {};
        this.priors = {};

        for (const c of this.classes) {
            const classData = this.data.filter(d => d.class === c);
            const n = classData.length;

            // Prior probability
            this.priors[c] = n / this.data.length;

            // Mean
            const meanX = classData.reduce((s, d) => s + d.x, 0) / n;
            const meanY = classData.reduce((s, d) => s + d.y, 0) / n;

            // Variance
            const varX = classData.reduce((s, d) => s + Math.pow(d.x - meanX, 2), 0) / n;
            const varY = classData.reduce((s, d) => s + Math.pow(d.y - meanY, 2), 0) / n;

            this.classParams[c] = {
                meanX, meanY,
                varX: Math.max(varX, 0.01),
                varY: Math.max(varY, 0.01)
            };
        }

        this.trained = true;
        this.updateUI();
        this.render();
    }

    predict(x, y) {
        if (!this.trained) return 0;

        let maxProb = -Infinity;
        let predicted = 0;

        for (const c of this.classes) {
            const params = this.classParams[c];
            const prior = this.priors[c];

            // Log probability (to avoid underflow)
            const logPrior = Math.log(prior);
            const logLikelihoodX = -0.5 * Math.log(2 * Math.PI * params.varX) -
                Math.pow(x - params.meanX, 2) / (2 * params.varX);
            const logLikelihoodY = -0.5 * Math.log(2 * Math.PI * params.varY) -
                Math.pow(y - params.meanY, 2) / (2 * params.varY);

            const logProb = logPrior + logLikelihoodX + logLikelihoodY;

            if (logProb > maxProb) {
                maxProb = logProb;
                predicted = c;
            }
        }

        return predicted;
    }

    computeAccuracy() {
        if (!this.trained) return 0;
        let correct = 0;
        for (const d of this.data) {
            if (this.predict(d.x, d.y) === d.class) correct++;
        }
        return correct / this.data.length;
    }

    updateUI() {
        document.getElementById('status').textContent = this.trained ? 'Trained' : 'Untrained';
        document.getElementById('accuracy').textContent = this.trained ?
            (this.computeAccuracy() * 100).toFixed(1) + '%' : '-';

        // Update priors
        const priorsList = document.getElementById('priors-list');
        if (this.trained) {
            priorsList.innerHTML = this.classes.map(c => `
                <div class="prior-item" style="border-left: 3px solid ${this.colors[c]};">
                    <span>Class ${c}</span>
                    <span>${(this.priors[c] * 100).toFixed(1)}%</span>
                </div>
            `).join('');
        } else {
            priorsList.innerHTML = '<div class="muted">Train model to see priors</div>';
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

            // Draw Gaussian ellipses for each class
            for (const c of this.classes) {
                const params = this.classParams[c];
                const mx = cx + params.meanX * scale;
                const my = cy - params.meanY * scale;

                // Draw 1-sigma and 2-sigma ellipses
                for (const sigma of [1, 2]) {
                    ctx.beginPath();
                    ctx.ellipse(mx, my,
                        Math.sqrt(params.varX) * sigma * scale,
                        Math.sqrt(params.varY) * sigma * scale,
                        0, 0, Math.PI * 2);
                    ctx.strokeStyle = this.hexToRgba(this.colors[c], 0.4 / sigma);
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Draw mean point
                ctx.beginPath();
                ctx.arc(mx, my, 6, 0, Math.PI * 2);
                ctx.fillStyle = this.colors[c];
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Draw data points
        for (const d of this.data) {
            const px = cx + d.x * scale;
            const py = cy - d.y * scale;

            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fillStyle = this.colors[d.class];
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

// Additional CSS
const style = document.createElement('style');
style.textContent = `
    .single-viz { flex: 1; min-height: 0; }
    .single-viz canvas { width: 100%; height: 100%; }
    .prior-item {
        display: flex;
        justify-content: space-between;
        padding: 6px 10px;
        background: var(--bg-secondary);
        border-radius: 4px;
        margin-bottom: 6px;
        font-size: 0.85rem;
    }
    .muted { color: var(--text-muted); font-size: 0.8rem; }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    window.app = new NaiveBayesApp();
});
