/**
 * Neural Network Engine
 * Complete implementation with multiple activation functions and optimizers
 */

// ============================================
// ACTIVATION FUNCTIONS
// ============================================

const ActivationFunctions = {
    sigmoid: {
        fn: (x) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))),
        derivative: (x, output) => output * (1 - output)
    },

    tanh: {
        fn: (x) => Math.tanh(x),
        derivative: (x, output) => 1 - output * output
    },

    relu: {
        fn: (x) => Math.max(0, x),
        derivative: (x, output) => x > 0 ? 1 : 0
    },

    leaky_relu: {
        fn: (x) => x > 0 ? x : 0.01 * x,
        derivative: (x, output) => x > 0 ? 1 : 0.01
    },

    elu: {
        fn: (x) => x > 0 ? x : 1.0 * (Math.exp(x) - 1),
        derivative: (x, output) => x > 0 ? 1 : output + 1.0
    },

    swish: {
        fn: (x) => {
            const sig = 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
            return x * sig;
        },
        derivative: (x, output) => {
            const sig = 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
            return sig + x * sig * (1 - sig);
        }
    },

    linear: {
        fn: (x) => x,
        derivative: (x, output) => 1
    },

    // New activations
    gelu: {
        fn: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x))),
        derivative: (x, output) => {
            const cdf = 0.5 * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)));
            const pdf = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
            return cdf + x * pdf;
        }
    },

    selu: {
        fn: (x) => {
            const alpha = 1.6732632423543772;
            const scale = 1.0507009873554805;
            return scale * (x > 0 ? x : alpha * (Math.exp(x) - 1));
        },
        derivative: (x, output) => {
            const alpha = 1.6732632423543772;
            const scale = 1.0507009873554805;
            return scale * (x > 0 ? 1 : alpha * Math.exp(x));
        }
    },

    mish: {
        fn: (x) => x * Math.tanh(Math.log(1 + Math.exp(x))),
        derivative: (x, output) => {
            const sp = Math.log(1 + Math.exp(x));
            const tsp = Math.tanh(sp);
            const sig = 1 / (1 + Math.exp(-x));
            return tsp + x * sig * (1 - tsp * tsp);
        }
    },

    softplus: {
        fn: (x) => Math.log(1 + Math.exp(Math.min(20, x))),
        derivative: (x, output) => 1 / (1 + Math.exp(-x))
    },

    softsign: {
        fn: (x) => x / (1 + Math.abs(x)),
        derivative: (x, output) => 1 / Math.pow(1 + Math.abs(x), 2)
    },

    prelu: {
        fn: (x) => x > 0 ? x : 0.25 * x, // alpha = 0.25
        derivative: (x, output) => x > 0 ? 1 : 0.25
    },

    celu: {
        fn: (x) => x > 0 ? x : 1.0 * (Math.exp(x / 1.0) - 1),
        derivative: (x, output) => x > 0 ? 1 : Math.exp(x / 1.0)
    }
};

// ============================================
// LOSS FUNCTIONS
// ============================================

const LossFunctions = {
    mse: {
        name: 'Mean Squared Error',
        fn: (predicted, target) => (predicted - target) ** 2,
        derivative: (predicted, target) => 2 * (predicted - target)
    },
    mae: {
        name: 'Mean Absolute Error',
        fn: (predicted, target) => Math.abs(predicted - target),
        derivative: (predicted, target) => predicted > target ? 1 : -1
    },
    huber: {
        name: 'Huber Loss',
        fn: (predicted, target) => {
            const delta = 1.0;
            const error = Math.abs(predicted - target);
            return error <= delta
                ? 0.5 * error * error
                : delta * (error - 0.5 * delta);
        },
        derivative: (predicted, target) => {
            const delta = 1.0;
            const error = predicted - target;
            return Math.abs(error) <= delta
                ? error
                : delta * Math.sign(error);
        }
    },
    log_cosh: {
        name: 'Log-Cosh Loss',
        fn: (predicted, target) => Math.log(Math.cosh(predicted - target)),
        derivative: (predicted, target) => Math.tanh(predicted - target)
    },
    quantile: {
        name: 'Quantile Loss (0.5)',
        fn: (predicted, target) => {
            const q = 0.5;
            const error = target - predicted;
            return error >= 0 ? q * error : (q - 1) * error;
        },
        derivative: (predicted, target) => {
            const q = 0.5;
            return target >= predicted ? -q : (1 - q);
        }
    },
    smooth_l1: {
        name: 'Smooth L1',
        fn: (predicted, target) => {
            const error = Math.abs(predicted - target);
            return error < 1 ? 0.5 * error * error : error - 0.5;
        },
        derivative: (predicted, target) => {
            const error = predicted - target;
            return Math.abs(error) < 1 ? error : Math.sign(error);
        }
    }
};

// ============================================
// WEIGHT INITIALIZATION METHODS
// ============================================

