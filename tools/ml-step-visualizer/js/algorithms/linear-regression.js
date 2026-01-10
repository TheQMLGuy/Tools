/**
 * Linear Regression Algorithm with Gradient Descent Steps
 * Shows weight updates, loss calculations, and line fitting
 */

class LinearRegressionAlgorithm {
    constructor() {
        this.name = 'Linear Regression';
        this.dataset = null;
        this.params = {
            learning_rate: 0.01,
            n_iterations: 100,
            fit_intercept: true
        };

        // Model weights
        this.weight = 0;  // m (slope)
        this.bias = 0;    // b (intercept)

        this.steps = [];
        this.currentStep = 0;
        this.history = [];

        this.colors = {
            point: '#6366f1',
            line: '#10b981',
            residual: '#ef4444'
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
        this.weight = 0;
        this.bias = 0;
        this.steps = [];
        this.currentStep = 0;
        this.history = [];
    }

    /**
     * Update parameters
     */
    setParams(params) {
        this.params = { ...this.params, ...params };
    }

    /**
     * Get data as x, y arrays
     */
    getData() {
        if (this.dataset.getSimpleData) {
            const simple = this.dataset.getSimpleData();
            return {
                x: simple.map(d => d.x),
                y: simple.map(d => d.y)
            };
        }

        // Default: use first feature
        const feature = this.dataset.features[0];
        return {
            x: this.dataset.data.map(d => d[feature]),
            y: this.dataset.data.map(d => d[this.dataset.target])
        };
    }

    /**
     * Generate all steps
     */
    generateSteps() {
        this.steps = [];

        const { x, y } = this.getData();

        // Step 1: Overview
        this.addStep({
            title: 'Analyze Dataset',
            type: 'overview',
            content: this.createOverviewStep(x, y),
            modelState: { weight: 0, bias: 0 },
            history: []
        });

        // Step 2: Initialize weights
        this.weight = 0;
        this.bias = 0;
        this.history = [];

        this.addStep({
            title: 'Initialize Weights',
            type: 'init',
            content: this.createInitStep(),
            modelState: { weight: this.weight, bias: this.bias },
            history: [...this.history]
        });

        // Calculate initial loss
        const initialLoss = this.calculateMSE(x, y);
        this.history.push({ epoch: 0, loss: initialLoss, weight: this.weight, bias: this.bias });

        this.addStep({
            title: 'Calculate Initial Loss',
            type: 'loss',
            content: this.createLossStep(x, y, 0),
            modelState: { weight: this.weight, bias: this.bias },
            history: [...this.history]
        });

        // Normalize data for better convergence
        const { xNorm, xMean, xStd, yMean, yStd } = this.normalizeData(x, y);

        // Gradient descent steps
        const stepInterval = Math.max(1, Math.floor(this.params.n_iterations / 20));

        for (let i = 1; i <= this.params.n_iterations; i++) {
            // Calculate gradients
            const { dw, db } = this.calculateGradients(x, y);

            // Update weights
            const oldWeight = this.weight;
            const oldBias = this.bias;

            this.weight -= this.params.learning_rate * dw;
            this.bias -= this.params.learning_rate * db;

            // Calculate new loss
            const loss = this.calculateMSE(x, y);
            this.history.push({ epoch: i, loss, weight: this.weight, bias: this.bias });

            // Add step at intervals
            if (i <= 5 || i % stepInterval === 0 || i === this.params.n_iterations) {
                this.addStep({
                    title: `Iteration ${i}`,
                    type: 'gradient',
                    content: this.createGradientStep(i, dw, db, oldWeight, oldBias, loss),
                    modelState: { weight: this.weight, bias: this.bias },
                    history: [...this.history]
                });
            }
        }

        // Final step
        const r2 = this.calculateR2(x, y);
        this.addStep({
            title: 'Training Complete',
            type: 'complete',
            content: this.createCompleteStep(x, y, r2),
            modelState: { weight: this.weight, bias: this.bias },
            history: [...this.history]
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
     * Normalize data
     */
    normalizeData(x, y) {
        const xMean = x.reduce((a, b) => a + b, 0) / x.length;
        const yMean = y.reduce((a, b) => a + b, 0) / y.length;

        const xStd = Math.sqrt(x.reduce((sum, val) => sum + Math.pow(val - xMean, 2), 0) / x.length) || 1;
        const yStd = Math.sqrt(y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0) / y.length) || 1;

        const xNorm = x.map(v => (v - xMean) / xStd);
        const yNorm = y.map(v => (v - yMean) / yStd);

        return { xNorm, yNorm, xMean, xStd, yMean, yStd };
    }

    /**
     * Create overview step
     */
    createOverviewStep(x, y) {
        const xStats = this.getStats(x);
        const yStats = this.getStats(y);

        let html = `
            <p>Dataset: <strong>${this.dataset.name}</strong></p>
            <p>Samples: <strong>${x.length}</strong></p>
            <p>Goal: Learn <code>y = wx + b</code></p>
            <div class="calc-equation">
                \\hat{y} = w \\cdot x + b
            </div>
            <div class="feature-comparison">
                <div class="feature-card">
                    <div class="feature-name">X (Feature)</div>
                    <div class="feature-value">μ=${xStats.mean.toFixed(0)}, σ=${xStats.std.toFixed(0)}</div>
                </div>
                <div class="feature-card">
                    <div class="feature-name">Y (Target)</div>
                    <div class="feature-value">μ=${yStats.mean.toFixed(0)}, σ=${yStats.std.toFixed(0)}</div>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Create init step
     */
    createInitStep() {
        let html = `
            <p>Initialize weights to zero:</p>
            <div class="feature-comparison">
                <div class="feature-card">
                    <div class="feature-name">Weight (w)</div>
                    <div class="feature-value">0</div>
                </div>
                <div class="feature-card">
                    <div class="feature-name">Bias (b)</div>
                    <div class="feature-value">0</div>
                </div>
            </div>
            <p class="calc-step-content">Learning Rate (α): ${this.params.learning_rate}</p>
            <p class="calc-step-content">Iterations: ${this.params.n_iterations}</p>
        `;

        return html;
    }

    /**
     * Create loss step
     */
    createLossStep(x, y, epoch) {
        const mse = this.calculateMSE(x, y);
        const n = x.length;

        let html = `
            <p>Epoch ${epoch}: Calculate Mean Squared Error</p>
            <div class="calc-equation">
                MSE = \\frac{1}{n} \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2
            </div>
            <p class="calc-step-content">For each sample, calculate: (actual - predicted)²</p>
            <p class="calc-step-content">Then take the mean of all squared errors</p>
            <div class="calc-result">
                <span class="calc-result-label">MSE Loss</span>
                <span class="calc-result-value">${mse.toFixed(4)}</span>
            </div>
        `;

        return html;
    }

    /**
     * Create gradient step
     */
    createGradientStep(epoch, dw, db, oldW, oldB, loss) {
        let html = `
            <p>Epoch ${epoch}: Update weights using gradients</p>
            <div class="calc-equation">
                w_{new} = w_{old} - \\alpha \\cdot \\frac{\\partial L}{\\partial w}
            </div>
            <div class="calc-equation">
                b_{new} = b_{old} - \\alpha \\cdot \\frac{\\partial L}{\\partial b}
            </div>
            <div class="feature-comparison">
                <div class="feature-card">
                    <div class="feature-name">∂L/∂w</div>
                    <div class="feature-value">${dw.toFixed(4)}</div>
                </div>
                <div class="feature-card">
                    <div class="feature-name">∂L/∂b</div>
                    <div class="feature-value">${db.toFixed(4)}</div>
                </div>
            </div>
            <div class="feature-comparison">
                <div class="feature-card">
                    <div class="feature-name">w</div>
                    <div class="feature-value">${oldW.toFixed(4)} → ${this.weight.toFixed(4)}</div>
                </div>
                <div class="feature-card">
                    <div class="feature-name">b</div>
                    <div class="feature-value">${oldB.toFixed(2)} → ${this.bias.toFixed(2)}</div>
                </div>
            </div>
            <div class="calc-result">
                <span class="calc-result-label">MSE Loss</span>
                <span class="calc-result-value">${loss.toFixed(4)}</span>
            </div>
        `;

        return html;
    }

    /**
     * Create complete step
     */
    createCompleteStep(x, y, r2) {
        const mse = this.calculateMSE(x, y);
        const rmse = Math.sqrt(mse);

        let html = `
            <p>Training complete!</p>
            <div class="calc-equation">
                y = ${this.weight.toFixed(4)}x + ${this.bias.toFixed(2)}
            </div>
            <div class="feature-comparison">
                <div class="feature-card">
                    <div class="feature-name">Weight (w)</div>
                    <div class="feature-value">${this.weight.toFixed(4)}</div>
                </div>
                <div class="feature-card">
                    <div class="feature-name">Bias (b)</div>
                    <div class="feature-value">${this.bias.toFixed(2)}</div>
                </div>
            </div>
            <div class="feature-comparison">
                <div class="feature-card">
                    <div class="feature-name">MSE</div>
                    <div class="feature-value">${mse.toFixed(2)}</div>
                </div>
                <div class="feature-card">
                    <div class="feature-name">RMSE</div>
                    <div class="feature-value">${rmse.toFixed(2)}</div>
                </div>
            </div>
            <div class="calc-result">
                <span class="calc-result-label">R² Score</span>
                <span class="calc-result-value">${(r2 * 100).toFixed(1)}%</span>
            </div>
        `;

        return html;
    }

    /**
     * Calculate gradients
     */
    calculateGradients(x, y) {
        const n = x.length;
        let dw = 0;
        let db = 0;

        for (let i = 0; i < n; i++) {
            const pred = this.weight * x[i] + this.bias;
            const error = pred - y[i];
            dw += error * x[i];
            db += error;
        }

        dw = (2 / n) * dw;
        db = (2 / n) * db;

        return { dw, db };
    }

    /**
     * Calculate MSE
     */
    calculateMSE(x, y) {
        const n = x.length;
        let sum = 0;

        for (let i = 0; i < n; i++) {
            const pred = this.weight * x[i] + this.bias;
            sum += Math.pow(y[i] - pred, 2);
        }

        return sum / n;
    }

    /**
     * Calculate R² score
     */
    calculateR2(x, y) {
        const n = x.length;
        const yMean = y.reduce((a, b) => a + b, 0) / n;

        let ssRes = 0;  // Residual sum of squares
        let ssTot = 0;  // Total sum of squares

        for (let i = 0; i < n; i++) {
            const pred = this.weight * x[i] + this.bias;
            ssRes += Math.pow(y[i] - pred, 2);
            ssTot += Math.pow(y[i] - yMean, 2);
        }

        return 1 - (ssRes / ssTot);
    }

    /**
     * Get statistics
     */
    getStats(arr) {
        const n = arr.length;
        const mean = arr.reduce((a, b) => a + b, 0) / n;
        const std = Math.sqrt(arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n);
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        return { mean, std, min, max };
    }

    /**
     * Render visualization
     */
    renderVisualization(ctx, width, height, stepData = null) {
        const { x, y } = this.getData();
        const modelState = stepData?.modelState || { weight: this.weight, bias: this.bias };
        const history = stepData?.history || this.history;

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        // Calculate padding and scales
        const padding = { top: 40, right: 40, bottom: 60, left: 70 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;

        const xMin = Math.min(...x) * 0.9;
        const xMax = Math.max(...x) * 1.1;
        const yMin = Math.min(...y) * 0.9;
        const yMax = Math.max(...y) * 1.1;

        const scaleX = (val) => padding.left + ((val - xMin) / (xMax - xMin)) * plotWidth;
        const scaleY = (val) => height - padding.bottom - ((val - yMin) / (yMax - yMin)) * plotHeight;

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Vertical grid
        for (let i = 0; i <= 5; i++) {
            const xVal = xMin + (i / 5) * (xMax - xMin);
            const px = scaleX(xVal);
            ctx.beginPath();
            ctx.moveTo(px, padding.top);
            ctx.lineTo(px, height - padding.bottom);
            ctx.stroke();

            ctx.fillStyle = '#606070';
            ctx.font = '10px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText(xVal.toFixed(0), px, height - padding.bottom + 15);
        }

        // Horizontal grid
        for (let i = 0; i <= 5; i++) {
            const yVal = yMin + (i / 5) * (yMax - yMin);
            const py = scaleY(yVal);
            ctx.beginPath();
            ctx.moveTo(padding.left, py);
            ctx.lineTo(width - padding.right, py);
            ctx.stroke();

            ctx.textAlign = 'right';
            ctx.fillText(yVal.toFixed(0), padding.left - 5, py + 3);
        }

        // Draw data points
        x.forEach((xi, i) => {
            const px = scaleX(xi);
            const py = scaleY(y[i]);

            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fillStyle = this.colors.point;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Draw regression line
        if (modelState.weight !== 0 || modelState.bias !== 0 || history.length > 1) {
            const y1 = modelState.weight * xMin + modelState.bias;
            const y2 = modelState.weight * xMax + modelState.bias;

            ctx.beginPath();
            ctx.moveTo(scaleX(xMin), scaleY(y1));
            ctx.lineTo(scaleX(xMax), scaleY(y2));
            ctx.strokeStyle = this.colors.line;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw line equation
            ctx.fillStyle = this.colors.line;
            ctx.font = '12px JetBrains Mono';
            ctx.textAlign = 'right';
            ctx.fillText(
                `y = ${modelState.weight.toFixed(3)}x + ${modelState.bias.toFixed(1)}`,
                width - padding.right,
                padding.top - 10
            );
        }

        // Draw title
        ctx.fillStyle = '#fff';
        ctx.font = '14px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('Data & Regression Line', padding.left, 25);
    }

    /**
     * Render loss chart
     */
    renderLossChart(ctx, width, height, history) {
        if (!history || history.length < 2) return;

        ctx.fillStyle = '#12121a';
        ctx.fillRect(0, 0, width, height);

        const padding = { top: 30, right: 20, bottom: 40, left: 50 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;

        const losses = history.map(h => h.loss);
        const maxLoss = Math.max(...losses);
        const minLoss = Math.min(...losses);
        const lossRange = maxLoss - minLoss || 1;

        // Scale functions
        const scaleX = (i) => padding.left + (i / (history.length - 1)) * plotWidth;
        const scaleY = (loss) => padding.top + plotHeight - ((loss - minLoss) / lossRange) * plotHeight;

        // Draw loss curve
        ctx.beginPath();
        ctx.moveTo(scaleX(0), scaleY(losses[0]));

        for (let i = 1; i < history.length; i++) {
            ctx.lineTo(scaleX(i), scaleY(losses[i]));
        }

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw current point
        const lastIdx = history.length - 1;
        ctx.beginPath();
        ctx.arc(scaleX(lastIdx), scaleY(losses[lastIdx]), 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // Labels
        ctx.fillStyle = '#606070';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Epoch', width / 2, height - 5);

        ctx.save();
        ctx.translate(12, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Loss', 0, 0);
        ctx.restore();
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
    module.exports = LinearRegressionAlgorithm;
}
