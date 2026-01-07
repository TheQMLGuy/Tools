/**
 * Advanced Parabola Analyzer - Application Controller
 * Features: Bidirectional inputs, parametric point, interactive line tools
 */

// Engine instance
const engine = new AdvancedParabolaEngine();

// State
let showGrid = true, showLabels = true;
let viewBounds = { minX: -2, maxX: 6, minY: -4, maxY: 4 };
let isDragging = false, lastMousePos = { x: 0, y: 0 };
let lineToolsEnabled = true;
let currentLineMode = 'tangent';
let currentLineMethod = 'parameter';
let activeLines = [];
let clickMode = false;
let chordFirstPoint = null;

// DOM Elements
const landingPage = document.getElementById('landing');
const appContainer = document.getElementById('app');
const canvas = document.getElementById('parabolaCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// =====================================================
// INITIALIZATION
// =====================================================

function init() {
    setupLandingPage();
    setupAppEventListeners();
    renderPresets();
}

function renderPresets() {
    const grid = document.getElementById('presetGrid');
    if (!grid) return;
    grid.innerHTML = PARABOLA_PRESETS.map(p => `
        <div class="preset-card" data-equation="${p.equation}">
            <h3>${p.name}</h3>
            <div class="equation">${p.equation}</div>
            <p>${p.description}</p>
        </div>
    `).join('');
    grid.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => loadFromEquation(card.dataset.equation));
    });
}

// =====================================================
// LANDING PAGE
// =====================================================

function setupLandingPage() {
    // Mode tabs
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.mode-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.querySelector(`.mode-content[data-mode="${tab.dataset.mode}"]`)?.classList.add('active');
        });
    });

    // Analyze buttons
    document.getElementById('analyzeEq')?.addEventListener('click', () => {
        const eq = document.getElementById('inputEquation')?.value.trim();
        if (eq) loadFromEquation(eq);
    });
    document.getElementById('inputEquation')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('analyzeEq')?.click();
    });

    document.getElementById('analyzeFocus')?.addEventListener('click', () => {
        const fx = parseFloat(document.getElementById('focusX')?.value) || 1;
        const fy = parseFloat(document.getElementById('focusY')?.value) || 0;
        const vx = parseFloat(document.getElementById('vertexX')?.value) || 0;
        const vy = parseFloat(document.getElementById('vertexY')?.value) || 0;
        loadFromFocus(fx, fy, vx, vy);
    });

    document.getElementById('analyzeDir')?.addEventListener('click', () => {
        const dir = document.getElementById('inputDirectrix')?.value.trim();
        const vx = parseFloat(document.getElementById('dirVertexX')?.value) || 0;
        const vy = parseFloat(document.getElementById('dirVertexY')?.value) || 0;
        if (dir) loadFromDirectrix(dir, vx, vy);
    });

    document.getElementById('analyzeLatus')?.addEventListener('click', () => {
        const length = parseFloat(document.getElementById('latusLength')?.value) || 4;
        const orient = document.getElementById('latusOrientation')?.value || 'right';
        loadFromLatus(length, orient);
    });
}

// =====================================================
// LOAD METHODS
// =====================================================

function loadFromEquation(equation) {
    engine.setFromEquation(equation);
    const props = engine.calculate();
    if (props.error) { alert(props.error); return; }
    showApp();
}

function loadFromFocus(fx, fy, vx, vy) {
    engine.setFromFocus(fx, fy, vx, vy);
    const props = engine.calculate();
    if (props.error) { alert(props.error); return; }
    showApp();
}

function loadFromDirectrix(directrix, vx, vy) {
    engine.setFromDirectrix(directrix, vx, vy);
    const props = engine.calculate();
    if (props.error) { alert(props.error); return; }
    showApp();
}