const WeightInitializers = {
    xavier: {
        name: 'Xavier/Glorot',
        init: (inputSize, outputSize) => {
            const limit = Math.sqrt(6 / (inputSize + outputSize));
            return (Math.random() * 2 - 1) * limit;
        }
    },
    he: {
        name: 'He (for ReLU)',
        init: (inputSize, outputSize) => {
            const std = Math.sqrt(2 / inputSize);
            return (Math.random() * 2 - 1) * std;
        }
    },
    lecun: {
        name: 'LeCun',
        init: (inputSize, outputSize) => {
            const std = Math.sqrt(1 / inputSize);
            return (Math.random() * 2 - 1) * std;
        }
    },
    uniform: {
        name: 'Uniform [-1, 1]',
        init: (inputSize, outputSize) => Math.random() * 2 - 1
    },
    normal: {
        name: 'Normal (0, 0.1)',
        init: (inputSize, outputSize) => {
            // Box-Muller transform
            const u1 = Math.random();
            const u2 = Math.random();
            return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 0.1;
        }
    },
    zeros: {
        name: 'Zeros',
        init: (inputSize, outputSize) => 0
    },
    ones: {
        name: 'Ones',
        init: (inputSize, outputSize) => 1
    },
    small_random: {
        name: 'Small Random',
        init: (inputSize, outputSize) => (Math.random() * 0.2 - 0.1)
    }
};

// ============================================
// OPTIMIZERS
// ============================================

class Optimizer {
    constructor(learningRate) {
        this.learningRate = learningRate;
    }

    initialize(weights, biases) {
        // Override in subclasses
    }

    update(weights, biases, weightGradients, biasGradients, layerIndex) {
        // Override in subclasses
    }
}

class SGD extends Optimizer {
    update(weights, biases, weightGradients, biasGradients, layerIndex) {
        for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < weights[i].length; j++) {
                weights[i][j] -= this.learningRate * weightGradients[i][j];
            }
        }
        for (let i = 0; i < biases.length; i++) {
            biases[i] -= this.learningRate * biasGradients[i];
        }
    }
}

class Momentum extends Optimizer {
    constructor(learningRate, momentum = 0.9) {
        super(learningRate);
        this.momentum = momentum;
        this.velocityW = [];
        this.velocityB = [];
    }

    initialize(network) {
        this.velocityW = [];
        this.velocityB = [];
        for (let l = 0; l < network.weights.length; l++) {
            this.velocityW.push(network.weights[l].map(row => row.map(() => 0)));
            this.velocityB.push(network.biases[l].map(() => 0));
        }
    }

    update(weights, biases, weightGradients, biasGradients, layerIndex) {
        for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < weights[i].length; j++) {
                this.velocityW[layerIndex][i][j] =
                    this.momentum * this.velocityW[layerIndex][i][j] -
                    this.learningRate * weightGradients[i][j];
                weights[i][j] += this.velocityW[layerIndex][i][j];
            }
        }
        for (let i = 0; i < biases.length; i++) {
            this.velocityB[layerIndex][i] =
                this.momentum * this.velocityB[layerIndex][i] -
                this.learningRate * biasGradients[i];
            biases[i] += this.velocityB[layerIndex][i];
        }
    }
}

class RMSprop extends Optimizer {
    constructor(learningRate, decay = 0.999, epsilon = 1e-8) {
        super(learningRate);
        this.decay = decay;
        this.epsilon = epsilon;
        this.cacheW = [];
        this.cacheB = [];
    }

    initialize(network) {
        this.cacheW = [];
        this.cacheB = [];
        for (let l = 0; l < network.weights.length; l++) {
            this.cacheW.push(network.weights[l].map(row => row.map(() => 0)));
            this.cacheB.push(network.biases[l].map(() => 0));
        }
    }

    update(weights, biases, weightGradients, biasGradients, layerIndex) {
        for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < weights[i].length; j++) {
                this.cacheW[layerIndex][i][j] =
                    this.decay * this.cacheW[layerIndex][i][j] +
                    (1 - this.decay) * weightGradients[i][j] * weightGradients[i][j];
                weights[i][j] -= this.learningRate * weightGradients[i][j] /
                    (Math.sqrt(this.cacheW[layerIndex][i][j]) + this.epsilon);
            }
        }
        for (let i = 0; i < biases.length; i++) {
            this.cacheB[layerIndex][i] =
                this.decay * this.cacheB[layerIndex][i] +
                (1 - this.decay) * biasGradients[i] * biasGradients[i];
            biases[i] -= this.learningRate * biasGradients[i] /
                (Math.sqrt(this.cacheB[layerIndex][i]) + this.epsilon);
        }
    }
}

class Adam extends Optimizer {
    constructor(learningRate, beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8) {
        super(learningRate);
        this.beta1 = beta1;
        this.beta2 = beta2;
        this.epsilon = epsilon;
        this.mW = [];
        this.vW = [];
        this.mB = [];
        this.vB = [];
        this.t = 0;
    }

