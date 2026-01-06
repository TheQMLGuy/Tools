/**
 * Decision Tree Visualizer
 * Tree building with animated splits
 */

class DecisionTreeApp {
    constructor() {
        this.data = [];
        this.tree = null;
        this.maxDepth = 4;
        this.minSamples = 5;
        this.buildQueue = [];
        this.isBuilding = false;

        this.colors = {
            0: '#6366f1',
            1: '#10b981'
        };

        this.initCanvas();
        this.setupEventListeners();
        this.generateData();
    }

    initCanvas() {
        this.dataCanvas = document.getElementById('data-canvas');
        this.dataCtx = this.dataCanvas.getContext('2d');

        this.treeCanvas = document.getElementById('tree-canvas');
        this.treeCtx = this.treeCanvas.getContext('2d');

        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
    }

    resizeCanvases() {
        const containers = document.querySelectorAll('.viz-half');

        containers.forEach((container, i) => {
            const canvas = container.querySelector('canvas');
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height - 40;
        });

        this.render();
    }

    setupEventListeners() {
        document.getElementById('dataset-select').addEventListener('change', () => this.generateData());
        document.getElementById('generate-btn').addEventListener('click', () => this.generateData());

        document.getElementById('max-depth').addEventListener('input', (e) => {
            this.maxDepth = parseInt(e.target.value);
            document.getElementById('max-depth-value').textContent = this.maxDepth;
        });

        document.getElementById('min-samples').addEventListener('input', (e) => {
            this.minSamples = parseInt(e.target.value);
            document.getElementById('min-samples-value').textContent = this.minSamples;
        });

        document.getElementById('build-btn').addEventListener('click', () => this.buildTree());
        document.getElementById('step-btn').addEventListener('click', () => this.stepBuild());
    }

    generateData() {
        const dataset = document.getElementById('dataset-select').value;
        this.data = [];
        this.tree = null;

        switch (dataset) {
            case 'two-clusters':
                this.generateTwoClusters();
                break;
            case 'xor':
                this.generateXOR();
                break;
            case 'circles':
                this.generateCircles();
                break;
        }

        this.updateStats();
        this.render();
    }

    generateTwoClusters() {
        for (let i = 0; i < 50; i++) {
            this.data.push({
                x: -0.4 + (Math.random() - 0.5) * 0.5,
                y: 0.3 + (Math.random() - 0.5) * 0.5,
                class: 0
            });
            this.data.push({
                x: 0.4 + (Math.random() - 0.5) * 0.5,
                y: -0.3 + (Math.random() - 0.5) * 0.5,
                class: 1
            });
        }
    }

    generateXOR() {
        for (let i = 0; i < 30; i++) {
            // Top-left and bottom-right: class 0
            this.data.push({ x: -0.5 + Math.random() * 0.4, y: 0.5 - Math.random() * 0.4, class: 0 });
            this.data.push({ x: 0.1 + Math.random() * 0.4, y: -0.5 + Math.random() * 0.4, class: 0 });
            // Top-right and bottom-left: class 1
            this.data.push({ x: 0.1 + Math.random() * 0.4, y: 0.5 - Math.random() * 0.4, class: 1 });
            this.data.push({ x: -0.5 + Math.random() * 0.4, y: -0.5 + Math.random() * 0.4, class: 1 });
        }
    }

