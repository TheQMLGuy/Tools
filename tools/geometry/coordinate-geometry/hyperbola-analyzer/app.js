/**
 * Advanced Hyperbola Analyzer - Application Controller
 */
const engine = new AdvancedHyperbolaEngine();
let showGrid = true, showLabels = true, showAsymptotes = true;
let viewBounds = { minX: -6, maxX: 6, minY: -5, maxY: 5 };
let isDragging = false, lastMousePos = { x: 0, y: 0 };
let currentLineMode = 'tangent';
let activeLines = [];

const landingPage = document.getElementById('landing');
const appContainer = document.getElementById('app');
const canvas = document.getElementById('hyperbolaCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

function init() { setupEventListeners(); renderPresets(); }

function renderPresets() {
    const grid = document.getElementById('presetGrid');
    if (!grid) return;
    grid.innerHTML = HYPERBOLA_PRESETS.map(p => `
        <div class="preset-card" data-equation="${p.equation}">
            <h3>${p.name}</h3><div class="equation">${p.equation}</div><p>${p.description}</p>
        </div>
    `).join('');
    grid.querySelectorAll('.preset-card').forEach(card => card.addEventListener('click', () => loadEquation(card.dataset.equation)));
}

function loadEquation(equation) {
    const result = engine.setFromEquation(equation);
    if (result.error) { alert(result.error); return; }
    showApp();
}

function showApp() {
    landingPage?.classList.add('hidden');
    appContainer?.classList.remove('hidden');
    viewBounds = engine.getViewBounds(2);
    activeLines = [];
    updateAllInputs();
    updatePropertiesPanel();
    resizeCanvas();
    render();
}

function setupEventListeners() {
    document.getElementById('analyzeBtn')?.addEventListener('click', () => {
        const eq = document.getElementById('customEquation')?.value.trim();
        if (eq) loadEquation(eq);
    });
    document.getElementById('customEquation')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('analyzeBtn')?.click();
    });

    document.getElementById('backToLanding')?.addEventListener('click', () => {
        appContainer?.classList.add('hidden');
        landingPage?.classList.remove('hidden');
    });

    // Bidirectional inputs
    document.getElementById('editCenterX')?.addEventListener('change', onParameterChange);
    document.getElementById('editCenterY')?.addEventListener('change', onParameterChange);
    document.getElementById('editA')?.addEventListener('change', onParameterChange);
    document.getElementById('editB')?.addEventListener('change', onParameterChange);
    document.getElementById('editOrientation')?.addEventListener('change', onParameterChange);

    // Parametric angle
    const paramTheta = document.getElementById('paramTheta');
    const paramThetaValue = document.getElementById('paramThetaValue');
    if (paramTheta && paramThetaValue) {
        paramTheta.addEventListener('input', () => {
            paramThetaValue.value = paramTheta.value;
            engine.currentTheta = parseFloat(paramTheta.value) * Math.PI / 180;
            updateParametricPoint();
            render();
        });
        paramThetaValue.addEventListener('change', () => {
            const val = Math.max(-80, Math.min(80, parseFloat(paramThetaValue.value)));
            paramThetaValue.value = val;
            paramTheta.value = val;
            engine.currentTheta = val * Math.PI / 180;
            updateParametricPoint();
            render();
        });
    }

    // Display options
    document.getElementById('showGrid')?.addEventListener('change', function () { showGrid = this.checked; render(); });
    document.getElementById('showLabels')?.addEventListener('change', function () { showLabels = this.checked; render(); });
    document.getElementById('showAsymptotes')?.addEventListener('change', function () { showAsymptotes = this.checked; render(); });
    document.getElementById('resetView')?.addEventListener('click', () => { viewBounds = engine.getViewBounds(2); render(); });

    // Line tools
    document.querySelectorAll('.line-mode').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.line-mode').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLineMode = btn.dataset.mode;
        });
    });

    document.getElementById('generateLine')?.addEventListener('click', generateLineFromInputs);
    document.getElementById('clearLines')?.addEventListener('click', () => { activeLines = []; updateActiveLinesDisplay(); render(); });

    // Canvas events
    if (canvas) {
        canvas.addEventListener('wheel', handleWheel);
        canvas.addEventListener('mousedown', (e) => { isDragging = true; lastMousePos = { x: e.clientX, y: e.clientY }; canvas.style.cursor = 'grabbing'; });
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = 'grab'; });
        canvas.addEventListener('mouseleave', () => { isDragging = false; });
        window.addEventListener('resize', () => { resizeCanvas(); render(); });
    }
}

function onParameterChange() {
    const h = parseFloat(document.getElementById('editCenterX')?.value) || 0;
    const k = parseFloat(document.getElementById('editCenterY')?.value) || 0;
    const a = parseFloat(document.getElementById('editA')?.value) || 2;
    const b = parseFloat(document.getElementById('editB')?.value) || 1;
    const isHorizontal = document.getElementById('editOrientation')?.value === 'horizontal';

    engine.setFromParameters(a, b, h, k, isHorizontal);
    updateAllInputs();
    updatePropertiesPanel();
    viewBounds = engine.getViewBounds(2);
    render();
}

