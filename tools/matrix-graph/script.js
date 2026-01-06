/**
 * Matrix to Graph Visualizer
 * Logic for rendering adjacency matrices as graphs.
 */

// State
const state = {
    size: 4,
    matrix: [],
    settings: {
        directed: true,
        weighted: true,
        selfLoops: true,
        nodeRadius: 25,
        layoutRadius: 200,
        partitionSize: 1,
        showPartitionColors: false
    },
    hoveredNode: null,
    algo: {
        isRunning: false,
        type: null, // 'bfs' or 'dfs'
        queue: [], // or stack for DFS
        visited: new Set(),
        current: null,
        checkingNeighbor: null, // node currently being checked
        path: [], // traversal order
        generator: null,
        intervalId: null
    }
};

// DOM Elements
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const matrixInputContainer = document.getElementById('matrixInputContainer');
const matrixSizeInput = document.getElementById('matrixSize');
const directedCheck = document.getElementById('directedCheck');
const weightedCheck = document.getElementById('weightedCheck');
const selfLoopsCheck = document.getElementById('selfLoopsCheck');
const nodeRadiusRange = document.getElementById('nodeRadiusRange');
const repulsionRange = document.getElementById('repulsionRange');
const partitionSizeInput = document.getElementById('partitionSizeInput');
const showPartitionColors = document.getElementById('showPartitionColors');
const randomizeBtn = document.getElementById('randomizeBtn');
const clearBtn = document.getElementById('clearBtn');
const identityBtn = document.getElementById('identityBtn');
const graphInfo = document.getElementById('graphInfo');
const connectivityStatus = document.getElementById('connectivityStatus');

// Algo Elements
const bfsBtn = document.getElementById('bfsBtn');
const dfsBtn = document.getElementById('dfsBtn');
const resetAlgoBtn = document.getElementById('resetAlgoBtn');
const startNodeInput = document.getElementById('startNodeInput');
const algoStatus = document.getElementById('algoStatus');

// Partition Colors
const PALETTE = [
    '#64748b', // Default
    '#3b82f6', // Blue
    '#22c55e', // Green
    '#eab308', // Yellow
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316'  // Orange
];

// Initialization
function init() {
    // Set canvas size
    try {
        resizeCanvas();
    } catch (e) {
        console.error("Resize error:", e);
    }
    window.addEventListener('resize', resizeCanvas);

    // Initialize matrix
    const initialSize = parseInt(matrixSizeInput.value) || 4;
    initMatrix(initialSize);

    // Set initial partition size
    state.settings.partitionSize = parseInt(partitionSizeInput.value) || 1;

    renderMatrixInput();
    updateAnalysis();

    // Event Listeners
    matrixSizeInput.addEventListener('change', (e) => {
        const newSize = parseInt(e.target.value);
        if (newSize >= 2 && newSize <= 10) {
            updateMatrixSize(newSize);
        }
    });

    directedCheck.addEventListener('change', (e) => {
        state.settings.directed = e.target.checked;
        updateAnalysis();
        draw();
    });

    weightedCheck.addEventListener('change', (e) => {
        state.settings.weighted = e.target.checked;
        draw();
    });

    selfLoopsCheck.addEventListener('change', (e) => {
        state.settings.selfLoops = e.target.checked;
        draw();
    });

    nodeRadiusRange.addEventListener('input', (e) => {
        state.settings.nodeRadius = parseInt(e.target.value);
        draw();
    });

    repulsionRange.setAttribute('min', '50');
    repulsionRange.setAttribute('max', '400');
    repulsionRange.value = state.settings.layoutRadius;
    repulsionRange.addEventListener('input', (e) => {
        state.settings.layoutRadius = parseInt(e.target.value);
        draw();
    });

    // Partition Listeners
    partitionSizeInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (val < 1) val = 1;
        if (val > state.size) val = state.size;
        state.settings.partitionSize = val;
        renderMatrixInput(); // Re-render to show grid lines
        draw();
    });

    showPartitionColors.addEventListener('change', (e) => {
        state.settings.showPartitionColors = e.target.checked;
        renderMatrixInput();
        draw();
    });

    randomizeBtn.addEventListener('click', randomizeMatrix);
    clearBtn.addEventListener('click', clearMatrix);
    identityBtn.addEventListener('click', setIdentityMatrix);

    // Algo Listeners
    bfsBtn.addEventListener('click', () => startAlgorithm('bfs'));
    dfsBtn.addEventListener('click', () => startAlgorithm('dfs'));
    resetAlgoBtn.addEventListener('click', resetAlgorithm);

    canvas.addEventListener('mousemove', handleCanvasMouseMove);

    draw();
}

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    draw();
}

