/**
 * Decision Tree Visualizer
 * Interactive tree-building with decision boundary visualization
 */

class DecisionTreeApp {
    constructor() {
        this.data = [];
        this.tree = null;
        this.maxDepth = 5;
        this.minSamplesSplit = 2;
        this.criterion = 'gini';
        this.buildQueue = [];
        this.isTraining = false;
        this.animationSpeed = 300;

        this.colors = {
            class0: '#6366f1',
            class1: '#10b981',
            class2: '#f59e0b',
            background: '#0a0a0f',
            grid: 'rgba(255, 255, 255, 0.05)',
            text: '#a0a0b0',
            node: '#1e1e2e',
            nodeBorder: '#6366f1',
            leaf0: 'rgba(99, 102, 241, 0.8)',
            leaf1: 'rgba(16, 185, 129, 0.8)',
            leaf2: 'rgba(245, 158, 11, 0.8)'
        };

        this.initCanvases();
        this.setupEventListeners();
        this.generateData();
    }

    initCanvases() {
        this.boundaryCanvas = document.getElementById('boundary-canvas');
        this.treeCanvas = document.getElementById('tree-canvas');
        this.boundaryCtx = this.boundaryCanvas.getContext('2d');
        this.treeCtx = this.treeCanvas.getContext('2d');
        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
    }

    resizeCanvases() {
        const containers = document.querySelectorAll('.viz-container');
        containers.forEach((container, i) => {
            const canvas = i === 0 ? this.boundaryCanvas : this.treeCanvas;
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width - 20;
            canvas.height = rect.height - 50;
        });
        this.render();
    }

    setupEventListeners() {
        document.getElementById('max-depth').addEventListener('input', (e) => {
            this.maxDepth = parseInt(e.target.value);
            document.getElementById('max-depth-value').textContent = this.maxDepth;
        });

        document.getElementById('min-samples').addEventListener('input', (e) => {
            this.minSamplesSplit = parseInt(e.target.value);
            document.getElementById('min-samples-value').textContent = this.minSamplesSplit;
        });

        document.getElementById('criterion-select').addEventListener('change', (e) => {
            this.criterion = e.target.value;
        });

        document.getElementById('dataset-select').addEventListener('change', () => this.generateData());
        document.getElementById('generate-btn').addEventListener('click', () => this.generateData());
        document.getElementById('train-btn').addEventListener('click', () => this.train());
        document.getElementById('step-btn').addEventListener('click', () => this.step());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
    }

    generateData() {
        const dataset = document.getElementById('dataset-select').value;
        this.data = [];

        switch (dataset) {
            case 'two-clusters':
                this.generateTwoClusters();
                break;
            case 'xor':
                this.generateXOR();
                break;
            case 'three-clusters':
                this.generateThreeClusters();
                break;
            case 'spiral':
                this.generateSpiral();
                break;
        }

        this.reset();
    }

    generateTwoClusters() {
        for (let i = 0; i < 50; i++) {
            this.data.push({
                x: 0.25 + Math.random() * 0.25,
                y: 0.25 + Math.random() * 0.25,
                label: 0
            });
            this.data.push({
                x: 0.55 + Math.random() * 0.25,
                y: 0.55 + Math.random() * 0.25,
                label: 1
            });
        }
    }

    generateXOR() {
        for (let i = 0; i < 40; i++) {
            // Top-left and bottom-right: class 0
            this.data.push({
                x: 0.1 + Math.random() * 0.35,
                y: 0.55 + Math.random() * 0.35,
                label: 0
            });
            this.data.push({
                x: 0.55 + Math.random() * 0.35,
                y: 0.1 + Math.random() * 0.35,
                label: 0
            });
            // Top-right and bottom-left: class 1
            this.data.push({
                x: 0.55 + Math.random() * 0.35,
                y: 0.55 + Math.random() * 0.35,
                label: 1
            });
            this.data.push({
                x: 0.1 + Math.random() * 0.35,
                y: 0.1 + Math.random() * 0.35,
                label: 1
            });
        }
    }

