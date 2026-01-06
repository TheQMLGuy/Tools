/**
 * Q-Learning Grid World Visualizer
 * Agent learns to navigate with live Q-table updates
 */

class QLearningApp {
    constructor() {
        this.gridSize = 6;
        this.grid = [];
        this.qTable = {};
        this.agentPos = { x: 0, y: 0 };
        this.startPos = { x: 0, y: 0 };
        this.goalPos = { x: 5, y: 5 };

        this.learningRate = 0.1;
        this.discount = 0.9;
        this.epsilon = 0.2;
        this.speed = 5;

        this.episode = 0;
        this.steps = 0;
        this.totalReward = 0;
        this.isTraining = false;
        this.successHistory = [];

        this.actions = ['up', 'down', 'left', 'right'];
        this.actionDeltas = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };

        this.initCanvas();
        this.initGrid();
        this.setupEventListeners();
        this.render();
    }

    initCanvas() {
        this.canvas = document.getElementById('grid-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        this.canvas.width = size;
        this.canvas.height = size;
        this.render();
    }

    initGrid() {
        // Create grid with walls and traps
        this.grid = [];
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = 'empty';
            }
        }

        // Set goal
        this.grid[5][5] = 'goal';

        // Add traps
        this.grid[2][2] = 'trap';
        this.grid[3][4] = 'trap';
        this.grid[1][4] = 'trap';

        // Add walls
        this.grid[1][1] = 'wall';
        this.grid[3][1] = 'wall';
        this.grid[4][3] = 'wall';

        // Initialize Q-table
        this.initQTable();
        this.resetAgent();
    }

    initQTable() {
        this.qTable = {};
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const state = `${x},${y}`;
                this.qTable[state] = {};
                for (const action of this.actions) {
                    this.qTable[state][action] = 0;
                }
            }
        }
    }

    resetAgent() {
        this.agentPos = { ...this.startPos };
        this.steps = 0;
        this.totalReward = 0;
    }

    setupEventListeners() {
        document.getElementById('learning-rate').addEventListener('input', (e) => {
            this.learningRate = parseInt(e.target.value) / 100;
            document.getElementById('learning-rate-value').textContent = this.learningRate.toFixed(2);
        });

        document.getElementById('discount').addEventListener('input', (e) => {
            this.discount = parseInt(e.target.value) / 100;
            document.getElementById('discount-value').textContent = this.discount.toFixed(2);
        });

        document.getElementById('epsilon').addEventListener('input', (e) => {
            this.epsilon = parseInt(e.target.value) / 100;
            document.getElementById('epsilon-value').textContent = this.epsilon.toFixed(2);
        });

        document.getElementById('speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = this.speed;
        });

        document.getElementById('train-btn').addEventListener('click', () => this.toggleTraining());
        document.getElementById('step-btn').addEventListener('click', () => this.step());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
    }

    toggleTraining() {
        this.isTraining = !this.isTraining;
        document.getElementById('train-btn').textContent = this.isTraining ? '⏸ Pause' : '▶ Train';

        if (this.isTraining) {
            this.trainLoop();
        }
    }

    trainLoop() {
        if (!this.isTraining) return;

        for (let i = 0; i < this.speed; i++) {
            this.step();
        }

        this.render();
        requestAnimationFrame(() => this.trainLoop());
    }

    step() {
        const state = `${this.agentPos.x},${this.agentPos.y}`;

        // Choose action (epsilon-greedy)
        let action;
        if (Math.random() < this.epsilon) {
            action = this.actions[Math.floor(Math.random() * this.actions.length)];
        } else {
            action = this.getBestAction(state);
        }

        // Take action
        const delta = this.actionDeltas[action];
        const newX = this.agentPos.x + delta.x;
        const newY = this.agentPos.y + delta.y;

        // Check bounds and walls
        let reward = -1; // Step penalty
        let done = false;

        if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
            const cell = this.grid[newY][newX];

            if (cell !== 'wall') {
                this.agentPos.x = newX;
                this.agentPos.y = newY;

                if (cell === 'goal') {
                    reward = 100;
                    done = true;
                    this.successHistory.push(1);
                } else if (cell === 'trap') {
                    reward = -100;
                    done = true;
                    this.successHistory.push(0);
                }
            }
        }

        // Update Q-value
        const newState = `${this.agentPos.x},${this.agentPos.y}`;
        const maxFutureQ = Math.max(...Object.values(this.qTable[newState]));

        this.qTable[state][action] += this.learningRate * (
            reward + this.discount * maxFutureQ - this.qTable[state][action]
        );

        this.steps++;
        this.totalReward += reward;

        // Check if episode ended or took too long
        if (done || this.steps >= 200) {
            if (!done) {
                this.successHistory.push(0);
            }
            this.episode++;
            this.resetAgent();
        }

        this.updateStats();
    }

    getBestAction(state) {
        const qValues = this.qTable[state];
        let bestAction = this.actions[0];
        let bestValue = qValues[bestAction];

        for (const action of this.actions) {
            if (qValues[action] > bestValue) {
                bestValue = qValues[action];
                bestAction = action;
            }
        }

        return bestAction;
    }

    reset() {
        this.initGrid();
        this.episode = 0;
        this.successHistory = [];
        this.isTraining = false;
        document.getElementById('train-btn').textContent = '▶ Train';
        this.updateStats();
        this.render();
    }

    updateStats() {
        document.getElementById('episode').textContent = this.episode;
        document.getElementById('steps').textContent = this.steps;
        document.getElementById('reward').textContent = this.totalReward;

        // Success rate (last 100 episodes)
        const recent = this.successHistory.slice(-100);
        if (recent.length > 0) {
            const rate = (recent.reduce((a, b) => a + b, 0) / recent.length * 100);
            document.getElementById('success-rate').textContent = rate.toFixed(1) + '%';
        }
    }

    render() {
        const ctx = this.ctx;
        const size = this.canvas.width;
        const cellSize = size / this.gridSize;

        ctx.clearRect(0, 0, size, size);

        // Draw cells
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const px = x * cellSize;
                const py = y * cellSize;
                const cell = this.grid[y][x];

                // Cell background
                switch (cell) {
                    case 'goal':
                        ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
                        break;
                    case 'trap':
                        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
                        break;
                    case 'wall':
                        ctx.fillStyle = '#1e1e2e';
                        break;
                    default:
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
                }

                ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

                // Draw Q-value arrows
                if (cell !== 'wall' && cell !== 'goal' && cell !== 'trap') {
                    this.drawQArrows(ctx, x, y, cellSize);
                }

                // Special cell icons
                if (cell === 'goal') {
                    ctx.fillStyle = '#10b981';
                    ctx.font = `${cellSize * 0.5}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('★', px + cellSize / 2, py + cellSize / 2);
                } else if (cell === 'trap') {
                    ctx.fillStyle = '#ef4444';
                    ctx.font = `${cellSize * 0.5}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('✕', px + cellSize / 2, py + cellSize / 2);
                }
            }
        }

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        for (let i = 0; i <= this.gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, size);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(size, i * cellSize);
            ctx.stroke();
        }

        // Draw agent
        const ax = this.agentPos.x * cellSize + cellSize / 2;
        const ay = this.agentPos.y * cellSize + cellSize / 2;

        ctx.beginPath();
        ctx.arc(ax, ay, cellSize * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawQArrows(ctx, x, y, cellSize) {
        const state = `${x},${y}`;
        const qValues = this.qTable[state];
        const px = x * cellSize + cellSize / 2;
        const py = y * cellSize + cellSize / 2;

        // Normalize Q-values for arrow length
        const values = Object.values(qValues);
        const maxQ = Math.max(...values);
        const minQ = Math.min(...values);
        const range = maxQ - minQ || 1;

        const arrows = {
            up: { dx: 0, dy: -1 },
            down: { dx: 0, dy: 1 },
            left: { dx: -1, dy: 0 },
            right: { dx: 1, dy: 0 }
        };

        for (const [action, dir] of Object.entries(arrows)) {
            const q = qValues[action];
            const normalized = (q - minQ) / range;
            const length = normalized * cellSize * 0.35;

            if (length < 2) continue;

            const endX = px + dir.dx * length;
            const endY = py + dir.dy * length;

            // Color based on value
            const hue = 120 * normalized; // Red to green
            ctx.strokeStyle = `hsla(${hue}, 70%, 50%, 0.6)`;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Arrowhead
            const angle = Math.atan2(dir.dy, dir.dx);
            const headLen = 5;

            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLen * Math.cos(angle - 0.5), endY - headLen * Math.sin(angle - 0.5));
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLen * Math.cos(angle + 0.5), endY - headLen * Math.sin(angle + 0.5));
            ctx.stroke();
        }
    }
}

// Additional CSS
const style = document.createElement('style');
style.textContent = `
    .single-viz {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 0;
    }
    
    .single-viz canvas {
        max-width: 100%;
        max-height: 100%;
    }
    
    .legend {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8rem;
        color: var(--text-secondary);
    }
    
    .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 4px;
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QLearningApp();
});
