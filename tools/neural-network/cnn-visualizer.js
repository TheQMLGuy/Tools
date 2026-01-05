/**
 * CNN Visualizers
 * Feature maps, filter visualization, and input canvas
 */

// ============================================
// CNN INPUT CANVAS
// Drawable 8x8 grid for user input
// ============================================

class CNNInputCanvas {
    constructor(canvasId, size = 8) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.size = size;
        this.grid = [];

        // Initialize empty grid
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                row.push(0);
            }
            this.grid.push(row);
        }

        this.isDrawing = false;
        this.drawValue = 1;

        this.setupResize();
        this.setupEvents();
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
        const minSize = Math.min(rect.width, rect.height, 200);

        this.canvas.width = minSize * dpr;
        this.canvas.height = minSize * dpr;
        this.canvas.style.width = minSize + 'px';
        this.canvas.style.height = minSize + 'px';
        this.ctx.scale(dpr, dpr);

        this.displaySize = minSize;
        this.cellSize = minSize / this.size;

        this.render();
    }

    setupEvents() {
        if (!this.canvas) return;

        const getCell = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const col = Math.floor(x / this.cellSize);
            const row = Math.floor(y / this.cellSize);
            return { row, col };
        };

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            const { row, col } = getCell(e);
            if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
                this.grid[row][col] = this.drawValue;
                this.render();
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) return;
            const { row, col } = getCell(e);
            if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
                this.grid[row][col] = this.drawValue;
                this.render();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDrawing = false;
        });

        // Right click to erase
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const { row, col } = getCell(e);
            if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
                this.grid[row][col] = 0;
                this.render();
            }
        });
    }

    render() {
        if (!this.ctx || !this.displaySize) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.displaySize, this.displaySize);

        // Draw cells
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const val = this.grid[i][j];
                const intensity = Math.max(0, Math.min(1, val));

                ctx.fillStyle = `rgb(${Math.round(intensity * 99)}, ${Math.round(intensity * 102)}, ${Math.round(intensity * 241)})`;
                ctx.fillRect(j * this.cellSize, i * this.cellSize, this.cellSize - 1, this.cellSize - 1);
            }
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.size; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.cellSize, 0);
            ctx.lineTo(i * this.cellSize, this.displaySize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * this.cellSize);
            ctx.lineTo(this.displaySize, i * this.cellSize);
            ctx.stroke();
        }
    }

    clear() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.grid[i][j] = 0;
            }
        }
        this.render();
    }

    setPattern(pattern) {
        this.grid = pattern.map(row => [...row]);
        this.render();
    }

    getGrid() {
        return this.grid;
    }
}

// ============================================
// FEATURE MAP VISUALIZER
// Shows conv layer output
// ============================================

class FeatureMapVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.network = null;

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

        if (!this.network || !this.network.lastConvOutput) {
            this.drawPlaceholder();
            return;
        }

        this.drawFeatureMaps();
    }

    drawPlaceholder() {
        const ctx = this.ctx;
        ctx.fillStyle = '#606070';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Feature Maps', this.width / 2, this.height / 2);
    }

    drawFeatureMaps() {
        const ctx = this.ctx;
        const maps = this.network.lastConvOutput;
        const numMaps = maps.length;

        const padding = 10;
        const gap = 8;
        const mapSize = Math.min(
            (this.width - padding * 2 - gap * (numMaps - 1)) / numMaps,
            this.height - padding * 2 - 20,
            50
        );

        const startX = (this.width - (mapSize * numMaps + gap * (numMaps - 1))) / 2;
        const startY = (this.height - mapSize) / 2;

        // Title
        ctx.fillStyle = '#a0a0b0';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Conv Feature Maps', this.width / 2, 12);

        // Draw each feature map
        for (let m = 0; m < numMaps; m++) {
            const map = maps[m];
            const h = map.length;
            const w = map[0].length;
            const cellSize = mapSize / Math.max(h, w);

            const x = startX + m * (mapSize + gap);

            // Find min/max for normalization
            let minVal = Infinity, maxVal = -Infinity;
            for (const row of map) {
                for (const val of row) {
                    minVal = Math.min(minVal, val);
                    maxVal = Math.max(maxVal, val);
                }
            }
            const range = maxVal - minVal || 1;

            // Draw cells
            for (let i = 0; i < h; i++) {
                for (let j = 0; j < w; j++) {
                    const val = (map[i][j] - minVal) / range;
                    const intensity = Math.max(0, Math.min(1, val));

                    ctx.fillStyle = `rgb(${Math.round(intensity * 99)}, ${Math.round(intensity * 102)}, ${Math.round(intensity * 241)})`;
                    ctx.fillRect(x + j * cellSize, startY + i * cellSize, cellSize - 0.5, cellSize - 0.5);
                }
            }

            // Label
            ctx.fillStyle = '#606070';
            ctx.font = '8px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`F${m + 1}`, x + mapSize / 2, startY + mapSize + 12);
        }
    }
}

