/**
 * Circuit Renderer
 * Renders the quantum circuit and handles drag-and-drop
 */

class CircuitRenderer {
    constructor(containerId, onCircuitChange) {
        this.container = document.getElementById(containerId);
        this.onCircuitChange = onCircuitChange;
        this.numQubits = 2;
        this.numColumns = 5;
        this.circuit = []; // Array of gates
        this.selectedGate = null;
        this.draggedGate = null;

        this.init();
    }

    init() {
        this.render();
        this.setupDragAndDrop();
    }

    setNumQubits(n) {
        this.numQubits = Math.max(1, Math.min(5, n));
        this.render();
        this.notifyChange();
    }

    getNumQubits() {
        return this.numQubits;
    }

    clear() {
        this.circuit = [];
        this.render();
        this.notifyChange();
    }

    render() {
        this.container.innerHTML = '';

        const grid = document.createElement('div');
        grid.className = 'circuit-grid';

        // Render each qubit row
        for (let q = 0; q < this.numQubits; q++) {
            const row = document.createElement('div');
            row.className = 'qubit-row';
            row.dataset.qubit = q;

            // Qubit label
            const label = document.createElement('div');
            label.className = 'qubit-label';
            label.textContent = `q${q}`;
            row.appendChild(label);

            // Wire with gate slots
            const wire = document.createElement('div');
            wire.className = 'qubit-wire';

            for (let col = 0; col < this.numColumns; col++) {
                const slot = document.createElement('div');
                slot.className = 'gate-slot empty';
                slot.dataset.qubit = q;
                slot.dataset.column = col;

                // Check if there's a gate here
                const gateAtPosition = this.getGateAt(q, col);
                if (gateAtPosition) {
                    slot.className = 'gate-slot';
                    slot.appendChild(this.createGateElement(gateAtPosition));
                }

                wire.appendChild(slot);
            }

            // Add column button
            const addBtn = document.createElement('button');
            addBtn.className = 'add-column-btn';
            addBtn.textContent = '+';
            addBtn.onclick = () => this.addColumn();
            wire.appendChild(addBtn);

            row.appendChild(wire);
            grid.appendChild(row);
        }

        // Render control lines for multi-qubit gates
        this.renderControlLines(grid);

        this.container.appendChild(grid);
        this.setupSlotHandlers();
    }

    createGateElement(gate) {
        const el = document.createElement('div');
        el.className = 'placed-gate';
        el.dataset.gateId = gate.id;

        if (['CNOT', 'SWAP', 'CZ'].includes(gate.type)) {
            el.classList.add('multi-gate');
        }
        if (gate.type === 'M') {
            el.classList.add('measure-gate');
        }

        // Display symbol
        const symbols = {
            'H': 'H', 'X': 'X', 'Y': 'Y', 'Z': 'Z', 'S': 'S', 'T': 'T',
            'CNOT': '⊕', 'SWAP': '⨉', 'CZ': 'CZ', 'M': '📏'
        };
        el.textContent = symbols[gate.type] || gate.type;

        // Click to remove
        el.onclick = (e) => {
            e.stopPropagation();
            this.removeGate(gate.id);
        };

        return el;
    }

    renderControlLines(grid) {
        // Find multi-qubit gates and draw control lines
        const multiGates = this.circuit.filter(g =>
            ['CNOT', 'CZ'].includes(g.type)
        );

        for (const gate of multiGates) {
            // Control lines are rendered via CSS positioned elements
            // This is a simplified version - full implementation would use SVG
        }
    }

    getGateAt(qubit, column) {
        return this.circuit.find(g => {
            if (g.qubit === qubit && g.column === column) return true;
            if (g.target === qubit && g.column === column) return true;
            if (g.control === qubit && g.column === column) return true;
            return false;
        });
    }

    addGate(type, qubit, column) {
        const id = Date.now() + Math.random();
        const gate = { id, type, qubit, column };

        // Check if slot is occupied
        if (this.getGateAt(qubit, column)) {
            return false;
        }

        this.circuit.push(gate);
        this.render();
        this.notifyChange();
        return true;
    }

