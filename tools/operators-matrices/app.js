/**
 * App Controller - Main Application Logic
 * Handles navigation, operator selection, parameter inputs, and animation control
 */

class App {
    constructor() {
        // State
        this.currentCategory = null;
        this.currentOperator = null;
        this.bitWidth = 8;
        this.animationSpeed = 1;
        this.isPlaying = false;
        this.animationInterval = null;

        // DOM elements
        this.landing = document.getElementById('landing');
        this.app = document.getElementById('app');
        this.operatorList = document.getElementById('operatorList');
        this.theoryContent = document.getElementById('theoryContent');
        this.inputParams = document.getElementById('inputParams');
        this.resultDisplay = document.getElementById('resultDisplay');
        this.equationDisplay = document.getElementById('equationDisplay');
        this.vizTitle = document.getElementById('vizTitle');
        this.fieldBadge = document.getElementById('fieldBadge');

        // Controls
        this.playBtn = document.getElementById('playBtn');
        this.playIcon = document.getElementById('playIcon');
        this.playText = document.getElementById('playText');
        this.resetBtn = document.getElementById('resetBtn');
        this.prevStepBtn = document.getElementById('prevStepBtn');
        this.nextStepBtn = document.getElementById('nextStepBtn');
        this.currentStepSpan = document.getElementById('currentStep');
        this.totalStepsSpan = document.getElementById('totalSteps');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');
        this.bitWidthSelect = document.getElementById('bitWidthSelect');
        this.backBtn = document.getElementById('backBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');

        // Initialize visualizer
        this.visualizer = new MatrixVisualizer('matrixCanvas');

        // Bind events
        this.initEvents();
    }

