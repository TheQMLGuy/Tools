// Initialize Math.js
const parser = math.parser();

// State
let currentMode = '2d';

// DOM Elements
const modeBtns = document.querySelectorAll('.mode-btn');
const modeControls = {
    '2d': document.getElementById('controls-2d'),
    '3d': document.getElementById('controls-3d'),
    'complex': document.getElementById('controls-complex')
};
const plotContainer = document.getElementById('plot-container');

// 2D Inputs
const functionInput = document.getElementById('function-input');
const xMinInput = document.getElementById('x-min');
const xMaxInput = document.getElementById('x-max');
const showDerivativeToggle = document.getElementById('show-derivative');
const showIntegralToggle = document.getElementById('show-integral');
const showIndefIntegralToggle = document.getElementById('show-indefinite-integral');
const showTaylorToggle = document.getElementById('show-taylor');

const integralControls = document.getElementById('integral-controls');
const intMinInput = document.getElementById('int-min');
const intMaxInput = document.getElementById('int-max');
const areaResult = document.getElementById('area-result');

const taylorControls = document.getElementById('taylor-controls');
const taylorCenterInput = document.getElementById('taylor-center');
const taylorOrderInput = document.getElementById('taylor-order');
const taylorOrderVal = document.getElementById('taylor-order-val');
const taylorPolynomialDisplay = document.getElementById('taylor-polynomial');

// 3D Inputs
const function3dInput = document.getElementById('function-3d');
const x3dMinInput = document.getElementById('x3d-min');
const x3dMaxInput = document.getElementById('x3d-max');
const y3dMinInput = document.getElementById('y3d-min');
const y3dMaxInput = document.getElementById('y3d-max');

// Complex Inputs
const functionComplexInput = document.getElementById('function-complex');
const creMinInput = document.getElementById('cre-min');
const creMaxInput = document.getElementById('cre-max');
const cimMinInput = document.getElementById('cim-min');
const cimMaxInput = document.getElementById('cim-max');


// Event Listeners
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Switch UI
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentMode = btn.dataset.mode;

        Object.values(modeControls).forEach(el => el.classList.add('hidden'));
        modeControls[currentMode].classList.remove('hidden');

        updatePlot();
    });
});

// 2D Events
functionInput.addEventListener('input', updatePlot);
xMinInput.addEventListener('input', updatePlot);
xMaxInput.addEventListener('input', updatePlot);

showDerivativeToggle.addEventListener('change', updatePlot);
showIntegralToggle.addEventListener('change', () => {
    toggleVisibility(integralControls, showIntegralToggle.checked);
    updatePlot();
});
showIndefIntegralToggle.addEventListener('change', updatePlot);
showTaylorToggle.addEventListener('change', () => {
    toggleVisibility(taylorControls, showTaylorToggle.checked);
    updatePlot();
});

intMinInput.addEventListener('input', updatePlot);
intMaxInput.addEventListener('input', updatePlot);
taylorCenterInput.addEventListener('input', updatePlot);
taylorOrderInput.addEventListener('input', (e) => {
    taylorOrderVal.textContent = e.target.value;
    updatePlot();
});

// 3D Events
function3dInput.addEventListener('input', updatePlot);
x3dMinInput.addEventListener('input', updatePlot);
x3dMaxInput.addEventListener('input', updatePlot);
y3dMinInput.addEventListener('input', updatePlot);
y3dMaxInput.addEventListener('input', updatePlot);

// Complex Events
functionComplexInput.addEventListener('input', updatePlot);
creMinInput.addEventListener('input', updatePlot);
creMaxInput.addEventListener('input', updatePlot);
cimMinInput.addEventListener('input', updatePlot);
cimMaxInput.addEventListener('input', updatePlot);


