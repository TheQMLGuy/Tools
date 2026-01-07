/**
 * Circle Engine - Coordinate Geometry Calculations
 * Computes all properties of a circle from its equation
 */

class CircleEngine {
    constructor() {
        this.reset();
    }

    reset() {
        // Standard form: (x - h)² + (y - k)² = r²
        // General form: x² + y² + Dx + Ey + F = 0
        this.h = 0;  // center x
        this.k = 0;  // center y
        this.r = 1;  // radius
        this.D = 0;
        this.E = 0;
        this.F = 0;
        this.properties = null;
    }

    /**
     * Parse equation string
     * Supports: (x-h)² + (y-k)² = r², x² + y² + Dx + Ey + F = 0, x² + y² = r²
     */
    parseEquation(equation) {
        let eq = equation.replace(/\s+/g, '').toLowerCase();
        eq = eq.replace(/²/g, '^2');

        // Try standard form: (x-h)² + (y-k)² = r² or (x+h)² + (y+k)² = r²
        const standardMatch = eq.match(/\(x([+-][\d.]+)?\)\^2\+\(y([+-][\d.]+)?\)\^2=(\d+\.?\d*)/);
        if (standardMatch) {
            this.h = standardMatch[1] ? -parseFloat(standardMatch[1]) : 0;
            this.k = standardMatch[2] ? -parseFloat(standardMatch[2]) : 0;
            this.r = Math.sqrt(parseFloat(standardMatch[3]));
            return this._updateGeneralFromStandard();
        }

        // Simple form: x² + y² = r²
        const simpleMatch = eq.match(/x\^2\+y\^2=(\d+\.?\d*)/);
        if (simpleMatch) {
            this.h = 0;
            this.k = 0;
            this.r = Math.sqrt(parseFloat(simpleMatch[1]));
            return this._updateGeneralFromStandard();
        }

        // General form: x² + y² + Dx + Ey + F = 0
        // Parse coefficients
        this.D = 0;
        this.E = 0;
        this.F = 0;

        // Match Dx term
        const dMatch = eq.match(/([+-]?[\d.]*)?x(?!\^)/);
        if (dMatch && dMatch[0].indexOf('^') === -1) {
            this.D = this._parseCoef(dMatch[1]);
        }

        // Match Ey term
        const eMatch = eq.match(/([+-]?[\d.]*)?y(?!\^)/);
        if (eMatch && eMatch[0].indexOf('^') === -1) {
            this.E = this._parseCoef(eMatch[1]);
        }

        // Match F constant
        const parts = eq.split('=');
        if (parts.length === 2) {
            // Move RHS to LHS
            const rhs = parseFloat(parts[1]) || 0;
            this.F = -rhs;
        }
        const fMatch = eq.match(/([+-][\d.]+)(?=[+=]|$)/g);
        if (fMatch) {
            for (const m of fMatch) {
                if (!m.includes('x') && !m.includes('y')) {
                    this.F += parseFloat(m);
                }
            }
        }

        return this._updateStandardFromGeneral();
    }

    _parseCoef(str) {
        if (!str || str === '' || str === '+') return 1;
        if (str === '-') return -1;
        return parseFloat(str);
    }

    _updateGeneralFromStandard() {
        // From (x-h)² + (y-k)² = r², expand to x² + y² + Dx + Ey + F = 0
        this.D = -2 * this.h;
        this.E = -2 * this.k;
        this.F = this.h * this.h + this.k * this.k - this.r * this.r;
        return { h: this.h, k: this.k, r: this.r };
    }

    _updateStandardFromGeneral() {
        // From x² + y² + Dx + Ey + F = 0, convert to (x-h)² + (y-k)² = r²
        this.h = -this.D / 2;
        this.k = -this.E / 2;
        const rSquared = this.h * this.h + this.k * this.k - this.F;
        if (rSquared < 0) {
            return { error: 'Invalid circle (r² < 0)' };
        }
        this.r = Math.sqrt(rSquared);
        return { h: this.h, k: this.k, r: this.r };
    }

    /**
     * Set circle from center and radius
     */
    setCircle(h, k, r) {
        this.h = h;
        this.k = k;
        this.r = Math.abs(r);
        this._updateGeneralFromStandard();
    }

