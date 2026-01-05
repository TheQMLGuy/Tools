/**
 * Matrix Visualizer - Canvas-based Matrix Rendering with Animation
 * Renders matrices, vectors, and step-by-step multiplication animations
 */

class MatrixVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Display dimensions
        this.width = 0;
        this.height = 0;

        // Colors
        this.colors = {
            background: '#0a0a0f',
            text: '#ffffff',
            textMuted: '#606070',
            bracket: '#a0a0b0',
            positive: '#10b981',
            negative: '#ef4444',
            highlight: '#ffc832',
            active: '#00ffff',
            accent: '#6366f1',
            zero: '#404050',
            one: '#10b981',
            operator: '#8b5cf6'
        };

        // Font settings
        this.fonts = {
            matrix: '16px "Fira Code", monospace',
            matrixLarge: '20px "Fira Code", monospace',
            label: '12px "Inter", sans-serif',
            symbol: '24px "Inter", sans-serif',
            bits: '14px "Fira Code", monospace'
        };

        // Animation state
        this.animationStep = 0;
        this.totalSteps = 0;
        this.currentData = null;
        this.animationFrame = null;

        // Layout settings
        this.cellSize = 40;
        this.cellPadding = 8;
        this.bracketWidth = 8;
        this.matrixGap = 60;

        this.setupResize();
    }

    setupResize() {
        const observer = new ResizeObserver(() => this.resize());
        observer.observe(this.canvas.parentElement);
        this.resize();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;

        // Adjust cell size based on canvas size
        this.cellSize = Math.min(40, Math.max(28, this.width / 20));

        this.render();
    }

    // ========================================
    // Core Rendering Methods
    // ========================================

    clear() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    render() {
        this.clear();

        if (!this.currentData) {
            this.renderPlaceholder();
            return;
        }

        if (this.currentData.isPointwise) {
            this.renderPointwiseOperation();
        } else if (this.currentData.isComposed) {
            this.renderComposedOperation();
        } else if (this.currentData.steps) {
            this.renderMultiStepOperation();
        } else if (this.currentData.isAffine) {
            this.renderAffineOperation();
        } else {
            this.renderMatrixMultiplication();
        }
    }

    renderPlaceholder() {
        this.ctx.fillStyle = this.colors.textMuted;
        this.ctx.font = this.fonts.label;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Select an operator to visualize', this.width / 2, this.height / 2);
    }

    // ========================================
    // Matrix Multiplication Rendering
    // ========================================

    renderMatrixMultiplication() {
        const { matrix, vector, result } = this.currentData;

        const rows = matrix.length;
        const cols = matrix[0].length;
        const vecRows = vector.length;

        // Calculate dimensions
        const matrixWidth = cols * this.cellSize + this.bracketWidth * 2;
        const matrixHeight = rows * this.cellSize;
        const vectorWidth = this.cellSize + this.bracketWidth * 2;
        const vectorHeight = vecRows * this.cellSize;
        const resultWidth = this.cellSize + this.bracketWidth * 2;
        const resultHeight = rows * this.cellSize;

        // Calculate total width and center position
        const totalWidth = matrixWidth + this.matrixGap + vectorWidth + this.matrixGap + resultWidth;
        const startX = (this.width - totalWidth) / 2;
        const centerY = this.height / 2;

        // Determine which row/col is active based on animation step
        const activeRow = this.animationStep > 0 ? Math.min(this.animationStep - 1, rows - 1) : -1;
        const showResult = this.animationStep > rows;

        // Draw matrix
        this.drawMatrix(matrix, startX, centerY - matrixHeight / 2, {
            highlightRow: activeRow,
            label: 'Matrix'
        });

        // Draw multiplication symbol
        const symbolX = startX + matrixWidth + this.matrixGap / 2;
        this.ctx.fillStyle = this.colors.operator;
        this.ctx.font = this.fonts.symbol;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('×', symbolX, centerY);

        // Draw vector
        const vectorX = startX + matrixWidth + this.matrixGap;
        this.drawVector(vector, vectorX, centerY - vectorHeight / 2, {
            highlightAll: activeRow >= 0,
            label: 'Vector'
        });

        // Draw equals symbol
        const equalsX = vectorX + vectorWidth + this.matrixGap / 2;
        this.ctx.fillStyle = this.colors.operator;
        this.ctx.font = this.fonts.symbol;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('=', equalsX, centerY);

        // Draw result
        const resultX = vectorX + vectorWidth + this.matrixGap;
        this.drawVector(result, resultX, centerY - resultHeight / 2, {
            highlightRow: activeRow,
            showUpTo: showResult ? rows : activeRow + 1,
            isResult: true,
            label: 'Result'
        });

        // Draw computation annotation
        if (activeRow >= 0 && activeRow < rows) {
            this.drawComputation(matrix[activeRow], vector, result[activeRow], centerY + matrixHeight / 2 + 40);
        }
    }

    drawMatrix(matrix, x, y, options = {}) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const width = cols * this.cellSize;
        const height = rows * this.cellSize;

        // Draw brackets
        this.drawBrackets(x, y, width + this.bracketWidth * 2, height);

        // Draw cells
        const contentX = x + this.bracketWidth;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cellX = contentX + c * this.cellSize + this.cellSize / 2;
                const cellY = y + r * this.cellSize + this.cellSize / 2;
                const value = matrix[r][c];

                const isHighlighted = options.highlightRow === r;
                this.drawCell(cellX, cellY, value, isHighlighted);
            }
        }

        // Draw label
        if (options.label) {
            this.ctx.fillStyle = this.colors.textMuted;
            this.ctx.font = this.fonts.label;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(options.label, x + (width + this.bracketWidth * 2) / 2, y - 15);
        }
    }

    drawVector(vector, x, y, options = {}) {
        const rows = vector.length;
        const width = this.cellSize;
        const height = rows * this.cellSize;

        // Draw brackets
        this.drawBrackets(x, y, width + this.bracketWidth * 2, height);

        // Draw cells
        const contentX = x + this.bracketWidth + this.cellSize / 2;
        for (let r = 0; r < rows; r++) {
            const cellY = y + r * this.cellSize + this.cellSize / 2;
            const value = vector[r][0];

            const showThisCell = options.showUpTo === undefined || r < options.showUpTo;
            const isHighlighted = options.highlightAll || options.highlightRow === r;

            if (showThisCell) {
                this.drawCell(contentX, cellY, value, isHighlighted, options.isResult);
            } else {
                this.drawCell(contentX, cellY, '?', false, false, true);
            }
        }

        // Draw label
        if (options.label) {
            this.ctx.fillStyle = this.colors.textMuted;
            this.ctx.font = this.fonts.label;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(options.label, x + (width + this.bracketWidth * 2) / 2, y - 15);
        }
    }

    drawBrackets(x, y, width, height) {
        this.ctx.strokeStyle = this.colors.bracket;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';

        const bw = this.bracketWidth;
        const padding = 4;

        // Left bracket
        this.ctx.beginPath();
        this.ctx.moveTo(x + bw, y - padding);
        this.ctx.lineTo(x + 2, y - padding);
        this.ctx.lineTo(x + 2, y + height + padding);
        this.ctx.lineTo(x + bw, y + height + padding);
        this.ctx.stroke();

        // Right bracket
        this.ctx.beginPath();
        this.ctx.moveTo(x + width - bw, y - padding);
        this.ctx.lineTo(x + width - 2, y - padding);
        this.ctx.lineTo(x + width - 2, y + height + padding);
        this.ctx.lineTo(x + width - bw, y + height + padding);
        this.ctx.stroke();
    }

    drawCell(x, y, value, isHighlighted = false, isResult = false, isPlaceholder = false) {
        const radius = this.cellSize / 2 - 4;

        // Draw highlight glow
        if (isHighlighted && !isPlaceholder) {
            this.ctx.shadowColor = this.colors.active;
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // Draw result glow
        if (isResult && !isPlaceholder) {
            this.ctx.shadowColor = this.colors.positive;
            this.ctx.shadowBlur = 10;
        }

        // Determine color based on value
        let color = this.colors.text;
        if (isPlaceholder) {
            color = this.colors.textMuted;
        } else if (typeof value === 'number') {
            if (value > 0) color = this.colors.positive;
            else if (value < 0) color = this.colors.negative;
            else color = this.colors.textMuted;
        }

        // Draw value
        this.ctx.fillStyle = color;
        this.ctx.font = this.fonts.matrix;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        let displayValue = value;
        if (typeof value === 'number') {
            displayValue = OperatorEngine.formatNumber(value, 2);
        }

        this.ctx.fillText(displayValue, x, y);
        this.ctx.shadowBlur = 0;
    }

    drawComputation(row, vector, result, y) {
        const parts = [];
        for (let i = 0; i < row.length; i++) {
            const coef = row[i];
            const val = vector[i][0];
            const product = coef * val;

            if (i > 0) parts.push(' + ');
            parts.push(`(${OperatorEngine.formatNumber(coef)} × ${OperatorEngine.formatNumber(val)})`);
        }
        parts.push(` = ${OperatorEngine.formatNumber(result[0])}`);

        const text = parts.join('');

        this.ctx.fillStyle = this.colors.highlight;
        this.ctx.font = this.fonts.label;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, this.width / 2, y);
    }

    // ========================================
    // Binary/Bitwise Rendering
    // ========================================

    renderPointwiseOperation() {
        const { aBits, bBits, resultBits, operation, bitWidth } = this.currentData;

        const bitSize = Math.min(32, (this.width - 200) / bitWidth);
        const gapY = 50;
        const startY = this.height / 2 - gapY * 1.5;

        // Draw header
        this.ctx.fillStyle = this.colors.textMuted;
        this.ctx.font = this.fonts.label;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Pointwise ${operation} (GF(2) Multiplication - NOT Linear)`, this.width / 2, startY - 40);

        // Draw bit rows
        const startX = (this.width - bitWidth * bitSize) / 2;

        this.drawBitRow(aBits, startX, startY, bitSize, 'a', this.colors.active);
        this.drawOperatorRow(operation, startX, startY + gapY, bitSize, bitWidth);
        this.drawBitRow(bBits, startX, startY + gapY * 1.3, bitSize, 'b', this.colors.highlight);

        // Equals line
        this.ctx.strokeStyle = this.colors.bracket;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY + gapY * 2.2);
        this.ctx.lineTo(startX + bitWidth * bitSize, startY + gapY * 2.2);
        this.ctx.stroke();

        this.drawBitRow(resultBits, startX, startY + gapY * 2.6, bitSize, 'result', this.colors.positive);
    }

    renderComposedOperation() {
        const { aBits, bBits, xorBits, andBits, resultBits, bitWidth, steps } = this.currentData;

        const bitSize = Math.min(28, (this.width - 250) / bitWidth);
        const gapY = 36;
        const startY = 60;

        // Draw header
        this.ctx.fillStyle = this.colors.textMuted;
        this.ctx.font = this.fonts.label;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('OR = (a XOR b) XOR (a AND b) — Composed Operations', this.width / 2, 30);

        const startX = (this.width - bitWidth * bitSize) / 2;
        let currentY = startY;

        // Input rows
        this.drawBitRow(aBits, startX, currentY, bitSize, 'a', this.colors.active);
        currentY += gapY;
        this.drawBitRow(bBits, startX, currentY, bitSize, 'b', this.colors.highlight);
        currentY += gapY * 1.2;

        // Step 1: XOR
        this.ctx.fillStyle = this.colors.positive;
        this.ctx.font = this.fonts.label;
        this.ctx.textAlign = 'left';
        this.ctx.fillText('① a XOR b (linear)', startX - 80, currentY + bitSize / 2);
        this.drawBitRow(xorBits, startX, currentY, bitSize, '', this.colors.positive);
        currentY += gapY;

        // Step 2: AND
        this.ctx.fillStyle = this.colors.warning;
        this.ctx.fillText('② a AND b (nonlinear)', startX - 80, currentY + bitSize / 2);
        this.drawBitRow(andBits, startX, currentY, bitSize, '', this.colors.warning);
        currentY += gapY * 1.2;

        // Step 3: XOR again
        this.ctx.strokeStyle = this.colors.bracket;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, currentY - 10);
        this.ctx.lineTo(startX + bitWidth * bitSize, currentY - 10);
        this.ctx.stroke();

        this.ctx.fillStyle = this.colors.accent;
        this.ctx.fillText('③ ① XOR ② = result', startX - 80, currentY + bitSize / 2 + 10);
        this.drawBitRow(resultBits, startX, currentY + 10, bitSize, 'a|b', this.colors.accent);
    }

    drawBitRow(bits, x, y, size, label, color) {
        const reversed = [...bits].reverse();

        for (let i = 0; i < reversed.length; i++) {
            const bitX = x + i * size + size / 2;
            const bitY = y + size / 2;
            const value = reversed[i];

            // Draw cell background
            this.ctx.fillStyle = value === 1 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(64, 64, 80, 0.3)';
            this.ctx.beginPath();
            this.ctx.roundRect(x + i * size + 2, y + 2, size - 4, size - 4, 4);
            this.ctx.fill();

            // Draw value
            this.ctx.fillStyle = value === 1 ? color : this.colors.textMuted;
            this.ctx.font = this.fonts.bits;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(value.toString(), bitX, bitY);
        }

        // Draw label
        if (label) {
            this.ctx.fillStyle = color;
            this.ctx.font = this.fonts.label;
            this.ctx.textAlign = 'right';
            this.ctx.fillText(label, x - 10, y + size / 2);
        }

        // Draw bit position labels (for first row only)
        if (label === 'a') {
            this.ctx.fillStyle = this.colors.textMuted;
            this.ctx.font = '10px "Fira Code", monospace';
            this.ctx.textAlign = 'center';
            for (let i = 0; i < reversed.length; i++) {
                const bitX = x + i * size + size / 2;
                this.ctx.fillText((reversed.length - 1 - i).toString(), bitX, y - 8);
            }
        }
    }

    drawOperatorRow(op, x, y, size, count) {
        this.ctx.fillStyle = this.colors.operator;
        this.ctx.font = this.fonts.bits;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let i = 0; i < count; i++) {
            const opX = x + i * size + size / 2;
            this.ctx.fillText(op, opX, y);
        }
    }

    // ========================================
    // Affine Transformation Rendering
    // ========================================

    renderAffineOperation() {
        const { matrix, vector, result, constant, bitWidth } = this.currentData;

        // Simplified rendering showing the affine form
        const bitSize = Math.min(32, (this.width - 300) / bitWidth);
        const gapY = 45;
        const startY = this.height / 2 - gapY * 2;

        this.ctx.fillStyle = this.colors.textMuted;
        this.ctx.font = this.fonts.label;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NOT is Affine: ~a = I×a + 1 (mod 2)', this.width / 2, startY - 40);

        const startX = (this.width - bitWidth * bitSize) / 2;

        // Draw input
        const inputBits = vector.map(v => v[0]);
        this.drawBitRow(inputBits, startX, startY, bitSize, 'a', this.colors.active);

        // Draw XOR 1
        this.ctx.fillStyle = this.colors.operator;
        this.ctx.font = this.fonts.label;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('XOR 1 (each bit)', this.width / 2, startY + gapY);

        // Draw constant
        this.drawBitRow(constant, startX, startY + gapY + 15, bitSize, '+1', this.colors.highlight);

        // Draw result
        const resultBits = result.map(r => r[0]);

        this.ctx.strokeStyle = this.colors.bracket;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY + gapY * 2.5);
        this.ctx.lineTo(startX + bitWidth * bitSize, startY + gapY * 2.5);
        this.ctx.stroke();

        this.drawBitRow(resultBits, startX, startY + gapY * 2.8, bitSize, '~a', this.colors.positive);
    }

    // ========================================
    // Multi-step Operation Rendering (Log transforms)
    // ========================================

    renderMultiStepOperation() {
        const { steps, actualResult } = this.currentData;

        const stepHeight = 80;
        const startY = (this.height - steps.length * stepHeight) / 2;

        steps.forEach((step, index) => {
            const y = startY + index * stepHeight;
            const isActive = this.animationStep > index;
            const isCurrent = this.animationStep === index + 1;

            // Draw step number
            this.ctx.fillStyle = isCurrent ? this.colors.accent : (isActive ? this.colors.positive : this.colors.textMuted);
            this.ctx.font = 'bold 14px "Inter", sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Step ${index + 1}:`, 40, y + 20);

            // Draw step name
            this.ctx.font = this.fonts.label;
            this.ctx.fillText(step.name, 100, y + 20);

            // Draw value if active
            if (isActive) {
                this.ctx.fillStyle = this.colors.positive;
                this.ctx.font = 'bold 16px "Fira Code", monospace';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`= ${OperatorEngine.formatNumber(step.value, 6)}`, 100, y + 45);
            }

            // Draw mini matrix if available
            if (step.matrix && isCurrent) {
                this.drawMiniMatrix(step, this.width - 200, y);
            }
        });

        // Draw final result
        if (this.animationStep > steps.length) {
            const y = startY + steps.length * stepHeight + 20;
            this.ctx.fillStyle = this.colors.highlight;
            this.ctx.font = 'bold 20px "Fira Code", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Final Result: ${OperatorEngine.formatNumber(actualResult, 6)}`, this.width / 2, y);
        }
    }

    drawMiniMatrix(step, x, y) {
        const { matrix, vector, result } = step;
        const size = 24;

        // Draw matrix
        this.ctx.font = '12px "Fira Code", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.ctx.fillStyle = this.colors.text;
        this.ctx.fillText(`[${matrix[0].join(' ')}]`, x, y + 20);

        this.ctx.fillStyle = this.colors.operator;
        this.ctx.fillText('×', x + 50, y + 20);

        this.ctx.fillStyle = this.colors.active;
        const vecStr = vector.map(v => OperatorEngine.formatNumber(v[0], 2)).join(', ');
        this.ctx.fillText(`[${vecStr}]`, x + 100, y + 20);
    }

    // ========================================
    // Animation Control
    // ========================================

    setData(data) {
        this.currentData = data;
        this.animationStep = 0;

        // Calculate total steps
        if (data) {
            if (data.steps) {
                this.totalSteps = data.steps.length + 1;
            } else if (data.matrix) {
                this.totalSteps = data.matrix.length + 1;
            } else if (data.isPointwise || data.isComposed) {
                this.totalSteps = 1;
            } else {
                this.totalSteps = 1;
            }
        } else {
            this.totalSteps = 0;
        }

        this.render();
        return this.totalSteps;
    }

    setStep(step) {
        this.animationStep = Math.max(0, Math.min(step, this.totalSteps));
        this.render();
    }

    nextStep() {
        if (this.animationStep < this.totalSteps) {
            this.animationStep++;
            this.render();
        }
        return this.animationStep;
    }

    prevStep() {
        if (this.animationStep > 0) {
            this.animationStep--;
            this.render();
        }
        return this.animationStep;
    }

    reset() {
        this.animationStep = 0;
        this.render();
    }

    complete() {
        this.animationStep = this.totalSteps;
        this.render();
    }

    getStep() {
        return this.animationStep;
    }

    getTotalSteps() {
        return this.totalSteps;
    }
}

// Export
window.MatrixVisualizer = MatrixVisualizer;
