/**
 * Ellipse Analyzer - Application Controller
 */
const engine = new EllipseEngine();
let currentEquation = 'x²/9 + y²/4 = 1';
let showGrid = true, showLabels = true, showDirectrices = true;
let viewBounds = { minX: -6, maxX: 6, minY: -4, maxY: 4 };
let isDragging = false, lastMousePos = { x: 0, y: 0 };

const landingPage = document.getElementById('landing');
const appContainer = document.getElementById('app');
const canvas = document.getElementById('ellipseCanvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');

function init() { setupEventListeners(); renderPresets(); }

function renderPresets() {
    const grid = document.getElementById('presetGrid');
    if (!grid) return;
    grid.innerHTML = ELLIPSE_PRESETS.map(p => `
        <div class="preset-card" data-equation="${p.equation}">
            <h3>${p.name}</h3><div class="equation">${p.equation}</div><p>${p.description}</p>
        </div>
    `).join('');
    grid.querySelectorAll('.preset-card').forEach(card => card.addEventListener('click', () => loadEquation(card.dataset.equation)));
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
    document.getElementById('showDirectrices')?.addEventListener('change', function () { showDirectrices = this.checked; render(); });
    const presetSelect = document.getElementById('presetSelect');
    if (presetSelect) {
        ELLIPSE_PRESETS.forEach(p => { const opt = document.createElement('option'); opt.value = p.equation; opt.textContent = p.name; presetSelect.appendChild(opt); });
        presetSelect.addEventListener('change', function () { if (this.value) loadEquation(this.value); });
    }
    if (canvas) {
        canvas.addEventListener('wheel', handleWheel);
        canvas.addEventListener('mousedown', (e) => { isDragging = true; lastMousePos = { x: e.clientX, y: e.clientY }; canvas.style.cursor = 'grabbing'; });
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = 'crosshair'; });
        canvas.addEventListener('mouseleave', () => { isDragging = false; canvas.style.cursor = 'crosshair'; });
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
    if (showDirectrices) drawDirectrices(w, h, props);
    drawEllipse(w, h);
    drawCenter(w, h, props);
    drawFoci(w, h, props);
    drawVertices(w, h, props);
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

function drawEllipse(w, h) {
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

function drawFoci(w, h, props) {
    ctx.fillStyle = '#f59e0b';
    props.foci.forEach(f => { ctx.beginPath(); ctx.arc(toCanvasX(f.x, w), toCanvasY(f.y, h), 5, 0, Math.PI * 2); ctx.fill(); });
}

function drawVertices(w, h, props) {
    ctx.fillStyle = '#ec4899';
    props.vertices.forEach(v => { ctx.beginPath(); ctx.arc(toCanvasX(v.x, w), toCanvasY(v.y, h), 4, 0, Math.PI * 2); ctx.fill(); });
    props.coVertices.forEach(v => { ctx.beginPath(); ctx.arc(toCanvasX(v.x, w), toCanvasY(v.y, h), 4, 0, Math.PI * 2); ctx.fill(); });
}

function drawDirectrices(w, h, props) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    props.directrices.forEach(d => {
        if (d.type === 'vertical') {
            const cx = toCanvasX(d.value, w);
            ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
        } else {
            const cy = toCanvasY(d.value, h);
            ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
        }
    });
    ctx.setLineDash([]);
}

function drawLabels(w, h, props) {
    ctx.font = '10px Inter';
    ctx.fillStyle = '#6366f1';
    ctx.fillText('Center', toCanvasX(props.center.x, w) + 8, toCanvasY(props.center.y, h) - 8);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('F₁', toCanvasX(props.foci[0].x, w) + 8, toCanvasY(props.foci[0].y, h) - 6);
    ctx.fillText('F₂', toCanvasX(props.foci[1].x, w) + 8, toCanvasY(props.foci[1].y, h) - 6);
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
    document.getElementById('coordDisplay').textContent = `(${formatNum(toMathX(mx, canvas.clientWidth))}, ${formatNum(toMathY(my, canvas.clientHeight))})`;
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
    document.getElementById('equationDisplay').textContent = currentEquation;
    document.getElementById('editEquation').value = currentEquation;
}

function updatePropertiesPanel() {
    const p = engine.properties;
    if (!p) return;
    setText('statCenter', `(${formatNum(p.center.x)}, ${formatNum(p.center.y)})`);
    setText('statA', formatNum(p.semiMajorAxis));
    setText('statB', formatNum(p.semiMinorAxis));
    setText('statEcc', formatNum(p.eccentricity));
    setText('propCenter', `(${formatNum(p.center.x)}, ${formatNum(p.center.y)})`);
    setText('propA', formatNum(p.semiMajorAxis));
    setText('propB', formatNum(p.semiMinorAxis));
    setText('propOrientation', p.orientation.charAt(0).toUpperCase() + p.orientation.slice(1));
    setHTML('propFoci', p.foci.map(f => `<span class="point-tag">(${formatNum(f.x)}, ${formatNum(f.y)})</span>`).join(''));
    setHTML('propVertices', p.vertices.map(v => `<span class="point-tag">(${formatNum(v.x)}, ${formatNum(v.y)})</span>`).join(''));
    setHTML('propCoVertices', p.coVertices.map(v => `<span class="point-tag">(${formatNum(v.x)}, ${formatNum(v.y)})</span>`).join(''));
    setText('propC', formatNum(p.focalDistance));
    setText('propEcc', formatNum(p.eccentricity));
    setText('propLatus', formatNum(p.latusRectumLength));
    setText('propArea', `${formatNum(p.semiMajorAxis)}·${formatNum(p.semiMinorAxis)}π ≈ ${formatNum(p.area)}`);
    setText('propStandard', p.standardForm);
    setText('propParametric', p.parametricForm);
}

function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function setHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function formatNum(n) { if (Number.isInteger(n)) return n.toString(); if (Math.abs(n) < 0.0001) return '0'; return n.toFixed(3).replace(/\.?0+$/, ''); }

document.addEventListener('DOMContentLoaded', init);
