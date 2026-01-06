/**
 * Multi-Armed Bandit Visualizer
 * Explore-exploit with different strategies
 */

class BanditApp {
    constructor() {
        this.numArms = 5;
        this.trueMeans = [];
        this.arms = [];
        this.epsilon = 0.1;
        this.strategy = 'epsilon-greedy';
        this.isRunning = false;
        this.totalPulls = 0;
        this.totalReward = 0;
        this.rewardHistory = [];
        this.selectionHistory = [];

        this.colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

        this.initArms();
        this.initCanvas();
        this.setupEventListeners();
        this.render();
    }

    initArms() {
        this.trueMeans = [];
        this.arms = [];

        for (let i = 0; i < this.numArms; i++) {
            this.trueMeans.push(Math.random() * 0.8 + 0.1);
            this.arms.push({ pulls: 0, totalReward: 0, mean: 0 });
        }
    }

    initCanvas() {
        this.rewardCanvas = document.getElementById('reward-canvas');
        this.rewardCtx = this.rewardCanvas.getContext('2d');

        this.selectionCanvas = document.getElementById('selection-canvas');
        this.selectionCtx = this.selectionCanvas.getContext('2d');

        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
    }

    resizeCanvases() {
        document.querySelectorAll('.chart-box').forEach(box => {
            const canvas = box.querySelector('canvas');
            const rect = box.getBoundingClientRect();
            canvas.width = rect.width - 24;
            canvas.height = rect.height - 50;
        });
        this.render();
    }

    setupEventListeners() {
        document.getElementById('strategy-select').addEventListener('change', (e) => {
            this.strategy = e.target.value;
        });

        document.getElementById('epsilon').addEventListener('input', (e) => {
            this.epsilon = parseInt(e.target.value) / 100;
            document.getElementById('epsilon-value').textContent = this.epsilon.toFixed(2);
        });

        document.getElementById('run-btn').addEventListener('click', () => this.toggleRunning());
        document.getElementById('step-btn').addEventListener('click', () => this.step());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
    }

    reset() {
        this.initArms();
        this.totalPulls = 0;
        this.totalReward = 0;
        this.rewardHistory = [];
        this.selectionHistory = [];
        this.isRunning = false;
        document.getElementById('run-btn').textContent = '▶ Run';
        this.updateStats();
        this.render();
    }

    toggleRunning() {
        this.isRunning = !this.isRunning;
        document.getElementById('run-btn').textContent = this.isRunning ? '⏸ Pause' : '▶ Run';
        if (this.isRunning) this.runLoop();
    }

    runLoop() {
        if (!this.isRunning) return;

        for (let i = 0; i < 5; i++) this.step();

        this.render();

        if (this.totalPulls < 1000) {
            requestAnimationFrame(() => this.runLoop());
        } else {
            this.isRunning = false;
            document.getElementById('run-btn').textContent = '▶ Run';
        }
    }

    step() {
        const armIdx = this.selectArm();
        const reward = this.pullArm(armIdx);

        this.arms[armIdx].pulls++;
        this.arms[armIdx].totalReward += reward;
        this.arms[armIdx].mean = this.arms[armIdx].totalReward / this.arms[armIdx].pulls;

        this.totalPulls++;
        this.totalReward += reward;
        this.rewardHistory.push(this.totalReward / this.totalPulls);
        this.selectionHistory.push(armIdx);

        this.updateStats();
    }

    selectArm() {
        switch (this.strategy) {
            case 'epsilon-greedy':
                return this.epsilonGreedy();
            case 'ucb':
                return this.ucb1();
            case 'thompson':
                return this.thompsonSampling();
        }
    }

    epsilonGreedy() {
        if (Math.random() < this.epsilon) {
            return Math.floor(Math.random() * this.numArms);
        }

        let bestArm = 0;
        let bestMean = -Infinity;

        for (let i = 0; i < this.numArms; i++) {
            const mean = this.arms[i].pulls > 0 ? this.arms[i].mean : 0;
            if (mean > bestMean) {
                bestMean = mean;
                bestArm = i;
            }
        }

        return bestArm;
    }

    ucb1() {
        // First pull each arm once
        for (let i = 0; i < this.numArms; i++) {
            if (this.arms[i].pulls === 0) return i;
        }

        let bestArm = 0;
        let bestUCB = -Infinity;

        for (let i = 0; i < this.numArms; i++) {
            const mean = this.arms[i].mean;
            const exploration = Math.sqrt(2 * Math.log(this.totalPulls) / this.arms[i].pulls);
            const ucb = mean + exploration;

            if (ucb > bestUCB) {
                bestUCB = ucb;
                bestArm = i;
            }
        }

        return bestArm;
    }

    thompsonSampling() {
        let bestArm = 0;
        let bestSample = -Infinity;

        for (let i = 0; i < this.numArms; i++) {
            const alpha = this.arms[i].totalReward + 1;
            const beta = this.arms[i].pulls - this.arms[i].totalReward + 1;
            const sample = this.sampleBeta(alpha, beta);

            if (sample > bestSample) {
                bestSample = sample;
                bestArm = i;
            }
        }

        return bestArm;
    }

    sampleBeta(alpha, beta) {
        // Simple beta sampling using gamma
        const x = this.sampleGamma(alpha);
        const y = this.sampleGamma(beta);
        return x / (x + y);
    }

