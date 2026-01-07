/**
 * Ellipse Engine - Coordinate Geometry Calculations
 * Computes all properties of an ellipse from its equation
 */

class EllipseEngine {
    constructor() {
        this.reset();
    }

    reset() {
        // Standard form: (x-h)²/a² + (y-k)²/b² = 1
        this.h = 0;  // center x
        this.k = 0;  // center y
        this.a = 2;  // semi-major axis
        this.b = 1;  // semi-minor axis
        this.orientation = 'horizontal'; // 'horizontal' or 'vertical'
        this.properties = null;
    }

    /**
     * Parse equation string
     * Supports: (x-h)²/a² + (y-k)²/b² = 1, x²/a² + y²/b² = 1
     */
    parseEquation(equation) {
        let eq = equation.replace(/\s+/g, '').toLowerCase();
        eq = eq.replace(/²/g, '^2');

        // Try pattern: (x-h)²/a² + (y-k)²/b² = 1
        // Or: x²/a² + y²/b² = 1

        let h = 0, k = 0, aSquared = 1, bSquared = 1;

        // Extract x term: (x-h)²/a² or x²/a²
        const xPattern = /\(x([+-][\d.]+)?\)\^2\/(\d+\.?\d*)|x\^2\/(\d+\.?\d*)/;
        const xMatch = eq.match(xPattern);
        if (xMatch) {
            h = xMatch[1] ? -parseFloat(xMatch[1]) : 0;
            aSquared = parseFloat(xMatch[2] || xMatch[3]);
        }

        // Extract y term: (y-k)²/b² or y²/b²
        const yPattern = /\(y([+-][\d.]+)?\)\^2\/(\d+\.?\d*)|y\^2\/(\d+\.?\d*)/;
        const yMatch = eq.match(yPattern);
        if (yMatch) {
            k = yMatch[1] ? -parseFloat(yMatch[1]) : 0;
            bSquared = parseFloat(yMatch[2] || yMatch[3]);
        }

        this.h = h;
        this.k = k;

        // Determine semi-major and semi-minor axes
        if (aSquared >= bSquared) {
            this.a = Math.sqrt(aSquared);
            this.b = Math.sqrt(bSquared);
            this.orientation = 'horizontal';
        } else {
            this.a = Math.sqrt(bSquared);
            this.b = Math.sqrt(aSquared);
            this.orientation = 'vertical';
        }

        return { h: this.h, k: this.k, a: this.a, b: this.b };
    }

    /**
     * Set ellipse parameters directly
     */
    setEllipse(h, k, a, b) {
        this.h = h;
        this.k = k;
        if (a >= b) {
            this.a = a;
            this.b = b;
            this.orientation = 'horizontal';
        } else {
            this.a = b;
            this.b = a;
            this.orientation = 'vertical';
        }
    }