    generateCircles() {
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            // Inner circle - class 0
            const r1 = 0.2 + (Math.random() - 0.5) * 0.1;
            this.data.push({ x: Math.cos(angle) * r1, y: Math.sin(angle) * r1, class: 0 });
            // Outer circle - class 1
            const r2 = 0.5 + (Math.random() - 0.5) * 0.1;
            this.data.push({ x: Math.cos(angle) * r2, y: Math.sin(angle) * r2, class: 1 });
        }
    }

    buildTree() {
        this.tree = this.buildNode(this.data, 0);
        this.updateStats();
        this.render();
    }

    buildNode(data, depth) {
        if (data.length < this.minSamples || depth >= this.maxDepth) {
            return this.createLeaf(data);
        }

        const classes = data.map(d => d.class);
        const uniqueClasses = [...new Set(classes)];
        if (uniqueClasses.length === 1) {
            return this.createLeaf(data);
        }

        // Find best split
        const split = this.findBestSplit(data);
        if (!split) {
            return this.createLeaf(data);
        }

        const leftData = data.filter(d => d[split.feature] <= split.threshold);
        const rightData = data.filter(d => d[split.feature] > split.threshold);

        if (leftData.length === 0 || rightData.length === 0) {
            return this.createLeaf(data);
        }

        return {
            type: 'split',
            feature: split.feature,
            threshold: split.threshold,
            left: this.buildNode(leftData, depth + 1),
            right: this.buildNode(rightData, depth + 1),
            depth
        };
    }

    createLeaf(data) {
        const counts = { 0: 0, 1: 0 };
        for (const d of data) {
            counts[d.class]++;
        }
        const predictedClass = counts[0] >= counts[1] ? 0 : 1;
        return {
            type: 'leaf',
            class: predictedClass,
            samples: data.length,
            counts
        };
    }

    findBestSplit(data) {
        let bestGini = Infinity;
        let bestSplit = null;

        for (const feature of ['x', 'y']) {
            const values = data.map(d => d[feature]).sort((a, b) => a - b);
            const uniqueValues = [...new Set(values)];

            for (let i = 0; i < uniqueValues.length - 1; i++) {
                const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;

                const left = data.filter(d => d[feature] <= threshold);
                const right = data.filter(d => d[feature] > threshold);

                if (left.length === 0 || right.length === 0) continue;

                const gini = this.weightedGini(left, right);

                if (gini < bestGini) {
                    bestGini = gini;
                    bestSplit = { feature, threshold };
                }
            }
        }

        return bestSplit;
    }

    gini(data) {
        if (data.length === 0) return 0;
        const counts = { 0: 0, 1: 0 };
        for (const d of data) {
            counts[d.class]++;
        }
        const p0 = counts[0] / data.length;
        const p1 = counts[1] / data.length;
        return 1 - p0 * p0 - p1 * p1;
    }

    weightedGini(left, right) {
        const total = left.length + right.length;
        return (left.length / total) * this.gini(left) + (right.length / total) * this.gini(right);
    }

    predict(point, node = this.tree) {
        if (!node) return 0;
        if (node.type === 'leaf') return node.class;

        if (point[node.feature] <= node.threshold) {
            return this.predict(point, node.left);
        } else {
            return this.predict(point, node.right);
        }
    }

    computeAccuracy() {
        if (!this.tree) return 0;
        let correct = 0;
        for (const d of this.data) {
            if (this.predict(d) === d.class) correct++;
        }
        return correct / this.data.length;
    }

    countNodes(node = this.tree) {
        if (!node) return 0;
        if (node.type === 'leaf') return 1;
        return 1 + this.countNodes(node.left) + this.countNodes(node.right);
    }

    getTreeDepth(node = this.tree, depth = 0) {
        if (!node) return 0;
        if (node.type === 'leaf') return depth;
        return Math.max(
            this.getTreeDepth(node.left, depth + 1),
            this.getTreeDepth(node.right, depth + 1)
        );
    }

    updateStats() {
        document.getElementById('num-nodes').textContent = this.countNodes();
        document.getElementById('tree-depth').textContent = this.getTreeDepth();
        document.getElementById('accuracy').textContent =
            this.tree ? (this.computeAccuracy() * 100).toFixed(1) + '%' : '-';
    }

    stepBuild() {
        // Simplified: just build full tree
        this.buildTree();
    }

    render() {
        this.renderData();
        this.renderTree();
    }

    renderData() {
        const ctx = this.dataCtx;
        const w = this.dataCanvas.width;
        const h = this.dataCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        const scale = Math.min(w, h) * 0.4;
        const cx = w / 2;
        const cy = h / 2;

        // Draw decision boundaries
        if (this.tree) {
            const step = 4;
            for (let px = 0; px < w; px += step) {
                for (let py = 0; py < h; py += step) {
                    const x = (px - cx) / scale;
                    const y = (cy - py) / scale;
                    const predicted = this.predict({ x, y });
                    ctx.fillStyle = this.hexToRgba(this.colors[predicted], 0.15);
                    ctx.fillRect(px, py, step, step);
                }
            }

            // Draw split lines
            this.drawSplitLines(ctx, this.tree, -1, 1, -1, 1, cx, cy, scale);
        }

        // Draw data points
        for (const point of this.data) {
            const px = cx + point.x * scale;
            const py = cy - point.y * scale;

            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fillStyle = this.colors[point.class];
            ctx.fill();
        }
    }

    drawSplitLines(ctx, node, xMin, xMax, yMin, yMax, cx, cy, scale) {
        if (!node || node.type === 'leaf') return;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);

        if (node.feature === 'x') {
            const px = cx + node.threshold * scale;
            const pyMin = cy - yMax * scale;
            const pyMax = cy - yMin * scale;

            ctx.beginPath();
            ctx.moveTo(px, pyMin);
            ctx.lineTo(px, pyMax);
            ctx.stroke();

            this.drawSplitLines(ctx, node.left, xMin, node.threshold, yMin, yMax, cx, cy, scale);
            this.drawSplitLines(ctx, node.right, node.threshold, xMax, yMin, yMax, cx, cy, scale);
        } else {
            const py = cy - node.threshold * scale;
            const pxMin = cx + xMin * scale;
            const pxMax = cx + xMax * scale;

            ctx.beginPath();
            ctx.moveTo(pxMin, py);
            ctx.lineTo(pxMax, py);
            ctx.stroke();

            this.drawSplitLines(ctx, node.left, xMin, xMax, yMin, node.threshold, cx, cy, scale);
            this.drawSplitLines(ctx, node.right, xMin, xMax, node.threshold, yMax, cx, cy, scale);
        }

        ctx.setLineDash([]);
    }

    renderTree() {
        const ctx = this.treeCtx;
        const w = this.treeCanvas.width;
        const h = this.treeCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        if (!this.tree) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Click "Build Tree" to visualize', w / 2, h / 2);
            return;
        }

        const depth = this.getTreeDepth();
        const nodeRadius = 20;
        const levelHeight = (h - 80) / Math.max(depth, 1);

        this.drawTreeNode(ctx, this.tree, w / 2, 40, w / 4, levelHeight, nodeRadius);
    }

    drawTreeNode(ctx, node, x, y, hSpread, levelHeight, radius) {
        if (!node) return;

        // Draw connections to children first
        if (node.type === 'split') {
            const childY = y + levelHeight;
            const leftX = x - hSpread;
            const rightX = x + hSpread;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(x, y + radius);
            ctx.lineTo(leftX, childY - radius);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, y + radius);
            ctx.lineTo(rightX, childY - radius);
            ctx.stroke();

            // Draw children
            this.drawTreeNode(ctx, node.left, leftX, childY, hSpread / 2, levelHeight, radius);
            this.drawTreeNode(ctx, node.right, rightX, childY, hSpread / 2, levelHeight, radius);
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        if (node.type === 'leaf') {
            ctx.fillStyle = this.colors[node.class];
        } else {
            ctx.fillStyle = '#1e1e2e';
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.fill();

        // Draw label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (node.type === 'leaf') {
            ctx.fillText(node.class.toString(), x, y);
        } else {
            ctx.fillText(node.feature.toUpperCase(), x, y);
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
    .split-viz {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        min-height: 0;
    }
    
    .viz-half {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: 12px;
        display: flex;
        flex-direction: column;
    }
    
    .viz-half h3 {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        margin-bottom: 8px;
    }
    
    .viz-half canvas {
        flex: 1;
        width: 100%;
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DecisionTreeApp();
});
