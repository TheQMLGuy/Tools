/**
 * Logistic Regression Visualizer
 * Binary classification with sigmoid
 */

class LogisticRegressionApp {
    constructor() {
        this.data = [];
        this.weights = { w1: 0, w2: 0, b: 0 };
        this.learningRate = 0.5;
        this.epoch = 0;
        this.isTraining = false;
        this.lossHistory = [];

        this.initCanvas();
        this.setupEventListeners();
        this.generateData();
    }

    initCanvas() {
        this.scatterCanvas = document.getElementById('scatter-canvas');
        this.scatterCtx = this.scatterCanvas.getContext('2d');

        this.sigmoidCanvas = document.getElementById('sigmoid-canvas');
        this.sigmoidCtx = this.sigmoidCanvas.getContext('2d');

        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
    }

    resizeCanvases() {
        document.querySelectorAll('.viz-container').forEach(container => {
            const canvas = container.querySelector('canvas');
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width - 32;
            canvas.height = rect.height - 60;
        });
        this.render();
    }

    setupEventListeners() {
        document.getElementById('dataset-select').addEventListener('change', () => this.generateData());
        document.getElementById('generate-btn').addEventListener('click', () => this.generateData());

        document.getElementById('learning-rate').addEventListener('input', (e) => {
            this.learningRate = parseInt(e.target.value) / 100;
            document.getElementById('learning-rate-value').textContent = this.learningRate.toFixed(2);
        });

        document.getElementById('train-btn').addEventListener('click', () => this.toggleTraining());
        document.getElementById('step-btn').addEventListener('click', () => this.trainStep());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
    }

    generateData() {
        const dataset = document.getElementById('dataset-select').value;
        this.data = [];

        switch (dataset) {
            case 'separable':
                for (let i = 0; i < 40; i++) {
                    this.data.push({ x: -0.5 + Math.random() * 0.4, y: 0.3 + Math.random() * 0.4, class: 0 });
                    this.data.push({ x: 0.5 - Math.random() * 0.4, y: -0.3 - Math.random() * 0.4, class: 1 });
                }
                break;
            case 'overlap':
                for (let i = 0; i < 40; i++) {
                    this.data.push({ x: -0.2 + (Math.random() - 0.5) * 0.6, y: 0.2 + (Math.random() - 0.5) * 0.6, class: 0 });
                    this.data.push({ x: 0.2 + (Math.random() - 0.5) * 0.6, y: -0.2 + (Math.random() - 0.5) * 0.6, class: 1 });
                }
                break;
            case 'diagonal':
                for (let i = 0; i < 50; i++) {
                    const x = (Math.random() - 0.5) * 2;
                    const y = (Math.random() - 0.5) * 2;
                    const label = x + y > 0 ? 1 : 0;
                    this.data.push({ x, y, class: label });
                }
                break;
        }

        this.reset();
    }

    reset() {
        this.weights = { w1: 0, w2: 0, b: 0 };
        this.epoch = 0;
        this.lossHistory = [];
        this.isTraining = false;
        document.getElementById('train-btn').textContent = '▶ Train';
        this.updateStats();
        this.render();
    }

    sigmoid(z) {
        return 1 / (1 + Math.exp(-z));
    }

    predict(x, y) {
        const z = this.weights.w1 * x + this.weights.w2 * y + this.weights.b;
        return this.sigmoid(z);
    }

    toggleTraining() {
        this.isTraining = !this.isTraining;
        document.getElementById('train-btn').textContent = this.isTraining ? '⏸ Pause' : '▶ Train';
        if (this.isTraining) this.trainingLoop();
    }

    trainingLoop() {
        if (!this.isTraining) return;
        this.trainStep();
        if (this.epoch < 500) {
            requestAnimationFrame(() => this.trainingLoop());
        } else {
            this.isTraining = false;
            document.getElementById('train-btn').textContent = '▶ Train';
        }
    }