    addMultiQubitGate(type, qubit1, qubit2, column) {
        const id = Date.now() + Math.random();
        let gate;

        if (type === 'CNOT' || type === 'CZ') {
            gate = { id, type, control: qubit1, target: qubit2, column };
        } else if (type === 'SWAP') {
            gate = { id, type, qubit1, qubit2, column };
        }

        this.circuit.push(gate);
        this.render();
        this.notifyChange();
    }

    removeGate(gateId) {
        this.circuit = this.circuit.filter(g => g.id !== gateId);
        this.render();
        this.notifyChange();
    }

    addColumn() {
        this.numColumns++;
        this.render();
    }

    getCircuitForSimulation() {
        // Sort gates by column (time order)
        return [...this.circuit].sort((a, b) => a.column - b.column);
    }

    getCircuitDepth() {
        return this.circuit.length;
    }

    notifyChange() {
        if (this.onCircuitChange) {
            this.onCircuitChange(this.getCircuitForSimulation());
        }
    }

    setupDragAndDrop() {
        // Make gate palette items draggable
        document.querySelectorAll('.gate-item').forEach(item => {
            item.draggable = true;

            item.addEventListener('dragstart', (e) => {
                this.draggedGate = item.dataset.gate;
                item.classList.add('dragging');
                e.dataTransfer.setData('text/plain', item.dataset.gate);
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.draggedGate = null;
            });
        });
    }

    setupSlotHandlers() {
        // Make empty slots drop targets
        this.container.querySelectorAll('.gate-slot.empty').forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('drop-target');
            });

            slot.addEventListener('dragleave', () => {
                slot.classList.remove('drop-target');
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drop-target');

                const gateType = e.dataTransfer.getData('text/plain');
                const qubit = parseInt(slot.dataset.qubit);
                const column = parseInt(slot.dataset.column);

                if (['CNOT', 'SWAP', 'CZ'].includes(gateType)) {
                    // For multi-qubit gates, need to select target
                    this.handleMultiQubitGateDrop(gateType, qubit, column);
                } else {
                    this.addGate(gateType, qubit, column);
                }
            });

            // Click to add gate (shows menu)
            slot.addEventListener('click', () => {
                this.showGateMenu(slot);
            });
        });
    }

    handleMultiQubitGateDrop(gateType, controlQubit, column) {
        // For simplicity, target the next qubit
        const targetQubit = (controlQubit + 1) % this.numQubits;

        if (controlQubit !== targetQubit) {
            this.addMultiQubitGate(gateType, controlQubit, targetQubit, column);
        }
    }

    showGateMenu(slot) {
        // Could show a popup menu - for now just add H gate
        const qubit = parseInt(slot.dataset.qubit);
        const column = parseInt(slot.dataset.column);
        this.addGate('H', qubit, column);
    }

    // Load preset circuits
    loadPreset(preset) {
        this.circuit = [];
        this.numColumns = 5;

        switch (preset) {
            case 'bell':
                this.numQubits = 2;
                this.circuit = [
                    { id: 1, type: 'H', qubit: 0, column: 0 },
                    { id: 2, type: 'CNOT', control: 0, target: 1, column: 1 }
                ];
                break;
            case 'ghz':
                this.numQubits = 3;
                this.circuit = [
                    { id: 1, type: 'H', qubit: 0, column: 0 },
                    { id: 2, type: 'CNOT', control: 0, target: 1, column: 1 },
                    { id: 3, type: 'CNOT', control: 1, target: 2, column: 2 }
                ];
                break;
            case 'superposition':
                this.numQubits = 2;
                this.circuit = [
                    { id: 1, type: 'H', qubit: 0, column: 0 },
                    { id: 2, type: 'H', qubit: 1, column: 0 }
                ];
                break;
            case 'teleportation':
                this.numQubits = 3;
                this.numColumns = 6;
                this.circuit = [
                    // Prepare Bell pair between q1 and q2
                    { id: 1, type: 'H', qubit: 1, column: 0 },
                    { id: 2, type: 'CNOT', control: 1, target: 2, column: 1 },
                    // Bell measurement on q0 and q1
                    { id: 3, type: 'CNOT', control: 0, target: 1, column: 2 },
                    { id: 4, type: 'H', qubit: 0, column: 3 }
                ];
                break;
        }

        this.render();
        this.notifyChange();
    }
}

// Export for use
window.CircuitRenderer = CircuitRenderer;
