/**
 * Network Visualizer
 * Renders the neural network graph with nodes, connections, weights, and biases
 * Color coding: Green = increased from initial, Red = decreased from initial
 * Size coding: Larger = increased, Smaller = decreased
 */

class NetworkVisualizer {
    constructor(canvasId, tooltipId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.tooltip = document.getElementById(tooltipId);

        this.network = null;
        this.nodePositions = [];
        this.hoveredConnection = null;
        this.hoveredNode = null;

        // Base sizes
        this.baseNodeRadius = 12;
        this.baseEdgeWidth = 1.5;

        // Visualization mode: 'default', 'gradient-heatmap', 'backprop-animation'
        this.visualizationMode = 'default';

        // Backprop animation state
        this.backpropAnimationState = {
            animating: false,
            currentLayer: -1,
            progress: 0,
            startTime: 0
        };

        // Colors
        this.colors = {
            nodeFill: '#1a1a2e',
            nodeStroke: '#6366f1',
            // Delta colors
            increased: '#10b981',  // Green - value increased
            decreased: '#ef4444',  // Red - value decreased
            neutral: '#6366f1',    // Purple - no change/initial
            text: '#a0a0b0',
            textMuted: '#606070',
            // Gradient heatmap colors (low to high)
            gradientLow: '#3b82f6',     // Blue
            gradientMid: '#10b981',     // Green
            gradientHigh: '#f59e0b',    // Yellow/Orange
            gradientMax: '#ef4444',     // Red (exploding)
            // Dropout colors
            droppedFill: '#0a0a15',
            droppedStroke: '#404050',
        };

        // Setup resize observer
        this.setupResize();
        this.setupMouseEvents();
    }

    setupResize() {
        const resizeObserver = new ResizeObserver(() => {
            this.resize();
        });
        resizeObserver.observe(this.canvas.parentElement);
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;

        if (this.network) {
            this.calculateNodePositions();
            this.render();
        }
    }

    setupMouseEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.checkHover(x, y, e.clientX, e.clientY);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredConnection = null;
            this.hoveredNode = null;
            this.tooltip.classList.remove('visible');
            this.render();
        });

        // Double-click to edit initial values
        this.canvas.addEventListener('dblclick', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleDoubleClick(x, y);
        });

        // Edit modal callbacks
        this.onEditComplete = null;
        this.setupEditModal();
    }

    setupEditModal() {
        const modal = document.getElementById('edit-modal');
        const cancelBtn = document.getElementById('modal-cancel');
        const saveBtn = document.getElementById('modal-save');

        cancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            this.editingItem = null;
        });

        saveBtn.addEventListener('click', () => {
            const newValue = parseFloat(document.getElementById('edit-initial').value);
            if (!isNaN(newValue) && this.editingItem) {
                if (this.editingItem.type === 'bias') {
                    this.network.setInitialBias(this.editingItem.layer, this.editingItem.node, newValue);
                } else if (this.editingItem.type === 'weight') {
                    this.network.setInitialWeight(this.editingItem.layer, this.editingItem.toNode, this.editingItem.fromNode, newValue);
                }
                if (this.onEditComplete) this.onEditComplete();
                this.render();
            }
            modal.classList.add('hidden');
            this.editingItem = null;
        });

        // Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
                this.editingItem = null;
            }
        });
    }

    handleDoubleClick(x, y) {
        // Check if clicked on a node (for bias editing)
        for (let l = 1; l < this.nodePositions.length; l++) { // Skip input layer
            for (let n = 0; n < this.nodePositions[l].length; n++) {
                const pos = this.nodePositions[l][n];
                const radius = this.getNodeRadius(l, n);
                const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);

                if (dist < radius + 5) {
                    this.openEditModal('bias', l, n);
                    return;
                }
            }
        }

        // Check if clicked on a connection (for weight editing)
        for (let l = 0; l < this.network.weights.length; l++) {
            for (let j = 0; j < this.network.weights[l].length; j++) {
                for (let k = 0; k < this.network.weights[l][j].length; k++) {
                    const from = this.nodePositions[l][k];
                    const to = this.nodePositions[l + 1][j];

                    const dist = this.pointToLineDistance(x, y, from.x, from.y, to.x, to.y);

                    if (dist < 10) {
                        this.openEditModal('weight', l, j, k);
                        return;
                    }
                }
            }
        }
    }

    openEditModal(type, layer, nodeOrToNode, fromNode = null) {
        const modal = document.getElementById('edit-modal');
        const title = document.getElementById('modal-title');
        const initialInput = document.getElementById('edit-initial');
        const currentInput = document.getElementById('edit-current');

        if (type === 'bias') {
            const biasLayer = layer - 1;
            const initialValue = this.network.initialBiases[biasLayer]?.[nodeOrToNode] ?? 0;
            const currentValue = this.network.biases[biasLayer]?.[nodeOrToNode] ?? 0;

            title.textContent = `Edit Bias [Layer ${layer}][Node ${nodeOrToNode}]`;
            initialInput.value = initialValue.toFixed(4);
            currentInput.value = currentValue.toFixed(4);

            this.editingItem = { type: 'bias', layer: biasLayer, node: nodeOrToNode };
        } else {
            const initialValue = this.network.initialWeights[layer]?.[nodeOrToNode]?.[fromNode] ?? 0;
            const currentValue = this.network.weights[layer]?.[nodeOrToNode]?.[fromNode] ?? 0;

            title.textContent = `Edit Weight [${layer}][${nodeOrToNode}][${fromNode}]`;
            initialInput.value = initialValue.toFixed(4);
            currentInput.value = currentValue.toFixed(4);

            this.editingItem = { type: 'weight', layer, toNode: nodeOrToNode, fromNode };
        }

        modal.classList.remove('hidden');
    }

    checkHover(x, y, clientX, clientY) {
        if (!this.network || this.nodePositions.length === 0) return;

        let foundConnection = null;
        let foundNode = null;
        const connectionThreshold = 10;

        // Check nodes first (higher priority)
        for (let l = 0; l < this.nodePositions.length; l++) {
            for (let n = 0; n < this.nodePositions[l].length; n++) {
                const pos = this.nodePositions[l][n];
                const radius = this.getNodeRadius(l, n);
                const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);

                if (dist < radius + 5) {
                    foundNode = { layer: l, node: n };
                    break;
                }
            }
            if (foundNode) break;
        }

        // Check connections if no node hovered
        if (!foundNode) {
            outer:
            for (let l = 0; l < this.network.weights.length; l++) {
                for (let j = 0; j < this.network.weights[l].length; j++) {
                    for (let k = 0; k < this.network.weights[l][j].length; k++) {
                        const from = this.nodePositions[l][k];
                        const to = this.nodePositions[l + 1][j];

                        const dist = this.pointToLineDistance(x, y, from.x, from.y, to.x, to.y);

                        if (dist < connectionThreshold) {
                            foundConnection = {
                                layer: l,
                                fromNode: k,
                                toNode: j,
                                weight: this.network.weights[l][j][k],
                                initialWeight: this.network.initialWeights[l] ? this.network.initialWeights[l][j][k] : 0,
                                gradient: this.network.weightGradients[l]
                                    ? this.network.weightGradients[l][j][k]
                                    : 0
                            };
                            break outer;
                        }
                    }
                }
            }
        }

        // Update tooltip
        if (foundNode) {
            if (this.hoveredNode?.layer !== foundNode.layer || this.hoveredNode?.node !== foundNode.node) {
                this.hoveredNode = foundNode;
                this.hoveredConnection = null;

                // Get bias info (skip input layer)
                if (foundNode.layer > 0) {
                    const biasLayer = foundNode.layer - 1;
                    const currentBias = this.network.biases[biasLayer][foundNode.node];
                    const initialBias = this.network.initialBiases[biasLayer]
                        ? this.network.initialBiases[biasLayer][foundNode.node]
                        : 0;
                    const delta = currentBias - initialBias;
                    const deltaColor = delta >= 0 ? this.colors.increased : this.colors.decreased;

                    this.tooltip.innerHTML = `
                        <strong>Node [L${foundNode.layer}][${foundNode.node}]</strong><br>
                        <span style="color:#888">Initial:</span> ${initialBias.toFixed(4)}<br>
                        <span style="color:#fff">Current:</span> ${currentBias.toFixed(4)}<br>
                        <span style="color:${deltaColor}">Δ:</span> <span style="color:${deltaColor}">${delta >= 0 ? '+' : ''}${delta.toFixed(4)}</span>
                    `;
                } else {
                    this.tooltip.innerHTML = `<strong>Input Node</strong>`;
                }

                this.tooltip.style.left = `${clientX + 10}px`;
                this.tooltip.style.top = `${clientY + 10}px`;
                this.tooltip.classList.add('visible');
                this.render();
            }
        } else if (foundConnection) {
            if (JSON.stringify(this.hoveredConnection) !== JSON.stringify(foundConnection)) {
                this.hoveredConnection = foundConnection;
                this.hoveredNode = null;

                const delta = foundConnection.weight - foundConnection.initialWeight;
                const deltaColor = delta >= 0 ? this.colors.increased : this.colors.decreased;

                this.tooltip.innerHTML = `
                    <strong>W[${foundConnection.layer}][${foundConnection.toNode}][${foundConnection.fromNode}]</strong><br>
                    <span style="color:#888">Initial:</span> ${foundConnection.initialWeight.toFixed(4)}<br>
                    <span style="color:#fff">Current:</span> ${foundConnection.weight.toFixed(4)}<br>
                    <span style="color:${deltaColor}">Δ:</span> <span style="color:${deltaColor}">${delta >= 0 ? '+' : ''}${delta.toFixed(4)}</span><br>
                    <span style="color:#888">Grad:</span> ${foundConnection.gradient.toFixed(6)}
                `;
                this.tooltip.style.left = `${clientX + 10}px`;
                this.tooltip.style.top = `${clientY + 10}px`;
                this.tooltip.classList.add('visible');
                this.render();
            }
        } else {
            if (this.hoveredConnection || this.hoveredNode) {
                this.hoveredConnection = null;
                this.hoveredNode = null;
                this.tooltip.classList.remove('visible');
                this.render();
            }
        }
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
    }

    setNetwork(network) {
        this.network = network;
        this.calculateNodePositions();
        this.resize();
    }

    calculateNodePositions() {
        if (!this.network) return;

        this.nodePositions = [];
        const padding = 80;
        const layerCount = this.network.layerSizes.length;

        for (let l = 0; l < layerCount; l++) {
            const layerPositions = [];
            const nodeCount = this.network.layerSizes[l];
            const x = padding + (l / (layerCount - 1)) * (this.width - padding * 2);

            for (let n = 0; n < nodeCount; n++) {
                const y = padding + ((n + 0.5) / nodeCount) * (this.height - padding * 2);
                layerPositions.push({ x, y });
            }

            this.nodePositions.push(layerPositions);
        }
    }

    // Calculate node radius based on bias delta
    getNodeRadius(layerIndex, nodeIndex) {
        if (layerIndex === 0) return this.baseNodeRadius; // Input layer - no bias

        const biasLayer = layerIndex - 1;
        const currentBias = this.network.biases[biasLayer][nodeIndex];
        const initialBias = this.network.initialBiases[biasLayer]
            ? this.network.initialBiases[biasLayer][nodeIndex]
            : 0;
        const delta = currentBias - initialBias;

        // Scale factor: base ± delta * multiplier (capped)
        const scaleFactor = 1 + Math.max(-0.5, Math.min(0.8, delta * 2));
        return this.baseNodeRadius * scaleFactor;
    }

    // Calculate edge width based on weight delta
    getEdgeWidth(layerIndex, fromNode, toNode) {
        const weight = this.network.weights[layerIndex][toNode][fromNode];
        const initialWeight = this.network.initialWeights[layerIndex]
            ? this.network.initialWeights[layerIndex][toNode][fromNode]
            : 0;
        const delta = weight - initialWeight;

        // Scale factor: base ± delta * multiplier (capped)
        const scaleFactor = 1 + Math.max(-0.7, Math.min(1.5, delta * 1.5));
        return Math.max(0.3, this.baseEdgeWidth * scaleFactor);
    }

    render() {
        if (!this.network || !this.ctx) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Draw connections
        for (let l = 0; l < this.network.weights.length; l++) {
            for (let j = 0; j < this.network.weights[l].length; j++) {
                for (let k = 0; k < this.network.weights[l][j].length; k++) {
                    this.drawConnection(l, k, j);
                }
            }
        }

        // Draw nodes with bias info
        for (let l = 0; l < this.nodePositions.length; l++) {
            for (let n = 0; n < this.nodePositions[l].length; n++) {
                this.drawNode(l, n);
            }
        }

        // Draw gradient legend if in gradient heatmap mode
        if (this.visualizationMode === 'gradient-heatmap') {
            this.drawGradientLegend();
        }

        // Continue backprop animation if active
        if (this.backpropAnimationState.animating) {
            this.drawBackpropAnimation();
        }
    }

    // Set visualization mode
    setVisualizationMode(mode) {
        this.visualizationMode = mode;
        if (mode !== 'backprop-animation') {
            this.backpropAnimationState.animating = false;
        }
        this.render();
    }

    // Get gradient color based on magnitude (0 to 1 normalized)
    getGradientColor(normalizedMag) {
        if (normalizedMag < 0.25) {
            return this.colors.gradientLow;  // Blue - low gradient
        } else if (normalizedMag < 0.5) {
            return this.colors.gradientMid;  // Green - medium
        } else if (normalizedMag < 0.75) {
            return this.colors.gradientHigh; // Yellow/Orange - high
        } else {
            return this.colors.gradientMax;  // Red - very high/exploding
        }
    }

    // Draw gradient legend in corner
    drawGradientLegend() {
        const ctx = this.ctx;
        const legendWidth = 120;
        const legendHeight = 20;
        const x = this.width - legendWidth - 15;
        const y = 15;

        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x - 5, y - 5, legendWidth + 10, legendHeight + 30);

        // Draw gradient bar
        const gradient = ctx.createLinearGradient(x, y, x + legendWidth, y);
        gradient.addColorStop(0, this.colors.gradientLow);
        gradient.addColorStop(0.33, this.colors.gradientMid);
        gradient.addColorStop(0.66, this.colors.gradientHigh);
        gradient.addColorStop(1, this.colors.gradientMax);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, legendWidth, legendHeight);

        // Draw labels
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Low', x, y + legendHeight + 12);
        ctx.textAlign = 'center';
        ctx.fillText('Gradient', x + legendWidth / 2, y + legendHeight + 12);
        ctx.textAlign = 'right';
        ctx.fillText('High', x + legendWidth, y + legendHeight + 12);
    }

    // Start backpropagation animation
    startBackpropAnimation() {
        this.visualizationMode = 'backprop-animation';
        this.backpropAnimationState = {
            animating: true,
            currentLayer: this.network.weights.length, // Start from output
            progress: 0,
            startTime: performance.now()
        };
        this.animateBackpropFrame();
    }

    // Animation frame for backprop
    animateBackpropFrame() {
        if (!this.backpropAnimationState.animating) return;

        const elapsed = performance.now() - this.backpropAnimationState.startTime;
        const layerDuration = 800; // ms per layer
        const totalLayers = this.network.weights.length;

        const totalProgress = elapsed / layerDuration;
        const currentLayer = totalLayers - Math.floor(totalProgress);
        const layerProgress = totalProgress % 1;

        if (currentLayer < 0) {
            // Animation complete
            this.backpropAnimationState.animating = false;
            this.render();
            return;
        }

        this.backpropAnimationState.currentLayer = currentLayer;
        this.backpropAnimationState.progress = layerProgress;

        this.render();
        requestAnimationFrame(() => this.animateBackpropFrame());
    }

    // Draw backprop animation overlay
    drawBackpropAnimation() {
        const ctx = this.ctx;
        const state = this.backpropAnimationState;

        if (state.currentLayer < 0 || state.currentLayer >= this.network.weights.length) return;

        // Draw flowing arrows from right to left for current layer
        const layerIndex = state.currentLayer;
        const fromPositions = this.nodePositions[layerIndex + 1];
        const toPositions = this.nodePositions[layerIndex];

        ctx.save();

        for (let j = 0; j < fromPositions.length; j++) {
            for (let k = 0; k < toPositions.length; k++) {
                const from = fromPositions[j];
                const to = toPositions[k];

                // Get gradient magnitude for color intensity
                let gradMag = 0;
                if (this.network.weightGradients[layerIndex] &&
                    this.network.weightGradients[layerIndex][j]) {
                    gradMag = Math.abs(this.network.weightGradients[layerIndex][j][k] || 0);
                }
                const normalizedMag = this.network.maxGradientMagnitude > 0
                    ? Math.min(1, gradMag / this.network.maxGradientMagnitude)
                    : 0;

                // Draw particle flowing backward
                const particleX = from.x - (from.x - to.x) * state.progress;
                const particleY = from.y - (from.y - to.y) * state.progress;

                const color = this.getGradientColor(normalizedMag);
                const size = 3 + normalizedMag * 4;

                ctx.beginPath();
                ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.8;
                ctx.fill();

                // Draw trail
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(particleX, particleY);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.4;
                ctx.stroke();
            }
        }

        ctx.restore();

        // Draw layer label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`← Backprop Layer ${layerIndex + 1}`, this.width / 2, this.height - 20);
    }

    drawConnection(layerIndex, fromNode, toNode) {
        const ctx = this.ctx;
        const from = this.nodePositions[layerIndex][fromNode];
        const to = this.nodePositions[layerIndex + 1][toNode];
        const weight = this.network.weights[layerIndex][toNode][fromNode];
        const initialWeight = this.network.initialWeights[layerIndex]
            ? this.network.initialWeights[layerIndex][toNode][fromNode]
            : 0;

        // Calculate delta for color
        const delta = weight - initialWeight;

        // Check if this connection is hovered
        const isHovered = this.hoveredConnection &&
            this.hoveredConnection.layer === layerIndex &&
            this.hoveredConnection.fromNode === fromNode &&
            this.hoveredConnection.toNode === toNode;

        let color;
        let alpha = 0.5 + Math.min(Math.abs(delta) * 0.5, 0.4);

        // Choose coloring based on visualization mode
        if (this.visualizationMode === 'gradient-heatmap') {
            // Color by gradient magnitude
            let gradMag = 0;
            if (this.network.weightGradients[layerIndex] &&
                this.network.weightGradients[layerIndex][toNode]) {
                gradMag = Math.abs(this.network.weightGradients[layerIndex][toNode][fromNode] || 0);
            }
            const normalizedMag = this.network.maxGradientMagnitude > 0
                ? Math.min(1, gradMag / this.network.maxGradientMagnitude)
                : 0;
            color = this.getGradientColor(normalizedMag);
            alpha = 0.4 + normalizedMag * 0.6;
        } else {
            // Default: color based on delta (green if increased, red if decreased)
            if (Math.abs(delta) < 0.0001) {
                color = this.colors.neutral;
            } else if (delta > 0) {
                color = this.colors.increased;
            } else {
                color = this.colors.decreased;
            }
        }

        // Dynamic width based on delta
        const lineWidth = this.getEdgeWidth(layerIndex, fromNode, toNode);

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);

        if (isHovered) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = lineWidth + 2;
            ctx.globalAlpha = 1;
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.globalAlpha = alpha;
        }

        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    drawNode(layerIndex, nodeIndex) {
        const ctx = this.ctx;
        const pos = this.nodePositions[layerIndex][nodeIndex];
        const radius = this.getNodeRadius(layerIndex, nodeIndex);

        // Check if this neuron is dropped (during training visualization)
        let isDropped = false;
        if (this.network.isTraining &&
            this.network.dropoutRate > 0 &&
            layerIndex > 0 &&
            layerIndex < this.nodePositions.length - 1) {
            const dropoutLayerIndex = layerIndex - 1;
            if (this.network.dropoutMasks[dropoutLayerIndex]) {
                isDropped = this.network.dropoutMasks[dropoutLayerIndex][nodeIndex] === true;
            }
        }

        // Get delta for coloring (skip input layer)
        let delta = 0;
        let color = this.colors.neutral;
        let currentBias = 0;
        let initialBias = 0;

        if (layerIndex > 0) {
            const biasLayer = layerIndex - 1;
            currentBias = this.network.biases[biasLayer][nodeIndex];
            initialBias = this.network.initialBiases[biasLayer]
                ? this.network.initialBiases[biasLayer][nodeIndex]
                : 0;
            delta = currentBias - initialBias;

            if (this.visualizationMode === 'gradient-heatmap' && layerIndex < this.nodePositions.length - 1) {
                // Use gradient magnitude for node color
                let deltaMag = 0;
                if (this.network.deltaValues[layerIndex - 1]) {
                    deltaMag = Math.abs(this.network.deltaValues[layerIndex - 1][nodeIndex] || 0);
                }
                const maxDelta = Math.max(...this.network.deltaValues.flat().map(Math.abs), 0.001);
                const normalizedMag = Math.min(1, deltaMag / maxDelta);
                color = this.getGradientColor(normalizedMag);
            } else if (isDropped) {
                // Dropped neuron styling
                color = this.colors.droppedStroke;
            } else {
                // Default delta-based coloring
                if (Math.abs(delta) < 0.0001) {
                    color = this.colors.neutral;
                } else if (delta > 0) {
                    color = this.colors.increased;
                } else {
                    color = this.colors.decreased;
                }
            }
        }

        // Check if hovered
        const isHovered = this.hoveredNode &&
            this.hoveredNode.layer === layerIndex &&
            this.hoveredNode.node === nodeIndex;

        // Draw glow (skip for dropped neurons)
        if (!isDropped) {
            const gradient = ctx.createRadialGradient(
                pos.x, pos.y, 0,
                pos.x, pos.y, radius * 2
            );
            const glowIntensity = isHovered ? 0.8 : 0.3;
            gradient.addColorStop(0, `${color}${Math.floor(glowIntensity * 255).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(1, `${color}00`);

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius * 2, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Draw actual node (sized based on delta)
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isDropped ? this.colors.droppedFill : this.colors.nodeFill;
        ctx.globalAlpha = isDropped ? 0.4 : 1;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw WHITE DASHED reference circle at original size INSIDE larger nodes
        // Only draw if node is larger than base, so it appears inside
        if (layerIndex > 0 && radius > this.baseNodeRadius && !isDropped) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.baseNodeRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        // If node is smaller than base, draw reference OUTSIDE
        if (layerIndex > 0 && radius < this.baseNodeRadius && !isDropped) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.baseNodeRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Stroke based on delta color (dashed for dropped neurons)
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = isHovered ? '#ffffff' : color;
        ctx.lineWidth = isHovered ? 3 : 2;
        if (isDropped) {
            ctx.setLineDash([4, 4]);
            ctx.globalAlpha = 0.5;
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Draw X overlay for dropped neurons
        if (isDropped) {
            ctx.beginPath();
            ctx.moveTo(pos.x - radius * 0.5, pos.y - radius * 0.5);
            ctx.lineTo(pos.x + radius * 0.5, pos.y + radius * 0.5);
            ctx.moveTo(pos.x + radius * 0.5, pos.y - radius * 0.5);
            ctx.lineTo(pos.x - radius * 0.5, pos.y + radius * 0.5);
            ctx.strokeStyle = this.colors.decreased;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }



        // Draw layer label for first node of each layer
        if (nodeIndex === 0) {
            ctx.fillStyle = this.colors.text;
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';

            let label;
            if (layerIndex === 0) label = 'Input';
            else if (layerIndex === this.network.layerSizes.length - 1) label = 'Output';
            else label = `Hidden ${layerIndex}`;

            ctx.fillText(label, pos.x, 20);
        }
    }
}

// Export
window.NetworkVisualizer = NetworkVisualizer;
