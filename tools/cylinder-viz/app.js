/**
 * Main Application Controller
 * Coordinates data processing, correlation calculations, and visualization
 */

const App = {
    // State
    rawData: null,
    normalizedData: null,
    targetColumn: null,
    correlations: null,
    angleAssignments: null,
    angleMode: 'target', // 'target' or 'cluster'
    collisionThreshold: 0.05,

    /**
     * Initialize the application
     */
    init() {
        this.bindEvents();
        this.initializeVisualization();
        console.log('CylinderViz initialized');
    },

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Data input method toggle
        const inputMethod = document.getElementById('data-input-method');
        inputMethod.addEventListener('change', this.handleInputMethodChange.bind(this));

        // Load data button
        const loadBtn = document.getElementById('load-data-btn');
        loadBtn.addEventListener('click', this.handleLoadData.bind(this));

        // File input
        const fileInput = document.getElementById('csv-file');
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Visualize button
        const visualizeBtn = document.getElementById('visualize-btn');
        visualizeBtn.addEventListener('click', this.handleVisualize.bind(this));

        // Angle mode toggle
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', this.handleAngleModeChange.bind(this));
        });

        // Collision threshold slider
        const thresholdSlider = document.getElementById('collision-threshold');
        thresholdSlider.addEventListener('input', this.handleThresholdChange.bind(this));

        // Show connections checkbox
        const showConnections = document.getElementById('show-connections');
        showConnections.addEventListener('change', this.handleOptionsChange.bind(this));

        // Show grid checkbox
        const showGrid = document.getElementById('show-grid');
        showGrid.addEventListener('change', this.handleOptionsChange.bind(this));

        // Reset view button
        const resetBtn = document.getElementById('reset-view-btn');
        resetBtn.addEventListener('click', this.handleResetView.bind(this));
    },

    /**
     * Initialize visualization container
     */
    initializeVisualization() {
        Visualization.init('plot-container');
    },

    /**
     * Handle data input method change
     * @param {Event} e - Change event
     */
    handleInputMethodChange(e) {
        const method = e.target.value;

        // Hide all sections first
        document.getElementById('file-upload-section').classList.add('hidden');
        document.getElementById('paste-section').classList.add('hidden');
        document.getElementById('sample-section').classList.add('hidden');

        // Show selected section
        switch (method) {
            case 'csv':
                document.getElementById('file-upload-section').classList.remove('hidden');
                break;
            case 'paste':
                document.getElementById('paste-section').classList.remove('hidden');
                break;
            case 'sample':
                document.getElementById('sample-section').classList.remove('hidden');
                break;
        }
    },

    /**
     * Handle file selection
     * @param {Event} e - Change event
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('File selected:', file.name);
        }
    },

    /**
     * Handle load data button click
     */
    async handleLoadData() {
        const method = document.getElementById('data-input-method').value;

        try {
            let csvText;

            switch (method) {
                case 'csv':
                    const file = document.getElementById('csv-file').files[0];
                    if (!file) {
                        this.showError('Please select a CSV file');
                        return;
                    }
                    csvText = await this.readFile(file);
                    break;

                case 'paste':
                    csvText = document.getElementById('csv-paste').value;
                    if (!csvText.trim()) {
                        this.showError('Please paste CSV data');
                        return;
                    }
                    break;

                case 'sample':
                    const sampleId = document.getElementById('sample-select').value;
                    this.rawData = DataProcessor.loadSampleDataset(sampleId);
                    this.processLoadedData();
                    return;
            }

            this.rawData = DataProcessor.parseCSV(csvText);
            this.processLoadedData();

        } catch (error) {
            this.showError('Error loading data: ' + error.message);
            console.error(error);
        }
    },

    /**
     * Read file as text
     * @param {File} file - File object
     * @returns {Promise<string>} File contents
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    },

    /**
     * Process loaded data and update UI
     */
    processLoadedData() {
        // Normalize all data
        this.normalizedData = DataProcessor.normalizeAllColumns(this.rawData);

        // Populate target column dropdown
        const targetSelect = document.getElementById('target-column');
        targetSelect.innerHTML = '';

        for (const header of this.rawData.headers) {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            targetSelect.appendChild(option);
        }

        // Select last column as default target
        targetSelect.value = this.rawData.headers[this.rawData.headers.length - 1];

        // Enable controls
        targetSelect.disabled = false;
        document.getElementById('visualize-btn').disabled = false;

        // Update data summary
        this.updateDataSummary();

        console.log('Data loaded:', this.rawData.headers.length, 'columns,', this.rawData.rows.length, 'rows');
    },

    /**
     * Update the data summary panel
     */
    updateDataSummary() {
        const summary = document.getElementById('data-summary');
        summary.innerHTML = `
            <div class="summary-row">
                <span class="summary-label">Columns</span>
                <span class="summary-value">${this.rawData.headers.length}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Rows</span>
                <span class="summary-value">${this.rawData.rows.length}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Features</span>
                <span class="summary-value">${this.rawData.headers.length - 1}</span>
            </div>
        `;
    },

    /**
     * Handle visualize button click
     */
    handleVisualize() {
        try {
            this.targetColumn = document.getElementById('target-column').value;

            // Calculate correlations
            this.correlations = CorrelationEngine.calculateTargetCorrelations(
                this.normalizedData,
                this.targetColumn
            );

            // Get angle assignments based on mode
            if (this.angleMode === 'target') {
                this.angleAssignments = CorrelationEngine.getFeatureAngles(
                    this.correlations,
                    this.collisionThreshold
                );
            } else {
                const matrix = CorrelationEngine.calculateInputCorrelationMatrix(
                    this.normalizedData,
                    this.targetColumn
                );
                this.angleAssignments = CorrelationEngine.getClusterCentricAngles(
                    matrix,
                    this.collisionThreshold
                );
            }

            // Create visualization
            this.renderVisualization();

            // Update panels
            this.updateCorrelationDisplay();
            this.updateCollisionList();

            // Show legend
            document.getElementById('legend').classList.remove('hidden');

            console.log('Visualization generated');

        } catch (error) {
            this.showError('Error generating visualization: ' + error.message);
            console.error(error);
        }
    },

    /**
     * Render the 3D visualization
     */
    renderVisualization() {
        const options = {
            showConnections: document.getElementById('show-connections').checked,
            showGrid: document.getElementById('show-grid').checked
        };

        Visualization.render(
            this.normalizedData,
            this.targetColumn,
            this.angleAssignments,
            options
        );
    },

    /**
     * Update the correlation display panel
     */
    updateCorrelationDisplay() {
        const display = document.getElementById('correlation-display');

        const sortedCorrelations = Object.entries(this.correlations)
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

        let html = '';
        for (const [feature, corr] of sortedCorrelations) {
            const colorClass = corr > 0.1 ? 'positive' : (corr < -0.1 ? 'negative' : 'neutral');
            html += `
                <div class="correlation-row">
                    <span class="correlation-feature">${feature}</span>
                    <span class="correlation-value ${colorClass}">
                        ${CorrelationEngine.formatCorrelation(corr)}
                    </span>
                </div>
            `;
        }

        display.innerHTML = html;
    },

    /**
     * Update the collision list panel
     */
    updateCollisionList() {
        const list = document.getElementById('collision-list');

        // Group features by their collision groups
        const groups = {};
        for (const [feature, assignment] of Object.entries(this.angleAssignments)) {
            const key = assignment.groupFeatures.sort().join(',');
            if (!groups[key]) {
                groups[key] = {
                    features: assignment.groupFeatures,
                    angle: assignment.angle,
                    isCollision: assignment.isCollision,
                    correlation: assignment.correlation
                };
            }
        }

        let html = '';
        for (const [key, group] of Object.entries(groups)) {
            const isUnique = !group.isCollision;
            html += `
                <div class="collision-item ${isUnique ? 'unique' : ''}" 
                     data-features="${group.features.join(',')}">
                    <div class="collision-header">
                        <span>${isUnique ? '✓ Unique' : '⚠ Collision'}</span>
                        <span class="collision-count">${group.features.length}</span>
                    </div>
                    <div class="collision-features">
                        ${group.features.join(', ')}
                    </div>
                    <div class="collision-angle">
                        θ = ${group.angle.toFixed(1)}° | r = ${group.correlation.toFixed(3)}
                    </div>
                </div>
            `;
        }

        list.innerHTML = html || '<p class="empty-text">No features to display</p>';

        // Add hover handlers for ghosting effect
        const items = list.querySelectorAll('.collision-item');
        items.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const features = item.dataset.features.split(',');
                this.highlightGroup(features);
            });
            item.addEventListener('mouseleave', () => {
                this.clearHighlight();
            });
        });
    },

    /**
     * Highlight a group of features (ghosting effect)
     * @param {string[]} features - Features to highlight
     */
    highlightGroup(features) {
        Visualization.applyGhosting(features);
    },

    /**
     * Clear highlight/ghosting
     */
    clearHighlight() {
        Visualization.removeGhosting();
    },

    /**
     * Handle angle mode toggle change
     * @param {Event} e - Click event
     */
    handleAngleModeChange(e) {
        const btn = e.target;
        const mode = btn.dataset.mode;

        // Update button states
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update mode
        this.angleMode = mode;

        // Update hint text
        const hint = document.getElementById('angle-mode-hint');
        hint.textContent = mode === 'target'
            ? 'Angles based on correlation with target'
            : 'Angles based on inter-feature correlations';

        // Re-visualize if we have data
        if (this.angleAssignments) {
            this.handleVisualize();
        }
    },

    /**
     * Handle collision threshold change
     * @param {Event} e - Input event
     */
    handleThresholdChange(e) {
        this.collisionThreshold = parseFloat(e.target.value);
        document.getElementById('threshold-value').textContent = this.collisionThreshold.toFixed(2);

        // Re-visualize if we have data
        if (this.angleAssignments) {
            this.handleVisualize();
        }
    },

    /**
     * Handle visualization options change
     */
    handleOptionsChange() {
        if (this.angleAssignments) {
            this.renderVisualization();
        }
    },

    /**
     * Handle reset view button
     */
    handleResetView() {
        Visualization.resetCamera();
    },

    /**
     * Show error message to user
     * @param {string} message - Error message
     */
    showError(message) {
        // For now, use alert - could be replaced with a toast notification
        alert(message);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for debugging
window.App = App;
