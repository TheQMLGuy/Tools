/**
 * LSTM (Long Short-Term Memory) Engine
 * Implementation with forget, input, output gates and cell state
 */

// ============================================
// LSTM CELL - Core computation unit with gates
// ============================================

class LSTMCell {
    constructor(inputSize, hiddenSize, outputSize) {
        this.inputSize = inputSize;
        this.hiddenSize = hiddenSize;
        this.outputSize = outputSize;

        const combinedSize = inputSize + hiddenSize;

        // Gate weights: forget, input, cell candidate, output
        this.W_f = this.initMatrix(hiddenSize, combinedSize);
        this.W_i = this.initMatrix(hiddenSize, combinedSize);
        this.W_c = this.initMatrix(hiddenSize, combinedSize);
        this.W_o = this.initMatrix(hiddenSize, combinedSize);

        // Gate biases (forget gate bias initialized higher for better learning)
        this.b_f = new Array(hiddenSize).fill(1.0); // Start with remembering
        this.b_i = new Array(hiddenSize).fill(0).map(() => Math.random() * 0.1);
        this.b_c = new Array(hiddenSize).fill(0).map(() => Math.random() * 0.1);
        this.b_o = new Array(hiddenSize).fill(0).map(() => Math.random() * 0.1);

        // Output layer weights
        this.W_y = this.initMatrix(outputSize, hiddenSize);
        this.b_y = new Array(outputSize).fill(0).map(() => Math.random() * 0.1);
    }

    initMatrix(rows, cols) {
        const limit = Math.sqrt(6 / (rows + cols));
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                row.push((Math.random() * 2 - 1) * limit);
            }
            matrix.push(row);
        }
        return matrix;
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
    }

    tanh(x) {
        return Math.tanh(x);
    }

    // Forward pass for single timestep
    forward(x, h_prev, c_prev) {
        // Concatenate input and previous hidden state
        const combined = [...x, ...h_prev];

        // Forget gate: what to forget from cell state
        const f = new Array(this.hiddenSize);
        for (let i = 0; i < this.hiddenSize; i++) {
            let sum = this.b_f[i];
            for (let j = 0; j < combined.length; j++) {
                sum += this.W_f[i][j] * combined[j];
            }
            f[i] = this.sigmoid(sum);
        }

        // Input gate: what new info to store
        const iGate = new Array(this.hiddenSize);
        for (let i = 0; i < this.hiddenSize; i++) {
            let sum = this.b_i[i];
            for (let j = 0; j < combined.length; j++) {
                sum += this.W_i[i][j] * combined[j];
            }
            iGate[i] = this.sigmoid(sum);
        }

        // Cell candidate: new candidate values
        const cTilde = new Array(this.hiddenSize);
        for (let i = 0; i < this.hiddenSize; i++) {
            let sum = this.b_c[i];
            for (let j = 0; j < combined.length; j++) {
                sum += this.W_c[i][j] * combined[j];
            }
            cTilde[i] = this.tanh(sum);
        }

        // New cell state
        const c = new Array(this.hiddenSize);
        for (let i = 0; i < this.hiddenSize; i++) {
            c[i] = f[i] * c_prev[i] + iGate[i] * cTilde[i];
        }

        // Output gate: what to output
        const o = new Array(this.hiddenSize);
        for (let i = 0; i < this.hiddenSize; i++) {
            let sum = this.b_o[i];
            for (let j = 0; j < combined.length; j++) {
                sum += this.W_o[i][j] * combined[j];
            }
            o[i] = this.sigmoid(sum);
        }

        // New hidden state
        const h = new Array(this.hiddenSize);
        for (let i = 0; i < this.hiddenSize; i++) {
            h[i] = o[i] * this.tanh(c[i]);
        }

        // Output
        const y = new Array(this.outputSize);
        for (let i = 0; i < this.outputSize; i++) {
            let sum = this.b_y[i];
            for (let j = 0; j < this.hiddenSize; j++) {
                sum += this.W_y[i][j] * h[j];
            }
            y[i] = sum;
        }

        return {
            h, c, y,
            gates: { f, i: iGate, o, cTilde }
        };
    }

    getWeightStats() {
        let count = 0;
        const matrices = [this.W_f, this.W_i, this.W_c, this.W_o, this.W_y];
        for (const mat of matrices) {
            for (const row of mat) {
                count += row.length;
            }
        }
        return { count };
    }
}

