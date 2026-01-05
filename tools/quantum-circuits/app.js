/**
 * Quantum Circuit Playground - Main Application
 */

class QuantumPlaygroundApp {
    constructor() {
        this.simulator = new QuantumSimulator(2);
        this.circuitRenderer = new CircuitRenderer('circuit-container', (circuit) => this.onCircuitChange(circuit));
        this.blochSphere = new BlochSphere('bloch-canvas');

        this.currentQubit = 0;

        this.initUI();
        this.setupEventListeners();
        this.updateDisplay();
    }

    initUI() {
        // Update qubit selector
        this.updateQubitSelector();
    }

    setupEventListeners() {
        // Add/Remove qubit buttons
        document.getElementById('add-qubit-btn').addEventListener('click', () => {
            const current = this.circuitRenderer.getNumQubits();
            if (current < 5) {
                this.circuitRenderer.setNumQubits(current + 1);
                this.simulator.setNumQubits(current + 1);
                this.updateQubitSelector();
                this.updateQubitCount();
            }
        });

        document.getElementById('remove-qubit-btn').addEventListener('click', () => {
            const current = this.circuitRenderer.getNumQubits();
            if (current > 1) {
                this.circuitRenderer.setNumQubits(current - 1);
                this.simulator.setNumQubits(current - 1);
                this.updateQubitSelector();
                this.updateQubitCount();
            }
        });

        // Clear circuit
        document.getElementById('clear-circuit-btn').addEventListener('click', () => {
            this.circuitRenderer.clear();
            this.simulator.reset();
            this.updateDisplay();
        });

        // Run simulation
        document.getElementById('run-circuit-btn').addEventListener('click', () => {
            this.runSimulation();
        });

        // Preset selector
        document.getElementById('preset-select').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadPreset(e.target.value);
                e.target.value = '';
            }
        });

        // Bloch qubit selector
        document.getElementById('bloch-qubit-select').addEventListener('change', (e) => {
            this.currentQubit = parseInt(e.target.value);
            this.updateBlochSphere();
        });

        // Gate info on hover
        document.querySelectorAll('.gate-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                this.showGateInfo(item.dataset.gate);
            });
            item.addEventListener('mouseleave', () => {
                this.hideGateInfo();
            });
        });

        // Display toggles
        document.getElementById('show-amplitudes').addEventListener('change', () => this.updateDisplay());
        document.getElementById('show-phases').addEventListener('change', () => this.updateDisplay());
    }

    onCircuitChange(circuit) {
        this.updateCircuitDepth();
        // Auto-simulate on change
        this.runSimulation();
    }

    runSimulation() {
        const circuit = this.circuitRenderer.getCircuitForSimulation();
        this.simulator.setNumQubits(this.circuitRenderer.getNumQubits());
        const state = this.simulator.simulate(circuit);

        this.displayState(state);
        this.updateBlochSphere();

        // Perform measurement
        const result = this.simulator.measure();
        this.displayMeasurement(result);
    }

    displayState(state) {
        const showAmplitudes = document.getElementById('show-amplitudes').checked;
        const showPhases = document.getElementById('show-phases').checked;

        // Display amplitudes
        const amplitudesContainer = document.getElementById('state-amplitudes');
        amplitudesContainer.innerHTML = '';

        for (const amp of state.amplitudes) {
            if (amp.magnitude < 0.001) continue; // Skip near-zero amplitudes

            const item = document.createElement('div');
            item.className = 'amplitude-item';

            const basis = document.createElement('div');
            basis.className = 'amplitude-basis';
            basis.textContent = amp.basis;
            item.appendChild(basis);

            if (showAmplitudes) {
                const value = document.createElement('div');
                value.className = 'amplitude-value';
                const sign = amp.amplitude.im >= 0 ? '+' : '';
                value.textContent = `${amp.amplitude.re.toFixed(3)}${sign}${amp.amplitude.im.toFixed(3)}i`;
                item.appendChild(value);
            }

            if (showPhases && amp.magnitude > 0.001) {
                const phase = document.createElement('div');
                phase.className = 'amplitude-phase';
                phase.textContent = `φ = ${(amp.phase * 180 / Math.PI).toFixed(1)}°`;
                item.appendChild(phase);
            }

            amplitudesContainer.appendChild(item);
        }

        // Display probabilities
        const probContainer = document.getElementById('prob-bars');
        probContainer.innerHTML = '';

        for (const prob of state.probabilities) {
            const item = document.createElement('div');
            item.className = 'prob-bar-item';

            const label = document.createElement('div');
            label.className = 'prob-label';
            label.textContent = prob.state;

            const track = document.createElement('div');
            track.className = 'prob-bar-track';

            const fill = document.createElement('div');
            fill.className = 'prob-bar-fill';
            fill.style.width = `${prob.probability * 100}%`;
            track.appendChild(fill);

            const value = document.createElement('div');
            value.className = 'prob-value';
            value.textContent = `${(prob.probability * 100).toFixed(1)}%`;

            item.appendChild(label);
            item.appendChild(track);
            item.appendChild(value);
            probContainer.appendChild(item);
        }
    }

    displayMeasurement(result) {
        const container = document.getElementById('measurement-result');
        container.innerHTML = `<span class="result-value">|${result}⟩</span>`;
    }

    updateBlochSphere() {
        const coords = this.simulator.getBlochCoordinates(this.currentQubit);
        this.blochSphere.setState(coords.x, coords.y, coords.z);
    }

    updateQubitSelector() {
        const select = document.getElementById('bloch-qubit-select');
        const numQubits = this.circuitRenderer.getNumQubits();

        select.innerHTML = '';
        for (let i = 0; i < numQubits; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Qubit ${i}`;
            select.appendChild(option);
        }

        // Reset current qubit if out of range
        if (this.currentQubit >= numQubits) {
            this.currentQubit = 0;
        }
        select.value = this.currentQubit;
    }

    updateQubitCount() {
        document.getElementById('qubit-count').textContent = this.circuitRenderer.getNumQubits();
    }

    updateCircuitDepth() {
        document.getElementById('circuit-depth').textContent = this.circuitRenderer.getCircuitDepth();
    }

    updateDisplay() {
        this.runSimulation();
    }

    loadPreset(preset) {
        this.circuitRenderer.loadPreset(preset);
        this.simulator.setNumQubits(this.circuitRenderer.getNumQubits());
        this.updateQubitSelector();
        this.updateQubitCount();
        this.runSimulation();
    }

    showGateInfo(gateType) {
        const container = document.getElementById('gate-info');
        const gate = QuantumSimulator.GATES[gateType];

        if (!gate) {
            // Handle multi-qubit gates
            const multiGates = {
                CNOT: {
                    name: 'Controlled-NOT',
                    description: 'Flips target qubit if control is |1⟩. Creates entanglement.',
                    matrix: '|00⟩→|00⟩, |01⟩→|01⟩\n|10⟩→|11⟩, |11⟩→|10⟩'
                },
                SWAP: {
                    name: 'SWAP Gate',
                    description: 'Swaps the states of two qubits.',
                    matrix: '|00⟩→|00⟩, |01⟩→|10⟩\n|10⟩→|01⟩, |11⟩→|11⟩'
                },
                CZ: {
                    name: 'Controlled-Z',
                    description: 'Applies Z to target if control is |1⟩.',
                    matrix: '|00⟩→|00⟩, |01⟩→|01⟩\n|10⟩→|10⟩, |11⟩→-|11⟩'
                },
                M: {
                    name: 'Measurement',
                    description: 'Measures the qubit in the computational basis, collapsing to |0⟩ or |1⟩.',
                    matrix: 'Collapses superposition'
                }
            };

            const info = multiGates[gateType];
            if (info) {
                container.innerHTML = `
                    <h4>${info.name}</h4>
                    <p>${info.description}</p>
                    <div class="gate-matrix">${info.matrix}</div>
                `;
            }
            return;
        }

        container.innerHTML = `
            <h4>${gate.name}</h4>
            <p>${gate.description}</p>
            <div class="gate-matrix">${this.formatMatrix(gate.matrix)}</div>
        `;
    }

    formatMatrix(matrix) {
        const rows = matrix.map(row =>
            row.map(c => this.formatComplex(c)).join('  ')
        );
        return '[ ' + rows[0] + ' ]\n[ ' + rows[1] + ' ]';
    }

    formatComplex(c) {
        if (Math.abs(c.im) < 0.001) {
            return c.re.toFixed(2).padStart(5);
        }
        if (Math.abs(c.re) < 0.001) {
            return `${c.im.toFixed(2)}i`.padStart(5);
        }
        const sign = c.im >= 0 ? '+' : '';
        return `${c.re.toFixed(1)}${sign}${c.im.toFixed(1)}i`;
    }

    hideGateInfo() {
        document.getElementById('gate-info').innerHTML = '<p class="muted">Hover over a gate to see details</p>';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QuantumPlaygroundApp();
});
