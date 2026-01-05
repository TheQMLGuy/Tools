/**
 * Transformer Engine
 * Single-head self-attention implementation for sequence processing
 */

// ============================================
// SELF-ATTENTION LAYER
// ============================================

class SelfAttention {
    constructor(embedDim) {
        this.embedDim = embedDim;

        // Query, Key, Value projection matrices
        this.W_q = this.initMatrix(embedDim, embedDim);
        this.W_k = this.initMatrix(embedDim, embedDim);
        this.W_v = this.initMatrix(embedDim, embedDim);

        // Output projection
        this.W_o = this.initMatrix(embedDim, embedDim);

        // Cache for visualization
        this.lastAttentionWeights = null;
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

    // Matrix multiplication: A (m x n) * B (n x p) = C (m x p)
    matmul(A, B) {
        const m = A.length;
        const n = A[0].length;
        const p = B[0].length;

        const C = [];
        for (let i = 0; i < m; i++) {
            const row = [];
            for (let j = 0; j < p; j++) {
                let sum = 0;
                for (let k = 0; k < n; k++) {
                    sum += A[i][k] * B[k][j];
                }
                row.push(sum);
            }
            C.push(row);
        }
        return C;
    }

    // Transpose matrix
    transpose(A) {
        const rows = A.length;
        const cols = A[0].length;
        const T = [];
        for (let j = 0; j < cols; j++) {
            const row = [];
            for (let i = 0; i < rows; i++) {
                row.push(A[i][j]);
            }
            T.push(row);
        }
        return T;
    }

    // Softmax over rows
    softmax(scores) {
        const result = [];
        for (let i = 0; i < scores.length; i++) {
            const row = scores[i];
            const maxVal = Math.max(...row);
            const exp = row.map(x => Math.exp(x - maxVal));
            const sum = exp.reduce((a, b) => a + b, 0);
            result.push(exp.map(x => x / sum));
        }
        return result;
    }

    // Forward pass
    // input: (seqLen x embedDim)
    forward(input) {
        const seqLen = input.length;
        const d_k = this.embedDim;

        // Project to Q, K, V
        const Q = this.matmul(input, this.transpose(this.W_q));
        const K = this.matmul(input, this.transpose(this.W_k));
        const V = this.matmul(input, this.transpose(this.W_v));

        // Scaled dot-product attention
        const scores = this.matmul(Q, this.transpose(K));
        const scaleFactor = Math.sqrt(d_k);

        // Scale scores
        for (let i = 0; i < scores.length; i++) {
            for (let j = 0; j < scores[i].length; j++) {
                scores[i][j] /= scaleFactor;
            }
        }

        // Apply softmax to get attention weights
        const attentionWeights = this.softmax(scores);
        this.lastAttentionWeights = attentionWeights;

        // Apply attention to values
        const context = this.matmul(attentionWeights, V);

        // Output projection
        const output = this.matmul(context, this.transpose(this.W_o));

        return { output, attentionWeights };
    }
}

// ============================================
// POSITIONAL ENCODING
// ============================================

function getPositionalEncoding(seqLen, embedDim) {
    const PE = [];
    for (let pos = 0; pos < seqLen; pos++) {
        const row = [];
        for (let i = 0; i < embedDim; i++) {
            if (i % 2 === 0) {
                row.push(Math.sin(pos / Math.pow(10000, i / embedDim)));
            } else {
                row.push(Math.cos(pos / Math.pow(10000, (i - 1) / embedDim)));
            }
        }
        PE.push(row);
    }
    return PE;
}

// ============================================
// TRANSFORMER NETWORK
// ============================================

class TransformerNetwork {
    constructor(inputSize = 1, embedDim = 8, outputSize = 1, config = {}) {
        this.inputSize = inputSize;
        this.embedDim = embedDim;
        this.outputSize = outputSize;

        this.learningRate = config.learningRate || 0.01;
        this.optimizerName = config.optimizerName || 'adam';

        // Input embedding
        this.W_embed = this.initMatrix(embedDim, inputSize);

        // Self-attention layer
        this.attention = new SelfAttention(embedDim);

        // Feed-forward network
        this.W_ff1 = this.initMatrix(embedDim * 2, embedDim);
        this.b_ff1 = new Array(embedDim * 2).fill(0);
        this.W_ff2 = this.initMatrix(embedDim, embedDim * 2);
        this.b_ff2 = new Array(embedDim).fill(0);

        // Output projection
        this.W_out = this.initMatrix(outputSize, embedDim);
        this.b_out = new Array(outputSize).fill(0);

        // Optimizer
        this.optimizer = this.createOptimizer();

        // Training stats
        this.epoch = 0;
        this.lossHistory = [];

        // Cache
        this.lastOutputs = [];
        this.lastAttentionWeights = null;
        this.lastEmbeddings = null;
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

    forward(sequence) {
        const seqLen = sequence.length;

        // Embed input
        const embedded = [];
        for (let t = 0; t < seqLen; t++) {
            const x = Array.isArray(sequence[t]) ? sequence[t] : [sequence[t]];
            const emb = new Array(this.embedDim).fill(0);
            for (let i = 0; i < this.embedDim; i++) {
                for (let j = 0; j < this.inputSize; j++) {
                    emb[i] += this.W_embed[i][j] * x[j];
                }
            }
            embedded.push(emb);
        }

        // Add positional encoding
        const PE = getPositionalEncoding(seqLen, this.embedDim);
        for (let t = 0; t < seqLen; t++) {
            for (let i = 0; i < this.embedDim; i++) {
                embedded[t][i] += PE[t][i];
            }
        }

        this.lastEmbeddings = embedded;

        // Self-attention
        const { output: attnOut, attentionWeights } = this.attention.forward(embedded);
        this.lastAttentionWeights = attentionWeights;

        // Residual connection (simplified)
        const afterAttn = [];
        for (let t = 0; t < seqLen; t++) {
            const row = [];
            for (let i = 0; i < this.embedDim; i++) {
                row.push(embedded[t][i] + attnOut[t][i]);
            }
            afterAttn.push(row);
        }

        // Feed-forward network
        const ffOut = [];
        for (let t = 0; t < seqLen; t++) {
            // First layer (with ReLU)
            const hidden = new Array(this.embedDim * 2).fill(0);
            for (let i = 0; i < this.embedDim * 2; i++) {
                let sum = this.b_ff1[i];
                for (let j = 0; j < this.embedDim; j++) {
                    sum += this.W_ff1[i][j] * afterAttn[t][j];
                }
                hidden[i] = this.relu(sum);
            }

            // Second layer
            const out = new Array(this.embedDim).fill(0);
            for (let i = 0; i < this.embedDim; i++) {
                let sum = this.b_ff2[i];
                for (let j = 0; j < this.embedDim * 2; j++) {
                    sum += this.W_ff2[i][j] * hidden[j];
                }
                out[i] = sum;
            }

            // Residual
            for (let i = 0; i < this.embedDim; i++) {
                out[i] += afterAttn[t][i];
            }

            ffOut.push(out);
        }

        // Output projection
        const outputs = [];
        for (let t = 0; t < seqLen; t++) {
            const y = new Array(this.outputSize).fill(0);
            for (let i = 0; i < this.outputSize; i++) {
                let sum = this.b_out[i];
                for (let j = 0; j < this.embedDim; j++) {
                    sum += this.W_out[i][j] * ffOut[t][j];
                }
                y[i] = sum;
            }
            outputs.push(y);
        }

        this.lastOutputs = outputs;
        return outputs;
    }

    trainStep(sequence, targets) {
        const outputs = this.forward(sequence);

        // Calculate loss
        let loss = 0;
        for (let t = 0; t < sequence.length; t++) {
            const tgt = Array.isArray(targets[t]) ? targets[t] : [targets[t]];
            for (let i = 0; i < this.outputSize; i++) {
                loss += 0.5 * Math.pow(outputs[t][i] - tgt[i], 2);
            }
        }
        loss /= sequence.length;

        // Simplified gradient update (output layer only for speed)
        this.optimizer.incrementT();

        for (let t = 0; t < sequence.length; t++) {
            const tgt = Array.isArray(targets[t]) ? targets[t] : [targets[t]];
            for (let i = 0; i < this.outputSize; i++) {
                const err = outputs[t][i] - tgt[i];
                this.b_out[i] -= this.learningRate * err / sequence.length;
            }
        }

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
        return this.forward(sequence);
    }

    getWeightStats() {
        let count = 0;
        const matrices = [this.W_embed, this.attention.W_q, this.attention.W_k,
        this.attention.W_v, this.W_ff1, this.W_ff2, this.W_out];
        for (const mat of matrices) {
            for (const row of mat) {
                count += row.length;
            }
        }
        return { count };
    }

    reinitialize() {
        this.W_embed = this.initMatrix(this.embedDim, this.inputSize);
        this.attention = new SelfAttention(this.embedDim);
        this.W_ff1 = this.initMatrix(this.embedDim * 2, this.embedDim);
        this.W_ff2 = this.initMatrix(this.embedDim, this.embedDim * 2);
        this.W_out = this.initMatrix(this.outputSize, this.embedDim);
        this.b_out = new Array(this.outputSize).fill(0);
        this.optimizer = this.createOptimizer();
        this.epoch = 0;
        this.lossHistory = [];
    }

    setLearningRate(lr) {
        this.learningRate = lr;
        this.optimizer = this.createOptimizer();
    }

    setEmbedDim(dim) {
        this.embedDim = dim;
        this.reinitialize();
    }
}

// Transformer datasets
const TransformerDatasets = {
    // Copy task: output should match input
    copy: (seqLen = 10, numSequences = 50) => {
        const sequences = [];
        const targets = [];

        for (let i = 0; i < numSequences; i++) {
            const seq = [];
            for (let t = 0; t < seqLen; t++) {
                seq.push([Math.random() * 2 - 1]);
            }
            sequences.push(seq);
            targets.push(seq.map(x => [...x]));
        }

        return { sequences, targets };
    },

    // Reverse task: output should be reversed input
    reverse: (seqLen = 10, numSequences = 50) => {
        const sequences = [];
        const targets = [];

        for (let i = 0; i < numSequences; i++) {
            const seq = [];
            for (let t = 0; t < seqLen; t++) {
                seq.push([Math.random() * 2 - 1]);
            }
            sequences.push(seq);
            targets.push([...seq].reverse());
        }

        return { sequences, targets };
    },

    // Sort task (simplified): output sorted values
    sort: (seqLen = 8, numSequences = 50) => {
        const sequences = [];
        const targets = [];

        for (let i = 0; i < numSequences; i++) {
            const vals = [];
            for (let t = 0; t < seqLen; t++) {
                vals.push(Math.random() * 2 - 1);
            }
            const seq = vals.map(v => [v]);
            const sorted = [...vals].sort((a, b) => a - b).map(v => [v]);

            sequences.push(seq);
            targets.push(sorted);
        }

        return { sequences, targets };
    },

    // Pattern matching
    pattern: (seqLen = 12, numSequences = 50) => {
        const sequences = [];
        const targets = [];

        for (let i = 0; i < numSequences; i++) {
            const seq = [];
            const tgt = [];

            for (let t = 0; t < seqLen; t++) {
                const val = Math.sin(t * 0.5 + Math.random() * 0.1);
                seq.push([val]);
                tgt.push([Math.sin((t + 1) * 0.5)]);
            }

            sequences.push(seq);
            targets.push(tgt);
        }

        return { sequences, targets };
    }
};

// Export
window.SelfAttention = SelfAttention;
window.TransformerNetwork = TransformerNetwork;
window.TransformerDatasets = TransformerDatasets;
window.getPositionalEncoding = getPositionalEncoding;
