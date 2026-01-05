/**
 * Operator Engine - Computational Logic for All Operator Types
 * Defines operators, their matrix representations, and computation helpers
 */

const OPERATORS = {
    arithmetic: {
        id: 'arithmetic',
        name: 'Arithmetic Operators',
        description: 'Linear operations with direct matrix representations',
        field: 'ℝ',
        operators: {
            addition: {
                id: 'addition',
                name: 'Addition',
                symbol: '+',
                formula: 'a + b',
                isLinear: true,
                inputCount: 2,
                inputs: [
                    { name: 'a', label: 'A', default: 5 },
                    { name: 'b', label: 'B', default: 3 }
                ],
                getMatrixForm: (inputs) => ({
                    matrix: [[1, 1]],
                    vector: [[inputs.a], [inputs.b]],
                    result: [[inputs.a + inputs.b]]
                }),
                compute: (inputs) => inputs.a + inputs.b,
                theory: {
                    title: 'Addition as Matrix Multiplication',
                    content: `Addition of two numbers can be expressed as a 1×2 matrix multiplying a 2×1 vector.`,
                    matrixNotation: `[1  1] × [a] = [a + b]
        [b]`
                }
            },
            subtraction: {
                id: 'subtraction',
                name: 'Subtraction',
                symbol: '−',
                formula: 'a − b',
                isLinear: true,
                inputCount: 2,
                inputs: [
                    { name: 'a', label: 'A', default: 8 },
                    { name: 'b', label: 'B', default: 3 }
                ],
                getMatrixForm: (inputs) => ({
                    matrix: [[1, -1]],
                    vector: [[inputs.a], [inputs.b]],
                    result: [[inputs.a - inputs.b]]
                }),
                compute: (inputs) => inputs.a - inputs.b,
                theory: {
                    title: 'Subtraction as Matrix Multiplication',
                    content: `Subtraction uses the same structure as addition, but with a negative coefficient for the second element.`,
                    matrixNotation: `[1  -1] × [a] = [a - b]
         [b]`
                }
            },
            scalar_multiply: {
                id: 'scalar_multiply',
                name: 'Scalar Multiplication',
                symbol: '×c',
                formula: 'c × a',
                isLinear: true,
                inputCount: 2,
                inputs: [
                    { name: 'c', label: 'Scalar c', default: 3 },
                    { name: 'a', label: 'Value a', default: 7 }
                ],
                getMatrixForm: (inputs) => ({
                    matrix: [[inputs.c]],
                    vector: [[inputs.a]],
                    result: [[inputs.c * inputs.a]]
                }),
                compute: (inputs) => inputs.c * inputs.a,
                theory: {
                    title: 'Scalar Multiplication',
                    content: `Multiplying by a scalar c is a 1×1 matrix operation. The matrix contains just the scalar value.`,
                    matrixNotation: `[c] × [a] = [c × a]`
                }
            },
            linear_combo: {
                id: 'linear_combo',
                name: 'Linear Combination',
                symbol: 'Σ',
                formula: 'αa + βb + γc',
                isLinear: true,
                inputCount: 6,
                inputs: [
                    { name: 'alpha', label: 'α', default: 2 },
                    { name: 'a', label: 'a', default: 3 },
                    { name: 'beta', label: 'β', default: -1 },
                    { name: 'b', label: 'b', default: 4 },
                    { name: 'gamma', label: 'γ', default: 0.5 },
                    { name: 'c', label: 'c', default: 6 }
                ],
                getMatrixForm: (inputs) => ({
                    matrix: [[inputs.alpha, inputs.beta, inputs.gamma]],
                    vector: [[inputs.a], [inputs.b], [inputs.c]],
                    result: [[inputs.alpha * inputs.a + inputs.beta * inputs.b + inputs.gamma * inputs.c]]
                }),
                compute: (inputs) => inputs.alpha * inputs.a + inputs.beta * inputs.b + inputs.gamma * inputs.c,
                theory: {
                    title: 'Linear Combination',
                    content: `Any linear combination of values can be expressed as matrix multiplication. The coefficients form the matrix row.`,
                    matrixNotation: `[α  β  γ] × [a]   [αa + βb + γc]
          [b] = 
          [c]`
                }
            }
        }
    },

    affine: {
        id: 'affine',
        name: 'Affine Transforms',
        description: 'Homogeneous coordinates turn affine → linear',
        field: 'ℝⁿ⁺¹',
        operators: {
            translation_1d: {
                id: 'translation_1d',
                name: '1D Translation',
                symbol: '+b',
                formula: 'x + b',
                isLinear: false,
                isAffine: true,
                usesHomogeneous: true,
                inputCount: 2,
                inputs: [
                    { name: 'x', label: 'Value x', default: 5 },
                    { name: 'b', label: 'Translate b', default: 3 }
                ],
                getMatrixForm: (inputs) => {
                    // In homogeneous coordinates: [x, 1] → [x + b, 1]
                    // Matrix: [[1, b], [0, 1]]
                    const x = inputs.x;
                    const b = inputs.b;
                    return {
                        isHomogeneous: true,
                        matrix: [[1, b], [0, 1]],
                        vector: [[x], [1]],
                        result: [[x + b], [1]],
                        originalDim: 1,
                        augmentedDim: 2
                    };
                },
                compute: (inputs) => inputs.x + inputs.b,
                theory: {
                    title: 'Translation via Homogeneous Coordinates',
                    content: `Translation (adding a constant) is NOT linear because f(0) ≠ 0. But using homogeneous coordinates, we can express it as matrix multiplication!

The trick: Augment x with a 1 → [x, 1]ᵀ. Now translation becomes linear in the augmented space.`,
                    matrixNotation: `Standard form (affine):
  y = x + b

Homogeneous form (linear):
┌ 1  b ┐   ┌ x ┐   ┌ x + b ┐
└ 0  1 ┘ × └ 1 ┘ = └   1   ┘

The extra "1" carries the translation!`
                }
            },
            linear_affine: {
                id: 'linear_affine',
                name: 'y = mx + b',
                symbol: 'mx+b',
                formula: 'y = mx + b',
                isLinear: false,
                isAffine: true,
                usesHomogeneous: true,
                inputCount: 3,
                inputs: [
                    { name: 'm', label: 'Slope m', default: 2 },
                    { name: 'x', label: 'Value x', default: 4 },
                    { name: 'b', label: 'Intercept b', default: 3 }
                ],
                getMatrixForm: (inputs) => {
                    const m = inputs.m;
                    const x = inputs.x;
                    const b = inputs.b;
                    return {
                        isHomogeneous: true,
                        matrix: [[m, b], [0, 1]],
                        vector: [[x], [1]],
                        result: [[m * x + b], [1]],
                        originalDim: 1,
                        augmentedDim: 2
                    };
                },
                compute: (inputs) => inputs.m * inputs.x + inputs.b,
                theory: {
                    title: 'Linear Equation as Matrix',
                    content: `The classic equation y = mx + b combines scaling (m) and translation (b). This is affine, not linear.

Using homogeneous coordinates, both operations combine into a single matrix multiplication!`,
                    matrixNotation: `Standard form (affine):
  y = mx + b

Homogeneous form (linear):
┌ m  b ┐   ┌ x ┐   ┌ mx + b ┐
└ 0  1 ┘ × └ 1 ┘ = └   1    ┘

Composition: scale by m, then translate by b`
                }
            },
            translation_2d: {
                id: 'translation_2d',
                name: '2D Translation',
                symbol: 'T₂',
                formula: '(x,y) → (x+a, y+b)',
                isLinear: false,
                isAffine: true,
                usesHomogeneous: true,
                inputCount: 4,
                inputs: [
                    { name: 'x', label: 'x', default: 3 },
                    { name: 'y', label: 'y', default: 2 },
                    { name: 'tx', label: 'Translate x', default: 5 },
                    { name: 'ty', label: 'Translate y', default: -1 }
                ],
                getMatrixForm: (inputs) => {
                    return {
                        isHomogeneous: true,
                        matrix: [
                            [1, 0, inputs.tx],
                            [0, 1, inputs.ty],
                            [0, 0, 1]
                        ],
                        vector: [[inputs.x], [inputs.y], [1]],
                        result: [[inputs.x + inputs.tx], [inputs.y + inputs.ty], [1]],
                        originalDim: 2,
                        augmentedDim: 3
                    };
                },
                compute: (inputs) => ({ x: inputs.x + inputs.tx, y: inputs.y + inputs.ty }),
                theory: {
                    title: '2D Translation in 3D Homogeneous Space',
                    content: `To translate a 2D point, we embed it in 3D homogeneous coordinates: (x, y) → (x, y, 1).

The translation vector (tₓ, tᵧ) appears in the last column of a 3×3 matrix.`,
                    matrixNotation: `Homogeneous 2D translation:

┌ 1  0  tₓ ┐   ┌ x ┐   ┌ x + tₓ ┐
│ 0  1  tᵧ │ × │ y │ = │ y + tᵧ │
└ 0  0  1  ┘   └ 1 ┘   └   1    ┘

Used in: computer graphics, robotics, CV`
                }
            },
            rotation_2d: {
                id: 'rotation_2d',
                name: '2D Rotation',
                symbol: 'R₂',
                formula: 'Rotate by θ',
                isLinear: true,
                usesHomogeneous: true,
                inputCount: 3,
                inputs: [
                    { name: 'x', label: 'x', default: 1 },
                    { name: 'y', label: 'y', default: 0 },
                    { name: 'theta', label: 'Angle θ (deg)', default: 45 }
                ],
                getMatrixForm: (inputs) => {
                    const rad = inputs.theta * Math.PI / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);
                    return {
                        isHomogeneous: true,
                        matrix: [
                            [cos, -sin, 0],
                            [sin, cos, 0],
                            [0, 0, 1]
                        ],
                        vector: [[inputs.x], [inputs.y], [1]],
                        result: [
                            [cos * inputs.x - sin * inputs.y],
                            [sin * inputs.x + cos * inputs.y],
                            [1]
                        ],
                        originalDim: 2,
                        augmentedDim: 3
                    };
                },
                compute: (inputs) => {
                    const rad = inputs.theta * Math.PI / 180;
                    return {
                        x: Math.cos(rad) * inputs.x - Math.sin(rad) * inputs.y,
                        y: Math.sin(rad) * inputs.x + Math.cos(rad) * inputs.y
                    };
                },
                theory: {
                    title: '2D Rotation Matrix',
                    content: `Rotation IS linear (no translation), but we show it in homogeneous form for composability with translations.

The rotation matrix uses cos(θ) and sin(θ) to rotate a point around the origin.`,
                    matrixNotation: `2D Rotation by θ:

┌ cos(θ)  -sin(θ)  0 ┐   ┌ x ┐
│ sin(θ)   cos(θ)  0 │ × │ y │
└   0        0     1 ┘   └ 1 ┘

For θ = 90°: (1, 0) → (0, 1)`
                }
            },
            not_homogeneous: {
                id: 'not_homogeneous',
                name: 'NOT (Homogeneous)',
                symbol: '~ₕ',
                formula: '~a = a ⊕ 1',
                isLinear: true,  // Linear in homogeneous space!
                usesHomogeneous: true,
                inputCount: 1,
                inputs: [
                    { name: 'a', label: 'Bit a', default: 0, min: 0, max: 1 }
                ],
                getMatrixForm: (inputs) => {
                    // NOT in GF(2) with homogeneous coordinates
                    // ~a = a + 1 (mod 2) in augmented form:
                    // [1 1] × [a] = [a + 1] (mod 2)
                    //         [1]   
                    const a = inputs.a % 2;
                    const result = (a + 1) % 2;
                    return {
                        isHomogeneous: true,
                        isGF2: true,
                        matrix: [[1, 1], [0, 1]],
                        vector: [[a], [1]],
                        result: [[result], [1]],
                        originalDim: 1,
                        augmentedDim: 2
                    };
                },
                compute: (inputs) => (inputs.a + 1) % 2,
                theory: {
                    title: 'NOT as Linear in Homogeneous GF(2)',
                    content: `The NOT operation (~a = a ⊕ 1) is affine in standard form. But in homogeneous coordinates over GF(2), it becomes LINEAR!

By augmenting with a constant 1, the "add 1" becomes part of the matrix.`,
                    matrixNotation: `Standard (affine in GF(2)):
  ~a = a ⊕ 1

Homogeneous (linear):
┌ 1  1 ┐   ┌ a ┐   ┌ a ⊕ 1 ┐
└ 0  1 ┘ × └ 1 ┘ = └   1   ┘ (mod 2)

Now NOT is pure matrix multiplication! ✓`
                }
            }
        }
    },

    bitwise: {
        id: 'bitwise',
        name: 'Bitwise Operators',
        description: 'Operations in binary field GF(2)',
        field: 'GF(2)',
        operators: {
            xor: {
                id: 'xor',
                name: 'XOR',
                symbol: '⊕',
                formula: 'a ⊕ b',
                isLinear: true,
                inputCount: 2,
                inputs: [
                    { name: 'a', label: 'A', default: 5, isBinary: true },
                    { name: 'b', label: 'B', default: 3, isBinary: true }
                ],
                getMatrixForm: (inputs, bitWidth = 8) => {
                    const aBits = numberToBits(inputs.a, bitWidth);
                    const bBits = numberToBits(inputs.b, bitWidth);
                    const resultBits = aBits.map((bit, i) => (bit + bBits[i]) % 2);

                    // In GF(2), XOR is addition: result = a + b (mod 2)
                    // For each bit position, it's an identity operation on both inputs
                    const n = bitWidth;
                    const matrix = [];
                    for (let i = 0; i < n; i++) {
                        const row = new Array(n * 2).fill(0);
                        row[i] = 1;      // Coefficient for a's bit
                        row[n + i] = 1;  // Coefficient for b's bit
                        matrix.push(row);
                    }

                    const vector = [...aBits, ...bBits].map(b => [b]);
                    const result = resultBits.map(b => [b]);

                    return { matrix, vector, result, bitWidth, aBits, bBits, resultBits };
                },
                compute: (inputs) => inputs.a ^ inputs.b,
                theory: {
                    title: 'XOR as Linear Operation in GF(2)',
                    content: `XOR is addition in the binary field GF(2). Each bit is computed as (aᵢ + bᵢ) mod 2, making it a linear operation over bits.`,
                    matrixNotation: `In GF(2): a ⊕ b = a + b (mod 2)

For each bit position i:
resultᵢ = aᵢ + bᵢ (mod 2)`
                }
            },
            left_shift: {
                id: 'left_shift',
                name: 'Left Shift',
                symbol: '<<',
                formula: 'a << n',
                isLinear: true,
                inputCount: 2,
                inputs: [
                    { name: 'a', label: 'Value', default: 5, isBinary: true },
                    { name: 'n', label: 'Shift by', default: 2, min: 0, max: 7 }
                ],
                getMatrixForm: (inputs, bitWidth = 8) => {
                    const aBits = numberToBits(inputs.a, bitWidth);
                    const shiftAmount = Math.min(inputs.n, bitWidth);

                    // Create shift matrix
                    const matrix = [];
                    for (let i = 0; i < bitWidth; i++) {
                        const row = new Array(bitWidth).fill(0);
                        if (i >= shiftAmount) {
                            row[i - shiftAmount] = 1;
                        }
                        matrix.push(row);
                    }

                    const vector = aBits.map(b => [b]);
                    const resultBits = multiplyMatrixVector(matrix, aBits);
                    const result = resultBits.map(b => [b]);

                    return { matrix, vector, result, bitWidth, aBits, resultBits };
                },
                compute: (inputs, bitWidth = 8) => (inputs.a << inputs.n) & ((1 << bitWidth) - 1),
                theory: {
                    title: 'Left Shift as Permutation Matrix',
                    content: `Left shift is a linear transformation represented by a shift matrix. Each row has a single 1 that "pulls" a bit from a lower position.`,
                    matrixNotation: `For << 1 (4-bit):
┌ 0 0 0 0 ┐   ┌ b₀ ┐   ┌  0 ┐
│ 1 0 0 0 │ × │ b₁ │ = │ b₀ │
│ 0 1 0 0 │   │ b₂ │   │ b₁ │
└ 0 0 1 0 ┘   └ b₃ ┘   └ b₂ ┘`
                }
            },
            right_shift: {
                id: 'right_shift',
                name: 'Right Shift',
                symbol: '>>',
                formula: 'a >> n',
                isLinear: true,
                inputCount: 2,
                inputs: [
                    { name: 'a', label: 'Value', default: 20, isBinary: true },
                    { name: 'n', label: 'Shift by', default: 2, min: 0, max: 7 }
                ],
                getMatrixForm: (inputs, bitWidth = 8) => {
                    const aBits = numberToBits(inputs.a, bitWidth);
                    const shiftAmount = Math.min(inputs.n, bitWidth);

                    // Create shift matrix
                    const matrix = [];
                    for (let i = 0; i < bitWidth; i++) {
                        const row = new Array(bitWidth).fill(0);
                        if (i + shiftAmount < bitWidth) {
                            row[i + shiftAmount] = 1;
                        }
                        matrix.push(row);
                    }

                    const vector = aBits.map(b => [b]);
                    const resultBits = multiplyMatrixVector(matrix, aBits);
                    const result = resultBits.map(b => [b]);

                    return { matrix, vector, result, bitWidth, aBits, resultBits };
                },
                compute: (inputs) => inputs.a >> inputs.n,
                theory: {
                    title: 'Right Shift as Permutation Matrix',
                    content: `Right shift is the transpose operation of left shift. The matrix moves bits to lower positions.`,
                    matrixNotation: `For >> 1 (4-bit):
┌ 0 1 0 0 ┐   ┌ b₀ ┐   ┌ b₁ ┐
│ 0 0 1 0 │ × │ b₁ │ = │ b₂ │
│ 0 0 0 1 │   │ b₂ │   │ b₃ │
└ 0 0 0 0 ┘   └ b₃ ┘   └  0 ┘`
                }
            },
            bitwise_not: {
                id: 'bitwise_not',
                name: 'NOT (Bitwise)',
                symbol: '~',
                formula: '~a',
                isLinear: false,
                isAffine: true,
                inputCount: 1,
                inputs: [
                    { name: 'a', label: 'Value', default: 5, isBinary: true }
                ],
                getMatrixForm: (inputs, bitWidth = 8) => {
                    const aBits = numberToBits(inputs.a, bitWidth);

                    // NOT is affine: ~a = 1 + a (mod 2) = I×a + 1
                    const matrix = [];
                    for (let i = 0; i < bitWidth; i++) {
                        const row = new Array(bitWidth).fill(0);
                        row[i] = 1;  // Identity matrix
                        matrix.push(row);
                    }

                    const constant = new Array(bitWidth).fill(1);  // Add 1 to each bit
                    const vector = aBits.map(b => [b]);
                    const resultBits = aBits.map((b, i) => (b + constant[i]) % 2);
                    const result = resultBits.map(b => [b]);

                    return { matrix, vector, result, constant, bitWidth, aBits, resultBits, isAffine: true };
                },
                compute: (inputs, bitWidth = 8) => (~inputs.a) & ((1 << bitWidth) - 1),
                theory: {
                    title: 'NOT as Affine Transformation',
                    content: `NOT is not purely linear—it's affine (linear + constant). In GF(2): ~a = a ⊕ 1, which means each bit is XORed with 1.`,
                    matrixNotation: `~a = I × a + 1 (mod 2)

┌ 1 0 0 0 ┐   ┌ a₀ ┐   ┌ 1 ┐
│ 0 1 0 0 │ × │ a₁ │ + │ 1 │ (mod 2)
│ 0 0 1 0 │   │ a₂ │   │ 1 │
└ 0 0 0 1 ┘   └ a₃ ┘   └ 1 ┘`
                }
            }
        }
    },

    nonlinear: {
        id: 'nonlinear',
        name: 'Nonlinear Workarounds',
        description: 'Creative approaches for nonlinear operations',
        field: 'ℝ+',
        operators: {
            multiplication: {
                id: 'multiplication',
                name: 'Multiplication',
                symbol: '×',
                formula: 'a × b',
                isLinear: false,
                workaround: 'logarithmic',
                inputCount: 2,
                inputs: [
                    { name: 'a', label: 'A', default: 4, min: 0.1 },
                    { name: 'b', label: 'B', default: 5, min: 0.1 }
                ],
                getMatrixForm: (inputs) => {
                    const logA = Math.log(inputs.a);
                    const logB = Math.log(inputs.b);
                    const logResult = logA + logB;
                    const result = Math.exp(logResult);

                    return {
                        steps: [
                            { name: 'log(a)', value: logA, matrix: null },
                            { name: 'log(b)', value: logB, matrix: null },
                            {
                                name: 'log(a) + log(b)',
                                value: logResult,
                                matrix: [[1, 1]],
                                vector: [[logA], [logB]],
                                result: [[logResult]]
                            },
                            { name: 'exp(result)', value: result, matrix: null }
                        ],
                        finalMatrix: [[1, 1]],
                        finalVector: [[logA], [logB]],
                        finalResult: [[logResult]],
                        actualResult: result
                    };
                },
                compute: (inputs) => inputs.a * inputs.b,
                theory: {
                    title: 'Multiplication via Logarithms',
                    content: `Multiplication is bilinear, not linear. However, using logarithms, we can convert it to addition:
                    
log(a × b) = log(a) + log(b)

This makes the core operation linear in log-space!`,
                    matrixNotation: `Step 1: Transform to log-space
  log(a), log(b)

Step 2: Linear addition
  [1  1] × [log(a)] = [log(a × b)]
          [log(b)]

Step 3: Transform back
  exp(log(a × b)) = a × b`
                }
            },
            division: {
                id: 'division',
                name: 'Division',
                symbol: '÷',
                formula: 'a ÷ b',
                isLinear: false,
                workaround: 'logarithmic',
                inputCount: 2,
                inputs: [
                    { name: 'a', label: 'A', default: 20, min: 0.1 },
                    { name: 'b', label: 'B', default: 4, min: 0.1 }
                ],
                getMatrixForm: (inputs) => {
                    const logA = Math.log(inputs.a);
                    const logB = Math.log(inputs.b);
                    const logResult = logA - logB;
                    const result = Math.exp(logResult);

                    return {
                        steps: [
                            { name: 'log(a)', value: logA, matrix: null },
                            { name: 'log(b)', value: logB, matrix: null },
                            {
                                name: 'log(a) - log(b)',
                                value: logResult,
                                matrix: [[1, -1]],
                                vector: [[logA], [logB]],
                                result: [[logResult]]
                            },
                            { name: 'exp(result)', value: result, matrix: null }
                        ],
                        finalMatrix: [[1, -1]],
                        finalVector: [[logA], [logB]],
                        finalResult: [[logResult]],
                        actualResult: result
                    };
                },
                compute: (inputs) => inputs.a / inputs.b,
                theory: {
                    title: 'Division via Logarithms',
                    content: `Like multiplication, division can be linearized with logarithms:
                    
log(a ÷ b) = log(a) − log(b)

The subtraction matrix [1, -1] does the work in log-space.`,
                    matrixNotation: `Step 1: Transform to log-space
  log(a), log(b)

Step 2: Linear subtraction
  [1  -1] × [log(a)] = [log(a ÷ b)]
           [log(b)]

Step 3: Transform back
  exp(log(a ÷ b)) = a ÷ b`
                }
            },
            bitwise_and: {
                id: 'bitwise_and',
                name: 'AND (Bitwise)',
                symbol: '&',
                formula: 'a & b',
                isLinear: false,
                workaround: 'pointwise',
                inputCount: 2,
                inputs: [
                    { name: 'a', label: 'A', default: 12, isBinary: true },
                    { name: 'b', label: 'B', default: 10, isBinary: true }
                ],
                getMatrixForm: (inputs, bitWidth = 8) => {
                    const aBits = numberToBits(inputs.a, bitWidth);
                    const bBits = numberToBits(inputs.b, bitWidth);
                    const resultBits = aBits.map((bit, i) => bit * bBits[i]);

                    // AND is multiplication in GF(2), shown as pointwise
                    return {
                        aBits,
                        bBits,
                        resultBits,
                        bitWidth,
                        isPointwise: true,
                        operation: '×',
                        result: [[bitsToNumber(resultBits)]]
                    };
                },
                compute: (inputs) => inputs.a & inputs.b,
                theory: {
                    title: 'AND is NOT Linear',
                    content: `AND is multiplication in GF(2). Unlike XOR, this is NOT a linear operation—it's bilinear.
                    
For each bit: resultᵢ = aᵢ × bᵢ

There's no single matrix that works for all input pairs because the operation depends on both inputs multiplicatively.`,
                    matrixNotation: `❌ No general matrix form exists

For each bit position:
  aᵢ AND bᵢ = aᵢ × bᵢ (in GF(2))

This is multiplication, not addition,
so it cannot be expressed as Ax = b.`
                }
            },
            bitwise_or: {
                id: 'bitwise_or',
                name: 'OR (Bitwise)',
                symbol: '|',
                formula: 'a | b',
                isLinear: false,
                workaround: 'composed',
                inputCount: 2,
                inputs: [
                    { name: 'a', label: 'A', default: 12, isBinary: true },
                    { name: 'b', label: 'B', default: 10, isBinary: true }
                ],
                getMatrixForm: (inputs, bitWidth = 8) => {
                    const aBits = numberToBits(inputs.a, bitWidth);
                    const bBits = numberToBits(inputs.b, bitWidth);
                    const xorBits = aBits.map((bit, i) => (bit + bBits[i]) % 2);
                    const andBits = aBits.map((bit, i) => bit * bBits[i]);
                    const resultBits = xorBits.map((bit, i) => (bit + andBits[i]) % 2);

                    return {
                        aBits,
                        bBits,
                        xorBits,
                        andBits,
                        resultBits,
                        bitWidth,
                        isComposed: true,
                        steps: [
                            { name: 'a XOR b', bits: xorBits },
                            { name: 'a AND b', bits: andBits },
                            { name: '(a XOR b) XOR (a AND b)', bits: resultBits }
                        ],
                        result: [[bitsToNumber(resultBits)]]
                    };
                },
                compute: (inputs) => inputs.a | inputs.b,
                theory: {
                    title: 'OR as a Composition',
                    content: `OR can be expressed using XOR and AND:
                    
a OR b = (a XOR b) XOR (a AND b)

Since AND is nonlinear, OR is also nonlinear. However, this decomposition shows how it relates to the linear XOR operation.`,
                    matrixNotation: `In GF(2):
a | b = a + b + ab

Decomposed:
  Step 1: a ⊕ b    (linear)
  Step 2: a & b    (nonlinear)
  Step 3: XOR results (linear)

The AND step breaks linearity.`
                }
            }
        }
    }
};