// Helper: Toggle Visibility
function toggleVisibility(element, isVisible) {
    if (isVisible) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

// Helper: Format number as fraction if possible
function formatAsFraction(num) {
    // Handle near-zero
    if (Math.abs(num) < 1e-10) return '0';

    // Try to convert to fraction
    try {
        const frac = math.fraction(num);
        const n = frac.n * frac.s; // numerator with sign
        const d = frac.d; // denominator

        // If denominator is too large, use decimal instead
        if (d > 1000) {
            return num.toFixed(4).replace(/\.?0+$/, '');
        }

        if (d === 1) {
            return n.toString();
        } else {
            return `${n}/${d}`;
        }
    } catch (e) {
        // Fallback to decimal
        return num.toFixed(4).replace(/\.?0+$/, '');
    }
}

// Main Update Logic
function updatePlot() {
    if (currentMode === '2d') {
        plot2D();
    } else if (currentMode === '3d') {
        plot3D();
    } else if (currentMode === 'complex') {
        plotComplex();
    }
}

function plot2D() {
    const expression = functionInput.value;
    const xMin = parseFloat(xMinInput.value);
    const xMax = parseFloat(xMaxInput.value);

    if (!expression || isNaN(xMin) || isNaN(xMax) || xMin >= xMax) return;

    try {
        const compiledFunc = math.compile(expression);
        const step = (xMax - xMin) / 500;
        const xValues = math.range(xMin, xMax, step).toArray();
        const data = [];

        // 1. Original Function
        const yValues = xValues.map(x => {
            try { return compiledFunc.evaluate({ x: x }); } catch (e) { return null; }
        });

        data.push({
            x: xValues,
            y: yValues,
            name: 'f(x)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#58a6ff', width: 3 }
        });

        // 2. Derivative
        if (showDerivativeToggle.checked) {
            try {
                const derivative = math.derivative(expression, 'x');
                const compiledDerivative = derivative.compile();
                const yDerivative = xValues.map(x => compiledDerivative.evaluate({ x: x }));

                data.push({
                    x: xValues,
                    y: yDerivative,
                    name: "f'(x)",
                    type: 'scatter',
                    mode: 'lines',
                    line: { color: '#d2a8ff', width: 2, dash: 'dash' }
                });
            } catch (e) { console.error("Derivative error", e); }
        }

        // 3. Indefinite Integral Curve (Cumulative Sum)
        if (showIndefIntegralToggle.checked) {
            // Approx: F(x) = sum(y * dx)
            let cumSum = 0;
            const yIntegral = [];
            // Assuming start from 0 or xMin. Let's start integral from 0 if in range, else xMin.
            // Actually simple cumulative sum trace is best for visualizing shape.
            // We'll reset integral to 0 at x=0 if possible for nicer alignment, or just accumulated from xMin.

            // accumulate from start
            for (let i = 0; i < yValues.length; i++) {
                const y = yValues[i] || 0;
                cumSum += y * step;
                yIntegral.push(cumSum);
            }

            // Optional: Shift so F(0) = 0 if 0 is in range?
            // Let's keep it simple: accumulated from left edge.

            data.push({
                x: xValues,
                y: yIntegral,
                name: 'F(x) Indefinite',
                type: 'scatter',
                mode: 'lines',
                line: { color: '#238636', width: 2, dash: 'dot' }
            });
        }

        // 4. Definite Integral Area
        if (showIntegralToggle.checked) {
            const intMin = parseFloat(intMinInput.value);
            const intMax = parseFloat(intMaxInput.value);
            if (!isNaN(intMin) && !isNaN(intMax) && intMin < intMax) {
                const xArea = xValues.filter(x => x >= intMin && x <= intMax);
                const yArea = xArea.map(x => compiledFunc.evaluate({ x: x }));
                const xFill = [intMin, ...xArea, intMax];
                const yFill = [0, ...yArea, 0];

                data.push({
                    x: xFill,
                    y: yFill,
                    name: 'Area',
                    type: 'scatter',
                    fill: 'tozeroy',
                    mode: 'none',
                    fillcolor: 'rgba(35, 134, 54, 0.3)',
                    hoverinfo: 'skip'
                });

                // Calc area numerical
                let area = 0;
                const n = 200;
                const d = (intMax - intMin) / n;
                for (let i = 0; i < n; i++) {
                    const x1 = intMin + i * d;
                    const x2 = intMin + (i + 1) * d;
                    const y1 = compiledFunc.evaluate({ x: x1 });
                    const y2 = compiledFunc.evaluate({ x: x2 });
                    area += (y1 + y2) * d / 2;
                }
                areaResult.textContent = area.toFixed(4);
            }
        }

        // 5. Taylor
        if (showTaylorToggle.checked) {
            const center = parseFloat(taylorCenterInput.value);
            const order = parseInt(taylorOrderInput.value);
            if (!isNaN(center)) {
                let currentDeriv = math.parse(expression);
                let terms = [];
                let displayTerms = []; // Human-readable
                for (let i = 0; i <= order; i++) {
                    const compiledDeriv = currentDeriv.compile();
                    const coeffVal = compiledDeriv.evaluate({ x: center });
                    const factorial = math.factorial(i);
                    const coeff = coeffVal / factorial;
                    if (Math.abs(coeff) > 1e-10) {
                        let term = `(${coeff})`;
                        if (i > 0) term += ` * (x - (${center}))^${i}`;
                        terms.push(term);

                        // Build readable term with fractions
                        let displayCoeff = formatAsFraction(coeff);
                        let displayTerm = '';
                        if (i === 0) {
                            displayTerm = displayCoeff;
                        } else if (center === 0) {
                            if (displayCoeff === '1') {
                                displayTerm = 'x';
                            } else if (displayCoeff === '-1') {
                                displayTerm = '-x';
                            } else {
                                displayTerm = `(${displayCoeff})x`;
                            }
                            if (i > 1) displayTerm += `^${i}`;
                        } else {
                            if (displayCoeff === '1') {
                                displayTerm = `(x - ${center})`;
                            } else if (displayCoeff === '-1') {
                                displayTerm = `-(x - ${center})`;
                            } else {
                                displayTerm = `(${displayCoeff})(x - ${center})`;
                            }
                            if (i > 1) displayTerm += `^${i}`;
                        }
                        displayTerms.push(displayTerm);
                    }
                    currentDeriv = math.derivative(currentDeriv, 'x');
                }
                const taylorString = terms.join(' + ') || '0';
                const compiledTaylor = math.compile(taylorString);
                const yTaylor = xValues.map(x => compiledTaylor.evaluate({ x: x }));

                data.push({
                    x: xValues,
                    y: yTaylor,
                    name: `Taylor (n=${order})`,
                    type: 'scatter',
                    mode: 'lines',
                    line: { color: '#fddf68', width: 2 }
                });

                // Display polynomial
                taylorPolynomialDisplay.textContent = 'P(x) = ' + (displayTerms.join(' + ') || '0');
            }
        } else {
            taylorPolynomialDisplay.textContent = 'P(x) = ...';
        }

        const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            xaxis: { color: '#8b949e', gridcolor: 'rgba(48, 54, 61, 0.5)' },
            yaxis: { color: '#8b949e', gridcolor: 'rgba(48, 54, 61, 0.5)' },
            legend: { font: { color: '#c9d1d9' }, bgcolor: 'rgba(22, 27, 34, 0.9)' },
            margin: { t: 20, r: 20, b: 40, l: 40 },
            dragmode: 'pan' // Default to pan for easier navigation
        };
        const config = {
            scrollZoom: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d', 'sendDataToCloud'],
            displaylogo: false,
            responsive: true
        };
        Plotly.newPlot(plotContainer, data, layout, config);
    } catch (e) { console.warn(e); }
}