function loadFromLatus(length, orientation) {
    engine.setFromLatusRectum(length, orientation);
    const props = engine.calculate();
    if (props.error) { alert(props.error); return; }
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

// =====================================================
// APP EVENT LISTENERS
// =====================================================

function setupAppEventListeners() {
    // Back button
    document.getElementById('backToLanding')?.addEventListener('click', () => {
        appContainer?.classList.add('hidden');
        landingPage?.classList.remove('hidden');
    });

    // Bidirectional inputs
    document.getElementById('paramA')?.addEventListener('change', onParamAChange);
    document.getElementById('editFocusX')?.addEventListener('change', onFocusChange);
    document.getElementById('editFocusY')?.addEventListener('change', onFocusChange);
    document.getElementById('editVertexX')?.addEventListener('change', onVertexChange);
    document.getElementById('editVertexY')?.addEventListener('change', onVertexChange);
    document.getElementById('editLatus')?.addEventListener('change', onLatusChange);
    document.getElementById('editOrientation')?.addEventListener('change', onOrientationChange);

    // Parametric point
    const paramT = document.getElementById('paramT');
    const paramTValue = document.getElementById('paramTValue');
    if (paramT && paramTValue) {
        paramT.addEventListener('input', () => {
            paramTValue.value = paramT.value;
            engine.currentT = parseFloat(paramT.value);
            updateParametricPoint();
            render();
        });
        paramTValue.addEventListener('change', () => {
            paramT.value = paramTValue.value;
            engine.currentT = parseFloat(paramTValue.value);
            updateParametricPoint();
            render();
        });
    }

    // Display options
    document.getElementById('showGrid')?.addEventListener('change', function () { showGrid = this.checked; render(); });
    document.getElementById('showLabels')?.addEventListener('change', function () { showLabels = this.checked; render(); });
    document.getElementById('resetView')?.addEventListener('click', () => { viewBounds = engine.getViewBounds(2); render(); });
    document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
        document.querySelector('.visualization-panel')?.classList.toggle('fullscreen');
        setTimeout(() => { resizeCanvas(); render(); }, 100);
    });

    // Line tools
    document.getElementById('lineToolsEnabled')?.addEventListener('change', function () {
        lineToolsEnabled = this.checked;
        document.getElementById('lineToolsBody').style.opacity = lineToolsEnabled ? '1' : '0.4';
        document.getElementById('lineToolsBody').style.pointerEvents = lineToolsEnabled ? 'auto' : 'none';
        render();
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
    document.getElementById('clearLines')?.addEventListener('click', () => {
        activeLines = [];
        updateActiveLinesDisplay();
        render();
    });

    // Canvas events
    if (canvas) {
        canvas.addEventListener('wheel', handleWheel);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('click', handleCanvasClick);
        window.addEventListener('resize', () => { resizeCanvas(); render(); });
    }
}

// =====================================================
// BIDIRECTIONAL INPUT HANDLERS
// =====================================================

function onParamAChange() {
    const a = parseFloat(document.getElementById('paramA')?.value) || 1;
    engine.setFromParameter(a, engine.orientation, engine.h, engine.k);
    engine.calculate();
    updateAllInputs(false); // Don't update 'a' itself
    updatePropertiesPanel();
    viewBounds = engine.getViewBounds(2);
    render();
}

function onFocusChange() {
    const fx = parseFloat(document.getElementById('editFocusX')?.value) || 0;
    const fy = parseFloat(document.getElementById('editFocusY')?.value) || 0;
    engine.setFromFocus(fx, fy, engine.h, engine.k);
    engine.calculate();
    updateAllInputs(true);
    updatePropertiesPanel();
    viewBounds = engine.getViewBounds(2);
    render();
}

function onVertexChange() {
    const vx = parseFloat(document.getElementById('editVertexX')?.value) || 0;
    const vy = parseFloat(document.getElementById('editVertexY')?.value) || 0;
    engine.setVertex(vx, vy);
    engine.calculate();
    updateAllInputs(true);
    updatePropertiesPanel();
    viewBounds = engine.getViewBounds(2);
    render();
}

function onLatusChange() {
    const latus = parseFloat(document.getElementById('editLatus')?.value) || 4;
    engine.setFromLatusRectum(latus, engine.orientation, engine.h, engine.k);
    engine.calculate();
    updateAllInputs(true);
    updatePropertiesPanel();
    viewBounds = engine.getViewBounds(2);
    render();
}

function onOrientationChange() {
    const orient = document.getElementById('editOrientation')?.value || 'right';
    engine.orientation = orient;
    engine.calculate();
    updateAllInputs(true);
    updatePropertiesPanel();
    viewBounds = engine.getViewBounds(2);
    render();
}

function updateAllInputs(includeA = true) {
    const props = engine.properties;
    if (!props) return;

    if (includeA) setVal('paramA', engine.a);
    setVal('editFocusX', props.focus.x);
    setVal('editFocusY', props.focus.y);
    setVal('editVertexX', props.vertex.x);
    setVal('editVertexY', props.vertex.y);
    setVal('editDirectrix', props.directrix.equation);
    setVal('editLatus', props.latusRectumLength);
    document.getElementById('editOrientation').value = engine.orientation;

    // Update equation display
    setText('equationDisplay', props.equations.standard);

    updateParametricPoint();
}

function updateParametricPoint() {
    const pt = engine.getParametricPoint(engine.currentT);
    setText('parametricPoint', `(${fmt(pt.x)}, ${fmt(pt.y)})`);
}

// =====================================================
// LINE TOOLS
// =====================================================

function updateLineInputVisibility() {
    const tInput = document.getElementById('tInput');
    const t2Input = document.getElementById('t2Input');
    const slopeInput = document.getElementById('slopeInput');

    tInput?.classList.remove('hidden');
    t2Input?.classList.add('hidden');
    slopeInput?.classList.add('hidden');

    if (currentLineMode === 'chord') {
        t2Input?.classList.remove('hidden');
    }

    if (currentLineMethod === 'slope') {
        slopeInput?.classList.remove('hidden');
        if (currentLineMode !== 'chord') tInput?.classList.add('hidden');
    }

    if (currentLineMethod === 'click') {
        tInput?.classList.add('hidden');
        t2Input?.classList.add('hidden');
        slopeInput?.classList.add('hidden');
    }
}

function generateLineFromInputs() {
    if (!lineToolsEnabled) return;

    let line;

    if (currentLineMethod === 'parameter') {
        const t1 = parseFloat(document.getElementById('lineT1')?.value) || 1;

        if (currentLineMode === 'tangent') {
            line = engine.getTangentAt(t1);
        } else if (currentLineMode === 'normal') {
            line = engine.getNormalAt(t1);
        } else if (currentLineMode === 'chord') {
            const t2 = parseFloat(document.getElementById('lineT2')?.value) || -1;
            line = engine.getChord(t1, t2);
        }
    } else if (currentLineMethod === 'slope') {
        const m = parseFloat(document.getElementById('lineSlope')?.value) || 1;
        if (currentLineMode === 'tangent') {
            line = engine.getTangentBySlope(m);
        }
    }

    if (line && !line.error) {
        activeLines.push(line);
        updateActiveLinesDisplay();
        updateLineDetails(line);
        render();
    }
}

function handleCanvasClick(e) {
    if (!clickMode || !lineToolsEnabled) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const mathX = toMathX(mx, canvas.clientWidth);
    const mathY = toMathY(my, canvas.clientHeight);

    // Find closest point on parabola
    const t = engine.getClosestParameter(mathX, mathY);

    if (currentLineMode === 'chord') {
        if (!chordFirstPoint) {
            chordFirstPoint = t;
            // Visual feedback
        } else {
            const line = engine.getChord(chordFirstPoint, t);
            if (line && !line.error) {
                activeLines.push(line);
                updateActiveLinesDisplay();
                updateLineDetails(line);
            }
            chordFirstPoint = null;
            render();
        }
    } else {
        let line;
        if (currentLineMode === 'tangent') {
            line = engine.getTangentAt(t);
        } else if (currentLineMode === 'normal') {
            line = engine.getNormalAt(t);
        }

        if (line && !line.error) {
            activeLines.push(line);
            updateActiveLinesDisplay();
            updateLineDetails(line);
            render();
        }
    }
}

function updateActiveLinesDisplay() {
    const container = document.getElementById('activeLines');
    if (!container) return;

    container.innerHTML = activeLines.map((line, i) => `
        <div class="line-item">
            <span class="line-type ${line.type}">${line.type}</span>
            <span class="line-eq">${line.equation}</span>
            <button class="remove-line" data-index="${i}">×</button>
        </div>
    `).join('');

    container.querySelectorAll('.remove-line').forEach(btn => {
        btn.addEventListener('click', () => {
            activeLines.splice(parseInt(btn.dataset.index), 1);
            updateActiveLinesDisplay();
            render();
        });
    });
}

function updateLineDetails(line) {
    const container = document.getElementById('lineDetails');
    if (!container) return;

    let html = `<div class="property-row"><span>Type</span><span class="property-value">${line.type}</span></div>`;
    html += `<div class="property-row"><span>Equation</span><span class="property-value mono">${line.equation}</span></div>`;

    if (line.slope !== undefined && !line.isVertical) {
        html += `<div class="property-row"><span>Slope</span><span class="property-value">${fmt(line.slope)}</span></div>`;
    }

    if (line.point) {
        html += `<div class="property-row"><span>Point</span><span class="property-value">(${fmt(line.point.x)}, ${fmt(line.point.y)})</span></div>`;
    }

    if (line.t !== undefined) {
        html += `<div class="property-row"><span>Parameter t</span><span class="property-value">${fmt(line.t)}</span></div>`;
    }

    if (line.isFocalChord) {
        html += `<div class="property-row"><span>Focal Chord</span><span class="property-value highlight">Yes</span></div>`;
    }

    container.innerHTML = html;
}

// =====================================================
// PROPERTIES PANEL
// =====================================================

function updatePropertiesPanel() {
    const props = engine.properties;
    if (!props) return;

    // Stats bar
    setText('statVertex', `(${fmt(props.vertex.x)}, ${fmt(props.vertex.y)})`);
    setText('statFocus', `(${fmt(props.focus.x)}, ${fmt(props.focus.y)})`);
    setText('statA', fmt(props.parameter));
    setText('statLatus', fmt(props.latusRectumLength));
    setText('statEcc', '1');

    // Properties panel
    setText('propVertex', `(${fmt(props.vertex.x)}, ${fmt(props.vertex.y)})`);
    setText('propFocus', `(${fmt(props.focus.x)}, ${fmt(props.focus.y)})`);
    setText('propDirectrix', props.directrix.equation);
    setText('propAxis', props.axisOfSymmetry.equation);
    setText('propA', fmt(props.parameter));
    setText('prop4a', fmt(4 * props.parameter));
    setText('propLatus', fmt(props.latusRectumLength));
    setText('propEcc', '1');

    // Intercepts
    setHTML('propXInt', props.xIntercepts.length > 0
        ? props.xIntercepts.map(p => `<span class="point-tag">(${fmt(p.x)}, ${fmt(p.y)})</span>`).join('')
        : '<span class="muted">None</span>');
    setHTML('propYInt', props.yIntercepts.length > 0
        ? props.yIntercepts.map(p => `<span class="point-tag">(${fmt(p.x)}, ${fmt(p.y)})</span>`).join('')
        : '<span class="muted">None</span>');

    // Equations
    setText('propStandard', props.equations.standard);
    setText('propParametric', props.equations.parametric);

    // Latus rectum endpoints
    setHTML('propLatusEnds', props.latusRectumEndpoints
        .map(p => `<span class="point-tag">(${fmt(p.x)}, ${fmt(p.y)})</span>`).join(''));
}

// =====================================================
// CANVAS RENDERING
// =====================================================

function resizeCanvas() {
    if (!canvas) return;
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
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

    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    // Grid
    if (showGrid) drawGrid(w, h);

    // Axes
    drawAxes(w, h);

    const props = engine.properties;
    if (!props) return;

    // Directrix
    drawDirectrix(w, h, props);

    // Latus rectum
    drawLatusRectum(w, h, props);

    // Parabola
    drawParabola(w, h);

    // Active lines
    if (lineToolsEnabled) {
        activeLines.forEach(line => drawLine(w, h, line));
    }

    // Key points
    drawVertex(w, h, props);
    drawFocus(w, h, props);

    // Parametric point
    drawParametricPoint(w, h);

    // Labels
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

function drawParabola(w, h) {
    const points = engine.generatePlotPoints(-6, 6, 300);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    points.forEach(p => {
        const cx = toCanvasX(p.x, w), cy = toCanvasY(p.y, h);
        if (cx >= -100 && cx <= w + 100 && cy >= -100 && cy <= h + 100) {
            if (!started) { ctx.moveTo(cx, cy); started = true; }
            else ctx.lineTo(cx, cy);
        }
    });
    ctx.stroke();

    // Glow
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 6;
    ctx.stroke();
}

function drawDirectrix(w, h, props) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);

    if (props.directrix.type === 'vertical') {
        const cx = toCanvasX(props.directrix.value, w);
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    } else {
        const cy = toCanvasY(props.directrix.value, h);
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawLatusRectum(w, h, props) {
    const [p1, p2] = props.latusRectumEndpoints;
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(p1.x, w), toCanvasY(p1.y, h));
    ctx.lineTo(toCanvasX(p2.x, w), toCanvasY(p2.y, h));
    ctx.stroke();
}

function drawVertex(w, h, props) {
    const cx = toCanvasX(props.vertex.x, w), cy = toCanvasY(props.vertex.y, h);
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1'; ctx.fill();
}

function drawFocus(w, h, props) {
    const cx = toCanvasX(props.focus.x, w), cy = toCanvasY(props.focus.y, h);
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b'; ctx.fill();
}

function drawParametricPoint(w, h) {
    const pt = engine.getParametricPoint(engine.currentT);
    const cx = toCanvasX(pt.x, w), cy = toCanvasY(pt.y, h);

    // Outer glow
    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.2)'; ctx.fill();

    // Point
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#22d3ee'; ctx.fill();

    // Label
    if (showLabels) {
        ctx.font = '11px Inter';
        ctx.fillStyle = '#22d3ee';
        ctx.fillText(`P(${fmt(engine.currentT)})`, cx + 10, cy - 8);
    }
}

