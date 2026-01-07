/**
 * Parabola Analyzer - Application Controller
 * Handles UI interactions and canvas rendering
 */

// Initialize engine
const engine = new ParabolaEngine();

// State
let currentEquation = 'y = x²';
let showGrid = true;
let showLabels = true;
let showLatusRectum = true;
let viewBounds = { minX: -10, maxX: 10, minY: -5, maxY: 10 };
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };
let zoom = 1;

// DOM Elements
const landingPage = document.getElementById('landing');
const appContainer = document.getElementById('app');
const canvas = document.getElementById('parabolaCanvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');

// ============================================
// Initialization
// ============================================

function init() {
    setupEventListeners();
    renderPresets();
}

function renderPresets() {
    const grid = document.getElementById('presetGrid');
    if (!grid) return;

    grid.innerHTML = PARABOLA_PRESETS.map(preset => `
        <div class="preset-card" data-equation="${preset.equation}">
            <h3>${preset.name}</h3>
            <div class="equation">${preset.equation}</div>
            <p>${preset.description}</p>
        </div>
    `).join('');

    // Add click handlers
    grid.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => {
            const equation = card.dataset.equation;
            loadEquation(equation);
        });
    });
}

function loadEquation(equation) {
    currentEquation = equation;
    engine.parseEquation(equation);
    const props = engine.calculate();

    if (props.error) {
        alert(props.error);
        return;
    }

    // Calculate optimal view
    viewBounds = engine.getViewBounds(3);

    // Show app
    landingPage.classList.add('hidden');
    appContainer.classList.remove('hidden');

    // Update UI
    updateEquationDisplay();
    updatePropertiesPanel();

    // Initialize canvas
    resizeCanvas();
    render();
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
    // Custom equation input
    const customInput = document.getElementById('customEquation');
    const analyzeBtn = document.getElementById('analyzeBtn');

    if (customInput && analyzeBtn) {
        analyzeBtn.addEventListener('click', () => {
            const eq = customInput.value.trim();
            if (eq) loadEquation(eq);
        });

        customInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const eq = customInput.value.trim();
                if (eq) loadEquation(eq);
            }
        });
    }

    // Back button
    const backBtn = document.getElementById('backToLanding');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            appContainer.classList.add('hidden');
            landingPage.classList.remove('hidden');
        });
    }

    // Edit equation input
    const editInput = document.getElementById('editEquation');
    if (editInput) {
        editInput.addEventListener('change', () => {
            const eq = editInput.value.trim();
            if (eq) {
                try {
                    engine.parseEquation(eq);
                    const props = engine.calculate();
                    if (!props.error) {
                        currentEquation = eq;
                        viewBounds = engine.getViewBounds(3);
                        updateEquationDisplay();
                        updatePropertiesPanel();
                        render();
                    }
                } catch (e) {
                    console.error('Invalid equation:', e);
                }
            }
        });
    }

    // Controls
    const showGridCheck = document.getElementById('showGrid');
    const showLabelsCheck = document.getElementById('showLabels');
    const showLatusCheck = document.getElementById('showLatus');

    if (showGridCheck) {
        showGridCheck.addEventListener('change', () => {
            showGrid = showGridCheck.checked;
            render();
        });
    }

    if (showLabelsCheck) {
        showLabelsCheck.addEventListener('change', () => {
            showLabels = showLabelsCheck.checked;
            render();
        });
    }

    if (showLatusCheck) {
        showLatusCheck.addEventListener('change', () => {
            showLatusRectum = showLatusCheck.checked;
            render();
        });
    }

    // Preset selector in app
    const presetSelect = document.getElementById('presetSelect');
    if (presetSelect) {
        PARABOLA_PRESETS.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.equation;
            option.textContent = preset.name;
            presetSelect.appendChild(option);
        });

        presetSelect.addEventListener('change', () => {
            if (presetSelect.value) {
                loadEquation(presetSelect.value);
            }
        });
    }

    // Canvas interactions
    if (canvas) {
        canvas.addEventListener('wheel', handleWheel);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        window.addEventListener('resize', () => {
            resizeCanvas();
            render();
        });
    }

    // Fullscreen
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const vizPanel = document.querySelector('.visualization-panel');
    if (fullscreenBtn && vizPanel) {
        fullscreenBtn.addEventListener('click', () => {
            vizPanel.classList.toggle('fullscreen');
            resizeCanvas();
            render();
        });
    }

    // Reset view
    const resetViewBtn = document.getElementById('resetView');
    if (resetViewBtn) {
        resetViewBtn.addEventListener('click', () => {
            viewBounds = engine.getViewBounds(3);
            zoom = 1;
            render();
        });
    }
}

