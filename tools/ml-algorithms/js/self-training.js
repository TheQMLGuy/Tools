/**
 * Self-Training Visualizer
 * Semi-supervised learning with pseudo-labels
 */

class SelfTrainingApp {
    constructor() {
        this.data = [];
        this.labels = [];
        this.isLabeled = [];
        this.trueLables = [];
        this.threshold = 0.8;
        this.iteration = 0;
        this.isTraining = false;

        this.colors = { 0: '#6366f1', 1: '#10b981' };

        this.initCanvas();
        this.setupEventListeners();
        this.generateData();
    }

    initCanvas() {
        this.canvas = document.getElementById('self-training-canvas');
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
        document.getElementById('num-labeled').addEventListener('input', (e) => {
            document.getElementById('num-labeled-value').textContent = e.target.value;
        });

        document.getElementById('num-unlabeled').addEventListener('input', (e) => {
            document.getElementById('num-unlabeled-value').textContent = e.target.value;
        });

        document.getElementById('threshold').addEventListener('input', (e) => {
            this.threshold = parseInt(e.target.value) / 100;
            document.getElementById('threshold-value').textContent = this.threshold.toFixed(2);
        });

        document.getElementById('generate-btn').addEventListener('click', () => this.generateData());
        document.getElementById('train-btn').addEventListener('click', () => this.toggleTraining());
        document.getElementById('step-btn').addEventListener('click', () => this.step());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
    }

    generateData() {
        this.data = [];
        this.labels = [];
        this.isLabeled = [];
        this.trueLabels = [];

        const numLabeled = parseInt(document.getElementById('num-labeled').value);
        const numUnlabeled = parseInt(document.getElementById('num-unlabeled').value);

        // Generate labeled points
        for (let i = 0; i < numLabeled / 2; i++) {
            this.data.push({ x: -0.5 + (Math.random() - 0.5) * 0.3, y: 0.3 + (Math.random() - 0.5) * 0.3 });
            this.labels.push(0);
            this.trueLabels.push(0);
            this.isLabeled.push(true);

            this.data.push({ x: 0.5 + (Math.random() - 0.5) * 0.3, y: -0.3 + (Math.random() - 0.5) * 0.3 });
            this.labels.push(1);
            this.trueLabels.push(1);
            this.isLabeled.push(true);
        }

        // Generate unlabeled points
        for (let i = 0; i < numUnlabeled; i++) {
            const trueLabel = Math.random() < 0.5 ? 0 : 1;
            const center = trueLabel === 0 ? { x: -0.5, y: 0.3 } : { x: 0.5, y: -0.3 };

            this.data.push({
                x: center.x + (Math.random() - 0.5) * 0.6,
                y: center.y + (Math.random() - 0.5) * 0.6
            });
            this.labels.push(-1);
            this.trueLabels.push(trueLabel);
            this.isLabeled.push(false);
        }

        this.iteration = 0;
        this.updateStats();
        this.render();
    }

    reset() {
        // Reset labels to initial state
        for (let i = 0; i < this.data.length; i++) {
            if (!this.isLabeled[i]) {
                this.labels[i] = -1;
            }
        }
        this.isLabeled = this.isLabeled.map((l, i) => this.labels[i] !== -1);
        this.iteration = 0;
        this.isTraining = false;
        document.getElementById('train-btn').textContent = '▶ Train';
        this.updateStats();
        this.render();
    }

    toggleTraining() {
        this.isTraining = !this.isTraining;
        document.getElementById('train-btn').textContent = this.isTraining ? '⏸ Pause' : '▶ Train';
        if (this.isTraining) this.trainLoop();
    }

    trainLoop() {
        if (!this.isTraining) return;

        const added = this.step();

        if (added > 0) {
            setTimeout(() => this.trainLoop(), 500);
        } else {
            this.isTraining = false;
            document.getElementById('train-btn').textContent = '▶ Train';
        }
    }

