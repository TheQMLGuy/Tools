/**
 * Straight Lines Analyzer - Application Controller
 */

const LINE_COLORS = ['#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#ef4444'];
let lines = [];
let currentMode = 'lines';
let showGrid = true, showLabels = true;
let viewBounds = { minX: -6, maxX: 6, minY: -4, maxY: 4 };
let isDragging = false, lastMousePos = { x: 0, y: 0 };

// Triangle state
let triangle = null;
let triangleCenters = {};
let showMedians = false, showAltitudes = false, showBisectors = false;

// Two-line state
let twoLines = { line1: null, line2: null, intersection: null, bisectors: [] };

// Family state
let familyLines = { L1: null, L2: null, currentLine: null, lambda: 0 };

const landingPage = document.getElementById('landing');
const appContainer = document.getElementById('app');
const canvas = document.getElementById('linesCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

function init() {
    renderPresets();
    setupEventListeners();
}

function renderPresets() {
    const grid = document.getElementById('presetGrid');
    if (!grid) return;
    grid.innerHTML = STRAIGHT_LINE_PRESETS.map(p => `
        <div class="preset-card" data-equation="${p.equation}">
            <h3>${p.name}</h3><div class="equation">${p.equation}</div><p>${p.description}</p>
        </div>
    `).join('');
    grid.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => {
            const line = StraightLinesEngine.parseEquation(card.dataset.equation);
            if (!line.error) { lines.push({ line, color: getNextColor() }); showApp(); }
        });
    });
}

function getNextColor() { return LINE_COLORS[lines.length % LINE_COLORS.length]; }

function showApp() {
    landingPage?.classList.add('hidden');
    appContainer?.classList.remove('hidden');
    resizeCanvas();
    updateLineList();
    render();
}

function setupEventListeners() {
    // Landing page
    document.getElementById('analyzeBtn')?.addEventListener('click', addLineFromInput);
    document.getElementById('customEquation')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') addLineFromInput(); });
    document.getElementById('startTriangle')?.addEventListener('click', () => { currentMode = 'triangle'; showApp(); switchMode('triangle'); });
    document.getElementById('startTwoLines')?.addEventListener('click', () => { currentMode = 'two-line'; showApp(); switchMode('two-line'); });

    document.getElementById('backToLanding')?.addEventListener('click', () => {
        appContainer?.classList.add('hidden');
        landingPage?.classList.remove('hidden');
        lines = [];
    });

    // Mode switching
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    // Lines mode
    document.getElementById('lineForm')?.addEventListener('change', updateFormInputs);
    document.getElementById('addLineBtn')?.addEventListener('click', addLineFromForm);

    // Two-line mode
    document.getElementById('analyzeTwo')?.addEventListener('click', analyzeTwoLines);

    // Triangle mode
    document.getElementById('calcTriangle')?.addEventListener('click', calculateTriangle);
    document.getElementById('showMedians')?.addEventListener('change', function () { showMedians = this.checked; render(); });
    document.getElementById('showAltitudes')?.addEventListener('change', function () { showAltitudes = this.checked; render(); });
    document.getElementById('showBisectors')?.addEventListener('change', function () { showBisectors = this.checked; render(); });

    // Family mode
    document.getElementById('lambdaSlider')?.addEventListener('input', updateFamilyLine);
    document.getElementById('familyL1')?.addEventListener('change', updateFamilyLine);
    document.getElementById('familyL2')?.addEventListener('change', updateFamilyLine);

    // Display
    document.getElementById('showGrid')?.addEventListener('change', function () { showGrid = this.checked; render(); });
    document.getElementById('showLabels')?.addEventListener('change', function () { showLabels = this.checked; render(); });
    document.getElementById('resetView')?.addEventListener('click', () => { viewBounds = { minX: -6, maxX: 6, minY: -4, maxY: 4 }; render(); });
    document.getElementById('clearAll')?.addEventListener('click', () => { lines = []; triangle = null; updateLineList(); render(); });

    // Canvas
    if (canvas) {
        canvas.addEventListener('wheel', handleWheel);
        canvas.addEventListener('mousedown', (e) => { isDragging = true; lastMousePos = { x: e.clientX, y: e.clientY }; canvas.style.cursor = 'grabbing'; });
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = 'crosshair'; });
        canvas.addEventListener('mouseleave', () => { isDragging = false; });
        window.addEventListener('resize', () => { resizeCanvas(); render(); });
    }
}

