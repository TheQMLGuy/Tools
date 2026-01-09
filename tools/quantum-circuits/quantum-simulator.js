/**
 * Quantum Circuit Simulator
 * Simulates quantum circuits using state vector formalism
 */

class QuantumSimulator {
    constructor(numQubits = 2) {
        this.numQubits = numQubits;
        this.stateVector = null;
        this.reset();
    }

    reset() {
        // Initialize to |0...0⟩ state
        const size = Math.pow(2, this.numQubits);
        this.stateVector = new Array(size).fill(null).map(() => ({ re: 0, im: 0 }));
        this.stateVector[0] = { re: 1, im: 0 };
    }

    setNumQubits(n) {
        this.numQubits = n;
        this.reset();
    }

    // Complex number operations
    complexMul(a, b) {
        return {
            re: a.re * b.re - a.im * b.im,
            im: a.re * b.im + a.im * b.re
        };
    }

    complexAdd(a, b) {
        return { re: a.re + b.re, im: a.im + b.im };
    }

    complexScale(c, scalar) {
        return { re: c.re * scalar, im: c.im * scalar };
    }

    complexMagnitude(c) {
        return Math.sqrt(c.re * c.re + c.im * c.im);
    }

    complexPhase(c) {
        return Math.atan2(c.im, c.re);
    }

    // Gate matrices (as 2x2 complex matrices)
    static GATES = {
        H: {
            name: 'Hadamard',
            matrix: [
                [{ re: 1 / Math.sqrt(2), im: 0 }, { re: 1 / Math.sqrt(2), im: 0 }],
                [{ re: 1 / Math.sqrt(2), im: 0 }, { re: -1 / Math.sqrt(2), im: 0 }]
            ],
            description: 'Creates superposition. Transforms |0⟩ to (|0⟩+|1⟩)/√2',
            latex: '\\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & 1 \\\\ 1 & -1 \\end{pmatrix}'
        },
        X: {
            name: 'Pauli-X',
            matrix: [
                [{ re: 0, im: 0 }, { re: 1, im: 0 }],
                [{ re: 1, im: 0 }, { re: 0, im: 0 }]
            ],
            description: 'Bit flip (NOT gate). Swaps |0⟩ and |1⟩',
            latex: '\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}'
        },
        Y: {
            name: 'Pauli-Y',
            matrix: [
                [{ re: 0, im: 0 }, { re: 0, im: -1 }],
                [{ re: 0, im: 1 }, { re: 0, im: 0 }]
            ],
            description: 'Rotation around Y-axis. Y = iXZ',
            latex: '\\begin{pmatrix} 0 & -i \\\\ i & 0 \\end{pmatrix}'
        },
        Z: {
            name: 'Pauli-Z',
            matrix: [
                [{ re: 1, im: 0 }, { re: 0, im: 0 }],
                [{ re: 0, im: 0 }, { re: -1, im: 0 }]
            ],
            description: 'Phase flip. Leaves |0⟩ unchanged, flips sign of |1⟩',
            latex: '\\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}'
        },
        S: {
            name: 'S Gate',
            matrix: [
                [{ re: 1, im: 0 }, { re: 0, im: 0 }],
                [{ re: 0, im: 0 }, { re: 0, im: 1 }]
            ],
            description: 'π/2 phase gate. S² = Z',
            latex: '\\begin{pmatrix} 1 & 0 \\\\ 0 & i \\end{pmatrix}'
        },
        T: {
            name: 'T Gate',
            matrix: [
                [{ re: 1, im: 0 }, { re: 0, im: 0 }],
                [{ re: 0, im: 0 }, { re: Math.cos(Math.PI / 4), im: Math.sin(Math.PI / 4) }]
            ],
            description: 'π/4 phase gate. T² = S',
            latex: '\\begin{pmatrix} 1 & 0 \\\\ 0 & e^{i\\pi/4} \\end{pmatrix}'
        },
        I: {
            name: 'Identity',
            matrix: [
                [{ re: 1, im: 0 }, { re: 0, im: 0 }],
                [{ re: 0, im: 0 }, { re: 1, im: 0 }]
            ],
            description: 'Identity gate. No operation.',
            latex: '\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}'
        }
    };

    // Apply single-qubit gate
    applySingleQubitGate(gateType, targetQubit) {
        const gate = QuantumSimulator.GATES[gateType];
        if (!gate) return;

        const n = this.numQubits;
        const size = Math.pow(2, n);
        const newState = new Array(size).fill(null).map(() => ({ re: 0, im: 0 }));

        for (let i = 0; i < size; i++) {
            // Get the bit value at targetQubit position
            const bit = (i >> targetQubit) & 1;

            // Calculate the index with flipped qubit
            const flippedIndex = i ^ (1 << targetQubit);

            // Apply gate matrix
            if (bit === 0) {
                // |0⟩ component
                newState[i] = this.complexAdd(
                    newState[i],
                    this.complexMul(gate.matrix[0][0], this.stateVector[i])
                );
                newState[flippedIndex] = this.complexAdd(
                    newState[flippedIndex],
                    this.complexMul(gate.matrix[1][0], this.stateVector[i])
                );
            } else {
                // |1⟩ component
                const i0 = i ^ (1 << targetQubit); // index with bit=0
                newState[i0] = this.complexAdd(
                    newState[i0],
                    this.complexMul(gate.matrix[0][1], this.stateVector[i])
                );
                newState[i] = this.complexAdd(
                    newState[i],
                    this.complexMul(gate.matrix[1][1], this.stateVector[i])
                );
            }
        }

        this.stateVector = newState;
    }

