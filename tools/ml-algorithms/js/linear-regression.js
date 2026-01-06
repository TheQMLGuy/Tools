/**
 * Linear Regression Visualizer
 * Gradient descent with live visualization
 */

class LinearRegressionApp {
    constructor() {
        this.data = [];
        this.weight = 0;
        this.bias = 0;
        this.learningRate = 0.01;
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

        this.lossCanvas = document.getElementById('loss-canvas');
        this.lossCtx = this.lossCanvas.getContext('2d');

        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
    }

    resizeCanvases() {
        const containers = document.querySelectorAll('.viz-container');

        containers.forEach((container, i) => {
            const canvas = container.querySelector('canvas');
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width - 32;
            canvas.height = rect.height - 60;
        });

        this.render();
    }

    setupEventListeners() {
        // Dataset selection
        document.getElementById('dataset-select').addEventListener('change', () => this.generateData());

        // Sliders
        document.getElementById('num-points').addEventListener('input', (e) => {
            document.getElementById('num-points-value').textContent = e.target.value;
        });

        document.getElementById('noise-level').addEventListener('input', (e) => {
            document.getElementById('noise-level-value').textContent = e.target.value;
        });

        document.getElementById('learning-rate').addEventListener('input', (e) => {
            this.learningRate = e.target.value / 1000;
            document.getElementById('learning-rate-value').textContent = this.learningRate.toFixed(3);
        });

        // Buttons
        document.getElementById('generate-btn').addEventListener('click', () => this.generateData());
        document.getElementById('train-btn').addEventListener('click', () => this.toggleTraining());
        document.getElementById('step-btn').addEventListener('click', () => this.trainStep());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
    }

    generateData() {
        const n = parseInt(document.getElementById('num-points').value);
        const noise = parseFloat(document.getElementById('noise-level').value) / 100;
        const dataset = document.getElementById('dataset-select').value;

        this.data = [];

        for (let i = 0; i < n; i++) {
            const x = (Math.random() - 0.5) * 2; // Range [-1, 1]
            let y;

            switch (dataset) {
                case 'linear':
                    y = 0.7 * x + 0.3 + (Math.random() - 0.5) * noise;
                    break;
                case 'quadratic':
                    y = x * x + (Math.random() - 0.5) * noise;
                    break;
                case 'random':
                    y = (Math.random() - 0.5) * 2;
                    break;
            }

            this.data.push({ x, y });
        }

        this.reset();
    }

    reset() {
        this.weight = 0;
        this.bias = 0;
        this.epoch = 0;
        this.lossHistory = [];
        this.isTraining = false;
        document.getElementById('train-btn').textContent = '▶ Train';
        this.updateStats();
        this.render();
    }

    toggleTraining() {
        this.isTraining = !this.isTraining;
        document.getElementById('train-btn').textContent = this.isTraining ? '⏸ Pause' : '▶ Train';

        if (this.isTraining) {
            this.trainingLoop();
        }
    }

    trainingLoop() {
        if (!this.isTraining) return;

        this.trainStep();

        if (this.epoch < 1000) {
            requestAnimationFrame(() => this.trainingLoop());
        } else {
            this.isTraining = false;
            document.getElementById('train-btn').textContent = '▶ Train';
        }
    }

    trainStep() {
        const n = this.data.length;
        if (n === 0) return;

        // Compute gradients
        let dw = 0;
        let db = 0;

        for (const point of this.data) {
            const prediction = this.weight * point.x + this.bias;
            const error = prediction - point.y;
            dw += error * point.x;
            db += error;
        }

        dw /= n;
        db /= n;

        // Update weights
        this.weight -= this.learningRate * dw;
        this.bias -= this.learningRate * db;

        // Compute loss
        const loss = this.computeLoss();
        this.lossHistory.push(loss);

        this.epoch++;
        this.updateStats();
        this.render();
    }

    computeLoss() {
        let mse = 0;
        for (const point of this.data) {
            const prediction = this.weight * point.x + this.bias;
            mse += Math.pow(prediction - point.y, 2);
        }
        return mse / this.data.length;
    }

