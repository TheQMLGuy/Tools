/**
 * Advanced Hyperbola Engine - Comprehensive Coordinate Geometry
 * 
 * Features:
 * - Multiple forms: x²/a² - y²/b² = 1, y²/a² - x²/b² = 1, shifted, rectangular
 * - Parametric representation: (a sec θ, b tan θ)
 * - Tangent and normal forms
 * - Asymptotes, conjugate hyperbola
 * - Director circle (when a > b)
 */

class AdvancedHyperbolaEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.h = 0;          // Center x
        this.k = 0;          // Center y
        this.a = 2;          // Transverse semi-axis
        this.b = 1;          // Conjugate semi-axis
        this.isHorizontal = true;  // x²/a² - y²/b² = 1 (opens left/right)

        this.properties = null;
        this.currentTheta = Math.PI / 4;  // Default 45°
    }

    // =====================================================
    // BIDIRECTIONAL SETTERS
    // =====================================================

    setFromEquation(equation) {
        let eq = equation.replace(/\s+/g, '').toLowerCase();
        eq = eq.replace(/²/g, '^2');

        // x²/a² - y²/b² = 1
        let match = eq.match(/x\^2\/(\d+\.?\d*)-y\^2\/(\d+\.?\d*)=1/);
        if (match) {
            this.h = 0; this.k = 0;
            this.a = Math.sqrt(parseFloat(match[1]));
            this.b = Math.sqrt(parseFloat(match[2]));
            this.isHorizontal = true;
            return this.calculate();
        }

        // y²/a² - x²/b² = 1
        match = eq.match(/y\^2\/(\d+\.?\d*)-x\^2\/(\d+\.?\d*)=1/);
        if (match) {
            this.h = 0; this.k = 0;
            this.a = Math.sqrt(parseFloat(match[1]));
            this.b = Math.sqrt(parseFloat(match[2]));
            this.isHorizontal = false;
            return this.calculate();
        }

        // (x-h)²/a² - (y-k)²/b² = 1
        match = eq.match(/\(x([+-][\d.]+)?\)\^2\/(\d+\.?\d*)-\(y([+-][\d.]+)?\)\^2\/(\d+\.?\d*)=1/);
        if (match) {
            this.h = match[1] ? -parseFloat(match[1]) : 0;
            this.k = match[3] ? -parseFloat(match[3]) : 0;
            this.a = Math.sqrt(parseFloat(match[2]));
            this.b = Math.sqrt(parseFloat(match[4]));
            this.isHorizontal = true;
            return this.calculate();
        }

        // xy = c² (rectangular hyperbola)
        match = eq.match(/xy=(\d+\.?\d*)/);
        if (match) {
            const c = Math.sqrt(parseFloat(match[1]));
            this.h = 0; this.k = 0;
            this.a = c * Math.sqrt(2);
            this.b = c * Math.sqrt(2);
            this.isHorizontal = true;  // We'll handle this specially
            this.isRectangular = true;
            return this.calculate();
        }

        return { error: 'Could not parse hyperbola equation' };
    }

    setFromParameters(a, b, h = 0, k = 0, isHorizontal = true) {
        this.a = a;
        this.b = b;
        this.h = h;
        this.k = k;
        this.isHorizontal = isHorizontal;
        return this.calculate();
    }

    setCenter(h, k) {
        this.h = h;
        this.k = k;
        return this.calculate();
    }

    // =====================================================
    // CALCULATE ALL PROPERTIES
    // =====================================================

    calculate() {
        const { h, k, a, b, isHorizontal } = this;

        if (a <= 0 || b <= 0) return { error: 'Axes must be positive' };

        const c = Math.sqrt(a * a + b * b);
        const e = c / a;

        const center = { x: h, y: k };

        // Foci
        const foci = isHorizontal
            ? [{ x: h - c, y: k }, { x: h + c, y: k }]
            : [{ x: h, y: k - c }, { x: h, y: k + c }];

        // Vertices (on transverse axis)
        const vertices = isHorizontal
            ? [{ x: h - a, y: k }, { x: h + a, y: k }]
            : [{ x: h, y: k - a }, { x: h, y: k + a }];

        // Directrices
        const directrices = isHorizontal
            ? { type: 'vertical', values: [h - a / e, h + a / e] }
            : { type: 'horizontal', values: [k - a / e, k + a / e] };

        // Asymptotes: y - k = ±(b/a)(x - h) for horizontal
        const asymptotes = isHorizontal
            ? [
                { slope: b / a, intercept: k - (b / a) * h },
                { slope: -b / a, intercept: k + (b / a) * h }
            ]
            : [
                { slope: a / b, intercept: k - (a / b) * h },
                { slope: -a / b, intercept: k + (a / b) * h }
            ];

        // Latus rectum
        const latusRectum = (2 * b * b) / a;

        // Equations
        const equations = this._getEquationForms();

        // Director circle (only exists if a > b)
        let directorCircle = null;
        if (a > b) {
            directorCircle = { center, radius: Math.sqrt(a * a - b * b) };
        }

        // Conjugate hyperbola
        const conjugate = isHorizontal
            ? `-x²/${this._fmt(a * a)} + y²/${this._fmt(b * b)} = 1`
            : `x²/${this._fmt(b * b)} - y²/${this._fmt(a * a)} = 1`;

        // Is rectangular?
        const isRectangular = Math.abs(a - b) < 0.01;

        this.properties = {
            center,
            transverseAxis: a,
            conjugateAxis: b,
            foci,
            vertices,
            c,
            eccentricity: e,
            directrices,
            asymptotes,
            latusRectum,
            equations,
            directorCircle,
            conjugate,
            isHorizontal,
            isRectangular
        };

        return this.properties;
    }

    _getEquationForms() {
        const { h, k, a, b, isHorizontal } = this;

        let standard, parametric;

        if (h === 0 && k === 0) {
            standard = isHorizontal
                ? `x²/${this._fmt(a * a)} - y²/${this._fmt(b * b)} = 1`
                : `y²/${this._fmt(a * a)} - x²/${this._fmt(b * b)} = 1`;
        } else {
            standard = isHorizontal
                ? `(x ${this._fmtOff(-h)})²/${this._fmt(a * a)} - (y ${this._fmtOff(-k)})²/${this._fmt(b * b)} = 1`
                : `(y ${this._fmtOff(-k)})²/${this._fmt(a * a)} - (x ${this._fmtOff(-h)})²/${this._fmt(b * b)} = 1`;
        }

        if (isHorizontal) {
            parametric = h === 0 && k === 0
                ? `x = ${this._fmt(a)}sec(θ), y = ${this._fmt(b)}tan(θ)`
                : `x = ${this._fmt(h)} + ${this._fmt(a)}sec(θ), y = ${this._fmt(k)} + ${this._fmt(b)}tan(θ)`;
        } else {
            parametric = h === 0 && k === 0
                ? `x = ${this._fmt(b)}tan(θ), y = ${this._fmt(a)}sec(θ)`
                : `x = ${this._fmt(h)} + ${this._fmt(b)}tan(θ), y = ${this._fmt(k)} + ${this._fmt(a)}sec(θ)`;
        }

        const asymptote1 = isHorizontal
            ? `y = ${this._fmt(b / a)}x` : `y = ${this._fmt(a / b)}x`;
        const asymptote2 = isHorizontal
            ? `y = ${this._fmt(-b / a)}x` : `y = ${this._fmt(-a / b)}x`;

        return { standard, parametric, asymptote1, asymptote2 };
    }

    // =====================================================
    // PARAMETRIC REPRESENTATION
    // =====================================================

    /**
     * Get point on hyperbola at angle θ
     * For x²/a² - y²/b² = 1: (a sec θ, b tan θ)
     */
    getParametricPoint(theta) {
        const { h, k, a, b, isHorizontal } = this;
        const secT = 1 / Math.cos(theta);
        const tanT = Math.tan(theta);

        if (isHorizontal) {
            return { x: h + a * secT, y: k + b * tanT, theta };
        } else {
            return { x: h + b * tanT, y: k + a * secT, theta };
        }
    }

    /**
     * Check which branch point is on: right (+1), left (-1)
     */
    getPointBranch(theta) {
        const cosT = Math.cos(theta);
        return cosT >= 0 ? 1 : -1;
    }

    // =====================================================
    // LINE TOOLS: TANGENT, NORMAL
    // =====================================================

    /**
     * Tangent at parametric point θ
     * For x²/a² - y²/b² = 1, tangent at (a sec θ, b tan θ):
     * (x sec θ)/a - (y tan θ)/b = 1
     */
    getTangentAt(theta) {
        const { h, k, a, b, isHorizontal } = this;
        const point = this.getParametricPoint(theta);
        const secT = 1 / Math.cos(theta);
        const tanT = Math.tan(theta);

        let A, B, C;
        if (isHorizontal) {
            A = secT / a;
            B = -tanT / b;
            C = -(A * h + B * k + 1);
        } else {
            A = -tanT / b;
            B = secT / a;
            C = -(A * h + B * k + 1);
        }

        if (Math.abs(B) < 0.0001) {
            return {
                type: 'tangent', point, theta,
                isVertical: true, equation: `x = ${this._fmt(point.x)}`
            };
        }

        const m = -A / B;
        const c = -C / B;

        return {
            type: 'tangent', point, theta,
            slope: m,
            equation: this._formatLineEquation(m, c),
            getY: (x) => m * x + c
        };
    }

    /**
     * Tangent by slope m
     * y = mx ± √(a²m² - b²) (only if a²m² > b²)
     */
    getTangentBySlope(m) {
        const { h, k, a, b, isHorizontal } = this;
        const a2 = isHorizontal ? a : b;
        const b2 = isHorizontal ? b : a;

        const disc = a2 * a2 * m * m - b2 * b2;
        if (disc < 0) return { error: 'No real tangent for this slope' };

        const offset = Math.sqrt(disc);
        const c1 = k - m * h + offset;
        const c2 = k - m * h - offset;

        return [
            { type: 'tangent', slope: m, equation: this._formatLineEquation(m, c1), getY: (x) => m * x + c1 },
            { type: 'tangent', slope: m, equation: this._formatLineEquation(m, c2), getY: (x) => m * x + c2 }
        ];
    }

    /**
     * Normal at parametric point θ
     */
    getNormalAt(theta) {
        const { h, k, a, b, isHorizontal } = this;
        const point = this.getParametricPoint(theta);
        const secT = 1 / Math.cos(theta);
        const tanT = Math.tan(theta);

        if (Math.abs(tanT) < 0.0001) {
            return {
                type: 'normal', point, theta,
                isHorizontal: true, equation: `y = ${this._fmt(point.y)}`,
                getY: () => point.y
            };
        }

        const a2 = isHorizontal ? a : b;
        const b2 = isHorizontal ? b : a;

        const m = (a2 * tanT) / (b2 * secT);
        const c = point.y - m * point.x;

        return {
            type: 'normal', point, theta,
            slope: m,
            equation: this._formatLineEquation(m, c),
            getY: (x) => m * x + c
        };
    }

    /**
     * Check if point is inside, on, or outside hyperbola region
     */
    getPointPosition(px, py) {
        const { h, k, a, b, isHorizontal } = this;

        let value;
        if (isHorizontal) {
            value = ((px - h) ** 2) / (a ** 2) - ((py - k) ** 2) / (b ** 2);
        } else {
            value = ((py - k) ** 2) / (a ** 2) - ((px - h) ** 2) / (b ** 2);
        }

        if (Math.abs(value - 1) < 0.01) return 'on';
        if (value > 1) return 'outside (hyperbola region)';
        return 'inside (between branches)';
    }

    // =====================================================
    // PLOTTING
    // =====================================================

    generatePlotPoints(steps = 60, branch = 1) {
        const points = [];
        const { a, b, isHorizontal } = this;

        // Parametric: use t from -limit to +limit, avoiding asymptotes
        const limit = 1.3;  // Limits how far the curve extends
        const dt = (2 * limit) / steps;

        for (let i = 0; i <= steps; i++) {
            const t = -limit + i * dt;
            const tanT = Math.sinh(t);  // Use sinh for smooth parametrization
            const secT = Math.cosh(t) * branch;  // cosh for sec (always positive), branch for direction

            if (isHorizontal) {
                points.push({ x: this.h + a * secT, y: this.k + b * tanT });
            } else {
                points.push({ x: this.h + b * tanT, y: this.k + a * secT });
            }
        }

        return points;
    }

    getViewBounds(padding = 1) {
        const { h, k, a, b, c } = this;
        const maxVal = Math.max(a, b, c || a) + padding;
        return {
            minX: h - maxVal - padding,
            maxX: h + maxVal + padding,
            minY: k - maxVal - padding,
            maxY: k + maxVal + padding
        };
    }

    // =====================================================
    // FORMATTING HELPERS
    // =====================================================

    _fmt(n) {
        if (Number.isInteger(n)) return n.toString();
        if (Math.abs(n) < 0.0001) return '0';
        return n.toFixed(3).replace(/\.?0+$/, '');
    }

    _fmtOff(n) {
        if (Math.abs(n) < 0.0001) return '';
        return n > 0 ? `+ ${this._fmt(n)}` : `- ${this._fmt(Math.abs(n))}`;
    }

    _formatLineEquation(m, c) {
        if (Math.abs(m) < 0.0001) return `y = ${this._fmt(c)}`;
        if (Math.abs(c) < 0.0001) return `y = ${this._fmt(m)}x`;
        return c > 0 ? `y = ${this._fmt(m)}x + ${this._fmt(c)}` : `y = ${this._fmt(m)}x - ${this._fmt(Math.abs(c))}`;
    }
}

const HYPERBOLA_PRESETS = [
    { name: 'Standard', equation: 'x²/4 - y²/1 = 1', description: 'a=2, b=1, horizontal' },
    { name: 'Vertical', equation: 'y²/4 - x²/1 = 1', description: 'a=2, b=1, vertical' },
    { name: 'Rectangular', equation: 'x²/4 - y²/4 = 1', description: 'a=b=2, e=√2' },
    { name: 'Elongated', equation: 'x²/9 - y²/4 = 1', description: 'a=3, b=2' },
    { name: 'Shifted', equation: '(x-1)²/4 - (y-2)²/1 = 1', description: 'Center (1,2)' },
    { name: 'xy = 4', equation: 'xy=4', description: 'Rectangular hyperbola' }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvancedHyperbolaEngine, HYPERBOLA_PRESETS };
}