    generateThreeClusters() {
        const centers = [
            { x: 0.3, y: 0.3 },
            { x: 0.7, y: 0.3 },
            { x: 0.5, y: 0.75 }
        ];

        for (let c = 0; c < 3; c++) {
            for (let i = 0; i < 35; i++) {
                this.data.push({
                    x: centers[c].x + (Math.random() - 0.5) * 0.25,
                    y: centers[c].y + (Math.random() - 0.5) * 0.25,
                    label: c
                });
            }
        }
    }

    generateSpiral() {
        for (let i = 0; i < 80; i++) {
            const t = i / 80 * 2 * Math.PI;
            const r = 0.1 + t * 0.08;

            this.data.push({
                x: 0.5 + r * Math.cos(t) + (Math.random() - 0.5) * 0.05,
                y: 0.5 + r * Math.sin(t) + (Math.random() - 0.5) * 0.05,
                label: 0
            });
            this.data.push({
                x: 0.5 + r * Math.cos(t + Math.PI) + (Math.random() - 0.5) * 0.05,
                y: 0.5 + r * Math.sin(t + Math.PI) + (Math.random() - 0.5) * 0.05,
                label: 1
            });
        }
    }

    // Calculate impurity (Gini or Entropy)
    calculateImpurity(labels) {
        if (labels.length === 0) return 0;

        const counts = {};
        labels.forEach(l => counts[l] = (counts[l] || 0) + 1);

        if (this.criterion === 'gini') {
            let gini = 1;
            for (const count of Object.values(counts)) {
                const p = count / labels.length;
                gini -= p * p;
            }
            return gini;
        } else {
            // Entropy
            let entropy = 0;
            for (const count of Object.values(counts)) {
                const p = count / labels.length;
                if (p > 0) entropy -= p * Math.log2(p);
            }
            return entropy;
        }
    }

    // Find best split for a node
    findBestSplit(data) {
        if (data.length < this.minSamplesSplit) return null;

        const labels = data.map(d => d.label);
        const currentImpurity = this.calculateImpurity(labels);

        let bestGain = 0;
        let bestSplit = null;

        // Try splitting on X and Y
        for (const feature of ['x', 'y']) {
            const values = [...new Set(data.map(d => d[feature]))].sort((a, b) => a - b);

            for (let i = 0; i < values.length - 1; i++) {
                const threshold = (values[i] + values[i + 1]) / 2;

                const left = data.filter(d => d[feature] <= threshold);
                const right = data.filter(d => d[feature] > threshold);

                if (left.length === 0 || right.length === 0) continue;

                const leftImpurity = this.calculateImpurity(left.map(d => d.label));
                const rightImpurity = this.calculateImpurity(right.map(d => d.label));

                const weightedImpurity =
                    (left.length / data.length) * leftImpurity +
                    (right.length / data.length) * rightImpurity;

                const gain = currentImpurity - weightedImpurity;

                if (gain > bestGain) {
                    bestGain = gain;
                    bestSplit = {
                        feature,
                        threshold,
                        gain,
                        leftData: left,
                        rightData: right
                    };
                }
            }
        }

        return bestSplit;
    }

    // Get majority class
    getMajorityClass(data) {
        const counts = {};
        data.forEach(d => counts[d.label] = (counts[d.label] || 0) + 1);
        return Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    }

    // Build tree recursively (for immediate training)
    buildTree(data, depth = 0) {
        const labels = data.map(d => d.label);
        const uniqueLabels = [...new Set(labels)];

        // Stopping conditions
        if (uniqueLabels.length === 1 || depth >= this.maxDepth || data.length < this.minSamplesSplit) {
            return {
                isLeaf: true,
                prediction: this.getMajorityClass(data),
                samples: data.length,
                depth
            };
        }

        const split = this.findBestSplit(data);

        if (!split || split.gain < 0.001) {
            return {
                isLeaf: true,
                prediction: this.getMajorityClass(data),
                samples: data.length,
                depth
            };
        }

        return {
            isLeaf: false,
            feature: split.feature,
            threshold: split.threshold,
            gain: split.gain,
            samples: data.length,
            depth,
            left: this.buildTree(split.leftData, depth + 1),
            right: this.buildTree(split.rightData, depth + 1)
        };
    }

    // Initialize step-by-step building
    initStepBuild() {
        this.buildQueue = [{
            data: [...this.data],
            depth: 0,
            parent: null,
            side: null
        }];
        this.tree = null;
    }