function drawLine(w, h, line) {
    if (!line.getY && !line.isVertical && !line.isHorizontal) return;

    const colors = { tangent: '#06b6d4', normal: '#f97316', chord: '#a855f7' };
    ctx.strokeStyle = colors[line.type] || '#06b6d4';
    ctx.lineWidth = 2;

    if (line.isVertical) {
        const cx = toCanvasX(line.point?.x || 0, w);
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    } else if (line.isHorizontal) {
        const cy = toCanvasY(line.point?.y || 0, h);
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    } else {
        const x1 = viewBounds.minX - 2, x2 = viewBounds.maxX + 2;
        const y1 = line.getY(x1), y2 = line.getY(x2);
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x1, w), toCanvasY(y1, h));
        ctx.lineTo(toCanvasX(x2, w), toCanvasY(y2, h));
        ctx.stroke();
    }

    // Draw point of tangency for tangent/normal
    if (line.point) {
        const cx = toCanvasX(line.point.x, w), cy = toCanvasY(line.point.y, h);
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = colors[line.type]; ctx.fill();
    }

    // Draw chord endpoints
    if (line.points) {
        line.points.forEach(pt => {
            const cx = toCanvasX(pt.x, w), cy = toCanvasY(pt.y, h);
            ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fillStyle = colors[line.type]; ctx.fill();
        });
    }
}

