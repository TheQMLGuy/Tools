/**
 * Advanced Circle Analyzer - Application Controller
 */
const engine = new AdvancedCircleEngine();
let showGrid = true, showLabels = true;
let viewBounds = { minX: -3, maxX: 3, minY: -3, maxY: 3 };
let isDragging = false, lastMousePos = { x: 0, y: 0 };
let lineToolsEnabled = true, currentLineMode = 'tangent', currentLineMethod = 'angle';
let activeLines = [], clickMode = false, chordFirstAngle = null;

const landingPage = document.getElementById('landing');
const appContainer = document.getElementById('app');
const canvas = document.getElementById('circleCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

function init() { setupEventListeners(); renderPresets(); }

function renderPresets() {
    const grid = document.getElementById('presetGrid');
    if (!grid) return;
    grid.innerHTML = CIRCLE_PRESETS.map(p => `
        <div class="preset-card" data-equation="${p.equation}">
            <h3>${p.name}</h3><div class="equation">${p.equation}</div><p>${p.description}</p>
        </div>
    `).join('');
    grid.querySelectorAll('.preset-card').forEach(card => card.addEventListener('click', () => loadEquation(card.dataset.equation)));
}

function loadEquation(equation) {
    engine.setFromEquation(equation);
    const props = engine.calculate();
    if (props.error) { alert(props.error); return; }
    showApp();
}

function showApp() {
    landingPage?.classList.add('hidden');
    appContainer?.classList.remove('hidden');
    viewBounds = engine.getViewBounds(1.5);
    activeLines = [];
    updateAllInputs();
    updatePropertiesPanel();
    resizeCanvas();
    render();
}

function setupEventListeners() {
    // Landing page
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
    document.getElementById('editCenterX')?.addEventListener('change', onCenterChange);
    document.getElementById('editCenterY')?.addEventListener('change', onCenterChange);
    document.getElementById('editRadius')?.addEventListener('change', onRadiusChange);

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
            paramTheta.value = paramThetaValue.value;
            engine.currentTheta = parseFloat(paramThetaValue.value) * Math.PI / 180;
            updateParametricPoint();
            render();
        });
    }

    // Display options
    document.getElementById('showGrid')?.addEventListener('change', function () { showGrid = this.checked; render(); });
    document.getElementById('showLabels')?.addEventListener('change', function () { showLabels = this.checked; render(); });
    document.getElementById('resetView')?.addEventListener('click', () => { viewBounds = engine.getViewBounds(1.5); render(); });
    document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
        document.querySelector('.visualization-panel')?.classList.toggle('fullscreen');
        setTimeout(() => { resizeCanvas(); render(); }, 100);
    });

    // Line tools
    document.getElementById('lineToolsEnabled')?.addEventListener('change', function () {
        lineToolsEnabled = this.checked;
        document.getElementById('lineToolsBody').style.opacity = lineToolsEnabled ? '1' : '0.4';
        document.getElementById('lineToolsBody').style.pointerEvents = lineToolsEnabled ? 'auto' : 'none';
    });

    document.querySelectorAll('.line-mode').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.line-mode').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLineMode = btn.dataset.mode;
            updateLineInputVisibility();
        });
    });

    document.querySelectorAll('input[name="lineMethod"]').forEach(radio => {
        radio.addEventListener('change', () => {
            currentLineMethod = radio.value;
            updateLineInputVisibility();
            clickMode = (currentLineMethod === 'click');
            document.getElementById('clickHint')?.classList.toggle('hidden', !clickMode);
        });
    });

    document.getElementById('generateLine')?.addEventListener('click', generateLineFromInputs);
    document.getElementById('clearLines')?.addEventListener('click', () => { activeLines = []; updateActiveLinesDisplay(); render(); });

    // Canvas events
    if (canvas) {
        canvas.addEventListener('wheel', handleWheel);
        canvas.addEventListener('mousedown', (e) => { if (!clickMode) { isDragging = true; lastMousePos = { x: e.clientX, y: e.clientY }; canvas.style.cursor = 'grabbing'; } });
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = clickMode ? 'crosshair' : 'grab'; });
        canvas.addEventListener('mouseleave', () => { isDragging = false; });
        canvas.addEventListener('click', handleCanvasClick);
        window.addEventListener('resize', () => { resizeCanvas(); render(); });
    }
}

function onCenterChange() {
    const h = parseFloat(document.getElementById('editCenterX')?.value) || 0;
    const k = parseFloat(document.getElementById('editCenterY')?.value) || 0;
    engine.setCenter(h, k);
    engine.calculate();
    updateAllInputs();
    updatePropertiesPanel();
    viewBounds = engine.getViewBounds(1.5);
    render();
}

function onRadiusChange() {
    const r = parseFloat(document.getElementById('editRadius')?.value) || 1;
    engine.setRadius(r);
    engine.calculate();
    updateAllInputs();
    updatePropertiesPanel();
    viewBounds = engine.getViewBounds(1.5);
    render();
}

function updateAllInputs() {
    const props = engine.properties;
    if (!props) return;
    setVal('editCenterX', engine.h);
    setVal('editCenterY', engine.k);
    setVal('editRadius', engine.r);
    setText('equationDisplay', props.equations.standard);
    updateParametricPoint();
}

function updateParametricPoint() {
    const pt = engine.getParametricPoint(engine.currentTheta);
    setText('parametricPoint', `(${fmt(pt.x)}, ${fmt(pt.y)})`);
}