// Matrix Logic
function initMatrix(size) {
    if (!size) size = 4;
    state.size = size;
    state.matrix = Array(size).fill().map(() => Array(size).fill(0));
    // Default: Simple cycle
    for (let i = 0; i < size; i++) {
        state.matrix[i][(i + 1) % size] = 1;
    }
}

function updateMatrixSize(newSize) {
    const oldSize = state.size;
    const newMatrix = Array(newSize).fill().map(() => Array(newSize).fill(0));

    const minSize = Math.min(oldSize, newSize);
    for (let i = 0; i < minSize; i++) {
        for (let j = 0; j < minSize; j++) {
            newMatrix[i][j] = state.matrix[i][j];
        }
    }

    state.size = newSize;
    state.matrix = newMatrix;

    // Update partition input max
    partitionSizeInput.max = newSize;
    if (state.settings.partitionSize > newSize) {
        state.settings.partitionSize = newSize;
        partitionSizeInput.value = newSize;
    }

    resetAlgorithm(); // Stop any running algo on resize
    renderMatrixInput();
    updateAnalysis();
    draw();
}

function renderMatrixInput() {
    const k = state.settings.partitionSize;
    matrixInputContainer.style.gridTemplateColumns = `repeat(${state.size}, 1fr)`;
    matrixInputContainer.innerHTML = '';

    for (let i = 0; i < state.size; i++) {
        for (let j = 0; j < state.size; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'matrix-cell';
            input.value = state.matrix[i][j];
            input.dataset.row = i;
            input.dataset.col = j;
            input.id = `cell-${i}-${j}`; // ID for animation

            // Add visual partition borders
            if ((j + 1) % k === 0 && j !== state.size - 1) {
                input.style.borderRight = '2px solid #4f46e5';
            }
            if ((i + 1) % k === 0 && i !== state.size - 1) {
                input.style.borderBottom = '2px solid #4f46e5';
            }

            // Highlighting based on logic could go here
            if (state.settings.showPartitionColors) {
                const rowBlock = Math.floor(i / k);
                const colBlock = Math.floor(j / k);

                if (rowBlock === colBlock) {
                    const groupIndex = rowBlock;
                    const color = PALETTE[groupIndex % PALETTE.length];
                    // Add transparency for background
                    input.style.backgroundColor = hexToRgba(color, 0.2);
                    input.style.borderColor = color;
                }
            } else {
                input.style.backgroundColor = '';
                input.style.borderColor = '';
            }

            input.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value) || 0;
                state.matrix[i][j] = val;
                updateAnalysis();
                draw();
            });

            input.addEventListener('focus', (e) => {
                e.target.select();
            });

            matrixInputContainer.appendChild(input);
        }
    }
}

// Helper for hex to rgba
function hexToRgba(hex, alpha) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
    }
    return hex; // fail safe
}

function randomizeMatrix() {
    for (let i = 0; i < state.size; i++) {
        for (let j = 0; j < state.size; j++) {
            state.matrix[i][j] = Math.random() < 0.3 ? Math.floor(Math.random() * 9) + 1 : 0;
        }
    }
    syncInputs();
    updateAnalysis();
    draw();
}

function clearMatrix() {
    state.matrix = state.matrix.map(row => row.fill(0));
    syncInputs();
    updateAnalysis();
    draw();
}

function setIdentityMatrix() {
    for (let i = 0; i < state.size; i++) {
        for (let j = 0; j < state.size; j++) {
            state.matrix[i][j] = (i === j) ? 1 : 0;
        }
    }
    syncInputs();
    updateAnalysis();
    draw();
}

function syncInputs() {
    const inputs = matrixInputContainer.querySelectorAll('input');
    inputs.forEach(input => {
        const r = parseInt(input.dataset.row);
        const c = parseInt(input.dataset.col);
        input.value = state.matrix[r][c];
    });
}