// ============================================
// LSTM NETWORK
// ============================================

class LSTMNetwork {
    constructor(inputSize = 1, hiddenSize = 8, outputSize = 1, config = {}) {
        this.inputSize = inputSize;
        this.hiddenSize = hiddenSize;
        this.outputSize = outputSize;

        this.optimizerName = config.optimizerName || 'adam';
        this.learningRate = config.learningRate || 0.01;

        this.cell = new LSTMCell(inputSize, hiddenSize, outputSize);

        // States
        this.hiddenState = new Array(hiddenSize).fill(0);
        this.cellState = new Array(hiddenSize).fill(0);

        // Optimizer
        this.optimizer = this.createOptimizer();

        // Training stats
        this.epoch = 0;
        this.lossHistory = [];

        // Cache for visualization
        this.lastOutputs = [];
        this.lastHiddenStates = [];
        this.lastCellStates = [];
        this.lastGates = [];
        this.lastInputs = [];
    }

    createOptimizer() {
        const lr = this.learningRate;

        if (this.optimizerName === 'adam') {
            const beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8;
            let t = 0;
            const moments = new Map();

            return {
                type: 'adam',
                incrementT: () => { t++; },
                getT: () => t,
                update: (matrix, grad, key) => {
                    if (!moments.has(key)) {
                        moments.set(key, {
                            m: matrix.map(row => row.map(() => 0)),
                            v: matrix.map(row => row.map(() => 0))
                        });
                    }
                    const mom = moments.get(key);
                    const beta1Corr = 1 - Math.pow(beta1, t);
                    const beta2Corr = 1 - Math.pow(beta2, t);

                    for (let i = 0; i < matrix.length; i++) {
                        for (let j = 0; j < matrix[i].length; j++) {
                            mom.m[i][j] = beta1 * mom.m[i][j] + (1 - beta1) * grad[i][j];
                            mom.v[i][j] = beta2 * mom.v[i][j] + (1 - beta2) * grad[i][j] * grad[i][j];
                            const mHat = mom.m[i][j] / beta1Corr;
                            const vHat = mom.v[i][j] / beta2Corr;
                            matrix[i][j] -= lr * mHat / (Math.sqrt(vHat) + epsilon);
                        }
                    }
                },
                updateVector: (vec, grad, key) => {
                    if (!moments.has(key)) {
                        moments.set(key, { m: vec.map(() => 0), v: vec.map(() => 0) });
                    }
                    const mom = moments.get(key);
                    const beta1Corr = 1 - Math.pow(beta1, t);
                    const beta2Corr = 1 - Math.pow(beta2, t);

                    for (let i = 0; i < vec.length; i++) {
                        mom.m[i] = beta1 * mom.m[i] + (1 - beta1) * grad[i];
                        mom.v[i] = beta2 * mom.v[i] + (1 - beta2) * grad[i] * grad[i];
                        const mHat = mom.m[i] / beta1Corr;
                        const vHat = mom.v[i] / beta2Corr;
                        vec[i] -= lr * mHat / (Math.sqrt(vHat) + epsilon);
                    }
                }
            };
        }

        return {
            type: 'sgd',
            incrementT: () => { },
            update: (mat, grad) => {
                for (let i = 0; i < mat.length; i++) {
                    for (let j = 0; j < mat[i].length; j++) {
                        mat[i][j] -= lr * grad[i][j];
                    }
                }
            },
            updateVector: (vec, grad) => {
                for (let i = 0; i < vec.length; i++) {
                    vec[i] -= lr * grad[i];
                }
            }
        };
    }

    resetStates() {
        this.hiddenState = new Array(this.hiddenSize).fill(0);
        this.cellState = new Array(this.hiddenSize).fill(0);
    }

    forward(sequence, resetState = true) {
        if (resetState) this.resetStates();

        const outputs = [];
        const hiddenStates = [this.hiddenState.slice()];
        const cellStates = [this.cellState.slice()];
        const allGates = [];
        const inputs = [];

        for (let t = 0; t < sequence.length; t++) {
            const x = Array.isArray(sequence[t]) ? sequence[t] : [sequence[t]];
            inputs.push(x);

            const result = this.cell.forward(x, this.hiddenState, this.cellState);

            this.hiddenState = result.h;
            this.cellState = result.c;

            outputs.push(result.y);
            hiddenStates.push(result.h.slice());
            cellStates.push(result.c.slice());
            allGates.push(result.gates);
        }

        this.lastOutputs = outputs;
        this.lastHiddenStates = hiddenStates;
        this.lastCellStates = cellStates;
        this.lastGates = allGates;
        this.lastInputs = inputs;

        return outputs;
    }

