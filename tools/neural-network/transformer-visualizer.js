/**
 * Transformer Visualizers
 * Attention heatmap and architecture visualization
 */

// ============================================
// TRANSFORMER SEQUENCE VISUALIZER
// ============================================

class TransformerSequenceVisualizer extends RNNSequenceVisualizer {
    constructor(canvasId) {
        super(canvasId);
    }
}

// ============================================
// ATTENTION HEATMAP VISUALIZER
// Shows attention weights as a heatmap
// ============================================

class AttentionHeatmapVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.network = null;

        this.colors = {
            low: [30, 41, 59],      // Dark blue
            high: [99, 102, 241],   // Purple
            text: '#a0a0b0'
        };

        this.setupResize();
    }

    setupResize() {
        if (!this.canvas) return;
        const resizeObserver = new ResizeObserver(() => this.resize());
        resizeObserver.observe(this.canvas.parentElement);
    }

    resize() {
        if (!this.canvas) return;

        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = Math.max(rect.width, 100) * dpr;
        this.canvas.height = Math.max(rect.height, 100) * dpr;
        this.ctx.scale(dpr, dpr);

        this.width = Math.max(rect.width, 100);
        this.height = Math.max(rect.height, 100);

        this.render();
    }

    setNetwork(network) {
        this.network = network;
    }

    render() {
        if (!this.ctx || !this.width || !this.height) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        if (!this.network || !this.network.lastAttentionWeights) {
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
        ctx.fillText('Attention Weights', this.width / 2, this.height / 2);
    }

    interpolateColor(val) {
        const r = Math.round(this.colors.low[0] + val * (this.colors.high[0] - this.colors.low[0]));
        const g = Math.round(this.colors.low[1] + val * (this.colors.high[1] - this.colors.low[1]));
        const b = Math.round(this.colors.low[2] + val * (this.colors.high[2] - this.colors.low[2]));
        return `rgb(${r}, ${g}, ${b})`;
    }

    drawHeatmap() {
        const ctx = this.ctx;
        const weights = this.network.lastAttentionWeights;
        const seqLen = weights.length;

        const padding = 30;
        const cellSize = Math.min(
            (this.width - padding * 2) / seqLen,
            (this.height - padding * 2) / seqLen,
            20
        );

        const startX = (this.width - cellSize * seqLen) / 2;
        const startY = (this.height - cellSize * seqLen) / 2;

        // Title
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Attention Weights (Query × Key)', this.width / 2, 12);

        // Draw cells
        for (let i = 0; i < seqLen; i++) {
            for (let j = 0; j < seqLen; j++) {
                const val = weights[i][j];
                const x = startX + j * cellSize;
                const y = startY + i * cellSize;

                ctx.fillStyle = this.interpolateColor(val);
                ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
            }
        }

        // Axis labels
        ctx.fillStyle = this.colors.text;
        ctx.font = '8px Inter, sans-serif';
        ctx.textAlign = 'center';

        for (let i = 0; i < seqLen; i += Math.ceil(seqLen / 5)) {
            // X axis (Key)
            ctx.fillText(i.toString(), startX + i * cellSize + cellSize / 2, startY + seqLen * cellSize + 10);
            // Y axis (Query)
            ctx.textAlign = 'right';
            ctx.fillText(i.toString(), startX - 5, startY + i * cellSize + cellSize / 2 + 3);
            ctx.textAlign = 'center';
        }

        // Axis labels
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText('Key →', this.width / 2, this.height - 5);

        ctx.save();
        ctx.translate(8, this.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Query →', 0, 0);
        ctx.restore();
    }
}

// ============================================
// TRANSFORMER NETWORK VISUALIZER
// ============================================

class TransformerNetworkVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.network = null;

        this.colors = {
            embed: '#10b981',
            attention: '#6366f1',
            ffn: '#f59e0b',
            output: '#ef4444',
            text: '#fff'
        };

        this.setupResize();
    }

    setupResize() {
        if (!this.canvas) return;
        const resizeObserver = new ResizeObserver(() => this.resize());
        resizeObserver.observe(this.canvas.parentElement);
    }

    resize() {
        if (!this.canvas) return;

        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = Math.max(rect.width, 200) * dpr;
        this.canvas.height = Math.max(rect.height, 150) * dpr;
        this.ctx.scale(dpr, dpr);

        this.width = Math.max(rect.width, 200);
        this.height = Math.max(rect.height, 150);

        this.render();
    }

    setNetwork(network) {
        this.network = network;
    }

    render() {
        if (!this.ctx || !this.width || !this.height) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        this.drawArchitecture();
    }

    drawArchitecture() {
        const ctx = this.ctx;
        const centerX = this.width / 2;

        const boxW = 120;
        const boxH = 28;
        const gap = 12;

        let y = 25;

        // Input
        ctx.fillStyle = '#606070';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Input Sequence', centerX, y);
        y += 15;

        // Arrow
        this.drawArrow(ctx, centerX, y, centerX, y + gap);
        y += gap + 5;

        // Embedding + Positional
        ctx.fillStyle = this.colors.embed;
        ctx.fillRect(centerX - boxW / 2, y, boxW, boxH);
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText('Embed + Pos Enc', centerX, y + boxH / 2 + 3);
        y += boxH;

        this.drawArrow(ctx, centerX, y, centerX, y + gap);
        y += gap;

        // Self-Attention
        ctx.fillStyle = this.colors.attention;
        ctx.fillRect(centerX - boxW / 2, y, boxW, boxH);
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Self-Attention', centerX, y + boxH / 2 + 3);

        // Residual connection
        ctx.strokeStyle = '#4a4a5a';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(centerX + boxW / 2, y - gap - boxH / 2);
        ctx.lineTo(centerX + boxW / 2 + 20, y - gap - boxH / 2);
        ctx.lineTo(centerX + boxW / 2 + 20, y + boxH / 2);
        ctx.lineTo(centerX + boxW / 2, y + boxH / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        y += boxH;

        this.drawArrow(ctx, centerX, y, centerX, y + gap);
        y += gap;

        // FFN
        ctx.fillStyle = this.colors.ffn;
        ctx.fillRect(centerX - boxW / 2, y, boxW, boxH);
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Feed-Forward', centerX, y + boxH / 2 + 3);
        y += boxH;

        this.drawArrow(ctx, centerX, y, centerX, y + gap);
        y += gap;

        // Output
        ctx.fillStyle = this.colors.output;
        ctx.fillRect(centerX - boxW / 2, y, boxW, boxH);
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Output Projection', centerX, y + boxH / 2 + 3);
    }

    drawArrow(ctx, x1, y1, x2, y2) {
        ctx.strokeStyle = '#606070';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Arrow head
        const headLen = 5;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen, y2 - headLen);
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 + headLen, y2 - headLen);
        ctx.stroke();
    }
}

// Export
window.TransformerSequenceVisualizer = TransformerSequenceVisualizer;
window.AttentionHeatmapVisualizer = AttentionHeatmapVisualizer;
window.TransformerNetworkVisualizer = TransformerNetworkVisualizer;
