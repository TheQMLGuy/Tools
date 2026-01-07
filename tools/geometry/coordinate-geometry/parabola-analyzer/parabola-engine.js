/**
 * Parabola Engine - Coordinate Geometry Calculations
 * Computes all properties of a parabola from quadratic equations
 */

class ParabolaEngine {
    constructor() {
        this.reset();
    }

    reset() {
        // Standard form: y = ax² + bx + c (vertical) or x = ay² + by + c (horizontal)
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.orientation = 'vertical'; // 'vertical' or 'horizontal'
        this.properties = null;
    }

    /**
     * Parse equation string into coefficients
     * Supports: y = ax² + bx + c, y = ax^2 + bx + c, x = ay² + by + c
     */
    parseEquation(equation) {
        // Clean the equation
        let eq = equation.replace(/\s+/g, '').toLowerCase();

        // Determine orientation
        if (eq.startsWith('x=')) {
            this.orientation = 'horizontal';
            eq = eq.substring(2);
            return this._parseQuadraticExpression(eq, 'y');
        } else if (eq.startsWith('y=')) {
            this.orientation = 'vertical';
            eq = eq.substring(2);
            return this._parseQuadraticExpression(eq, 'x');
        } else {
            // Assume vertical: y = ...
            this.orientation = 'vertical';
            return this._parseQuadraticExpression(eq, 'x');
        }
    }

    _parseQuadraticExpression(expr, variable) {
        // Handle patterns: ax², ax^2, x², x^2, etc.
        let a = 0, b = 0, c = 0;

        // Normalize power notation: x² -> x^2, y² -> y^2
        expr = expr.replace(/²/g, '^2');

        // Match coefficient for squared term: ax^2
        const sqPattern = new RegExp(`([+-]?[\\d.]*(?:\\/[\\d.]+)?)?${variable}\\^2`, 'g');
        const sqMatch = expr.match(sqPattern);
        if (sqMatch) {
            for (const match of sqMatch) {
                const coef = match.replace(new RegExp(`${variable}\\^2`, 'g'), '');
                a += this._parseCoefficient(coef);
            }
        }

        // Match coefficient for linear term: bx (not followed by ^2)
        // First remove squared terms to avoid confusion
        let linearExpr = expr.replace(sqPattern, '');
        const linPattern = new RegExp(`([+-]?[\\d.]*(?:\\/[\\d.]+)?)?${variable}(?![\\^])`, 'g');
        const linMatch = linearExpr.match(linPattern);
        if (linMatch) {
            for (const match of linMatch) {
                const coef = match.replace(new RegExp(variable, 'g'), '');
                b += this._parseCoefficient(coef);
            }
        }

        // Match constant term
        // Remove variable terms and parse remaining numbers
        let constExpr = linearExpr.replace(linPattern, '');
        const constMatch = constExpr.match(/[+-]?[\d.]+(?:\/[\d.]+)?/g);
        if (constMatch) {
            for (const match of constMatch) {
                c += this._parseCoefficient(match);
            }
        }

        this.a = a !== 0 ? a : 1; // Default to 1 if no squared term coefficient
        this.b = b;
        this.c = c;

        return { a: this.a, b: this.b, c: this.c };
    }

    _parseCoefficient(str) {
        if (!str || str === '' || str === '+') return 1;
        if (str === '-') return -1;

        // Handle fractions
        if (str.includes('/')) {
            const [num, den] = str.split('/');
            return parseFloat(num) / parseFloat(den);
        }

        return parseFloat(str);
    }

    /**
     * Set coefficients directly
     */
    setCoefficients(a, b, c, orientation = 'vertical') {
        this.a = a;
        this.b = b;
        this.c = c;
        this.orientation = orientation;
    }

