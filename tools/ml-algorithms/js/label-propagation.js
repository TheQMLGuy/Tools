/**
 * Label Propagation Visualizer
 * Graph-based semi-supervised learning
 */

class LabelPropagationApp {
    constructor() {
        this.data = [];
        this.labelDist = []; // Soft labels [prob class 0, prob class 1]
        this.initiallyLabeled = [];
        this.trueLabels = [];
        this.sigma = 0.3;
        this.iteration = 0;
        this.converged = false;
        this.isRunning = false;
        this.weights = [];

        this.colors = { 0: '#6366f1', 1: '#10b981' };

        this.initCanvas();
        this.setupEventListeners();
        this.generateData();
    }

    initCanvas() {
        this.canvas = document.getElementById('propagation-canvas');
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

        document.getElementById('sigma').addEventListener('input', (e) => {
            this.sigma = parseInt(e.target.value) / 100;
            document.getElementById('sigma-value').textContent = this.sigma.toFixed(2);
            this.computeWeights();
            this.render();
        });

        document.getElementById('generate-btn').addEventListener('click', () => this.generateData());
        document.getElementById('propagate-btn').addEventListener('click', () => this.togglePropagation());
        document.getElementById('step-btn').addEventListener('click', () => this.step());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
    }

    generateData() {
        this.data = [];
        this.labelDist = [];
        this.initiallyLabeled = [];
        this.trueLabels = [];

        const numLabeled = parseInt(document.getElementById('num-labeled').value);
        const numUnlabeled = parseInt(document.getElementById('num-unlabeled').value);

        // Generate two clusters
        const centers = [{ x: -0.4, y: 0.3 }, { x: 0.4, y: -0.3 }];

        // Labeled points
        for (let c = 0; c < 2; c++) {
            for (let i = 0; i < numLabeled / 2; i++) {
                this.data.push({
                    x: centers[c].x + (Math.random() - 0.5) * 0.3,
                    y: centers[c].y + (Math.random() - 0.5) * 0.3
                });
                this.labelDist.push(c === 0 ? [1, 0] : [0, 1]);
                this.initiallyLabeled.push(true);
                this.trueLabels.push(c);
            }
        }

        // Unlabeled points
        for (let i = 0; i < numUnlabeled; i++) {
            const c = Math.random() < 0.5 ? 0 : 1;
            this.data.push({
                x: centers[c].x + (Math.random() - 0.5) * 0.6,
                y: centers[c].y + (Math.random() - 0.5) * 0.6
            });
            this.labelDist.push([0.5, 0.5]); // Uniform
            this.initiallyLabeled.push(false);
            this.trueLabels.push(c);
        }

        this.iteration = 0;
        this.converged = false;
        this.computeWeights();
        this.updateStats();
        this.render();
    }

    computeWeights() {
        const n = this.data.length;
        this.weights = [];

        for (let i = 0; i < n; i++) {
            this.weights[i] = [];
            let sum = 0;

            for (let j = 0; j < n; j++) {
                if (i === j) {
                    this.weights[i][j] = 0;
                } else {
                    const dist = Math.pow(this.data[i].x - this.data[j].x, 2) +
                        Math.pow(this.data[i].y - this.data[j].y, 2);
                    this.weights[i][j] = Math.exp(-dist / (2 * this.sigma * this.sigma));
                    sum += this.weights[i][j];
                }
            }

            // Normalize
            if (sum > 0) {
                for (let j = 0; j < n; j++) {
                    this.weights[i][j] /= sum;
                }
            }
        }
    }

    reset() {
        for (let i = 0; i < this.data.length; i++) {
            if (!this.initiallyLabeled[i]) {
                this.labelDist[i] = [0.5, 0.5];
            }
        }
        this.iteration = 0;
        this.converged = false;
        this.isRunning = false;
        document.getElementById('propagate-btn').textContent = '▶ Propagate';
        this.updateStats();
        this.render();
    }

    togglePropagation() {
        this.isRunning = !this.isRunning;
        document.getElementById('propagate-btn').textContent = this.isRunning ? '⏸ Pause' : '▶ Propagate';
        if (this.isRunning) this.runLoop();
    }

    runLoop() {
        if (!this.isRunning || this.converged) {
            this.isRunning = false;
            document.getElementById('propagate-btn').textContent = '▶ Propagate';
            return;
        }

        this.step();
        setTimeout(() => this.runLoop(), 200);
    }

    step() {
        if (this.converged) return;

        const n = this.data.length;
        const newLabelDist = [];
        let maxChange = 0;

        for (let i = 0; i < n; i++) {
            if (this.initiallyLabeled[i]) {
                // Keep original label
                newLabelDist[i] = [...this.labelDist[i]];
            } else {
                // Propagate from neighbors
                let sum0 = 0, sum1 = 0;

                for (let j = 0; j < n; j++) {
                    sum0 += this.weights[i][j] * this.labelDist[j][0];
                    sum1 += this.weights[i][j] * this.labelDist[j][1];
                }

                // Normalize
                const total = sum0 + sum1;
                if (total > 0) {
                    newLabelDist[i] = [sum0 / total, sum1 / total];
                } else {
                    newLabelDist[i] = [0.5, 0.5];
                }

                // Track change
                const change = Math.abs(newLabelDist[i][0] - this.labelDist[i][0]);
                maxChange = Math.max(maxChange, change);
            }
        }

        this.labelDist = newLabelDist;
        this.iteration++;

        if (maxChange < 0.001 || this.iteration >= 100) {
            this.converged = true;
            this.isRunning = false;
            document.getElementById('propagate-btn').textContent = '▶ Propagate';
        }

        this.updateStats();
        this.render();
    }

    computeAccuracy() {
        let correct = 0;
        for (let i = 0; i < this.data.length; i++) {
            const predicted = this.labelDist[i][0] > this.labelDist[i][1] ? 0 : 1;
            if (predicted === this.trueLabels[i]) correct++;
        }
        return correct / this.data.length;
    }

    updateStats() {
        document.getElementById('iteration').textContent = this.iteration;
        document.getElementById('converged').textContent = this.converged ? 'Yes' : 'No';
        document.getElementById('accuracy').textContent =
            (this.computeAccuracy() * 100).toFixed(1) + '%';
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

        // Draw edges (strongest connections)
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
        ctx.lineWidth = 1;

        for (let i = 0; i < this.data.length; i++) {
            for (let j = i + 1; j < this.data.length; j++) {
                if (this.weights[i] && this.weights[i][j] > 0.05) {
                    const p1 = this.data[i];
                    const p2 = this.data[j];

                    ctx.globalAlpha = this.weights[i][j] * 3;
                    ctx.beginPath();
                    ctx.moveTo(cx + p1.x * scale, cy - p1.y * scale);
                    ctx.lineTo(cx + p2.x * scale, cy - p2.y * scale);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;

        // Draw data points
        for (let i = 0; i < this.data.length; i++) {
            const p = this.data[i];
            const px = cx + p.x * scale;
            const py = cy - p.y * scale;

            const prob0 = this.labelDist[i][0];
            const prob1 = this.labelDist[i][1];

            // Blend colors based on probability
            const r = Math.round(99 * prob0 + 16 * prob1);
            const g = Math.round(102 * prob0 + 185 * prob1);
            const b = Math.round(241 * prob0 + 129 * prob1);

            ctx.beginPath();
            ctx.arc(px, py, this.initiallyLabeled[i] ? 10 : 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fill();

            if (this.initiallyLabeled[i]) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Legend
        ctx.font = '11px Inter';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('● Large = initially labeled', 10, h - 15);
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
    window.app = new LabelPropagationApp();
});
