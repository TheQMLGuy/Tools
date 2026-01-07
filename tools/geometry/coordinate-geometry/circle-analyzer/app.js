/**
 * Circle Analyzer - Application Controller
 */
const engine = new CircleEngine();
let currentEquation = 'x² + y² = 1';
let showGrid = true, showLabels = true, showCardinal = true;
let viewBounds = { minX: -5, maxX: 5, minY: -5, maxY: 5 };
let isDragging = false, lastMousePos = { x: 0, y: 0 };

const landingPage = document.getElementById('landing');
const appContainer = document.getElementById('app');
const canvas = document.getElementById('circleCanvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');

function init() {
    setupEventListeners();
    renderPresets();
}

function renderPresets() {
    const grid = document.getElementById('presetGrid');
    if (!grid) return;
    grid.innerHTML = CIRCLE_PRESETS.map(p => `
        <div class="preset-card" data-equation="${p.equation}">
            <h3>${p.name}</h3>
            <div class="equation">${p.equation}</div>
            <p>${p.description}</p>
        </div>
    `).join('');
    grid.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => loadEquation(card.dataset.equation));
    });
}

function loadEquation(equation) {
    currentEquation = equation;
    engine.parseEquation(equation);
    const props = engine.calculate();
    if (props.error) { alert(props.error); return; }
    viewBounds = engine.getViewBounds(2);
    landingPage.classList.add('hidden');
    appContainer.classList.remove('hidden');
    updateEquationDisplay();
    updatePropertiesPanel();
    resizeCanvas();
    render();
}

function setupEventListeners() {
    const customInput = document.getElementById('customEquation');
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (customInput && analyzeBtn) {
        analyzeBtn.addEventListener('click', () => { if (customInput.value.trim()) loadEquation(customInput.value.trim()); });
        customInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && customInput.value.trim()) loadEquation(customInput.value.trim()); });
    }
    document.getElementById('backToLanding')?.addEventListener('click', () => { appContainer.classList.add('hidden'); landingPage.classList.remove('hidden'); });
    document.getElementById('editEquation')?.addEventListener('change', function () {
        if (this.value.trim()) { try { engine.parseEquation(this.value.trim()); if (!engine.calculate().error) { currentEquation = this.value.trim(); viewBounds = engine.getViewBounds(2); updateEquationDisplay(); updatePropertiesPanel(); render(); } } catch (e) { } }
    });
    document.getElementById('showGrid')?.addEventListener('change', function () { showGrid = this.checked; render(); });
    document.getElementById('showLabels')?.addEventListener('change', function () { showLabels = this.checked; render(); });
    document.getElementById('showCardinal')?.addEventListener('change', function () { showCardinal = this.checked; render(); });
    const presetSelect = document.getElementById('presetSelect');
    if (presetSelect) {
        CIRCLE_PRESETS.forEach(p => { const opt = document.createElement('option'); opt.value = p.equation; opt.textContent = p.name; presetSelect.appendChild(opt); });
        presetSelect.addEventListener('change', function () { if (this.value) loadEquation(this.value); });
    }
    if (canvas) {
        canvas.addEventListener('wheel', handleWheel);
        canvas.addEventListener('mousedown', (e) => { isDragging = true; lastMousePos = { x: e.clientX, y: e.clientY }; canvas.style.cursor = 'grabbing'; });
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = 'crosshair'; });
        canvas.addEventListener('mouseleave', () => { isDragging = false; canvas.style.cursor = 'crosshair'; tooltip.classList.add('hidden'); });
        window.addEventListener('resize', () => { resizeCanvas(); render(); });
    }
    document.getElementById('fullscreenBtn')?.addEventListener('click', () => { document.querySelector('.visualization-panel').classList.toggle('fullscreen'); resizeCanvas(); render(); });
    document.getElementById('resetView')?.addEventListener('click', () => { viewBounds = engine.getViewBounds(2); render(); });
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = container.clientWidth + 'px';
    canvas.style.height = container.clientHeight + 'px';
    ctx.scale(dpr, dpr);
}

function render() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);
    if (showGrid) drawGrid(w, h);
    drawAxes(w, h);
    const props = engine.properties;
    if (!props) return;
    drawCircle(w, h);
    drawCenter(w, h, props);
    if (showCardinal) drawCardinalPoints(w, h, props);
    drawIntercepts(w, h, props);
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
    const rough = range / 10;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const norm = rough / mag;
    if (norm < 1.5) return mag;
    if (norm < 3) return 2 * mag;
    if (norm < 7) return 5 * mag;
    return 10 * mag;
}