function addLineFromInput() {
    const eq = document.getElementById('customEquation')?.value.trim();
    if (!eq) return;
    const line = StraightLinesEngine.parseEquation(eq);
    if (line.error) { alert(line.error); return; }
    lines.push({ line, color: getNextColor() });
    showApp();
}

function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(mode + 'Mode')?.classList.remove('hidden');
    document.getElementById('triangleCentersPanel')?.classList.toggle('hidden', mode !== 'triangle');

    if (mode === 'family') updateFamilyLine();
    render();
}

function updateFormInputs() {
    const form = document.getElementById('lineForm').value;
    const container = document.getElementById('formInputs');

    const forms = {
        'slope-intercept': `
            <div class="control-group"><label>Slope (m)</label><input type="number" id="inputM" value="1" step="0.1"></div>
            <div class="control-group"><label>Y-Intercept (c)</label><input type="number" id="inputC" value="0" step="0.5"></div>`,
        'point-slope': `
            <div class="control-group"><label>Point (x₁, y₁)</label><div style="display:flex;gap:8px;"><input type="number" id="inputX1" value="0" step="0.5"><input type="number" id="inputY1" value="0" step="0.5"></div></div>
            <div class="control-group"><label>Slope (m)</label><input type="number" id="inputM" value="1" step="0.1"></div>`,
        'two-point': `
            <div class="control-group"><label>Point 1 (x₁, y₁)</label><div style="display:flex;gap:8px;"><input type="number" id="inputX1" value="0" step="0.5"><input type="number" id="inputY1" value="0" step="0.5"></div></div>
            <div class="control-group"><label>Point 2 (x₂, y₂)</label><div style="display:flex;gap:8px;"><input type="number" id="inputX2" value="2" step="0.5"><input type="number" id="inputY2" value="3" step="0.5"></div></div>`,
        'intercept': `
            <div class="control-group"><label>X-Intercept (a)</label><input type="number" id="inputA" value="3" step="0.5"></div>
            <div class="control-group"><label>Y-Intercept (b)</label><input type="number" id="inputB" value="4" step="0.5"></div>`,
        'normal': `
            <div class="control-group"><label>Angle α (degrees)</label><input type="number" id="inputAlpha" value="45" step="5"></div>
            <div class="control-group"><label>Distance p</label><input type="number" id="inputP" value="2" step="0.5" min="0"></div>`,
        'general': `
            <div class="control-group"><label>Coefficients (A, B, C)</label>
            <div style="display:flex;gap:8px;"><input type="number" id="inputA" value="2" step="0.5"><input type="number" id="inputB" value="3" step="0.5"><input type="number" id="inputC" value="-6" step="0.5"></div></div>`
    };

    container.innerHTML = forms[form] || forms['slope-intercept'];
}

