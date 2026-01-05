/**
 * Classification Metrics
 * Precision, Recall, F1 Score, Confusion Matrix
 */

class ClassificationMetrics {
    constructor() {
        this.reset();
    }

    reset() {
        this.truePositives = 0;
        this.trueNegatives = 0;
        this.falsePositives = 0;
        this.falseNegatives = 0;
        this.confusionMatrix = [[0, 0], [0, 0]]; // 2x2 for binary
    }

    /**
     * Update metrics from predictions and targets
     * @param {Array} predictions - Network outputs
     * @param {Array} targets - Ground truth labels
     * @param {number} threshold - Classification threshold (default 0.5)
     */
    update(predictions, targets, threshold = 0.5) {
        this.reset();

        for (let i = 0; i < predictions.length; i++) {
            const predicted = predictions[i] >= threshold ? 1 : 0;
            const actual = targets[i];

            if (predicted === 1 && actual === 1) {
                this.truePositives++;
                this.confusionMatrix[1][1]++;
            } else if (predicted === 0 && actual === 0) {
                this.trueNegatives++;
                this.confusionMatrix[0][0]++;
            } else if (predicted === 1 && actual === 0) {
                this.falsePositives++;
                this.confusionMatrix[0][1]++;
            } else {
                this.falseNegatives++;
                this.confusionMatrix[1][0]++;
            }
        }
    }

    /**
     * Calculate accuracy
     */
    getAccuracy() {
        const total = this.truePositives + this.trueNegatives +
            this.falsePositives + this.falseNegatives;
        if (total === 0) return 0;
        return ((this.truePositives + this.trueNegatives) / total) * 100;
    }

    /**
     * Calculate precision (positive predictive value)
     * Precision = TP / (TP + FP)
     */
    getPrecision() {
        const denominator = this.truePositives + this.falsePositives;
        if (denominator === 0) return 0;
        return (this.truePositives / denominator) * 100;
    }

    /**
     * Calculate recall (sensitivity, true positive rate)
     * Recall = TP / (TP + FN)
     */
    getRecall() {
        const denominator = this.truePositives + this.falseNegatives;
        if (denominator === 0) return 0;
        return (this.truePositives / denominator) * 100;
    }

    /**
     * Calculate F1 Score (harmonic mean of precision and recall)
     * F1 = 2 * (Precision * Recall) / (Precision + Recall)
     */
    getF1Score() {
        const precision = this.getPrecision();
        const recall = this.getRecall();
        if (precision + recall === 0) return 0;
        return (2 * precision * recall) / (precision + recall);
    }

    /**
     * Get all metrics as an object
     */
    getAllMetrics() {
        return {
            accuracy: this.getAccuracy(),
            precision: this.getPrecision(),
            recall: this.getRecall(),
            f1Score: this.getF1Score(),
            confusionMatrix: this.confusionMatrix,
            truePositives: this.truePositives,
            trueNegatives: this.trueNegatives,
            falsePositives: this.falsePositives,
            falseNegatives: this.falseNegatives
        };
    }
}

/**
 * Confusion Matrix Visualizer
 */
class ConfusionMatrixVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
    }

    render(matrix, labels = ['0', '1']) {
        if (!this.container) return;

        const total = matrix.flat().reduce((a, b) => a + b, 0);

        let html = `
            <div class="confusion-matrix">
                <div class="cm-header">
                    <div class="cm-corner"></div>
                    <div class="cm-pred-label">Predicted</div>
                </div>
                <div class="cm-body">
                    <div class="cm-actual-label">Actual</div>
                    <div class="cm-grid">
                        <div class="cm-row cm-labels">
                            <div class="cm-cell cm-empty"></div>
                            ${labels.map(l => `<div class="cm-cell cm-label">${l}</div>`).join('')}
                        </div>
        `;

        for (let i = 0; i < matrix.length; i++) {
            html += `<div class="cm-row">`;
            html += `<div class="cm-cell cm-label">${labels[i]}</div>`;

            for (let j = 0; j < matrix[i].length; j++) {
                const value = matrix[i][j];
                const percent = total > 0 ? (value / total * 100).toFixed(1) : 0;
                const isCorrect = i === j;
                const intensity = total > 0 ? value / total : 0;

                html += `
                    <div class="cm-cell cm-value ${isCorrect ? 'cm-correct' : 'cm-incorrect'}" 
                         style="--intensity: ${intensity}">
                        <span class="cm-count">${value}</span>
                        <span class="cm-percent">${percent}%</span>
                    </div>
                `;
            }
            html += `</div>`;
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }
}

// Export
window.ClassificationMetrics = ClassificationMetrics;
window.ConfusionMatrixVisualizer = ConfusionMatrixVisualizer;