    /**
     * Calculate all parabola properties
     */
    calculate() {
        const { a, b, c, orientation } = this;

        if (a === 0) {
            return { error: 'Not a parabola (a = 0)' };
        }

        // Vertex: (h, k) where h = -b/(2a), k = c - b²/(4a)
        const h = -b / (2 * a);
        const k = c - (b * b) / (4 * a);

        // Parameter p (distance from vertex to focus)
        // For y = ax², we have (x-h)² = (1/a)(y-k), so 4p = 1/a, p = 1/(4a)
        const p = 1 / (4 * a);

        // Direction
        let direction;
        if (orientation === 'vertical') {
            direction = a > 0 ? 'up' : 'down';
        } else {
            direction = a > 0 ? 'right' : 'left';
        }

        // Focus
        let focus;
        if (orientation === 'vertical') {
            focus = { x: h, y: k + p };
        } else {
            focus = { x: h + p, y: k };
        }

        // Directrix
        let directrix;
        if (orientation === 'vertical') {
            directrix = { type: 'horizontal', value: k - p, equation: `y = ${this._formatNumber(k - p)}` };
        } else {
            directrix = { type: 'vertical', value: h - p, equation: `x = ${this._formatNumber(h - p)}` };
        }

        // Axis of symmetry
        let axisOfSymmetry;
        if (orientation === 'vertical') {
            axisOfSymmetry = { type: 'vertical', value: h, equation: `x = ${this._formatNumber(h)}` };
        } else {
            axisOfSymmetry = { type: 'horizontal', value: k, equation: `y = ${this._formatNumber(k)}` };
        }

        // Latus rectum length = |4p| = |1/a|
        const latusRectumLength = Math.abs(4 * p);

        // Latus rectum endpoints
        let latusRectumEndpoints;
        if (orientation === 'vertical') {
            latusRectumEndpoints = [
                { x: focus.x - latusRectumLength / 2, y: focus.y },
                { x: focus.x + latusRectumLength / 2, y: focus.y }
            ];
        } else {
            latusRectumEndpoints = [
                { x: focus.x, y: focus.y - latusRectumLength / 2 },
                { x: focus.x, y: focus.y + latusRectumLength / 2 }
            ];
        }

        // X-intercepts (for vertical parabola)
        let xIntercepts = [];
        if (orientation === 'vertical') {
            const discriminant = b * b - 4 * a * c;
            if (discriminant > 0) {
                xIntercepts = [
                    { x: (-b + Math.sqrt(discriminant)) / (2 * a), y: 0 },
                    { x: (-b - Math.sqrt(discriminant)) / (2 * a), y: 0 }
                ];
            } else if (discriminant === 0) {
                xIntercepts = [{ x: -b / (2 * a), y: 0 }];
            }
        } else {
            // For horizontal parabola, x-intercept at y=0
            xIntercepts = [{ x: c, y: 0 }];
        }

        // Y-intercept
        let yIntercept;
        if (orientation === 'vertical') {
            yIntercept = { x: 0, y: c };
        } else {
            // For horizontal parabola: x = ay² + by + c at x=0
            const discriminant = b * b - 4 * a * (-c);
            if (discriminant >= 0) {
                const y1 = (-b + Math.sqrt(discriminant)) / (2 * a);
                const y2 = (-b - Math.sqrt(discriminant)) / (2 * a);
                yIntercept = discriminant === 0 ? [{ x: 0, y: y1 }] : [{ x: 0, y: y1 }, { x: 0, y: y2 }];
            } else {
                yIntercept = [];
            }
        }

        // Standard form equations
        let vertexForm, standardForm;
        if (orientation === 'vertical') {
            vertexForm = `y = ${this._formatCoef(a)}(x ${this._formatOffset(-h)})² ${this._formatOffset(k)}`;
            standardForm = `(x ${this._formatOffset(-h)})² = ${this._formatNumber(4 * p)}(y ${this._formatOffset(-k)})`;
        } else {
            vertexForm = `x = ${this._formatCoef(a)}(y ${this._formatOffset(-k)})² ${this._formatOffset(h)}`;
            standardForm = `(y ${this._formatOffset(-k)})² = ${this._formatNumber(4 * p)}(x ${this._formatOffset(-h)})`;
        }

        // Eccentricity (always 1 for parabola)
        const eccentricity = 1;

        this.properties = {
            // Input coefficients
            a, b, c,
            orientation,

            // Core properties
            vertex: { x: h, y: k },
            focus,
            directrix,
            axisOfSymmetry,
            parameter: p,
            direction,

            // Latus rectum
            latusRectumLength,
            latusRectumEndpoints,

            // Intercepts
            xIntercepts,
            yIntercept,

            // Equations
            generalForm: this._formatGeneralForm(),
            vertexForm,
            standardForm,

            // Other
            eccentricity,
            concavity: a > 0 ? 'concave up' : 'concave down'
        };

        return this.properties;
    }

