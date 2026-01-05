/**
 * Neural Network Visualizer - Main Application
 * Controls training loop and coordinates all visualizers
 */

class App {
    constructor() {
        // Network configuration
        this.layerSizes = [1, 8, 8, 1];
        this.activationName = 'sigmoid';
        this.optimizerName = 'adam';
        this.lossFunctionName = 'mse';
        this.weightInitName = 'xavier';
        this.learningRate = 0.01;
        this.targetFunctionName = 'sine'; // Legacy - for first output

        // Multi-output function configuration
        // Each output node has its own target function
        this.outputFunctions = ['sine'];

        // Training state
        this.isPlaying = false;
        this.animationId = null;
        this.stepSize = 5;
        this.accuracyHistory = [];

        // Initialize components
        this.initNetwork();
        this.initVisualizers();
        this.initControls();
        this.initTrainingData();

        // Initial render with delay to ensure layout needs are met
        this.updateAllVisualizers();

        // Force rebuild after short delay to fix node control positioning
        setTimeout(() => {
            this.networkViz.resize();
            this.rebuildNetwork();
        }, 100);

        // Listen for resize events to update node controls
        window.addEventListener('resize', () => {
            if (this.networkViz) {
                // Wait for layout to settle
                setTimeout(() => {
                    this.renderNodeControls();
                    this.renderOutputControls();
                }, 50);
            }
        });
    }

    initNetwork() {
        this.network = new NeuralNetwork(
            this.layerSizes,
            this.activationName,
            this.optimizerName,
            this.learningRate
        );
    }

    initVisualizers() {
        this.networkViz = new NetworkVisualizer('network-canvas', 'tooltip');
        this.curveViz = new CurveVisualizer('curve-canvas');
        this.lossChart = new LossChart('loss-canvas');
        this.accuracyChart = new AccuracyChart('accuracy-canvas');
        this.forwardPassGraph = new ForwardPassGraph('forward-pass-canvas');
        this.observationsPanel = new ObservationsPanel();

        this.networkViz.setNetwork(this.network);
        this.curveViz.setNetwork(this.network);
        this.updateCurveVizTargets();
        this.forwardPassGraph.setNetwork(this.network);
    }

    // Update curve visualizer with current output functions
    updateCurveVizTargets() {
        const targets = this.outputFunctions.map(name => ({
            name,
            fn: TargetFunctions[name]
        }));
        this.curveViz.setTargetFunctions(targets);
    }

    initTrainingData() {
        const data = this.curveViz.getTrainingData();
        this.trainingInputs = data.inputs;
        this.trainingTargets = data.targets;
    }

    // Add output node with default function
    addOutputNode() {
        const outputCount = this.layerSizes[this.layerSizes.length - 1];
        if (outputCount >= 8) return; // Max 8 outputs

        this.layerSizes[this.layerSizes.length - 1]++;
        // Add default function for new output
        this.outputFunctions.push('cosine');
        this.rebuildNetwork();
    }

    // Remove last output node
    removeOutputNode() {
        const outputCount = this.layerSizes[this.layerSizes.length - 1];
        if (outputCount <= 1) return; // Min 1 output

        this.layerSizes[this.layerSizes.length - 1]--;
        this.outputFunctions.pop();
        this.rebuildNetwork();
    }

    // Set function for specific output
    setOutputFunction(outputIndex, functionName) {
        if (outputIndex >= 0 && outputIndex < this.outputFunctions.length) {
            this.outputFunctions[outputIndex] = functionName;
            // Keep legacy property in sync with first output
            if (outputIndex === 0) {
                this.targetFunctionName = functionName;
            }
            this.updateCurveVizTargets();
            this.initTrainingData();
            this.reset();
        }
    }

