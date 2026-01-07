/**
 * Spectral Graph Theory - Main UI Script
 */

// State
let spectralEngine = new SpectralEngine();
let currentTab = 'graph';
let selectedEigenvalueIndex = 1; // Default to Fiedler (λ₂)
let nodes = [];

// DOM Elements
const matrixSizeInput = document.getElementById('matrixSize');
const matrixContainer = document.getElementById('matrixInputContainer');
const mainCanvas = document.getElementById('mainCanvas');
const ctx = mainCanvas.getContext('2d');
const spectrumCanvas = document.getElementById('spectrumCanvas');
const fiedlerCanvas = document.getElementById('fiedlerCanvas');

// Initialize
function init() {
    setupEventListeners();
    buildMatrixInputs(4);
    applyPreset('cycle');
    updateAll();
}

function setupEventListeners() {
    // Matrix size
    matrixSizeInput.addEventListener('change', () => {
        const size = Math.min(8, Math.max(2, parseInt(matrixSizeInput.value) || 4));
        matrixSizeInput.value = size;
        buildMatrixInputs(size);
        applyPreset('cycle');
        updateAll();
    });

    // Buttons
    document.getElementById('randomizeBtn').addEventListener('click', () => {
        applyPreset('random');
        updateAll();
    });
    document.getElementById('clearBtn').addEventListener('click', () => {
        clearMatrix();
        updateAll();
    });
    document.getElementById('presetCycleBtn').addEventListener('click', () => {
        applyPreset('cycle');
        updateAll();
    });
    document.getElementById('presetCompleteBtn').addEventListener('click', () => {
        applyPreset('complete');
        updateAll();
    });
    document.getElementById('presetPathBtn').addEventListener('click', () => {
        applyPreset('path');
        updateAll();
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
        applyPreset('cycle');
        updateAll();
    });

    // Laplacian type
    document.querySelectorAll('input[name="laplacianType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            spectralEngine.laplacianType = radio.value;
            updateAll();
        });
    });

    // Tabs
    document.querySelectorAll('.viz-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.viz-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            showTab(currentTab);
        });
    });

    // Canvas resize
    window.addEventListener('resize', resizeCanvases);
    resizeCanvases();
}

function resizeCanvases() {
    const container = document.querySelector('.canvas-container');
    const rect = container.getBoundingClientRect();

    [mainCanvas, spectrumCanvas, fiedlerCanvas].forEach(canvas => {
        canvas.width = rect.width;
        canvas.height = rect.height;
    });

    updateVisualization();
}

function buildMatrixInputs(size) {
    matrixContainer.innerHTML = '';
    matrixContainer.style.gridTemplateColumns = `repeat(${size}, 40px)`;

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '1';
            input.value = '0';
            input.dataset.row = i;
            input.dataset.col = j;
            input.addEventListener('change', onMatrixChange);
            matrixContainer.appendChild(input);
        }
    }

    initNodes(size);
}

function onMatrixChange(e) {
    const input = e.target;
    const i = parseInt(input.dataset.row);
    const j = parseInt(input.dataset.col);
    const val = parseInt(input.value) || 0;

    // Mirror for undirected graph
    const mirrorInput = matrixContainer.querySelector(`input[data-row="${j}"][data-col="${i}"]`);
    if (mirrorInput && i !== j) {
        mirrorInput.value = val;
    }

    updateAll();
}

function getMatrixFromInputs() {
    const size = parseInt(matrixSizeInput.value);
    const matrix = Array(size).fill(0).map(() => Array(size).fill(0));

    matrixContainer.querySelectorAll('input').forEach(input => {
        const i = parseInt(input.dataset.row);
        const j = parseInt(input.dataset.col);
        matrix[i][j] = parseInt(input.value) || 0;
    });

    return matrix;
}

function setMatrixToInputs(matrix) {
    matrix.forEach((row, i) => {
        row.forEach((val, j) => {
            const input = matrixContainer.querySelector(`input[data-row="${i}"][data-col="${j}"]`);
            if (input) input.value = val;
        });
    });
}

function clearMatrix() {
    matrixContainer.querySelectorAll('input').forEach(input => input.value = '0');
}

function applyPreset(type) {
    const size = parseInt(matrixSizeInput.value);
    let matrix;

    switch (type) {
        case 'cycle': matrix = SpectralEngine.createCycleGraph(size); break;
        case 'complete': matrix = SpectralEngine.createCompleteGraph(size); break;
        case 'path': matrix = SpectralEngine.createPathGraph(size); break;
        case 'random': matrix = SpectralEngine.createRandomGraph(size, 0.4); break;
        default: matrix = SpectralEngine.createCycleGraph(size);
    }

    setMatrixToInputs(matrix);
}