    initialize(network) {
        this.mW = [];
        this.vW = [];
        this.mB = [];
        this.vB = [];
        this.t = 0;
        for (let l = 0; l < network.weights.length; l++) {
            this.mW.push(network.weights[l].map(row => row.map(() => 0)));
            this.vW.push(network.weights[l].map(row => row.map(() => 0)));
            this.mB.push(network.biases[l].map(() => 0));
            this.vB.push(network.biases[l].map(() => 0));
        }
    }

    update(weights, biases, weightGradients, biasGradients, layerIndex) {
        if (layerIndex === 0) this.t++;

        const beta1Corr = 1 - Math.pow(this.beta1, this.t);
        const beta2Corr = 1 - Math.pow(this.beta2, this.t);

        for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < weights[i].length; j++) {
                this.mW[layerIndex][i][j] =
                    this.beta1 * this.mW[layerIndex][i][j] +
                    (1 - this.beta1) * weightGradients[i][j];
                this.vW[layerIndex][i][j] =
                    this.beta2 * this.vW[layerIndex][i][j] +
                    (1 - this.beta2) * weightGradients[i][j] * weightGradients[i][j];

                const mHat = this.mW[layerIndex][i][j] / beta1Corr;
                const vHat = this.vW[layerIndex][i][j] / beta2Corr;

                weights[i][j] -= this.learningRate * mHat / (Math.sqrt(vHat) + this.epsilon);
            }
        }
        for (let i = 0; i < biases.length; i++) {
            this.mB[layerIndex][i] =
                this.beta1 * this.mB[layerIndex][i] +
                (1 - this.beta1) * biasGradients[i];
            this.vB[layerIndex][i] =
                this.beta2 * this.vB[layerIndex][i] +
                (1 - this.beta2) * biasGradients[i] * biasGradients[i];

            const mHat = this.mB[layerIndex][i] / beta1Corr;
            const vHat = this.vB[layerIndex][i] / beta2Corr;

            biases[i] -= this.learningRate * mHat / (Math.sqrt(vHat) + this.epsilon);
        }
    }
}

class AdaGrad extends Optimizer {
    constructor(learningRate, epsilon = 1e-8) {
        super(learningRate);
        this.epsilon = epsilon;
        this.cacheW = [];
        this.cacheB = [];
    }

    initialize(network) {
        this.cacheW = [];
        this.cacheB = [];
        for (let l = 0; l < network.weights.length; l++) {
            this.cacheW.push(network.weights[l].map(row => row.map(() => 0)));
            this.cacheB.push(network.biases[l].map(() => 0));
        }
    }

    update(weights, biases, weightGradients, biasGradients, layerIndex) {
        for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < weights[i].length; j++) {
                this.cacheW[layerIndex][i][j] += weightGradients[i][j] * weightGradients[i][j];
                weights[i][j] -= this.learningRate * weightGradients[i][j] /
                    (Math.sqrt(this.cacheW[layerIndex][i][j]) + this.epsilon);
            }
        }
        for (let i = 0; i < biases.length; i++) {
            this.cacheB[layerIndex][i] += biasGradients[i] * biasGradients[i];
            biases[i] -= this.learningRate * biasGradients[i] /
                (Math.sqrt(this.cacheB[layerIndex][i]) + this.epsilon);
        }
    }
}

class Nadam extends Optimizer {
    constructor(learningRate, beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8) {
        super(learningRate);
        this.beta1 = beta1;
        this.beta2 = beta2;
        this.epsilon = epsilon;
        this.mW = [];
        this.vW = [];
        this.mB = [];
        this.vB = [];
        this.t = 0;
    }

    initialize(network) {
        this.mW = [];
        this.vW = [];
        this.mB = [];
        this.vB = [];
        this.t = 0;
        for (let l = 0; l < network.weights.length; l++) {
            this.mW.push(network.weights[l].map(row => row.map(() => 0)));
            this.vW.push(network.weights[l].map(row => row.map(() => 0)));
            this.mB.push(network.biases[l].map(() => 0));
            this.vB.push(network.biases[l].map(() => 0));
        }
    }

    update(weights, biases, weightGradients, biasGradients, layerIndex) {
        if (layerIndex === 0) this.t++;

        const beta1Corr = 1 - Math.pow(this.beta1, this.t);
        const beta2Corr = 1 - Math.pow(this.beta2, this.t);

        for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < weights[i].length; j++) {
                this.mW[layerIndex][i][j] =
                    this.beta1 * this.mW[layerIndex][i][j] +
                    (1 - this.beta1) * weightGradients[i][j];
                this.vW[layerIndex][i][j] =
                    this.beta2 * this.vW[layerIndex][i][j] +
                    (1 - this.beta2) * weightGradients[i][j] * weightGradients[i][j];

                const mHat = this.mW[layerIndex][i][j] / beta1Corr;
                const vHat = this.vW[layerIndex][i][j] / beta2Corr;

                // Nadam: incorporates Nesterov momentum
                const mNesterov = this.beta1 * mHat +
                    (1 - this.beta1) * weightGradients[i][j] / beta1Corr;

                weights[i][j] -= this.learningRate * mNesterov / (Math.sqrt(vHat) + this.epsilon);
            }
        }
        for (let i = 0; i < biases.length; i++) {
            this.mB[layerIndex][i] =
                this.beta1 * this.mB[layerIndex][i] +
                (1 - this.beta1) * biasGradients[i];
            this.vB[layerIndex][i] =
                this.beta2 * this.vB[layerIndex][i] +
                (1 - this.beta2) * biasGradients[i] * biasGradients[i];

            const mHat = this.mB[layerIndex][i] / beta1Corr;
            const vHat = this.vB[layerIndex][i] / beta2Corr;

            const mNesterov = this.beta1 * mHat +
                (1 - this.beta1) * biasGradients[i] / beta1Corr;

            biases[i] -= this.learningRate * mNesterov / (Math.sqrt(vHat) + this.epsilon);
        }
    }
}

