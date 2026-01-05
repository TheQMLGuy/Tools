/**
 * LSTM Visualizers
 * Gate visualization and cell state heatmap for LSTM networks
 */

// ============================================
// LSTM SEQUENCE VISUALIZER
// ============================================

class LSTMSequenceVisualizer extends RNNSequenceVisualizer {
    constructor(canvasId) {
        super(canvasId);
    }
}

// ============================================
// LSTM GATE VISUALIZER
// Shows forget, input, output gate activations
// ============================================

class LSTMGateVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.network = null;

        this.colors = {
            forget: '#ef4444',   // Red
            input: '#10b981',    // Green
            output: '#6366f1',   // Purple
            cell: '#f59e0b',     // Orange
            text: '#a0a0b0',
            bg: 'rgba(255, 255, 255, 0.05)'
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
        this.canvas.height = Math.max(rect.height, 80) * dpr;
        this.ctx.scale(dpr, dpr);

        this.width = Math.max(rect.width, 100);
        this.height = Math.max(rect.height, 80);

        this.render();
    }

    setNetwork(network) {
        this.network = network;
    }

    render() {
        if (!this.ctx || !this.width || !this.height) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        if (!this.network || !this.network.lastGates || this.network.lastGates.length === 0) {
            this.drawPlaceholder();
            return;
        }

        this.drawGateBars();
    }

    drawPlaceholder() {
        const ctx = this.ctx;
        ctx.fillStyle = '#606070';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Gate Activations', this.width / 2, this.height / 2);
    }

    drawGateBars() {
        const ctx = this.ctx;
        const padding = 20;
        const barHeight = 12;
        const gapY = 8;

        // Get latest gate activations
        const gates = this.network.lastGates;
        const lastGate = gates[gates.length - 1];

        // Calculate average gate values
        const avgForget = lastGate.f.reduce((a, b) => a + b, 0) / lastGate.f.length;
        const avgInput = lastGate.i.reduce((a, b) => a + b, 0) / lastGate.i.length;
        const avgOutput = lastGate.o.reduce((a, b) => a + b, 0) / lastGate.o.length;

        const barWidth = this.width - padding * 2;
        let y = padding;

        // Title
        ctx.fillStyle = this.colors.text;
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'left';

        // Forget gate
        ctx.fillText('Forget', padding, y);
        y += 12;
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(padding, y, barWidth, barHeight);
        ctx.fillStyle = this.colors.forget;
        ctx.fillRect(padding, y, barWidth * avgForget, barHeight);
        ctx.fillStyle = '#fff';
        ctx.font = '8px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText((avgForget * 100).toFixed(0) + '%', this.width - padding, y + 10);
        y += barHeight + gapY;

        // Input gate
        ctx.textAlign = 'left';
        ctx.fillStyle = this.colors.text;
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText('Input', padding, y);
        y += 12;
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(padding, y, barWidth, barHeight);
        ctx.fillStyle = this.colors.input;
        ctx.fillRect(padding, y, barWidth * avgInput, barHeight);
        ctx.fillStyle = '#fff';
        ctx.font = '8px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText((avgInput * 100).toFixed(0) + '%', this.width - padding, y + 10);
        y += barHeight + gapY;

        // Output gate
        ctx.textAlign = 'left';
        ctx.fillStyle = this.colors.text;
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText('Output', padding, y);
        y += 12;
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(padding, y, barWidth, barHeight);
        ctx.fillStyle = this.colors.output;
        ctx.fillRect(padding, y, barWidth * avgOutput, barHeight);
        ctx.fillStyle = '#fff';
        ctx.font = '8px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText((avgOutput * 100).toFixed(0) + '%', this.width - padding, y + 10);
    }
}

// ============================================
// LSTM NETWORK VISUALIZER
// Shows LSTM architecture with gate boxes
// ============================================

class LSTMNetworkVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.network = null;

        this.colors = {
            forget: '#ef4444',
            input: '#10b981',
            output: '#6366f1',
            cell: '#f59e0b',
            hidden: '#8b5cf6',
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

        this.drawLSTMCell();
    }

    drawLSTMCell() {
        const ctx = this.ctx;
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        const boxW = 50;
        const boxH = 25;
        const gap = 15;

        // Cell state line (top)
        ctx.strokeStyle = this.colors.cell;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - 100, 40);
        ctx.lineTo(centerX + 100, 40);
        ctx.stroke();

        // Label
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Cell State', centerX, 25);

        // Gate boxes
        const gates = [
            { label: 'f', color: this.colors.forget, x: centerX - 60 },
            { label: 'i', color: this.colors.input, x: centerX - 10 },
            { label: 'o', color: this.colors.output, x: centerX + 40 }
        ];

        const gateY = centerY + 10;

        for (const gate of gates) {
            // Gate box
            ctx.fillStyle = gate.color;
            ctx.fillRect(gate.x - boxW / 2, gateY - boxH / 2, boxW, boxH);

            // Gate label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(gate.label, gate.x, gateY);

            // Connection to cell state
            ctx.strokeStyle = gate.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(gate.x, gateY - boxH / 2);
            ctx.lineTo(gate.x, 40);
            ctx.stroke();
        }

        // Hidden state output
        ctx.fillStyle = this.colors.hidden;
        ctx.beginPath();
        ctx.arc(centerX + 100, centerY + 40, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('h', centerX + 100, centerY + 40);

        // Labels
        ctx.fillStyle = '#606070';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('forget', centerX - 75, this.height - 20);
        ctx.fillText('input', centerX - 25, this.height - 20);
        ctx.fillText('output', centerX + 25, this.height - 20);

        // Input arrow
        ctx.fillStyle = '#a0a0b0';
        ctx.textAlign = 'right';
        ctx.fillText('x_t →', centerX - 100, centerY + 40);
    }
}

// Export
window.LSTMSequenceVisualizer = LSTMSequenceVisualizer;
window.LSTMGateVisualizer = LSTMGateVisualizer;
window.LSTMNetworkVisualizer = LSTMNetworkVisualizer;