    // Single step of tree building
    step() {
        if (this.buildQueue.length === 0) {
            if (!this.tree) {
                this.initStepBuild();
            } else {
                return; // Tree is complete
            }
        }

        const { data, depth, parent, side } = this.buildQueue.shift();
        const labels = data.map(d => d.label);
        const uniqueLabels = [...new Set(labels)];

        let node;

        if (uniqueLabels.length === 1 || depth >= this.maxDepth || data.length < this.minSamplesSplit) {
            node = {
                isLeaf: true,
                prediction: this.getMajorityClass(data),
                samples: data.length,
                depth
            };
        } else {
            const split = this.findBestSplit(data);

            if (!split || split.gain < 0.001) {
                node = {
                    isLeaf: true,
                    prediction: this.getMajorityClass(data),
                    samples: data.length,
                    depth
                };
            } else {
                node = {
                    isLeaf: false,
                    feature: split.feature,
                    threshold: split.threshold,
                    gain: split.gain,
                    samples: data.length,
                    depth,
                    left: null,
                    right: null
                };

                // Add children to queue
                this.buildQueue.push({
                    data: split.leftData,
                    depth: depth + 1,
                    parent: node,
                    side: 'left'
                });
                this.buildQueue.push({
                    data: split.rightData,
                    depth: depth + 1,
                    parent: node,
                    side: 'right'
                });
            }
        }

        // Attach to tree
        if (!parent) {
            this.tree = node;
        } else {
            parent[side] = node;
        }

        this.updateStats();
        this.render();
    }

    // Train the entire tree at once with animation
    async train() {
        if (this.isTraining) return;
        this.isTraining = true;

        this.initStepBuild();

        while (this.buildQueue.length > 0) {
            this.step();
            await new Promise(r => setTimeout(r, this.animationSpeed));
        }

        this.isTraining = false;
    }

    reset() {
        this.tree = null;
        this.buildQueue = [];
        this.isTraining = false;
        this.updateStats();
        this.render();
    }

    // Predict class for a point
    predict(point, node = this.tree) {
        if (!node) return null;
        if (node.isLeaf) return parseInt(node.prediction);

        if (point[node.feature] <= node.threshold) {
            return this.predict(point, node.left);
        } else {
            return this.predict(point, node.right);
        }
    }

    // Calculate accuracy
    calculateAccuracy() {
        if (!this.tree) return null;
        let correct = 0;
        this.data.forEach(d => {
            if (this.predict(d) === d.label) correct++;
        });
        return correct / this.data.length;
    }

    // Count nodes in tree
    countNodes(node = this.tree) {
        if (!node) return 0;
        if (node.isLeaf) return 1;
        return 1 + this.countNodes(node.left) + this.countNodes(node.right);
    }

    // Get max depth of tree
    getTreeDepth(node = this.tree) {
        if (!node) return 0;
        if (node.isLeaf) return node.depth;
        return Math.max(this.getTreeDepth(node.left), this.getTreeDepth(node.right));
    }

    updateStats() {
        document.getElementById('node-count').textContent = this.countNodes();
        document.getElementById('current-depth').textContent = this.getTreeDepth();
        const acc = this.calculateAccuracy();
        document.getElementById('accuracy').textContent = acc !== null ? (acc * 100).toFixed(1) + '%' : '-';
    }

    render() {
        this.renderBoundary();
        this.renderTree();
    }

    renderBoundary() {
        const ctx = this.boundaryCtx;
        const w = this.boundaryCanvas.width;
        const h = this.boundaryCanvas.height;

        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, w, h);

        // Draw decision regions
        if (this.tree) {
            const resolution = 4;
            for (let px = 0; px < w; px += resolution) {
                for (let py = 0; py < h; py += resolution) {
                    const x = px / w;
                    const y = 1 - py / h;
                    const prediction = this.predict({ x, y });

                    if (prediction !== null) {
                        const colors = [
                            'rgba(99, 102, 241, 0.15)',
                            'rgba(16, 185, 129, 0.15)',
                            'rgba(245, 158, 11, 0.15)'
                        ];
                        ctx.fillStyle = colors[prediction] || colors[0];
                        ctx.fillRect(px, py, resolution, resolution);
                    }
                }
            }

            // Draw split lines
            this.drawSplitLines(this.tree, 0, 1, 0, 1, ctx, w, h);
        }