    // Apply CNOT gate
    applyCNOT(controlQubit, targetQubit) {
        const size = Math.pow(2, this.numQubits);
        const newState = [...this.stateVector];

        for (let i = 0; i < size; i++) {
            const controlBit = (i >> controlQubit) & 1;
            const targetBit = (i >> targetQubit) & 1;

            if (controlBit === 1) {
                // Flip target qubit
                const flippedIndex = i ^ (1 << targetQubit);
                newState[i] = this.stateVector[flippedIndex];
            }
        }

        this.stateVector = newState;
    }

    // Apply SWAP gate
    applySWAP(qubit1, qubit2) {
        const size = Math.pow(2, this.numQubits);
        const newState = [...this.stateVector];

        for (let i = 0; i < size; i++) {
            const bit1 = (i >> qubit1) & 1;
            const bit2 = (i >> qubit2) & 1;

            if (bit1 !== bit2) {
                // Swap these bits
                const swappedIndex = i ^ (1 << qubit1) ^ (1 << qubit2);
                if (i < swappedIndex) {
                    newState[i] = this.stateVector[swappedIndex];
                    newState[swappedIndex] = this.stateVector[i];
                }
            }
        }

        this.stateVector = newState;
    }

    // Apply CZ gate
    applyCZ(controlQubit, targetQubit) {
        const size = Math.pow(2, this.numQubits);

        for (let i = 0; i < size; i++) {
            const controlBit = (i >> controlQubit) & 1;
            const targetBit = (i >> targetQubit) & 1;

            if (controlBit === 1 && targetBit === 1) {
                // Apply phase flip
                this.stateVector[i] = this.complexScale(this.stateVector[i], -1);
            }
        }
    }

    // Apply QFT (Quantum Fourier Transform) on all qubits
    applyQFT() {
        const n = this.numQubits;

        for (let i = 0; i < n; i++) {
            // Apply Hadamard to qubit i
            this.applySingleQubitGate('H', i);

            // Apply controlled rotations
            for (let j = i + 1; j < n; j++) {
                const k = j - i + 1;
                this.applyControlledPhase(j, i, Math.PI / Math.pow(2, k));
            }
        }

        // Swap qubits to reverse order
        for (let i = 0; i < Math.floor(n / 2); i++) {
            this.applySWAP(i, n - 1 - i);
        }
    }

    // Apply inverse QFT
    applyIQFT() {
        const n = this.numQubits;

        // Swap qubits to reverse order first
        for (let i = 0; i < Math.floor(n / 2); i++) {
            this.applySWAP(i, n - 1 - i);
        }

        for (let i = n - 1; i >= 0; i--) {
            // Apply inverse controlled rotations
            for (let j = n - 1; j > i; j--) {
                const k = j - i + 1;
                this.applyControlledPhase(j, i, -Math.PI / Math.pow(2, k));
            }
            // Apply Hadamard
            this.applySingleQubitGate('H', i);
        }
    }

    // Apply controlled phase rotation
    applyControlledPhase(controlQubit, targetQubit, angle) {
        const size = Math.pow(2, this.numQubits);
        const phase = { re: Math.cos(angle), im: Math.sin(angle) };

        for (let i = 0; i < size; i++) {
            const controlBit = (i >> controlQubit) & 1;
            const targetBit = (i >> targetQubit) & 1;

            if (controlBit === 1 && targetBit === 1) {
                this.stateVector[i] = this.complexMul(this.stateVector[i], phase);
            }
        }
    }

    // Apply a gate from circuit
    applyGate(gate) {
        if (['H', 'X', 'Y', 'Z', 'S', 'T', 'I'].includes(gate.type)) {
            this.applySingleQubitGate(gate.type, gate.qubit);
        } else if (gate.type === 'CNOT') {
            this.applyCNOT(gate.control, gate.target);
        } else if (gate.type === 'SWAP') {
            this.applySWAP(gate.qubit1, gate.qubit2);
        } else if (gate.type === 'CZ') {
            this.applyCZ(gate.control, gate.target);
        } else if (gate.type === 'QFT') {
            this.applyQFT();
        } else if (gate.type === 'IQFT') {
            this.applyIQFT();
        }
        // M (measurement) is handled separately
    }

