/**
 * ML Step-by-Step Visualizer - Main Application
 * Controls algorithm selection, step navigation, and panel coordination
 */

class MLVisualizerApp {
    constructor() {
        // Components
        this.dataTable = null;
        this.hyperparamPanel = null;
        this.currentAlgorithm = null;

        // State
        this.currentStep = 0;
        this.isAutoRunning = false;
        this.autoRunInterval = null;

        // Algorithms registry
        this.algorithms = {
            'decision-tree': new DecisionTreeAlgorithm(),
            'linear-regression': new LinearRegressionAlgorithm(),
            // Stub algorithms will be added
        };

        // Datasets registry
        this.datasets = {
            'tennis': TennisDataset,
            'iris': IrisDataset,
            'housing': HousingDataset
        };

        // Canvas contexts
        this.vizCtx = null;
        this.vizCanvas = null;

        // Initialize
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        // Initialize components
        this.dataTable = new DataTable('data-table');
        this.hyperparamPanel = new HyperparamPanel('params-container');

        // Setup canvas
        this.vizCanvas = document.getElementById('viz-canvas');
        this.vizCtx = this.vizCanvas.getContext('2d');
        this.resizeCanvas();

        // Setup event listeners
        this.setupEventListeners();

        // Load default algorithm and dataset
        this.loadAlgorithm('decision-tree');
        this.loadDataset('tennis');

        // Initial render
        this.render();

        // Handle resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Algorithm selector
        document.getElementById('algorithm-select').addEventListener('change', (e) => {
            this.loadAlgorithm(e.target.value);
        });

        // Dataset selector
        document.getElementById('dataset-select').addEventListener('change', (e) => {
            this.loadDataset(e.target.value);
        });

        // Step button
        document.getElementById('step-btn').addEventListener('click', () => {
            this.step();
        });

        // Auto run button
        document.getElementById('auto-btn').addEventListener('click', () => {
            this.toggleAutoRun();
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.reset();
        });

        // Hyperparameter changes
        this.hyperparamPanel.onChange((key, value, allValues) => {
            if (this.currentAlgorithm) {
                this.currentAlgorithm.setParams({ [key]: value });
            }
        });

        // Apply params button
        document.getElementById('apply-params-btn').addEventListener('click', () => {
            this.applyParams();
        });

        // Zoom controls
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
            // Zoom functionality
        });

        document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
            // Zoom functionality
        });

        // Fullscreen
        document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
            this.toggleFullscreen();
        });
    }

    /**
     * Load algorithm
     */
    loadAlgorithm(algorithmKey) {
        // Stop any running animation
        this.stopAutoRun();

        // Get algorithm instance
        this.currentAlgorithm = this.algorithms[algorithmKey];

        if (!this.currentAlgorithm) {
            // Create stub for unimplemented algorithms
            this.currentAlgorithm = this.createStubAlgorithm(algorithmKey);
        }

        // Load hyperparameters
        this.hyperparamPanel.load(algorithmKey);

        // Update dataset options based on algorithm
        this.updateDatasetOptions(algorithmKey);

        // Reinitialize with current dataset
        this.initAlgorithm();
    }

    /**
     * Load dataset
     */
    loadDataset(datasetKey) {
        const dataset = this.datasets[datasetKey];

        if (!dataset) return;

        // Load into data table
        this.dataTable.load(dataset);

        // Reinitialize algorithm
        this.initAlgorithm();
    }

    /**
     * Initialize algorithm with current dataset
     */
    initAlgorithm() {
        if (!this.currentAlgorithm || !this.dataTable.dataset) return;

        this.currentStep = 0;
        this.currentAlgorithm.init(this.dataTable.dataset);

        // Update step counter
        this.updateStepCounter();

        // Clear calculations panel
        this.clearCalculations();

        // Update visualization
        this.render();
    }

    /**
     * Apply hyperparameters and reinitialize
     */
    applyParams() {
        if (!this.currentAlgorithm) return;

        const params = this.hyperparamPanel.getValues();
        this.currentAlgorithm.setParams(params);

        // Reinitialize
        this.initAlgorithm();
    }

    /**
     * Step forward
     */
    step() {
        if (!this.currentAlgorithm) return;

        const stepCount = this.currentAlgorithm.getStepCount();

        if (this.currentStep >= stepCount) {
            this.stopAutoRun();
            return;
        }

        const step = this.currentAlgorithm.getStep(this.currentStep);

        // Display step
        this.displayStep(step);

        // Handle table highlighting
        if (step.highlightRows) {
            this.dataTable.highlightRows(step.highlightRows);
        }
        if (step.highlightFeature) {
            this.dataTable.highlightColumn(step.highlightFeature);
        }

        // Update visualization
        this.renderVisualization(step);

        // Advance step
        this.currentStep++;
        this.updateStepCounter();
    }

    /**
     * Display a calculation step
     */
    displayStep(step) {
        const container = document.getElementById('calc-steps');

        // Create step element
        const stepDiv = document.createElement('div');
        stepDiv.className = 'calc-step active';
        stepDiv.innerHTML = `
            <div class="calc-step-header">
                <span class="calc-step-number">${step.stepNumber}</span>
                <span class="calc-step-title">${step.title}</span>
            </div>
            <div class="calc-step-content">
                ${step.content}
            </div>
        `;

        // Mark previous steps as completed
        const existingSteps = container.querySelectorAll('.calc-step');
        existingSteps.forEach(s => {
            s.classList.remove('active');
            s.classList.add('completed');
        });

        // Remove placeholder if exists
        const placeholder = container.querySelector('.calc-placeholder');
        if (placeholder) placeholder.remove();

        // Add new step
        container.appendChild(stepDiv);

        // Scroll to new step
        stepDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });

        // Render math equations with KaTeX
        this.renderMath(stepDiv);
    }

    /**
     * Render math with KaTeX
     */
    renderMath(container) {
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(container, {
                delimiters: [
                    { left: '\\[', right: '\\]', display: true },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '$', right: '$', display: false }
                ],
                throwOnError: false
            });
        }
    }

    /**
     * Render visualization based on step
     */
    renderVisualization(step) {
        if (!this.currentAlgorithm || !this.vizCtx) return;

        const width = this.vizCanvas.width;
        const height = this.vizCanvas.height;

        // Decision Tree specific
        if (this.currentAlgorithm instanceof DecisionTreeAlgorithm) {
            this.currentAlgorithm.renderTree(this.vizCtx, width, height, step.treeState);
        }
        // Linear Regression specific
        else if (this.currentAlgorithm instanceof LinearRegressionAlgorithm) {
            this.currentAlgorithm.renderVisualization(this.vizCtx, width, height, step);
        }
        // Generic fallback
        else {
            this.renderGenericVisualization(step);
        }

        // Update stats
        this.updateVizStats(step);
    }

    /**
     * Generic render fallback
     */
    renderGenericVisualization(step) {
        const ctx = this.vizCtx;
        const w = this.vizCanvas.width;
        const h = this.vizCanvas.height;

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#606070';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Visualization for this algorithm', w / 2, h / 2 - 10);
        ctx.fillText('coming soon...', w / 2, h / 2 + 10);
    }

    /**
     * Update viz stats at bottom
     */
    updateVizStats(step) {
        const stat1 = document.getElementById('viz-stat-1');
        const stat2 = document.getElementById('viz-stat-2');
        const stat3 = document.getElementById('viz-stat-3');

        if (this.currentAlgorithm instanceof DecisionTreeAlgorithm && step.treeState) {
            const stats = this.currentAlgorithm.getTreeStats(step.treeState);
            if (stat1) stat1.innerHTML = `Nodes: <strong>${stats.totalNodes}</strong>`;
            if (stat2) stat2.innerHTML = `Leaves: <strong>${stats.leafNodes}</strong>`;
            if (stat3) stat3.innerHTML = `Depth: <strong>${stats.maxDepth}</strong>`;
        } else if (this.currentAlgorithm instanceof LinearRegressionAlgorithm && step.history) {
            const last = step.history[step.history.length - 1];
            if (last) {
                if (stat1) stat1.innerHTML = `Epoch: <strong>${last.epoch}</strong>`;
                if (stat2) stat2.innerHTML = `Loss: <strong>${last.loss.toFixed(2)}</strong>`;
                if (stat3) stat3.innerHTML = `w: <strong>${last.weight.toFixed(4)}</strong>`;
            }
        }
    }

    /**
     * Toggle auto run
     */
    toggleAutoRun() {
        if (this.isAutoRunning) {
            this.stopAutoRun();
        } else {
            this.startAutoRun();
        }
    }

    /**
     * Start auto run
     */
    startAutoRun() {
        this.isAutoRunning = true;

        const btn = document.getElementById('auto-btn');
        btn.textContent = '⏸ Pause';
        btn.classList.add('active');

        this.autoRunInterval = setInterval(() => {
            const stepCount = this.currentAlgorithm?.getStepCount() || 0;

            if (this.currentStep >= stepCount) {
                this.stopAutoRun();
                return;
            }

            this.step();
        }, 800);
    }

    /**
     * Stop auto run
     */
    stopAutoRun() {
        this.isAutoRunning = false;

        if (this.autoRunInterval) {
            clearInterval(this.autoRunInterval);
            this.autoRunInterval = null;
        }

        const btn = document.getElementById('auto-btn');
        btn.textContent = '▶ Auto Run';
        btn.classList.remove('active');
    }

    /**
     * Reset
     */
    reset() {
        this.stopAutoRun();
        this.currentStep = 0;

        // Clear calculations
        this.clearCalculations();

        // Clear highlights
        this.dataTable.clearHighlights();

        // Reinitialize algorithm
        this.initAlgorithm();

        // Update counter
        this.updateStepCounter();

        // Render
        this.render();
    }

    /**
     * Clear calculations panel
     */
    clearCalculations() {
        const container = document.getElementById('calc-steps');
        container.innerHTML = `
            <div class="calc-placeholder">
                <p>Select an algorithm and click <strong>Step</strong> to begin</p>
            </div>
        `;
    }

    /**
     * Update step counter
     */
    updateStepCounter() {
        const current = document.getElementById('current-step');
        const total = document.getElementById('total-steps');

        const totalSteps = this.currentAlgorithm?.getStepCount() || 0;

        if (current) current.textContent = this.currentStep;
        if (total) total.textContent = totalSteps;
    }

    /**
     * Update dataset options based on algorithm
     */
    updateDatasetOptions(algorithmKey) {
        const select = document.getElementById('dataset-select');

        // Enable/disable options based on algorithm type
        const options = select.querySelectorAll('option');

        options.forEach(opt => {
            const dataset = this.datasets[opt.value];
            if (!dataset) return;

            // Decision tree works with all
            // Linear regression needs numerical
            if (algorithmKey === 'linear-regression') {
                opt.disabled = dataset.type !== 'regression';
            } else {
                opt.disabled = false;
            }
        });

        // Select appropriate dataset
        if (algorithmKey === 'linear-regression') {
            select.value = 'housing';
            this.loadDataset('housing');
        } else if (select.value === 'housing') {
            select.value = 'tennis';
            this.loadDataset('tennis');
        }
    }

    /**
     * Create stub algorithm for unimplemented ones
     */
    createStubAlgorithm(key) {
        return {
            name: key,
            init: (dataset) => { },
            reset: () => { },
            setParams: (params) => { },
            getStepCount: () => 0,
            getStep: (index) => null,
            renderVisualization: (ctx, w, h) => {
                ctx.fillStyle = '#0a0a0f';
                ctx.fillRect(0, 0, w, h);
                ctx.fillStyle = '#606070';
                ctx.font = '14px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(`${key} visualization coming soon...`, w / 2, h / 2);
            }
        };
    }

    /**
     * Toggle fullscreen for viz panel
     */
    toggleFullscreen() {
        const panel = document.querySelector('.viz-panel');
        panel.classList.toggle('fullscreen');

        if (panel.classList.contains('fullscreen')) {
            setTimeout(() => {
                this.resizeCanvas();
                this.render();
            }, 100);
        } else {
            setTimeout(() => {
                this.resizeCanvas();
                this.render();
            }, 100);
        }
    }

    /**
     * Resize canvas
     */
    resizeCanvas() {
        if (!this.vizCanvas) return;

        const container = this.vizCanvas.parentElement;
        const rect = container.getBoundingClientRect();

        this.vizCanvas.width = rect.width;
        this.vizCanvas.height = rect.height;

        this.render();
    }

    /**
     * Main render
     */
    render() {
        if (!this.vizCtx) return;

        const width = this.vizCanvas.width;
        const height = this.vizCanvas.height;

        // Clear
        this.vizCtx.fillStyle = '#0a0a0f';
        this.vizCtx.fillRect(0, 0, width, height);

        // Render based on current algorithm
        if (this.currentAlgorithm) {
            if (this.currentAlgorithm instanceof DecisionTreeAlgorithm) {
                this.currentAlgorithm.renderTree(this.vizCtx, width, height);
            } else if (this.currentAlgorithm instanceof LinearRegressionAlgorithm) {
                this.currentAlgorithm.renderVisualization(this.vizCtx, width, height, null);
            } else if (this.currentAlgorithm.renderVisualization) {
                this.currentAlgorithm.renderVisualization(this.vizCtx, width, height);
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MLVisualizerApp();
});
