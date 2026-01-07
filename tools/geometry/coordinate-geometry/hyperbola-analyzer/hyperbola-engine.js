/**
 * Hyperbola Engine - Coordinate Geometry Calculations
 * Computes all properties of a hyperbola from its equation
 */

class HyperbolaEngine {
    constructor() {
        this.reset();
    }

    reset() {
        // Standard form: (x-h)²/a² - (y-k)²/b² = 1 (horizontal)
        // Or: (y-k)²/a² - (x-h)²/b² = 1 (vertical)
        this.h = 0;  // center x
        this.k = 0;  // center y
        this.a = 2;  // semi-transverse axis
        this.b = 1;  // semi-conjugate axis
        this.orientation = 'horizontal'; // 'horizontal' or 'vertical'
        this.properties = null;
    }

    /**
     * Parse equation string
     * Supports: (x-h)²/a² - (y-k)²/b² = 1, x²/a² - y²/b² = 1
     */
    parseEquation(equation) {
        let eq = equation.replace(/\s+/g, '').toLowerCase();
        eq = eq.replace(/²/g, '^2');

        let h = 0, k = 0, aSquared = 1, bSquared = 1;

        // Check if it's horizontal (x² first with +) or vertical (y² first with +)
        const xFirst = eq.indexOf('x') < eq.indexOf('y');
        const minusBeforeY = eq.match(/[+-]\s*\(y|\-y\^2/);

        if (xFirst && minusBeforeY) {
            this.orientation = 'horizontal';
        } else {
            this.orientation = 'vertical';
        }

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

        if (this.orientation === 'horizontal') {
            this.a = Math.sqrt(aSquared);
            this.b = Math.sqrt(bSquared);
        } else {
            this.a = Math.sqrt(bSquared);
            this.b = Math.sqrt(aSquared);
        }

        return { h: this.h, k: this.k, a: this.a, b: this.b, orientation: this.orientation };
    }

    /**
     * Set hyperbola parameters directly
     */
    setHyperbola(h, k, a, b, orientation = 'horizontal') {
        this.h = h;
        this.k = k;
        this.a = a;
        this.b = b;
        this.orientation = orientation;
    }

    /**
     * Calculate all hyperbola properties
     */
    calculate() {
        const { h, k, a, b, orientation } = this;

        if (a <= 0 || b <= 0) {
            return { error: 'Invalid hyperbola (a or b ≤ 0)' };
        }

        // Center
        const center = { x: h, y: k };

        // c = distance from center to focus = √(a² + b²)
        const c = Math.sqrt(a * a + b * b);

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

        // Vertices (endpoints of transverse axis)
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

        // Co-vertices (endpoints of conjugate axis)
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

        // Eccentricity e = c/a (e > 1 for hyperbola)
        const eccentricity = c / a;

        // Transverse and conjugate axis lengths
        const transverseAxisLength = 2 * a;
        const conjugateAxisLength = 2 * b;

        // Asymptotes: y - k = ±(b/a)(x - h) for horizontal
        //             y - k = ±(a/b)(x - h) for vertical
        let asymptotes;
        if (orientation === 'horizontal') {
            const slope = b / a;
            asymptotes = [
                { slope: slope, equation: `y = ${this._formatNumber(k)} + ${this._formatNumber(slope)}(x ${this._formatOffset(-h)})` },
                { slope: -slope, equation: `y = ${this._formatNumber(k)} - ${this._formatNumber(slope)}(x ${this._formatOffset(-h)})` }
            ];
        } else {
            const slope = a / b;
            asymptotes = [
                { slope: slope, equation: `y = ${this._formatNumber(k)} + ${this._formatNumber(slope)}(x ${this._formatOffset(-h)})` },
                { slope: -slope, equation: `y = ${this._formatNumber(k)} - ${this._formatNumber(slope)}(x ${this._formatOffset(-h)})` }
            ];
        }

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

        // X-intercepts (for horizontal hyperbola only if center is at origin)
        const xIntercepts = [];
        if (orientation === 'horizontal' && Math.abs(k) < 0.0001) {
            xIntercepts.push({ x: h + a, y: 0 });
            xIntercepts.push({ x: h - a, y: 0 });
        }

        // Y-intercepts (for vertical hyperbola only if center is at origin)
        const yIntercepts = [];
        if (orientation === 'vertical' && Math.abs(h) < 0.0001) {
            yIntercepts.push({ x: 0, y: k + a });
            yIntercepts.push({ x: 0, y: k - a });
        }

        // Equation forms
        let standardForm;
        if (orientation === 'horizontal') {
            standardForm = `(x ${this._formatOffset(-h)})²/${this._formatNumber(a * a)} - (y ${this._formatOffset(-k)})²/${this._formatNumber(b * b)} = 1`;
        } else {
            standardForm = `(y ${this._formatOffset(-k)})²/${this._formatNumber(a * a)} - (x ${this._formatOffset(-h)})²/${this._formatNumber(b * b)} = 1`;
        }

        this.properties = {
            center,
            semiTransverseAxis: a,
            semiConjugateAxis: b,
            transverseAxisLength,
            conjugateAxisLength,
            orientation,
            foci,
            focalDistance: c,
            vertices,
            coVertices,
            eccentricity,
            asymptotes,
            directrices,
            latusRectumLength,
            xIntercepts,
            yIntercepts,
            standardForm
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
     * Generate points for plotting the hyperbola
     */
    generatePlotPoints(tRange = 3, steps = 100) {
        const points = { branch1: [], branch2: [] };
        const { h, k, a, b, orientation } = this;

        // Parametric: x = h + a*sec(t), y = k + b*tan(t) for horizontal
        //             x = h + b*tan(t), y = k + a*sec(t) for vertical

        for (let i = 0; i <= steps; i++) {
            const t = -tRange + (2 * tRange * i) / steps;
            const coshT = Math.cosh(t);
            const sinhT = Math.sinh(t);

            if (orientation === 'horizontal') {
                // Right branch (x > h)
                points.branch1.push({
                    x: h + a * coshT,
                    y: k + b * sinhT
                });
                // Left branch (x < h)
                points.branch2.push({
                    x: h - a * coshT,
                    y: k + b * sinhT
                });
            } else {
                // Top branch (y > k)
                points.branch1.push({
                    x: h + b * sinhT,
                    y: k + a * coshT
                });
                // Bottom branch (y < k)
                points.branch2.push({
                    x: h + b * sinhT,
                    y: k - a * coshT
                });
            }
        }

        return points;
    }

    /**
     * Get view bounds for visualization
     */
    getViewBounds(padding = 2) {
        const { h, k, a, b } = this;
        const maxExtent = Math.max(a, b) * 2 + padding;

        return {
            minX: h - maxExtent,
            maxX: h + maxExtent,
            minY: k - maxExtent,
            maxY: k + maxExtent
        };
    }
}

// Preset hyperbola examples
const HYPERBOLA_PRESETS = [
    { id: 'basic-h', name: 'Horizontal Hyperbola', equation: 'x²/4 - y²/9 = 1', description: 'Opens left-right, a=2, b=3' },
    { id: 'basic-v', name: 'Vertical Hyperbola', equation: 'y²/4 - x²/9 = 1', description: 'Opens up-down, a=2, b=3' },
    { id: 'equal', name: 'Rectangular Hyperbola', equation: 'x²/4 - y²/4 = 1', description: 'Equal axes (a=b), asymptotes at 45°' },
    { id: 'wide', name: 'Wide Hyperbola', equation: 'x²/1 - y²/9 = 1', description: 'Steep asymptotes' },
    { id: 'narrow', name: 'Narrow Hyperbola', equation: 'x²/9 - y²/1 = 1', description: 'Shallow asymptotes' },
    { id: 'shifted', name: 'Shifted Center', equation: '(x-2)²/4 - (y-1)²/9 = 1', description: 'Center at (2, 1)' }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HyperbolaEngine, HYPERBOLA_PRESETS };
}