    /**
     * Calculate all ellipse properties
     */
    calculate() {
        const { h, k, a, b, orientation } = this;

        if (a <= 0 || b <= 0) {
            return { error: 'Invalid ellipse (a or b ≤ 0)' };
        }

        // Center
        const center = { x: h, y: k };

        // c = distance from center to focus = √(a² - b²)
        const c = Math.sqrt(a * a - b * b);

        // Foci
        let foci;
        if (orientation === 'horizontal') {
            foci = [
                { x: h + c, y: k },
                { x: h - c, y: k }
            ];
        } else {
            foci = [
                { x: h, y: k + c },
                { x: h, y: k - c }
            ];
        }

        // Vertices (endpoints of major axis)
        let vertices;
        if (orientation === 'horizontal') {
            vertices = [
                { x: h + a, y: k },
                { x: h - a, y: k }
            ];
        } else {
            vertices = [
                { x: h, y: k + a },
                { x: h, y: k - a }
            ];
        }

        // Co-vertices (endpoints of minor axis)
        let coVertices;
        if (orientation === 'horizontal') {
            coVertices = [
                { x: h, y: k + b },
                { x: h, y: k - b }
            ];
        } else {
            coVertices = [
                { x: h + b, y: k },
                { x: h - b, y: k }
            ];
        }

        // Eccentricity e = c/a (0 < e < 1 for ellipse)
        const eccentricity = c / a;

        // Major and minor axis lengths
        const majorAxisLength = 2 * a;
        const minorAxisLength = 2 * b;

        // Circumference (approximation using Ramanujan's formula)
        const circumference = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));

        // Area
        const area = Math.PI * a * b;

        // Directrices
        let directrices;
        if (orientation === 'horizontal') {
            directrices = [
                { type: 'vertical', value: h + a / eccentricity, equation: `x = ${this._formatNumber(h + a / eccentricity)}` },
                { type: 'vertical', value: h - a / eccentricity, equation: `x = ${this._formatNumber(h - a / eccentricity)}` }
            ];
        } else {
            directrices = [
                { type: 'horizontal', value: k + a / eccentricity, equation: `y = ${this._formatNumber(k + a / eccentricity)}` },
                { type: 'horizontal', value: k - a / eccentricity, equation: `y = ${this._formatNumber(k - a / eccentricity)}` }
            ];
        }

        // Latus rectum length = 2b²/a
        const latusRectumLength = (2 * b * b) / a;

        // X-intercepts
        const xIntercepts = [];
        // (x-h)²/a² + k²/b² = 1 when y=0
        const xVal = 1 - (k * k) / (b * b);
        if (xVal > 0 && orientation === 'horizontal') {
            xIntercepts.push({ x: h + a * Math.sqrt(xVal), y: 0 });
            xIntercepts.push({ x: h - a * Math.sqrt(xVal), y: 0 });
        } else if (xVal > 0) {
            const xV = 1 - (k * k) / (a * a);
            if (xV > 0) {
                xIntercepts.push({ x: h + b * Math.sqrt(xV), y: 0 });
                xIntercepts.push({ x: h - b * Math.sqrt(xV), y: 0 });
            }
        }

        // Y-intercepts
        const yIntercepts = [];
        const yVal = 1 - (h * h) / (a * a);
        if (yVal > 0 && orientation === 'horizontal') {
            yIntercepts.push({ x: 0, y: k + b * Math.sqrt(yVal) });
            yIntercepts.push({ x: 0, y: k - b * Math.sqrt(yVal) });
        }

        // Equation forms
        const aSquared = orientation === 'horizontal' ? a * a : b * b;
        const bSquared = orientation === 'horizontal' ? b * b : a * a;
        const standardForm = `(x ${this._formatOffset(-h)})²/${this._formatNumber(aSquared)} + (y ${this._formatOffset(-k)})²/${this._formatNumber(bSquared)} = 1`;
        const parametricForm = `x = ${this._formatNumber(h)} + ${this._formatNumber(orientation === 'horizontal' ? a : b)}cos(t), y = ${this._formatNumber(k)} + ${this._formatNumber(orientation === 'horizontal' ? b : a)}sin(t)`;

        this.properties = {
            center,
            semiMajorAxis: a,
            semiMinorAxis: b,
            majorAxisLength,
            minorAxisLength,
            orientation,
            foci,
            focalDistance: c,
            vertices,
            coVertices,
            eccentricity,
            directrices,
            latusRectumLength,
            circumference,
            area,
            xIntercepts,
            yIntercepts,
            standardForm,
            parametricForm
        };

        return this.properties;
    }

    _formatNumber(num) {
        if (Number.isInteger(num)) return num.toString();
        return num.toFixed(4).replace(/\.?0+$/, '');
    }

    _formatOffset(num) {
        if (Math.abs(num) < 0.0001) return '';
        if (num > 0) return `+ ${this._formatNumber(num)}`;
        return `- ${this._formatNumber(Math.abs(num))}`;
    }

    /**
     * Generate points for plotting the ellipse
     */
    generatePlotPoints(steps = 100) {
        const points = [];
        const { h, k, a, b, orientation } = this;
        const semiA = orientation === 'horizontal' ? a : b;
        const semiB = orientation === 'horizontal' ? b : a;

        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * 2 * Math.PI;
            points.push({
                x: h + semiA * Math.cos(t),
                y: k + semiB * Math.sin(t)
            });
        }
        return points;
    }

    /**
     * Get view bounds for visualization
     */
    getViewBounds(padding = 2) {
        const { h, k, a, b, orientation } = this;
        const semiA = orientation === 'horizontal' ? a : b;
        const semiB = orientation === 'horizontal' ? b : a;

        return {
            minX: h - semiA - padding,
            maxX: h + semiA + padding,
            minY: k - semiB - padding,
            maxY: k + semiB + padding
        };
    }
}

// Preset ellipse examples
const ELLIPSE_PRESETS = [
    { id: 'basic-h', name: 'Horizontal Ellipse', equation: 'x²/9 + y²/4 = 1', description: 'a=3, b=2, horizontal major axis' },
    { id: 'basic-v', name: 'Vertical Ellipse', equation: 'x²/4 + y²/9 = 1', description: 'a=3, b=2, vertical major axis' },
    { id: 'wide', name: 'Wide Ellipse', equation: 'x²/25 + y²/4 = 1', description: 'a=5, b=2, very eccentric' },
    { id: 'near-circle', name: 'Near Circle', equation: 'x²/16 + y²/15 = 1', description: 'Low eccentricity' },
    { id: 'shifted', name: 'Shifted Center', equation: '(x-2)²/9 + (y-1)²/4 = 1', description: 'Center at (2, 1)' },
    { id: 'earth-orbit', name: 'Earth Orbit (scaled)', equation: 'x²/100 + y²/99.72 = 1', description: 'e ≈ 0.0167, nearly circular' }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EllipseEngine, ELLIPSE_PRESETS };
}