function drawLabels(w, h, props) {
    ctx.font = '10px Inter';

    ctx.fillStyle = '#6366f1';
    ctx.fillText('Vertex', toCanvasX(props.vertex.x, w) + 8, toCanvasY(props.vertex.y, h) - 8);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText('Focus', toCanvasX(props.focus.x, w) + 8, toCanvasY(props.focus.y, h) - 8);

    ctx.fillStyle = '#ef4444';
    if (props.directrix.type === 'vertical') {
        ctx.fillText('Directrix', toCanvasX(props.directrix.value, w) + 4, 20);
    } else {
        ctx.fillText('Directrix', 10, toCanvasY(props.directrix.value, h) - 6);
    }
}

// =====================================================
// CANVAS INTERACTIONS
// =====================================================

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

function handleMouseDown(e) {
    if (clickMode) return;
    isDragging = true;
    lastMousePos = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;

    // Update coordinate display
    const coordDisplay = document.getElementById('coordDisplay');
    if (coordDisplay) {
        coordDisplay.textContent = `(${fmt(toMathX(mx, canvas.clientWidth))}, ${fmt(toMathY(my, canvas.clientHeight))})`;
    }

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

function handleMouseUp() {
    isDragging = false;
    canvas.style.cursor = clickMode ? 'crosshair' : 'grab';
}

function handleMouseLeave() {
    isDragging = false;
    canvas.style.cursor = 'crosshair';
}

// =====================================================
// HELPERS
// =====================================================

function fmt(n) {
    if (n === undefined || n === null) return '0';
    if (Number.isInteger(n)) return n.toString();
    if (Math.abs(n) < 0.0001) return '0';
    return n.toFixed(3).replace(/\.?0+$/, '');
}

function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function setHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = fmt(val); }

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
