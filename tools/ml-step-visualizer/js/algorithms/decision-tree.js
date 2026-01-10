/**
 * Decision Tree Algorithm with Step-by-Step Visualization
 * Shows Gini/Entropy calculations, information gain, and tree building
 */

class DecisionTreeAlgorithm {
    constructor() {
        this.name = 'Decision Tree';
        this.dataset = null;
        this.params = {
            criterion: 'gini',
            max_depth: 5,
            min_samples_split: 2,
            min_samples_leaf: 1
        };

        this.tree = null;
        this.steps = [];
        this.currentStep = 0;
        this.buildQueue = [];

        this.colors = {
            class0: '#ef4444',  // Red for No
            class1: '#10b981',  // Green for Yes
            class2: '#6366f1',  // Indigo for other
            node: '#1e1e2e',
            nodeBorder: '#6366f1',
            line: 'rgba(255, 255, 255, 0.3)'
        };
    }

    /**
     * Initialize with dataset
     */
    init(dataset) {
        this.dataset = dataset;
        this.reset();
        return this.generateSteps();
    }

    /**
     * Reset algorithm state
     */
    reset() {
        this.tree = null;
        this.steps = [];
        this.currentStep = 0;
        this.buildQueue = [];
    }

    /**
     * Update parameters
     */
    setParams(params) {
        this.params = { ...this.params, ...params };
    }

    /**
     * Generate all calculation steps
     */
    generateSteps() {
        this.steps = [];

        // Step 1: Initial dataset overview
        this.addStep({
            title: 'Analyze Dataset',
            type: 'overview',
            content: this.createOverviewStep(),
            highlightRows: null,
            treeState: null
        });

        // Step 2: Calculate overall impurity
        const overallImpurity = this.calculateImpurity(this.dataset.data.map(d => d[this.dataset.target]));
        this.addStep({
            title: `Calculate Overall ${this.params.criterion === 'gini' ? 'Gini Impurity' : 'Entropy'}`,
            type: 'impurity',
            content: this.createImpurityStep(this.dataset.data, 'Overall'),
            highlightRows: null,
            treeState: null
        });

        // Build tree with steps
        this.buildTreeWithSteps(this.dataset.data, 0, null, null);

        // Final step: Complete tree
        this.addStep({
            title: 'Decision Tree Complete',
            type: 'complete',
            content: this.createCompleteStep(),
            highlightRows: null,
            treeState: { ...this.tree }
        });

        return this.steps;
    }

    /**
     * Add a step
     */
    addStep(step) {
        step.stepNumber = this.steps.length + 1;
        this.steps.push(step);
    }

