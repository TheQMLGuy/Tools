/**
 * Recurrent Neural Network Engine
 * Implementation with hidden state, forward pass, and Backpropagation Through Time (BPTT)
 */

// ============================================
// RNN CELL - Core computation unit
// ============================================

class RNNCell {
    constructor(inputSize, hiddenSize, outputSize, activationName = 'tanh') {
        this.inputSize = inputSize;
        this.hiddenSize = hiddenSize;
        this.outputSize = outputSize;
        this.activationName = activationName;

        // Get activation function
        this.activation = ActivationFunctions[activationName] || ActivationFunctions.tanh;

        // Weight matrices (Xavier initialization)
        // W_xh: input to hidden
        this.W_xh = this.initMatrix(hiddenSize, inputSize);
        // W_hh: hidden to hidden (recurrent)
        this.W_hh = this.initMatrix(hiddenSize, hiddenSize);
        // W_hy: hidden to output
        this.W_hy = this.initMatrix(outputSize, hiddenSize);

        // Biases
        this.b_h = new Array(hiddenSize).fill(0).map(() => (Math.random() * 0.2 - 0.1));
        this.b_y = new Array(outputSize).fill(0).map(() => (Math.random() * 0.2 - 0.1));

        // Store initial weights for visualization
        this.initialW_xh = this.copyMatrix(this.W_xh);
        this.initialW_hh = this.copyMatrix(this.W_hh);
        this.initialW_hy = this.copyMatrix(this.W_hy);
        this.initialB_h = [...this.b_h];
        this.initialB_y = [...this.b_y];
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

    copyMatrix(matrix) {
        return matrix.map(row => [...row]);
    }

    // Single timestep forward pass
    // Returns: { h: hidden state, y: output, preH: pre-activation hidden }
    forward(x, h_prev) {
        // x: input vector [inputSize]
        // h_prev: previous hidden state [hiddenSize]

        // Compute pre-activation: W_xh * x + W_hh * h_prev + b_h
        const preH = new Array(this.hiddenSize).fill(0);
        for (let i = 0; i < this.hiddenSize; i++) {
            let sum = this.b_h[i];
            // Input contribution
            for (let j = 0; j < this.inputSize; j++) {
                sum += this.W_xh[i][j] * x[j];
            }
            // Recurrent contribution
            for (let j = 0; j < this.hiddenSize; j++) {
                sum += this.W_hh[i][j] * h_prev[j];
            }
            preH[i] = sum;
        }

        // Apply activation to get hidden state
        const h = preH.map(val => this.activation.fn(val));

        // Compute output: W_hy * h + b_y
        const y = new Array(this.outputSize).fill(0);
        for (let i = 0; i < this.outputSize; i++) {
            let sum = this.b_y[i];
            for (let j = 0; j < this.hiddenSize; j++) {
                sum += this.W_hy[i][j] * h[j];
            }
            y[i] = sum;
        }

        return { h, y, preH };
    }

    // Get weight statistics
    getWeightStats() {
        let count = 0;
        let sum = 0;

        // Count all weights
        for (const row of this.W_xh) {
            for (const w of row) {
                count++;
                sum += Math.abs(w);
            }
        }
        for (const row of this.W_hh) {
            for (const w of row) {
                count++;
                sum += Math.abs(w);
            }
        }
        for (const row of this.W_hy) {
            for (const w of row) {
                count++;
                sum += Math.abs(w);
            }
        }

        return {
            count,
            avgMagnitude: sum / count
        };
    }
}

// ============================================
// RECURRENT NEURAL NETWORK - Full sequence processing
// ============================================

class RecurrentNeuralNetwork {
    constructor(inputSize = 1, hiddenSize = 8, outputSize = 1, config = {}) {
        this.inputSize = inputSize;
        this.hiddenSize = hiddenSize;
        this.outputSize = outputSize;

        this.activationName = config.activationName || 'tanh';
        this.optimizerName = config.optimizerName || 'adam';
        this.learningRate = config.learningRate || 0.01;

        // Create RNN cell
        this.cell = new RNNCell(inputSize, hiddenSize, outputSize, this.activationName);

        // Hidden state
        this.hiddenState = new Array(hiddenSize).fill(0);

        // Create optimizer
        this.optimizer = this.createOptimizer();

        // Training stats
        this.epoch = 0;
        this.lossHistory = [];

        // Cache for visualization
        this.lastSequenceOutputs = [];
        this.lastHiddenStates = [];
        this.lastInputs = [];

        // Gradient storage for visualization
        this.gradW_xh = null;
        this.gradW_hh = null;
        this.gradW_hy = null;
        this.gradB_h = null;
        this.gradB_y = null;
    }

