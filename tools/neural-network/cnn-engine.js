/**
 * CNN (Convolutional Neural Network) Engine
 * 2D convolution, pooling, and fully connected layers
 */

// ============================================
// CONVOLUTION LAYER
// ============================================

class Conv2D {
    constructor(inputChannels, outputChannels, kernelSize = 3, stride = 1, padding = 0) {
        this.inputChannels = inputChannels;
        this.outputChannels = outputChannels;
        this.kernelSize = kernelSize;
        this.stride = stride;
        this.padding = padding;

        // Initialize filters: [outputChannels][inputChannels][kernelSize][kernelSize]
        this.filters = [];
        for (let o = 0; o < outputChannels; o++) {
            const filter = [];
            for (let i = 0; i < inputChannels; i++) {
                const kernel = this.initKernel(kernelSize);
                filter.push(kernel);
            }
            this.filters.push(filter);
        }

        this.biases = new Array(outputChannels).fill(0);

        // Cache
        this.lastInput = null;
        this.lastOutput = null;
    }

    initKernel(size) {
        const limit = Math.sqrt(6 / (size * size * 2));
        const kernel = [];
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                row.push((Math.random() * 2 - 1) * limit);
            }
            kernel.push(row);
        }
        return kernel;
    }

    // Pad input with zeros
    pad(input, padding) {
        if (padding === 0) return input;

        const channels = input.length;
        const h = input[0].length;
        const w = input[0][0].length;

        const padded = [];
        for (let c = 0; c < channels; c++) {
            const channel = [];
            for (let i = 0; i < h + 2 * padding; i++) {
                const row = [];
                for (let j = 0; j < w + 2 * padding; j++) {
                    if (i < padding || i >= h + padding || j < padding || j >= w + padding) {
                        row.push(0);
                    } else {
                        row.push(input[c][i - padding][j - padding]);
                    }
                }
                channel.push(row);
            }
            padded.push(channel);
        }
        return padded;
    }

    // Forward pass
    forward(input) {
        // input: [channels][height][width]
        this.lastInput = input;

        const paddedInput = this.pad(input, this.padding);
        const inH = paddedInput[0].length;
        const inW = paddedInput[0][0].length;

        const outH = Math.floor((inH - this.kernelSize) / this.stride) + 1;
        const outW = Math.floor((inW - this.kernelSize) / this.stride) + 1;

        const output = [];

        for (let o = 0; o < this.outputChannels; o++) {
            const channel = [];
            for (let i = 0; i < outH; i++) {
                const row = [];
                for (let j = 0; j < outW; j++) {
                    let sum = this.biases[o];

                    // Convolve
                    for (let c = 0; c < this.inputChannels; c++) {
                        for (let ki = 0; ki < this.kernelSize; ki++) {
                            for (let kj = 0; kj < this.kernelSize; kj++) {
                                const ii = i * this.stride + ki;
                                const jj = j * this.stride + kj;
                                sum += paddedInput[c][ii][jj] * this.filters[o][c][ki][kj];
                            }
                        }
                    }

                    row.push(sum);
                }
                channel.push(row);
            }
            output.push(channel);
        }

        this.lastOutput = output;
        return output;
    }
}

// ============================================
// MAX POOLING LAYER
// ============================================

class MaxPool2D {
    constructor(poolSize = 2, stride = 2) {
        this.poolSize = poolSize;
        this.stride = stride;

        this.lastInput = null;
        this.lastOutput = null;
        this.lastMaxIndices = null;
    }

    forward(input) {
        // input: [channels][height][width]
        this.lastInput = input;

        const channels = input.length;
        const inH = input[0].length;
        const inW = input[0][0].length;

        const outH = Math.floor((inH - this.poolSize) / this.stride) + 1;
        const outW = Math.floor((inW - this.poolSize) / this.stride) + 1;

        const output = [];
        const maxIndices = [];

        for (let c = 0; c < channels; c++) {
            const channel = [];
            const indices = [];

            for (let i = 0; i < outH; i++) {
                const row = [];
                const idxRow = [];

                for (let j = 0; j < outW; j++) {
                    let maxVal = -Infinity;
                    let maxI = 0, maxJ = 0;

                    for (let pi = 0; pi < this.poolSize; pi++) {
                        for (let pj = 0; pj < this.poolSize; pj++) {
                            const ii = i * this.stride + pi;
                            const jj = j * this.stride + pj;
                            if (input[c][ii][jj] > maxVal) {
                                maxVal = input[c][ii][jj];
                                maxI = ii;
                                maxJ = jj;
                            }
                        }
                    }

                    row.push(maxVal);
                    idxRow.push([maxI, maxJ]);
                }
                channel.push(row);
                indices.push(idxRow);
            }
            output.push(channel);
            maxIndices.push(indices);
        }

        this.lastOutput = output;
        this.lastMaxIndices = maxIndices;
        return output;
    }
}

