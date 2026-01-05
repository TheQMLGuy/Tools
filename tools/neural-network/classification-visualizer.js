/**
 * Classification Visualizer
 * 2D point classification with decision boundary visualization
 */

class ClassificationVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.network = null;

        // Data points: [{x, y, class}]
        this.points = [];
        this.currentClass = 0;

        // Visualization settings
        this.gridResolution = 30; // Resolution for decision boundary
        this.showBoundary = true;

        // Colors
        this.colors = {
            class0: '#ef4444', // Red
            class1: '#3b82f6', // Blue
            class0Light: 'rgba(239, 68, 68, 0.3)',
            class1Light: 'rgba(59, 130, 246, 0.3)',
            grid: 'rgba(255, 255, 255, 0.05)',
            axis: 'rgba(255, 255, 255, 0.2)',
            text: '#606070'
        };

        // Coordinate system: [-1, 1] x [-1, 1]
        this.xMin = -1;
        this.xMax = 1;
        this.yMin = -1;
        this.yMax = 1;

        this.setupResize();
        this.setupEvents();
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

    setupEvents() {
        if (!this.canvas) return;

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;

            // Convert to data coordinates
            const x = this.canvasToDataX(canvasX);
            const y = this.canvasToDataY(canvasY);

            this.addPoint(x, y, this.currentClass);
        });
    }

    setNetwork(network) {
        this.network = network;
    }

    setCurrentClass(classIndex) {
        this.currentClass = classIndex;
    }

    addPoint(x, y, classLabel) {
        this.points.push({ x, y, class: classLabel });
        this.render();
    }

    clearPoints() {
        this.points = [];
        this.render();
    }

    // Coordinate conversions
    dataToCanvasX(x) {
        const padding = 40;
        return padding + ((x - this.xMin) / (this.xMax - this.xMin)) * (this.width - padding * 2);
    }

    dataToCanvasY(y) {
        const padding = 40;
        // Y is inverted
        return padding + ((this.yMax - y) / (this.yMax - this.yMin)) * (this.height - padding * 2);
    }

    canvasToDataX(canvasX) {
        const padding = 40;
        return this.xMin + ((canvasX - padding) / (this.width - padding * 2)) * (this.xMax - this.xMin);
    }

    canvasToDataY(canvasY) {
        const padding = 40;
        return this.yMax - ((canvasY - padding) / (this.height - padding * 2)) * (this.yMax - this.yMin);
    }

    // Preset datasets
    generateDataset(name) {
        this.points = [];
        const n = 50; // Points per class

        switch (name) {
            case 'xor':
                this.generateXOR(n);
                break;
            case 'circle':
                this.generateCircle(n);
                break;
            case 'spiral':
                this.generateSpiral(n);
                break;
            case 'gaussian':
                this.generateGaussian(n);
                break;
            default:
                // Custom - don't generate
                break;
        }

        this.render();
    }

    generateXOR(n) {
        for (let i = 0; i < n; i++) {
            // Class 0: top-left and bottom-right
            this.points.push({
                x: -0.5 + Math.random() * 0.4 - 0.2,
                y: 0.5 + Math.random() * 0.4 - 0.2,
                class: 0
            });
            this.points.push({
                x: 0.5 + Math.random() * 0.4 - 0.2,
                y: -0.5 + Math.random() * 0.4 - 0.2,
                class: 0
            });

            // Class 1: top-right and bottom-left
            this.points.push({
                x: 0.5 + Math.random() * 0.4 - 0.2,
                y: 0.5 + Math.random() * 0.4 - 0.2,
                class: 1
            });
            this.points.push({
                x: -0.5 + Math.random() * 0.4 - 0.2,
                y: -0.5 + Math.random() * 0.4 - 0.2,
                class: 1
            });
        }
    }

    generateCircle(n) {
        for (let i = 0; i < n * 2; i++) {
            const angle = Math.random() * Math.PI * 2;

            // Inner circle - class 0
            const r1 = Math.random() * 0.4;
            this.points.push({
                x: r1 * Math.cos(angle),
                y: r1 * Math.sin(angle),
                class: 0
            });

            // Outer ring - class 1
            const r2 = 0.5 + Math.random() * 0.4;
            this.points.push({
                x: r2 * Math.cos(angle),
                y: r2 * Math.sin(angle),
                class: 1
            });
        }
    }

    generateSpiral(n) {
        for (let i = 0; i < n * 2; i++) {
            const t = (i / (n * 2)) * 3 * Math.PI;
            const noise = 0.1;

            // Spiral 1 - class 0
            const r1 = 0.1 + t * 0.12;
            this.points.push({
                x: r1 * Math.cos(t) + (Math.random() - 0.5) * noise,
                y: r1 * Math.sin(t) + (Math.random() - 0.5) * noise,
                class: 0
            });

            // Spiral 2 - class 1 (offset by PI)
            const r2 = 0.1 + t * 0.12;
            this.points.push({
                x: r2 * Math.cos(t + Math.PI) + (Math.random() - 0.5) * noise,
                y: r2 * Math.sin(t + Math.PI) + (Math.random() - 0.5) * noise,
                class: 1
            });
        }
    }

    generateGaussian(n) {
        const gaussian = () => {
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        };

        for (let i = 0; i < n; i++) {
            // Class 0: centered at (-0.5, 0)
            this.points.push({
                x: -0.5 + gaussian() * 0.2,
                y: gaussian() * 0.3,
                class: 0
            });

            // Class 1: centered at (0.5, 0)
            this.points.push({
                x: 0.5 + gaussian() * 0.2,
                y: gaussian() * 0.3,
                class: 1
            });
        }
    }

    // Get training data
    getTrainingData() {
        const inputs = this.points.map(p => [p.x, p.y]);
        const targets = this.points.map(p => [p.class]);
        return { inputs, targets };
    }

    render() {
        if (!this.ctx || !this.width || !this.height) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        this.drawGrid();
        this.drawAxes();

        if (this.showBoundary && this.network) {
            this.drawDecisionBoundary();
        }

        this.drawPoints();
    }

    drawGrid() {
        const ctx = this.ctx;
        const padding = 40;

        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;

        // Vertical grid lines
        for (let x = -1; x <= 1; x += 0.25) {
            const canvasX = this.dataToCanvasX(x);
            ctx.beginPath();
            ctx.moveTo(canvasX, padding);
            ctx.lineTo(canvasX, this.height - padding);
            ctx.stroke();
        }

        // Horizontal grid lines
        for (let y = -1; y <= 1; y += 0.25) {
            const canvasY = this.dataToCanvasY(y);
            ctx.beginPath();
            ctx.moveTo(padding, canvasY);
            ctx.lineTo(this.width - padding, canvasY);
            ctx.stroke();
        }
    }

    drawAxes() {
        const ctx = this.ctx;
        const padding = 40;

        ctx.strokeStyle = this.colors.axis;
        ctx.lineWidth = 1;

        // X-axis
        const originY = this.dataToCanvasY(0);
        ctx.beginPath();
        ctx.moveTo(padding, originY);
        ctx.lineTo(this.width - padding, originY);
        ctx.stroke();

        // Y-axis
        const originX = this.dataToCanvasX(0);
        ctx.beginPath();
        ctx.moveTo(originX, padding);
        ctx.lineTo(originX, this.height - padding);
        ctx.stroke();

        // Labels
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';

        for (let x = -1; x <= 1; x += 0.5) {
            const canvasX = this.dataToCanvasX(x);
            ctx.fillText(x.toFixed(1), canvasX, this.height - padding + 15);
        }

        ctx.textAlign = 'right';
        for (let y = -1; y <= 1; y += 0.5) {
            const canvasY = this.dataToCanvasY(y);
            ctx.fillText(y.toFixed(1), padding - 8, canvasY + 4);
        }
    }

    drawDecisionBoundary() {
        if (!this.network || this.points.length === 0) return;

        const ctx = this.ctx;
        const padding = 40;
        const plotWidth = this.width - padding * 2;
        const plotHeight = this.height - padding * 2;

        const resolution = this.gridResolution;
        const cellWidth = plotWidth / resolution;
        const cellHeight = plotHeight / resolution;

        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const canvasX = padding + i * cellWidth;
                const canvasY = padding + j * cellHeight;

                // Get data coordinates for cell center
                const x = this.canvasToDataX(canvasX + cellWidth / 2);
                const y = this.canvasToDataY(canvasY + cellHeight / 2);

                // Get network prediction
                const output = this.network.forward([x, y]);
                const prediction = output[0];

                // Color based on prediction
                if (prediction < 0.5) {
                    ctx.fillStyle = this.colors.class0Light;
                } else {
                    ctx.fillStyle = this.colors.class1Light;
                }

                ctx.fillRect(canvasX, canvasY, cellWidth + 1, cellHeight + 1);
            }
        }
    }

    drawPoints() {
        const ctx = this.ctx;

        for (const point of this.points) {
            const canvasX = this.dataToCanvasX(point.x);
            const canvasY = this.dataToCanvasY(point.y);

            // Draw point
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, 6, 0, Math.PI * 2);
            ctx.fillStyle = point.class === 0 ? this.colors.class0 : this.colors.class1;
            ctx.fill();

            // Border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    // Calculate classification accuracy
    calculateAccuracy() {
        if (!this.network || this.points.length === 0) return 0;

        let correct = 0;
        for (const point of this.points) {
            const output = this.network.forward([point.x, point.y]);
            const predicted = output[0] >= 0.5 ? 1 : 0;
            if (predicted === point.class) correct++;
        }

        return (correct / this.points.length) * 100;
    }
}

// Export
window.ClassificationVisualizer = ClassificationVisualizer;