function addLineFromForm() {
    const form = document.getElementById('lineForm').value;
    let line;

    switch (form) {
        case 'slope-intercept':
            line = StraightLinesEngine.fromSlopeIntercept(parseFloat(document.getElementById('inputM').value), parseFloat(document.getElementById('inputC').value));
            break;
        case 'point-slope':
            line = StraightLinesEngine.fromPointSlope(parseFloat(document.getElementById('inputX1').value), parseFloat(document.getElementById('inputY1').value), parseFloat(document.getElementById('inputM').value));
            break;
        case 'two-point':
            line = StraightLinesEngine.fromTwoPoints(parseFloat(document.getElementById('inputX1').value), parseFloat(document.getElementById('inputY1').value), parseFloat(document.getElementById('inputX2').value), parseFloat(document.getElementById('inputY2').value));
            break;
        case 'intercept':
            line = StraightLinesEngine.fromIntercepts(parseFloat(document.getElementById('inputA').value), parseFloat(document.getElementById('inputB').value));
            break;
        case 'normal':
            line = StraightLinesEngine.fromNormalForm(parseFloat(document.getElementById('inputAlpha').value) * Math.PI / 180, parseFloat(document.getElementById('inputP').value));
            break;
        case 'general':
            line = StraightLinesEngine.fromGeneral(parseFloat(document.getElementById('inputA').value), parseFloat(document.getElementById('inputB').value), parseFloat(document.getElementById('inputC').value));
            break;
    }

    if (line && !line.error) {
        lines.push({ line, color: getNextColor() });
        updateLineList();
        render();
    }
}

function updateLineList() {
    const container = document.getElementById('lineList');
    if (!container) return;

    container.innerHTML = lines.map((l, i) => {
        const eqs = l.line.getEquations();
        return `<div class="line-entry" data-index="${i}">
            <span class="line-color" style="background: ${l.color}"></span>
            <span class="line-eq">${eqs.slopeIntercept || eqs.general}</span>
            <button class="line-remove" data-index="${i}">×</button>
        </div>`;
    }).join('');

    container.querySelectorAll('.line-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            lines.splice(parseInt(btn.dataset.index), 1);
            updateLineList();
            render();
        });
    });

    container.querySelectorAll('.line-entry').forEach(entry => {
        entry.addEventListener('mouseenter', () => showLineProperties(lines[parseInt(entry.dataset.index)]));
    });
}

function showLineProperties(lineData) {
    const container = document.getElementById('lineProperties');
    if (!container || !lineData) return;

    const line = lineData.line;
    const eqs = line.getEquations();

    let html = `<div class="property-section">
        <div class="property-section-title">Equations</div>`;

    if (eqs.slopeIntercept) html += `<div class="property-row"><span>Slope-Intercept</span><span class="property-value">${eqs.slopeIntercept}</span></div>`;
    html += `<div class="property-row"><span>General</span><span class="property-value">${eqs.general}</span></div>`;
    if (eqs.intercept) html += `<div class="property-row"><span>Intercept</span><span class="property-value">${eqs.intercept}</span></div>`;

    html += `</div><div class="property-section">
        <div class="property-section-title">Properties</div>
        <div class="property-row"><span>Slope</span><span class="property-value">${line.m === Infinity ? '∞ (vertical)' : fmt(line.m)}</span></div>`;

    if (line.xInt !== null) html += `<div class="property-row"><span>X-Intercept</span><span class="property-value">(${fmt(line.xInt)}, 0)</span></div>`;
    if (line.yInt !== null) html += `<div class="property-row"><span>Y-Intercept</span><span class="property-value">(0, ${fmt(line.yInt)})</span></div>`;

    html += `</div>`;
    container.innerHTML = html;
}

function analyzeTwoLines() {
    const eq1 = document.getElementById('line1Input')?.value.trim();
    const eq2 = document.getElementById('line2Input')?.value.trim();

    const line1 = StraightLinesEngine.parseEquation(eq1);
    const line2 = StraightLinesEngine.parseEquation(eq2);

    if (line1.error || line2.error) { alert('Could not parse equations'); return; }

    twoLines = { line1, line2 };
    lines = [{ line: line1, color: '#06b6d4' }, { line: line2, color: '#f59e0b' }];

    const intersection = TwoLineOperations.getIntersection(line1, line2);
    const angle = TwoLineOperations.angleBetween(line1, line2);
    const parallel = TwoLineOperations.areParallel(line1, line2);
    const perp = TwoLineOperations.arePerpendicular(line1, line2);

    let bisectors = [];
    if (!parallel) {
        bisectors = TwoLineOperations.getAngleBisectors(line1, line2);
        twoLines.bisectors = bisectors;
    }

    const container = document.getElementById('twoLineResult');
    let html = `<h4>Analysis Results</h4>`;

    if (parallel) {
        const dist = TwoLineOperations.distanceBetweenParallel(line1, line2);
        html += `<div class="property-row"><span>Relation</span><span class="property-value">Parallel</span></div>`;
        html += `<div class="property-row"><span>Distance</span><span class="property-value">${fmt(dist)}</span></div>`;
    } else {
        html += `<div class="property-row"><span>Intersection</span><span class="property-value">(${fmt(intersection.x)}, ${fmt(intersection.y)})</span></div>`;
        html += `<div class="property-row"><span>Angle</span><span class="property-value">${fmt(angle * 180 / Math.PI)}°</span></div>`;
        if (perp) html += `<div class="property-row"><span>Relation</span><span class="property-value highlight">Perpendicular</span></div>`;
    }

    container.innerHTML = html;
    render();
}