function updateAllInputs() {
    const props = engine.properties;
    if (!props) return;
    setVal('editCenterX', engine.h);
    setVal('editCenterY', engine.k);
    setVal('editA', engine.a);
    setVal('editB', engine.b);
    document.getElementById('editOrientation').value = engine.isHorizontal ? 'horizontal' : 'vertical';
    setText('equationDisplay', props.equations.standard);
    updateParametricPoint();
}

function updateParametricPoint() {
    const pt = engine.getParametricPoint(engine.currentTheta);
    setText('parametricPoint', `(${fmt(pt.x)}, ${fmt(pt.y)})`);
}

function generateLineFromInputs() {
    const theta = parseFloat(document.getElementById('lineTheta')?.value || 45) * Math.PI / 180;
    let line;

    if (currentLineMode === 'tangent') {
        line = engine.getTangentAt(theta);
    } else {
        line = engine.getNormalAt(theta);
    }

    if (line && !line.error) { activeLines.push(line); updateActiveLinesDisplay(); render(); }
}

function updateActiveLinesDisplay() {
    const container = document.getElementById('activeLines');
    if (!container) return;
    container.innerHTML = activeLines.map((line, i) => `
        <div class="line-item">
            <span class="line-type">${line.type}</span>
            <span class="line-eq">${line.equation}</span>
            <button class="remove-line" data-index="${i}">×</button>
        </div>
    `).join('');
    container.querySelectorAll('.remove-line').forEach(btn => {
        btn.addEventListener('click', () => { activeLines.splice(parseInt(btn.dataset.index), 1); updateActiveLinesDisplay(); render(); });
    });
}

function updatePropertiesPanel() {
    const p = engine.properties;
    if (!p) return;

    setText('statA', fmt(p.transverseAxis));
    setText('statB', fmt(p.conjugateAxis));
    setText('statC', fmt(p.c));
    setText('statE', fmt(p.eccentricity));
    setText('statType', p.isRectangular ? 'Rectangular' : 'Standard');

    setText('propCenter', `(${fmt(p.center.x)}, ${fmt(p.center.y)})`);
    setText('propA', fmt(p.transverseAxis));
    setText('propB', fmt(p.conjugateAxis));
    setText('propC', fmt(p.c));
    setText('propE', fmt(p.eccentricity));
    setText('propLR', fmt(p.latusRectum));

    setHTML('propFoci', p.foci.map(f => `<span class="point-tag">(${fmt(f.x)}, ${fmt(f.y)})</span>`).join(''));
    setHTML('propVertices', p.vertices.map(v => `<span class="point-tag">(${fmt(v.x)}, ${fmt(v.y)})</span>`).join(''));

    if (p.directrices.type === 'vertical') {
        setText('propDirectrices', `x = ${fmt(p.directrices.values[0])}, x = ${fmt(p.directrices.values[1])}`);
    } else {
        setText('propDirectrices', `y = ${fmt(p.directrices.values[0])}, y = ${fmt(p.directrices.values[1])}`);
    }

    setText('propAsym1', p.equations.asymptote1);
    setText('propAsym2', p.equations.asymptote2);
    setText('propStandard', p.equations.standard);
    setText('propParametric', p.equations.parametric);
    setText('propConjugate', p.conjugate);
}

// Canvas rendering
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

    const props = engine.properties;
    if (!props) return;

    if (showAsymptotes) drawAsymptotes(w, h, props);
    drawDirectrices(w, h, props);
    drawHyperbola(w, h);
    activeLines.forEach(line => drawLine(w, h, line));
    drawFoci(w, h, props);
    drawVertices(w, h, props);
    drawCenter(w, h, props);
    drawParametricPoint(w, h);
    if (showLabels) drawLabels(w, h, props);
}

function toCanvasX(x, w) { return ((x - viewBounds.minX) / (viewBounds.maxX - viewBounds.minX)) * w; }
function toCanvasY(y, h) { return h - ((y - viewBounds.minY) / (viewBounds.maxY - viewBounds.minY)) * h; }
function toMathX(cx, w) { return viewBounds.minX + (cx / w) * (viewBounds.maxX - viewBounds.minX); }
function toMathY(cy, h) { return viewBounds.maxY - (cy / h) * (viewBounds.maxY - viewBounds.minY); }

