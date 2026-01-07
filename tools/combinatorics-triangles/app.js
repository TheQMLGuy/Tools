/**
 * Number Triangles - Main Application
 * Interactive combinatorial triangle visualizer
 */

// ============================================
// State Management
// ============================================

let currentView = 'landing'; // 'landing', 'select', 'visualizer'
let currentCategory = null;
let currentTriangle = null;
let triangleData = null;
let currentRows = 10;
let hoveredCell = null;
let colorScheme = 'gradient';
let showValues = true;
let animateGeneration = false;
let displayMode = 'numeric'; // 'numeric' or 'symbolic'

// ============================================
// DOM Elements
// ============================================

const landing = document.getElementById('landing');
const triangleSelect = document.getElementById('triangleSelect');
const app = document.getElementById('app');
const categoryCards = document.getElementById('categoryCards');
const triangleGrid = document.getElementById('triangleGrid');
const triangleDisplay = document.getElementById('triangleDisplay');

// ============================================
// Navigation Functions
// ============================================

function showLanding() {
    currentView = 'landing';
    currentCategory = null;
    landing.classList.remove('hidden');
    triangleSelect.classList.add('hidden');
    app.classList.add('hidden');
}

function showTriangleSelect(categoryId) {
    const category = TRIANGLE_CATEGORIES[categoryId];
    if (!category) return;

    currentView = 'select';
    currentCategory = categoryId;

    // Update header
    document.getElementById('categoryIcon').textContent = category.icon;
    document.getElementById('categoryTitle').textContent = category.name;

    // Render triangle cards
    renderTriangleCards(category.triangles);

    landing.classList.add('hidden');
    triangleSelect.classList.remove('hidden');
    app.classList.add('hidden');
}

function showVisualizer(triangleId) {
    const triangle = TRIANGLES[triangleId];
    if (!triangle) return;

    currentView = 'visualizer';
    currentTriangle = triangleId;

    // Update info panel
    updateInfoPanel(triangle);

    // Generate and render triangle
    regenerateTriangle();

    landing.classList.add('hidden');
    triangleSelect.classList.add('hidden');
    app.classList.remove('hidden');
}

// ============================================
// Rendering Functions
// ============================================

function renderCategoryCards() {
    let html = '';
    for (const [id, category] of Object.entries(TRIANGLE_CATEGORIES)) {
        const triangleNames = category.triangles.slice(0, 3).map(tid => {
            const t = TRIANGLES[tid];
            return t ? t.name.replace("'s Triangle", '').replace(' Triangle', '') : tid;
        });

        html += `
            <div class="category-card" data-category="${id}">
                <div class="card-icon">${category.icon}</div>
                <h2 class="card-title">${category.name}</h2>
                <p class="card-description">${category.description}</p>
                <div class="card-triangles">
                    ${triangleNames.map(name => `<span class="triangle-tag">${name}</span>`).join('')}
                    ${category.triangles.length > 3 ? `<span class="triangle-tag">+${category.triangles.length - 3} more</span>` : ''}
                </div>
            </div>
        `;
    }
    categoryCards.innerHTML = html;

    // Add click handlers
    categoryCards.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            showTriangleSelect(card.dataset.category);
        });
    });
}

function renderTriangleCards(triangleIds) {
    let html = '';
    for (const id of triangleIds) {
        const triangle = TRIANGLES[id];
        if (!triangle) continue;

        html += `
            <div class="triangle-card" data-triangle="${id}">
                <div class="triangle-card-header">
                    <h3>${triangle.name}</h3>
                    <span class="symbol">${triangle.symbol}</span>
                </div>
                <p>${triangle.description}</p>
                <span class="oeis">OEIS: ${triangle.oeis}</span>
            </div>
        `;
    }
    triangleGrid.innerHTML = html;

    // Add click handlers
    triangleGrid.querySelectorAll('.triangle-card').forEach(card => {
        card.addEventListener('click', () => {
            showVisualizer(card.dataset.triangle);
        });
    });
}

function updateInfoPanel(triangle) {
    document.getElementById('triangleName').textContent = triangle.name;
    document.getElementById('triangleSymbol').textContent = triangle.symbol;
    document.getElementById('triangleDesc').textContent = triangle.description;
    document.getElementById('triangleFormula').textContent = triangle.formula;
    document.getElementById('vizTitle').textContent = triangle.name;

    const oeisLink = document.getElementById('oeisLink');
    oeisLink.textContent = triangle.oeis;
    oeisLink.href = `https://oeis.org/${triangle.oeis}`;

    const exampleBox = document.getElementById('triangleExample');
    exampleBox.innerHTML = `
        <span class="example-label">Example</span>
        <span class="example-text">${triangle.example}</span>
    `;

    // Find category for badge
    for (const [catId, cat] of Object.entries(TRIANGLE_CATEGORIES)) {
        if (cat.triangles.includes(currentTriangle)) {
            document.getElementById('triangleBadge').textContent = cat.name;
            break;
        }
    }
}