// ============================================
// Helper Functions
// ============================================

/**
 * Convert a number to an array of bits (LSB first)
 */
function numberToBits(num, bitWidth) {
    const bits = [];
    for (let i = 0; i < bitWidth; i++) {
        bits.push((num >> i) & 1);
    }
    return bits;
}

/**
 * Convert an array of bits (LSB first) to a number
 */
function bitsToNumber(bits) {
    let num = 0;
    for (let i = 0; i < bits.length; i++) {
        if (bits[i]) {
            num |= (1 << i);
        }
    }
    return num;
}

/**
 * Multiply a matrix by a vector (for bit operations, all mod 2)
 */
function multiplyMatrixVector(matrix, vector, modulo = null) {
    const result = [];
    for (let i = 0; i < matrix.length; i++) {
        let sum = 0;
        for (let j = 0; j < vector.length; j++) {
            sum += matrix[i][j] * vector[j];
        }
        if (modulo !== null) {
            sum = sum % modulo;
        }
        result.push(sum);
    }
    return result;
}

/**
 * Format a number for display
 */
function formatNumber(num, precision = 4) {
    if (Number.isInteger(num)) {
        return num.toString();
    }
    return num.toFixed(precision).replace(/\.?0+$/, '');
}

/**
 * Format bits for display
 */
function formatBits(bits, groupSize = 4) {
    const reversed = [...bits].reverse();
    let str = '';
    for (let i = 0; i < reversed.length; i++) {
        if (i > 0 && i % groupSize === 0) str += ' ';
        str += reversed[i];
    }
    return str;
}

/**
 * Get all operators flat list
 */
function getAllOperators() {
    const all = [];
    for (const category of Object.values(OPERATORS)) {
        for (const op of Object.values(category.operators)) {
            all.push({ ...op, category: category.id, categoryName: category.name });
        }
    }
    return all;
}

/**
 * Get operator by category and id
 */
function getOperator(categoryId, operatorId) {
    return OPERATORS[categoryId]?.operators[operatorId] || null;
}

/**
 * Get category by id
 */
function getCategory(categoryId) {
    return OPERATORS[categoryId] || null;
}

// Export for use in other modules
window.OPERATORS = OPERATORS;
window.OperatorEngine = {
    numberToBits,
    bitsToNumber,
    multiplyMatrixVector,
    formatNumber,
    formatBits,
    getAllOperators,
    getOperator,
    getCategory
};