// Optimizer factory
const Optimizers = {
    sgd: (lr) => new SGD(lr),
    momentum: (lr) => new Momentum(lr),
    rmsprop: (lr) => new RMSprop(lr),
    adam: (lr) => new Adam(lr),
    adagrad: (lr) => new AdaGrad(lr),
    nadam: (lr) => new Nadam(lr)
};

// ============================================
// TARGET FUNCTIONS (100+ functions)
// ============================================

const TargetFunctions = {
    // === BASIC TRIGONOMETRIC ===
    sine: (x) => Math.sin(x * Math.PI),
    cosine: (x) => Math.cos(x * Math.PI),
    tangent: (x) => Math.tanh(Math.tan(x * Math.PI * 0.4)), // Bounded tangent
    sine2x: (x) => Math.sin(2 * x * Math.PI),
    sine3x: (x) => Math.sin(3 * x * Math.PI),
    sine4x: (x) => Math.sin(4 * x * Math.PI),
    cosine2x: (x) => Math.cos(2 * x * Math.PI),
    cosine3x: (x) => Math.cos(3 * x * Math.PI),
    sine_half: (x) => Math.sin(x * Math.PI * 0.5),
    cosine_half: (x) => Math.cos(x * Math.PI * 0.5),

    // === POLYNOMIALS ===
    linear: (x) => x,
    quadratic: (x) => x * x,
    cubic: (x) => x * x * x,
    quartic: (x) => x * x * x * x,
    quintic: (x) => x * x * x * x * x,
    x_minus_x3: (x) => x - x * x * x,
    x2_minus_x: (x) => x * x - x,
    parabola_inv: (x) => 1 - x * x,
    parabola_shifted: (x) => (x - 0.5) * (x - 0.5),
    double_parabola: (x) => 4 * x * x * (1 - x * x),

    // === SPECIAL FUNCTIONS ===
    absolute: (x) => Math.abs(x),
    step: (x) => x > 0 ? 1 : 0,
    sign: (x) => x > 0 ? 1 : (x < 0 ? -1 : 0),
    relu_like: (x) => Math.max(0, x),
    leaky: (x) => x > 0 ? x : 0.1 * x,
    softplus: (x) => Math.log(1 + Math.exp(x * 3)) / 3,
    sigmoid_like: (x) => 1 / (1 + Math.exp(-5 * x)),
    tanh_like: (x) => Math.tanh(2 * x),

    // === GAUSSIAN FAMILY ===
    gaussian: (x) => Math.exp(-x * x * 2),
    gaussian_wide: (x) => Math.exp(-x * x * 0.5),
    gaussian_narrow: (x) => Math.exp(-x * x * 8),
    gaussian_shifted_r: (x) => Math.exp(-(x - 0.5) * (x - 0.5) * 4),
    gaussian_shifted_l: (x) => Math.exp(-(x + 0.5) * (x + 0.5) * 4),
    double_gaussian: (x) => Math.exp(-(x - 0.5) * (x - 0.5) * 8) + Math.exp(-(x + 0.5) * (x + 0.5) * 8),
    inv_gaussian: (x) => 1 - Math.exp(-x * x * 4),
    mexican_hat: (x) => (1 - 4 * x * x) * Math.exp(-2 * x * x),

    // === WAVE COMBINATIONS ===
    sine_plus_cos: (x) => (Math.sin(x * Math.PI) + Math.cos(x * Math.PI)) / 1.5,
    sine_times_cos: (x) => Math.sin(x * Math.PI) * Math.cos(x * Math.PI),
    sine_squared: (x) => Math.sin(x * Math.PI) ** 2,
    cosine_squared: (x) => Math.cos(x * Math.PI) ** 2,
    beat: (x) => Math.sin(3 * x * Math.PI) * Math.cos(x * Math.PI * 0.5),
    harmonic_2: (x) => Math.sin(x * Math.PI) + 0.5 * Math.sin(2 * x * Math.PI),
    harmonic_3: (x) => Math.sin(x * Math.PI) + 0.3 * Math.sin(3 * x * Math.PI),
    sawtooth: (x) => 2 * (x - Math.floor(x + 0.5)),
    triangle: (x) => 2 * Math.abs(2 * (x * 0.5 - Math.floor(x * 0.5 + 0.5))) - 1,
    square_wave: (x) => Math.sign(Math.sin(x * Math.PI * 2)),

    // === EXPONENTIAL FAMILY ===
    exp_decay: (x) => Math.exp(-Math.abs(x) * 3),
    exp_rise: (x) => 1 - Math.exp(-Math.abs(x) * 3),
    double_exp: (x) => Math.exp(-Math.abs(x) * 2) - 0.5,
    sinh_like: (x) => Math.sinh(x) / 2,
    cosh_like: (x) => (Math.cosh(x) - 1) / 2,
    logistic: (x) => 2 / (1 + Math.exp(-3 * x)) - 1,

    // === RATIONAL FUNCTIONS ===
    reciprocal: (x) => 1 / (1 + x * x * 4),
    lorentzian: (x) => 1 / (1 + 10 * x * x),
    witch: (x) => 1 / (1 + x * x), // Witch of Agnesi
    bump: (x) => Math.abs(x) < 1 ? Math.exp(-1 / (1 - x * x)) : 0,

    // === ASYMMETRIC FUNCTIONS ===
    ramp_right: (x) => x > 0 ? x : 0,
    ramp_left: (x) => x < 0 ? -x : 0,
    half_sine_r: (x) => x > 0 ? Math.sin(x * Math.PI) : 0,
    half_sine_l: (x) => x < 0 ? Math.sin(-x * Math.PI) : 0,
    skewed_gauss: (x) => Math.exp(-x * x * 2) * (1 + 0.5 * x),
    asymm_peak: (x) => x > 0 ? Math.exp(-x * 2) : Math.exp(x * 4),

    // === THRESHOLD/STEP VARIANTS ===
    smooth_step: (x) => x < -0.5 ? 0 : (x > 0.5 ? 1 : 0.5 + x),
    double_step: (x) => (x < -0.5 ? -1 : (x > 0.5 ? 1 : 0)),
    staircase_3: (x) => Math.floor(x * 3 + 1.5) / 2,
    staircase_5: (x) => Math.floor(x * 5 + 2.5) / 3,
    soft_threshold: (x) => Math.tanh(5 * x),

    // === OSCILLATORY ===
    damped_sine: (x) => Math.exp(-Math.abs(x) * 2) * Math.sin(x * Math.PI * 4),
    damped_cos: (x) => Math.exp(-Math.abs(x) * 2) * Math.cos(x * Math.PI * 4),
    growing_sine: (x) => x * Math.sin(x * Math.PI * 3),
    chirp: (x) => Math.sin(x * x * Math.PI * 5),
    modulated: (x) => Math.sin(x * Math.PI * 3) * (0.5 + 0.5 * Math.cos(x * Math.PI)),

    // === COMPLEX COMBINATIONS ===
    sinc: (x) => x === 0 ? 1 : Math.sin(x * Math.PI * 3) / (x * Math.PI * 3),
    gabor: (x) => Math.exp(-x * x * 4) * Math.cos(x * Math.PI * 4),
    morlet: (x) => Math.exp(-x * x * 2) * Math.cos(x * Math.PI * 5),
    ripple: (x) => Math.sin(x * Math.PI * 4) / (1 + x * x * 4),
    wave_packet: (x) => Math.exp(-x * x * 3) * Math.sin(x * Math.PI * 6),

    // === PEAKS AND VALLEYS ===
    single_peak: (x) => Math.exp(-x * x * 8),
    double_peak: (x) => Math.exp(-((x - 0.5) ** 2) * 10) + Math.exp(-((x + 0.5) ** 2) * 10),
    triple_peak: (x) => Math.exp(-x * x * 20) + 0.5 * Math.exp(-((x - 0.6) ** 2) * 20) + 0.5 * Math.exp(-((x + 0.6) ** 2) * 20),
    single_valley: (x) => 1 - Math.exp(-x * x * 8),
    w_shape: (x) => Math.abs(x * x - 0.25),
    m_shape: (x) => -Math.abs(x * x - 0.25) + 0.5,

    // === SMOOTH TRANSITIONS ===
    erf_like: (x) => Math.tanh(x * 1.7),
    smooth_abs: (x) => Math.sqrt(x * x + 0.01),
    soft_clip: (x) => x / Math.sqrt(1 + x * x),
    cubic_smooth: (x) => x * x * x / (1 + Math.abs(x * x * x)),

    // === POWER FUNCTIONS ===
    sqrt_like: (x) => Math.sign(x) * Math.sqrt(Math.abs(x)),
    cbrt: (x) => Math.cbrt(x),
    fourth_root: (x) => Math.sign(x) * Math.pow(Math.abs(x), 0.25),
    x_pow_1_5: (x) => Math.sign(x) * Math.pow(Math.abs(x), 1.5),

    // === PERIODIC SPECIAL ===
    abs_sine: (x) => Math.abs(Math.sin(x * Math.PI * 2)),
    abs_cosine: (x) => Math.abs(Math.cos(x * Math.PI * 2)),
    rectified_sine: (x) => Math.max(0, Math.sin(x * Math.PI * 2)),
    full_rect_sine: (x) => Math.abs(Math.sin(x * Math.PI)),
    clipped_sine: (x) => Math.max(-0.5, Math.min(0.5, Math.sin(x * Math.PI * 2))),

    // === NOISE-LIKE (deterministic) ===
    zigzag: (x) => 2 * Math.abs(x * 2 - Math.floor(x * 2 + 0.5)) - 0.5,
    folded: (x) => Math.abs(Math.sin(x * Math.PI * 5)),
    interference: (x) => Math.sin(x * Math.PI * 3) + Math.sin(x * Math.PI * 4),

    // === PLATEAU FUNCTIONS ===
    flat_top: (x) => Math.min(1, Math.exp(-x * x * 0.5) * 1.5),
    mesa: (x) => Math.abs(x) < 0.5 ? 1 : Math.exp(-Math.pow(Math.abs(x) - 0.5, 2) * 20),
    trapezoid: (x) => Math.max(0, Math.min(1, 2 - 4 * Math.abs(x))),

    // === BIMODAL ===
    bimodal: (x) => Math.exp(-((x - 0.4) ** 2) * 15) + Math.exp(-((x + 0.4) ** 2) * 15) - 0.5,
    camel: (x) => Math.cos(x * Math.PI) ** 2 * (1 - Math.exp(-x * x * 0.5)),

    // === LOG-BASED ===
    log_like: (x) => Math.sign(x) * Math.log(1 + Math.abs(x) * 3) / 2,
    inverse_log: (x) => x / (1 + Math.log(1 + Math.abs(x) * 3)),
};

