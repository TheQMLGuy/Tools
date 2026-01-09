/**
 * Quantum Circuit Playground - Main Application
 */

class QuantumPlaygroundApp {
    constructor() {
        this.simulator = new QuantumSimulator(2);
        this.circuitRenderer = new CircuitRenderer('circuit-container', (circuit) => this.onCircuitChange(circuit));
        this.blochSpheres = new BlochSphereMulti('bloch-container');

        // Initial states for each qubit
        this.initialStates = ['0', '0'];

        this.initUI();
        this.setupEventListeners();
        this.updateDisplay();
    }

    initUI() {
        this.updateQubitCount();
        this.renderInitialStateSelectors();
    }

    renderInitialStateSelectors() {
        const container = document.getElementById('initial-states-bar');
        if (!container) return;

        const numQubits = this.circuitRenderer.getNumQubits();

        // Ensure initialStates array matches qubit count
        while (this.initialStates.length < numQubits) {
            this.initialStates.push('0');
        }
        this.initialStates = this.initialStates.slice(0, numQubits);

        container.innerHTML = this.initialStates.map((state, i) => `
            <div class="initial-state-item">
                <label>q${i}:</label>
                <select data-qubit="${i}" class="initial-state-select">
                    <option value="0" ${state === '0' ? 'selected' : ''}>|0⟩</option>
                    <option value="1" ${state === '1' ? 'selected' : ''}>|1⟩</option>
                    <option value="+" ${state === '+' ? 'selected' : ''}>|+⟩</option>
                    <option value="-" ${state === '-' ? 'selected' : ''}>|-⟩</option>
                    <option value="i" ${state === 'i' ? 'selected' : ''}>|i⟩</option>
                    <option value="-i" ${state === '-i' ? 'selected' : ''}>|-i⟩</option>
                </select>
            </div>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.initial-state-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const qubit = parseInt(e.target.dataset.qubit);
                this.initialStates[qubit] = e.target.value;
                this.runSimulation();
            });
        });
    }

    setupEventListeners() {
        // Add/Remove qubit buttons
        document.getElementById('add-qubit-btn').addEventListener('click', () => {
            const current = this.circuitRenderer.getNumQubits();
            if (current < 5) {
                this.circuitRenderer.setNumQubits(current + 1);
                this.simulator.setNumQubits(current + 1);
                this.blochSpheres.setNumQubits(current + 1);
                this.updateQubitCount();
                this.renderInitialStateSelectors();
            }
        });

        document.getElementById('remove-qubit-btn').addEventListener('click', () => {
            const current = this.circuitRenderer.getNumQubits();
            if (current > 1) {
                this.circuitRenderer.setNumQubits(current - 1);
                this.simulator.setNumQubits(current - 1);
                this.blochSpheres.setNumQubits(current - 1);
                this.updateQubitCount();
                this.renderInitialStateSelectors();
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

        // Bloch qubit selector removed - now shows all qubits

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
        const state = this.simulator.simulate(circuit, this.initialStates);

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
                value.innerHTML = this.formatAmplitudeSymbolic(amp.amplitude);
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

    // Format amplitude with symbolic values (1/√2 instead of 0.707)
    formatAmplitudeSymbolic(c) {
        const re = c.re;
        const im = c.im;

        let reStr = this.toSymbolic(re);
        let imStr = this.toSymbolic(Math.abs(im));

        if (Math.abs(im) < 0.001) {
            return reStr;
        }
        if (Math.abs(re) < 0.001) {
            return im >= 0 ? `${imStr}i` : `-${imStr}i`;
        }

        const sign = im >= 0 ? '+' : '-';
        return `${reStr}${sign}${imStr}i`;
    }

    toSymbolic(val) {
        const abs = Math.abs(val);
        const sign = val < 0 ? '-' : '';

        if (abs < 0.001) return '0';
        if (Math.abs(abs - 1) < 0.001) return sign + '1';
        if (Math.abs(abs - 0.5) < 0.001) return sign + '½';
        if (Math.abs(abs - 1 / Math.sqrt(2)) < 0.01) return sign + '1/√2';
        if (Math.abs(abs - Math.sqrt(3) / 2) < 0.01) return sign + '√3/2';
        if (Math.abs(abs - 1 / Math.sqrt(3)) < 0.01) return sign + '1/√3';
        if (Math.abs(abs - 1 / (2 * Math.sqrt(2))) < 0.01) return sign + '1/2√2';

        return val.toFixed(3);
    }

    updateBlochSphere() {
        const numQubits = this.circuitRenderer.getNumQubits();
        for (let i = 0; i < numQubits; i++) {
            const coords = this.simulator.getBlochCoordinates(i);
            this.blochSpheres.setState(i, coords.x, coords.y, coords.z);
        }
    }

    // updateQubitSelector removed - now shows all qubits

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
        const numQubits = this.circuitRenderer.getNumQubits();
        this.simulator.setNumQubits(numQubits);
        this.blochSpheres.setNumQubits(numQubits);
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