// Connectivity Logic
function checkConnectivity() {
    const n = state.size;

    // Helper for BFS/DFS
    const getReachable = (start, transpose = false) => {
        const visited = new Set();
        const stack = [start];
        visited.add(start);

        while (stack.length > 0) {
            const u = stack.pop();
            for (let v = 0; v < n; v++) {
                // If edge exists (u->v normal, v->u transpose)
                const hasEdge = transpose ? (state.matrix[v][u] !== 0) : (state.matrix[u][v] !== 0);
                if (hasEdge && !visited.has(v)) {
                    visited.add(v);
                    stack.push(v);
                }
            }
        }
        return visited.size;
    };

    if (state.settings.directed) {
        // Strongly Connected: Every node reachable from every other node.
        // Kosaraju's simpler check: Pick any node (0), check if it reaches all, and if all reach it (transpose).

        // 1. Check if underlying graph is empty or has nodes?
        if (n === 0) return "Empty";

        // Check if graph has any edges at all? Not strictly required by def, 
        // but for N>1, if no edges, not connected.

        const forwardCount = getReachable(0, false);
        if (forwardCount !== n) return "Not Strongly Connected";

        const backwardCount = getReachable(0, true);
        if (backwardCount !== n) return "Not Strongly Connected";

        return "Strongly Connected";

    } else {
        // Undirected connectivity (Weakly connected)
        // Check if 0 can reach all nodes treating edges as bidirectional
        const visited = new Set();
        const stack = [0];
        visited.add(0);

        while (stack.length > 0) {
            const u = stack.pop();
            for (let v = 0; v < n; v++) {
                // Check edge u-v OR v-u
                const hasEdge = (state.matrix[u][v] !== 0) || (state.matrix[v][u] !== 0);
                if (hasEdge && !visited.has(v)) {
                    visited.add(v);
                    stack.push(v);
                }
            }
        }

        return visited.size === n ? "Connected" : "Disconnected";
    }
}

function updateAnalysis() {
    const status = checkConnectivity();
    if (connectivityStatus) {
        connectivityStatus.textContent = status;
        connectivityStatus.className = 'status-badge ' +
            (status.includes('Not') || status === 'Disconnected' ? 'badge-warning' : 'badge-success');
    }

    // Update stats
    let edges = 0;
    for (let i = 0; i < state.size; i++)
        for (let j = 0; j < state.size; j++)
            if (state.matrix[i][j] !== 0) edges++;

    updateInfo(edges);
}

// Algorithm Logic
function startAlgorithm(type) {
    if (state.algo.isRunning) resetAlgorithm();

    const startNode = parseInt(startNodeInput.value) || 0;
    if (startNode >= state.size) {
        alert("Invalid start node!");
        return;
    }

    state.algo.isRunning = true;
    state.algo.type = type;
    state.algo.visited = new Set();
    state.algo.path = [];
    state.algo.queue = [startNode]; // Used as Stack for DFS
    state.algo.current = null;
    state.algo.checkingNeighbor = null;

    // Algo Status UI
    algoStatus.style.display = 'block';
    algoStatus.className = 'status-badge badge-info';
    algoStatus.textContent = `Running ${type.toUpperCase()}...`;

    // Generator
    state.algo.generator = type === 'bfs' ? bfsGenerator(startNode) : dfsGenerator(startNode);

    // Initial tick to setup
    state.algo.generator.next();
    updateAlgoVisuals();

    // Start Loop
    state.algo.intervalId = setInterval(() => {
        const res = state.algo.generator.next();
        if (res.done) {
            finishAlgorithm();
        } else {
            updateAlgoVisuals();
        }
    }, 800); // Slow enough to see visual evolution
}

function finishAlgorithm() {
    clearInterval(state.algo.intervalId);
    state.algo.isRunning = false;
    state.algo.current = null;
    state.algo.checkingNeighbor = null;
    algoStatus.className = 'status-badge badge-success';
    algoStatus.textContent = `${state.algo.type.toUpperCase()} Completed!`;
    updateAlgoVisuals();
    draw(); // Final redraw to clear highlighters
}

function resetAlgorithm() {
    clearInterval(state.algo.intervalId);
    state.algo = {
        isRunning: false,
        type: null,
        queue: [],
        visited: new Set(),
        path: [],
        current: null,
        checkingNeighbor: null,
        intervalId: null
    };
    algoStatus.style.display = 'none';

    // Clear matrix visual classes
    document.querySelectorAll('.matrix-cell').forEach(cell => {
        cell.classList.remove('visiting-row', 'current-cell', 'visited-cell');
    });

    draw();
}

function* bfsGenerator(start) {
    state.algo.queue = [start];
    state.algo.visited.add(start);
    state.algo.path.push(start);

    while (state.algo.queue.length > 0) {
        const u = state.algo.queue.shift(); // Dequeue
        state.algo.current = u;
        yield { step: 'visit_node', node: u };

        // Scan row u
        for (let v = 0; v < state.size; v++) {
            state.algo.checkingNeighbor = v;
            yield { step: 'check_cell', u, v };

            const hasEdge = state.matrix[u][v] !== 0;
            if (hasEdge && !state.algo.visited.has(v)) {
                state.algo.visited.add(v);
                state.algo.queue.push(v);
                state.algo.path.push(v);
                yield { step: 'found_neighbor', u, v };
            }
        }
        state.algo.checkingNeighbor = null;
    }
}