function calculateTriangle() {
    const A = { x: parseFloat(document.getElementById('ax').value), y: parseFloat(document.getElementById('ay').value) };
    const B = { x: parseFloat(document.getElementById('bx').value), y: parseFloat(document.getElementById('by').value) };
    const C = { x: parseFloat(document.getElementById('cx').value), y: parseFloat(document.getElementById('cy').value) };

    triangle = new TriangleOperations(A, B, C);

    triangleCenters = {
        centroid: triangle.getCentroid(),
        incentre: triangle.getIncentre(),
        circumcentre: triangle.getCircumcentre(),
        orthocentre: triangle.getOrthocentre()
    };

    // Update panel
    const container = document.getElementById('triangleCenters');
    container.innerHTML = `
        <div class="property-row"><span>Area</span><span class="property-value">${fmt(triangle.getArea())}</span></div>
        <div style="margin-top: 8px;">
            <span class="center-badge centroid">G: (${fmt(triangleCenters.centroid.x)}, ${fmt(triangleCenters.centroid.y)})</span>
            <span class="center-badge incentre">I: (${fmt(triangleCenters.incentre.x)}, ${fmt(triangleCenters.incentre.y)})</span>
            ${triangleCenters.circumcentre ? `<span class="center-badge circumcentre">O: (${fmt(triangleCenters.circumcentre.x)}, ${fmt(triangleCenters.circumcentre.y)})</span>` : ''}
            ${triangleCenters.orthocentre ? `<span class="center-badge orthocentre">H: (${fmt(triangleCenters.orthocentre.x)}, ${fmt(triangleCenters.orthocentre.y)})</span>` : ''}
        </div>
    `;

    // Adjust view
    const allX = [A.x, B.x, C.x], allY = [A.y, B.y, C.y];
    viewBounds = {
        minX: Math.min(...allX) - 2,
        maxX: Math.max(...allX) + 2,
        minY: Math.min(...allY) - 2,
        maxY: Math.max(...allY) + 2
    };

    render();
}

function updateFamilyLine() {
    const eq1 = document.getElementById('familyL1')?.value.trim();
    const eq2 = document.getElementById('familyL2')?.value.trim();
    const lambda = parseFloat(document.getElementById('lambdaSlider')?.value) || 0;

    document.getElementById('lambdaValue').textContent = lambda.toFixed(1);

    const L1 = StraightLinesEngine.parseEquation(eq1);
    const L2 = StraightLinesEngine.parseEquation(eq2);

    if (L1.error || L2.error) return;

    familyLines = { L1, L2, lambda };
    familyLines.currentLine = TwoLineOperations.getFamilyLine(L1, L2, lambda);
    familyLines.intersection = TwoLineOperations.getIntersection(L1, L2);

    const eqs = familyLines.currentLine.getEquations();
    document.getElementById('familyLineEq').textContent = eqs.general;

    lines = [
        { line: L1, color: 'rgba(6, 182, 212, 0.4)' },
        { line: L2, color: 'rgba(245, 158, 11, 0.4)' },
        { line: familyLines.currentLine, color: '#10b981' }
    ];

    render();
}

