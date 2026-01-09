/**
 * Random Forest Visualizer
 * Ensemble of decision trees with voting visualization
 */

class RandomForestApp {
    constructor() {
        this.data = [];
        this.trees = [];
        this.nTrees = 5;
        this.maxDepth = 4;
        this.bootstrapRatio = 0.8;
        this.selectedTree = 'all';
        this.isTraining = false;
        this.animationSpeed = 400;

        this.colors = {
            class0: '#6366f1',
            class1: '#10b981',
            class2: '#f59e0b',
            background: '#0a0a0f',
            grid: 'rgba(255, 255, 255, 0.05)',
            text: '#a0a0b0',
            tree: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4',
                '#8b5cf6', '#84cc16', '#f97316', '#14b8a6', '#a855f7',
                '#22d3d8', '#e879f9', '#fbbf24', '#4ade80', '#fb7185',
                '#38bdf8', '#a3e635', '#fb923c', '#2dd4bf', '#c084fc']
        };

        this.initCanvases();
        this.setupEventListeners();
        this.generateData();
    }

    initCanvases() {
        this.boundaryCanvas = document.getElementById('boundary-canvas');
        this.votesCanvas = document.getElementById('votes-canvas');
        this.boundaryCtx = this.boundaryCanvas.getContext('2d');
        this.votesCtx = this.votesCanvas.getContext('2d');
        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
    }

    resizeCanvases() {
        const containers = document.querySelectorAll('.viz-container');
        containers.forEach((container, i) => {
            const canvas = i === 0 ? this.boundaryCanvas : this.votesCanvas;
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width - 20;
            canvas.height = rect.height - 50;
        });
        this.render();
    }

    setupEventListeners() {
        document.getElementById('n-trees').addEventListener('input', (e) => {
            this.nTrees = parseInt(e.target.value);
            document.getElementById('n-trees-value').textContent = this.nTrees;
        });

        document.getElementById('max-depth').addEventListener('input', (e) => {
            this.maxDepth = parseInt(e.target.value);
            document.getElementById('max-depth-value').textContent = this.maxDepth;
        });

        document.getElementById('bootstrap-ratio').addEventListener('input', (e) => {
            this.bootstrapRatio = parseInt(e.target.value) / 100;
            document.getElementById('bootstrap-ratio-value').textContent = e.target.value + '%';
        });

        document.getElementById('tree-select').addEventListener('change', (e) => {
            this.selectedTree = e.target.value;
            this.render();
        });

        document.getElementById('dataset-select').addEventListener('change', () => this.generateData());
        document.getElementById('generate-btn').addEventListener('click', () => this.generateData());
        document.getElementById('train-btn').addEventListener('click', () => this.train());
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
            case 'moons':
                this.generateMoons();
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
            this.data.push({ x: 0.1 + Math.random() * 0.35, y: 0.55 + Math.random() * 0.35, label: 0 });
            this.data.push({ x: 0.55 + Math.random() * 0.35, y: 0.1 + Math.random() * 0.35, label: 0 });
            this.data.push({ x: 0.55 + Math.random() * 0.35, y: 0.55 + Math.random() * 0.35, label: 1 });
            this.data.push({ x: 0.1 + Math.random() * 0.35, y: 0.1 + Math.random() * 0.35, label: 1 });
        }
    }

    generateThreeClusters() {
        const centers = [{ x: 0.3, y: 0.3 }, { x: 0.7, y: 0.3 }, { x: 0.5, y: 0.75 }];
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

    generateMoons() {
        for (let i = 0; i < 80; i++) {
            const angle = (i / 80) * Math.PI;
            // Upper moon
            this.data.push({
                x: 0.35 + 0.25 * Math.cos(angle) + (Math.random() - 0.5) * 0.08,
                y: 0.45 + 0.2 * Math.sin(angle) + (Math.random() - 0.5) * 0.08,
                label: 0
            });
            // Lower moon (shifted and flipped)
            this.data.push({
                x: 0.55 + 0.25 * Math.cos(angle + Math.PI) + (Math.random() - 0.5) * 0.08,
                y: 0.55 + 0.2 * Math.sin(angle + Math.PI) + (Math.random() - 0.5) * 0.08,
                label: 1
            });
        }
    }

    // Bootstrap sample
    bootstrapSample() {
        const sampleSize = Math.floor(this.data.length * this.bootstrapRatio);
        const sample = [];
        for (let i = 0; i < sampleSize; i++) {
            const idx = Math.floor(Math.random() * this.data.length);
            sample.push(this.data[idx]);
        }
        return sample;
    }

    // Calculate Gini impurity
    gini(labels) {
        if (labels.length === 0) return 0;
        const counts = {};
        labels.forEach(l => counts[l] = (counts[l] || 0) + 1);
        let gini = 1;
        for (const count of Object.values(counts)) {
            const p = count / labels.length;
            gini -= p * p;
        }
        return gini;
    }

    // Find best split
    findBestSplit(data, featureSubset) {
        if (data.length < 2) return null;

        const labels = data.map(d => d.label);
        const currentGini = this.gini(labels);

        let bestGain = 0;
        let bestSplit = null;

        for (const feature of featureSubset) {
            const values = [...new Set(data.map(d => d[feature]))].sort((a, b) => a - b);

            for (let i = 0; i < values.length - 1; i++) {
                const threshold = (values[i] + values[i + 1]) / 2;
                const left = data.filter(d => d[feature] <= threshold);
                const right = data.filter(d => d[feature] > threshold);

                if (left.length === 0 || right.length === 0) continue;

                const weightedGini =
                    (left.length / data.length) * this.gini(left.map(d => d.label)) +
                    (right.length / data.length) * this.gini(right.map(d => d.label));

                const gain = currentGini - weightedGini;

                if (gain > bestGain) {
                    bestGain = gain;
                    bestSplit = { feature, threshold, leftData: left, rightData: right };
                }
            }
        }

        return bestSplit;
    }

    getMajorityClass(data) {
        const counts = {};
        data.forEach(d => counts[d.label] = (counts[d.label] || 0) + 1);
        return parseInt(Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a)[0]);
    }

    // Build a single tree
    buildTree(data, depth = 0) {
        const labels = data.map(d => d.label);
        const uniqueLabels = [...new Set(labels)];

        if (uniqueLabels.length === 1 || depth >= this.maxDepth || data.length < 2) {
            return { isLeaf: true, prediction: this.getMajorityClass(data), samples: data.length };
        }

        // Random feature selection (use both for 2D, but in real RF would subset)
        const features = ['x', 'y'];
        const split = this.findBestSplit(data, features);

        if (!split) {
            return { isLeaf: true, prediction: this.getMajorityClass(data), samples: data.length };
        }

        return {
            isLeaf: false,
            feature: split.feature,
            threshold: split.threshold,
            left: this.buildTree(split.leftData, depth + 1),
            right: this.buildTree(split.rightData, depth + 1)
        };
    }

    // Predict with single tree
    predictTree(tree, point) {
        if (tree.isLeaf) return tree.prediction;
        if (point[tree.feature] <= tree.threshold) {
            return this.predictTree(tree.left, point);
        }
        return this.predictTree(tree.right, point);
    }

    // Predict with forest (majority vote)
    predictForest(point) {
        if (this.trees.length === 0) return null;

        const votes = {};
        this.trees.forEach((tree, i) => {
            if (this.selectedTree === 'all' || parseInt(this.selectedTree) === i) {
                const pred = this.predictTree(tree, point);
                votes[pred] = (votes[pred] || 0) + 1;
            }
        });

        return parseInt(Object.entries(votes).reduce((a, b) => b[1] > a[1] ? b : a)[0]);
    }

    // Get vote distribution
    getVotes(point) {
        const votes = [];
        this.trees.forEach(tree => {
            votes.push(this.predictTree(tree, point));
        });
        return votes;
    }

    async train() {
        if (this.isTraining) return;
        this.isTraining = true;

        this.trees = [];
        this.updateTreeSelector();

        for (let i = 0; i < this.nTrees; i++) {
            const sample = this.bootstrapSample();
            const tree = this.buildTree(sample);
            this.trees.push(tree);

            this.updateTreeSelector();
            this.updateStats();
            this.render();

            await new Promise(r => setTimeout(r, this.animationSpeed));
        }

        this.isTraining = false;
    }

    reset() {
        this.trees = [];
        this.selectedTree = 'all';
        this.isTraining = false;
        this.updateTreeSelector();
        this.updateStats();
        this.render();
    }

    updateTreeSelector() {
        const select = document.getElementById('tree-select');
        select.innerHTML = '<option value="all">All Trees (Ensemble)</option>';
        this.trees.forEach((_, i) => {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Tree ${i + 1}`;
            select.appendChild(option);
        });
    }

    countNodes(tree) {
        if (!tree) return 0;
        if (tree.isLeaf) return 1;
        return 1 + this.countNodes(tree.left) + this.countNodes(tree.right);
    }

    updateStats() {
        document.getElementById('trees-trained').textContent = this.trees.length;

        let totalNodes = 0;
        this.trees.forEach(t => totalNodes += this.countNodes(t));
        document.getElementById('total-nodes').textContent = totalNodes;

        if (this.trees.length > 0) {
            let correct = 0;
            this.data.forEach(d => {
                if (this.predictForest(d) === d.label) correct++;
            });
            document.getElementById('accuracy').textContent = ((correct / this.data.length) * 100).toFixed(1) + '%';
        } else {
            document.getElementById('accuracy').textContent = '-';
        }
    }

    render() {
        this.renderBoundary();
        this.renderVotes();
    }

    renderBoundary() {
        const ctx = this.boundaryCtx;
        const w = this.boundaryCanvas.width;
        const h = this.boundaryCanvas.height;

        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, w, h);

        // Draw decision regions
        if (this.trees.length > 0) {
            const resolution = 4;
            for (let px = 0; px < w; px += resolution) {
                for (let py = 0; py < h; py += resolution) {
                    const x = px / w;
                    const y = 1 - py / h;
                    const prediction = this.predictForest({ x, y });

                    if (prediction !== null) {
                        const colors = [
                            'rgba(99, 102, 241, 0.2)',
                            'rgba(16, 185, 129, 0.2)',
                            'rgba(245, 158, 11, 0.2)'
                        ];
                        ctx.fillStyle = colors[prediction] || colors[0];
                        ctx.fillRect(px, py, resolution, resolution);
                    }
                }
            }
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

    renderVotes() {
        const ctx = this.votesCtx;
        const w = this.votesCanvas.width;
        const h = this.votesCanvas.height;

        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, w, h);

        if (this.trees.length === 0) {
            ctx.fillStyle = this.colors.text;
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Train forest to see voting', w / 2, h / 2);
            return;
        }

        const classColors = [this.colors.class0, this.colors.class1, this.colors.class2];

        // Draw each tree as a column
        const treeWidth = Math.min(60, (w - 40) / this.trees.length);
        const startX = (w - treeWidth * this.trees.length) / 2;

        // Sample some test points to show voting
        const testPoints = [
            { x: 0.3, y: 0.3, label: 'A' },
            { x: 0.7, y: 0.7, label: 'B' },
            { x: 0.5, y: 0.5, label: 'C' },
            { x: 0.2, y: 0.8, label: 'D' }
        ];

        ctx.fillStyle = '#fff';
        ctx.font = '12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('Tree votes for sample points:', 10, 25);

        testPoints.forEach((point, pi) => {
            const votes = this.getVotes(point);
            const y = 60 + pi * 80;

            // Point label
            ctx.fillStyle = this.colors.text;
            ctx.font = '11px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(`Point ${point.label} (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`, 10, y);

            // Draw tree votes
            votes.forEach((vote, ti) => {
                const x = startX + ti * treeWidth;
                const barHeight = 40;

                // Tree indicator
                ctx.fillStyle = this.colors.tree[ti % this.colors.tree.length];
                ctx.fillRect(x + 5, y + 8, treeWidth - 10, 4);

                // Vote color
                ctx.fillStyle = classColors[vote] || classColors[0];
                ctx.beginPath();
                ctx.arc(x + treeWidth / 2, y + 28, 12, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.font = '10px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(vote, x + treeWidth / 2, y + 32);
            });

            // Final prediction
            const finalPred = this.predictForest(point);
            ctx.fillStyle = '#fff';
            ctx.font = '11px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(`→ Class ${finalPred}`, startX + this.trees.length * treeWidth + 10, y + 30);
        });

        // Tree legend
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        this.trees.forEach((_, i) => {
            const x = startX + i * treeWidth + treeWidth / 2;
            ctx.fillText(`T${i + 1}`, x, h - 10);
        });
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
    window.app = new RandomForestApp();
});
