/**
 * Naive Bayes Algorithm (Stub)
 * Will show probability calculations
 */

class NaiveBayesAlgorithm {
    constructor() {
        this.name = 'Naive Bayes';
        this.dataset = null;
        this.params = { var_smoothing: 1e-9 };
        this.steps = [];
        this.currentStep = 0;
    }

    init(dataset) {
        this.dataset = dataset;
        this.steps = [];
        return this.steps;
    }

    reset() {
        this.steps = [];
        this.currentStep = 0;
    }

    setParams(params) {
        this.params = { ...this.params, ...params };
    }

    getStepCount() { return this.steps.length; }
    getStep(index) { return this.steps[index]; }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NaiveBayesAlgorithm;
}