// Create category groupings for UI
const TargetFunctionCategories = {
    'Basic Trig': ['sine', 'cosine', 'tangent', 'sine2x', 'sine3x', 'cosine2x'],
    'Polynomials': ['linear', 'quadratic', 'cubic', 'quartic', 'quintic', 'x_minus_x3', 'parabola_inv'],
    'Gaussian': ['gaussian', 'gaussian_wide', 'gaussian_narrow', 'double_gaussian', 'mexican_hat'],
    'Waves': ['harmonic_2', 'harmonic_3', 'beat', 'sawtooth', 'triangle', 'square_wave'],
    'Special': ['step', 'sign', 'sigmoid_like', 'tanh_like', 'softplus', 'sinc'],
    'Peaks': ['single_peak', 'double_peak', 'triple_peak', 'single_valley', 'w_shape', 'm_shape'],
    'Damped': ['damped_sine', 'damped_cos', 'gabor', 'morlet', 'wave_packet'],
    'Complex': ['chirp', 'ripple', 'interference', 'modulated', 'growing_sine']
};

// ============================================
// NEURAL NETWORK CLASS
// ============================================

class NeuralNetwork {
    constructor(layerSizes, activationName = 'sigmoid', optimizerName = 'adam', learningRate = 0.01) {
        this.layerSizes = [...layerSizes];
        this.activationName = activationName;
        this.activation = ActivationFunctions[activationName];
        this.optimizerName = optimizerName;
        this.learningRate = learningRate;

        // Initialize weights and biases
        this.weights = [];
        this.biases = [];
        // Store initial values for comparison
        this.initialWeights = [];
        this.initialBiases = [];
        this.initializeWeights();

        // Create optimizer
        this.optimizer = Optimizers[optimizerName](learningRate);
        this.optimizer.initialize(this);

        // Store activations and pre-activations for visualization
        this.layerOutputs = [];
        this.preActivations = [];

        // Store gradients for visualization
        this.weightGradients = [];
        this.biasGradients = [];

        // Enhanced gradient storage for backprop visualization
        this.deltaValues = [];  // Error signals at each neuron per layer
        this.layerGradientMagnitudes = [];  // Average gradient magnitude per layer
        this.maxGradientMagnitude = 0;  // For normalization

        // Dropout support
        this.dropoutRate = 0;
        this.dropoutMasks = [];  // Boolean masks for each layer
        this.isTraining = true;  // Controls dropout behavior

        // Training stats
        this.epoch = 0;
        this.lossHistory = [];
    }

