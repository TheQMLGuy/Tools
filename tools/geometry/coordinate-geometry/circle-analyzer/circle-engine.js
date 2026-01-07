/**
 * Advanced Circle Engine - Comprehensive Coordinate Geometry
 * 
 * Features:
 * - Multiple forms: (x-h)² + (y-k)² = r², x² + y² + Dx + Ey + F = 0
 * - Parametric representation: (h + r cos θ, k + r sin θ)
 * - Bidirectional input: define by equation, center+radius, three points, diameter endpoints
 * - Line tools: tangent at point, tangent by slope, chord, secant
 * - Advanced: power of a point, tangent length from external point
 */

class AdvancedCircleEngine {
    constructor() {
        this.reset();
    }

    reset() {
        // Canonical parameters
        this.h = 0;          // Center x
        this.k = 0;          // Center y
        this.r = 1;          // Radius

        // Derived properties
        this.properties = null;

        // Active lines
        this.lines = [];

        // Parametric angle (in radians)
        this.currentTheta = 0;
    }

    // =====================================================
    // BIDIRECTIONAL SETTERS
    // =====================================================

    /**
     * Set from equation string
     * Supports: (x-h)² + (y-k)² = r², x² + y² = r², x² + y² + Dx + Ey + F = 0
     */
    setFromEquation(equation) {
        let eq = equation.replace(/\s+/g, '').toLowerCase();
        eq = eq.replace(/²/g, '^2');

        // Pattern: x^2 + y^2 = r^2 (centered at origin)
        let match = eq.match(/x\^2\+y\^2=(\d+\.?\d*)/);
        if (match) {
            this.h = 0;
            this.k = 0;
            this.r = Math.sqrt(parseFloat(match[1]));
            return this.calculate();
        }

        // Pattern: (x-h)^2 + (y-k)^2 = r^2
        match = eq.match(/\(x([+-][\d.]+)?\)\^2\+\(y([+-][\d.]+)?\)\^2=(\d+\.?\d*)/);
        if (match) {
            this.h = match[1] ? -parseFloat(match[1]) : 0;
            this.k = match[2] ? -parseFloat(match[2]) : 0;
            this.r = Math.sqrt(parseFloat(match[3]));
            return this.calculate();
        }

        // Pattern: x^2 + y^2 + Dx + Ey + F = 0 (general form)
        // Convert to standard form: center = (-D/2, -E/2), r² = D²/4 + E²/4 - F
        match = eq.match(/x\^2\+y\^2([+-]\d*\.?\d*)x([+-]\d*\.?\d*)y([+-]\d*\.?\d*)=0/);
        if (match) {
            const D = parseFloat(match[1]) || 0;
            const E = parseFloat(match[2]) || 0;
            const F = parseFloat(match[3]) || 0;
            this.h = -D / 2;
            this.k = -E / 2;
            const rSquared = (D * D + E * E) / 4 - F;
            if (rSquared <= 0) return { error: 'Invalid circle equation (r² ≤ 0)' };
            this.r = Math.sqrt(rSquared);
            return this.calculate();
        }

        // Simple form: x² + y² = N (centered at origin)
        match = eq.match(/x\^2\+y\^2=(\d+\.?\d*)/);
        if (match) {
            this.h = 0;
            this.k = 0;
            this.r = Math.sqrt(parseFloat(match[1]));
            return this.calculate();
        }

        return { error: 'Could not parse circle equation' };
    }

    /**
     * Set from center and radius
     */
    setFromCenterRadius(h, k, r) {
        this.h = h;
        this.k = k;
        this.r = Math.abs(r);
        return this.calculate();
    }