    sampleGamma(shape) {
        if (shape < 1) {
            return this.sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
        }

        const d = shape - 1 / 3;
        const c = 1 / Math.sqrt(9 * d);

        while (true) {
            let x, v;
            do {
                x = this.randn();
                v = 1 + c * x;
            } while (v <= 0);

            v = v * v * v;
            const u = Math.random();

            if (u < 1 - 0.0331 * x * x * x * x) return d * v;
            if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
        }
    }

    randn() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    pullArm(idx) {
        return Math.random() < this.trueMeans[idx] ? 1 : 0;
    }

    updateStats() {
        document.getElementById('total-pulls').textContent = this.totalPulls;
        document.getElementById('total-reward').textContent = this.totalReward;

        let bestArm = 0, bestMean = 0;
        for (let i = 0; i < this.numArms; i++) {
            if (this.arms[i].mean > bestMean) {
                bestMean = this.arms[i].mean;
                bestArm = i;
            }
        }
        document.getElementById('best-arm').textContent = `Arm ${bestArm + 1}`;

        // Regret calculation
        const optimalMean = Math.max(...this.trueMeans);
        const regret = this.totalPulls * optimalMean - this.totalReward;
        document.getElementById('regret').textContent = regret.toFixed(1);
    }

    render() {
        this.renderArms();
        this.renderRewardChart();
        this.renderSelectionChart();
    }

    renderArms() {
        const container = document.getElementById('arms-container');
        container.innerHTML = this.arms.map((arm, i) => `
            <div class="arm-card" style="border-color: ${this.colors[i]}">
                <div class="arm-header">
                    <span class="arm-icon">🎰</span>
                    <span class="arm-title">Arm ${i + 1}</span>
                </div>
                <div class="arm-stats">
                    <div class="arm-stat">
                        <span class="arm-stat-label">True μ</span>
                        <span class="arm-stat-value">${this.trueMeans[i].toFixed(2)}</span>
                    </div>
                    <div class="arm-stat">
                        <span class="arm-stat-label">Est μ</span>
                        <span class="arm-stat-value">${arm.mean.toFixed(2)}</span>
                    </div>
                    <div class="arm-stat">
                        <span class="arm-stat-label">Pulls</span>
                        <span class="arm-stat-value">${arm.pulls}</span>
                    </div>
                </div>
                <div class="arm-bar-container">
                    <div class="arm-bar" style="width: ${arm.mean * 100}%; background: ${this.colors[i]}"></div>
                </div>
            </div>
        `).join('');
    }

    renderRewardChart() {
        const ctx = this.rewardCtx;
        const w = this.rewardCanvas.width;
        const h = this.rewardCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#12121a';
        ctx.fillRect(0, 0, w, h);

        if (this.rewardHistory.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;

        const maxReward = Math.max(...this.rewardHistory);

        for (let i = 0; i < this.rewardHistory.length; i++) {
            const x = (i / (this.rewardHistory.length - 1)) * w;
            const y = h - (this.rewardHistory[i] / maxReward) * h * 0.9 - 5;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.stroke();
    }

    renderSelectionChart() {
        const ctx = this.selectionCtx;
        const w = this.selectionCanvas.width;
        const h = this.selectionCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#12121a';
        ctx.fillRect(0, 0, w, h);

        // Bar chart of selections
        const counts = new Array(this.numArms).fill(0);
        for (const sel of this.selectionHistory) {
            counts[sel]++;
        }

        const maxCount = Math.max(...counts, 1);
        const barWidth = w / this.numArms - 10;

        for (let i = 0; i < this.numArms; i++) {
            const barHeight = (counts[i] / maxCount) * h * 0.8;
            const x = i * (barWidth + 10) + 5;
            const y = h - barHeight - 5;

            ctx.fillStyle = this.colors[i];
            ctx.fillRect(x, y, barWidth, barHeight);

            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(counts[i], x + barWidth / 2, y - 5);
        }
    }
}

// Additional CSS
const style = document.createElement('style');
style.textContent = `
    .bandit-viz {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 0;
    }
    
    .arms-container {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }
    
    .arm-card {
        flex: 1;
        min-width: 120px;
        background: var(--bg-card);
        border: 2px solid;
        border-radius: var(--border-radius-sm);
        padding: 12px;
    }
    
    .arm-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }
    
    .arm-icon { font-size: 20px; }
    .arm-title { font-weight: 600; font-size: 0.9rem; }
    
    .arm-stats {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;
    }
    
    .arm-stat {
        display: flex;
        flex-direction: column;
    }
    
    .arm-stat-label {
        font-size: 0.65rem;
        color: var(--text-muted);
        text-transform: uppercase;
    }
    
    .arm-stat-value {
        font-size: 0.85rem;
        font-family: var(--font-mono);
        color: var(--text-primary);
    }
    
    .arm-bar-container {
        height: 6px;
        background: var(--bg-secondary);
        border-radius: 3px;
        overflow: hidden;
    }
    
    .arm-bar {
        height: 100%;
        border-radius: 3px;
        transition: width 0.1s ease;
    }
    
    .charts-row {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        min-height: 0;
    }
    
    .chart-box {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-sm);
        padding: 12px;
        display: flex;
        flex-direction: column;
    }
    
    .chart-box h3 {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        margin-bottom: 8px;
    }
    
    .chart-box canvas {
        flex: 1;
        width: 100%;
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    window.app = new BanditApp();
});