    initializeWeights() {
        this.weights = [];
        this.biases = [];

        for (let i = 0; i < this.layerSizes.length - 1; i++) {
            const inputSize = this.layerSizes[i];
            const outputSize = this.layerSizes[i + 1];

            // Xavier/Glorot initialization
            const limit = Math.sqrt(6 / (inputSize + outputSize));

            const layerWeights = [];
            for (let j = 0; j < outputSize; j++) {
                const neuronWeights = [];
                for (let k = 0; k < inputSize; k++) {
                    neuronWeights.push((Math.random() * 2 - 1) * limit);
                }
                layerWeights.push(neuronWeights);
            }
            this.weights.push(layerWeights);

            // Initialize biases to small values
            const layerBiases = [];
            for (let j = 0; j < outputSize; j++) {
                layerBiases.push((Math.random() * 0.2 - 0.1));
            }
            this.biases.push(layerBiases);
        }

        // Store initial values (deep copy)
        this.initialWeights = this.weights.map(layer =>
            layer.map(neuron => [...neuron])
        );
        this.initialBiases = this.biases.map(layer => [...layer]);
    }

    forward(input) {
        // Handle both scalar and array inputs
        const inputArray = Array.isArray(input) ? input : [input];

        this.layerOutputs = [inputArray];
        this.preActivations = [];

        // Generate dropout masks if training with dropout
        if (this.isTraining && this.dropoutRate > 0) {
            this.generateDropoutMasks();
        }

        let current = inputArray;

        for (let l = 0; l < this.weights.length; l++) {
            const preAct = [];
            const postAct = [];

            for (let j = 0; j < this.weights[l].length; j++) {
                let sum = this.biases[l][j];
                for (let k = 0; k < current.length; k++) {
                    sum += current[k] * this.weights[l][j][k];
                }
                preAct.push(sum);

                // Use linear activation for output layer
                if (l === this.weights.length - 1) {
                    postAct.push(sum); // Linear output
                } else {
                    let activated = this.activation.fn(sum);

                    // Apply dropout during training (not on output layer)
                    if (this.isTraining && this.dropoutRate > 0 && this.dropoutMasks[l]) {
                        if (this.dropoutMasks[l][j]) {
                            // Neuron is dropped - output 0
                            activated = 0;
                        } else {
                            // Scale output by 1/(1-p) to maintain expected value
                            activated = activated / (1 - this.dropoutRate);
                        }
                    }

                    postAct.push(activated);
                }
            }

            this.preActivations.push(preAct);
            this.layerOutputs.push(postAct);
            current = postAct;
        }

        // Return all outputs (supports multi-output)
        return current;
    }