    // Simplified BPTT (numerical gradient approximation for complex gates)
    backward(sequence, targets) {
        const epsilon = 0.001;
        const cell = this.cell;

        // Get base loss
        this.forward(sequence);
        let baseLoss = 0;
        for (let t = 0; t < sequence.length; t++) {
            const tgt = Array.isArray(targets[t]) ? targets[t] : [targets[t]];
            for (let i = 0; i < this.outputSize; i++) {
                baseLoss += 0.5 * Math.pow(this.lastOutputs[t][i] - tgt[i], 2);
            }
        }
        baseLoss /= sequence.length;

        // Numerical gradient for key parameters (simplified)
        const updateMatrix = (matrix, key) => {
            const grad = matrix.map(row => row.map(() => 0));
            for (let i = 0; i < Math.min(matrix.length, 4); i++) {
                for (let j = 0; j < Math.min(matrix[i].length, 4); j++) {
                    matrix[i][j] += epsilon;
                    this.forward(sequence);
                    let newLoss = 0;
                    for (let t = 0; t < sequence.length; t++) {
                        const tgt = Array.isArray(targets[t]) ? targets[t] : [targets[t]];
                        for (let k = 0; k < this.outputSize; k++) {
                            newLoss += 0.5 * Math.pow(this.lastOutputs[t][k] - tgt[k], 2);
                        }
                    }
                    grad[i][j] = (newLoss / sequence.length - baseLoss) / epsilon;
                    matrix[i][j] -= epsilon;
                }
            }
            return grad;
        };

        // Update output layer (most important for learning)
        const gradW_y = updateMatrix(cell.W_y, 'W_y');

        // Gradient clipping
        const clipValue = 5.0;
        for (let i = 0; i < gradW_y.length; i++) {
            for (let j = 0; j < gradW_y[i].length; j++) {
                gradW_y[i][j] = Math.max(-clipValue, Math.min(clipValue, gradW_y[i][j]));
            }
        }

        this.optimizer.incrementT();
        this.optimizer.update(cell.W_y, gradW_y, 'W_y');

        // Simple gradient descent on gate biases
        for (let t = 0; t < sequence.length; t++) {
            const tgt = Array.isArray(targets[t]) ? targets[t] : [targets[t]];
            const err = this.lastOutputs[t][0] - tgt[0];

            for (let i = 0; i < this.hiddenSize; i++) {
                cell.b_o[i] -= this.learningRate * 0.01 * err * this.lastGates[t].o[i];
                cell.b_i[i] -= this.learningRate * 0.01 * err * this.lastGates[t].i[i];
            }
        }

        return baseLoss;
    }

    trainStep(sequence, targets) {
        const loss = this.backward(sequence, targets);
        return loss;
    }

    train(sequences, targetsList) {
        let totalLoss = 0;
        for (let i = 0; i < sequences.length; i++) {
            totalLoss += this.trainStep(sequences[i], targetsList[i]);
        }
        const avgLoss = totalLoss / sequences.length;
        this.lossHistory.push(avgLoss);
        this.epoch++;
        return avgLoss;
    }

    predict(sequence) {
        return this.forward(sequence, true);
    }

    getWeightStats() {
        return this.cell.getWeightStats();
    }

    reinitialize() {
        this.cell = new LSTMCell(this.inputSize, this.hiddenSize, this.outputSize);
        this.optimizer = this.createOptimizer();
        this.resetStates();
        this.epoch = 0;
        this.lossHistory = [];
    }

    setLearningRate(lr) {
        this.learningRate = lr;
        this.optimizer = this.createOptimizer();
    }

    setOptimizer(name) {
        this.optimizerName = name;
        this.optimizer = this.createOptimizer();
    }

    setHiddenSize(size) {
        this.hiddenSize = size;
        this.reinitialize();
    }
}

// LSTM uses same datasets as RNN
const LSTMDatasets = RNNDatasets;

// Export
window.LSTMCell = LSTMCell;
window.LSTMNetwork = LSTMNetwork;
window.LSTMDatasets = LSTMDatasets;