function plot3D() {
    const expression = function3dInput.value;
    const xMin = parseFloat(x3dMinInput.value);
    const xMax = parseFloat(x3dMaxInput.value);
    const yMin = parseFloat(y3dMinInput.value);
    const yMax = parseFloat(y3dMaxInput.value);

    try {
        const compiledFunc = math.compile(expression);

        // Create easier grid
        const steps = 40;
        const xStep = (xMax - xMin) / steps;
        const yStep = (yMax - yMin) / steps;

        const xValues = [];
        const yValues = [];
        const zValues = [];

        for (let y = yMin; y <= yMax; y += yStep) {
            const zRow = [];
            const yRow = [];
            const xRow = [];
            for (let x = xMin; x <= xMax; x += xStep) {
                xRow.push(x);
                yRow.push(y);
                let zVal = 0;
                try {
                    zVal = compiledFunc.evaluate({ x: x, y: y });
                } catch (e) { zVal = null; }
                zRow.push(zVal);
            }
            xValues.push(xRow); // Creating 2D arrays for surface
            yValues.push(yRow);
            zValues.push(zRow);
        }

        const data = [{
            type: 'surface',
            z: zValues,
            x: xValues[0], // 1D array is sufficient for simple grids usually, but 2D is safe
            y: yValues.map(row => row[0]), // Extracts Y axis
            colorscale: 'Viridis',
            contours: {
                z: { show: true, usecolormap: true, highlightcolor: "#42f462", project: { z: true } }
            }
        }];

        const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            scene: {
                xaxis: { title: 'x', color: '#8b949e' },
                yaxis: { title: 'y', color: '#8b949e' },
                zaxis: { title: 'z', color: '#8b949e' },
            },
            margin: { t: 0, r: 0, b: 0, l: 0 }
        };

        Plotly.newPlot(plotContainer, data, layout, { scrollZoom: true, displayModeBar: true, displaylogo: false });

    } catch (e) { console.warn("3D Error", e); }
}