    // Generate random dropout masks for hidden layers
    generateDropoutMasks() {
        this.dropoutMasks = [];

        // Create masks for hidden layers only (not input or output)
        for (let l = 0; l < this.weights.length - 1; l++) {
            const mask = [];
            for (let j = 0; j < this.weights[l].length; j++) {
                // true = dropped, false = kept
                mask.push(Math.random() < this.dropoutRate);
            }
            this.dropoutMasks.push(mask);
        }
        // No dropout on output layer
        this.dropoutMasks.push(null);
    }

    // Set dropout rate (0 to 0.8)
    setDropoutRate(rate) {
        this.dropoutRate = Math.max(0, Math.min(0.8, rate));
    }

    backward(input, targets) {
        // targets can be a single value or array for multi-output
        const targetArray = Array.isArray(targets) ? targets : [targets];
        const outputs = this.forward(input);

        // Calculate errors for each output
        const errors = outputs.map((out, i) => out - targetArray[i]);

        // Initialize gradient storage
        this.weightGradients = [];
        this.biasGradients = [];

        // Initialize delta storage for backprop visualization
        this.deltaValues = [];
        this.layerGradientMagnitudes = [];

        // Output layer errors (linear output derivative is 1)
        let deltas = errors;

        // Store output layer deltas
        this.deltaValues.push([...deltas]);

        // Backpropagate
        for (let l = this.weights.length - 1; l >= 0; l--) {
            const layerWGrad = [];
            const layerBGrad = [];

            for (let j = 0; j < this.weights[l].length; j++) {
                // Weight gradients
                const neuronWGrad = [];
                for (let k = 0; k < this.weights[l][j].length; k++) {
                    neuronWGrad.push(deltas[j] * this.layerOutputs[l][k]);
                }
                layerWGrad.push(neuronWGrad);

                // Bias gradients
                layerBGrad.push(deltas[j]);
            }

            this.weightGradients.unshift(layerWGrad);
            this.biasGradients.unshift(layerBGrad);

            // Calculate deltas for previous layer
            if (l > 0) {
                const newDeltas = [];
                for (let k = 0; k < this.weights[l][0].length; k++) {
                    let sum = 0;
                    for (let j = 0; j < this.weights[l].length; j++) {
                        sum += deltas[j] * this.weights[l][j][k];
                    }
                    // Apply activation derivative
                    const actDeriv = this.activation.derivative(
                        this.preActivations[l - 1][k],
                        this.layerOutputs[l][k]
                    );
                    newDeltas.push(sum * actDeriv);
                }
                deltas = newDeltas;

                // Store deltas for this layer (for visualization)
                this.deltaValues.unshift([...deltas]);
            }
        }

        // Compute gradient magnitudes per layer for heatmap visualization
        this.maxGradientMagnitude = 0;
        for (let l = 0; l < this.weightGradients.length; l++) {
            let layerSum = 0;
            let count = 0;
            for (let j = 0; j < this.weightGradients[l].length; j++) {
                for (let k = 0; k < this.weightGradients[l][j].length; k++) {
                    const mag = Math.abs(this.weightGradients[l][j][k]);
                    layerSum += mag;
                    count++;
                    if (mag > this.maxGradientMagnitude) {
                        this.maxGradientMagnitude = mag;
                    }
                }
            }
            this.layerGradientMagnitudes.push(count > 0 ? layerSum / count : 0);
        }

        // Update weights using optimizer
        for (let l = 0; l < this.weights.length; l++) {
            this.optimizer.update(
                this.weights[l],
                this.biases[l],
                this.weightGradients[l],
                this.biasGradients[l],
                l
            );
        }

        // Return sum of squared errors
        return errors.reduce((sum, e) => sum + e * e, 0);
    }

