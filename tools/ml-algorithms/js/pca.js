/**
 * PCA Visualizer
 * Principal components with variance explained
 */

class PCAApp {
    constructor() {
        this.data = [];
        this.mean = { x: 0, y: 0 };
        this.components = [];
        this.eigenvalues = [];
        this.computed = false;

        this.initCanvas();
        this.setupEventListeners();
        this.generateData();
    }

    initCanvas() {
        this.canvas = document.getElementById('pca-canvas');
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

        document.getElementById('num-points').addEventListener('input', (e) => {
            document.getElementById('num-points-value').textContent = e.target.value;
        });

        document.getElementById('compute-btn').addEventListener('click', () => this.computePCA());
        document.getElementById('show-projection').addEventListener('change', () => this.render());
    }

    generateData() {
        const n = parseInt(document.getElementById('num-points').value);
        const dataset = document.getElementById('dataset-select').value;
        this.data = [];
        this.computed = false;
        this.components = [];

        switch (dataset) {
            case 'correlated':
                this.generateCorrelated(n);
                break;
            case 'blob':
                this.generateBlob(n);
                break;
            case 'ellipse':
                this.generateEllipse(n);
                break;
        }

        this.updateStats();
        this.render();
    }

    generateCorrelated(n) {
        for (let i = 0; i < n; i++) {
            const t = (Math.random() - 0.5) * 2;
            const x = t + (Math.random() - 0.5) * 0.3;
            const y = t * 0.8 + (Math.random() - 0.5) * 0.3;
            this.data.push({ x, y });
        }
    }

    generateBlob(n) {
        for (let i = 0; i < n; i++) {
            const x = (Math.random() - 0.5) * 0.8;
            const y = (Math.random() - 0.5) * 0.8;
            this.data.push({ x, y });
        }
    }

    generateEllipse(n) {
        const angle = Math.PI / 6; // 30 degrees
        for (let i = 0; i < n; i++) {
            // Generate in standard position
            const a = (Math.random() - 0.5) * 1.5;
            const b = (Math.random() - 0.5) * 0.4;

            // Rotate
            const x = a * Math.cos(angle) - b * Math.sin(angle);
            const y = a * Math.sin(angle) + b * Math.cos(angle);
            this.data.push({ x, y });
        }
    }

    computePCA() {
        const n = this.data.length;
        if (n < 2) return;

        // Compute mean
        this.mean = {
            x: this.data.reduce((s, p) => s + p.x, 0) / n,
            y: this.data.reduce((s, p) => s + p.y, 0) / n
        };

        // Compute covariance matrix
        let cov_xx = 0, cov_xy = 0, cov_yy = 0;

        for (const p of this.data) {
            const dx = p.x - this.mean.x;
            const dy = p.y - this.mean.y;
            cov_xx += dx * dx;
            cov_xy += dx * dy;
            cov_yy += dy * dy;
        }

        cov_xx /= (n - 1);
        cov_xy /= (n - 1);
        cov_yy /= (n - 1);

        // Compute eigenvalues and eigenvectors
        // For 2x2: det(A - λI) = λ² - (a+d)λ + (ad-bc) = 0
        const trace = cov_xx + cov_yy;
        const det = cov_xx * cov_yy - cov_xy * cov_xy;

        const discriminant = Math.sqrt(trace * trace / 4 - det);
        const lambda1 = trace / 2 + discriminant;
        const lambda2 = trace / 2 - discriminant;

        this.eigenvalues = [lambda1, lambda2];

        // Compute eigenvectors
        const ev1 = this.computeEigenvector(cov_xx, cov_xy, cov_yy, lambda1);
        const ev2 = this.computeEigenvector(cov_xx, cov_xy, cov_yy, lambda2);

        this.components = [ev1, ev2];
        this.computed = true;

        this.updateStats();
        this.render();
    }

    computeEigenvector(a, b, d, lambda) {
        // (A - λI)v = 0
        // v is in null space of (A - λI)

        let vx, vy;

        if (Math.abs(b) > 0.0001) {
            vx = 1;
            vy = (lambda - a) / b;
        } else {
            if (Math.abs(a - lambda) < 0.0001) {
                vx = 1;
                vy = 0;
            } else {
                vx = 0;
                vy = 1;
            }
        }

        // Normalize
        const len = Math.sqrt(vx * vx + vy * vy);
        return { x: vx / len, y: vy / len };
    }

