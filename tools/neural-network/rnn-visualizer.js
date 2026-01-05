/**
 * RNN Visualizers
 * Sequence visualization and unfolded network visualization for RNNs
 */

// ============================================
// RNN SEQUENCE VISUALIZER
// Shows input, prediction, and target sequences
// ============================================

class RNNSequenceVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.network = null;

        // Data
        this.inputSequence = [];
        this.targetSequence = [];
        this.predictedSequence = [];

        // Visualization settings
        this.padding = 50;
        this.colors = {
            input: 'rgba(99, 102, 241, 0.8)',       // Purple - input
            target: 'rgba(255, 255, 255, 0.5)',     // White/gray - target
            predicted: '#10b981',                    // Green - prediction
            grid: 'rgba(255, 255, 255, 0.05)',
            axis: 'rgba(255, 255, 255, 0.2)',
            text: '#606070'
        };

        this.setupResize();
    }

    setupResize() {
        if (!this.canvas) return;

        const resizeObserver = new ResizeObserver(() => {
            this.resize();
        });
        resizeObserver.observe(this.canvas.parentElement);
    }

    resize() {
        if (!this.canvas) return;

        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        const width = Math.max(rect.width, 200);
        const height = Math.max(rect.height, 150);

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;

        this.ctx.scale(dpr, dpr);

        this.width = width;
        this.height = height;

        this.render();
    }

    setNetwork(network) {
        this.network = network;
    }

    setData(input, target, predicted) {
        this.inputSequence = input || [];
        this.targetSequence = target || [];
        this.predictedSequence = predicted || [];
        this.render();
    }

    render() {
        if (!this.ctx || !this.width || !this.height) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        this.drawGrid();
        this.drawAxes();
        this.drawSequences();
        this.drawLegend();
    }

    drawGrid() {
        const ctx = this.ctx;
        const padding = this.padding;

        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;

        const plotWidth = this.width - padding * 2;
        const plotHeight = this.height - padding * 2;

        // Vertical grid lines
        const numVertLines = 10;
        for (let i = 0; i <= numVertLines; i++) {
            const x = padding + (i / numVertLines) * plotWidth;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, this.height - padding);
            ctx.stroke();
        }

        // Horizontal grid lines
        const numHorizLines = 5;
        for (let i = 0; i <= numHorizLines; i++) {
            const y = padding + (i / numHorizLines) * plotHeight;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(this.width - padding, y);
            ctx.stroke();
        }
    }

    drawAxes() {
        const ctx = this.ctx;
        const padding = this.padding;

        ctx.strokeStyle = this.colors.axis;
        ctx.lineWidth = 1;

        // X-axis (center)
        const centerY = this.height / 2;
        ctx.beginPath();
        ctx.moveTo(padding, centerY);
        ctx.lineTo(this.width - padding, centerY);
        ctx.stroke();

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, this.height - padding);
        ctx.stroke();

        // Labels
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';

        // X-axis labels
        const seqLen = Math.max(this.inputSequence.length, 1);
        for (let i = 0; i <= seqLen; i += Math.ceil(seqLen / 5)) {
            const x = padding + (i / seqLen) * (this.width - padding * 2);
            ctx.fillText(i.toString(), x, this.height - padding + 15);
        }

        // Y-axis labels
        ctx.textAlign = 'right';
        ctx.fillText('1', padding - 5, padding + 5);
        ctx.fillText('0', padding - 5, centerY + 3);
        ctx.fillText('-1', padding - 5, this.height - padding + 5);

        // Axis titles
        ctx.textAlign = 'center';
        ctx.fillText('Time Step', this.width / 2, this.height - 10);

        ctx.save();
        ctx.translate(12, this.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Value', 0, 0);
        ctx.restore();
    }

    drawSequences() {
        const ctx = this.ctx;
        const padding = this.padding;
        const plotWidth = this.width - padding * 2;
        const plotHeight = this.height - padding * 2;

        const seqLen = Math.max(this.inputSequence.length, this.targetSequence.length, 1);

        // Helper to map value to y coordinate
        const valueToY = (val) => {
            // Clamp to [-1.5, 1.5] for display
            val = Math.max(-1.5, Math.min(1.5, val));
            // Map [-1.5, 1.5] to plotHeight
            return padding + ((1.5 - val) / 3) * plotHeight;
        };

        const timeToX = (t) => {
            return padding + (t / (seqLen - 1 || 1)) * plotWidth;
        };

        // Draw target sequence (dashed, gray)
        if (this.targetSequence.length > 0) {
            ctx.strokeStyle = this.colors.target;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();

            for (let t = 0; t < this.targetSequence.length; t++) {
                const val = Array.isArray(this.targetSequence[t])
                    ? this.targetSequence[t][0]
                    : this.targetSequence[t];
                const x = timeToX(t);
                const y = valueToY(val);

                if (t === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw input sequence (purple)
        if (this.inputSequence.length > 0) {
            ctx.strokeStyle = this.colors.input;
            ctx.lineWidth = 2;
            ctx.beginPath();

            for (let t = 0; t < this.inputSequence.length; t++) {
                const val = Array.isArray(this.inputSequence[t])
                    ? this.inputSequence[t][0]
                    : this.inputSequence[t];
                const x = timeToX(t);
                const y = valueToY(val);

                if (t === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();

            // Draw points
            for (let t = 0; t < this.inputSequence.length; t++) {
                const val = Array.isArray(this.inputSequence[t])
                    ? this.inputSequence[t][0]
                    : this.inputSequence[t];
                const x = timeToX(t);
                const y = valueToY(val);

                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fillStyle = this.colors.input;
                ctx.fill();
            }
        }

        // Draw predicted sequence (green, solid)
        if (this.predictedSequence.length > 0) {
            ctx.strokeStyle = this.colors.predicted;
            ctx.lineWidth = 2.5;
            ctx.beginPath();

            for (let t = 0; t < this.predictedSequence.length; t++) {
                const val = Array.isArray(this.predictedSequence[t])
                    ? this.predictedSequence[t][0]
                    : this.predictedSequence[t];
                const x = timeToX(t);
                const y = valueToY(val);

                if (t === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();

            // Draw points
            for (let t = 0; t < this.predictedSequence.length; t++) {
                const val = Array.isArray(this.predictedSequence[t])
                    ? this.predictedSequence[t][0]
                    : this.predictedSequence[t];
                const x = timeToX(t);
                const y = valueToY(val);

                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = this.colors.predicted;
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    drawLegend() {
        const ctx = this.ctx;
        const legendX = this.width - this.padding - 120;
        const legendY = this.padding + 10;

        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'left';

        // Input
        ctx.fillStyle = this.colors.input;
        ctx.beginPath();
        ctx.arc(legendX, legendY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText('Input', legendX + 10, legendY + 4);

        // Target
        ctx.fillStyle = this.colors.target;
        ctx.beginPath();
        ctx.arc(legendX, legendY + 15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText('Target', legendX + 10, legendY + 19);

        // Predicted
        ctx.fillStyle = this.colors.predicted;
        ctx.beginPath();
        ctx.arc(legendX, legendY + 30, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText('Predicted', legendX + 10, legendY + 34);
    }
}

// ============================================
// RNN NETWORK VISUALIZER
// Shows unfolded RNN through time with recurrent connections
// ============================================

class RNNNetworkVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.network = null;

        // Settings
        this.timestepsToShow = 4;
        this.nodeRadius = 16;
        this.layerGap = 100;

        // Colors
        this.colors = {
            input: '#6366f1',
            hidden: '#8b5cf6',
            output: '#10b981',
            recurrent: '#f59e0b',
            weight: 'rgba(255, 255, 255, 0.3)',
            text: '#fff',
            nodeStroke: 'rgba(255, 255, 255, 0.2)'
        };

        this.setupResize();
    }

    setupResize() {
        if (!this.canvas) return;

        const resizeObserver = new ResizeObserver(() => {
            this.resize();
        });
        resizeObserver.observe(this.canvas.parentElement);
    }

    resize() {
        if (!this.canvas) return;

        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        const width = Math.max(rect.width, 200);
        const height = Math.max(rect.height, 150);

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;

        this.ctx.scale(dpr, dpr);

        this.width = width;
        this.height = height;

        this.render();
    }

    setNetwork(network) {
        this.network = network;
    }

    render() {
        if (!this.ctx || !this.width || !this.height) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        if (!this.network) {
            this.drawPlaceholder();
            return;
        }

        this.drawUnfoldedNetwork();
    }

    drawPlaceholder() {
        const ctx = this.ctx;
        ctx.fillStyle = '#606070';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('RNN Network View', this.width / 2, this.height / 2);
    }

    drawUnfoldedNetwork() {
        const ctx = this.ctx;
        const padding = 40;

        const inputSize = this.network.inputSize;
        const hiddenSize = this.network.hiddenSize;
        const outputSize = this.network.outputSize;

        // Determine layout
        const T = this.timestepsToShow;
        const timeGap = (this.width - padding * 2) / (T + 0.5);

        // Calculate layer heights
        const layerY = {
            input: this.height - padding - 30,
            hidden: this.height / 2,
            output: padding + 30
        };

        // Draw title for each timestep
        ctx.fillStyle = this.colors.text;
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';

        for (let t = 0; t < T; t++) {
            const x = padding + (t + 0.5) * timeGap;
            ctx.fillText(`t=${t}`, x, padding + 5);
        }

        // Draw connections and nodes for each timestep
        const nodePositions = [];

        for (let t = 0; t < T; t++) {
            const baseX = padding + (t + 0.5) * timeGap;
            const positions = { input: [], hidden: [], output: [] };

            // Input nodes
            const inputSpacing = Math.min(30, (this.height * 0.15) / inputSize);
            for (let i = 0; i < inputSize; i++) {
                const y = layerY.input + (i - (inputSize - 1) / 2) * inputSpacing;
                positions.input.push({ x: baseX, y });
            }

            // Hidden nodes
            const hiddenSpacing = Math.min(25, (this.height * 0.3) / hiddenSize);
            for (let i = 0; i < hiddenSize; i++) {
                const y = layerY.hidden + (i - (hiddenSize - 1) / 2) * hiddenSpacing;
                positions.hidden.push({ x: baseX, y });
            }

            // Output nodes
            const outputSpacing = Math.min(30, (this.height * 0.15) / outputSize);
            for (let i = 0; i < outputSize; i++) {
                const y = layerY.output + (i - (outputSize - 1) / 2) * outputSpacing;
                positions.output.push({ x: baseX, y });
            }

            nodePositions.push(positions);
        }

        // Draw connections
        ctx.lineWidth = 1;

        for (let t = 0; t < T; t++) {
            const pos = nodePositions[t];

            // Input to hidden connections
            ctx.strokeStyle = this.colors.weight;
            for (const inputPos of pos.input) {
                for (const hiddenPos of pos.hidden) {
                    ctx.beginPath();
                    ctx.moveTo(inputPos.x, inputPos.y);
                    ctx.lineTo(hiddenPos.x, hiddenPos.y);
                    ctx.stroke();
                }
            }

            // Hidden to output connections
            for (const hiddenPos of pos.hidden) {
                for (const outputPos of pos.output) {
                    ctx.beginPath();
                    ctx.moveTo(hiddenPos.x, hiddenPos.y);
                    ctx.lineTo(outputPos.x, outputPos.y);
                    ctx.stroke();
                }
            }

            // Recurrent connections (hidden to next hidden)
            if (t < T - 1) {
                ctx.strokeStyle = this.colors.recurrent;
                ctx.lineWidth = 1.5;

                const nextPos = nodePositions[t + 1];
                for (let i = 0; i < hiddenSize; i++) {
                    const from = pos.hidden[i];
                    const to = nextPos.hidden[i];

                    // Draw curved arrow
                    ctx.beginPath();
                    ctx.moveTo(from.x + this.nodeRadius, from.y);

                    const cpX = (from.x + to.x) / 2;
                    const cpY = from.y - 30; // Curve upward

                    ctx.quadraticCurveTo(cpX, cpY, to.x - this.nodeRadius, to.y);
                    ctx.stroke();

                    // Arrow head
                    this.drawArrowHead(ctx, cpX, cpY, to.x - this.nodeRadius, to.y);
                }

                ctx.lineWidth = 1;
            }
        }

        // Draw nodes
        const nodeR = this.nodeRadius;

        for (let t = 0; t < T; t++) {
            const pos = nodePositions[t];

            // Get hidden state values if available
            const hiddenValues = this.network.lastHiddenStates && this.network.lastHiddenStates[t + 1];

            // Input nodes
            for (const p of pos.input) {
                this.drawNode(ctx, p.x, p.y, nodeR - 4, this.colors.input, 'x');
            }

            // Hidden nodes
            for (let i = 0; i < pos.hidden.length; i++) {
                const p = pos.hidden[i];
                let label = 'h';

                // Show hidden state value if available
                if (hiddenValues && hiddenValues[i] !== undefined) {
                    label = hiddenValues[i].toFixed(1);
                }

                this.drawNode(ctx, p.x, p.y, nodeR, this.colors.hidden, label);
            }

            // Output nodes
            for (const p of pos.output) {
                this.drawNode(ctx, p.x, p.y, nodeR - 4, this.colors.output, 'y');
            }
        }

        // Draw layer labels
        ctx.fillStyle = '#606070';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Output', 5, layerY.output);
        ctx.fillText('Hidden', 5, layerY.hidden);
        ctx.fillText('Input', 5, layerY.input);
    }

    drawNode(ctx, x, y, r, color, label) {
        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = this.colors.nodeStroke;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = this.colors.text;
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
    }

    drawArrowHead(ctx, fromX, fromY, toX, toY) {
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const headLen = 6;

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headLen * Math.cos(angle - Math.PI / 6),
            toY - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headLen * Math.cos(angle + Math.PI / 6),
            toY - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }
}

// ============================================
// RNN HIDDEN STATE VISUALIZER
// Shows hidden state evolution over time
// ============================================

class RNNHiddenStateVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.network = null;

        this.colors = {
            positive: '#10b981',
            negative: '#ef4444',
            neutral: '#6366f1',
            text: '#606070',
            grid: 'rgba(255, 255, 255, 0.05)'
        };

        this.setupResize();
    }

    setupResize() {
        if (!this.canvas) return;

        const resizeObserver = new ResizeObserver(() => {
            this.resize();
        });
        resizeObserver.observe(this.canvas.parentElement);
    }

    resize() {
        if (!this.canvas) return;

        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        const width = Math.max(rect.width, 100);
        const height = Math.max(rect.height, 80);

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;

        this.ctx.scale(dpr, dpr);

        this.width = width;
        this.height = height;

        this.render();
    }

    setNetwork(network) {
        this.network = network;
    }

    render() {
        if (!this.ctx || !this.width || !this.height) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        if (!this.network || !this.network.lastHiddenStates ||
            this.network.lastHiddenStates.length === 0) {
            this.drawPlaceholder();
            return;
        }

        this.drawHeatmap();
    }

    drawPlaceholder() {
        const ctx = this.ctx;
        ctx.fillStyle = '#606070';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Hidden State', this.width / 2, this.height / 2);
    }

    drawHeatmap() {
        const ctx = this.ctx;
        const padding = 25;

        const hiddenStates = this.network.lastHiddenStates;
        const T = hiddenStates.length;
        const H = this.network.hiddenSize;

        const cellWidth = (this.width - padding * 2) / T;
        const cellHeight = (this.height - padding * 2) / H;

        // Draw title
        ctx.fillStyle = '#a0a0b0';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Hidden State Heatmap', this.width / 2, 10);

        // Draw cells
        for (let t = 0; t < T; t++) {
            const state = hiddenStates[t];

            for (let h = 0; h < H; h++) {
                const val = state[h];
                const x = padding + t * cellWidth;
                const y = padding + h * cellHeight;

                // Color based on value (-1 to 1 for tanh)
                const intensity = Math.abs(val);
                let color;
                if (val > 0) {
                    color = `rgba(16, 185, 129, ${0.2 + intensity * 0.8})`;
                } else {
                    color = `rgba(239, 68, 68, ${0.2 + intensity * 0.8})`;
                }

                ctx.fillStyle = color;
                ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1);
            }
        }

        // Time axis labels
        ctx.fillStyle = this.colors.text;
        ctx.font = '8px Inter, sans-serif';
        ctx.textAlign = 'center';
        for (let t = 0; t < T; t += Math.ceil(T / 5)) {
            const x = padding + (t + 0.5) * cellWidth;
            ctx.fillText(t.toString(), x, this.height - 8);
        }
    }
}

// Export
window.RNNSequenceVisualizer = RNNSequenceVisualizer;
window.RNNNetworkVisualizer = RNNNetworkVisualizer;
window.RNNHiddenStateVisualizer = RNNHiddenStateVisualizer;