    // Simulate entire circuit with optional initial states
    simulate(circuit, initialStates = null) {
        this.reset();

        // Apply initial states if provided
        if (initialStates && initialStates.length > 0) {
            this.applyInitialStates(initialStates);
        }

        for (const gate of circuit) {
            if (gate.type !== 'M') {
                this.applyGate(gate);
            }
        }

        return this.getState();
    }

    // Apply initial states to each qubit
    // States: '0' = |0⟩, '1' = |1⟩, '+' = |+⟩, '-' = |-⟩, 'i' = |i⟩, '-i' = |-i⟩
    applyInitialStates(initialStates) {
        for (let q = 0; q < Math.min(initialStates.length, this.numQubits); q++) {
            const state = initialStates[q];

            switch (state) {
                case '1':
                    // Apply X to flip to |1⟩
                    this.applySingleQubitGate('X', q);
                    break;
                case '+':
                    // Apply H to get |+⟩
                    this.applySingleQubitGate('H', q);
                    break;
                case '-':
                    // Apply X then H to get |-⟩
                    this.applySingleQubitGate('X', q);
                    this.applySingleQubitGate('H', q);
                    break;
                case 'i':
                    // H then S to get |i⟩ = (|0⟩ + i|1⟩)/√2
                    this.applySingleQubitGate('H', q);
                    this.applySingleQubitGate('S', q);
                    break;
                case '-i':
                    // H then S† (Z then S) to get |-i⟩ = (|0⟩ - i|1⟩)/√2
                    this.applySingleQubitGate('H', q);
                    this.applySingleQubitGate('Z', q);
                    this.applySingleQubitGate('S', q);
                    break;
                case '0':
                default:
                    // Already in |0⟩, do nothing
                    break;
            }
        }
    }

    // Get current state info
    getState() {
        const size = Math.pow(2, this.numQubits);
        const amplitudes = [];
        const probabilities = [];

        for (let i = 0; i < size; i++) {
            const amp = this.stateVector[i];
            const mag = this.complexMagnitude(amp);
            const phase = this.complexPhase(amp);
            const prob = mag * mag;

            // Create basis state string with q0 leftmost (reversed from standard binary)
            const bitStr = i.toString(2).padStart(this.numQubits, '0');
            const reversedBits = bitStr.split('').reverse().join('');
            const basisState = '|' + reversedBits + '⟩';

            amplitudes.push({
                basis: basisState,
                amplitude: amp,
                magnitude: mag,
                phase: phase,
                probability: prob
            });

            probabilities.push({
                state: basisState,
                probability: prob
            });
        }

        return { amplitudes, probabilities };
    }

    // Get Bloch sphere coordinates for a single qubit
    getBlochCoordinates(qubitIndex) {
        // Calculate reduced density matrix for this qubit
        const size = Math.pow(2, this.numQubits);
        let rho00 = { re: 0, im: 0 };
        let rho01 = { re: 0, im: 0 };
        let rho10 = { re: 0, im: 0 };
        let rho11 = { re: 0, im: 0 };

        for (let i = 0; i < size; i++) {
            const bit = (i >> qubitIndex) & 1;
            const amp = this.stateVector[i];
            const conjAmp = { re: amp.re, im: -amp.im };

            for (let j = 0; j < size; j++) {
                // Check if states differ only in the qubit of interest
                if ((i ^ j) === 0 || (i ^ j) === (1 << qubitIndex)) {
                    const jBit = (j >> qubitIndex) & 1;

                    // Only consider states that are same except for target qubit
                    if ((i & ~(1 << qubitIndex)) === (j & ~(1 << qubitIndex))) {
                        const ampJ = this.stateVector[j];
                        const product = this.complexMul(amp, { re: ampJ.re, im: -ampJ.im });

                        if (bit === 0 && jBit === 0) rho00 = this.complexAdd(rho00, product);
                        if (bit === 0 && jBit === 1) rho01 = this.complexAdd(rho01, product);
                        if (bit === 1 && jBit === 0) rho10 = this.complexAdd(rho10, product);
                        if (bit === 1 && jBit === 1) rho11 = this.complexAdd(rho11, product);
                    }
                }
            }
        }

        // Bloch vector from density matrix: (x, y, z) = (2*Re(rho01), 2*Im(rho01), rho00 - rho11)
        const x = 2 * rho01.re;
        const y = 2 * rho01.im;
        const z = rho00.re - rho11.re;

        return { x, y, z };
    }

    // Perform measurement (collapse state)
    measure() {
        const state = this.getState();
        const rand = Math.random();
        let cumulative = 0;

        for (let i = 0; i < state.probabilities.length; i++) {
            cumulative += state.probabilities[i].probability;
            if (rand < cumulative) {
                return state.probabilities[i].state.replace('|', '').replace('⟩', '');
            }
        }

        return state.probabilities[state.probabilities.length - 1].state.replace('|', '').replace('⟩', '');
    }
}

// Export for use
window.QuantumSimulator = QuantumSimulator;