    _formatNumber(num) {
        if (Number.isInteger(num)) return num.toString();
        // Check for nice fractions
        const fracs = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [1, 8], [3, 8], [5, 8], [7, 8]];
        for (const [n, d] of fracs) {
            if (Math.abs(num - n / d) < 0.0001) return `${n}/${d}`;
            if (Math.abs(num + n / d) < 0.0001) return `-${n}/${d}`;
        }
        return num.toFixed(4).replace(/\.?0+$/, '');
    }

    _formatCoef(num) {
        if (num === 1) return '';
        if (num === -1) return '-';
        return this._formatNumber(num);
    }

    _formatOffset(num) {
        if (num === 0) return '';
        if (num > 0) return `+ ${this._formatNumber(num)}`;
        return `- ${this._formatNumber(Math.abs(num))}`;
    }

    _formatGeneralForm() {
        const { a, b, c, orientation } = this;
        const variable = orientation === 'vertical' ? 'x' : 'y';
        const output = orientation === 'vertical' ? 'y' : 'x';

        let terms = [];
        if (a !== 0) {
            if (a === 1) terms.push(`${variable}²`);
            else if (a === -1) terms.push(`-${variable}²`);
            else terms.push(`${this._formatNumber(a)}${variable}²`);
        }
        if (b !== 0) {
            if (terms.length === 0) {
                if (b === 1) terms.push(variable);
                else if (b === -1) terms.push(`-${variable}`);
                else terms.push(`${this._formatNumber(b)}${variable}`);
            } else {
                if (b === 1) terms.push(`+ ${variable}`);
                else if (b === -1) terms.push(`- ${variable}`);
                else if (b > 0) terms.push(`+ ${this._formatNumber(b)}${variable}`);
                else terms.push(`- ${this._formatNumber(Math.abs(b))}${variable}`);
            }
        }
        if (c !== 0) {
            if (terms.length === 0) terms.push(this._formatNumber(c));
            else if (c > 0) terms.push(`+ ${this._formatNumber(c)}`);
            else terms.push(`- ${this._formatNumber(Math.abs(c))}`);
        }

        return `${output} = ${terms.join(' ') || '0'}`;
    }

    /**
     * Compute y value for given x (vertical parabola)
     * or x value for given y (horizontal parabola)
     */
    evaluate(input) {
        const { a, b, c } = this;
        return a * input * input + b * input + c;
    }

    /**
     * Generate points for plotting the parabola
     */
    generatePlotPoints(minInput = -10, maxInput = 10, steps = 200) {
        const points = [];
        const step = (maxInput - minInput) / steps;

        for (let i = 0; i <= steps; i++) {
            const input = minInput + i * step;
            const output = this.evaluate(input);

            if (this.orientation === 'vertical') {
                points.push({ x: input, y: output });
            } else {
                points.push({ x: output, y: input });
            }
        }

        return points;
    }

    /**
     * Get the optimal view bounds for visualization
     */
    getViewBounds(padding = 2) {
        if (!this.properties) this.calculate();
        const props = this.properties;

        // Collect key points
        const points = [
            props.vertex,
            props.focus,
            ...props.latusRectumEndpoints,
            ...props.xIntercepts
        ];

        if (Array.isArray(props.yIntercept)) {
            points.push(...props.yIntercept);
        } else if (props.yIntercept) {
            points.push(props.yIntercept);
        }

        // Find bounds
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const p of points) {
            if (p && isFinite(p.x) && isFinite(p.y)) {
                minX = Math.min(minX, p.x);
                maxX = Math.max(maxX, p.x);
                minY = Math.min(minY, p.y);
                maxY = Math.max(maxY, p.y);
            }
        }

        // Ensure reasonable bounds
        minX = Math.max(minX - padding, -20);
        maxX = Math.min(maxX + padding, 20);
        minY = Math.max(minY - padding, -20);
        maxY = Math.min(maxY + padding, 20);

        // Ensure minimum size
        if (maxX - minX < 4) {
            const mid = (maxX + minX) / 2;
            minX = mid - 2;
            maxX = mid + 2;
        }
        if (maxY - minY < 4) {
            const mid = (maxY + minY) / 2;
            minY = mid - 2;
            maxY = mid + 2;
        }

        return { minX, maxX, minY, maxY };
    }
}

// Preset parabola examples
const PARABOLA_PRESETS = [
    {
        id: 'basic-up',
        name: 'Basic (y = x²)',
        equation: 'y = x²',
        description: 'Simplest parabola opening upward'
    },
    {
        id: 'basic-down',
        name: 'Opening Down (y = -x²)',
        equation: 'y = -x²',
        description: 'Parabola opening downward'
    },
    {
        id: 'narrow',
        name: 'Narrow (y = 2x²)',
        equation: 'y = 2x²',
        description: 'Narrower parabola with a = 2'
    },
    {
        id: 'wide',
        name: 'Wide (y = 0.5x²)',
        equation: 'y = 0.5x²',
        description: 'Wider parabola with a = 0.5'
    },
    {
        id: 'shifted-vertex',
        name: 'Shifted Vertex',
        equation: 'y = x² - 4x + 3',
        description: 'Vertex at (2, -1)'
    },
    {
        id: 'two-roots',
        name: 'Two X-Intercepts',
        equation: 'y = x² - 5x + 6',
        description: 'Crosses x-axis at x = 2 and x = 3'
    },
    {
        id: 'single-root',
        name: 'Single X-Intercept',
        equation: 'y = x² - 4x + 4',
        description: 'Touches x-axis at x = 2'
    },
    {
        id: 'no-roots',
        name: 'No Real Roots',
        equation: 'y = x² + 1',
        description: 'Never crosses x-axis'
    },
    {
        id: 'horizontal',
        name: 'Horizontal (x = y²)',
        equation: 'x = y²',
        description: 'Opens to the right'
    },
    {
        id: 'horizontal-left',
        name: 'Horizontal Left (x = -y²)',
        equation: 'x = -y²',
        description: 'Opens to the left'
    }
];

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ParabolaEngine, PARABOLA_PRESETS };
}