    /**
     * Create overview step content
     */
    createOverviewStep() {
        const counts = {};
        this.dataset.data.forEach(row => {
            const label = row[this.dataset.target];
            counts[label] = (counts[label] || 0) + 1;
        });

        let html = `
            <p>Dataset: <strong>${this.dataset.name}</strong></p>
            <p>Total samples: <strong>${this.dataset.data.length}</strong></p>
            <p>Features: ${this.dataset.features.map(f => `<code>${f}</code>`).join(', ')}</p>
            <p>Target: <code>${this.dataset.target}</code></p>
            <div class="feature-comparison">
        `;

        Object.entries(counts).forEach(([label, count]) => {
            const pct = (count / this.dataset.data.length * 100).toFixed(1);
            html += `
                <div class="feature-card">
                    <div class="feature-name">${label}</div>
                    <div class="feature-value">${count} (${pct}%)</div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    /**
     * Create impurity calculation step
     */
    createImpurityStep(data, label) {
        const labels = data.map(d => d[this.dataset.target]);
        const counts = {};
        labels.forEach(l => counts[l] = (counts[l] || 0) + 1);

        const n = labels.length;
        let html = `<p><strong>${label}</strong> (n=${n})</p>`;

        if (this.params.criterion === 'gini') {
            // Gini Impurity
            html += `
                <div class="calc-equation">
                    Gini = 1 - \\sum_{i=1}^{c} p_i^2
                </div>
            `;

            let gini = 1;
            let terms = [];

            Object.entries(counts).forEach(([cls, count]) => {
                const p = count / n;
                gini -= p * p;
                terms.push(`(${count}/${n})² = ${(p * p).toFixed(4)}`);
            });

            html += `<p class="calc-step-content">`;
            html += `Proportions: `;
            Object.entries(counts).forEach(([cls, count], i) => {
                const p = (count / n).toFixed(3);
                html += i > 0 ? ', ' : '';
                html += `p(${cls}) = ${count}/${n} = ${p}`;
            });
            html += `</p>`;

            html += `
                <div class="calc-equation">
                    Gini = 1 - (${terms.join(' + ')})
                </div>
            `;

            html += `
                <div class="calc-result">
                    <span class="calc-result-label">Gini Impurity</span>
                    <span class="calc-result-value">${gini.toFixed(4)}</span>
                </div>
            `;
        } else {
            // Entropy
            html += `
                <div class="calc-equation">
                    H = -\\sum_{i=1}^{c} p_i \\log_2(p_i)
                </div>
            `;

            let entropy = 0;
            let terms = [];

            Object.entries(counts).forEach(([cls, count]) => {
                const p = count / n;
                if (p > 0) {
                    entropy -= p * Math.log2(p);
                    terms.push(`${p.toFixed(3)} × log₂(${p.toFixed(3)})`);
                }
            });

            html += `<p class="calc-step-content">`;
            html += `Proportions: `;
            Object.entries(counts).forEach(([cls, count], i) => {
                const p = (count / n).toFixed(3);
                html += i > 0 ? ', ' : '';
                html += `p(${cls}) = ${count}/${n} = ${p}`;
            });
            html += `</p>`;

            html += `
                <div class="calc-equation">
                    H = -(${terms.join(' + ')})
                </div>
            `;

            html += `
                <div class="calc-result">
                    <span class="calc-result-label">Entropy</span>
                    <span class="calc-result-value">${entropy.toFixed(4)}</span>
                </div>
            `;
        }

        return html;
    }

    /**
     * Calculate impurity (Gini or Entropy)
     */
    calculateImpurity(labels) {
        if (labels.length === 0) return 0;

        const counts = {};
        labels.forEach(l => counts[l] = (counts[l] || 0) + 1);
        const n = labels.length;

        if (this.params.criterion === 'gini') {
            let gini = 1;
            for (const count of Object.values(counts)) {
                const p = count / n;
                gini -= p * p;
            }
            return gini;
        } else {
            let entropy = 0;
            for (const count of Object.values(counts)) {
                const p = count / n;
                if (p > 0) entropy -= p * Math.log2(p);
            }
            return entropy;
        }
    }

    /**
     * Build tree with calculation steps
     */
    buildTreeWithSteps(data, depth, parent, side) {
        const labels = data.map(d => d[this.dataset.target]);
        const uniqueLabels = [...new Set(labels)];

        // Stopping conditions
        if (uniqueLabels.length === 1 ||
            depth >= this.params.max_depth ||
            data.length < this.params.min_samples_split ||
            data.length < this.params.min_samples_leaf * 2) {

            const prediction = this.getMajorityClass(data);
            const node = { isLeaf: true, prediction, samples: data.length, depth };

            if (parent) {
                parent[side] = node;
            } else {
                this.tree = node;
            }

            this.addStep({
                title: `Create Leaf Node (Depth ${depth})`,
                type: 'leaf',
                content: this.createLeafStep(data, prediction, depth),
                highlightRows: this.getDataIndices(data),
                treeState: this.cloneTree()
            });

            return node;
        }

        // Find best split
        const splitResult = this.findBestSplitWithSteps(data, depth);

        if (!splitResult.split || splitResult.split.gain < 0.001) {
            const prediction = this.getMajorityClass(data);
            const node = { isLeaf: true, prediction, samples: data.length, depth };

            if (parent) {
                parent[side] = node;
            } else {
                this.tree = node;
            }

            return node;
        }

        // Create decision node
        const node = {
            isLeaf: false,
            feature: splitResult.split.feature,
            value: splitResult.split.value,
            gain: splitResult.split.gain,
            samples: data.length,
            depth,
            left: null,
            right: null
        };

        if (parent) {
            parent[side] = node;
        } else {
            this.tree = node;
        }

        this.addStep({
            title: `Create Decision Node: ${splitResult.split.feature}`,
            type: 'decision',
            content: this.createDecisionStep(splitResult.split, depth),
            highlightRows: this.getDataIndices(data),
            highlightFeature: splitResult.split.feature,
            treeState: this.cloneTree()
        });

        // Recursively build children
        this.buildTreeWithSteps(splitResult.split.leftData, depth + 1, node, 'left');
        this.buildTreeWithSteps(splitResult.split.rightData, depth + 1, node, 'right');

        return node;
    }

    /**
     * Find best split with step generation
     */
    findBestSplitWithSteps(data, depth) {
        const labels = data.map(d => d[this.dataset.target]);
        const currentImpurity = this.calculateImpurity(labels);

        let bestGain = 0;
        let bestSplit = null;
        const allSplits = [];

        // Try each feature
        for (const feature of this.dataset.features) {
            const featureType = this.dataset.featureTypes[feature];

            if (featureType === 'categorical') {
                // Try each category value
                const values = [...new Set(data.map(d => d[feature]))];

                for (const value of values) {
                    const leftData = data.filter(d => d[feature] === value);
                    const rightData = data.filter(d => d[feature] !== value);

                    if (leftData.length === 0 || rightData.length === 0) continue;

                    const leftImpurity = this.calculateImpurity(leftData.map(d => d[this.dataset.target]));
                    const rightImpurity = this.calculateImpurity(rightData.map(d => d[this.dataset.target]));

                    const weightedImpurity =
                        (leftData.length / data.length) * leftImpurity +
                        (rightData.length / data.length) * rightImpurity;

                    const gain = currentImpurity - weightedImpurity;

                    allSplits.push({
                        feature,
                        value,
                        type: 'categorical',
                        gain,
                        leftData,
                        rightData,
                        leftImpurity,
                        rightImpurity
                    });

                    if (gain > bestGain) {
                        bestGain = gain;
                        bestSplit = allSplits[allSplits.length - 1];
                    }
                }
            } else {
                // Numerical feature - try midpoints
                const values = [...new Set(data.map(d => d[feature]))].sort((a, b) => a - b);

                for (let i = 0; i < values.length - 1; i++) {
                    const threshold = (values[i] + values[i + 1]) / 2;

                    const leftData = data.filter(d => d[feature] <= threshold);
                    const rightData = data.filter(d => d[feature] > threshold);

                    if (leftData.length === 0 || rightData.length === 0) continue;

                    const leftImpurity = this.calculateImpurity(leftData.map(d => d[this.dataset.target]));
                    const rightImpurity = this.calculateImpurity(rightData.map(d => d[this.dataset.target]));

                    const weightedImpurity =
                        (leftData.length / data.length) * leftImpurity +
                        (rightData.length / data.length) * rightImpurity;

                    const gain = currentImpurity - weightedImpurity;

                    if (gain > bestGain) {
                        bestGain = gain;
                        bestSplit = {
                            feature,
                            value: threshold,
                            type: 'numerical',
                            gain,
                            leftData,
                            rightData,
                            leftImpurity,
                            rightImpurity
                        };
                    }
                }
            }
        }

        // Add information gain comparison step
        if (allSplits.length > 0) {
            this.addStep({
                title: `Compare Information Gain (Depth ${depth})`,
                type: 'compare',
                content: this.createCompareStep(allSplits, bestSplit, currentImpurity),
                highlightRows: this.getDataIndices(data),
                treeState: this.cloneTree()
            });
        }

        return { split: bestSplit, allSplits };
    }

    /**
     * Create comparison step content
     */
    createCompareStep(allSplits, bestSplit, currentImpurity) {
        const metric = this.params.criterion === 'gini' ? 'Gini' : 'Entropy';

        let html = `
            <p>Current ${metric}: <strong>${currentImpurity.toFixed(4)}</strong></p>
            <div class="calc-equation">
                IG(S, A) = ${metric}(S) - \\sum_{v} \\frac{|S_v|}{|S|} × ${metric}(S_v)
            </div>
            <div class="feature-comparison">
        `;

        // Group by feature
        const byFeature = {};
        allSplits.forEach(split => {
            if (!byFeature[split.feature]) {
                byFeature[split.feature] = [];
            }
            byFeature[split.feature].push(split);
        });

        // Show best split per feature
        Object.entries(byFeature).forEach(([feature, splits]) => {
            const best = splits.reduce((a, b) => a.gain > b.gain ? a : b);
            const isBest = bestSplit && bestSplit.feature === feature && bestSplit.value === best.value;

            html += `
                <div class="feature-card ${isBest ? 'best' : ''}">
                    <div class="feature-name">${feature}${best.type === 'categorical' ? ` = ${best.value}` : ''}</div>
                    <div class="feature-value">IG: ${best.gain.toFixed(4)}</div>
                </div>
            `;
        });

        html += '</div>';

        if (bestSplit) {
            const splitDesc = bestSplit.type === 'categorical'
                ? `${bestSplit.feature} = "${bestSplit.value}"`
                : `${bestSplit.feature} ≤ ${bestSplit.value.toFixed(2)}`;

            html += `
                <div class="calc-result">
                    <span class="calc-result-label">Best Split</span>
                    <span class="calc-result-value">${splitDesc}</span>
                </div>
            `;
        }

        return html;
    }

    /**
     * Create decision node step content
     */
    createDecisionStep(split, depth) {
        const splitDesc = split.type === 'categorical'
            ? `${split.feature} = "${split.value}"`
            : `${split.feature} ≤ ${split.value.toFixed(2)}`;

        let html = `
            <p>Depth: ${depth}</p>
            <p>Split on: <strong>${splitDesc}</strong></p>
            <p>Information Gain: <strong>${split.gain.toFixed(4)}</strong></p>
            <div class="feature-comparison">
                <div class="feature-card">
                    <div class="feature-name">Left Branch</div>
                    <div class="feature-value">${split.leftData.length} samples</div>
                </div>
                <div class="feature-card">
                    <div class="feature-name">Right Branch</div>
                    <div class="feature-value">${split.rightData.length} samples</div>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Create leaf node step content
     */
    createLeafStep(data, prediction, depth) {
        const counts = {};
        data.forEach(d => {
            const label = d[this.dataset.target];
            counts[label] = (counts[label] || 0) + 1;
        });

        let html = `
            <p>Depth: ${depth}</p>
            <p>Samples: ${data.length}</p>
            <div class="feature-comparison">
        `;

        Object.entries(counts).forEach(([label, count]) => {
            const isMajority = label === prediction;
            html += `
                <div class="feature-card ${isMajority ? 'best' : ''}">
                    <div class="feature-name">${label}</div>
                    <div class="feature-value">${count}</div>
                </div>
            `;
        });

        html += `</div>
            <div class="calc-result">
                <span class="calc-result-label">Prediction</span>
                <span class="calc-result-value">${prediction}</span>
            </div>
        `;

        return html;
    }

    /**
     * Create complete step content
     */
    createCompleteStep() {
        const stats = this.getTreeStats(this.tree);

        let html = `
            <p>Tree building complete!</p>
            <div class="feature-comparison">
                <div class="feature-card">
                    <div class="feature-name">Total Nodes</div>
                    <div class="feature-value">${stats.totalNodes}</div>
                </div>
                <div class="feature-card">
                    <div class="feature-name">Leaf Nodes</div>
                    <div class="feature-value">${stats.leafNodes}</div>
                </div>
                <div class="feature-card">
                    <div class="feature-name">Max Depth</div>
                    <div class="feature-value">${stats.maxDepth}</div>
                </div>
            </div>
        `;

        // Calculate accuracy
        const accuracy = this.calculateAccuracy();
        html += `
            <div class="calc-result">
                <span class="calc-result-label">Training Accuracy</span>
                <span class="calc-result-value">${(accuracy * 100).toFixed(1)}%</span>
            </div>
        `;

        return html;
    }

    /**
     * Get tree statistics
     */
    getTreeStats(node, stats = { totalNodes: 0, leafNodes: 0, maxDepth: 0 }) {
        if (!node) return stats;

        stats.totalNodes++;
        stats.maxDepth = Math.max(stats.maxDepth, node.depth);

        if (node.isLeaf) {
            stats.leafNodes++;
        } else {
            this.getTreeStats(node.left, stats);
            this.getTreeStats(node.right, stats);
        }

        return stats;
    }

    /**
     * Get majority class
     */
    getMajorityClass(data) {
        const counts = {};
        data.forEach(d => {
            const label = d[this.dataset.target];
            counts[label] = (counts[label] || 0) + 1;
        });
        return Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    }

    /**
     * Get data indices in original dataset
     */
    getDataIndices(data) {
        return data.map(d => {
            for (let i = 0; i < this.dataset.data.length; i++) {
                if (this.rowsEqual(this.dataset.data[i], d)) {
                    return i;
                }
            }
            return -1;
        }).filter(i => i >= 0);
    }

    /**
     * Check if two rows are equal
     */
    rowsEqual(row1, row2) {
        for (const key of [...this.dataset.features, this.dataset.target]) {
            if (row1[key] !== row2[key]) return false;
        }
        return true;
    }

    /**
     * Clone tree for state preservation
     */
    cloneTree() {
        return JSON.parse(JSON.stringify(this.tree));
    }

    /**
     * Predict for a sample
     */
    predict(sample, node = this.tree) {
        if (!node) return null;
        if (node.isLeaf) return node.prediction;

        const value = sample[node.feature];

        if (typeof value === 'string') {
            // Categorical
            if (value === node.value) {
                return this.predict(sample, node.left);
            } else {
                return this.predict(sample, node.right);
            }
        } else {
            // Numerical
            if (value <= node.value) {
                return this.predict(sample, node.left);
            } else {
                return this.predict(sample, node.right);
            }
        }
    }

    /**
     * Calculate accuracy
     */
    calculateAccuracy() {
        if (!this.tree) return 0;

        let correct = 0;
        this.dataset.data.forEach(sample => {
            if (this.predict(sample) === sample[this.dataset.target]) {
                correct++;
            }
        });

        return correct / this.dataset.data.length;
    }

    /**
     * Render tree on canvas
     */
    renderTree(ctx, width, height, treeState = null) {
        const tree = treeState || this.tree;

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        if (!tree) {
            ctx.fillStyle = '#606070';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Build tree to see visualization', width / 2, height / 2);
            return;
        }

        const stats = this.getTreeStats(tree);
        const nodeRadius = Math.min(30, Math.max(20, width / (Math.pow(2, stats.maxDepth) * 3)));
        const levelHeight = Math.min(80, (height - 80) / (stats.maxDepth + 1));

        this.drawNode(ctx, tree, width / 2, 50, width / 4, nodeRadius, levelHeight);
    }

    /**
     * Draw a tree node
     */
    drawNode(ctx, node, x, y, dx, radius, levelHeight) {
        if (!node) return;

        // Draw connections first
        if (!node.isLeaf) {
            const childY = y + levelHeight;

            ctx.strokeStyle = this.colors.line;
            ctx.lineWidth = 2;

            if (node.left) {
                ctx.beginPath();
                ctx.moveTo(x, y + radius);
                ctx.lineTo(x - dx, childY - radius);
                ctx.stroke();

                // Draw label
                ctx.fillStyle = '#606070';
                ctx.font = '10px Inter';
                ctx.textAlign = 'center';
                const leftLabel = typeof node.value === 'string' ? `= ${node.value}` : `≤ ${node.value.toFixed(2)}`;
                ctx.fillText(leftLabel, x - dx / 2 - 10, y + levelHeight / 2 - 5);
            }

            if (node.right) {
                ctx.beginPath();
                ctx.moveTo(x, y + radius);
                ctx.lineTo(x + dx, childY - radius);
                ctx.stroke();

                // Draw label
                ctx.fillStyle = '#606070';
                ctx.font = '10px Inter';
                ctx.textAlign = 'center';
                const rightLabel = typeof node.value === 'string' ? `≠ ${node.value}` : `> ${node.value.toFixed(2)}`;
                ctx.fillText(rightLabel, x + dx / 2 + 10, y + levelHeight / 2 - 5);
            }
        }

        // Draw node
        ctx.beginPath();

        if (node.isLeaf) {
            // Leaf node - rounded rectangle
            const w = radius * 2;
            const h = radius * 1.5;
            ctx.roundRect(x - w / 2, y - h / 2, w, h, 8);

            if (node.prediction === 'Yes' || node.prediction === 1) {
                ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
                ctx.strokeStyle = '#10b981';
            } else {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
                ctx.strokeStyle = '#ef4444';
            }
        } else {
            // Decision node - circle
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
            ctx.strokeStyle = '#6366f1';
        }

        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.max(10, radius * 0.5)}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (node.isLeaf) {
            ctx.fillText(node.prediction, x, y);
        } else {
            ctx.fillText(node.feature, x, y - 4);
            ctx.font = `${Math.max(9, radius * 0.4)}px JetBrains Mono`;
            ctx.fillStyle = '#a0a0b0';
            ctx.fillText(`n=${node.samples}`, x, y + 10);
        }

        // Draw children
        if (!node.isLeaf) {
            const childY = y + levelHeight;
            if (node.left) this.drawNode(ctx, node.left, x - dx, childY, dx / 2, radius, levelHeight);
            if (node.right) this.drawNode(ctx, node.right, x + dx, childY, dx / 2, radius, levelHeight);
        }
    }

    /**
     * Get step count
     */
    getStepCount() {
        return this.steps.length;
    }

    /**
     * Get step by index
     */
    getStep(index) {
        return this.steps[index];
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DecisionTreeAlgorithm;
}