// ============================================
// Canvas Rendering
// ============================================

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
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    if (showGrid) {
        drawGrid(width, height);
    }

    // Draw axes
    drawAxes(width, height);

    // Get properties
    const props = engine.properties;
    if (!props) return;

    // Draw geometric elements
    drawDirectrix(width, height, props);
    drawAxisOfSymmetry(width, height, props);
    if (showLatusRectum) {
        drawLatusRectum(width, height, props);
    }

    // Draw parabola
    drawParabola(width, height);

    // Draw key points
    drawVertex(width, height, props);
    drawFocus(width, height, props);
    drawIntercepts(width, height, props);

    // Draw labels
    if (showLabels) {
        drawLabels(width, height, props);
    }
}

function toCanvasX(x, width) {
    return ((x - viewBounds.minX) / (viewBounds.maxX - viewBounds.minX)) * width;
}

function toCanvasY(y, height) {
    return height - ((y - viewBounds.minY) / (viewBounds.maxY - viewBounds.minY)) * height;
}

function toMathX(canvasX, width) {
    return viewBounds.minX + (canvasX / width) * (viewBounds.maxX - viewBounds.minX);
}

function toMathY(canvasY, height) {
    return viewBounds.maxY - (canvasY / height) * (viewBounds.maxY - viewBounds.minY);
}

function drawGrid(width, height) {
    const rangeX = viewBounds.maxX - viewBounds.minX;
    const rangeY = viewBounds.maxY - viewBounds.minY;

    // Determine grid step
    const gridStep = getGridStep(Math.max(rangeX, rangeY));

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Vertical lines
    const startX = Math.floor(viewBounds.minX / gridStep) * gridStep;
    for (let x = startX; x <= viewBounds.maxX; x += gridStep) {
        const cx = toCanvasX(x, width);
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, height);
        ctx.stroke();
    }

    // Horizontal lines
    const startY = Math.floor(viewBounds.minY / gridStep) * gridStep;
    for (let y = startY; y <= viewBounds.maxY; y += gridStep) {
        const cy = toCanvasY(y, height);
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(width, cy);
        ctx.stroke();
    }
}

function getGridStep(range) {
    const idealSteps = 10;
    const rough = range / idealSteps;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const normalized = rough / mag;

    if (normalized < 1.5) return mag;
    if (normalized < 3) return 2 * mag;
    if (normalized < 7) return 5 * mag;
    return 10 * mag;
}

function drawAxes(width, height) {
    const originX = toCanvasX(0, width);
    const originY = toCanvasY(0, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;

    // X axis
    if (originY >= 0 && originY <= height) {
        ctx.beginPath();
        ctx.moveTo(0, originY);
        ctx.lineTo(width, originY);
        ctx.stroke();
    }

    // Y axis
    if (originX >= 0 && originX <= width) {
        ctx.beginPath();
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, height);
        ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px Inter';

    const rangeX = viewBounds.maxX - viewBounds.minX;
    const gridStep = getGridStep(rangeX);

    // X axis labels
    const startX = Math.floor(viewBounds.minX / gridStep) * gridStep;
    for (let x = startX; x <= viewBounds.maxX; x += gridStep) {
        if (Math.abs(x) > 0.01) {
            const cx = toCanvasX(x, width);
            ctx.fillText(formatNum(x), cx - 10, originY + 15);
        }
    }

    // Y axis labels
    const startY = Math.floor(viewBounds.minY / gridStep) * gridStep;
    for (let y = startY; y <= viewBounds.maxY; y += gridStep) {
        if (Math.abs(y) > 0.01) {
            const cy = toCanvasY(y, height);
            ctx.fillText(formatNum(y), originX + 5, cy + 4);
        }
    }
}

function drawParabola(width, height) {
    const points = engine.generatePlotPoints(viewBounds.minX - 2, viewBounds.maxX + 2, 400);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let started = false;
    for (const p of points) {
        const cx = toCanvasX(p.x, width);
        const cy = toCanvasY(p.y, height);

        // Skip points far outside view
        if (cy < -1000 || cy > height + 1000) {
            started = false;
            continue;
        }

        if (!started) {
            ctx.moveTo(cx, cy);
            started = true;
        } else {
            ctx.lineTo(cx, cy);
        }
    }

    ctx.stroke();

    // Glow effect
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.lineWidth = 6;
    ctx.stroke();
}

function drawVertex(width, height, props) {
    const cx = toCanvasX(props.vertex.x, width);
    const cy = toCanvasY(props.vertex.y, height);

    // Outer glow
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.fill();

    // Main point
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1';
    ctx.fill();

    // Inner dot
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
}

function drawFocus(width, height, props) {
    const cx = toCanvasX(props.focus.x, width);
    const cy = toCanvasY(props.focus.y, height);

    // Outer glow
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.fill();

    // Main point
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
}

function drawDirectrix(width, height, props) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);

    if (props.directrix.type === 'horizontal') {
        const cy = toCanvasY(props.directrix.value, height);
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(width, cy);
        ctx.stroke();
    } else {
        const cx = toCanvasX(props.directrix.value, width);
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, height);
        ctx.stroke();
    }

    ctx.setLineDash([]);
}

