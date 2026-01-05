/**
 * Charts
 * Loss chart and weight statistics visualization
 */

class LossChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.lossHistory = [];
        this.maxPoints = 500;

        // Colors
        this.colors = {
            grid: 'rgba(255, 255, 255, 0.05)',
            line: '#6366f1',
            fill: 'rgba(99, 102, 241, 0.2)',
            text: '#606070'
        };

        // Setup resize observer
        this.setupResize();
    }

    setupResize() {
        const resizeObserver = new ResizeObserver(() => {
            this.resize();
        });
        resizeObserver.observe(this.canvas.parentElement);
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;

        this.render();
    }

    update(lossHistory) {
        // Keep only last maxPoints
        if (lossHistory.length > this.maxPoints) {
            this.lossHistory = lossHistory.slice(-this.maxPoints);
        } else {
            this.lossHistory = [...lossHistory];
        }
        this.render();
    }

    clear() {
        this.lossHistory = [];
        this.render();
    }

    render() {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const padding = 35;

        ctx.clearRect(0, 0, this.width, this.height);

        if (this.lossHistory.length < 2) {
            this.drawEmptyState();
            return;
        }

        const plotWidth = this.width - padding * 2;
        const plotHeight = this.height - padding * 2;

        // Calculate max loss for scaling (with some padding)
        const maxLoss = Math.max(...this.lossHistory) * 1.1;
        const minLoss = 0;

        // Draw grid
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;

        for (let i = 0; i <= 4; i++) {
            const y = padding + (i / 4) * plotHeight;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(this.width - padding, y);
            ctx.stroke();
        }

        // Draw loss curve
        ctx.beginPath();

        for (let i = 0; i < this.lossHistory.length; i++) {
            const x = padding + (i / (this.lossHistory.length - 1)) * plotWidth;
            const normalizedLoss = (this.lossHistory[i] - minLoss) / (maxLoss - minLoss);
            const y = padding + (1 - normalizedLoss) * plotHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        // Stroke the line
        ctx.strokeStyle = this.colors.line;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Fill under the curve
        const lastX = padding + plotWidth;
        const lastY = padding + (1 - (this.lossHistory[this.lossHistory.length - 1] - minLoss) / (maxLoss - minLoss)) * plotHeight;

        ctx.lineTo(lastX, padding + plotHeight);
        ctx.lineTo(padding, padding + plotHeight);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, padding, 0, padding + plotHeight);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw labels
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';

        // Y-axis labels
        for (let i = 0; i <= 4; i++) {
            const value = maxLoss * (1 - i / 4);
            const y = padding + (i / 4) * plotHeight;
            ctx.fillText(value.toFixed(3), padding - 5, y + 3);
        }

        // X-axis labels
        ctx.textAlign = 'center';
        const epochCount = this.lossHistory.length;
        ctx.fillText('0', padding, this.height - padding + 15);
        ctx.fillText(epochCount.toString(), this.width - padding, this.height - padding + 15);
        ctx.fillText('Epochs', this.width / 2, this.height - 5);
    }

    drawEmptyState() {
        const ctx = this.ctx;
        ctx.fillStyle = this.colors.text;
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Start training to see loss curve', this.width / 2, this.height / 2);
    }
}


/**
 * Accuracy Chart
 * Similar to LossChart but for accuracy percentage
 */
class AccuracyChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.accuracyHistory = [];
        this.maxPoints = 500;

        this.colors = {
            grid: 'rgba(255, 255, 255, 0.05)',
            line: '#10b981', // Green for accuracy
            fill: 'rgba(16, 185, 129, 0.2)',
            text: '#606070'
        };

        this.setupResize();
    }

    setupResize() {
        const resizeObserver = new ResizeObserver(() => {
            this.resize();
        });
        resizeObserver.observe(this.canvas.parentElement);
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;

        this.render();
    }

    update(accuracyHistory) {
        if (accuracyHistory.length > this.maxPoints) {
            this.accuracyHistory = accuracyHistory.slice(-this.maxPoints);
        } else {
            this.accuracyHistory = [...accuracyHistory];
        }
        this.render();
    }

    clear() {
        this.accuracyHistory = [];
        this.render();
    }

    render() {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const padding = 35;

        ctx.clearRect(0, 0, this.width, this.height);

        if (this.accuracyHistory.length < 2) {
            this.drawEmptyState();
            return;
        }

        const plotWidth = this.width - padding * 2;
        const plotHeight = this.height - padding * 2;

        // Accuracy is 0-100%
        const maxAcc = 100;
        const minAcc = 0;

        // Draw grid
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;

        for (let i = 0; i <= 4; i++) {
            const y = padding + (i / 4) * plotHeight;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(this.width - padding, y);
            ctx.stroke();
        }

        // Draw accuracy curve
        ctx.beginPath();

        for (let i = 0; i < this.accuracyHistory.length; i++) {
            const x = padding + (i / (this.accuracyHistory.length - 1)) * plotWidth;
            const normalizedAcc = (this.accuracyHistory[i] - minAcc) / (maxAcc - minAcc);
            const y = padding + (1 - normalizedAcc) * plotHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.strokeStyle = this.colors.line;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Fill under curve
        const lastX = padding + plotWidth;
        ctx.lineTo(lastX, padding + plotHeight);
        ctx.lineTo(padding, padding + plotHeight);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, padding, 0, padding + plotHeight);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Y-axis labels (percentages)
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';

        for (let i = 0; i <= 4; i++) {
            const value = maxAcc * (1 - i / 4);
            const y = padding + (i / 4) * plotHeight;
            ctx.fillText(value.toFixed(0) + '%', padding - 5, y + 3);
        }

        // X-axis labels
        ctx.textAlign = 'center';
        const epochCount = this.accuracyHistory.length;
        ctx.fillText('0', padding, this.height - padding + 15);
        ctx.fillText(epochCount.toString(), this.width - padding, this.height - padding + 15);
        ctx.fillText('Epochs', this.width / 2, this.height - 5);
    }

    drawEmptyState() {
        const ctx = this.ctx;
        ctx.fillStyle = this.colors.text;
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Start training to see accuracy', this.width / 2, this.height / 2);
    }
}

// Export
window.LossChart = LossChart;
window.AccuracyChart = AccuracyChart;