    initEvents() {
        // Category cards
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                this.selectCategory(category);
            });
        });

        // Back button
        this.backBtn.addEventListener('click', () => this.goToLanding());

        // Playback controls
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.prevStepBtn.addEventListener('click', () => this.prevStep());
        this.nextStepBtn.addEventListener('click', () => this.nextStep());

        // Settings
        this.speedSlider.addEventListener('input', (e) => {
            this.animationSpeed = parseFloat(e.target.value);
            this.speedValue.textContent = `${this.animationSpeed}×`;
        });

        this.bitWidthSelect.addEventListener('change', (e) => {
            this.bitWidth = parseInt(e.target.value);
            if (this.currentOperator) {
                this.updateVisualization();
            }
        });

        // Fullscreen
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.app.style.display === 'none') return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'ArrowRight':
                    this.nextStep();
                    break;
                case 'ArrowLeft':
                    this.prevStep();
                    break;
                case 'r':
                    this.reset();
                    break;
                case 'Escape':
                    if (this.isFullscreen) this.toggleFullscreen();
                    else this.goToLanding();
                    break;
            }
        });
    }

    // ========================================
    // Navigation
    // ========================================

    selectCategory(categoryId) {
        this.currentCategory = OperatorEngine.getCategory(categoryId);
        if (!this.currentCategory) return;

        // Switch to app view
        this.landing.style.display = 'none';
        this.app.style.display = 'grid';

        // Populate operator list
        this.populateOperatorList();

        // Update field badge
        this.fieldBadge.textContent = this.currentCategory.field;
        this.fieldBadge.style.display = 'inline-block';

        // Select first operator
        const operators = Object.values(this.currentCategory.operators);
        if (operators.length > 0) {
            this.selectOperator(operators[0].id);
        }

        // Trigger resize for canvas
        setTimeout(() => this.visualizer.resize(), 100);
    }

    goToLanding() {
        this.stop();
        this.currentCategory = null;
        this.currentOperator = null;
        this.app.style.display = 'none';
        this.landing.style.display = 'flex';
    }

    populateOperatorList() {
        this.operatorList.innerHTML = '';

        for (const op of Object.values(this.currentCategory.operators)) {
            const item = document.createElement('div');
            item.className = 'operator-item';
            item.dataset.id = op.id;

            item.innerHTML = `
                <div class="operator-symbol">${op.symbol}</div>
                <div class="operator-info">
                    <div class="operator-name">${op.name}</div>
                    <div class="operator-formula">${op.formula}</div>
                </div>
            `;

            item.addEventListener('click', () => this.selectOperator(op.id));
            this.operatorList.appendChild(item);
        }
    }

    selectOperator(operatorId) {
        this.stop();

        const op = OperatorEngine.getOperator(this.currentCategory.id, operatorId);
        if (!op) return;

        this.currentOperator = op;

        // Update active state
        this.operatorList.querySelectorAll('.operator-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === operatorId);
        });

        // Update title
        this.vizTitle.textContent = `${op.name} — Matrix Form`;

        // Update theory panel
        this.updateTheoryPanel(op);

        // Create input parameters
        this.createInputParams(op);

        // Update visualization
        this.updateVisualization();
    }

    // ========================================
    // Theory Panel
    // ========================================

    updateTheoryPanel(op) {
        let linearBadge = op.isLinear
            ? '<span class="linear-badge is-linear">✓ Linear</span>'
            : op.isAffine
                ? '<span class="linear-badge not-linear">⚠ Affine</span>'
                : '<span class="linear-badge not-linear">✗ Nonlinear</span>';

        // Add homogeneous badge if applicable
        if (op.usesHomogeneous) {
            linearBadge += '<span class="linear-badge is-linear" style="margin-left: 4px;">📐 Homogeneous</span>';
        }

        this.theoryContent.innerHTML = `
            <h3>${op.theory.title} ${linearBadge}</h3>
            <p>${op.theory.content}</p>
            <div class="matrix-notation">${op.theory.matrixNotation}</div>
        `;
    }

    // ========================================
    // Input Parameters
    // ========================================

    createInputParams(op) {
        this.inputParams.innerHTML = '';

        for (const input of op.inputs) {
            const group = document.createElement('div');
            group.className = 'param-group';

            const isBinary = input.isBinary && this.currentCategory.id === 'bitwise';

            group.innerHTML = `
                <label>${input.label}</label>
                <div class="param-row">
                    <input type="number" 
                           class="input input-sm" 
                           id="input-${input.name}"
                           value="${input.default}"
                           ${input.min !== undefined ? `min="${input.min}"` : ''}
                           ${input.max !== undefined ? `max="${input.max}"` : ''}
                           step="1">
                    ${isBinary ? `<span class="binary-preview" id="binary-${input.name}"></span>` : ''}
                </div>
            `;

            this.inputParams.appendChild(group);

            // Add input listener
            const inputEl = group.querySelector('input');
            inputEl.addEventListener('input', () => {
                if (isBinary) {
                    this.updateBinaryPreview(input.name, parseInt(inputEl.value) || 0);
                }
                this.updateVisualization();
            });

            // Initial binary preview
            if (isBinary) {
                this.updateBinaryPreview(input.name, input.default);
            }
        }
    }

    updateBinaryPreview(name, value) {
        const preview = document.getElementById(`binary-${name}`);
        if (preview) {
            const bits = OperatorEngine.numberToBits(value, this.bitWidth);
            preview.textContent = OperatorEngine.formatBits(bits);
            preview.style.fontFamily = 'var(--font-mono)';
            preview.style.fontSize = '0.75rem';
            preview.style.color = 'var(--text-muted)';
        }
    }

    getInputValues() {
        const values = {};
        for (const input of this.currentOperator.inputs) {
            const el = document.getElementById(`input-${input.name}`);
            values[input.name] = parseFloat(el?.value) || input.default;
        }
        return values;
    }

    // ========================================
    // Visualization
    // ========================================

    updateVisualization() {
        if (!this.currentOperator) return;

        const inputs = this.getInputValues();

        // Get matrix form
        const data = this.currentOperator.getMatrixForm(inputs, this.bitWidth);

        // Compute result
        const result = this.currentOperator.compute(inputs, this.bitWidth);

        // Update result display
        if (typeof result === 'number') {
            const isBinary = this.currentCategory.id === 'bitwise' ||
                (this.currentOperator.inputs[0]?.isBinary);

            if (isBinary) {
                const bits = OperatorEngine.numberToBits(result, this.bitWidth);
                this.resultDisplay.innerHTML = `
                    <div>${result}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                        ${OperatorEngine.formatBits(bits)}
                    </div>
                `;
            } else {
                this.resultDisplay.textContent = OperatorEngine.formatNumber(result, 6);
            }
        } else if (typeof result === 'object' && result !== null) {
            // Handle 2D point results
            if ('x' in result && 'y' in result) {
                this.resultDisplay.innerHTML = `
                    <div style="font-size: 1.1rem;">(${OperatorEngine.formatNumber(result.x, 4)}, ${OperatorEngine.formatNumber(result.y, 4)})</div>
                `;
            } else {
                this.resultDisplay.textContent = JSON.stringify(result);
            }
        }

        // Update equation display
        this.updateEquationDisplay(data, inputs);

        // Set visualizer data
        const totalSteps = this.visualizer.setData(data);
        this.totalStepsSpan.textContent = totalSteps;
        this.updateStepDisplay();
    }

    updateEquationDisplay(data, inputs) {
        if (data.isPointwise) {
            this.equationDisplay.innerHTML = `
                <span style="color: var(--warning);">⚠ No matrix form</span><br>
                Pointwise: aᵢ × bᵢ
            `;
        } else if (data.isComposed) {
            this.equationDisplay.innerHTML = `
                <span style="color: var(--warning);">Composed:</span><br>
                (a⊕b) ⊕ (a∧b)
            `;
        } else if (data.steps) {
            this.equationDisplay.innerHTML = `
                <span style="color: var(--accent-primary);">Log transform:</span><br>
                [1 1]×[log values]
            `;
        } else if (data.matrix && data.vector) {
            const matStr = data.matrix.map(row =>
                row.map(v => OperatorEngine.formatNumber(v, 2)).join(' ')
            ).join(']\n[');

            const vecStr = data.vector.map(v =>
                OperatorEngine.formatNumber(v[0], 2)
            ).join('\n');

            this.equationDisplay.innerHTML = `[${matStr}] × [${vecStr}]`;
        }
    }

    // ========================================
    // Animation Control
    // ========================================

    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }

    play() {
        if (!this.currentOperator) return;

        this.isPlaying = true;
        this.playIcon.textContent = '⏸';
        this.playText.textContent = 'Pause';

        const interval = 1000 / this.animationSpeed;

        this.animationInterval = setInterval(() => {
            const step = this.visualizer.nextStep();
            this.updateStepDisplay();

            if (step >= this.visualizer.getTotalSteps()) {
                this.stop();
            }
        }, interval);
    }

    stop() {
        this.isPlaying = false;
        this.playIcon.textContent = '▶';
        this.playText.textContent = 'Animate';

        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    reset() {
        this.stop();
        this.visualizer.reset();
        this.updateStepDisplay();
    }

    nextStep() {
        this.stop();
        this.visualizer.nextStep();
        this.updateStepDisplay();
    }

    prevStep() {
        this.stop();
        this.visualizer.prevStep();
        this.updateStepDisplay();
    }

    updateStepDisplay() {
        this.currentStepSpan.textContent = this.visualizer.getStep();
    }

    // ========================================
    // Fullscreen
    // ========================================

    toggleFullscreen() {
        const panel = document.querySelector('.visualization-panel');
        panel.classList.toggle('fullscreen');
        this.isFullscreen = panel.classList.contains('fullscreen');
        this.fullscreenBtn.textContent = this.isFullscreen ? '✕' : '⛶';

        setTimeout(() => this.visualizer.resize(), 100);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