function updateLineInputVisibility() {
    const theta1Input = document.getElementById('theta1Input');
    const theta2Input = document.getElementById('theta2Input');
    const slopeInput = document.getElementById('slopeInput');

    theta1Input?.classList.remove('hidden');
    theta2Input?.classList.add('hidden');
    slopeInput?.classList.add('hidden');

    if (currentLineMode === 'chord') theta2Input?.classList.remove('hidden');
    if (currentLineMethod === 'slope') { slopeInput?.classList.remove('hidden'); if (currentLineMode !== 'chord') theta1Input?.classList.add('hidden'); }
    if (currentLineMethod === 'click') { theta1Input?.classList.add('hidden'); theta2Input?.classList.add('hidden'); slopeInput?.classList.add('hidden'); }
}

function generateLineFromInputs() {
    if (!lineToolsEnabled) return;
    let line;

    if (currentLineMethod === 'angle') {
        const theta1 = parseFloat(document.getElementById('lineTheta1')?.value || 0) * Math.PI / 180;
        if (currentLineMode === 'tangent') {
            line = engine.getTangentAt(theta1);
        } else {
            const theta2 = parseFloat(document.getElementById('lineTheta2')?.value || 180) * Math.PI / 180;
            line = engine.getChord(theta1, theta2);
        }
    } else if (currentLineMethod === 'slope') {
        const m = parseFloat(document.getElementById('lineSlope')?.value) || 0;
        if (currentLineMode === 'tangent') {
            const tangents = engine.getTangentBySlope(m);
            tangents.forEach(t => activeLines.push(t));
            updateActiveLinesDisplay();
            render();
            return;
        }
    }

    if (line && !line.error) { activeLines.push(line); updateActiveLinesDisplay(); render(); }
}

function handleCanvasClick(e) {
    if (!clickMode || !lineToolsEnabled) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const mathX = toMathX(mx, canvas.clientWidth), mathY = toMathY(my, canvas.clientHeight);
    const theta = engine.getAngleFromPoint(mathX, mathY);

    if (currentLineMode === 'chord') {
        if (chordFirstAngle === null) { chordFirstAngle = theta; }
        else { activeLines.push(engine.getChord(chordFirstAngle, theta)); chordFirstAngle = null; updateActiveLinesDisplay(); render(); }
    } else {
        activeLines.push(engine.getTangentAt(theta));
        updateActiveLinesDisplay();
        render();
    }
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
    setText('statCenter', `(${fmt(p.center.x)}, ${fmt(p.center.y)})`);
    setText('statRadius', fmt(p.radius));
    setText('statArea', `${fmt(p.area / Math.PI)}π`);
    setText('statCircum', `${fmt(p.circumference / Math.PI)}π`);

    setText('propCenter', `(${fmt(p.center.x)}, ${fmt(p.center.y)})`);
    setText('propRadius', fmt(p.radius));
    setText('propDiameter', fmt(p.diameter));
    setText('propArea', `π × ${fmt(p.radius)}² ≈ ${fmt(p.area)}`);
    setText('propCircum', `2π × ${fmt(p.radius)} ≈ ${fmt(p.circumference)}`);

    setHTML('propXInt', p.xIntercepts.length > 0 ? p.xIntercepts.map(pt => `<span class="point-tag">(${fmt(pt.x)}, ${fmt(pt.y)})</span>`).join('') : '<span class="muted">None</span>');
    setHTML('propYInt', p.yIntercepts.length > 0 ? p.yIntercepts.map(pt => `<span class="point-tag">(${fmt(pt.x)}, ${fmt(pt.y)})</span>`).join('') : '<span class="muted">None</span>');

    setText('propStandard', p.equations.standard);
    setText('propParametric', p.equations.parametric);
    setText('propGeneral', p.equations.general);
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

    drawCircle(w, h);
    if (lineToolsEnabled) activeLines.forEach(line => drawLine(w, h, line));
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
    if (norm < 1.5) return mag; if (norm < 3) return 2 * mag; if (norm < 7) return 5 * mag; return 10 * mag;
}

function drawAxes(w, h) {
    const ox = toCanvasX(0, w), oy = toCanvasY(0, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    if (oy >= 0 && oy <= h) { ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke(); }
    if (ox >= 0 && ox <= w) { ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke(); }
}

function drawCircle(w, h) {
    const { h: ch, k: ck, r } = engine;
    const cx = toCanvasX(ch, w), cy = toCanvasY(ck, h);
    const rx = (r / (viewBounds.maxX - viewBounds.minX)) * w;
    const ry = (r / (viewBounds.maxY - viewBounds.minY)) * h;

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 6;
    ctx.stroke();
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
    ctx.strokeStyle = '#06b6d4';
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
        ctx.fillStyle = '#06b6d4'; ctx.fill();
    }
    if (line.points) {
        line.points.forEach(pt => {
            ctx.beginPath(); ctx.arc(toCanvasX(pt.x, w), toCanvasY(pt.y, h), 4, 0, Math.PI * 2);
            ctx.fillStyle = '#06b6d4'; ctx.fill();
        });
    }
}

function drawLabels(w, h, props) {
    ctx.font = '10px Inter';
    ctx.fillStyle = '#6366f1';
    ctx.fillText('Center', toCanvasX(props.center.x, w) + 8, toCanvasY(props.center.y, h) - 8);
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
