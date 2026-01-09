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
            ['CNOT', 'CZ', 'SWAP'].includes(g.type)
        );

        // Create an SVG overlay for control lines
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('control-lines-svg');
        svg.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5;';

        for (const gate of multiGates) {
            let qubit1, qubit2;

            if (gate.type === 'CNOT' || gate.type === 'CZ') {
                qubit1 = gate.control;
                qubit2 = gate.target;
            } else if (gate.type === 'SWAP') {
                qubit1 = gate.qubit1;
                qubit2 = gate.qubit2;
            }

            if (qubit1 === undefined || qubit2 === undefined) continue;

            const col = gate.column;
            const minQ = Math.min(qubit1, qubit2);
            const maxQ = Math.max(qubit1, qubit2);

            // Find the slot elements to get positions
            const slot1 = grid.querySelector(`.gate-slot[data-qubit="${qubit1}"][data-column="${col}"]`);
            const slot2 = grid.querySelector(`.gate-slot[data-qubit="${qubit2}"][data-column="${col}"]`);

            if (slot1 && slot2) {
                // Use setTimeout to ensure DOM is rendered
                setTimeout(() => {
                    const rect1 = slot1.getBoundingClientRect();
                    const rect2 = slot2.getBoundingClientRect();
                    const gridRect = grid.getBoundingClientRect();

                    const x = rect1.left + rect1.width / 2 - gridRect.left;
                    const y1 = rect1.top + rect1.height / 2 - gridRect.top;
                    const y2 = rect2.top + rect2.height / 2 - gridRect.top;

                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x);
                    line.setAttribute('y1', y1);
                    line.setAttribute('x2', x);
                    line.setAttribute('y2', y2);
                    line.setAttribute('stroke', gate.type === 'CNOT' ? '#22d3ee' : gate.type === 'CZ' ? '#a78bfa' : '#f59e0b');
                    line.setAttribute('stroke-width', '2');
                    line.setAttribute('stroke-dasharray', gate.type === 'SWAP' ? '4,2' : 'none');

                    svg.appendChild(line);

                    // Add control dot for CNOT/CZ
                    if (gate.type === 'CNOT' || gate.type === 'CZ') {
                        const controlY = gate.control === qubit1 ? y1 : y2;
                        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        dot.setAttribute('cx', x);
                        dot.setAttribute('cy', controlY);
                        dot.setAttribute('r', '5');
                        dot.setAttribute('fill', gate.type === 'CNOT' ? '#22d3ee' : '#a78bfa');
                        svg.appendChild(dot);
                    }
                }, 0);
            }
        }

        grid.style.position = 'relative';
        grid.appendChild(svg);
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
        // Remove any existing menu
        const existingMenu = document.querySelector('.gate-menu-popup');
        if (existingMenu) existingMenu.remove();

        const qubit = parseInt(slot.dataset.qubit);
        const column = parseInt(slot.dataset.column);

        // Create popup menu
        const menu = document.createElement('div');
        menu.className = 'gate-menu-popup';
        menu.innerHTML = `
            <div class="gate-menu-title">Add Gate</div>
            <div class="gate-menu-section">Single-Qubit</div>
            <div class="gate-menu-grid">
                <button data-gate="H">H</button>
                <button data-gate="X">X</button>
                <button data-gate="Y">Y</button>
                <button data-gate="Z">Z</button>
                <button data-gate="S">S</button>
                <button data-gate="T">T</button>
            </div>
            ${this.numQubits > 1 ? `
            <div class="gate-menu-section">Multi-Qubit</div>
            <div class="gate-menu-grid">
                <button data-gate="CNOT">⊕</button>
                <button data-gate="SWAP">⨉</button>
                <button data-gate="CZ">CZ</button>
            </div>
            ` : ''}
            <div class="gate-menu-section">Other</div>
            <div class="gate-menu-grid">
                <button data-gate="M">📏</button>
            </div>
        `;

        // Position menu near the slot
        const rect = slot.getBoundingClientRect();
        menu.style.cssText = `
            position: fixed;
            left: ${rect.right + 5}px;
            top: ${rect.top}px;
            background: var(--bg-card, #1e1e2e);
            border: 1px solid var(--border-color, #3f3f5a);
            border-radius: 8px;
            padding: 8px;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;

        // Add styles for menu elements
        const style = document.createElement('style');
        style.textContent = `
            .gate-menu-popup .gate-menu-title {
                font-size: 0.75rem;
                color: #a0a0b0;
                margin-bottom: 6px;
                font-weight: 600;
            }
            .gate-menu-popup .gate-menu-section {
                font-size: 0.65rem;
                color: #707080;
                margin: 6px 0 4px;
                text-transform: uppercase;
            }
            .gate-menu-popup .gate-menu-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 4px;
            }
            .gate-menu-popup button {
                width: 32px;
                height: 32px;
                background: #2a2a3e;
                border: 1px solid #3f3f5a;
                border-radius: 4px;
                color: #e0e0e0;
                cursor: pointer;
                font-size: 0.85rem;
                transition: all 0.15s;
            }
            .gate-menu-popup button:hover {
                background: #6366f1;
                border-color: #818cf8;
            }
        `;
        menu.appendChild(style);

        document.body.appendChild(menu);

        // Handle button clicks
        menu.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gateType = btn.dataset.gate;
                if (['CNOT', 'SWAP', 'CZ'].includes(gateType)) {
                    this.handleMultiQubitGateDrop(gateType, qubit, column);
                } else {
                    this.addGate(gateType, qubit, column);
                }
                menu.remove();
            });
        });

        // Close menu on outside click
        const closeHandler = (e) => {
            if (!menu.contains(e.target) && e.target !== slot) {
                menu.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
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
