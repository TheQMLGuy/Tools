/**
 * Advanced Ellipse Engine - Comprehensive Coordinate Geometry
 * 
 * Features:
 * - Multiple forms: x²/a² + y²/b² = 1, shifted, general
 * - Parametric representation: (a cos θ, b sin θ)
 * - Tangent forms: point, parametric, slope
 * - Normal forms: point, parametric
 * - Director circle, chord of contact
 */

class AdvancedEllipseEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.h = 0;          // Center x
        this.k = 0;          // Center y
        this.a = 2;          // Semi-major axis
        this.b = 1;          // Semi-minor axis
        this.isHorizontal = true; // Major axis along x

        this.properties = null;
        this.currentTheta = 0;
    }

    // =====================================================
    // BIDIRECTIONAL SETTERS
    // =====================================================

    setFromEquation(equation) {
        let eq = equation.replace(/\s+/g, '').toLowerCase();
        eq = eq.replace(/²/g, '^2');

        // x²/a² + y²/b² = 1
        let match = eq.match(/x\^2\/(\d+\.?\d*)\+y\^2\/(\d+\.?\d*)=1/);
        if (match) {
            const a2 = parseFloat(match[1]);
            const b2 = parseFloat(match[2]);
            this.h = 0; this.k = 0;
            if (a2 >= b2) {
                this.a = Math.sqrt(a2); this.b = Math.sqrt(b2); this.isHorizontal = true;
            } else {
                this.a = Math.sqrt(b2); this.b = Math.sqrt(a2); this.isHorizontal = false;
            }
            return this.calculate();
        }

        // (x-h)²/a² + (y-k)²/b² = 1
        match = eq.match(/\(x([+-][\d.]+)?\)\^2\/(\d+\.?\d*)\+\(y([+-][\d.]+)?\)\^2\/(\d+\.?\d*)=1/);
        if (match) {
            this.h = match[1] ? -parseFloat(match[1]) : 0;
            this.k = match[3] ? -parseFloat(match[3]) : 0;
            const a2 = parseFloat(match[2]);
            const b2 = parseFloat(match[4]);
            if (a2 >= b2) {
                this.a = Math.sqrt(a2); this.b = Math.sqrt(b2); this.isHorizontal = true;
            } else {
                this.a = Math.sqrt(b2); this.b = Math.sqrt(a2); this.isHorizontal = false;
            }
            return this.calculate();
        }

        return { error: 'Could not parse ellipse equation' };
    }

    setFromParameters(a, b, h = 0, k = 0, isHorizontal = true) {
        this.a = Math.max(a, b);
        this.b = Math.min(a, b);
        this.h = h;
        this.k = k;
        this.isHorizontal = isHorizontal;
        return this.calculate();
    }

    setFromFoci(f1, f2) {
        // Foci determine center and c value
        this.h = (f1.x + f2.x) / 2;
        this.k = (f1.y + f2.y) / 2;
        const c = Math.sqrt((f2.x - f1.x) ** 2 + (f2.y - f1.y) ** 2) / 2;
        this.isHorizontal = Math.abs(f2.x - f1.x) > Math.abs(f2.y - f1.y);
        // Need a to complete: b² = a² - c², so a must be set separately
        // For now, set a = c * 1.5 as default
        this.a = c * 1.5;
        this.b = Math.sqrt(this.a * this.a - c * c);
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
        if (a < b) return { error: 'a must be ≥ b for standard form' };

        const c = Math.sqrt(a * a - b * b);
        const e = c / a;

        const center = { x: h, y: k };

        // Foci
        const foci = isHorizontal
            ? [{ x: h - c, y: k }, { x: h + c, y: k }]
            : [{ x: h, y: k - c }, { x: h, y: k + c }];

        // Vertices (on major axis)
        const vertices = isHorizontal
            ? [{ x: h - a, y: k }, { x: h + a, y: k }]
            : [{ x: h, y: k - a }, { x: h, y: k + a }];

        // Co-vertices (on minor axis)
        const coVertices = isHorizontal
            ? [{ x: h, y: k - b }, { x: h, y: k + b }]
            : [{ x: h - b, y: k }, { x: h + b, y: k }];

        // Directrices
        const directrices = isHorizontal
            ? { type: 'vertical', values: [h - a / e, h + a / e] }
            : { type: 'horizontal', values: [k - a / e, k + a / e] };

        // Latus rectum
        const latusRectum = (2 * b * b) / a;

        // Area and perimeter (Ramanujan approximation)
        const area = Math.PI * a * b;
        const perimeter = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));

        // Intercepts
        const xIntercepts = this._getXIntercepts();
        const yIntercepts = this._getYIntercepts();

        // Equations
        const equations = this._getEquationForms();

        // Director circle
        const directorCircle = { center, radius: Math.sqrt(a * a + b * b) };

        this.properties = {
            center,
            semiMajor: a,
            semiMinor: b,
            foci,
            vertices,
            coVertices,
            c,
            eccentricity: e,
            directrices,
            latusRectum,
            area,
            perimeter,
            xIntercepts,
            yIntercepts,
            equations,
            directorCircle,
            isHorizontal
        };

        return this.properties;
    }

    _getXIntercepts() {
        const { h, k, a, b, isHorizontal } = this;
        const intercepts = [];

        // At y = 0: check if ellipse intersects x-axis
        if (isHorizontal) {
            const disc = 1 - (k * k) / (b * b);
            if (disc >= 0) {
                const xOffset = a * Math.sqrt(disc);
                intercepts.push({ x: h + xOffset, y: 0 });
                if (xOffset > 0.0001) intercepts.push({ x: h - xOffset, y: 0 });
            }
        } else {
            const disc = 1 - (k * k) / (a * a);
            if (disc >= 0) {
                const xOffset = b * Math.sqrt(disc);
                intercepts.push({ x: h + xOffset, y: 0 });
                if (xOffset > 0.0001) intercepts.push({ x: h - xOffset, y: 0 });
            }
        }
        return intercepts;
    }

    _getYIntercepts() {
        const { h, k, a, b, isHorizontal } = this;
        const intercepts = [];

        if (isHorizontal) {
            const disc = 1 - (h * h) / (a * a);
            if (disc >= 0) {
                const yOffset = b * Math.sqrt(disc);
                intercepts.push({ x: 0, y: k + yOffset });
                if (yOffset > 0.0001) intercepts.push({ x: 0, y: k - yOffset });
            }
        } else {
            const disc = 1 - (h * h) / (b * b);
            if (disc >= 0) {
                const yOffset = a * Math.sqrt(disc);
                intercepts.push({ x: 0, y: k + yOffset });
                if (yOffset > 0.0001) intercepts.push({ x: 0, y: k - yOffset });
            }
        }
        return intercepts;
    }

    _getEquationForms() {
        const { h, k, a, b, isHorizontal } = this;

        let standard, parametric;

        if (h === 0 && k === 0) {
            standard = isHorizontal
                ? `x²/${this._fmt(a * a)} + y²/${this._fmt(b * b)} = 1`
                : `x²/${this._fmt(b * b)} + y²/${this._fmt(a * a)} = 1`;
        } else {
            standard = isHorizontal
                ? `(x ${this._fmtOff(-h)})²/${this._fmt(a * a)} + (y ${this._fmtOff(-k)})²/${this._fmt(b * b)} = 1`
                : `(x ${this._fmtOff(-h)})²/${this._fmt(b * b)} + (y ${this._fmtOff(-k)})²/${this._fmt(a * a)} = 1`;
        }

        if (isHorizontal) {
            parametric = h === 0 && k === 0
                ? `x = ${this._fmt(a)}cos(θ), y = ${this._fmt(b)}sin(θ)`
                : `x = ${this._fmt(h)} + ${this._fmt(a)}cos(θ), y = ${this._fmt(k)} + ${this._fmt(b)}sin(θ)`;
        } else {
            parametric = h === 0 && k === 0
                ? `x = ${this._fmt(b)}cos(θ), y = ${this._fmt(a)}sin(θ)`
                : `x = ${this._fmt(h)} + ${this._fmt(b)}cos(θ), y = ${this._fmt(k)} + ${this._fmt(a)}sin(θ)`;
        }

        return { standard, parametric };
    }

    // =====================================================
    // PARAMETRIC REPRESENTATION
    // =====================================================

    getParametricPoint(theta) {
        const { h, k, a, b, isHorizontal } = this;
        if (isHorizontal) {
            return { x: h + a * Math.cos(theta), y: k + b * Math.sin(theta), theta };
        } else {
            return { x: h + b * Math.cos(theta), y: k + a * Math.sin(theta), theta };
        }
    }

    getAngleFromPoint(x, y) {
        const { h, k, a, b, isHorizontal } = this;
        if (isHorizontal) {
            return Math.atan2((y - k) / b, (x - h) / a);
        } else {
            return Math.atan2((y - k) / a, (x - h) / b);
        }
    }

    // =====================================================
    // LINE TOOLS: TANGENT, NORMAL
    // =====================================================

    /**
     * Tangent at parametric point θ
     * For x²/a² + y²/b² = 1, tangent at (a cos θ, b sin θ):
     * (x cos θ)/a + (y sin θ)/b = 1
     */
    getTangentAt(theta) {
        const { h, k, a, b, isHorizontal } = this;
        const point = this.getParametricPoint(theta);
        const cosT = Math.cos(theta), sinT = Math.sin(theta);

        // Coefficients for Ax + By + C = 0
        let A, B, C;
        if (isHorizontal) {
            A = cosT / a;
            B = sinT / b;
            C = -(A * h + B * k + 1);
        } else {
            A = cosT / b;
            B = sinT / a;
            C = -(A * h + B * k + 1);
        }

        // Convert to y = mx + c if not vertical
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
     * y = mx ± √(a²m² + b²)
     */
    getTangentBySlope(m) {
        const { h, k, a, b, isHorizontal } = this;
        const a2 = isHorizontal ? a : b;
        const b2 = isHorizontal ? b : a;

        const offset = Math.sqrt(a2 * a2 * m * m + b2 * b2);
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
        const cosT = Math.cos(theta), sinT = Math.sin(theta);

        // Normal: ax/cos θ - by/sin θ = a² - b²
        if (Math.abs(sinT) < 0.0001) {
            // At ends of major axis, normal is vertical
            return {
                type: 'normal', point, theta,
                isVertical: true, equation: `x = ${this._fmt(point.x)}`
            };
        }
        if (Math.abs(cosT) < 0.0001) {
            // At ends of minor axis, normal is horizontal
            return {
                type: 'normal', point, theta,
                isHorizontal: true, equation: `y = ${this._fmt(point.y)}`,
                getY: () => point.y
            };
        }

        const a2 = isHorizontal ? a : b;
        const b2 = isHorizontal ? b : a;

        const m = (a2 * sinT) / (b2 * cosT);
        const c = point.y - m * point.x;

        return {
            type: 'normal', point, theta,
            slope: m,
            equation: this._formatLineEquation(m, c),
            getY: (x) => m * x + c
        };
    }

    /**
     * Check if point is inside, on, or outside ellipse
     */
    getPointPosition(px, py) {
        const { h, k, a, b, isHorizontal } = this;
        const a2 = isHorizontal ? a : b;
        const b2 = isHorizontal ? b : a;

        const value = ((px - h) ** 2) / (a2 ** 2) + ((py - k) ** 2) / (b2 ** 2);

        if (Math.abs(value - 1) < 0.01) return 'on';
        if (value < 1) return 'inside';
        return 'outside';
    }

    // =====================================================
    // PLOTTING
    // =====================================================

    generatePlotPoints(steps = 100) {
        const points = [];
        const dTheta = (2 * Math.PI) / steps;
        for (let i = 0; i <= steps; i++) {
            points.push(this.getParametricPoint(i * dTheta));
        }
        return points;
    }

    getViewBounds(padding = 1) {
        const { h, k, a, b } = this;
        const maxAxis = Math.max(a, b);
        return {
            minX: h - maxAxis - padding,
            maxX: h + maxAxis + padding,
            minY: k - maxAxis - padding,
            maxY: k + maxAxis + padding
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

const ELLIPSE_PRESETS = [
    { name: 'Standard', equation: 'x²/9 + y²/4 = 1', description: 'a=3, b=2, horizontal' },
    { name: 'Vertical', equation: 'x²/4 + y²/9 = 1', description: 'a=3, b=2, vertical' },
    { name: 'Circle-like', equation: 'x²/4 + y²/3 = 1', description: 'e ≈ 0.5' },
    { name: 'Elongated', equation: 'x²/25 + y²/4 = 1', description: 'e ≈ 0.92' },
    { name: 'Shifted', equation: '(x-2)²/9 + (y-1)²/4 = 1', description: 'Center (2,1)' },
    { name: 'Unit Circle', equation: 'x²/1 + y²/1 = 1', description: 'Circle, e=0' }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvancedEllipseEngine, ELLIPSE_PRESETS };
}