    step() {
        // Train classifier on labeled data
        const labeledData = this.data.filter((_, i) => this.isLabeled[i]);
        const labeledLabels = this.labels.filter((_, i) => this.isLabeled[i]);

        if (labeledData.length < 2) return 0;

        // Simple logistic regression for 2 classes
        const { w1, w2, b } = this.trainClassifier(labeledData, labeledLabels);

        // Predict unlabeled points
        let added = 0;

        for (let i = 0; i < this.data.length; i++) {
            if (this.isLabeled[i]) continue;

            const p = this.data[i];
            const z = w1 * p.x + w2 * p.y + b;
            const prob = 1 / (1 + Math.exp(-z));

            const confidence = Math.max(prob, 1 - prob);

            if (confidence >= this.threshold) {
                this.labels[i] = prob >= 0.5 ? 1 : 0;
                this.isLabeled[i] = true;
                added++;
            }
        }

        this.iteration++;
        this.updateStats();
        this.render();

        return added;
    }

    trainClassifier(data, labels) {
        let w1 = 0, w2 = 0, b = 0;
        const lr = 0.5;

        for (let epoch = 0; epoch < 100; epoch++) {
            for (let i = 0; i < data.length; i++) {
                const x = data[i].x;
                const y = data[i].y;
                const z = w1 * x + w2 * y + b;
                const pred = 1 / (1 + Math.exp(-z));
                const error = pred - labels[i];

                w1 -= lr * error * x;
                w2 -= lr * error * y;
                b -= lr * error;
            }
        }

        return { w1, w2, b };
    }

    computeAccuracy() {
        // Train on current labeled data
        const labeledData = this.data.filter((_, i) => this.isLabeled[i]);
        const labeledLabels = this.labels.filter((_, i) => this.isLabeled[i]);

        if (labeledData.length < 2) return 0;

        const { w1, w2, b } = this.trainClassifier(labeledData, labeledLabels);

        let correct = 0;
        for (let i = 0; i < this.data.length; i++) {
            const z = w1 * this.data[i].x + w2 * this.data[i].y + b;
            const pred = (1 / (1 + Math.exp(-z))) >= 0.5 ? 1 : 0;
            if (pred === this.trueLabels[i]) correct++;
        }

        return correct / this.data.length;
    }

    updateStats() {
        const labeled = this.isLabeled.filter(l => l).length;
        const unlabeled = this.data.length - labeled;

        document.getElementById('iteration').textContent = this.iteration;
        document.getElementById('labeled-count').textContent = labeled;
        document.getElementById('unlabeled-count').textContent = unlabeled;
        document.getElementById('accuracy').textContent =
            labeled >= 2 ? (this.computeAccuracy() * 100).toFixed(1) + '%' : '-';
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

        // Draw decision boundary
        const labeledData = this.data.filter((_, i) => this.isLabeled[i]);
        const labeledLabels = this.labels.filter((_, i) => this.isLabeled[i]);

        if (labeledData.length >= 2) {
            const { w1, w2, b } = this.trainClassifier(labeledData, labeledLabels);

            const step = 6;
            for (let px = 0; px < w; px += step) {
                for (let py = 0; py < h; py += step) {
                    const x = (px - cx) / scale;
                    const y = (cy - py) / scale;
                    const z = w1 * x + w2 * y + b;
                    const prob = 1 / (1 + Math.exp(-z));
                    const predicted = prob >= 0.5 ? 1 : 0;
                    ctx.fillStyle = this.hexToRgba(this.colors[predicted], 0.08);
                    ctx.fillRect(px, py, step, step);
                }
            }
        }

        // Draw data points
        for (let i = 0; i < this.data.length; i++) {
            const p = this.data[i];
            const px = cx + p.x * scale;
            const py = cy - p.y * scale;

            const isLabeled = this.isLabeled[i];
            const label = this.labels[i];

            if (isLabeled) {
                // Labeled point - solid
                ctx.beginPath();
                ctx.arc(px, py, 7, 0, Math.PI * 2);
                ctx.fillStyle = this.colors[label];
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                // Unlabeled point - hollow
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Legend
        ctx.font = '11px Inter';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('● Labeled', 10, h - 30);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(14, h - 15, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText(' Unlabeled', 22, h - 12);
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
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    window.app = new SelfTrainingApp();
});
