/**
 * Smart Panel Layout Manager v3
 * Uniform grid layouts with top toolbar
 */

class PanelViewManager {
    constructor() {
        this.panels = {
            'circuit': { name: 'Circuit', visible: true, el: null, selector: '.circuit-panel' },
            'state': { name: 'State', visible: true, el: null, selector: '.state-panel' },
            'bloch': { name: 'Bloch', visible: true, el: null, selector: '.bloch-panel' },
            'params': { name: 'Params', visible: true, el: null, selector: '.right-panel' }
        };

        this.init();
    }

    init() {
        this.setupLayoutContainer();
        this.captureOriginalElements();
        this.createToolbar();
        this.loadSavedState();
        this.applyLayout();
    }

    setupLayoutContainer() {
        const oldContainer = document.querySelector('.app-container');
        if (!oldContainer) return;

        oldContainer.style.display = 'none';
        this.oldContainer = oldContainer;

        this.layoutContainer = document.createElement('div');
        this.layoutContainer.id = 'dynamic-layout';
        this.layoutContainer.className = 'uniform-grid';
        oldContainer.parentNode.insertBefore(this.layoutContainer, oldContainer);
    }

    captureOriginalElements() {
        for (const [id, panel] of Object.entries(this.panels)) {
            const el = this.oldContainer.querySelector(panel.selector);
            if (el) {
                el.classList.add('grid-panel');
                el.dataset.panelId = id;
                panel.el = el;
            }
        }
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'top-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-left">
                <span class="toolbar-title">Quantum Circuit Playground</span>
            </div>
            <div class="toolbar-center">
                <button id="add-qubit-btn-toolbar" class="toolbar-btn">+ Qubit</button>
                <button id="remove-qubit-btn-toolbar" class="toolbar-btn">- Qubit</button>
                <button id="clear-btn-toolbar" class="toolbar-btn btn-danger">Clear</button>
                <button id="run-btn-toolbar" class="toolbar-btn btn-primary">▶ Simulate</button>
            </div>
            <div class="toolbar-right">
                <button id="view-toggle-btn" class="toolbar-btn">⚙ View</button>
                <a href="../../index.html" class="toolbar-btn btn-close" title="Close">✕</a>
            </div>
            <div id="view-dropdown" class="view-dropdown">
                <div class="view-dropdown-header">Toggle Panels</div>
                ${this.createToggleItems()}
                <div class="view-dropdown-divider"></div>
                <div class="view-preset" data-preset="all">Show All</div>
                <div class="view-preset" data-preset="circuit-only">Circuit Only</div>
                <div class="view-preset" data-preset="analysis">Analysis View</div>
            </div>
        `;

        document.body.insertBefore(toolbar, document.body.firstChild);

        // Toolbar button handlers
        this.setupToolbarHandlers(toolbar);
    }

    setupToolbarHandlers(toolbar) {
        const btn = toolbar.querySelector('#view-toggle-btn');
        const dropdown = toolbar.querySelector('#view-dropdown');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => dropdown.classList.remove('show'));
        dropdown.addEventListener('click', (e) => e.stopPropagation());

        // Toggle handlers
        dropdown.querySelectorAll('.view-toggle-item').forEach(item => {
            item.addEventListener('click', () => this.togglePanel(item.dataset.panel));
        });

        // Preset handlers
        dropdown.querySelectorAll('.view-preset').forEach(item => {
            item.addEventListener('click', () => {
                this.applyPreset(item.dataset.preset);
                dropdown.classList.remove('show');
            });
        });

        // Re-wire toolbar buttons to original handlers
        toolbar.querySelector('#add-qubit-btn-toolbar').addEventListener('click', () => {
            document.getElementById('add-qubit-btn')?.click();
        });
        toolbar.querySelector('#remove-qubit-btn-toolbar').addEventListener('click', () => {
            document.getElementById('remove-qubit-btn')?.click();
        });
        toolbar.querySelector('#clear-btn-toolbar').addEventListener('click', () => {
            document.getElementById('clear-circuit-btn')?.click();
        });
        toolbar.querySelector('#run-btn-toolbar').addEventListener('click', () => {
            document.getElementById('run-circuit-btn')?.click();
        });
    }

    createToggleItems() {
        return Object.entries(this.panels).map(([id, panel]) => `
            <div class="view-toggle-item ${panel.visible ? 'active' : ''}" data-panel="${id}">
                <span class="toggle-check">${panel.visible ? '✓' : ''}</span>
                <span class="toggle-label">${panel.name}</span>
            </div>
        `).join('');
    }

    togglePanel(panelId) {
        if (!this.panels[panelId]) return;
        this.panels[panelId].visible = !this.panels[panelId].visible;
        this.updateToggleUI();
        this.applyLayout();
        this.saveState();
    }

    updateToggleUI() {
        document.querySelectorAll('.view-toggle-item').forEach(item => {
            const id = item.dataset.panel;
            const visible = this.panels[id]?.visible;
            item.classList.toggle('active', visible);
            item.querySelector('.toggle-check').textContent = visible ? '✓' : '';
        });
    }

    applyPreset(preset) {
        const presets = {
            'all': ['circuit', 'state', 'bloch', 'params'],
            'circuit-only': ['circuit'],
            'analysis': ['circuit', 'state', 'bloch']
        };

        const activeIds = presets[preset] || [];
        for (const id in this.panels) {
            this.panels[id].visible = activeIds.includes(id);
        }

        this.updateToggleUI();
        this.applyLayout();
        this.saveState();
    }

    applyLayout() {
        const visiblePanels = Object.entries(this.panels)
            .filter(([_, p]) => p.visible && p.el)
            .map(([id, p]) => ({ id, ...p }));

        const count = visiblePanels.length;

        // Clear and reset
        this.layoutContainer.innerHTML = '';
        this.layoutContainer.className = 'uniform-grid';

        if (count === 0) {
            this.layoutContainer.innerHTML = '<div class="empty-state">Select panels from View menu</div>';
            return;
        }

        // Determine grid structure: uniform sizes, first panel double for odd counts
        const isOdd = count % 2 === 1 && count > 1;

        if (count === 1) {
            // Single panel - full screen
            this.layoutContainer.classList.add('grid-1');
            this.layoutContainer.appendChild(visiblePanels[0].el);
        }
        else if (count === 2) {
            // 2 panels - side by side
            this.layoutContainer.classList.add('grid-2');
            visiblePanels.forEach(p => this.layoutContainer.appendChild(p.el));
        }
        else if (count === 3) {
            // 3 panels - first one spans full width, other two side by side
            this.layoutContainer.classList.add('grid-3');
            visiblePanels[0].el.classList.add('span-2');
            visiblePanels.forEach(p => this.layoutContainer.appendChild(p.el));
        }
        else if (count === 4) {
            // 4 panels - 2x2 grid
            this.layoutContainer.classList.add('grid-4');
            visiblePanels.forEach(p => this.layoutContainer.appendChild(p.el));
        }
        else {
            // 5+ panels - first one double width, rest in grid
            this.layoutContainer.classList.add('grid-5plus');
            visiblePanels[0].el.classList.add('span-2');
            visiblePanels.forEach(p => this.layoutContainer.appendChild(p.el));
        }

        // Trigger resize
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            if (window.app && window.app.blochSpheres) {
                window.app.blochSpheres.render();
            }
        }, 100);
    }

    saveState() {
        const state = {};
        for (const [id, panel] of Object.entries(this.panels)) {
            state[id] = panel.visible;
        }
        localStorage.setItem('quantum-panel-layout-v3', JSON.stringify(state));
    }

    loadSavedState() {
        try {
            const saved = localStorage.getItem('quantum-panel-layout-v3');
            if (saved) {
                const state = JSON.parse(saved);
                for (const [id, visible] of Object.entries(state)) {
                    if (this.panels[id]) {
                        this.panels[id].visible = visible;
                    }
                }
            }
        } catch (e) {
            console.log('Could not load saved layout');
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.panelViewManager = new PanelViewManager();
    }, 200);
});