    createOptimizer() {
        // Create optimizer state for all weight matrices
        const lr = this.learningRate;

        if (this.optimizerName === 'sgd') {
            return {
                type: 'sgd',
                update: (matrix, grad) => {
                    for (let i = 0; i < matrix.length; i++) {
                        for (let j = 0; j < matrix[i].length; j++) {
                            matrix[i][j] -= lr * grad[i][j];
                        }
                    }
                },
                updateVector: (vec, grad) => {
                    for (let i = 0; i < vec.length; i++) {
                        vec[i] -= lr * grad[i];
                    }
                }
            };
        } else if (this.optimizerName === 'adam') {
            // Adam optimizer state
            const beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8;
            let t = 0;

            // Moment estimates for each parameter
            const createMoments = (rows, cols) => ({
                m: Array(rows).fill(null).map(() => Array(cols).fill(0)),
                v: Array(rows).fill(null).map(() => Array(cols).fill(0))
            });

            const createVectorMoments = (size) => ({
                m: Array(size).fill(0),
                v: Array(size).fill(0)
            });

            const moments = {
                W_xh: createMoments(this.hiddenSize, this.inputSize),
                W_hh: createMoments(this.hiddenSize, this.hiddenSize),
                W_hy: createMoments(this.outputSize, this.hiddenSize),
                b_h: createVectorMoments(this.hiddenSize),
                b_y: createVectorMoments(this.outputSize)
            };

            return {
                type: 'adam',
                incrementT: () => { t++; },
                update: (matrix, grad, momentKey) => {
                    const mom = moments[momentKey];
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
                updateVector: (vec, grad, momentKey) => {
                    const mom = moments[momentKey];
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

        // Default to SGD
        return this.createOptimizer.call({ ...this, optimizerName: 'sgd' });
    }

    // Reset hidden state
    resetHiddenState() {
        this.hiddenState = new Array(this.hiddenSize).fill(0);
    }

    // Forward pass through entire sequence
    // sequence: array of input vectors [[x1], [x2], ...] or [x1, x2, ...] for 1D input
    forward(sequence, resetState = true) {
        if (resetState) {
            this.resetHiddenState();
        }

        const outputs = [];
        const hiddenStates = [this.hiddenState.slice()]; // Include initial state
        const preActivations = [];
        const inputs = [];

        for (let t = 0; t < sequence.length; t++) {
            // Normalize input to array
            const x = Array.isArray(sequence[t]) ? sequence[t] : [sequence[t]];
            inputs.push(x);

            const result = this.cell.forward(x, this.hiddenState);

            this.hiddenState = result.h;
            outputs.push(result.y);
            hiddenStates.push(result.h.slice());
            preActivations.push(result.preH);
        }

        // Cache for visualization
        this.lastSequenceOutputs = outputs;
        this.lastHiddenStates = hiddenStates;
        this.lastInputs = inputs;
        this.lastPreActivations = preActivations;

        return outputs;
    }

    // Backpropagation Through Time (BPTT)
    // targets: array of target vectors matching outputs
    backward(sequence, targets) {
        // Ensure we have cached forward pass data
        if (this.lastSequenceOutputs.length === 0) {
            this.forward(sequence);
        }

        const T = sequence.length;
        const cell = this.cell;

        // Initialize gradients
        const gradW_xh = cell.W_xh.map(row => row.map(() => 0));
        const gradW_hh = cell.W_hh.map(row => row.map(() => 0));
        const gradW_hy = cell.W_hy.map(row => row.map(() => 0));
        const gradB_h = new Array(this.hiddenSize).fill(0);
        const gradB_y = new Array(this.outputSize).fill(0);

        // Gradient of loss w.r.t. next hidden state (for BPTT)
        let dh_next = new Array(this.hiddenSize).fill(0);

        let totalLoss = 0;

        // Backward through time
        for (let t = T - 1; t >= 0; t--) {
            const x = this.lastInputs[t];
            const h = this.lastHiddenStates[t + 1]; // h at time t
            const h_prev = this.lastHiddenStates[t]; // h at time t-1
            const preH = this.lastPreActivations[t];
            const y = this.lastSequenceOutputs[t];

            // Normalize target
            const target = Array.isArray(targets[t]) ? targets[t] : [targets[t]];

            // Output error: dy = y - target (MSE derivative)
            const dy = new Array(this.outputSize);
            for (let i = 0; i < this.outputSize; i++) {
                dy[i] = y[i] - target[i];
                totalLoss += 0.5 * dy[i] * dy[i];
            }

            // Gradients for output layer
            for (let i = 0; i < this.outputSize; i++) {
                gradB_y[i] += dy[i];
                for (let j = 0; j < this.hiddenSize; j++) {
                    gradW_hy[i][j] += dy[i] * h[j];
                }
            }

            // Backprop to hidden state
            const dh = new Array(this.hiddenSize).fill(0);

            // From output
            for (let i = 0; i < this.hiddenSize; i++) {
                for (let j = 0; j < this.outputSize; j++) {
                    dh[i] += cell.W_hy[j][i] * dy[j];
                }
            }

            // From next timestep
            for (let i = 0; i < this.hiddenSize; i++) {
                dh[i] += dh_next[i];
            }

            // Through activation (tanh derivative: 1 - h^2)
            const dpreH = new Array(this.hiddenSize);
            for (let i = 0; i < this.hiddenSize; i++) {
                const actDeriv = cell.activation.derivative(preH[i], h[i]);
                dpreH[i] = dh[i] * actDeriv;
            }

            // Gradients for hidden layer
            for (let i = 0; i < this.hiddenSize; i++) {
                gradB_h[i] += dpreH[i];

                // W_xh gradients
                for (let j = 0; j < this.inputSize; j++) {
                    gradW_xh[i][j] += dpreH[i] * x[j];
                }

                // W_hh gradients
                for (let j = 0; j < this.hiddenSize; j++) {
                    gradW_hh[i][j] += dpreH[i] * h_prev[j];
                }
            }

            // Compute dh_next for previous timestep
            dh_next = new Array(this.hiddenSize).fill(0);
            for (let i = 0; i < this.hiddenSize; i++) {
                for (let j = 0; j < this.hiddenSize; j++) {
                    dh_next[i] += cell.W_hh[j][i] * dpreH[j];
                }
            }
        }

        // Gradient clipping to prevent exploding gradients
        const clipValue = 5.0;
        this.clipGradients(gradW_xh, clipValue);
        this.clipGradients(gradW_hh, clipValue);
        this.clipGradients(gradW_hy, clipValue);
        this.clipVector(gradB_h, clipValue);
        this.clipVector(gradB_y, clipValue);

        // Store gradients for visualization
        this.gradW_xh = gradW_xh;
        this.gradW_hh = gradW_hh;
        this.gradW_hy = gradW_hy;
        this.gradB_h = gradB_h;
        this.gradB_y = gradB_y;

        return { totalLoss: totalLoss / T, gradW_xh, gradW_hh, gradW_hy, gradB_h, gradB_y };
    }

    clipGradients(matrix, clipValue) {
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                matrix[i][j] = Math.max(-clipValue, Math.min(clipValue, matrix[i][j]));
            }
        }
    }

    clipVector(vec, clipValue) {
        for (let i = 0; i < vec.length; i++) {
            vec[i] = Math.max(-clipValue, Math.min(clipValue, vec[i]));
        }
    }

    // Training step on a single sequence
    trainStep(sequence, targets) {
        // Forward pass
        this.forward(sequence);

        // Backward pass
        const { totalLoss, gradW_xh, gradW_hh, gradW_hy, gradB_h, gradB_y } = this.backward(sequence, targets);

        // Update weights
        if (this.optimizer.type === 'adam') {
            this.optimizer.incrementT();
            this.optimizer.update(this.cell.W_xh, gradW_xh, 'W_xh');
            this.optimizer.update(this.cell.W_hh, gradW_hh, 'W_hh');
            this.optimizer.update(this.cell.W_hy, gradW_hy, 'W_hy');
            this.optimizer.updateVector(this.cell.b_h, gradB_h, 'b_h');
            this.optimizer.updateVector(this.cell.b_y, gradB_y, 'b_y');
        } else {
            this.optimizer.update(this.cell.W_xh, gradW_xh);
            this.optimizer.update(this.cell.W_hh, gradW_hh);
            this.optimizer.update(this.cell.W_hy, gradW_hy);
            this.optimizer.updateVector(this.cell.b_h, gradB_h);
            this.optimizer.updateVector(this.cell.b_y, gradB_y);
        }

        return totalLoss;
    }

    // Train on multiple sequences
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

    // Predict next values given a sequence
    predict(sequence) {
        const outputs = this.forward(sequence, true);
        return outputs;
    }

    // Get weight statistics for display
    getWeightStats() {
        return this.cell.getWeightStats();
    }

    // Reinitialize weights
    reinitialize() {
        this.cell = new RNNCell(this.inputSize, this.hiddenSize, this.outputSize, this.activationName);
        this.optimizer = this.createOptimizer();
        this.resetHiddenState();
        this.epoch = 0;
        this.lossHistory = [];
    }

    // Set learning rate
    setLearningRate(lr) {
        this.learningRate = lr;
        this.optimizer = this.createOptimizer();
    }

    // Set activation
    setActivation(activationName) {
        this.activationName = activationName;
        this.cell.activationName = activationName;
        this.cell.activation = ActivationFunctions[activationName] || ActivationFunctions.tanh;
    }

    // Set optimizer
    setOptimizer(optimizerName) {
        this.optimizerName = optimizerName;
        this.optimizer = this.createOptimizer();
    }

    // Set hidden size (requires reinitialize)
    setHiddenSize(hiddenSize) {
        this.hiddenSize = hiddenSize;
        this.reinitialize();
    }

    // Export model
    export() {
        return {
            inputSize: this.inputSize,
            hiddenSize: this.hiddenSize,
            outputSize: this.outputSize,
            activationName: this.activationName,
            optimizerName: this.optimizerName,
            learningRate: this.learningRate,
            epoch: this.epoch,
            weights: {
                W_xh: this.cell.W_xh,
                W_hh: this.cell.W_hh,
                W_hy: this.cell.W_hy,
                b_h: this.cell.b_h,
                b_y: this.cell.b_y
            },
            lossHistory: this.lossHistory
        };
    }

    // Import model
    import(data) {
        this.inputSize = data.inputSize;
        this.hiddenSize = data.hiddenSize;
        this.outputSize = data.outputSize;
        this.activationName = data.activationName;
        this.optimizerName = data.optimizerName;
        this.learningRate = data.learningRate;
        this.epoch = data.epoch;
        this.lossHistory = data.lossHistory || [];

        this.cell = new RNNCell(this.inputSize, this.hiddenSize, this.outputSize, this.activationName);
        this.cell.W_xh = data.weights.W_xh;
        this.cell.W_hh = data.weights.W_hh;
        this.cell.W_hy = data.weights.W_hy;
        this.cell.b_h = data.weights.b_h;
        this.cell.b_y = data.weights.b_y;

        this.optimizer = this.createOptimizer();
        this.resetHiddenState();
    }
}

// ============================================
// SEQUENCE DATASETS
// ============================================

const RNNDatasets = {
    // Sine wave prediction: predict next value
    sineWave: (sequenceLength = 20, numSequences = 50) => {
        const sequences = [];
        const targets = [];

        for (let i = 0; i < numSequences; i++) {
            const phase = Math.random() * Math.PI * 2;
            const freq = 0.5 + Math.random() * 0.5;

            const seq = [];
            const tgt = [];

            for (let t = 0; t < sequenceLength; t++) {
                const val = Math.sin(freq * t * 0.3 + phase);
                seq.push([val]);
            }

            // Target: next value after each input
            for (let t = 0; t < sequenceLength; t++) {
                const nextVal = Math.sin(freq * (t + 1) * 0.3 + phase);
                tgt.push([nextVal]);
            }

            sequences.push(seq);
            targets.push(tgt);
        }

        return { sequences, targets };
    },

    // Square wave prediction
    squareWave: (sequenceLength = 20, numSequences = 50) => {
        const sequences = [];
        const targets = [];

        for (let i = 0; i < numSequences; i++) {
            const period = 4 + Math.floor(Math.random() * 4);
            const phase = Math.floor(Math.random() * period);

            const seq = [];
            const tgt = [];

            for (let t = 0; t < sequenceLength; t++) {
                const val = ((t + phase) % period) < (period / 2) ? 1 : -1;
                seq.push([val]);
            }

            for (let t = 0; t < sequenceLength; t++) {
                const nextVal = ((t + 1 + phase) % period) < (period / 2) ? 1 : -1;
                tgt.push([nextVal]);
            }

            sequences.push(seq);
            targets.push(tgt);
        }

        return { sequences, targets };
    },

    // Echo task: output input from N steps ago
    echo: (sequenceLength = 15, delay = 3, numSequences = 50) => {
        const sequences = [];
        const targets = [];

        for (let i = 0; i < numSequences; i++) {
            const seq = [];
            const tgt = [];

            for (let t = 0; t < sequenceLength; t++) {
                const val = Math.random() > 0.5 ? 1 : -1;
                seq.push([val]);
            }

            for (let t = 0; t < sequenceLength; t++) {
                const echoVal = t >= delay ? seq[t - delay][0] : 0;
                tgt.push([echoVal]);
            }

            sequences.push(seq);
            targets.push(tgt);
        }

        return { sequences, targets };
    },

    // Adding problem: output sum of two flagged numbers
    adding: (sequenceLength = 10, numSequences = 50) => {
        const sequences = [];
        const targets = [];

        for (let i = 0; i < numSequences; i++) {
            const seq = [];
            const tgt = [];

            // Pick two random positions
            const pos1 = Math.floor(Math.random() * sequenceLength);
            let pos2 = Math.floor(Math.random() * sequenceLength);
            while (pos2 === pos1) {
                pos2 = Math.floor(Math.random() * sequenceLength);
            }

            let sum = 0;

            for (let t = 0; t < sequenceLength; t++) {
                const val = Math.random() * 2 - 1; // Random value
                const flag = (t === pos1 || t === pos2) ? 1 : 0;
                seq.push([val, flag]); // 2D input: value and flag

                if (flag === 1) sum += val;
            }

            // Target is sum at every step (or just final)
            for (let t = 0; t < sequenceLength; t++) {
                tgt.push([t === sequenceLength - 1 ? sum : 0]);
            }

            sequences.push(seq);
            targets.push(tgt);
        }

        return { sequences, targets };
    },

    // Custom function prediction
    custom: (fn, sequenceLength = 20, numSequences = 50) => {
        const sequences = [];
        const targets = [];

        for (let i = 0; i < numSequences; i++) {
            const phase = Math.random() * Math.PI * 2;
            const seq = [];
            const tgt = [];

            for (let t = 0; t < sequenceLength; t++) {
                const x = (t / sequenceLength) * 2 - 1 + phase;
                seq.push([fn(x)]);
            }

            for (let t = 0; t < sequenceLength; t++) {
                const x = ((t + 1) / sequenceLength) * 2 - 1 + phase;
                tgt.push([fn(x)]);
            }

            sequences.push(seq);
            targets.push(tgt);
        }

        return { sequences, targets };
    }
};

// Export for use in app
window.RecurrentNeuralNetwork = RecurrentNeuralNetwork;
window.RNNCell = RNNCell;
window.RNNDatasets = RNNDatasets;