function* dfsGenerator(start) {
    const stack = [start];
    // For visual DFS, we often mark visited when popping or pushing. 
    // Standard DFS: push start. While stack not empty: pop u. if not visited: visit, push neighbors.

    while (stack.length > 0) {
        const u = stack.pop();

        if (!state.algo.visited.has(u)) {
            state.algo.visited.add(u);
            state.algo.path.push(u);
            state.algo.current = u;
            yield { step: 'visit_node', node: u };

            // Scan row u (neighbors)
            // Push in reverse order so 0 is processed first if neighbors are 0,1,2
            for (let v = state.size - 1; v >= 0; v--) {
                state.algo.checkingNeighbor = v;
                yield { step: 'check_cell', u, v };

                const hasEdge = state.matrix[u][v] !== 0;
                if (hasEdge && !state.algo.visited.has(v)) {
                    stack.push(v);
                    yield { step: 'found_neighbor', u, v };
                }
            }
            state.algo.checkingNeighbor = null;
        }
    }
}

function updateAlgoVisuals() {
    // 1. Clear previous Matrix highlights
    document.querySelectorAll('.matrix-cell').forEach(cell => {
        cell.classList.remove('visiting-row', 'current-cell');
    });

    if (!state.algo.isRunning) return;

    if (state.algo.current !== null) {
        // Highlight entire row of current node
        for (let j = 0; j < state.size; j++) {
            const cell = document.getElementById(`cell-${state.algo.current}-${j}`);
            if (cell) cell.classList.add('visiting-row');
        }
    }

    if (state.algo.current !== null && state.algo.checkingNeighbor !== null) {
        const cell = document.getElementById(`cell-${state.algo.current}-${state.algo.checkingNeighbor}`);
        if (cell) cell.classList.add('current-cell');
    }

    // Mark visited cells permanently? Maybe just rely on graph visuals.
    // Or we can mark the diagonal cells of visited nodes.
    state.algo.visited.forEach(nodeId => {
        // Mark diagonal?
        const cell = document.getElementById(`cell-${nodeId}-${nodeId}`);
        if (cell) cell.classList.add('visited-cell');
    });

    draw();
}

// Drawing Logic
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const nodes = [];

    // Calculate Node Positions (Circular Layout)
    const angleStep = (2 * Math.PI) / state.size;
    for (let i = 0; i < state.size; i++) {
        const angle = i * angleStep - Math.PI / 2;
        nodes.push({
            x: centerX + Math.cos(angle) * state.settings.layoutRadius,
            y: centerY + Math.sin(angle) * state.settings.layoutRadius,
            id: i
        });
    }

    // Draw Edges
    for (let i = 0; i < state.size; i++) {
        for (let j = 0; j < state.size; j++) {
            const weight = state.matrix[i][j];
            if (weight === 0) continue;
            if (i === j && !state.settings.selfLoops) continue;

            let color = '#64748b'; // Default edge color

            // Algo Edge Highlighting
            if (state.algo.isRunning && state.algo.current !== null && state.algo.checkingNeighbor !== null) {
                // If this is the edge currently being checked
                if (i === state.algo.current && j === state.algo.checkingNeighbor) {
                    color = '#f59e0b'; // Amber
                }
                // Could also highlight edges in the path tree if we stored edge parentage
            }

            drawEdge(nodes[i], nodes[j], weight, i, j, color);
        }
    }

    // Draw Nodes
    nodes.forEach(node => {
        let color = '#ffffff'; // Default white

        // Partition Coloring takes precedence if Algo not running or check mode handled differently?
        // Let's overlay Algo coloring.

        if (state.settings.showPartitionColors) {
            const k = state.settings.partitionSize;
            const groupIndex = Math.floor(node.id / k);
            color = PALETTE[groupIndex % PALETTE.length];
        }

        // Algo Overrides
        if (state.algo.isRunning || state.algo.visited.size > 0) {
            if (state.algo.current === node.id) {
                color = '#f59e0b'; // Amber (Current)
            } else if (state.algo.visited.has(node.id)) {
                color = '#22c55e'; // Green (Visited)
            } else if (state.algo.queue.includes(node.id)) {
                color = '#3b82f6'; // Blue (In Queue/Stack)
            }
        }

        drawNode(node, color);
    });
}