// ============================================
// CNN NETWORK VISUALIZER
// Shows CNN architecture
// ============================================

class CNNNetworkVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.network = null;

        this.colors = {
            input: '#10b981',
            conv: '#6366f1',
            pool: '#f59e0b',
            dense: '#ef4444',
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
        const padding = 20;

        const layers = [
            { name: 'Input', size: '8×8×1', color: this.colors.input },
            { name: 'Conv 3×3', size: '8×8×4', color: this.colors.conv },
            { name: 'ReLU', size: '', color: this.colors.conv },
            { name: 'MaxPool', size: '4×4×4', color: this.colors.pool },
            { name: 'Dense', size: '4', color: this.colors.dense }
        ];

        const layerWidth = 70;
        const layerHeight = 35;
        const gap = (this.width - padding * 2 - layerWidth * layers.length) / (layers.length - 1);

        let x = padding;
        const y = this.height / 2 - layerHeight / 2;

        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];

            // Draw box
            ctx.fillStyle = layer.color;
            ctx.fillRect(x, y, layerWidth, layerHeight);

            // Draw name
            ctx.fillStyle = this.colors.text;
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(layer.name, x + layerWidth / 2, y + layerHeight / 2 - 4);

            // Draw size
            if (layer.size) {
                ctx.font = '8px Inter, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fillText(layer.size, x + layerWidth / 2, y + layerHeight / 2 + 8);
            }

            // Draw arrow
            if (i < layers.length - 1) {
                ctx.strokeStyle = '#606070';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + layerWidth, y + layerHeight / 2);
                ctx.lineTo(x + layerWidth + gap, y + layerHeight / 2);
                ctx.stroke();

                // Arrow head
                ctx.beginPath();
                ctx.moveTo(x + layerWidth + gap - 5, y + layerHeight / 2 - 4);
                ctx.lineTo(x + layerWidth + gap, y + layerHeight / 2);
                ctx.lineTo(x + layerWidth + gap - 5, y + layerHeight / 2 + 4);
                ctx.stroke();
            }

            x += layerWidth + gap;
        }
    }
}

// ============================================
// PREDICTION DISPLAY
// Shows class probabilities
// ============================================

class CNNPredictionDisplay {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.classNames = ['Class 0', 'Class 1', 'Class 2', 'Class 3'];
    }

    setClassNames(names) {
        this.classNames = names;
    }

    update(probs) {
        if (!this.container) return;

        let html = '';
        for (let i = 0; i < probs.length; i++) {
            const prob = probs[i] * 100;
            const isMax = probs[i] === Math.max(...probs);
            html += `
                <div class="cnn-pred-row ${isMax ? 'active' : ''}">
                    <span class="cnn-pred-label">${this.classNames[i]}</span>
                    <div class="cnn-pred-bar-bg">
                        <div class="cnn-pred-bar" style="width: ${prob}%"></div>
                    </div>
                    <span class="cnn-pred-value">${prob.toFixed(1)}%</span>
                </div>
            `;
        }
        this.container.innerHTML = html;
    }
}

// Export
window.CNNInputCanvas = CNNInputCanvas;
window.FeatureMapVisualizer = FeatureMapVisualizer;
window.CNNNetworkVisualizer = CNNNetworkVisualizer;
window.CNNPredictionDisplay = CNNPredictionDisplay;