function drawGrid(w, h) {
    const range = Math.max(viewBounds.maxX - viewBounds.minX, viewBounds.maxY - viewBounds.minY);
    const step = getGridStep(range);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
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

function drawHyperbola(w, h) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;

    // Right/Top branch
    const rightBranch = engine.generatePlotPoints(80, 1);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(rightBranch[0].x, w), toCanvasY(rightBranch[0].y, h));
    for (let i = 1; i < rightBranch.length; i++) {
        ctx.lineTo(toCanvasX(rightBranch[i].x, w), toCanvasY(rightBranch[i].y, h));
    }
    ctx.stroke();

    // Left/Bottom branch
    const leftBranch = engine.generatePlotPoints(80, -1);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(leftBranch[0].x, w), toCanvasY(leftBranch[0].y, h));
    for (let i = 1; i < leftBranch.length; i++) {
        ctx.lineTo(toCanvasX(leftBranch[i].x, w), toCanvasY(leftBranch[i].y, h));
    }
    ctx.stroke();

    // Glow effect
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(rightBranch[0].x, w), toCanvasY(rightBranch[0].y, h));
    for (let i = 1; i < rightBranch.length; i++) {
        ctx.lineTo(toCanvasX(rightBranch[i].x, w), toCanvasY(rightBranch[i].y, h));
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toCanvasX(leftBranch[0].x, w), toCanvasY(leftBranch[0].y, h));
    for (let i = 1; i < leftBranch.length; i++) {
        ctx.lineTo(toCanvasX(leftBranch[i].x, w), toCanvasY(leftBranch[i].y, h));
    }
    ctx.stroke();
}

function drawAsymptotes(w, h, props) {
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 4]);

    props.asymptotes.forEach(asym => {
        const x1 = viewBounds.minX - 2, x2 = viewBounds.maxX + 2;
        const y1 = asym.slope * x1 + asym.intercept;
        const y2 = asym.slope * x2 + asym.intercept;
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x1, w), toCanvasY(y1, h));
        ctx.lineTo(toCanvasX(x2, w), toCanvasY(y2, h));
        ctx.stroke();
    });

    ctx.setLineDash([]);
}

function drawDirectrices(w, h, props) {
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    if (props.directrices.type === 'vertical') {
        props.directrices.values.forEach(x => {
            const cx = toCanvasX(x, w);
            ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
        });
    } else {
        props.directrices.values.forEach(y => {
            const cy = toCanvasY(y, h);
            ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
        });
    }
    ctx.setLineDash([]);
}

function drawFoci(w, h, props) {
    props.foci.forEach(f => {
        const cx = toCanvasX(f.x, w), cy = toCanvasY(f.y, h);
        ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.2)'; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#a855f7'; ctx.fill();
    });
}

function drawVertices(w, h, props) {
    props.vertices.forEach(v => {
        const cx = toCanvasX(v.x, w), cy = toCanvasY(v.y, h);
        ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444'; ctx.fill();
    });
}

function drawCenter(w, h, props) {
    const cx = toCanvasX(props.center.x, w), cy = toCanvasY(props.center.y, h);
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1'; ctx.fill();
}

function drawParametricPoint(w, h) {
    const pt = engine.getParametricPoint(engine.currentTheta);
    const cx = toCanvasX(pt.x, w), cy = toCanvasY(pt.y, h);
    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.2)'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#22d3ee'; ctx.fill();
    if (showLabels) {
        ctx.font = '11px Inter'; ctx.fillStyle = '#22d3ee';
        ctx.fillText(`P(${Math.round(engine.currentTheta * 180 / Math.PI)}°)`, cx + 10, cy - 8);
    }
}

function drawLine(w, h, line) {
    if (!line.getY && !line.isVertical && !line.isHorizontal) return;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;

    if (line.isVertical) {
        const cx = toCanvasX(line.point?.x || 0, w);
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    } else if (line.isHorizontal) {
        const cy = toCanvasY(line.point?.y || line.getY(0), h);
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    } else {
        const x1 = viewBounds.minX - 2, x2 = viewBounds.maxX + 2;
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x1, w), toCanvasY(line.getY(x1), h));
        ctx.lineTo(toCanvasX(x2, w), toCanvasY(line.getY(x2), h));
        ctx.stroke();
    }

    if (line.point) {
        const px = toCanvasX(line.point.x, w), py = toCanvasY(line.point.y, h);
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444'; ctx.fill();
    }
}

function drawLabels(w, h, props) {
    ctx.font = '10px Inter';
    ctx.fillStyle = '#6366f1';
    ctx.fillText('Center', toCanvasX(props.center.x, w) + 8, toCanvasY(props.center.y, h) - 8);
    ctx.fillStyle = '#a855f7';
    props.foci.forEach((f, i) => {
        ctx.fillText(`F${i + 1}`, toCanvasX(f.x, w) + 8, toCanvasY(f.y, h) - 8);
    });
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

function fmt(n) { if (n === undefined || n === null) return '0'; if (Number.isInteger(n)) return n.toString(); if (Math.abs(n) < 0.0001) return '0'; return n.toFixed(3).replace(/\.?0+$/, ''); }
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function setHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = fmt(val); }

document.addEventListener('DOMContentLoaded', init);