function drawAxes(w, h) {
    const ox = toCanvasX(0, w), oy = toCanvasY(0, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    if (oy >= 0 && oy <= h) { ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke(); }
    if (ox >= 0 && ox <= w) { ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke(); }
}

function drawCircle(w, h) {
    const points = engine.generatePlotPoints(100);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((p, i) => { const cx = toCanvasX(p.x, w), cy = toCanvasY(p.y, h); i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy); });
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.lineWidth = 6;
    ctx.stroke();
}

function drawCenter(w, h, props) {
    const cx = toCanvasX(props.center.x, w), cy = toCanvasY(props.center.y, h);
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fillStyle = 'rgba(99, 102, 241, 0.2)'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fillStyle = '#6366f1'; ctx.fill();
}

function drawCardinalPoints(w, h, props) {
    ctx.fillStyle = '#ec4899';
    ['top', 'bottom', 'left', 'right'].forEach(key => {
        const p = props.cardinalPoints[key];
        ctx.beginPath(); ctx.arc(toCanvasX(p.x, w), toCanvasY(p.y, h), 4, 0, Math.PI * 2); ctx.fill();
    });
}

function drawIntercepts(w, h, props) {
    ctx.fillStyle = '#06b6d4';
    props.xIntercepts.forEach(p => { ctx.beginPath(); ctx.arc(toCanvasX(p.x, w), toCanvasY(p.y, h), 4, 0, Math.PI * 2); ctx.fill(); });
    props.yIntercepts.forEach(p => { ctx.beginPath(); ctx.arc(toCanvasX(p.x, w), toCanvasY(p.y, h), 4, 0, Math.PI * 2); ctx.fill(); });
}

function drawLabels(w, h, props) {
    ctx.font = '11px Inter';
    ctx.fillStyle = '#6366f1';
    ctx.fillText('Center', toCanvasX(props.center.x, w) + 8, toCanvasY(props.center.y, h) - 8);
}

function handleWheel(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = toMathX(e.clientX - rect.left, canvas.clientWidth);
    const my = toMathY(e.clientY - rect.top, canvas.clientHeight);
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
    const coordDisplay = document.getElementById('coordDisplay');
    if (coordDisplay) coordDisplay.textContent = `(${formatNum(toMathX(mx, canvas.clientWidth))}, ${formatNum(toMathY(my, canvas.clientHeight))})`;
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

function updateEquationDisplay() {
    const d = document.getElementById('equationDisplay'), e = document.getElementById('editEquation');
    if (d) d.textContent = currentEquation;
    if (e) e.value = currentEquation;
}

function updatePropertiesPanel() {
    const p = engine.properties;
    if (!p) return;
    setText('statCenter', `(${formatNum(p.center.x)}, ${formatNum(p.center.y)})`);
    setText('statRadius', formatNum(p.radius));
    setText('statArea', `${formatNum(p.area / Math.PI)}π`);
    setText('statCircum', `${formatNum(p.circumference / Math.PI)}π`);
    setText('propCenter', `(${formatNum(p.center.x)}, ${formatNum(p.center.y)})`);
    setText('propRadius', formatNum(p.radius));
    setText('propDiameter', formatNum(p.diameter));
    setText('propArea', `π·${formatNum(p.radius)}² ≈ ${formatNum(p.area)}`);
    setText('propCircum', `2π·${formatNum(p.radius)} ≈ ${formatNum(p.circumference)}`);
    setText('propEcc', '0');
    setHTML('propXIntercepts', p.xIntercepts.length ? p.xIntercepts.map(pt => `<span class="point-tag">(${formatNum(pt.x)}, 0)</span>`).join('') : '<span class="muted">None</span>');
    setHTML('propYIntercepts', p.yIntercepts.length ? p.yIntercepts.map(pt => `<span class="point-tag">(0, ${formatNum(pt.y)})</span>`).join('') : '<span class="muted">None</span>');
    setText('propStandard', p.standardForm);
    setText('propGeneral', p.generalForm);
    setText('propParametric', p.parametricForm);
}

function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function setHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function formatNum(n) { if (Number.isInteger(n)) return n.toString(); if (Math.abs(n) < 0.0001) return '0'; return n.toFixed(3).replace(/\.?0+$/, ''); }

document.addEventListener('DOMContentLoaded', init);