function plotComplex() {
    const expression = functionComplexInput.value;
    const rMin = parseFloat(creMinInput.value);
    const rMax = parseFloat(creMaxInput.value);
    const iMin = parseFloat(cimMinInput.value);
    const iMax = parseFloat(cimMaxInput.value);

    try {
        const compiledFunc = math.compile(expression);
        const steps = 40;
        const rStep = (rMax - rMin) / steps;
        const iStep = (iMax - iMin) / steps;

        const xValues = []; // Re
        const yValues = []; // Im
        const zValues = []; // Magnitude
        const cValues = []; // Phase (argument)

        for (let im = iMin; im <= iMax; im += iStep) {
            const zRow = [];
            const cRow = [];
            for (let re = rMin; re <= rMax; re += rStep) {
                const z = math.complex(re, im);
                let w;
                try {
                    w = compiledFunc.evaluate({ z: z });
                } catch (e) { w = math.complex(0, 0); }

                // z is height = magnitude
                let mag = 0;
                let phase = 0;
                if (w && w.re !== undefined) {
                    mag = math.abs(w);
                    phase = math.arg(w); // -pi to pi
                }
                // Clamp mag to avoid spikes
                if (mag > 10) mag = 10;

                zRow.push(mag);
                cRow.push(phase);
            }
            zValues.push(zRow);
            cValues.push(cRow);
            yValues.push(im);
        }

        // x axis array
        for (let re = rMin; re <= rMax; re += rStep) xValues.push(re);

        const data = [{
            type: 'surface',
            z: zValues,
            x: xValues,
            y: yValues,
            surfacecolor: cValues,
            colorscale: 'Jet', // Good for phase cyclic
            colorbar: { title: 'Phase (rad)' }
        }];

        const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            title: { text: '|f(z)| (Height) & arg(f(z)) (Color)', font: { color: '#8b949e' } },
            scene: {
                xaxis: { title: 'Re', color: '#8b949e' },
                yaxis: { title: 'Im', color: '#8b949e' },
                zaxis: { title: '|f(z)|', color: '#8b949e' },
            },
            margin: { t: 30, r: 0, b: 0, l: 0 }
        };

        Plotly.newPlot(plotContainer, data, layout, { scrollZoom: true, displayModeBar: true, displaylogo: false });

    } catch (e) { console.warn("Complex Error", e); }
}

// Initial Plot
updatePlot();
window.addEventListener('resize', () => {
    Plotly.Plots.resize(plotContainer);
});
