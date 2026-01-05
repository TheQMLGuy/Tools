/**
 * Observations Panel - Modal version
 * Right-click on loss badge to log, click header button to view modal
 */

class ObservationsPanel {
    constructor() {
        this.observations = [];

        // Elements
        this.modal = document.getElementById('observations-modal');
        this.tableBody = document.getElementById('observations-body');
        this.openBtn = document.getElementById('open-observations');
        this.closeBtn = document.getElementById('close-observations');
        this.exportBtn = document.getElementById('export-csv');
        this.clearBtn = document.getElementById('clear-observations');
        this.countEl = document.getElementById('obs-count');

        this.setupEvents();
    }

    setupEvents() {
        // Open modal
        this.openBtn.addEventListener('click', () => this.openModal());

        // Close modal
        this.closeBtn.addEventListener('click', () => this.closeModal());

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Export CSV
        this.exportBtn.addEventListener('click', () => this.exportCSV());

        // Clear all
        this.clearBtn.addEventListener('click', () => this.clear());

        // + button to add observation
        const addBtn = document.getElementById('add-observation');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addObservation());
        }
    }

    openModal() {
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
    }

    addObservation() {
        const app = window.app;
        if (!app || !app.network) return;

        // Get config
        const hiddenLayers = app.layerSizes.slice(1, -1).join(',') || '-';
        const accuracy = app.calculateAccuracy();
        const loss = app.network.lossHistory.length > 0
            ? app.network.lossHistory[app.network.lossHistory.length - 1]
            : 0;

        const observation = {
            id: this.observations.length + 1,
            layers: hiddenLayers,
            activation: app.activationName,
            lossFunction: app.lossFunctionName || 'mse',
            optimizer: app.optimizerName,
            init: app.weightInitName || 'xavier',
            lr: app.learningRate,
            epoch: app.network.epoch,
            loss: loss,
            accuracy: accuracy,
            time: new Date().toLocaleTimeString()
        };

        this.observations.push(observation);
        this.updateCount();
        this.renderTable();

        // Flash effect
        const badge = document.getElementById('current-loss');
        badge.classList.add('flash');
        setTimeout(() => badge.classList.remove('flash'), 300);

        // Briefly show count flash
        this.countEl.classList.add('flash');
        setTimeout(() => this.countEl.classList.remove('flash'), 300);
    }

    updateCount() {
        this.countEl.textContent = this.observations.length;
    }

    renderTable() {
        this.tableBody.innerHTML = this.observations.map(obs => `
            <tr>
                <td>${obs.id}</td>
                <td>${obs.layers}</td>
                <td>${obs.activation}</td>
                <td>${obs.lossFunction}</td>
                <td>${obs.optimizer}</td>
                <td>${obs.init}</td>
                <td>${obs.lr}</td>
                <td>${obs.epoch}</td>
                <td>${obs.loss.toFixed(6)}</td>
                <td>${obs.accuracy.toFixed(1)}%</td>
                <td>${obs.time}</td>
            </tr>
        `).join('');
    }

    exportCSV() {
        if (this.observations.length === 0) {
            alert('No observations to export. Click the + button to log observations.');
            return;
        }

        const headers = ['#', 'Layers', 'Activation', 'Loss Fn', 'Optimizer', 'Init', 'LR', 'Epoch', 'Loss', 'Accuracy', 'Time'];
        const rows = this.observations.map(obs => [
            obs.id,
            obs.layers,
            obs.activation,
            obs.lossFunction,
            obs.optimizer,
            obs.init,
            obs.lr,
            obs.epoch,
            obs.loss.toFixed(6),
            obs.accuracy.toFixed(1) + '%',
            obs.time
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `nn_observations_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    clear() {
        if (this.observations.length === 0) return;

        if (confirm('Clear all ' + this.observations.length + ' observations?')) {
            this.observations = [];
            this.updateCount();
            this.renderTable();
        }
    }
}

// Export
window.ObservationsPanel = ObservationsPanel;