    // Render output layer controls (add/remove buttons and function dropdowns)
    renderOutputControls() {
        const container = document.getElementById('output-controls-container');
        if (!container) return;

        container.innerHTML = '';

        requestAnimationFrame(() => {
            if (!this.networkViz || !this.networkViz.width) return;

            const padding = 80;
            const width = this.networkViz.width;
            const layerCount = this.layerSizes.length;
            const outputCount = this.layerSizes[layerCount - 1];

            // Position for output layer (rightmost)
            const x = padding + ((layerCount - 1) / (layerCount - 1)) * (width - padding * 2);

            // Add/Remove buttons for output layer
            const controls = document.createElement('div');
            controls.className = 'output-control';
            controls.style.left = `${x}px`;
            controls.style.bottom = '10px';
            controls.style.transform = 'translateX(-50%)';

            const addBtn = document.createElement('button');
            addBtn.className = 'node-btn ctrl-add-node';
            addBtn.textContent = '+';
            addBtn.title = 'Add output node';
            addBtn.onclick = () => this.addOutputNode();

            const removeBtn = document.createElement('button');
            removeBtn.className = 'node-btn ctrl-remove-node';
            removeBtn.textContent = '-';
            removeBtn.title = 'Remove output node';
            removeBtn.onclick = () => this.removeOutputNode();

            controls.appendChild(removeBtn);
            controls.appendChild(addBtn);
            container.appendChild(controls);

            // Function dropdowns for each output node
            const fnNames = Object.keys(TargetFunctions);
            for (let i = 0; i < outputCount; i++) {
                const nodeY = padding + ((i + 0.5) / outputCount) * (this.networkViz.height - padding * 2);

                const dropdown = document.createElement('select');
                dropdown.className = 'output-fn-select';
                dropdown.style.position = 'absolute';
                dropdown.style.left = `${x + 25}px`;
                dropdown.style.top = `${nodeY}px`;
                dropdown.style.transform = 'translateY(-50%)';
                dropdown.title = `Output ${i + 1} target function`;

                fnNames.forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name.replace(/_/g, ' ');
                    if (name === this.outputFunctions[i]) {
                        option.selected = true;
                    }
                    dropdown.appendChild(option);
                });

                dropdown.addEventListener('change', (e) => {
                    this.setOutputFunction(i, e.target.value);
                });

                container.appendChild(dropdown);
            }
        });
    }

    initControls() {
        // Visual layer controls (overlay on network canvas)
        const addLayerVisual = document.getElementById('add-layer-visual');
        const removeLayerVisual = document.getElementById('remove-layer-visual');
        if (addLayerVisual) {
            addLayerVisual.addEventListener('click', () => this.addLayer());
        }
        if (removeLayerVisual) {
            removeLayerVisual.addEventListener('click', () => this.removeLayer());
        }

        // Activation select
        document.getElementById('activation-select').addEventListener('change', (e) => {
            this.activationName = e.target.value;
            this.network.setActivation(this.activationName);
            this.updateAllVisualizers();
        });

        // Optimizer select
        document.getElementById('optimizer-select').addEventListener('change', (e) => {
            this.optimizerName = e.target.value;
            this.network.setOptimizer(this.optimizerName, this.learningRate);
        });

        // Learning rate
        document.getElementById('learning-rate').addEventListener('change', (e) => {
            this.learningRate = parseFloat(e.target.value) || 0.01;
            this.network.setOptimizer(this.optimizerName, this.learningRate);
        });

        // Loss function select
        document.getElementById('loss-select').addEventListener('change', (e) => {
            this.lossFunctionName = e.target.value;
            // Loss function is used in training loop
        });

        // Weight init select
        document.getElementById('init-select').addEventListener('change', (e) => {
            this.weightInitName = e.target.value;
            // Applied on next reset
        });

        // Populate target function dropdown
        this.populateFunctionDropdown();

        // Target function select (applies to first output)
        const targetSelect = document.getElementById('target-function');
        targetSelect.addEventListener('change', (e) => {
            this.setOutputFunction(0, e.target.value);
        });

        // Function search
        const searchInput = document.getElementById('target-search');
        searchInput.addEventListener('input', (e) => {
            this.filterFunctions(e.target.value);
        });
        searchInput.addEventListener('focus', () => {
            targetSelect.size = 8; // Expand dropdown
        });
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                targetSelect.size = 1; // Collapse
            }, 200);
        });

        // Step size
        document.getElementById('step-size').addEventListener('change', (e) => {
            this.stepSize = parseInt(e.target.value) || 5;
        });

        // Fullscreen toggles
        const fsCurve = document.getElementById('btn-fullscreen-curve');
        if (fsCurve) {
            fsCurve.addEventListener('click', () => this.toggleFullscreen('curve-panel'));
        }

        const fsNetwork = document.getElementById('btn-fullscreen-network');
        if (fsNetwork) {
            fsNetwork.addEventListener('click', () => this.toggleFullscreen('network-panel'));
        }

        const fsForward = document.getElementById('btn-fullscreen-forward');
        if (fsForward) {
            fsForward.addEventListener('click', () => this.toggleFullscreen('forward-pass-panel'));
        }

        const fsObs = document.getElementById('btn-fullscreen-obs');
        if (fsObs) {
            fsObs.addEventListener('click', () => this.toggleModalFullscreen('observations-modal'));
        }

        // ESC key to exit fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Check for any fullscreen panel
                const fullscreenPanel = document.querySelector('.panel.fullscreen');
                if (fullscreenPanel) {
                    this.toggleFullscreen(fullscreenPanel.id);
                    return;
                }

                // Check for fullscreen modal content
                const fullscreenModalContent = document.querySelector('.modal-content.fullscreen');
                if (fullscreenModalContent) {
                    const modal = fullscreenModalContent.closest('.modal');
                    if (modal) {
                        this.toggleModalFullscreen(modal.id);
                        return;
                    }
                }
            }
        });

        // Training controls
        this.playBtn = document.getElementById('play-btn');
        this.playBtn.addEventListener('click', () => this.togglePlay());

        document.getElementById('step-btn').addEventListener('click', () => this.step());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());

        // Dropout rate slider
        const dropoutSlider = document.getElementById('dropout-rate');
        const dropoutValue = document.getElementById('dropout-rate-value');
        if (dropoutSlider) {
            dropoutSlider.addEventListener('input', (e) => {
                const rate = parseFloat(e.target.value);
                this.network.setDropoutRate(rate);
                if (dropoutValue) {
                    dropoutValue.textContent = `${Math.round(rate * 100)}%`;
                }
            });
        }

        // Visualization mode buttons
        const vizModeContainer = document.querySelector('.viz-mode-btns');
        if (vizModeContainer) {
            vizModeContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.viz-mode-btn');
                if (!btn) return;

                const mode = btn.dataset.mode;

                // Update button states
                vizModeContainer.querySelectorAll('.viz-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Set visualization mode
                if (mode === 'backprop-animation') {
                    this.networkViz.startBackpropAnimation();
                } else {
                    this.networkViz.setVisualizationMode(mode);
                }
            });
        }

        // Model export
        const exportBtn = document.getElementById('export-model');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportModel());
        }

        // Model import
        const importBtn = document.getElementById('import-model-btn');
        const importFile = document.getElementById('import-model-file');
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.importModel(e.target.files[0]);
                    e.target.value = ''; // Reset for re-import
                }
            });
        }
    }

    // Export model as JSON file
    exportModel() {
        const modelData = this.network.exportModel();
        // Add app-specific state
        modelData.outputFunctions = [...this.outputFunctions];
        modelData.targetFunctionName = this.targetFunctionName;

        const json = JSON.stringify(modelData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `nn-model-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    // Import model from JSON file
    importModel(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);

                // Restore network
                this.network = NeuralNetwork.importModel(json);
                this.layerSizes = [...json.layerSizes];
                this.activationName = json.activationName;
                this.optimizerName = json.optimizerName;
                this.learningRate = json.learningRate;

                // Restore output functions
                if (json.outputFunctions) {
                    this.outputFunctions = [...json.outputFunctions];
                    this.targetFunctionName = this.outputFunctions[0];
                }

                // Update visualizers
                this.networkViz.setNetwork(this.network);
                this.curveViz.setNetwork(this.network);
                this.updateCurveVizTargets();
                this.forwardPassGraph.setNetwork(this.network);
                this.lossChart.update(this.network.lossHistory);
                this.accuracyChart.clear();
                this.accuracyHistory = [];
                this.renderNodeControls();
                this.renderOutputControls();
                this.updateAllVisualizers();

                // Update UI controls to match imported settings
                document.getElementById('activation-select').value = this.activationName;
                document.getElementById('optimizer-select').value = this.optimizerName;
                document.getElementById('learning-rate').value = this.learningRate;
                document.getElementById('target-function').value = this.targetFunctionName;

                console.log('Model imported successfully');
            } catch (err) {
                console.error('Failed to import model:', err);
                alert('Failed to import model: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    populateFunctionDropdown() {
        const select = document.getElementById('target-function');
        const fnNames = Object.keys(TargetFunctions);

        // Update count display if exists
        const countEl = document.getElementById('fn-count');
        if (countEl) {
            countEl.textContent = `(${fnNames.length})`;
        }

        select.innerHTML = '';
        fnNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name.replace(/_/g, ' ');
            if (name === this.targetFunctionName) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    filterFunctions(query) {
        const select = document.getElementById('target-function');
        const options = select.querySelectorAll('option');
        const lowerQuery = query.toLowerCase();

        options.forEach(opt => {
            const matches = opt.textContent.toLowerCase().includes(lowerQuery) ||
                opt.value.toLowerCase().includes(lowerQuery);
            opt.style.display = matches ? '' : 'none';
        });

        // Show dropdown
        select.size = 8;
    }

    toggleFullscreen(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        panel.classList.toggle('fullscreen');

        // Trigger resize for all potential visualizers
        setTimeout(() => {
            if (this.curveViz) this.curveViz.resize();
            if (this.networkViz) this.networkViz.resize();
            if (this.forwardPassGraph) this.forwardPassGraph.resize();

            // Re-render controls if network panel is resized
            if (panelId === 'network-panel') {
                this.renderNodeControls();
            }
        }, 50);
    }

    toggleModalFullscreen(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const content = modal.querySelector('.modal-content');
        if (content) {
            content.classList.toggle('fullscreen');
        }
    }

    addLayer() {
        if (this.layerSizes.length >= 6) return; // Max 6 layers

        // Insert new hidden layer before output
        this.layerSizes.splice(this.layerSizes.length - 1, 0, 8);
        this.rebuildNetwork();
    }

    removeLayer() {
        if (this.layerSizes.length <= 3) return; // Min: input, 1 hidden, output

        // Remove last hidden layer
        this.layerSizes.splice(this.layerSizes.length - 2, 1);
        this.rebuildNetwork();
    }

    addNode(layerIndex) {
        // Only modify hidden layers (index 1 to length-2)
        if (layerIndex <= 0 || layerIndex >= this.layerSizes.length - 1) return;
        if (this.layerSizes[layerIndex] >= 16) return; // Max 16 nodes

        this.layerSizes[layerIndex]++;
        this.rebuildNetwork();
    }

    removeNode(layerIndex) {
        // Only modify hidden layers
        if (layerIndex <= 0 || layerIndex >= this.layerSizes.length - 1) return;
        if (this.layerSizes[layerIndex] <= 1) return; // Min 1 node

        this.layerSizes[layerIndex]--;
        this.rebuildNetwork();
    }

    renderNodeControls() {
        const container = document.getElementById('node-controls-container');
        if (!container) return;

        container.innerHTML = '';

        // Wait for next frame to ensure visualizer has updated dimensions
        requestAnimationFrame(() => {
            if (!this.networkViz || !this.networkViz.width) return;

            const padding = 80;
            const width = this.networkViz.width;
            const height = this.networkViz.height;
            const layerCount = this.layerSizes.length;

            // Loop through hidden layers only
            for (let l = 1; l < layerCount - 1; l++) {
                // Calculate X position matching network-visualizer logic
                const x = padding + (l / (layerCount - 1)) * (width - padding * 2);

                const controls = document.createElement('div');
                controls.className = 'node-control';
                controls.style.left = `${x}px`;
                controls.style.bottom = '10px';
                controls.style.transform = 'translateX(-50%)';

                const addBtn = document.createElement('button');
                addBtn.className = 'node-btn ctrl-add-node';
                addBtn.textContent = '+';
                addBtn.title = 'Add node';
                addBtn.onclick = () => this.addNode(l);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'node-btn ctrl-remove-node';
                removeBtn.textContent = '-';
                removeBtn.title = 'Remove node';
                removeBtn.onclick = () => this.removeNode(l);

                controls.appendChild(removeBtn);
                controls.appendChild(addBtn);
                container.appendChild(controls);
            }
        });
    }

    rebuildNetwork() {
        this.stop();
        this.initNetwork();
        this.networkViz.setNetwork(this.network);
        this.curveViz.setNetwork(this.network);
        this.updateCurveVizTargets();
        this.forwardPassGraph.setNetwork(this.network);
        this.lossChart.clear();
        this.accuracyChart.clear();
        this.accuracyHistory = [];
        this.initTrainingData();
        this.updateAllVisualizers();
        this.renderNodeControls();
        this.renderOutputControls();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        this.playBtn.innerHTML = '<span class="icon">⏸</span> Pause';
        this.playBtn.classList.add('playing');
        this.trainingLoop();
    }

    stop() {
        this.isPlaying = false;
        this.playBtn.innerHTML = '<span class="icon">▶</span> Play';
        this.playBtn.classList.remove('playing');
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    trainingLoop() {
        if (!this.isPlaying) return;

        // Train stepSize epochs per frame
        for (let i = 0; i < this.stepSize; i++) {
            this.trainEpoch();
        }

        this.updateAllVisualizers();

        this.animationId = requestAnimationFrame(() => this.trainingLoop());
    }

    step() {
        // Train stepSize epochs on each step click
        for (let i = 0; i < this.stepSize; i++) {
            this.trainEpoch();
        }
        this.updateAllVisualizers();
    }

    trainEpoch() {
        this.network.train(this.trainingInputs, this.trainingTargets);
    }

    reset() {
        this.stop();
        this.network.reset();
        this.lossChart.clear();
        this.accuracyChart.clear();
        this.accuracyHistory = [];
        this.forwardPassGraph.setNetwork(this.network);
        this.updateAllVisualizers();
    }

    calculateAccuracy() {
        if (!this.trainingInputs || !this.trainingTargets) return 0;

        const numOutputs = this.outputFunctions.length;
        let totalError = 0;
        let totalCount = 0;

        // Calculate min/max range across all outputs
        let allTargets = [];
        for (let i = 0; i < this.trainingTargets.length; i++) {
            const target = this.trainingTargets[i];
            if (Array.isArray(target)) {
                allTargets.push(...target);
            } else {
                allTargets.push(target);
            }
        }
        const targetMin = Math.min(...allTargets);
        const targetMax = Math.max(...allTargets);
        const maxRange = Math.max(1, targetMax - targetMin);

        for (let i = 0; i < this.trainingInputs.length; i++) {
            const predictions = this.network.predict(this.trainingInputs[i]);
            const targets = this.trainingTargets[i];

            // Handle both single and multi-output
            if (Array.isArray(targets)) {
                for (let j = 0; j < targets.length; j++) {
                    totalError += Math.abs(predictions[j] - targets[j]);
                    totalCount++;
                }
            } else {
                totalError += Math.abs(predictions[0] - targets);
                totalCount++;
            }
        }

        const avgError = totalError / totalCount;
        return Math.max(0, (1 - avgError / maxRange) * 100);
    }

    updateAllVisualizers() {
        // Update epoch counter
        document.getElementById('epoch-counter').textContent = this.network.epoch;

        // Update loss display
        const currentLoss = this.network.lossHistory.length > 0
            ? this.network.lossHistory[this.network.lossHistory.length - 1]
            : 0;
        document.getElementById('current-loss').textContent = `Loss: ${currentLoss.toFixed(6)}`;

        // Calculate and track accuracy
        const accuracy = this.calculateAccuracy();
        if (this.network.epoch > 0) {
            this.accuracyHistory.push(accuracy);
        }
        document.getElementById('current-accuracy').textContent = `${accuracy.toFixed(2)}%`;

        // Update weight count
        const stats = this.network.getWeightStats();
        document.getElementById('weight-count').textContent = `${stats.count} weights`;

        // Render visualizations
        this.networkViz.render();
        this.curveViz.render();
        this.lossChart.update(this.network.lossHistory);
        this.accuracyChart.update(this.accuracyHistory);
        this.forwardPassGraph.update();
    }
}

/**
 * Classification Mode Application
 */
class ClassificationApp {
    constructor() {
        // Network configuration (2 inputs for x,y, 1 output for classification)
        this.layerSizes = [2, 8, 8, 1];
        this.activationName = 'tanh';
        this.optimizerName = 'adam';
        this.learningRate = 0.03;

        // Training state
        this.isPlaying = false;
        this.animationId = null;
        this.stepSize = 5;
        this.accuracyHistory = [];

        this.initNetwork();
        this.initVisualizers();
        this.initControls();

        this.updateDisplay();

        setTimeout(() => {
            if (this.classificationViz) {
                this.classificationViz.resize();
            }
            if (this.networkViz) {
                this.networkViz.resize();
                this.renderNodeControls();
            }
        }, 100);
    }

    initNetwork() {
        this.network = new NeuralNetwork(
            this.layerSizes,
            this.activationName,
            this.optimizerName,
            this.learningRate
        );
    }

    initVisualizers() {
        this.networkViz = new NetworkVisualizer('cls-network-canvas', 'cls-tooltip');
        this.classificationViz = new ClassificationVisualizer('classification-canvas');
        this.lossChart = new LossChart('cls-loss-canvas');
        this.accuracyChart = new AccuracyChart('cls-accuracy-canvas');

        // Metrics
        this.metrics = new ClassificationMetrics();
        this.confusionMatrixViz = new ConfusionMatrixVisualizer('cls-confusion-matrix');

        this.networkViz.setNetwork(this.network);
        this.classificationViz.setNetwork(this.network);
    }

    initControls() {
        // Dataset selector
        document.getElementById('cls-dataset').addEventListener('change', (e) => {
            this.classificationViz.generateDataset(e.target.value);
            this.reset();
        });

        // Class selector
        document.getElementById('cls-current-class').addEventListener('change', (e) => {
            this.classificationViz.setCurrentClass(parseInt(e.target.value));
        });

        // Clear points
        document.getElementById('cls-clear-points').addEventListener('click', () => {
            this.classificationViz.clearPoints();
            this.reset();
        });

        // Activation
        document.getElementById('cls-activation-select').addEventListener('change', (e) => {
            this.activationName = e.target.value;
            this.network.setActivation(this.activationName);
        });

        // Optimizer
        document.getElementById('cls-optimizer-select').addEventListener('change', (e) => {
            this.optimizerName = e.target.value;
            this.network.setOptimizer(this.optimizerName, this.learningRate);
        });

        // Learning rate
        document.getElementById('cls-learning-rate').addEventListener('change', (e) => {
            this.learningRate = parseFloat(e.target.value) || 0.03;
            this.network.setOptimizer(this.optimizerName, this.learningRate);
        });

        // Step size
        document.getElementById('cls-step-size').addEventListener('change', (e) => {
            this.stepSize = parseInt(e.target.value) || 5;
        });

        // Training controls
        this.playBtn = document.getElementById('cls-play-btn');
        this.playBtn.addEventListener('click', () => this.togglePlay());
        document.getElementById('cls-step-btn').addEventListener('click', () => this.step());
        document.getElementById('cls-reset-btn').addEventListener('click', () => this.reset());

        // Layer controls
        document.getElementById('cls-add-layer').addEventListener('click', () => this.addLayer());
        document.getElementById('cls-remove-layer').addEventListener('click', () => this.removeLayer());

        // Dropout rate slider
        const dropoutSlider = document.getElementById('cls-dropout-rate');
        const dropoutValue = document.getElementById('cls-dropout-rate-value');
        if (dropoutSlider) {
            dropoutSlider.addEventListener('input', (e) => {
                const rate = parseFloat(e.target.value);
                this.network.setDropoutRate(rate);
                if (dropoutValue) {
                    dropoutValue.textContent = `${Math.round(rate * 100)}%`;
                }
            });
        }

        // Visualization mode buttons
        const vizModeContainer = document.querySelector('#classification-mode .viz-mode-btns');
        if (vizModeContainer) {
            vizModeContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.viz-mode-btn');
                if (!btn) return;

                const mode = btn.dataset.mode;

                // Update button states
                vizModeContainer.querySelectorAll('.viz-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Set visualization mode
                if (mode === 'backprop-animation') {
                    this.networkViz.startBackpropAnimation();
                } else {
                    this.networkViz.setVisualizationMode(mode);
                }
            });
        }
    }

    addLayer() {
        if (this.layerSizes.length >= 6) return;
        this.layerSizes.splice(this.layerSizes.length - 1, 0, 4);
        this.rebuildNetwork();
    }

    removeLayer() {
        if (this.layerSizes.length <= 3) return;
        this.layerSizes.splice(this.layerSizes.length - 2, 1);
        this.rebuildNetwork();
    }

    addNode(layerIndex) {
        if (layerIndex <= 0 || layerIndex >= this.layerSizes.length - 1) return;
        if (this.layerSizes[layerIndex] >= 16) return;
        this.layerSizes[layerIndex]++;
        this.rebuildNetwork();
    }

    removeNode(layerIndex) {
        if (layerIndex <= 0 || layerIndex >= this.layerSizes.length - 1) return;
        if (this.layerSizes[layerIndex] <= 1) return;
        this.layerSizes[layerIndex]--;
        this.rebuildNetwork();
    }

    renderNodeControls() {
        const container = document.getElementById('cls-node-controls-container');
        if (!container) return;
        container.innerHTML = '';

        requestAnimationFrame(() => {
            if (!this.networkViz || !this.networkViz.width) return;

            const padding = 80;
            const width = this.networkViz.width;
            const layerCount = this.layerSizes.length;

            for (let l = 1; l < layerCount - 1; l++) {
                const x = padding + (l / (layerCount - 1)) * (width - padding * 2);

                const controls = document.createElement('div');
                controls.className = 'node-control';
                controls.style.left = `${x}px`;
                controls.style.bottom = '10px';
                controls.style.transform = 'translateX(-50%)';

                const addBtn = document.createElement('button');
                addBtn.className = 'node-btn ctrl-add-node';
                addBtn.textContent = '+';
                addBtn.onclick = () => this.addNode(l);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'node-btn ctrl-remove-node';
                removeBtn.textContent = '-';
                removeBtn.onclick = () => this.removeNode(l);

                controls.appendChild(removeBtn);
                controls.appendChild(addBtn);
                container.appendChild(controls);
            }
        });
    }

    rebuildNetwork() {
        this.stop();
        this.initNetwork();
        this.networkViz.setNetwork(this.network);
        this.classificationViz.setNetwork(this.network);
        this.lossChart.clear();
        this.accuracyChart.clear();
        this.accuracyHistory = [];
        this.updateDisplay();
        this.renderNodeControls();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        this.playBtn.innerHTML = '⏸ Pause';
        this.playBtn.classList.add('playing');
        this.trainingLoop();
    }

    stop() {
        this.isPlaying = false;
        this.playBtn.innerHTML = '▶ Play';
        this.playBtn.classList.remove('playing');
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    trainingLoop() {
        if (!this.isPlaying) return;

        for (let i = 0; i < this.stepSize; i++) {
            this.trainEpoch();
        }

        this.updateDisplay();
        this.animationId = requestAnimationFrame(() => this.trainingLoop());
    }

    step() {
        for (let i = 0; i < this.stepSize; i++) {
            this.trainEpoch();
        }
        this.updateDisplay();
    }

    trainEpoch() {
        const data = this.classificationViz.getTrainingData();
        if (data.inputs.length === 0) return;
        this.network.train(data.inputs, data.targets);
    }

    reset() {
        this.stop();
        this.network.reset();
        this.lossChart.clear();
        this.accuracyChart.clear();
        this.accuracyHistory = [];
        this.updateDisplay();
    }

    updateDisplay() {
        // Epoch counter
        document.getElementById('cls-epoch-counter').textContent = this.network.epoch;

        // Loss
        const currentLoss = this.network.lossHistory.length > 0
            ? this.network.lossHistory[this.network.lossHistory.length - 1]
            : 0;
        document.getElementById('cls-current-loss').textContent = currentLoss.toFixed(4);

        // Calculate metrics from predictions
        const points = this.classificationViz.points;
        if (points.length > 0 && this.network) {
            const predictions = points.map(p => this.network.forward([p.x, p.y])[0]);
            const targets = points.map(p => p.class);

            this.metrics.update(predictions, targets);
            const allMetrics = this.metrics.getAllMetrics();

            // Update accuracy
            const accuracy = allMetrics.accuracy;
            if (this.network.epoch > 0) {
                this.accuracyHistory.push(accuracy);
            }
            document.getElementById('cls-current-accuracy').textContent = `${accuracy.toFixed(1)}%`;

            // Update precision, recall, F1
            document.getElementById('cls-precision').textContent = `${allMetrics.precision.toFixed(1)}%`;
            document.getElementById('cls-recall').textContent = `${allMetrics.recall.toFixed(1)}%`;
            document.getElementById('cls-f1').textContent = `${allMetrics.f1Score.toFixed(1)}%`;

            // Update confusion matrix
            this.confusionMatrixViz.render(allMetrics.confusionMatrix, ['Red', 'Blue']);
        } else {
            document.getElementById('cls-current-accuracy').textContent = '0.0%';
            document.getElementById('cls-precision').textContent = '0.0%';
            document.getElementById('cls-recall').textContent = '0.0%';
            document.getElementById('cls-f1').textContent = '0.0%';
        }

        // Weight count
        const stats = this.network.getWeightStats();
        document.getElementById('cls-weight-count').textContent = `${stats.count} weights`;

        // Render visualizations
        this.networkViz.render();
        this.classificationViz.render();
        this.lossChart.update(this.network.lossHistory);
        this.accuracyChart.update(this.accuracyHistory);
    }
}

/**
 * RNN Mode Application
 */
class RNNApp {
    constructor() {
        // Network configuration
        this.inputSize = 1;
        this.hiddenSize = 8;
        this.outputSize = 1;
        this.activationName = 'tanh';
        this.optimizerName = 'adam';
        this.learningRate = 0.01;

        // Sequence configuration
        this.sequenceLength = 20;
        this.datasetName = 'sineWave';

        // Training state
        this.isPlaying = false;
        this.animationId = null;
        this.stepSize = 5;
        this.accuracyHistory = [];

        // Data
        this.sequences = [];
        this.targets = [];
        this.currentSequenceIndex = 0;

        // Initialize components
        this.initNetwork();
        this.initVisualizers();
        this.initControls();
        this.generateData();

        // Initial render
        this.updateDisplay();

        setTimeout(() => {
            this.sequenceViz.resize();
            this.networkViz.resize();
            this.hiddenViz.resize();
        }, 100);
    }

    initNetwork() {
        this.network = new RecurrentNeuralNetwork(
            this.inputSize,
            this.hiddenSize,
            this.outputSize,
            {
                activationName: this.activationName,
                optimizerName: this.optimizerName,
                learningRate: this.learningRate
            }
        );
    }

    initVisualizers() {
        this.sequenceViz = new RNNSequenceVisualizer('rnn-sequence-canvas');
        this.networkViz = new RNNNetworkVisualizer('rnn-network-canvas');
        this.hiddenViz = new RNNHiddenStateVisualizer('rnn-hidden-canvas');
        this.lossChart = new LossChart('rnn-loss-canvas');
        this.accuracyChart = new AccuracyChart('rnn-accuracy-canvas');

        this.sequenceViz.setNetwork(this.network);
        this.networkViz.setNetwork(this.network);
        this.hiddenViz.setNetwork(this.network);
    }

    initControls() {
        // Dataset selection
        document.getElementById('rnn-dataset').addEventListener('change', (e) => {
            this.datasetName = e.target.value;
            this.generateData();
            this.reset();
        });

        // Hidden size
        document.getElementById('rnn-hidden-size').addEventListener('change', (e) => {
            this.hiddenSize = parseInt(e.target.value);
            this.rebuildNetwork();
        });

        // Sequence length
        document.getElementById('rnn-seq-length').addEventListener('change', (e) => {
            this.sequenceLength = parseInt(e.target.value);
            this.generateData();
            this.reset();
        });

        // Activation
        document.getElementById('rnn-activation-select').addEventListener('change', (e) => {
            this.activationName = e.target.value;
            this.network.setActivation(this.activationName);
        });

        // Optimizer
        document.getElementById('rnn-optimizer-select').addEventListener('change', (e) => {
            this.optimizerName = e.target.value;
            this.network.setOptimizer(this.optimizerName);
        });

        // Learning rate
        document.getElementById('rnn-learning-rate').addEventListener('change', (e) => {
            this.learningRate = parseFloat(e.target.value);
            this.network.setLearningRate(this.learningRate);
        });

        // Step size
        document.getElementById('rnn-step-size').addEventListener('change', (e) => {
            this.stepSize = parseInt(e.target.value);
        });

        // Training controls
        document.getElementById('rnn-play-btn').addEventListener('click', () => this.togglePlay());
        document.getElementById('rnn-step-btn').addEventListener('click', () => this.step());
        document.getElementById('rnn-reset-btn').addEventListener('click', () => this.reset());
    }

    generateData() {
        // Set input size based on dataset
        if (this.datasetName === 'adding') {
            this.inputSize = 2;
        } else {
            this.inputSize = 1;
        }

        // Generate dataset
        const dataset = RNNDatasets[this.datasetName](this.sequenceLength);
        this.sequences = dataset.sequences;
        this.targets = dataset.targets;
        this.currentSequenceIndex = 0;

        // Rebuild network if input size changed
        if (this.network && this.network.inputSize !== this.inputSize) {
            this.rebuildNetwork();
        }

        // Show first sequence
        this.showCurrentSequence();
    }

    rebuildNetwork() {
        this.stop();
        this.network = new RecurrentNeuralNetwork(
            this.inputSize,
            this.hiddenSize,
            this.outputSize,
            {
                activationName: this.activationName,
                optimizerName: this.optimizerName,
                learningRate: this.learningRate
            }
        );

        this.sequenceViz.setNetwork(this.network);
        this.networkViz.setNetwork(this.network);
        this.hiddenViz.setNetwork(this.network);
        this.accuracyHistory = [];

        this.updateDisplay();
    }

    showCurrentSequence() {
        if (this.sequences.length === 0) return;

        const seq = this.sequences[this.currentSequenceIndex];
        const tgt = this.targets[this.currentSequenceIndex];

        // Get prediction
        const predicted = this.network.predict(seq);

        this.sequenceViz.setData(seq, tgt, predicted);
    }

    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        document.getElementById('rnn-play-btn').textContent = '⏸ Pause';
        document.getElementById('rnn-play-btn').classList.add('playing');
        this.trainingLoop();
    }

    stop() {
        this.isPlaying = false;
        document.getElementById('rnn-play-btn').textContent = '▶ Play';
        document.getElementById('rnn-play-btn').classList.remove('playing');
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    trainingLoop() {
        if (!this.isPlaying) return;

        for (let i = 0; i < this.stepSize; i++) {
            this.trainEpoch();
        }

        this.updateDisplay();
        this.animationId = requestAnimationFrame(() => this.trainingLoop());
    }

    step() {
        for (let i = 0; i < this.stepSize; i++) {
            this.trainEpoch();
        }
        this.updateDisplay();
    }

    trainEpoch() {
        // Train on all sequences
        this.network.train(this.sequences, this.targets);

        // Calculate accuracy (MSE based)
        const accuracy = this.calculateAccuracy();
        this.accuracyHistory.push(accuracy);
    }

    calculateAccuracy() {
        if (this.sequences.length === 0) return 0;

        let totalError = 0;
        let count = 0;

        for (let i = 0; i < Math.min(10, this.sequences.length); i++) {
            const outputs = this.network.predict(this.sequences[i]);
            const targets = this.targets[i];

            for (let t = 0; t < outputs.length; t++) {
                const pred = outputs[t][0];
                const tgt = Array.isArray(targets[t]) ? targets[t][0] : targets[t];
                totalError += Math.abs(pred - tgt);
                count++;
            }
        }

        // Convert error to accuracy (0-100%)
        const avgError = totalError / count;
        const accuracy = Math.max(0, 100 * (1 - avgError));
        return accuracy;
    }

    reset() {
        this.stop();
        this.network.reinitialize();
        this.accuracyHistory = [];
        this.currentSequenceIndex = 0;

        this.lossChart.reset();
        this.accuracyChart.reset();

        this.updateDisplay();
    }

    updateDisplay() {
        // Update epoch counter
        document.getElementById('rnn-epoch-counter').textContent = this.network.epoch;

        // Update loss display
        const loss = this.network.lossHistory.length > 0
            ? this.network.lossHistory[this.network.lossHistory.length - 1]
            : 0;
        document.getElementById('rnn-current-loss').textContent = loss.toFixed(4);

        // Update accuracy display
        const accuracy = this.accuracyHistory.length > 0
            ? this.accuracyHistory[this.accuracyHistory.length - 1]
            : 0;
        document.getElementById('rnn-current-accuracy').textContent = accuracy.toFixed(2) + '%';

        // Update weight count
        const stats = this.network.getWeightStats();
        document.getElementById('rnn-weight-count').textContent = `${stats.count} weights`;

        // Show current sequence with predictions
        this.showCurrentSequence();

        // Render visualizations
        this.networkViz.render();
        this.hiddenViz.render();
        this.lossChart.update(this.network.lossHistory);
        this.accuracyChart.update(this.accuracyHistory);
    }
}

/**
 * LSTM Mode Application
 */
class LSTMApp {
    constructor() {
        this.hiddenSize = 8;
        this.sequenceLength = 20;
        this.datasetName = 'sineWave';
        this.learningRate = 0.01;
        this.stepSize = 5;
        this.isPlaying = false;
        this.animationId = null;
        this.accuracyHistory = [];

        this.initNetwork();
        this.initVisualizers();
        this.initControls();
        this.generateData();
        this.updateDisplay();

        setTimeout(() => this.resize(), 100);
    }

    initNetwork() {
        this.network = new LSTMNetwork(1, this.hiddenSize, 1, { learningRate: this.learningRate });
    }

    initVisualizers() {
        this.sequenceViz = new LSTMSequenceVisualizer('lstm-sequence-canvas');
        this.networkViz = new LSTMNetworkVisualizer('lstm-network-canvas');
        this.gateViz = new LSTMGateVisualizer('lstm-gate-canvas');
        this.lossChart = new LossChart('lstm-loss-canvas');
        this.accuracyChart = new AccuracyChart('lstm-accuracy-canvas');

        this.sequenceViz.setNetwork(this.network);
        this.networkViz.setNetwork(this.network);
        this.gateViz.setNetwork(this.network);
    }

    initControls() {
        document.getElementById('lstm-dataset').addEventListener('change', (e) => { this.datasetName = e.target.value; this.generateData(); this.reset(); });
        document.getElementById('lstm-hidden-size').addEventListener('change', (e) => { this.hiddenSize = parseInt(e.target.value); this.rebuildNetwork(); });
        document.getElementById('lstm-seq-length').addEventListener('change', (e) => { this.sequenceLength = parseInt(e.target.value); this.generateData(); this.reset(); });
        document.getElementById('lstm-learning-rate').addEventListener('change', (e) => { this.learningRate = parseFloat(e.target.value); this.network.setLearningRate(this.learningRate); });
        document.getElementById('lstm-step-size').addEventListener('change', (e) => { this.stepSize = parseInt(e.target.value); });
        document.getElementById('lstm-play-btn').addEventListener('click', () => this.togglePlay());
        document.getElementById('lstm-step-btn').addEventListener('click', () => this.step());
        document.getElementById('lstm-reset-btn').addEventListener('click', () => this.reset());
    }

    generateData() {
        const dataset = LSTMDatasets[this.datasetName](this.sequenceLength);
        this.sequences = dataset.sequences;
        this.targets = dataset.targets;
        this.showCurrentSequence();
    }

    rebuildNetwork() {
        this.stop();
        this.initNetwork();
        this.sequenceViz.setNetwork(this.network);
        this.networkViz.setNetwork(this.network);
        this.gateViz.setNetwork(this.network);
        this.accuracyHistory = [];
        this.updateDisplay();
    }

    showCurrentSequence() {
        if (this.sequences.length === 0) return;
        const seq = this.sequences[0];
        const tgt = this.targets[0];
        const predicted = this.network.predict(seq);
        this.sequenceViz.setData(seq, tgt, predicted);
    }

    togglePlay() { this.isPlaying ? this.stop() : this.play(); }
    play() { this.isPlaying = true; document.getElementById('lstm-play-btn').textContent = '⏸ Pause'; this.trainingLoop(); }
    stop() { this.isPlaying = false; document.getElementById('lstm-play-btn').textContent = '▶ Play'; if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; } }

    trainingLoop() {
        if (!this.isPlaying) return;
        for (let i = 0; i < this.stepSize; i++) this.trainEpoch();
        this.updateDisplay();
        this.animationId = requestAnimationFrame(() => this.trainingLoop());
    }

    step() { for (let i = 0; i < this.stepSize; i++) this.trainEpoch(); this.updateDisplay(); }

    trainEpoch() {
        this.network.train(this.sequences, this.targets);
        const accuracy = this.calculateAccuracy();
        this.accuracyHistory.push(accuracy);
    }

    calculateAccuracy() {
        let err = 0, cnt = 0;
        for (let i = 0; i < Math.min(5, this.sequences.length); i++) {
            const out = this.network.predict(this.sequences[i]);
            for (let t = 0; t < out.length; t++) { err += Math.abs(out[t][0] - this.targets[i][t][0]); cnt++; }
        }
        return Math.max(0, 100 * (1 - err / cnt));
    }

    reset() { this.stop(); this.network.reinitialize(); this.accuracyHistory = []; this.lossChart.reset(); this.accuracyChart.reset(); this.updateDisplay(); }
    resize() { this.sequenceViz.resize(); this.networkViz.resize(); this.gateViz.resize(); }

    updateDisplay() {
        document.getElementById('lstm-epoch-counter').textContent = this.network.epoch;
        document.getElementById('lstm-current-loss').textContent = (this.network.lossHistory.slice(-1)[0] || 0).toFixed(4);
        document.getElementById('lstm-current-accuracy').textContent = (this.accuracyHistory.slice(-1)[0] || 0).toFixed(2) + '%';
        document.getElementById('lstm-weight-count').textContent = this.network.getWeightStats().count + ' weights';
        this.showCurrentSequence();
        this.networkViz.render();
        this.gateViz.render();
        this.lossChart.update(this.network.lossHistory);
        this.accuracyChart.update(this.accuracyHistory);
    }
}

/**
 * Transformer Mode Application
 */
class TransformerApp {
    constructor() {
        this.embedDim = 8;
        this.sequenceLength = 12;
        this.datasetName = 'copy';
        this.learningRate = 0.01;
        this.stepSize = 5;
        this.isPlaying = false;
        this.animationId = null;
        this.accuracyHistory = [];

        this.initNetwork();
        this.initVisualizers();
        this.initControls();
        this.generateData();
        this.updateDisplay();

        setTimeout(() => this.resize(), 100);
    }

    initNetwork() {
        this.network = new TransformerNetwork(1, this.embedDim, 1, { learningRate: this.learningRate });
    }

    initVisualizers() {
        this.sequenceViz = new TransformerSequenceVisualizer('transformer-sequence-canvas');
        this.networkViz = new TransformerNetworkVisualizer('transformer-network-canvas');
        this.attentionViz = new AttentionHeatmapVisualizer('transformer-attention-canvas');
        this.lossChart = new LossChart('transformer-loss-canvas');
        this.accuracyChart = new AccuracyChart('transformer-accuracy-canvas');

        this.sequenceViz.setNetwork(this.network);
        this.networkViz.setNetwork(this.network);
        this.attentionViz.setNetwork(this.network);
    }

    initControls() {
        document.getElementById('transformer-dataset').addEventListener('change', (e) => { this.datasetName = e.target.value; this.generateData(); this.reset(); });
        document.getElementById('transformer-embed-dim').addEventListener('change', (e) => { this.embedDim = parseInt(e.target.value); this.rebuildNetwork(); });
        document.getElementById('transformer-seq-length').addEventListener('change', (e) => { this.sequenceLength = parseInt(e.target.value); this.generateData(); this.reset(); });
        document.getElementById('transformer-learning-rate').addEventListener('change', (e) => { this.learningRate = parseFloat(e.target.value); this.network.setLearningRate(this.learningRate); });
        document.getElementById('transformer-step-size').addEventListener('change', (e) => { this.stepSize = parseInt(e.target.value); });
        document.getElementById('transformer-play-btn').addEventListener('click', () => this.togglePlay());
        document.getElementById('transformer-step-btn').addEventListener('click', () => this.step());
        document.getElementById('transformer-reset-btn').addEventListener('click', () => this.reset());
    }

    generateData() {
        const dataset = TransformerDatasets[this.datasetName](this.sequenceLength);
        this.sequences = dataset.sequences;
        this.targets = dataset.targets;
        this.showCurrentSequence();
    }

    rebuildNetwork() {
        this.stop();
        this.initNetwork();
        this.sequenceViz.setNetwork(this.network);
        this.networkViz.setNetwork(this.network);
        this.attentionViz.setNetwork(this.network);
        this.accuracyHistory = [];
        this.updateDisplay();
    }

    showCurrentSequence() {
        if (this.sequences.length === 0) return;
        const predicted = this.network.predict(this.sequences[0]);
        this.sequenceViz.setData(this.sequences[0], this.targets[0], predicted);
    }

    togglePlay() { this.isPlaying ? this.stop() : this.play(); }
    play() { this.isPlaying = true; document.getElementById('transformer-play-btn').textContent = '⏸ Pause'; this.trainingLoop(); }
    stop() { this.isPlaying = false; document.getElementById('transformer-play-btn').textContent = '▶ Play'; if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; } }

    trainingLoop() {
        if (!this.isPlaying) return;
        for (let i = 0; i < this.stepSize; i++) this.trainEpoch();
        this.updateDisplay();
        this.animationId = requestAnimationFrame(() => this.trainingLoop());
    }

    step() { for (let i = 0; i < this.stepSize; i++) this.trainEpoch(); this.updateDisplay(); }
    trainEpoch() { this.network.train(this.sequences, this.targets); this.accuracyHistory.push(this.calculateAccuracy()); }

    calculateAccuracy() {
        let err = 0, cnt = 0;
        for (let i = 0; i < Math.min(5, this.sequences.length); i++) {
            const out = this.network.predict(this.sequences[i]);
            for (let t = 0; t < out.length; t++) { err += Math.abs(out[t][0] - this.targets[i][t][0]); cnt++; }
        }
        return Math.max(0, 100 * (1 - err / cnt));
    }

    reset() { this.stop(); this.network.reinitialize(); this.accuracyHistory = []; this.lossChart.reset(); this.accuracyChart.reset(); this.updateDisplay(); }
    resize() { this.sequenceViz.resize(); this.networkViz.resize(); this.attentionViz.resize(); }

    updateDisplay() {
        document.getElementById('transformer-epoch-counter').textContent = this.network.epoch;
        document.getElementById('transformer-current-loss').textContent = (this.network.lossHistory.slice(-1)[0] || 0).toFixed(4);
        document.getElementById('transformer-current-accuracy').textContent = (this.accuracyHistory.slice(-1)[0] || 0).toFixed(2) + '%';
        document.getElementById('transformer-weight-count').textContent = this.network.getWeightStats().count + ' weights';
        this.showCurrentSequence();
        this.networkViz.render();
        this.attentionViz.render();
        this.lossChart.update(this.network.lossHistory);
        this.accuracyChart.update(this.accuracyHistory);
    }
}

/**
 * CNN Mode Application
 */
class CNNApp {
    constructor() {
        this.datasetName = 'patterns';
        this.learningRate = 0.01;
        this.stepSize = 5;
        this.isPlaying = false;
        this.animationId = null;
        this.accuracyHistory = [];

        this.initNetwork();
        this.initVisualizers();
        this.initControls();
        this.generateData();
        this.updateDisplay();

        setTimeout(() => this.resize(), 100);
    }

    initNetwork() {
        this.network = new CNNNetwork(8, 4, { learningRate: this.learningRate });
    }

    initVisualizers() {
        this.inputCanvas = new CNNInputCanvas('cnn-input-canvas');
        this.networkViz = new CNNNetworkVisualizer('cnn-network-canvas');
        this.featureViz = new FeatureMapVisualizer('cnn-feature-canvas');
        this.predDisplay = new CNNPredictionDisplay('cnn-prediction-container');
        this.lossChart = new LossChart('cnn-loss-canvas');
        this.accuracyChart = new AccuracyChart('cnn-accuracy-canvas');

        this.networkViz.setNetwork(this.network);
        this.featureViz.setNetwork(this.network);
    }

    initControls() {
        document.getElementById('cnn-dataset').addEventListener('change', (e) => { this.datasetName = e.target.value; this.generateData(); this.reset(); });
        document.getElementById('cnn-pattern-select').addEventListener('change', (e) => {
            if (e.target.value !== '') {
                const idx = parseInt(e.target.value);
                if (this.images[idx]) this.inputCanvas.setPattern(this.images[idx]);
                this.predictCurrent();
            }
        });
        document.getElementById('cnn-learning-rate').addEventListener('change', (e) => { this.learningRate = parseFloat(e.target.value); this.network.setLearningRate(this.learningRate); });
        document.getElementById('cnn-step-size').addEventListener('change', (e) => { this.stepSize = parseInt(e.target.value); });
        document.getElementById('cnn-clear-btn').addEventListener('click', () => { this.inputCanvas.clear(); this.predictCurrent(); });
        document.getElementById('cnn-play-btn').addEventListener('click', () => this.togglePlay());
        document.getElementById('cnn-step-btn').addEventListener('click', () => this.step());
        document.getElementById('cnn-reset-btn').addEventListener('click', () => this.reset());

        // Predict when drawing
        this.inputCanvas.canvas.addEventListener('mouseup', () => this.predictCurrent());
    }

    generateData() {
        const dataset = CNNDatasets[this.datasetName]();
        this.images = dataset.images;
        this.labels = dataset.labels;
        this.classNames = dataset.classNames;
        this.predDisplay.setClassNames(this.classNames);
    }

    predictCurrent() {
        const grid = this.inputCanvas.getGrid();
        const probs = this.network.forward(grid);
        this.predDisplay.update(probs);
        this.featureViz.render();
    }

    togglePlay() { this.isPlaying ? this.stop() : this.play(); }
    play() { this.isPlaying = true; document.getElementById('cnn-play-btn').textContent = '⏸ Pause'; this.trainingLoop(); }
    stop() { this.isPlaying = false; document.getElementById('cnn-play-btn').textContent = '▶ Play'; if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; } }

    trainingLoop() {
        if (!this.isPlaying) return;
        for (let i = 0; i < this.stepSize; i++) this.trainEpoch();
        this.updateDisplay();
        this.animationId = requestAnimationFrame(() => this.trainingLoop());
    }

    step() { for (let i = 0; i < this.stepSize; i++) this.trainEpoch(); this.updateDisplay(); }

    trainEpoch() {
        this.network.train(this.images, this.labels);
        const accuracy = this.calculateAccuracy();
        this.accuracyHistory.push(accuracy);
    }

    calculateAccuracy() {
        let correct = 0;
        for (let i = 0; i < Math.min(20, this.images.length); i++) {
            if (this.network.predict(this.images[i]) === this.labels[i]) correct++;
        }
        return (correct / Math.min(20, this.images.length)) * 100;
    }

    reset() { this.stop(); this.network.reinitialize(); this.accuracyHistory = []; this.lossChart.reset(); this.accuracyChart.reset(); this.updateDisplay(); }
    resize() { this.inputCanvas.resize(); this.networkViz.resize(); this.featureViz.resize(); }

    updateDisplay() {
        document.getElementById('cnn-epoch-counter').textContent = this.network.epoch;
        document.getElementById('cnn-current-loss').textContent = (this.network.lossHistory.slice(-1)[0] || 0).toFixed(4);
        document.getElementById('cnn-current-accuracy').textContent = (this.accuracyHistory.slice(-1)[0] || 0).toFixed(2) + '%';
        document.getElementById('cnn-weight-count').textContent = this.network.getWeightStats().count + ' weights';
        this.predictCurrent();
        this.networkViz.render();
        this.lossChart.update(this.network.lossHistory);
        this.accuracyChart.update(this.accuracyHistory);
    }
}

/**
 * Mode Controller - Handles navigation between modes
 */
class ModeController {
    constructor() {
        this.currentMode = 'landing';
        this.regressionApp = null;
        this.classificationApp = null;
        this.rnnApp = null;
        this.lstmApp = null;
        this.transformerApp = null;
        this.cnnApp = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Problem card clicks
        document.querySelectorAll('.problem-card[data-mode]').forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.getAttribute('data-mode');
                if (mode) this.switchMode(mode);
            });
        });

        // Back button
        document.getElementById('back-to-home').addEventListener('click', () => {
            this.switchMode('landing');
        });
    }

    switchMode(mode) {
        // Hide all
        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('mode-header').classList.add('hidden');
        document.getElementById('regression-mode').classList.add('hidden');
        document.getElementById('classification-mode').classList.add('hidden');
        document.getElementById('rnn-mode').classList.add('hidden');
        document.getElementById('lstm-mode').classList.add('hidden');
        document.getElementById('transformer-mode').classList.add('hidden');
        document.getElementById('cnn-mode').classList.add('hidden');

        this.currentMode = mode;

        if (mode === 'landing') {
            document.getElementById('landing-page').classList.remove('hidden');
        } else {
            document.getElementById('mode-header').classList.remove('hidden');

            if (mode === 'regression') {
                document.getElementById('mode-title').textContent = 'Regression';
                document.getElementById('regression-mode').classList.remove('hidden');
                if (!this.regressionApp) {
                    this.regressionApp = new App();
                } else {
                    setTimeout(() => { this.regressionApp.networkViz?.resize(); this.regressionApp.renderNodeControls?.(); }, 50);
                }
            } else if (mode === 'classification') {
                document.getElementById('mode-title').textContent = 'Classification';
                document.getElementById('classification-mode').classList.remove('hidden');
                if (!this.classificationApp) {
                    this.classificationApp = new ClassificationApp();
                } else {
                    setTimeout(() => { this.classificationApp.networkViz?.resize(); this.classificationApp.classificationViz?.resize(); }, 50);
                }
            } else if (mode === 'rnn') {
                document.getElementById('mode-title').textContent = 'Recurrent Neural Network';
                document.getElementById('rnn-mode').classList.remove('hidden');
                if (!this.rnnApp) {
                    this.rnnApp = new RNNApp();
                } else {
                    setTimeout(() => { this.rnnApp.sequenceViz?.resize(); this.rnnApp.networkViz?.resize(); this.rnnApp.hiddenViz?.resize(); }, 50);
                }
            } else if (mode === 'lstm') {
                document.getElementById('mode-title').textContent = 'LSTM Network';
                document.getElementById('lstm-mode').classList.remove('hidden');
                if (!this.lstmApp) {
                    this.lstmApp = new LSTMApp();
                } else {
                    setTimeout(() => { this.lstmApp.resize?.(); }, 50);
                }
            } else if (mode === 'transformer') {
                document.getElementById('mode-title').textContent = 'Transformer';
                document.getElementById('transformer-mode').classList.remove('hidden');
                if (!this.transformerApp) {
                    this.transformerApp = new TransformerApp();
                } else {
                    setTimeout(() => { this.transformerApp.resize?.(); }, 50);
                }
            } else if (mode === 'cnn') {
                document.getElementById('mode-title').textContent = 'CNN';
                document.getElementById('cnn-mode').classList.remove('hidden');
                if (!this.cnnApp) {
                    this.cnnApp = new CNNApp();
                } else {
                    setTimeout(() => { this.cnnApp.resize?.(); }, 50);
                }
            }
        }
    }
}

// Initialize mode controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.modeController = new ModeController();

    // Handle URL hash for deep linking (e.g., #rnn, #classification)
    const handleHash = () => {
        const hash = window.location.hash.slice(1); // Remove #
        if (hash && ['regression', 'classification', 'rnn', 'lstm', 'transformer', 'cnn'].includes(hash)) {
            window.modeController.switchMode(hash);
        }
    };

    // Check on load
    handleHash();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHash);
});
