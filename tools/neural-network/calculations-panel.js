/**
 * Calculations Panel
 * Shows the forward pass math step-by-step for both initial and current states
 */

class CalculationsPanel {
    constructor() {
        this.network = null;
        this.inputValue = 0.5;
        this.isExpanded = false;

        this.section = document.getElementById('calculations-section');
        this.toggleBtn = document.getElementById('toggle-calculations');
        this.inputEl = document.getElementById('calc-input');
        this.initialContainer = document.getElementById('calc-initial');
        this.currentContainer = document.getElementById('calc-current');

        this.setupEvents();
    }

    setupEvents() {
        this.toggleBtn.addEventListener('click', () => this.toggle());
        this.inputEl.addEventListener('change', (e) => {
            this.inputValue = parseFloat(e.target.value) || 0;
            this.update();
        });

        // Also toggle when clicking header
        document.querySelector('.calculations-header').addEventListener('click', (e) => {
            if (e.target !== this.inputEl && e.target !== this.toggleBtn) {
                this.toggle();
            }
        });
    }

    toggle() {
        this.isExpanded = !this.isExpanded;
        this.section.classList.toggle('collapsed', !this.isExpanded);
        this.toggleBtn.textContent = this.isExpanded ? '▲ Hide' : '▼ Show';

        if (this.isExpanded) {
            this.update();
        }
    }

    setNetwork(network) {
        this.network = network;
    }

    update() {
        if (!this.network || !this.isExpanded) return;

        // Calculate forward pass with initial weights
        const initialResult = this.calculateForwardPass(true);
        const currentResult = this.calculateForwardPass(false);

        this.renderCalculation(this.initialContainer, initialResult);
        this.renderCalculation(this.currentContainer, currentResult);
    }

    calculateForwardPass(useInitial) {
        const nn = this.network;
        const x = this.inputValue;
        const activationName = nn.activationName;
        const activationFn = nn.activation.fn;

        const weights = useInitial ? nn.initialWeights : nn.weights;
        const biases = useInitial ? nn.initialBiases : nn.biases;

        const result = {
            input: x,
            activationName,
            layers: []
        };

        let currentInput = [x];

        // For each layer (excluding input)
        for (let l = 0; l < weights.length; l++) {
            const layerResult = {
                layerIndex: l + 1,
                neurons: []
            };

            const nextLayerSize = nn.layerSizes[l + 1];
            const nextInput = [];

            for (let n = 0; n < nextLayerSize; n++) {
                const neuronCalc = {
                    nodeIndex: n,
                    inputs: [],
                    weights: [],
                    bias: biases[l][n],
                    weightedSum: 0,
                    preActivation: 0,
                    output: 0
                };

                // Calculate weighted sum
                let sum = 0;
                for (let i = 0; i < currentInput.length; i++) {
                    const w = weights[l][n][i];
                    const inp = currentInput[i];
                    neuronCalc.inputs.push(inp);
                    neuronCalc.weights.push(w);
                    sum += inp * w;
                }

                neuronCalc.weightedSum = sum;
                neuronCalc.preActivation = sum + neuronCalc.bias;
                neuronCalc.output = activationFn(neuronCalc.preActivation);

                nextInput.push(neuronCalc.output);
                layerResult.neurons.push(neuronCalc);
            }

            currentInput = nextInput;
            result.layers.push(layerResult);
        }

        result.finalOutput = currentInput[0];
        return result;
    }

    renderCalculation(container, result) {
        let html = '';

        html += `<div class="calc-line"><span class="result">Input: x = ${result.input.toFixed(4)}</span></div>`;
        html += `<div class="calc-line"><span style="color:#888">Activation: ${result.activationName}</span></div>`;

        for (const layer of result.layers) {
            const isOutput = layer.layerIndex === result.layers.length;
            const layerName = isOutput ? 'Output' : `Hidden ${layer.layerIndex}`;

            html += `<div class="calc-line layer-header">${layerName} Layer</div>`;

            for (const neuron of layer.neurons) {
                // Build the weighted sum expression
                let expr = '';
                for (let i = 0; i < neuron.inputs.length; i++) {
                    if (i > 0) expr += ' + ';
                    const inp = neuron.inputs[i].toFixed(2);
                    const w = neuron.weights[i].toFixed(2);
                    expr += `<span class="weight">${w}</span>×${inp}`;
                }

                const bias = neuron.bias >= 0 ? `+ <span class="bias">${neuron.bias.toFixed(2)}</span>` : `- <span class="bias">${Math.abs(neuron.bias).toFixed(2)}</span>`;
                const preAct = neuron.preActivation.toFixed(3);
                const output = neuron.output.toFixed(4);

                html += `<div class="calc-line">`;
                html += `[${neuron.nodeIndex}]: (${expr}) ${bias}`;
                html += ` = ${preAct}`;
                html += ` → <span class="activation">σ</span>(${preAct})`;
                html += ` = <span class="result">${output}</span>`;
                html += `</div>`;
            }
        }

        html += `<div class="calc-line layer-header">Final Output: <span class="result">${result.finalOutput.toFixed(5)}</span></div>`;

        container.innerHTML = html;
    }
}

// Export
window.CalculationsPanel = CalculationsPanel;