function renderTriangle(animate = false) {
    if (!triangleData) return;

    const data = triangleData.data;
    let html = '';

    // Find max value for color scaling
    let maxVal = 1;
    for (const row of data) {
        for (const val of row) {
            if (val > maxVal) maxVal = val;
        }
    }

    for (let n = 0; n < data.length; n++) {
        html += `<div class="triangle-row" data-row="${n}">`;
        for (let k = 0; k < data[n].length; k++) {
            const val = data[n][k];
            const magnitude = getMagnitude(val, maxVal);
            let displayVal = '';
            if (showValues) {
                displayVal = displayMode === 'symbolic'
                    ? getSymbolicNotation(currentTriangle, n, k)
                    : formatNumber(val);
            }
            const animClass = animate ? 'animate' : '';
            const animDelay = animate ? `animation-delay: ${(n * 0.05 + k * 0.02)}s;` : '';

            html += `
                <div class="triangle-cell ${animClass}" 
                     data-row="${n}" 
                     data-col="${k}" 
                     data-value="${val}"
                     data-magnitude="${magnitude}"
                     style="${animDelay} ${getCellStyle(val, maxVal)}"
                     title="${triangleData.symbol.replace('n', n).replace('k', k)} = ${val}">
                    ${displayVal}
                </div>
            `;
        }
        html += '</div>';
    }

    triangleDisplay.innerHTML = html;
    updateStats();
    updateSequences();

    // Add cell event listeners
    triangleDisplay.querySelectorAll('.triangle-cell').forEach(cell => {
        cell.addEventListener('mouseenter', (e) => handleCellHover(e.target));
        cell.addEventListener('mouseleave', () => clearCellHover());
        cell.addEventListener('click', (e) => handleCellClick(e.target));
    });
}

function getMagnitude(value, maxVal) {
    if (maxVal <= 1) return 1;
    const logMax = Math.log10(maxVal + 1);
    const logVal = Math.log10(value + 1);
    return Math.min(10, Math.max(1, Math.ceil((logVal / logMax) * 10)));
}

function getCellStyle(value, maxVal) {
    if (colorScheme === 'monochrome') {
        return '';
    }
    if (colorScheme === 'heatmap') {
        const ratio = Math.log10(value + 1) / Math.log10(maxVal + 1);
        const hue = (1 - ratio) * 240; // Blue to red
        return `background: hsla(${hue}, 70%, 45%, 0.4);`;
    }
    if (colorScheme === 'rainbow') {
        const ratio = Math.log10(value + 1) / Math.log10(maxVal + 1);
        const hue = ratio * 360;
        return `background: hsla(${hue}, 70%, 45%, 0.35);`;
    }
    // Default gradient handled by CSS classes
    return '';
}

function formatNumber(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
}

// Get symbolic notation for a cell based on triangle type
function getSymbolicNotation(triangleId, n, k) {
    const notations = {
        pascal: `C(${n},${k})`,
        fibonacci: `F(${n},${k})`,
        floyd: `${n * (n + 1) / 2 + k + 1}`,
        lucas: `L(${n},${k})`,
        bell: `B(${n},${k})`,
        stirling1: `s(${n},${k})`,
        stirling2: `S(${n},${k})`,
        lah: `L(${n},${k})`,
        catalan: `C(${n},${k})`,
        narayana: `N(${n},${k})`,
        motzkin: `M(${n},${k})`,
        delannoy: `D(${n},${k})`,
        eulerian: `A(${n},${k})`,
        bernoulli: `B(${n},${k})`,
        leibniz: `L(${n},${k})`,
        riordan: `R(${n},${k})`,
        padovan: `P(${n},${k})`,
        pell: `P(${n},${k})`,
        tribonacci: `T(${n},${k})`,
        hosoya: `H(${n},${k})`,
        lozanic: `Ł(${n},${k})`,
        centralBinomial: `C(${n + k},${k})`,
        harmonicLeib: `1/${n + 1}·C(${n},${k})`,
        ballot: `B(${n},${k})`
    };
    return notations[triangleId] || `T(${n},${k})`;
}

function updateStats() {
    if (!triangleData) return;

    const data = triangleData.data;
    let totalValues = 0;
    let maxValue = 0;
    let lastRowSum = 0;

    for (const row of data) {
        totalValues += row.length;
        for (const val of row) {
            if (val > maxValue) maxValue = val;
        }
    }

    if (data.length > 0) {
        const lastRow = data[data.length - 1];
        lastRowSum = lastRow.reduce((a, b) => a + b, 0);
    }

    document.getElementById('statRows').textContent = data.length;
    document.getElementById('statTotal').textContent = totalValues;
    document.getElementById('statMax').textContent = formatNumber(maxValue);
    document.getElementById('statSum').textContent = formatNumber(lastRowSum);
}

