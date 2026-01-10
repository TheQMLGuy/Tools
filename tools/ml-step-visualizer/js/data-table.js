/**
 * Data Table Component
 * Renders interactive data tables with highlighting support
 */

class DataTable {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.table = this.container;
        this.thead = this.table.querySelector('thead');
        this.tbody = this.table.querySelector('tbody');
        this.dataset = null;
        this.highlightedRows = new Set();
        this.highlightedCells = new Map();
    }

    /**
     * Load and render a dataset
     */
    load(dataset) {
        this.dataset = dataset;
        this.render();
        this.updateStats();
    }

    /**
     * Render the table
     */
    render() {
        if (!this.dataset) return;

        // Clear existing content
        this.thead.innerHTML = '';
        this.tbody.innerHTML = '';

        // Create header
        const headerRow = document.createElement('tr');

        // Add index column
        const indexTh = document.createElement('th');
        indexTh.textContent = '#';
        indexTh.style.width = '40px';
        headerRow.appendChild(indexTh);

        // Add feature columns
        this.dataset.features.forEach(feature => {
            const th = document.createElement('th');
            th.textContent = feature;
            th.dataset.feature = feature;
            headerRow.appendChild(th);
        });

        // Add target column
        const targetTh = document.createElement('th');
        targetTh.textContent = this.dataset.target;
        targetTh.classList.add('target-column');
        headerRow.appendChild(targetTh);

        this.thead.appendChild(headerRow);

        // Create body rows
        this.dataset.data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.dataset.index = index;

            // Index cell
            const indexTd = document.createElement('td');
            indexTd.textContent = index + 1;
            indexTd.style.color = 'var(--text-muted)';
            tr.appendChild(indexTd);

            // Feature cells
            this.dataset.features.forEach(feature => {
                const td = document.createElement('td');
                td.textContent = this.formatValue(row[feature]);
                td.dataset.feature = feature;
                td.dataset.value = row[feature];
                tr.appendChild(td);
            });

            // Target cell
            const targetTd = document.createElement('td');
            targetTd.textContent = row[this.dataset.target];
            targetTd.classList.add('target-cell');

            // Color code target for classification
            if (this.dataset.type === 'classification') {
                const targetValue = row[this.dataset.target];
                if (targetValue === 'Yes' || targetValue === 'Setosa' || targetValue === 1) {
                    targetTd.style.color = 'var(--success)';
                } else if (targetValue === 'No' || targetValue === 0) {
                    targetTd.style.color = 'var(--danger)';
                } else {
                    targetTd.style.color = 'var(--accent-primary)';
                }
            }

            tr.appendChild(targetTd);
            this.tbody.appendChild(tr);
        });
    }

    /**
     * Format cell value for display
     */
    formatValue(value) {
        if (typeof value === 'number') {
            return Number.isInteger(value) ? value : value.toFixed(2);
        }
        return value;
    }

    /**
     * Highlight specific rows
     */
    highlightRows(indices, className = 'highlighted') {
        this.clearHighlights();

        const rows = this.tbody.querySelectorAll('tr');
        indices.forEach(index => {
            if (rows[index]) {
                rows[index].classList.add(className);
                rows[index].classList.add('highlight-animate');
                this.highlightedRows.add(index);
            }
        });
    }

    /**
     * Highlight rows by feature value
     */
    highlightByFeature(feature, value, className = 'highlighted') {
        this.clearHighlights();

        const indices = [];
        this.dataset.data.forEach((row, index) => {
            if (row[feature] === value) {
                indices.push(index);
            }
        });

        this.highlightRows(indices, className);
        return indices;
    }

    /**
     * Highlight rows by target value
     */
    highlightByTarget(value, className = 'highlighted') {
        this.clearHighlights();

        const indices = [];
        this.dataset.data.forEach((row, index) => {
            if (row[this.dataset.target] === value) {
                indices.push(index);
            }
        });

        const positiveClass = value === 'Yes' || value === 1 ? 'highlighted-positive' : 'highlighted-negative';
        this.highlightRows(indices, positiveClass);
        return indices;
    }

    /**
     * Highlight a specific cell
     */
    highlightCell(rowIndex, feature) {
        const rows = this.tbody.querySelectorAll('tr');
        if (rows[rowIndex]) {
            const cells = rows[rowIndex].querySelectorAll('td');
            const featureIndex = this.dataset.features.indexOf(feature) + 1; // +1 for index column
            if (cells[featureIndex]) {
                cells[featureIndex].classList.add('highlight-cell');
                this.highlightedCells.set(`${rowIndex}-${feature}`, cells[featureIndex]);
            }
        }
    }

    /**
     * Highlight a column header
     */
    highlightColumn(feature) {
        const headers = this.thead.querySelectorAll('th');
        headers.forEach(th => {
            if (th.dataset.feature === feature) {
                th.style.background = 'rgba(99, 102, 241, 0.3)';
                th.style.color = '#fff';
            }
        });
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        // Clear row highlights
        const rows = this.tbody.querySelectorAll('tr');
        rows.forEach(row => {
            row.classList.remove('highlighted', 'highlighted-positive', 'highlighted-negative', 'highlight-animate');
        });
        this.highlightedRows.clear();

        // Clear cell highlights
        this.highlightedCells.forEach(cell => {
            cell.classList.remove('highlight-cell');
        });
        this.highlightedCells.clear();

        // Clear column highlights
        const headers = this.thead.querySelectorAll('th');
        headers.forEach(th => {
            th.style.background = '';
            th.style.color = '';
        });
    }

    /**
     * Update stats display
     */
    updateStats() {
        if (!this.dataset) return;

        const sampleCount = document.getElementById('sample-count');
        const featureCount = document.getElementById('feature-count');

        if (sampleCount) sampleCount.textContent = this.dataset.data.length;
        if (featureCount) featureCount.textContent = this.dataset.features.length;
    }

    /**
     * Get filtered data by indices
     */
    getFilteredData(indices) {
        return indices.map(i => this.dataset.data[i]);
    }

    /**
     * Scroll to a specific row
     */
    scrollToRow(index) {
        const rows = this.tbody.querySelectorAll('tr');
        if (rows[index]) {
            rows[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataTable;
}