    updateStats() {
        if (this.computed) {
            const total = this.eigenvalues[0] + this.eigenvalues[1];
            const var1 = (this.eigenvalues[0] / total * 100);
            const var2 = (this.eigenvalues[1] / total * 100);

            document.getElementById('var1').textContent = var1.toFixed(1) + '%';
            document.getElementById('var2').textContent = var2.toFixed(1) + '%';
            document.getElementById('total-var').textContent = '100%';
        } else {
            document.getElementById('var1').textContent = '-';
            document.getElementById('var2').textContent = '-';
            document.getElementById('total-var').textContent = '-';
        }
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        const scale = Math.min(w, h) * 0.35;
        const cx = w / 2;
        const cy = h / 2;

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            ctx.beginPath();
            ctx.moveTo(w * i / 10, 0);
            ctx.lineTo(w * i / 10, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, h * i / 10);
            ctx.lineTo(w, h * i / 10);
            ctx.stroke();
        }

        // Draw projections
        const showProj = document.getElementById('show-projection').checked;

        if (this.computed && showProj && this.components.length > 0) {
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
            ctx.lineWidth = 1;

            const pc1 = this.components[0];

            for (const p of this.data) {
                const dx = p.x - this.mean.x;
                const dy = p.y - this.mean.y;

                // Project onto PC1
                const proj = dx * pc1.x + dy * pc1.y;
                const projX = this.mean.x + proj * pc1.x;
                const projY = this.mean.y + proj * pc1.y;

                ctx.beginPath();
                ctx.moveTo(cx + p.x * scale, cy - p.y * scale);
                ctx.lineTo(cx + projX * scale, cy - projY * scale);
                ctx.stroke();
            }
        }

        // Draw principal components
        if (this.computed && this.components.length >= 2) {
            const total = this.eigenvalues[0] + this.eigenvalues[1];

            // PC1 (larger)
            const len1 = Math.sqrt(this.eigenvalues[0]) * 2;
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx + (this.mean.x - this.components[0].x * len1) * scale,
                cy - (this.mean.y - this.components[0].y * len1) * scale);
            ctx.lineTo(cx + (this.mean.x + this.components[0].x * len1) * scale,
                cy - (this.mean.y + this.components[0].y * len1) * scale);
            ctx.stroke();

            // Arrowhead
            this.drawArrowhead(ctx,
                cx + this.mean.x * scale,
                cy - this.mean.y * scale,
                this.components[0].x, -this.components[0].y, len1 * scale, '#6366f1');

            // PC2 (smaller)
            const len2 = Math.sqrt(this.eigenvalues[1]) * 2;
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + (this.mean.x - this.components[1].x * len2) * scale,
                cy - (this.mean.y - this.components[1].y * len2) * scale);
            ctx.lineTo(cx + (this.mean.x + this.components[1].x * len2) * scale,
                cy - (this.mean.y + this.components[1].y * len2) * scale);
            ctx.stroke();

            this.drawArrowhead(ctx,
                cx + this.mean.x * scale,
                cy - this.mean.y * scale,
                this.components[1].x, -this.components[1].y, len2 * scale, '#10b981');

            // Labels
            ctx.font = 'bold 12px Inter';
            ctx.fillStyle = '#6366f1';
            ctx.fillText('PC1',
                cx + (this.mean.x + this.components[0].x * len1 * 1.15) * scale,
                cy - (this.mean.y + this.components[0].y * len1 * 1.15) * scale);

            ctx.fillStyle = '#10b981';
            ctx.fillText('PC2',
                cx + (this.mean.x + this.components[1].x * len2 * 1.3) * scale,
                cy - (this.mean.y + this.components[1].y * len2 * 1.3) * scale);
        }

        // Draw data points
        for (const p of this.data) {
            const px = cx + p.x * scale;
            const py = cy - p.y * scale;

            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#6366f1';
            ctx.fill();
        }

        // Draw mean
        if (this.computed) {
            const mx = cx + this.mean.x * scale;
            const my = cy - this.mean.y * scale;

            ctx.beginPath();
            ctx.arc(mx, my, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    drawArrowhead(ctx, ox, oy, dx, dy, len, color) {
        const tipX = ox + dx * len;
        const tipY = oy + dy * len;
        const angle = Math.atan2(dy, dx);
        const headLen = 10;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - headLen * Math.cos(angle - 0.4), tipY - headLen * Math.sin(angle - 0.4));
        ctx.lineTo(tipX - headLen * Math.cos(angle + 0.4), tipY - headLen * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
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
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: var(--text-secondary);
        cursor: pointer;
    }
    
    .checkbox-label input {
        accent-color: var(--accent-primary);
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PCAApp();
});