// ============================================
// FLATTEN LAYER
// ============================================

function flatten(input) {
    // input: [channels][height][width] -> [flat array]
    const flat = [];
    for (const channel of input) {
        for (const row of channel) {
            for (const val of row) {
                flat.push(val);
            }
        }
    }
    return flat;
}

// ============================================
// CNN NETWORK
// ============================================

class CNNNetwork {
    constructor(inputSize = 8, numClasses = 4, config = {}) {
        this.inputSize = inputSize; // Assume square input
        this.numClasses = numClasses;

        this.learningRate = config.learningRate || 0.01;
        this.optimizerName = config.optimizerName || 'adam';

        // Conv layer: 1 input channel, 4 output channels, 3x3 kernel
        this.conv1 = new Conv2D(1, 4, 3, 1, 1); // With padding to maintain size

        // Pool layer: 2x2
        this.pool1 = new MaxPool2D(2, 2);

        // Calculate flattened size after conv+pool
        const afterConv = inputSize; // Same due to padding
        const afterPool = Math.floor(afterConv / 2);
        this.flatSize = 4 * afterPool * afterPool;

        // Dense layer
        this.W_fc = this.initMatrix(numClasses, this.flatSize);
        this.b_fc = new Array(numClasses).fill(0);

        // Optimizer
        this.optimizer = this.createOptimizer();

        // Training stats
        this.epoch = 0;
        this.lossHistory = [];

        // Cache
        this.lastConvOutput = null;
        this.lastPoolOutput = null;
        this.lastFlat = null;
        this.lastOutput = null;
        this.lastPrediction = null;
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

    createOptimizer() {
        const lr = this.learningRate;

        if (this.optimizerName === 'adam') {
            let t = 0;
            const beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8;
            const moments = new Map();

            return {
                type: 'adam',
                incrementT: () => { t++; },
                update: (mat, grad, key) => {
                    if (!moments.has(key)) {
                        moments.set(key, {
                            m: mat.map(row => row.map(() => 0)),
                            v: mat.map(row => row.map(() => 0))
                        });
                    }
                    const mom = moments.get(key);
                    const beta1Corr = 1 - Math.pow(beta1, t);
                    const beta2Corr = 1 - Math.pow(beta2, t);

                    for (let i = 0; i < mat.length; i++) {
                        for (let j = 0; j < mat[i].length; j++) {
                            mom.m[i][j] = beta1 * mom.m[i][j] + (1 - beta1) * grad[i][j];
                            mom.v[i][j] = beta2 * mom.v[i][j] + (1 - beta2) * grad[i][j] ** 2;
                            const mHat = mom.m[i][j] / beta1Corr;
                            const vHat = mom.v[i][j] / beta2Corr;
                            mat[i][j] -= lr * mHat / (Math.sqrt(vHat) + epsilon);
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
                        mom.v[i] = beta2 * mom.v[i] + (1 - beta2) * grad[i] ** 2;
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

    relu(x) {
        return Math.max(0, x);
    }

    softmax(logits) {
        const maxVal = Math.max(...logits);
        const exp = logits.map(x => Math.exp(x - maxVal));
        const sum = exp.reduce((a, b) => a + b, 0);
        return exp.map(x => x / sum);
    }

    forward(input) {
        // input: 2D array [height][width] or [1][height][width]
        let x;
        if (input.length === this.inputSize) {
            // 2D input, add channel dimension
            x = [input];
        } else {
            x = input;
        }

        // Conv + ReLU
        const conv1Out = this.conv1.forward(x);
        const relu1Out = conv1Out.map(ch =>
            ch.map(row => row.map(val => this.relu(val)))
        );
        this.lastConvOutput = relu1Out;

        // Pool
        const pool1Out = this.pool1.forward(relu1Out);
        this.lastPoolOutput = pool1Out;

        // Flatten
        const flat = flatten(pool1Out);
        this.lastFlat = flat;

        // Dense
        const logits = new Array(this.numClasses).fill(0);
        for (let i = 0; i < this.numClasses; i++) {
            let sum = this.b_fc[i];
            for (let j = 0; j < flat.length; j++) {
                sum += this.W_fc[i][j] * flat[j];
            }
            logits[i] = sum;
        }

        // Softmax
        const probs = this.softmax(logits);

        this.lastOutput = logits;
        this.lastPrediction = probs;

        return probs;
    }

    trainStep(input, label) {
        const probs = this.forward(input);

        // Cross-entropy loss
        const loss = -Math.log(probs[label] + 1e-10);

        // Gradient of cross-entropy + softmax
        const dLogits = probs.map((p, i) => i === label ? p - 1 : p);

        // Update dense layer
        this.optimizer.incrementT();

        const gradW = this.W_fc.map(row => row.map(() => 0));
        const gradB = new Array(this.numClasses).fill(0);

        for (let i = 0; i < this.numClasses; i++) {
            gradB[i] = dLogits[i];
            for (let j = 0; j < this.lastFlat.length; j++) {
                gradW[i][j] = dLogits[i] * this.lastFlat[j];
            }
        }

        this.optimizer.update(this.W_fc, gradW, 'W_fc');
        this.optimizer.updateVector(this.b_fc, gradB, 'b_fc');

        return loss;
    }

    train(images, labels) {
        let totalLoss = 0;
        for (let i = 0; i < images.length; i++) {
            totalLoss += this.trainStep(images[i], labels[i]);
        }
        const avgLoss = totalLoss / images.length;
        this.lossHistory.push(avgLoss);
        this.epoch++;
        return avgLoss;
    }

    predict(input) {
        const probs = this.forward(input);
        return probs.indexOf(Math.max(...probs));
    }

    getWeightStats() {
        let count = 0;
        for (const filter of this.conv1.filters) {
            for (const channel of filter) {
                for (const row of channel) {
                    count += row.length;
                }
            }
        }
        for (const row of this.W_fc) {
            count += row.length;
        }
        return { count };
    }

    reinitialize() {
        this.conv1 = new Conv2D(1, 4, 3, 1, 1);
        this.pool1 = new MaxPool2D(2, 2);
        this.W_fc = this.initMatrix(this.numClasses, this.flatSize);
        this.b_fc = new Array(this.numClasses).fill(0);
        this.optimizer = this.createOptimizer();
        this.epoch = 0;
        this.lossHistory = [];
    }

    setLearningRate(lr) {
        this.learningRate = lr;
        this.optimizer = this.createOptimizer();
    }
}

// ============================================
// CNN DATASETS - Simple 8x8 patterns
// ============================================

const CNNDatasets = {
    // Generate patterns: horizontal, vertical, diagonal, cross
    patterns: (numSamples = 100) => {
        const images = [];
        const labels = [];
        const size = 8;

        for (let i = 0; i < numSamples; i++) {
            const label = i % 4;
            const img = [];

            for (let y = 0; y < size; y++) {
                const row = [];
                for (let x = 0; x < size; x++) {
                    let val = 0;
                    const noise = (Math.random() - 0.5) * 0.2;

                    if (label === 0) {
                        // Horizontal line
                        if (y === 3 || y === 4) val = 1;
                    } else if (label === 1) {
                        // Vertical line
                        if (x === 3 || x === 4) val = 1;
                    } else if (label === 2) {
                        // Diagonal
                        if (Math.abs(x - y) <= 1) val = 1;
                    } else {
                        // Cross
                        if ((y === 3 || y === 4) || (x === 3 || x === 4)) val = 1;
                    }

                    row.push(val + noise);
                }
                img.push(row);
            }

            images.push(img);
            labels.push(label);
        }

        return { images, labels, classNames: ['Horizontal', 'Vertical', 'Diagonal', 'Cross'] };
    },

    // Shapes: circle, square, triangle, star
    shapes: (numSamples = 100) => {
        const images = [];
        const labels = [];
        const size = 8;
        const center = size / 2 - 0.5;

        for (let i = 0; i < numSamples; i++) {
            const label = i % 4;
            const img = [];

            for (let y = 0; y < size; y++) {
                const row = [];
                for (let x = 0; x < size; x++) {
                    let val = 0;
                    const noise = (Math.random() - 0.5) * 0.15;
                    const dx = x - center;
                    const dy = y - center;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (label === 0) {
                        // Circle
                        if (dist >= 2 && dist <= 3.5) val = 1;
                    } else if (label === 1) {
                        // Square
                        if ((x === 1 || x === 6) && y >= 1 && y <= 6) val = 1;
                        if ((y === 1 || y === 6) && x >= 1 && x <= 6) val = 1;
                    } else if (label === 2) {
                        // Triangle
                        if (y === 6 && x >= 1 && x <= 6) val = 1;
                        if (x >= y - 1 && x <= 8 - y && y >= 2) val = 1;
                    } else {
                        // X shape
                        if (Math.abs(x - y) <= 1 || Math.abs(x - (7 - y)) <= 1) val = 1;
                    }

                    row.push(val + noise);
                }
                img.push(row);
            }

            images.push(img);
            labels.push(label);
        }

        return { images, labels, classNames: ['Circle', 'Square', 'Triangle', 'X-Shape'] };
    }
};

// Export
window.Conv2D = Conv2D;
window.MaxPool2D = MaxPool2D;
window.CNNNetwork = CNNNetwork;
window.CNNDatasets = CNNDatasets;
window.flatten = flatten;