    trainStep() {
        let dw1 = 0, dw2 = 0, db = 0;
        let totalLoss = 0;

        for (const point of this.data) {
            const pred = this.predict(point.x, point.y);
            const error = pred - point.class;

            dw1 += error * point.x;
            dw2 += error * point.y;
            db += error;

            // Binary cross entropy loss
            const eps = 1e-7;
            totalLoss -= point.class * Math.log(pred + eps) + (1 - point.class) * Math.log(1 - pred + eps);
        }

        const n = this.data.length;
        this.weights.w1 -= this.learningRate * dw1 / n;
        this.weights.w2 -= this.learningRate * dw2 / n;
        this.weights.b -= this.learningRate * db / n;

        this.lossHistory.push(totalLoss / n);
        this.epoch++;
        this.updateStats();
        this.render();
    }

    computeAccuracy() {
        let correct = 0;
        for (const point of this.data) {
            const pred = this.predict(point.x, point.y) >= 0.5 ? 1 : 0;
            if (pred === point.class) correct++;
        }
        return correct / this.data.length;
    }

    updateStats() {
        document.getElementById('epoch').textContent = this.epoch;
        document.getElementById('loss').textContent = this.lossHistory.length > 0 ?
            this.lossHistory[this.lossHistory.length - 1].toFixed(4) : '-';
        document.getElementById('accuracy').textContent = this.epoch > 0 ?
            (this.computeAccuracy() * 100).toFixed(1) + '%' : '-';
    }

    render() {
        this.renderScatter();
        this.renderSigmoid();
    }

    renderScatter() {
        const ctx = this.scatterCtx;
        const w = this.scatterCanvas.width;
        const h = this.scatterCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#12121a';
        ctx.fillRect(0, 0, w, h);

        const scale = Math.min(w, h) * 0.35;
        const cx = w / 2;
        const cy = h / 2;

        // Draw probability gradient
        if (this.epoch > 0) {
            const step = 4;
            for (let px = 0; px < w; px += step) {
                for (let py = 0; py < h; py += step) {
                    const x = (px - cx) / scale;
                    const y = (cy - py) / scale;
                    const prob = this.predict(x, y);

                    // Blue for class 0, green for class 1
                    const r = Math.round(99 * (1 - prob) + 16 * prob);
                    const g = Math.round(102 * (1 - prob) + 185 * prob);
                    const b = Math.round(241 * (1 - prob) + 129 * prob);

                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
                    ctx.fillRect(px, py, step, step);
                }
            }

            // Draw decision boundary (where probability = 0.5)
            // w1*x + w2*y + b = 0
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);

            if (Math.abs(this.weights.w2) > 0.001) {
                const x1 = -1.5;
                const y1 = (-this.weights.w1 * x1 - this.weights.b) / this.weights.w2;
                const x2 = 1.5;
                const y2 = (-this.weights.w1 * x2 - this.weights.b) / this.weights.w2;

                ctx.beginPath();
                ctx.moveTo(cx + x1 * scale, cy - y1 * scale);
                ctx.lineTo(cx + x2 * scale, cy - y2 * scale);
                ctx.stroke();
            }
            ctx.setLineDash([]);
        }

        // Draw data points
        for (const point of this.data) {
            const px = cx + point.x * scale;
            const py = cy - point.y * scale;

            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fillStyle = point.class === 0 ? '#6366f1' : '#10b981';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    renderSigmoid() {
        const ctx = this.sigmoidCtx;
        const w = this.sigmoidCanvas.width;
        const h = this.sigmoidCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#12121a';
        ctx.fillRect(0, 0, w, h);

        // Draw sigmoid curve
        ctx.beginPath();
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;

        for (let px = 0; px < w; px++) {
            const z = (px / w - 0.5) * 12;
            const y = this.sigmoid(z);
            const py = h - y * h * 0.9 - h * 0.05;

            if (px === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Draw threshold line
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '11px Inter';
        ctx.fillText('σ(z) = 1/(1+e^-z)', 10, 20);
        ctx.fillText('0.5 threshold', 10, h / 2 - 5);
    }
}

// Additional CSS
const style = document.createElement('style');
style.textContent = `
    .visualization-area {
        flex: 1;
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
        min-height: 0;
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    window.app = new LogisticRegressionApp();
});