function drawAxisOfSymmetry(width, height, props) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    if (props.axisOfSymmetry.type === 'vertical') {
        const cx = toCanvasX(props.axisOfSymmetry.value, width);
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, height);
        ctx.stroke();
    } else {
        const cy = toCanvasY(props.axisOfSymmetry.value, height);
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(width, cy);
        ctx.stroke();
    }

    ctx.setLineDash([]);
}

function drawLatusRectum(width, height, props) {
    const [p1, p2] = props.latusRectumEndpoints;
    const cx1 = toCanvasX(p1.x, width);
    const cy1 = toCanvasY(p1.y, height);
    const cx2 = toCanvasX(p2.x, width);
    const cy2 = toCanvasY(p2.y, height);

    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx1, cy1);
    ctx.lineTo(cx2, cy2);
    ctx.stroke();

    // End points
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(cx1, cy1, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx2, cy2, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawIntercepts(width, height, props) {
    ctx.fillStyle = '#06b6d4';

    // X-intercepts
    for (const p of props.xIntercepts) {
        const cx = toCanvasX(p.x, width);
        const cy = toCanvasY(p.y, height);
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Y-intercept
    if (Array.isArray(props.yIntercept)) {
        for (const p of props.yIntercept) {
            const cx = toCanvasX(p.x, width);
            const cy = toCanvasY(p.y, height);
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (props.yIntercept) {
        const cx = toCanvasX(props.yIntercept.x, width);
        const cy = toCanvasY(props.yIntercept.y, height);
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawLabels(width, height, props) {
    ctx.font = '11px Inter';

    // Vertex label
    const vx = toCanvasX(props.vertex.x, width);
    const vy = toCanvasY(props.vertex.y, height);
    ctx.fillStyle = '#6366f1';
    ctx.fillText('Vertex', vx + 10, vy - 10);

    // Focus label
    const fx = toCanvasX(props.focus.x, width);
    const fy = toCanvasY(props.focus.y, height);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('Focus', fx + 10, fy - 8);

    // Directrix label
    ctx.fillStyle = '#ef4444';
    if (props.directrix.type === 'horizontal') {
        ctx.fillText('Directrix', 10, toCanvasY(props.directrix.value, height) - 6);
    } else {
        ctx.save();
        ctx.translate(toCanvasX(props.directrix.value, width) - 6, 60);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Directrix', 0, 0);
        ctx.restore();
    }
}

// ============================================
// Mouse Interactions
// ============================================

function handleWheel(e) {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const mathX = toMathX(mouseX, canvas.clientWidth);
    const mathY = toMathY(mouseY, canvas.clientHeight);

    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;

    // Zoom around mouse position
    viewBounds.minX = mathX - (mathX - viewBounds.minX) * zoomFactor;
    viewBounds.maxX = mathX + (viewBounds.maxX - mathX) * zoomFactor;
    viewBounds.minY = mathY - (mathY - viewBounds.minY) * zoomFactor;
    viewBounds.maxY = mathY + (viewBounds.maxY - mathY) * zoomFactor;

    render();
}

function handleMouseDown(e) {
    isDragging = true;
    lastMousePos = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Update coordinate display
    const coordDisplay = document.getElementById('coordDisplay');
    if (coordDisplay) {
        const mx = toMathX(mouseX, canvas.clientWidth);
        const my = toMathY(mouseY, canvas.clientHeight);
        coordDisplay.textContent = `(${formatNum(mx)}, ${formatNum(my)})`;
    }

    if (isDragging) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;

        const scaleX = (viewBounds.maxX - viewBounds.minX) / canvas.clientWidth;
        const scaleY = (viewBounds.maxY - viewBounds.minY) / canvas.clientHeight;

        viewBounds.minX -= dx * scaleX;
        viewBounds.maxX -= dx * scaleX;
        viewBounds.minY += dy * scaleY;
        viewBounds.maxY += dy * scaleY;

        lastMousePos = { x: e.clientX, y: e.clientY };
        render();
    } else {
        // Check for hover on key points
        checkHover(mouseX, mouseY);
    }
}

function handleMouseUp() {
    isDragging = false;
    canvas.style.cursor = 'crosshair';
}

function handleMouseLeave() {
    isDragging = false;
    canvas.style.cursor = 'crosshair';
    tooltip.classList.add('hidden');
}

function checkHover(mouseX, mouseY) {
    const props = engine.properties;
    if (!props) return;

    const points = [
        { point: props.vertex, name: 'Vertex', color: '#6366f1' },
        { point: props.focus, name: 'Focus', color: '#f59e0b' }
    ];

    for (const { point, name, color } of points) {
        const cx = toCanvasX(point.x, canvas.clientWidth);
        const cy = toCanvasY(point.y, canvas.clientHeight);
        const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);

        if (dist < 15) {
            showTooltip(mouseX, mouseY, name, point, color);
            return;
        }
    }

    tooltip.classList.add('hidden');
}

function showTooltip(x, y, name, point, color) {
    tooltip.innerHTML = `
        <div class="tooltip-title" style="color: ${color}">${name}</div>
        <div class="tooltip-coord">(${formatNum(point.x)}, ${formatNum(point.y)})</div>
    `;

    const rect = canvas.getBoundingClientRect();
    tooltip.style.left = (rect.left + x + 15) + 'px';
    tooltip.style.top = (rect.top + y - 10) + 'px';
    tooltip.classList.remove('hidden');
}

// ============================================
// UI Updates
// ============================================

function updateEquationDisplay() {
    const displayEl = document.getElementById('equationDisplay');
    const editInput = document.getElementById('editEquation');

    if (displayEl) displayEl.textContent = currentEquation;
    if (editInput) editInput.value = currentEquation;
}

function updatePropertiesPanel() {
    const props = engine.properties;
    if (!props) return;

    // Update stats bar
    setElementText('statVertex', `(${formatNum(props.vertex.x)}, ${formatNum(props.vertex.y)})`);
    setElementText('statFocus', `(${formatNum(props.focus.x)}, ${formatNum(props.focus.y)})`);
    setElementText('statP', formatNum(props.parameter));
    setElementText('statLatus', formatNum(props.latusRectumLength));

    // Update properties panel
    setElementText('propVertex', `(${formatNum(props.vertex.x)}, ${formatNum(props.vertex.y)})`);
    setElementText('propFocus', `(${formatNum(props.focus.x)}, ${formatNum(props.focus.y)})`);
    setElementText('propDirectrix', props.directrix.equation);
    setElementText('propAxis', props.axisOfSymmetry.equation);
    setElementText('propP', formatNum(props.parameter));
    setElementText('propLatus', formatNum(props.latusRectumLength));
    setElementText('propEccentricity', '1');

    // Direction
    const directionEl = document.getElementById('propDirection');
    if (directionEl) {
        const arrows = { up: '↑', down: '↓', left: '←', right: '→' };
        directionEl.innerHTML = `
            <span class="direction-arrow">${arrows[props.direction]}</span>
            Opens ${props.direction}
        `;
    }

    // Intercepts
    const xInterceptsEl = document.getElementById('propXIntercepts');
    if (xInterceptsEl) {
        if (props.xIntercepts.length === 0) {
            xInterceptsEl.innerHTML = '<span class="muted">None (no real roots)</span>';
        } else {
            xInterceptsEl.innerHTML = props.xIntercepts.map(p =>
                `<span class="intercept-point">(${formatNum(p.x)}, 0)</span>`
            ).join('');
        }
    }

    const yInterceptEl = document.getElementById('propYIntercept');
    if (yInterceptEl) {
        if (Array.isArray(props.yIntercept)) {
            if (props.yIntercept.length === 0) {
                yInterceptEl.innerHTML = '<span class="muted">None</span>';
            } else {
                yInterceptEl.innerHTML = props.yIntercept.map(p =>
                    `<span class="intercept-point">(0, ${formatNum(p.y)})</span>`
                ).join('');
            }
        } else if (props.yIntercept) {
            yInterceptEl.innerHTML = `<span class="intercept-point">(0, ${formatNum(props.yIntercept.y)})</span>`;
        }
    }

    // Equations
    setElementText('propVertexForm', props.vertexForm);
    setElementText('propStandardForm', props.standardForm);
    setElementText('propGeneralForm', props.generalForm);
}

function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function formatNum(n) {
    if (Number.isInteger(n)) return n.toString();
    if (Math.abs(n) < 0.0001) return '0';
    return n.toFixed(3).replace(/\.?0+$/, '');
}

// ============================================
// Start
// ============================================

document.addEventListener('DOMContentLoaded', init);