    /**
     * Set from three points on the circle
     */
    setFromThreePoints(p1, p2, p3) {
        // Using circumcenter formula
        const ax = p1.x, ay = p1.y;
        const bx = p2.x, by = p2.y;
        const cx = p3.x, cy = p3.y;

        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) < 0.0001) {
            return { error: 'Points are collinear, cannot form a circle' };
        }

        const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
        const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;

        this.h = ux;
        this.k = uy;
        this.r = Math.sqrt((ax - ux) * (ax - ux) + (ay - uy) * (ay - uy));

        return this.calculate();
    }

    /**
     * Set from diameter endpoints
     */
    setFromDiameter(p1, p2) {
        this.h = (p1.x + p2.x) / 2;
        this.k = (p1.y + p2.y) / 2;
        this.r = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) / 2;
        return this.calculate();
    }

    /**
     * Set center position (preserves radius)
     */
    setCenter(h, k) {
        this.h = h;
        this.k = k;
        return this.calculate();
    }

    /**
     * Set radius (preserves center)
     */
    setRadius(r) {
        this.r = Math.abs(r);
        return this.calculate();
    }

    // =====================================================
    // CALCULATE ALL PROPERTIES
    // =====================================================

    calculate() {
        const { h, k, r } = this;

        if (r <= 0) {
            return { error: 'Radius must be positive' };
        }

        // Center
        const center = { x: h, y: k };

        // Diameter
        const diameter = 2 * r;

        // Area and Circumference
        const area = Math.PI * r * r;
        const circumference = 2 * Math.PI * r;

        // Cardinal points (for visualization)
        const cardinalPoints = {
            top: { x: h, y: k + r },
            bottom: { x: h, y: k - r },
            left: { x: h - r, y: k },
            right: { x: h + r, y: k }
        };

        // Intercepts
        const xIntercepts = this._getXIntercepts();
        const yIntercepts = this._getYIntercepts();

        // Equation forms
        const equations = this._getEquationForms();

        this.properties = {
            center,
            radius: r,
            diameter,
            area,
            circumference,
            cardinalPoints,
            xIntercepts,
            yIntercepts,
            equations
        };

        return this.properties;
    }

    _getXIntercepts() {
        const { h, k, r } = this;
        const intercepts = [];

        // At y = 0: (x - h)² + k² = r² → (x - h)² = r² - k²
        const disc = r * r - k * k;
        if (disc >= 0) {
            const xOffset = Math.sqrt(disc);
            intercepts.push({ x: h + xOffset, y: 0 });
            if (xOffset > 0.0001) intercepts.push({ x: h - xOffset, y: 0 });
        }

        return intercepts;
    }

    _getYIntercepts() {
        const { h, k, r } = this;
        const intercepts = [];

        // At x = 0: h² + (y - k)² = r² → (y - k)² = r² - h²
        const disc = r * r - h * h;
        if (disc >= 0) {
            const yOffset = Math.sqrt(disc);
            intercepts.push({ x: 0, y: k + yOffset });
            if (yOffset > 0.0001) intercepts.push({ x: 0, y: k - yOffset });
        }

        return intercepts;
    }

    _getEquationForms() {
        const { h, k, r } = this;

        let standard, general, parametric;

        // Standard form
        if (h === 0 && k === 0) {
            standard = `x² + y² = ${this._fmt(r * r)}`;
        } else {
            standard = `(x ${this._fmtOff(-h)})² + (y ${this._fmtOff(-k)})² = ${this._fmt(r * r)}`;
        }

        // General form: x² + y² + Dx + Ey + F = 0 where D = -2h, E = -2k, F = h² + k² - r²
        const D = -2 * h;
        const E = -2 * k;
        const F = h * h + k * k - r * r;
        general = `x² + y² ${this._fmtCoef(D)}x ${this._fmtCoef(E)}y ${this._fmtCoef(F)} = 0`;

        // Parametric
        if (h === 0 && k === 0) {
            parametric = `x = ${this._fmt(r)}cos(θ), y = ${this._fmt(r)}sin(θ)`;
        } else {
            parametric = `x = ${this._fmt(h)} + ${this._fmt(r)}cos(θ), y = ${this._fmt(k)} + ${this._fmt(r)}sin(θ)`;
        }

        return { standard, general, parametric };
    }

    // =====================================================
    // PARAMETRIC REPRESENTATION
    // =====================================================

    /**
     * Get point on circle at angle θ (in radians)
     */
    getParametricPoint(theta) {
        const { h, k, r } = this;
        return {
            x: h + r * Math.cos(theta),
            y: k + r * Math.sin(theta),
            theta
        };
    }

    /**
     * Get angle θ from a point on the circle
     */
    getAngleFromPoint(x, y) {
        return Math.atan2(y - this.k, x - this.h);
    }

    // =====================================================
    // LINE TOOLS: TANGENT, CHORD, SECANT
    // =====================================================

    /**
     * Get tangent line at angle θ
     * Tangent at (h + r cos θ, k + r sin θ) has slope -cos(θ)/sin(θ) = -cot(θ)
     */
    getTangentAt(theta) {
        const { h, k, r } = this;
        const point = this.getParametricPoint(theta);

        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        // At top/bottom, tangent is horizontal
        if (Math.abs(sinT) < 0.0001) {
            return {
                type: 'tangent',
                point,
                theta,
                slope: 0,
                equation: `y = ${this._fmt(point.y)}`,
                isHorizontal: true,
                getY: () => point.y
            };
        }

        // At left/right, tangent is vertical
        if (Math.abs(cosT) < 0.0001) {
            return {
                type: 'tangent',
                point,
                theta,
                slope: Infinity,
                equation: `x = ${this._fmt(point.x)}`,
                isVertical: true
            };
        }

        const slope = -cosT / sinT;
        const yIntercept = point.y - slope * point.x;

        return {
            type: 'tangent',
            point,
            theta,
            slope,
            equation: this._formatLineEquation(slope, yIntercept),
            getY: (x) => slope * x + yIntercept
        };
    }

    /**
     * Get tangent lines by slope m
     * For circle (x-h)² + (y-k)² = r², tangent y = mx + c where c = k - mh ± r√(1 + m²)
     */
    getTangentBySlope(m) {
        const { h, k, r } = this;

        const offset = r * Math.sqrt(1 + m * m);
        const c1 = k - m * h + offset;
        const c2 = k - m * h - offset;

        // Points of tangency
        const denom = 1 + m * m;
        const x1 = h + m * (c1 - k) / denom * (-1);
        const y1 = m * x1 + c1;
        const x2 = h + m * (c2 - k) / denom * (-1);
        const y2 = m * x2 + c2;

        return [
            {
                type: 'tangent',
                point: { x: h - m * r / Math.sqrt(1 + m * m), y: k + r / Math.sqrt(1 + m * m) },
                slope: m,
                equation: this._formatLineEquation(m, c1),
                getY: (x) => m * x + c1
            },
            {
                type: 'tangent',
                point: { x: h + m * r / Math.sqrt(1 + m * m), y: k - r / Math.sqrt(1 + m * m) },
                slope: m,
                equation: this._formatLineEquation(m, c2),
                getY: (x) => m * x + c2
            }
        ];
    }

    /**
     * Get tangent lines from external point (x1, y1)
     */
    getTangentsFromPoint(x1, y1) {
        const { h, k, r } = this;

        // Distance from point to center
        const d = Math.sqrt((x1 - h) ** 2 + (y1 - k) ** 2);

        if (d < r - 0.0001) {
            return { error: 'Point is inside the circle' };
        }

        if (Math.abs(d - r) < 0.0001) {
            // Point is on the circle, return single tangent
            const theta = this.getAngleFromPoint(x1, y1);
            return [this.getTangentAt(theta)];
        }

        // Two tangents from external point
        // Tangent length: √(d² - r²)
        const tangentLength = Math.sqrt(d * d - r * r);

        // Angle from center to external point
        const angleToPoint = Math.atan2(y1 - k, x1 - h);

        // Half-angle for tangent contact points
        const halfAngle = Math.asin(r / d);

        const theta1 = angleToPoint + Math.PI / 2 + halfAngle;
        const theta2 = angleToPoint - Math.PI / 2 - halfAngle;

        return [
            this.getTangentAt(theta1),
            this.getTangentAt(theta2)
        ];
    }

    /**
     * Get chord between two angles
     */
    getChord(theta1, theta2) {
        const p1 = this.getParametricPoint(theta1);
        const p2 = this.getParametricPoint(theta2);

        if (Math.abs(p2.x - p1.x) < 0.0001) {
            return {
                type: 'chord',
                points: [p1, p2],
                theta: [theta1, theta2],
                slope: Infinity,
                equation: `x = ${this._fmt(p1.x)}`,
                isVertical: true,
                length: Math.abs(p2.y - p1.y),
                isDiameter: this._isDiameter(theta1, theta2)
            };
        }

        const slope = (p2.y - p1.y) / (p2.x - p1.x);
        const yIntercept = p1.y - slope * p1.x;
        const length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

        return {
            type: 'chord',
            points: [p1, p2],
            theta: [theta1, theta2],
            slope,
            equation: this._formatLineEquation(slope, yIntercept),
            length,
            isDiameter: this._isDiameter(theta1, theta2),
            getY: (x) => slope * x + yIntercept
        };
    }

    /**
     * Check if chord is a diameter (angles differ by π)
     */
    _isDiameter(theta1, theta2) {
        const diff = Math.abs(theta1 - theta2);
        return Math.abs(diff - Math.PI) < 0.01 || Math.abs(diff + Math.PI) < 0.01;
    }

    // =====================================================
    // ADVANCED: POWER OF A POINT
    // =====================================================

    /**
     * Power of point P with respect to circle
     * Power = d² - r² where d is distance from P to center
     */
    getPowerOfPoint(px, py) {
        const { h, k, r } = this;
        const d = Math.sqrt((px - h) ** 2 + (py - k) ** 2);
        return d * d - r * r;
    }

    /**
     * Tangent length from external point
     */
    getTangentLength(px, py) {
        const power = this.getPowerOfPoint(px, py);
        if (power < 0) return { error: 'Point is inside the circle' };
        return Math.sqrt(power);
    }

    // =====================================================
    // PLOTTING
    // =====================================================

    generatePlotPoints(steps = 100) {
        const points = [];
        const dTheta = (2 * Math.PI) / steps;

        for (let i = 0; i <= steps; i++) {
            const theta = i * dTheta;
            points.push(this.getParametricPoint(theta));
        }

        return points;
    }

    getViewBounds(padding = 1) {
        const { h, k, r } = this;
        return {
            minX: h - r - padding,
            maxX: h + r + padding,
            minY: k - r - padding,
            maxY: k + r + padding
        };
    }

    // =====================================================
    // FORMATTING HELPERS
    // =====================================================

    _fmt(n) {
        if (Number.isInteger(n)) return n.toString();
        if (Math.abs(n) < 0.0001) return '0';
        return n.toFixed(4).replace(/\.?0+$/, '');
    }

    _fmtOff(n) {
        if (Math.abs(n) < 0.0001) return '';
        if (n > 0) return `+ ${this._fmt(n)}`;
        return `- ${this._fmt(Math.abs(n))}`;
    }

    _fmtCoef(n) {
        if (Math.abs(n) < 0.0001) return '';
        if (n > 0) return `+ ${this._fmt(n)}`;
        return `- ${this._fmt(Math.abs(n))}`;
    }

    _formatLineEquation(m, c) {
        if (Math.abs(m) < 0.0001) {
            return `y = ${this._fmt(c)}`;
        }
        if (Math.abs(c) < 0.0001) {
            return `y = ${this._fmt(m)}x`;
        }
        if (c > 0) {
            return `y = ${this._fmt(m)}x + ${this._fmt(c)}`;
        }
        return `y = ${this._fmt(m)}x - ${this._fmt(Math.abs(c))}`;
    }
}

// Preset examples
const CIRCLE_PRESETS = [
    { id: 'unit', name: 'Unit Circle', equation: 'x² + y² = 1', description: 'Center (0,0), r = 1' },
    { id: 'basic', name: 'Basic Circle', equation: 'x² + y² = 4', description: 'Center (0,0), r = 2' },
    { id: 'shifted', name: 'Shifted Center', equation: '(x - 2)² + (y - 3)² = 9', description: 'Center (2,3), r = 3' },
    { id: 'large', name: 'Large Circle', equation: 'x² + y² = 25', description: 'Center (0,0), r = 5' },
    { id: 'offset', name: 'Offset Circle', equation: '(x + 1)² + (y - 3)² = 4', description: 'Center (-1,3), r = 2' },
    { id: 'general', name: 'General Form', equation: 'x² + y² + 6x - 4y - 3 = 0', description: 'Center (-3, 2), r = 4' }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvancedCircleEngine, CIRCLE_PRESETS };
}