        // Draw grid
        ctx.strokeStyle = this.colors.grid;
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

        // Draw data points
        const classColors = [this.colors.class0, this.colors.class1, this.colors.class2];
        this.data.forEach(point => {
            const px = point.x * w;
            const py = (1 - point.y) * h;

            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fillStyle = classColors[point.label] || classColors[0];
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }

    drawSplitLines(node, xMin, xMax, yMin, yMax, ctx, w, h) {
        if (!node || node.isLeaf) return;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        if (node.feature === 'x') {
            const px = node.threshold * w;
            ctx.beginPath();
            ctx.moveTo(px, (1 - yMax) * h);
            ctx.lineTo(px, (1 - yMin) * h);
            ctx.stroke();

            if (node.left) this.drawSplitLines(node.left, xMin, node.threshold, yMin, yMax, ctx, w, h);
            if (node.right) this.drawSplitLines(node.right, node.threshold, xMax, yMin, yMax, ctx, w, h);
        } else {
            const py = (1 - node.threshold) * h;
            ctx.beginPath();
            ctx.moveTo(xMin * w, py);
            ctx.lineTo(xMax * w, py);
            ctx.stroke();

            if (node.left) this.drawSplitLines(node.left, xMin, xMax, yMin, node.threshold, ctx, w, h);
            if (node.right) this.drawSplitLines(node.right, xMin, xMax, node.threshold, yMax, ctx, w, h);
        }

        ctx.setLineDash([]);
    }

    renderTree() {
        const ctx = this.treeCtx;
        const w = this.treeCanvas.width;
        const h = this.treeCanvas.height;

        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, w, h);

        if (!this.tree) {
            ctx.fillStyle = this.colors.text;
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Train to build tree', w / 2, h / 2);
            return;
        }

        const maxDepth = this.getTreeDepth() + 1;
        const nodeRadius = Math.min(25, Math.max(15, w / (Math.pow(2, maxDepth) * 2)));

        this.drawNode(this.tree, w / 2, 40, w / 4, nodeRadius, ctx, w, h);
    }

    drawNode(node, x, y, dx, radius, ctx, w, h) {
        if (!node) return;

        const leafColors = [this.colors.leaf0, this.colors.leaf1, this.colors.leaf2];

        // Draw connections to children
        if (!node.isLeaf) {
            const childY = y + 70;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;

            if (node.left) {
                ctx.beginPath();
                ctx.moveTo(x, y + radius);
                ctx.lineTo(x - dx, childY - radius);
                ctx.stroke();
            }

            if (node.right) {
                ctx.beginPath();
                ctx.moveTo(x, y + radius);
                ctx.lineTo(x + dx, childY - radius);
                ctx.stroke();
            }
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        if (node.isLeaf) {
            ctx.fillStyle = leafColors[parseInt(node.prediction)] || leafColors[0];
        } else {
            ctx.fillStyle = this.colors.node;
        }
        ctx.fill();
        ctx.strokeStyle = this.colors.nodeBorder;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.max(10, radius * 0.6)}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (node.isLeaf) {
            ctx.fillText(`C${node.prediction}`, x, y);
        } else {
            const featureLabel = node.feature === 'x' ? 'X' : 'Y';
            ctx.fillText(`${featureLabel}`, x, y - 5);
            ctx.font = `${Math.max(8, radius * 0.4)}px Inter`;
            ctx.fillText(`≤${node.threshold.toFixed(2)}`, x, y + 8);
        }

        // Draw children
        if (!node.isLeaf) {
            const childY = y + 70;
            if (node.left) this.drawNode(node.left, x - dx, childY, dx / 2, radius, ctx, w, h);
            if (node.right) this.drawNode(node.right, x + dx, childY, dx / 2, radius, ctx, w, h);
        }
    }
}

// Additional CSS
const style = document.createElement('style');
style.textContent = `
    .visualization-area {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        padding: 16px;
        height: 100%;
    }
    
    .viz-container {
        background: rgba(20, 20, 30, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 12px;
        display: flex;
        flex-direction: column;
    }
    
    .viz-container h3 {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    .viz-container canvas {
        flex: 1;
        border-radius: 8px;
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DecisionTreeApp();
});