// =====================================================
// CANVAS RENDERING
// =====================================================

function resizeCanvas() {
    if (!canvas) return;
    const container = canvas.parentElement, dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = container.clientWidth + 'px';
    canvas.style.height = container.clientHeight + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
}

function render() {
    if (!ctx) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    if (showGrid) drawGrid(w, h);
    drawAxes(w, h);

    // Draw based on mode
    if (currentMode === 'triangle' && triangle) {
        drawTriangle(w, h);
    }

    // Draw lines
    lines.forEach(l => drawLine(w, h, l.line, l.color));

    // Draw two-line extras
    if (currentMode === 'two-line' && twoLines.line1) {
        const int = TwoLineOperations.getIntersection(twoLines.line1, twoLines.line2);
        if (int) drawPoint(w, h, int.x, int.y, '#10b981', 'Intersection');

        twoLines.bisectors?.forEach((b, i) => drawLine(w, h, b, 'rgba(139, 92, 246, 0.5)'));
    }

    // Draw family intersection
    if (currentMode === 'family' && familyLines.intersection) {
        drawPoint(w, h, familyLines.intersection.x, familyLines.intersection.y, '#f59e0b', 'Common Point');
    }
}

function toCanvasX(x, w) { return ((x - viewBounds.minX) / (viewBounds.maxX - viewBounds.minX)) * w; }
function toCanvasY(y, h) { return h - ((y - viewBounds.minY) / (viewBounds.maxY - viewBounds.minY)) * h; }
function toMathX(cx, w) { return viewBounds.minX + (cx / w) * (viewBounds.maxX - viewBounds.minX); }
function toMathY(cy, h) { return viewBounds.maxY - (cy / h) * (viewBounds.maxY - viewBounds.minY); }

function drawGrid(w, h) {
    const range = Math.max(viewBounds.maxX - viewBounds.minX, viewBounds.maxY - viewBounds.minY);
    const step = getGridStep(range);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (let x = Math.floor(viewBounds.minX / step) * step; x <= viewBounds.maxX; x += step) {
        ctx.beginPath(); ctx.moveTo(toCanvasX(x, w), 0); ctx.lineTo(toCanvasX(x, w), h); ctx.stroke();
    }
    for (let y = Math.floor(viewBounds.minY / step) * step; y <= viewBounds.maxY; y += step) {
        ctx.beginPath(); ctx.moveTo(0, toCanvasY(y, h)); ctx.lineTo(w, toCanvasY(y, h)); ctx.stroke();
    }
}

function getGridStep(range) {
    const rough = range / 10, mag = Math.pow(10, Math.floor(Math.log10(rough))), norm = rough / mag;
    return norm < 1.5 ? mag : norm < 3 ? 2 * mag : norm < 7 ? 5 * mag : 10 * mag;
}

function drawAxes(w, h) {
    const ox = toCanvasX(0, w), oy = toCanvasY(0, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
    if (oy >= 0 && oy <= h) { ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke(); }
    if (ox >= 0 && ox <= w) { ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke(); }
}

function drawLine(w, h, line, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;

    if (line.type === 'vertical') {
        const cx = toCanvasX(line.x, w);
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    } else if (line.type === 'horizontal') {
        const cy = toCanvasY(line.y, h);
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    } else {
        const x1 = viewBounds.minX - 2, x2 = viewBounds.maxX + 2;
        const y1 = line.getY(x1), y2 = line.getY(x2);
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x1, w), toCanvasY(y1, h));
        ctx.lineTo(toCanvasX(x2, w), toCanvasY(y2, h));
        ctx.stroke();
    }

    // Draw intercepts
    if (line.xInt !== null && showLabels) {
        drawPoint(w, h, line.xInt, 0, color);
    }
    if (line.yInt !== null && showLabels) {
        drawPoint(w, h, 0, line.yInt, color);
    }
}