    computeR2() {
        if (this.data.length === 0) return 0;

        // Mean of y
        const meanY = this.data.reduce((sum, p) => sum + p.y, 0) / this.data.length;

        // Total sum of squares
        let ssTot = 0;
        let ssRes = 0;

        for (const point of this.data) {
            const prediction = this.weight * point.x + this.bias;
            ssTot += Math.pow(point.y - meanY, 2);
            ssRes += Math.pow(point.y - prediction, 2);
        }

        return 1 - (ssRes / ssTot);
    }

    updateStats() {
        const sign = this.bias >= 0 ? '+' : '';
        document.getElementById('equation').textContent =
            `y = ${this.weight.toFixed(3)}x ${sign} ${this.bias.toFixed(3)}`;
        document.getElementById('epoch').textContent = this.epoch;

        if (this.epoch > 0) {
            const loss = this.computeLoss();
            const r2 = this.computeR2();
            document.getElementById('loss').textContent = loss.toFixed(6);
            document.getElementById('r2').textContent = r2.toFixed(4);
        }

        // Update weight bars
        const maxWeight = 2;
        const weightPct = Math.min(100, Math.max(0, (this.weight + maxWeight) / (2 * maxWeight) * 100));
        const biasPct = Math.min(100, Math.max(0, (this.bias + maxWeight) / (2 * maxWeight) * 100));

        document.getElementById('weight-bar').style.width = weightPct + '%';
        document.getElementById('bias-bar').style.width = biasPct + '%';
        document.getElementById('weight-value').textContent = this.weight.toFixed(3);
        document.getElementById('bias-value').textContent = this.bias.toFixed(3);
    }

    render() {
        this.renderScatter();
        this.renderLoss();
    }

    renderScatter() {
        const ctx = this.scatterCtx;
        const w = this.scatterCanvas.width;
        const h = this.scatterCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = '#12121a';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
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

        // Axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        // Scale factor
        const scale = Math.min(w, h) / 3;
        const cx = w / 2;
        const cy = h / 2;

        // Draw regression line
        if (this.epoch > 0) {
            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#8b5cf6';
            ctx.shadowBlur = 10;

            ctx.beginPath();
            const x1 = -1.5;
            const y1 = this.weight * x1 + this.bias;
            const x2 = 1.5;
            const y2 = this.weight * x2 + this.bias;

            ctx.moveTo(cx + x1 * scale, cy - y1 * scale);
            ctx.lineTo(cx + x2 * scale, cy - y2 * scale);
            ctx.stroke();

            ctx.shadowBlur = 0;
        }

        // Draw data points
        for (const point of this.data) {
            const px = cx + point.x * scale;
            const py = cy - point.y * scale;

            // Outer glow
            ctx.beginPath();
            ctx.arc(px, py, 8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
            ctx.fill();

            // Inner point
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#6366f1';
            ctx.fill();
        }
    }

    renderLoss() {
        const ctx = this.lossCtx;
        const w = this.lossCanvas.width;
        const h = this.lossCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = '#12121a';
        ctx.fillRect(0, 0, w, h);

        if (this.lossHistory.length < 2) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Training will show loss curve', w / 2, h / 2);
            return;
        }

        // Find max loss for scaling
        const maxLoss = Math.max(...this.lossHistory);
        const minLoss = Math.min(...this.lossHistory);
        const range = maxLoss - minLoss || 1;

        // Draw loss curve
        ctx.beginPath();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;

        for (let i = 0; i < this.lossHistory.length; i++) {
            const x = (i / (this.lossHistory.length - 1)) * w;
            const y = h - ((this.lossHistory[i] - minLoss) / range) * h * 0.9 - h * 0.05;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText(`Max: ${maxLoss.toFixed(4)}`, 5, 15);
        ctx.fillText(`Min: ${minLoss.toFixed(4)}`, 5, h - 5);
        ctx.textAlign = 'right';
        ctx.fillText(`Epoch: ${this.lossHistory.length}`, w - 5, h - 5);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LinearRegressionApp();
});