    /**
     * Calculate all circle properties
     */
    calculate() {
        const { h, k, r } = this;

        if (r <= 0) {
            return { error: 'Invalid circle (r ≤ 0)' };
        }

        // Center
        const center = { x: h, y: k };

        // Diameter
        const diameter = 2 * r;

        // Circumference
        const circumference = 2 * Math.PI * r;

        // Area
        const area = Math.PI * r * r;

        // X-intercepts (where y = 0)
        // (x - h)² + k² = r² => (x - h)² = r² - k²
        const xIntercepts = [];
        const xDiscriminant = r * r - k * k;
        if (xDiscriminant > 0) {
            xIntercepts.push({ x: h + Math.sqrt(xDiscriminant), y: 0 });
            xIntercepts.push({ x: h - Math.sqrt(xDiscriminant), y: 0 });
        } else if (Math.abs(xDiscriminant) < 0.0001) {
            xIntercepts.push({ x: h, y: 0 });
        }

        // Y-intercepts (where x = 0)
        // h² + (y - k)² = r² => (y - k)² = r² - h²
        const yIntercepts = [];
        const yDiscriminant = r * r - h * h;
        if (yDiscriminant > 0) {
            yIntercepts.push({ x: 0, y: k + Math.sqrt(yDiscriminant) });
            yIntercepts.push({ x: 0, y: k - Math.sqrt(yDiscriminant) });
        } else if (Math.abs(yDiscriminant) < 0.0001) {
            yIntercepts.push({ x: 0, y: k });
        }

        // Cardinal points (top, bottom, left, right)
        const cardinalPoints = {
            top: { x: h, y: k + r },
            bottom: { x: h, y: k - r },
            left: { x: h - r, y: k },
            right: { x: h + r, y: k }
        };

        // Equation forms
        const standardForm = `(x ${this._formatOffset(-h)})² + (y ${this._formatOffset(-k)})² = ${this._formatNumber(r * r)}`;
        const generalForm = `x² + y² ${this._formatTerm(this.D, 'x')} ${this._formatTerm(this.E, 'y')} ${this._formatConstant(this.F)} = 0`;
        const parametricForm = `x = ${this._formatNumber(h)} + ${this._formatNumber(r)}cos(t), y = ${this._formatNumber(k)} + ${this._formatNumber(r)}sin(t)`;

        this.properties = {
            center,
            radius: r,
            diameter,
            circumference,
            area,
            xIntercepts,
            yIntercepts,
            cardinalPoints,
            standardForm,
            generalForm,
            parametricForm,
            eccentricity: 0 // Circle always has e = 0
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

    _formatTerm(coef, variable) {
        if (Math.abs(coef) < 0.0001) return '';
        if (coef > 0) return `+ ${coef === 1 ? '' : this._formatNumber(coef)}${variable}`;
        return `- ${coef === -1 ? '' : this._formatNumber(Math.abs(coef))}${variable}`;
    }

    _formatConstant(num) {
        if (Math.abs(num) < 0.0001) return '';
        if (num > 0) return `+ ${this._formatNumber(num)}`;
        return `- ${this._formatNumber(Math.abs(num))}`;
    }

    /**
     * Generate points for plotting the circle
     */
    generatePlotPoints(steps = 100) {
        const points = [];
        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * 2 * Math.PI;
            points.push({
                x: this.h + this.r * Math.cos(t),
                y: this.k + this.r * Math.sin(t)
            });
        }
        return points;
    }

    /**
     * Get view bounds for visualization
     */
    getViewBounds(padding = 2) {
        return {
            minX: this.h - this.r - padding,
            maxX: this.h + this.r + padding,
            minY: this.k - this.r - padding,
            maxY: this.k + this.r + padding
        };
    }
}

// Preset circle examples
const CIRCLE_PRESETS = [
    { id: 'unit', name: 'Unit Circle', equation: 'x² + y² = 1', description: 'Center at origin, radius 1' },
    { id: 'basic', name: 'Basic Circle', equation: 'x² + y² = 4', description: 'Center at origin, radius 2' },
    { id: 'shifted', name: 'Shifted Center', equation: '(x-2)² + (y-3)² = 9', description: 'Center at (2, 3), radius 3' },
    { id: 'large', name: 'Large Circle', equation: 'x² + y² = 25', description: 'Center at origin, radius 5' },
    { id: 'offset', name: 'Offset Circle', equation: '(x+1)² + (y-2)² = 4', description: 'Center at (-1, 2), radius 2' },
    { id: 'general', name: 'General Form', equation: 'x² + y² - 4x + 6y - 3 = 0', description: 'Center at (2, -3), radius 4' }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CircleEngine, CIRCLE_PRESETS };
}