function drawPoint(w, h, x, y, color, label = '') {
    const cx = toCanvasX(x, w), cy = toCanvasY(y, h);
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();

    if (label && showLabels) {
        ctx.font = '10px Inter'; ctx.fillStyle = color;
        ctx.fillText(label, cx + 8, cy - 6);
    }
}

function drawTriangle(w, h) {
    const [A, B, C] = triangle.vertices;

    // Draw sides
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(A.x, w), toCanvasY(A.y, h));
    ctx.lineTo(toCanvasX(B.x, w), toCanvasY(B.y, h));
    ctx.lineTo(toCanvasX(C.x, w), toCanvasY(C.y, h));
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'; ctx.fill();

    // Vertices
    drawPoint(w, h, A.x, A.y, '#6366f1', 'A');
    drawPoint(w, h, B.x, B.y, '#6366f1', 'B');
    drawPoint(w, h, C.x, C.y, '#6366f1', 'C');

    // Centers
    if (triangleCenters.centroid) drawPoint(w, h, triangleCenters.centroid.x, triangleCenters.centroid.y, '#6366f1', 'G');
    if (triangleCenters.incentre) drawPoint(w, h, triangleCenters.incentre.x, triangleCenters.incentre.y, '#10b981', 'I');
    if (triangleCenters.circumcentre) drawPoint(w, h, triangleCenters.circumcentre.x, triangleCenters.circumcentre.y, '#f59e0b', 'O');
    if (triangleCenters.orthocentre) drawPoint(w, h, triangleCenters.orthocentre.x, triangleCenters.orthocentre.y, '#ef4444', 'H');

    // Medians
    if (showMedians) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        triangle.getMedians().forEach(m => {
            ctx.beginPath();
            ctx.moveTo(toCanvasX(m.from.x, w), toCanvasY(m.from.y, h));
            ctx.lineTo(toCanvasX(m.to.x, w), toCanvasY(m.to.y, h));
            ctx.stroke();
        });
        ctx.setLineDash([]);
    }

    // Altitudes
    if (showAltitudes) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        triangle.getAltitudes().forEach(alt => {
            const foot = alt.line.getPerpendicularFoot(alt.from.x, alt.from.y);
            ctx.beginPath();
            ctx.moveTo(toCanvasX(alt.from.x, w), toCanvasY(alt.from.y, h));
            ctx.lineTo(toCanvasX(foot.x, w), toCanvasY(foot.y, h));
            ctx.stroke();
        });
        ctx.setLineDash([]);
    }
}

function handleWheel(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = toMathX(e.clientX - rect.left, canvas.clientWidth), my = toMathY(e.clientY - rect.top, canvas.clientHeight);
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    viewBounds.minX = mx - (mx - viewBounds.minX) * factor;
    viewBounds.maxX = mx + (viewBounds.maxX - mx) * factor;
    viewBounds.minY = my - (my - viewBounds.minY) * factor;
    viewBounds.maxY = my + (viewBounds.maxY - my) * factor;
    render();
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    document.getElementById('coordDisplay').textContent = `(${fmt(toMathX(mx, canvas.clientWidth))}, ${fmt(toMathY(my, canvas.clientHeight))})`;
    if (isDragging) {
        const dx = e.clientX - lastMousePos.x, dy = e.clientY - lastMousePos.y;
        const sx = (viewBounds.maxX - viewBounds.minX) / canvas.clientWidth;
        const sy = (viewBounds.maxY - viewBounds.minY) / canvas.clientHeight;
        viewBounds.minX -= dx * sx; viewBounds.maxX -= dx * sx;
        viewBounds.minY += dy * sy; viewBounds.maxY += dy * sy;
        lastMousePos = { x: e.clientX, y: e.clientY };
        render();
    }
}

function fmt(n) {
    if (n === undefined || n === null) return '0';
    if (Number.isInteger(n)) return n.toString();
    if (Math.abs(n) < 0.0001) return '0';
    return n.toFixed(3).replace(/\.?0+$/, '');
}

document.addEventListener('DOMContentLoaded', init);