function drawNode(node, bgColor = '#fff') {
    ctx.beginPath();
    ctx.arc(node.x, node.y, state.settings.nodeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text Color logic
    const isLight = bgColor === '#fff' || bgColor === '#ffffff' || bgColor === '#eab308' || bgColor === '#06b6d4' || bgColor === '#f59e0b' || bgColor === '#22c55e';
    // Green and Amber are mid-tone, but white text reads ok on Green (#22c55e). Amber (#f59e0b) is bright, use dark text?

    ctx.fillStyle = (bgColor === '#f59e0b' || bgColor === '#eab308') ? '#1e293b' : // Dark text for yellow/amber
        (bgColor === '#ffffff') ? '#1e293b' : '#fff'; // Default dark for white, white for others

    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.id, node.x, node.y);

    if (state.hoveredNode === node.id) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

function drawEdge(source, target, weight, i, j, color) {
    const isSelfLoop = i === j;
    const isBidirectional = state.matrix[j][i] !== 0 && i !== j;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = color === '#f59e0b' ? 4 : 1.5;

    let startX = source.x;
    let startY = source.y;
    let endX = target.x;
    let endY = target.y;

    const angle = Math.atan2(endY - startY, endX - startX);
    const r = state.settings.nodeRadius;

    if (isSelfLoop) {
        const dx = startX - (canvas.width / 2);
        const dy = startY - (canvas.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / dist;
        const dirY = dy / dist;

        const controlX1 = startX + dirX * 50 + dirY * 30;
        const controlY1 = startY + dirY * 50 - dirX * 30;
        const controlX2 = startX + dirX * 50 - dirY * 30;
        const controlY2 = startY + dirY * 50 + dirX * 30;

        ctx.moveTo(startX + dirX * r, startY + dirY * r);
        ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, startX + dirX * r, startY + dirY * r);
        ctx.stroke();

        if (state.settings.weighted) {
            drawWeight(startX + dirX * 60, startY + dirY * 60, weight, color);
        }
        return;
    }

    if (state.settings.directed && isBidirectional) {
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const curveAmount = 30;
        const perpX = -(endY - startY) / dist;
        const perpY = (endX - startX) / dist;
        const controlX = midX + perpX * curveAmount;
        const controlY = midY + perpY * curveAmount;

        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.stroke();

        if (state.settings.directed) {
            drawArrow(controlX, controlY, endX, endY, r, color);
        }
        if (state.settings.weighted) {
            drawWeight(controlX, controlY, weight, color);
        }

    } else {
        const startX_adj = startX + Math.cos(angle) * r;
        const startY_adj = startY + Math.sin(angle) * r;
        const endX_adj = endX - Math.cos(angle) * r;
        const endY_adj = endY - Math.sin(angle) * r;

        ctx.moveTo(startX_adj, startY_adj);
        ctx.lineTo(endX_adj, endY_adj);
        ctx.stroke();

        if (state.settings.directed) {
            drawArrow(startX, startY, endX, endY, r, color);
        }
        if (state.settings.weighted) {
            drawWeight((startX + endX) / 2, (startY + endY) / 2, weight, color);
        }
    }
}

function drawArrow(fromX, fromY, toX, toY, radius, color) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLen = 10;
    const targetX = toX - Math.cos(angle) * radius;
    const targetY = toY - Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(targetX - headLen * Math.cos(angle - Math.PI / 6), targetY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(targetX - headLen * Math.cos(angle + Math.PI / 6), targetY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(targetX, targetY);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawWeight(x, y, weight, color) {
    const textWidth = ctx.measureText(weight).width;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(x - textWidth / 2 - 2, y - 8, textWidth + 4, 16);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color === '#64748b' ? '#ef4444' : color;
    ctx.fillText(weight, x, y);
}

function handleCanvasMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const angleStep = (2 * Math.PI) / state.size;
    let hovered = null;

    for (let i = 0; i < state.size; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const nx = centerX + Math.cos(angle) * state.settings.layoutRadius;
        const ny = centerY + Math.sin(angle) * state.settings.layoutRadius;
        const r = state.settings.nodeRadius;

        if (Math.hypot(x - nx, y - ny) < r) {
            hovered = i;
            break;
        }
    }

    if (state.hoveredNode !== hovered) {
        state.hoveredNode = hovered;
        draw();
        canvas.style.cursor = hovered !== null ? 'pointer' : 'default';
    }
}

function updateInfo(edges) {
    const density = (edges / (state.size * state.size)).toFixed(2);
    graphInfo.innerHTML = `
        <p><strong>Nodes:</strong> ${state.size}</p>
        <p><strong>Edges:</strong> ${edges}</p>
        <p><strong>Density:</strong> ${density}</p>
    `;
}

// Start
init();
