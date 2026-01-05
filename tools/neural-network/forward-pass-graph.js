/**
 * Visual Forward Pass Graph - Compact with Magnifier
 * Shows condensed network with calculations, double-click for magnifier
 */

class ForwardPassGraph {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.network = null;
        this.inputValue = 0.5;
        this.magnifier = document.getElementById('magnifier');
        this.nodePositions = [];
        this.forwardData = null;

        // Colors
        this.colors = {
            bg: '#0a0a0f',
            node: '#1a1a2e',
            nodeStroke: '#6366f1',
            edge: 'rgba(99, 102, 241, 0.5)',
            text: '#ffffff',
            textMuted: '#888',
            weight: '#ffc832',
            bias: '#10b981',
            activation: '#ff6b6b',
            result: '#10b981'
        };

        this.setupResize();
        this.setupEvents();
    }

    setupResize() {
        const resizeObserver = new ResizeObserver(() => this.resize());
        resizeObserver.observe(this.canvas.parentElement);
        this.resize();
    }

    setupEvents() {
        // Create tooltip element if needed
        this.tooltip = document.getElementById('forward-pass-tooltip');
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.id = 'forward-pass-tooltip';
            this.tooltip.className = 'tooltip';
            document.body.appendChild(this.tooltip);
        }

        // Hover for quick tooltip
        this.canvas.addEventListener('mousemove', (e) => this.handleHover(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.tooltip.classList.remove('visible');
        });

        // Double-click for full magnifier
        this.canvas.addEventListener('dblclick', (e) => this.showMagnifier(e));

        // Click away to hide magnifier
        document.addEventListener('click', (e) => {
            if (!this.magnifier.contains(e.target) && e.target !== this.canvas) {
                this.hideMagnifier();
            }
        });

        // Input change
        const inputEl = document.getElementById('calc-input');
        if (inputEl) {
            inputEl.addEventListener('input', (e) => {
                this.inputValue = parseFloat(e.target.value) || 0;
                this.render();
            });
        }
    }

    handleHover(e) {
        if (!this.forwardData) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Find hovered node
        let found = null;
        for (let l = 0; l < this.nodePositions.length; l++) {
            for (let n = 0; n < this.nodePositions[l].length; n++) {
                const pos = this.nodePositions[l][n];
                const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
                if (dist < 20) {
                    found = { layer: l, node: n };
                    break;
                }
            }
            if (found) break;
        }

        if (!found) {
            this.tooltip.classList.remove('visible');
            return;
        }

        // Build tooltip content
        let html = '';
        if (found.layer === 0) {
            html = `<strong>Input</strong><br>Value: ${this.inputValue.toFixed(4)}`;
        } else {
            const layerData = this.forwardData.layers[found.layer - 1];
            const data = layerData.neurons[found.node];
            const delta = data.bias - (this.network.initialBiases[found.layer - 1]?.[found.node] ?? 0);
            const deltaColor = delta >= 0 ? '#10b981' : '#ef4444';

            html = `<strong>L${found.layer}N${found.node}</strong><br>`;
            html += `Σ: ${data.weightedSum.toFixed(4)}<br>`;
            html += `+b: <span style="color:#10b981">${data.bias.toFixed(4)}</span><br>`;
            if (!data.isOutput) {
                html += `σ() = <span style="color:#6366f1">${data.output.toFixed(4)}</span>`;
            } else {
                html += `Out: <span style="color:#10b981">${data.output.toFixed(4)}</span>`;
            }
        }

        this.tooltip.innerHTML = html;
        this.tooltip.style.left = (e.clientX + 10) + 'px';
        this.tooltip.style.top = (e.clientY + 10) + 'px';
        this.tooltip.classList.add('visible');
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
        this.render();
    }

    setNetwork(network) {
        this.network = network;
        this.render();
    }

    update() {
        this.render();
    }

    render() {
        if (!this.network || !this.ctx) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Calculate forward pass
        this.forwardData = this.calculateForwardPass();

        // Layout - compact circles
        const numLayers = this.network.layerSizes.length;
        const padding = 20;
        const layerSpacing = (this.width - padding * 2) / (numLayers - 1);
        const nodeRadius = 16;

        // Calculate positions
        this.nodePositions = [];
        for (let l = 0; l < numLayers; l++) {
            const layerPositions = [];
            const numNodes = this.network.layerSizes[l];
            const spacing = Math.min(40, (this.height - padding * 2) / Math.max(1, numNodes - 1));
            const layerHeight = (numNodes - 1) * spacing;
            const startY = (this.height - layerHeight) / 2;

            for (let n = 0; n < numNodes; n++) {
                layerPositions.push({
                    x: padding + l * layerSpacing,
                    y: startY + n * spacing,
                    layer: l,
                    node: n
                });
            }
            this.nodePositions.push(layerPositions);
        }

        // Draw edges with weight labels
        for (let l = 0; l < numLayers - 1; l++) {
            for (let from = 0; from < this.nodePositions[l].length; from++) {
                for (let to = 0; to < this.nodePositions[l + 1].length; to++) {
                    const fromPos = this.nodePositions[l][from];
                    const toPos = this.nodePositions[l + 1][to];
                    const weight = this.network.weights[l][to][from];

                    // Line
                    ctx.beginPath();
                    ctx.moveTo(fromPos.x + nodeRadius, fromPos.y);
                    ctx.lineTo(toPos.x - nodeRadius, toPos.y);
                    ctx.strokeStyle = this.colors.edge;
                    ctx.lineWidth = Math.max(0.5, Math.min(2, Math.abs(weight)));
                    ctx.stroke();

                    // Weight on edge (small)
                    const midX = (fromPos.x + toPos.x) / 2;
                    const midY = (fromPos.y + toPos.y) / 2;
                    ctx.font = '8px monospace';
                    ctx.fillStyle = this.colors.weight;
                    ctx.textAlign = 'center';
                    ctx.fillText(weight.toFixed(1), midX, midY - 2);
                }
            }
        }

        // Draw nodes
        for (let l = 0; l < numLayers; l++) {
            for (let n = 0; n < this.nodePositions[l].length; n++) {
                const pos = this.nodePositions[l][n];
                const output = this.forwardData.layerOutputs[l][n];

                // Circle
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
                ctx.fillStyle = this.colors.node;
                ctx.fill();
                ctx.strokeStyle = l === 0 ? '#666' : (l === numLayers - 1 ? this.colors.result : this.colors.nodeStroke);
                ctx.lineWidth = 2;
                ctx.stroke();

                // Value inside
                ctx.font = 'bold 10px monospace';
                ctx.fillStyle = this.colors.text;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(output.toFixed(2), pos.x, pos.y);
            }
        }

        // Labels
        ctx.font = '9px Inter, sans-serif';
        ctx.fillStyle = this.colors.textMuted;
        ctx.textAlign = 'center';
        ctx.fillText('Input', this.nodePositions[0][0].x, this.height - 8);
        ctx.fillText('Output', this.nodePositions[numLayers - 1][0].x, this.height - 8);

        // Hint text
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.textAlign = 'right';
        ctx.fillText('Double-click node for details', this.width - 10, this.height - 8);
    }

    calculateForwardPass() {
        const nn = this.network;
        const x = this.inputValue;
        const activationFn = nn.activation.fn;

        const result = {
            input: x,
            layerOutputs: [[x]],
            layers: []
        };

        let currentInput = [x];

        for (let l = 0; l < nn.weights.length; l++) {
            const layerResult = { neurons: [] };
            const nextInput = [];

            for (let n = 0; n < nn.layerSizes[l + 1]; n++) {
                let weightedSum = 0;
                const terms = [];

                for (let i = 0; i < currentInput.length; i++) {
                    const w = nn.weights[l][n][i];
                    const inp = currentInput[i];
                    weightedSum += w * inp;
                    terms.push({ w, inp, product: w * inp });
                }

                const bias = nn.biases[l][n];
                const preActivation = weightedSum + bias;
                const isOutput = l === nn.weights.length - 1;
                const output = isOutput ? preActivation : activationFn(preActivation);

                nextInput.push(output);
                layerResult.neurons.push({ terms, weightedSum, bias, preActivation, output, isOutput });
            }

            currentInput = nextInput;
            result.layerOutputs.push([...nextInput]);
            result.layers.push(layerResult);
        }

        return result;
    }

    showMagnifier(e) {
        if (!this.forwardData) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Find clicked node
        let found = null;
        for (let l = 0; l < this.nodePositions.length; l++) {
            for (let n = 0; n < this.nodePositions[l].length; n++) {
                const pos = this.nodePositions[l][n];
                const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
                if (dist < 20) {
                    found = { layer: l, node: n };
                    break;
                }
            }
            if (found) break;
        }

        if (!found) {
            this.hideMagnifier();
            return;
        }

        // Build magnifier content
        let html = '';

        if (found.layer === 0) {
            html = `<div class="mag-title">Input Node</div>
                    <div class="mag-row">Value: <span class="mag-result">${this.inputValue.toFixed(4)}</span></div>`;
        } else {
            const layerData = this.forwardData.layers[found.layer - 1];
            const data = layerData.neurons[found.node];

            html = `<div class="mag-title">Layer ${found.layer} - Node ${found.node}</div>`;

            // Show weighted sum calculation
            html += `<div class="mag-row"><strong>Weighted Sum:</strong></div>`;
            data.terms.forEach((t, i) => {
                html += `<div class="mag-row">&nbsp; <span class="mag-weight">${t.w.toFixed(3)}</span> × ${t.inp.toFixed(3)} = ${t.product.toFixed(4)}</div>`;
            });
            html += `<div class="mag-row">Σ = ${data.weightedSum.toFixed(4)}</div>`;

            // Bias
            html += `<div class="mag-row"><strong>+ Bias:</strong> <span class="mag-bias">${data.bias.toFixed(4)}</span></div>`;
            html += `<div class="mag-row">Pre-activation: ${data.preActivation.toFixed(4)}</div>`;

            // Activation
            if (!data.isOutput) {
                html += `<div class="mag-row"><span class="mag-activation">σ(${data.preActivation.toFixed(3)})</span> = <span class="mag-result">${data.output.toFixed(4)}</span></div>`;
            } else {
                html += `<div class="mag-row"><strong>Output:</strong> <span class="mag-result">${data.output.toFixed(4)}</span></div>`;
            }
        }

        this.magnifier.innerHTML = html;
        this.magnifier.classList.remove('hidden');

        // Position magnifier
        const magRect = this.magnifier.getBoundingClientRect();
        let magX = e.clientX + 10;
        let magY = e.clientY + 10;

        // Keep in viewport
        if (magX + magRect.width > window.innerWidth) {
            magX = e.clientX - magRect.width - 10;
        }
        if (magY + magRect.height > window.innerHeight) {
            magY = e.clientY - magRect.height - 10;
        }

        this.magnifier.style.left = magX + 'px';
        this.magnifier.style.top = magY + 'px';
        this.magnifier.style.position = 'fixed';
    }

    hideMagnifier() {
        this.magnifier.classList.add('hidden');
    }
}

// Export
window.ForwardPassGraph = ForwardPassGraph;