function initNodes(count) {
    nodes = [];
    const cx = mainCanvas.width / 2;
    const cy = mainCanvas.height / 2;
    const radius = Math.min(cx, cy) * 0.6;

    for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i / count) - Math.PI / 2;
        nodes.push({
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
            label: i
        });
    }
}

function updateAll() {
    const matrix = getMatrixFromInputs();
    spectralEngine.setAdjacencyMatrix(matrix);

    updateGraphProperties();
    updateEigenvalueList();
    updateSpectralAnalysis();
    updateVisualization();
}

function updateGraphProperties() {
    const matrix = getMatrixFromInputs();
    const n = matrix.length;
    let edges = 0;

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (matrix[i][j] !== 0) edges++;
        }
    }

    const degrees = spectralEngine.getDegrees();
    const avgDegree = degrees.reduce((a, b) => a + b, 0) / n;

    document.getElementById('graphProperties').innerHTML = `
        <div class="property-item"><span class="property-label">Nodes</span><span class="property-value">${n}</span></div>
        <div class="property-item"><span class="property-label">Edges</span><span class="property-value">${edges}</span></div>
        <div class="property-item"><span class="property-label">Avg Degree</span><span class="property-value">${avgDegree.toFixed(2)}</span></div>
    `;
}

function updateEigenvalueList() {
    const result = spectralEngine.computeEigendecomposition();
    const container = document.getElementById('eigenvalueList');
    const maxEig = Math.max(...result.eigenvalues.map(Math.abs), 1);

    container.innerHTML = result.eigenvalues.map((λ, i) => `
        <div class="eigenvalue-item ${i === selectedEigenvalueIndex ? 'selected' : ''}" data-index="${i}">
            <span class="eigenvalue-index">λ${i + 1}</span>
            <span class="eigenvalue-value">${λ.toFixed(4)}</span>
            <div class="eigenvalue-bar">
                <div class="eigenvalue-bar-fill" style="width: ${(Math.abs(λ) / maxEig) * 100}%"></div>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.eigenvalue-item').forEach(item => {
        item.addEventListener('click', () => {
            selectedEigenvalueIndex = parseInt(item.dataset.index);
            updateEigenvalueList();
            if (currentTab === 'fiedler') updateVisualization();
        });
    });
}

function updateSpectralAnalysis() {
    const numComponents = spectralEngine.getNumConnectedComponents();
    const algebraicConn = spectralEngine.getAlgebraicConnectivity();
    const result = spectralEngine.computeEigendecomposition();
    const spectralRadius = result.eigenvalues.length > 0 ? Math.max(...result.eigenvalues) : 0;

    document.getElementById('spectralAnalysis').innerHTML = `
        <div class="analysis-item">
            <span class="analysis-label">Components</span>
            <span class="analysis-value ${numComponents > 1 ? 'warning' : 'success'}">${numComponents}</span>
        </div>
        <div class="analysis-item">
            <span class="analysis-label">λ₂ (Fiedler)</span>
            <span class="analysis-value">${algebraicConn.toFixed(4)}</span>
        </div>
        <div class="analysis-item">
            <span class="analysis-label">λₘₐₓ</span>
            <span class="analysis-value">${spectralRadius.toFixed(4)}</span>
        </div>
    `;
}

function showTab(tab) {
    document.getElementById('spectrumContainer').classList.toggle('hidden', tab !== 'spectrum');
    document.getElementById('laplacianContainer').classList.toggle('hidden', tab !== 'laplacian');
    document.getElementById('fiedlerContainer').classList.toggle('hidden', tab !== 'fiedler');
    mainCanvas.style.display = tab === 'graph' ? 'block' : 'none';

    updateVisualization();
}

function updateVisualization() {
    const n = parseInt(matrixSizeInput.value);
    if (nodes.length !== n) initNodes(n);

    switch (currentTab) {
        case 'graph': drawGraph(); break;
        case 'spectrum': drawSpectrum(); break;
        case 'laplacian': drawLaplacian(); break;
        case 'fiedler': drawFiedler(); break;
    }
}

function drawGraph() {
    const matrix = getMatrixFromInputs();
    const n = matrix.length;

    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    // Get Fiedler vector for coloring
    const fiedler = spectralEngine.getFiedlerVector();
    const fiedlerVec = fiedler ? fiedler.eigenvector : null;

    // Draw edges
    ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (matrix[i][j] !== 0) {
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
                ctx.stroke();
            }
        }
    }

    // Draw nodes
    const nodeRadius = 24;
    nodes.forEach((node, i) => {
        // Color by Fiedler value
        let hue = 220;
        if (fiedlerVec) {
            const normalized = (fiedlerVec[i] + 1) / 2;
            hue = normalized * 120 + 180; // Blue to green range
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i.toString(), node.x, node.y);
    });
}

function drawSpectrum() {
    const sctx = spectrumCanvas.getContext('2d');
    const result = spectralEngine.computeEigendecomposition();
    const eigenvalues = result.eigenvalues;

    sctx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

    if (eigenvalues.length === 0) return;

    const padding = 60;
    const w = spectrumCanvas.width - padding * 2;
    const h = spectrumCanvas.height - padding * 2;
    const maxEig = Math.max(...eigenvalues, 1);
    const barWidth = Math.min(60, w / eigenvalues.length - 10);

    // Draw axes
    sctx.strokeStyle = 'rgba(255,255,255,0.3)';
    sctx.lineWidth = 1;
    sctx.beginPath();
    sctx.moveTo(padding, padding);
    sctx.lineTo(padding, spectrumCanvas.height - padding);
    sctx.lineTo(spectrumCanvas.width - padding, spectrumCanvas.height - padding);
    sctx.stroke();

    // Draw bars
    eigenvalues.forEach((λ, i) => {
        const x = padding + (i + 0.5) * (w / eigenvalues.length);
        const barHeight = (λ / maxEig) * h * 0.8;
        const y = spectrumCanvas.height - padding - barHeight;

        const gradient = sctx.createLinearGradient(x, y, x, spectrumCanvas.height - padding);
        gradient.addColorStop(0, 'rgb(99, 102, 241)');
        gradient.addColorStop(1, 'rgb(139, 92, 246)');

        sctx.fillStyle = gradient;
        sctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

        // Label
        sctx.fillStyle = 'white';
        sctx.font = '12px Inter';
        sctx.textAlign = 'center';
        sctx.fillText(`λ${i + 1}`, x, spectrumCanvas.height - padding + 20);
        sctx.fillText(λ.toFixed(2), x, y - 10);
    });

    // Title
    sctx.font = 'bold 16px Inter';
    sctx.fillStyle = 'white';
    sctx.textAlign = 'center';
    sctx.fillText('Eigenvalue Spectrum', spectrumCanvas.width / 2, 30);
}

function drawLaplacian() {
    const L = spectralEngine.getLaplacian();
    const container = document.getElementById('laplacianMatrix');
    const n = L.length;

    container.style.gridTemplateColumns = `repeat(${n}, 50px)`;
    container.innerHTML = L.map((row, i) =>
        row.map((val, j) => {
            const cls = i === j ? 'diagonal' : (val === 0 ? 'zero' : 'off-diagonal');
            return `<div class="laplacian-cell ${cls}">${val.toFixed(2)}</div>`;
        }).join('')
    ).join('');
}

function drawFiedler() {
    const fctx = fiedlerCanvas.getContext('2d');
    const result = spectralEngine.computeEigendecomposition();

    fctx.clearRect(0, 0, fiedlerCanvas.width, fiedlerCanvas.height);

    if (result.eigenvectors.length <= selectedEigenvalueIndex) return;

    const vec = result.eigenvectors[selectedEigenvalueIndex];
    const n = vec.length;
    const padding = 60;
    const w = fiedlerCanvas.width - padding * 2;
    const h = fiedlerCanvas.height - padding * 2;
    const maxVal = Math.max(...vec.map(Math.abs), 0.01);
    const barWidth = Math.min(60, w / n - 10);
    const midY = fiedlerCanvas.height / 2;

    // Draw zero line
    fctx.strokeStyle = 'rgba(255,255,255,0.3)';
    fctx.beginPath();
    fctx.moveTo(padding, midY);
    fctx.lineTo(fiedlerCanvas.width - padding, midY);
    fctx.stroke();

    // Draw bars
    vec.forEach((v, i) => {
        const x = padding + (i + 0.5) * (w / n);
        const barHeight = (v / maxVal) * (h / 2) * 0.8;
        const y = v >= 0 ? midY - barHeight : midY;

        fctx.fillStyle = v >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
        fctx.fillRect(x - barWidth / 2, y, barWidth, Math.abs(barHeight));

        // Node label
        fctx.fillStyle = 'white';
        fctx.font = '12px Inter';
        fctx.textAlign = 'center';
        fctx.fillText(`v${i}`, x, fiedlerCanvas.height - 30);
        fctx.fillText(v.toFixed(3), x, v >= 0 ? y - 10 : y + Math.abs(barHeight) + 15);
    });

    // Title
    fctx.font = 'bold 16px Inter';
    fctx.fillStyle = 'white';
    fctx.textAlign = 'center';
    fctx.fillText(`Eigenvector for λ${selectedEigenvalueIndex + 1}`, fiedlerCanvas.width / 2, 30);
}

// Start
init();