    train(inputs, targets) {
        let totalLoss = 0;

        for (let i = 0; i < inputs.length; i++) {
            totalLoss += this.backward(inputs[i], targets[i]);
        }

        const avgLoss = totalLoss / inputs.length;
        this.lossHistory.push(avgLoss);
        this.epoch++;

        return avgLoss;
    }

    predict(input) {
        return this.forward(input);
    }

    // Get number of outputs
    getOutputCount() {
        return this.layerSizes[this.layerSizes.length - 1];
    }

    getWeightStats() {
        let allWeights = [];
        let allGradients = [];

        for (let l = 0; l < this.weights.length; l++) {
            for (let j = 0; j < this.weights[l].length; j++) {
                for (let k = 0; k < this.weights[l][j].length; k++) {
                    allWeights.push(this.weights[l][j][k]);
                    if (this.weightGradients[l]) {
                        allGradients.push(this.weightGradients[l][j][k]);
                    }
                }
            }
        }

        if (allWeights.length === 0) return { min: 0, max: 0, avg: 0, gradientAvg: 0, count: 0 };

        const min = Math.min(...allWeights);
        const max = Math.max(...allWeights);
        const avg = allWeights.reduce((a, b) => a + Math.abs(b), 0) / allWeights.length;
        const gradientAvg = allGradients.length > 0
            ? allGradients.reduce((a, b) => a + Math.abs(b), 0) / allGradients.length
            : 0;

        return { min, max, avg, gradientAvg, count: allWeights.length };
    }

    reset() {
        this.initializeWeights();
        this.optimizer = Optimizers[this.optimizerName](this.learningRate);
        this.optimizer.initialize(this);
        this.epoch = 0;
        this.lossHistory = [];
        this.layerOutputs = [];
        this.preActivations = [];
        this.weightGradients = [];
        this.biasGradients = [];
        this.deltaValues = [];
        this.layerGradientMagnitudes = [];
        this.maxGradientMagnitude = 0;
        this.dropoutMasks = [];
        // Initial values are re-created in initializeWeights
    }

    setActivation(name) {
        this.activationName = name;
        this.activation = ActivationFunctions[name];
    }

    setOptimizer(name, learningRate) {
        this.optimizerName = name;
        this.learningRate = learningRate;
        this.optimizer = Optimizers[name](learningRate);
        this.optimizer.initialize(this);
    }

    // Editing initial values
    setInitialWeight(layerIndex, toNode, fromNode, value) {
        if (this.initialWeights[layerIndex]) {
            this.initialWeights[layerIndex][toNode][fromNode] = value;
        }
    }

    setInitialBias(layerIndex, nodeIndex, value) {
        if (this.initialBiases[layerIndex]) {
            this.initialBiases[layerIndex][nodeIndex] = value;
        }
    }

    // Export model as JSON object
    exportModel() {
        return {
            version: '1.0',
            layerSizes: [...this.layerSizes],
            activationName: this.activationName,
            optimizerName: this.optimizerName,
            learningRate: this.learningRate,
            dropoutRate: this.dropoutRate,
            weights: this.weights.map(layer => layer.map(neuron => [...neuron])),
            biases: this.biases.map(layer => [...layer]),
            initialWeights: this.initialWeights.map(layer => layer.map(neuron => [...neuron])),
            initialBiases: this.initialBiases.map(layer => [...layer]),
            epoch: this.epoch,
            lossHistory: [...this.lossHistory]
        };
    }

    // Import model from JSON object
    static importModel(json) {
        const network = new NeuralNetwork(
            json.layerSizes,
            json.activationName || 'sigmoid',
            json.optimizerName || 'adam',
            json.learningRate || 0.01
        );

        // Restore weights and biases
        network.weights = json.weights.map(layer => layer.map(neuron => [...neuron]));
        network.biases = json.biases.map(layer => [...layer]);

        // Restore initial values if present
        if (json.initialWeights) {
            network.initialWeights = json.initialWeights.map(layer => layer.map(neuron => [...neuron]));
        }
        if (json.initialBiases) {
            network.initialBiases = json.initialBiases.map(layer => [...layer]);
        }

        // Restore training state
        network.epoch = json.epoch || 0;
        network.lossHistory = json.lossHistory ? [...json.lossHistory] : [];
        network.dropoutRate = json.dropoutRate || 0;

        return network;
    }
}

// Export for use in other files
window.NeuralNetwork = NeuralNetwork;
window.ActivationFunctions = ActivationFunctions;
window.LossFunctions = LossFunctions;
window.WeightInitializers = WeightInitializers;
window.TargetFunctions = TargetFunctions;
window.TargetFunctionCategories = TargetFunctionCategories;
window.Optimizers = Optimizers;