function updateSequences() {
    if (!triangleData) return;

    const data = triangleData.data;
    const sequences = [];

    // First column
    if (data.length > 0) {
        const firstCol = data.map(row => row[0]).slice(0, 8);
        sequences.push({
            name: 'First Column',
            values: firstCol.join(', ') + (data.length > 8 ? '...' : '')
        });
    }

    // Diagonal (main)
    const diagonal = [];
    for (let i = 0; i < Math.min(data.length, 8); i++) {
        if (data[i][i] !== undefined) {
            diagonal.push(data[i][i]);
        }
    }
    if (diagonal.length > 0) {
        sequences.push({
            name: 'Main Diagonal',
            values: diagonal.join(', ') + (diagonal.length >= 8 ? '...' : '')
        });
    }

    // Row sums
    const rowSums = data.slice(0, 6).map(row => row.reduce((a, b) => a + b, 0));
    sequences.push({
        name: 'Row Sums',
        values: rowSums.join(', ') + (data.length > 6 ? '...' : '')
    });

    const sequencesDiv = document.getElementById('sequences');
    sequencesDiv.innerHTML = sequences.map(seq => `
        <div class="sequence-item">
            <div class="seq-name">${seq.name}</div>
            <div class="seq-values">${seq.values}</div>
        </div>
    `).join('');
}

// ============================================
// Cell Interaction
// ============================================

function handleCellHover(cell) {
    hoveredCell = cell;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const value = parseInt(cell.dataset.value);

    const cellDetails = document.getElementById('cellDetails');
    cellDetails.innerHTML = `
        <div class="cell-detail-row">
            <span class="label">Position</span>
            <span class="value">(${row}, ${col})</span>
        </div>
        <div class="cell-detail-row">
            <span class="label">Row</span>
            <span class="value">n = ${row}</span>
        </div>
        <div class="cell-detail-row">
            <span class="label">Column</span>
            <span class="value">k = ${col}</span>
        </div>
        <div class="cell-value-display">${value.toLocaleString()}</div>
    `;

    // Show row preview
    const rowPreview = document.getElementById('rowPreview');
    if (triangleData && triangleData.data[row]) {
        rowPreview.innerHTML = triangleData.data[row].map((v, i) => `
            <span class="row-preview-item ${i === col ? 'current' : ''}">${formatNumber(v)}</span>
        `).join('');
    }
}

function clearCellHover() {
    hoveredCell = null;
    document.getElementById('cellDetails').innerHTML = '<p class="muted">Hover over a cell to see details</p>';
}

function handleCellClick(cell) {
    // Remove previous active
    triangleDisplay.querySelectorAll('.triangle-cell.active').forEach(c => c.classList.remove('active'));
    cell.classList.add('active');
}

// ============================================
// Control Handlers
// ============================================

function regenerateTriangle() {
    triangleData = generateTriangle(currentTriangle, currentRows);
    renderTriangle(animateGeneration);
}

function setupControls() {
    // Rows slider
    const rowsSlider = document.getElementById('rowsSlider');
    const rowsValue = document.getElementById('rowsValue');
    rowsSlider.addEventListener('input', () => {
        currentRows = parseInt(rowsSlider.value);
        rowsValue.textContent = currentRows;
        regenerateTriangle();
    });

    // Color scheme
    document.getElementById('colorScheme').addEventListener('change', (e) => {
        colorScheme = e.target.value;
        renderTriangle();
    });

    // Show values
    document.getElementById('showValues').addEventListener('change', (e) => {
        showValues = e.target.checked;
        renderTriangle();
    });

    // Display mode
    document.getElementById('displayMode').addEventListener('change', (e) => {
        displayMode = e.target.value;
        renderTriangle();
    });

    // Animate generation
    document.getElementById('animateGeneration').addEventListener('change', (e) => {
        animateGeneration = e.target.checked;
    });

    // Back buttons
    document.getElementById('backToLanding').addEventListener('click', showLanding);
    document.getElementById('backToSelect').addEventListener('click', () => {
        if (currentCategory) {
            showTriangleSelect(currentCategory);
        } else {
            showLanding();
        }
    });

    // Fullscreen
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        const panel = document.querySelector('.visualization-panel');
        panel.classList.toggle('fullscreen');
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const panel = document.querySelector('.visualization-panel');
            if (panel.classList.contains('fullscreen')) {
                panel.classList.remove('fullscreen');
            } else if (currentView === 'visualizer') {
                if (currentCategory) {
                    showTriangleSelect(currentCategory);
                } else {
                    showLanding();
                }
            } else if (currentView === 'select') {
                showLanding();
            }
        }
    });
}

// ============================================
// Initialize
// ============================================

function init() {
    renderCategoryCards();
    setupControls();
}

// Start app
init();
