/**
 * Straight Lines Engine - Comprehensive Coordinate Geometry
 * 
 * Features:
 * - Multiple equation forms (slope-intercept, point-slope, two-point, intercept, normal, general)
 * - Two-line operations (angle, intersection, bisectors)
 * - Triangle centers (centroid, incentre, orthocentre, circumcentre)
 * - Family of lines through intersection
 * - Pair of straight lines from second-degree equations
 */

class StraightLinesEngine {
    constructor() {
        this.lines = [];
        this.points = [];
        this.activeLine = null;
    }

    // =====================================================
    // LINE CLASS
    // =====================================================

    /**
     * Create a line from slope-intercept form: y = mx + c
     */
    static fromSlopeIntercept(m, c) {
        return new Line({ type: 'slope-intercept', m, c });
    }

    /**
     * Create a line from point-slope form: y - y1 = m(x - x1)
     */
    static fromPointSlope(x1, y1, m) {
        const c = y1 - m * x1;
        return new Line({ type: 'point-slope', m, c, point: { x: x1, y: y1 } });
    }

    /**
     * Create a line from two points
     */
    static fromTwoPoints(x1, y1, x2, y2) {
        if (Math.abs(x2 - x1) < 0.0001) {
            return new Line({ type: 'vertical', x: x1 });
        }
        const m = (y2 - y1) / (x2 - x1);
        const c = y1 - m * x1;
        return new Line({ type: 'two-point', m, c, points: [{ x: x1, y: y1 }, { x: x2, y: y2 }] });
    }

    /**
     * Create a line from intercept form: x/a + y/b = 1
     */
    static fromIntercepts(a, b) {
        if (Math.abs(a) < 0.0001 || Math.abs(b) < 0.0001) {
            return { error: 'Intercepts cannot be zero' };
        }
        // Convert to general: bx + ay = ab → bx + ay - ab = 0
        return new Line({ type: 'intercept', A: b, B: a, C: -a * b, xInt: a, yInt: b });
    }

    /**
     * Create a line from normal form: x cos α + y sin α = p
     */
    static fromNormalForm(alpha, p) {
        const cosA = Math.cos(alpha);
        const sinA = Math.sin(alpha);
        return new Line({ type: 'normal', A: cosA, B: sinA, C: -p, alpha, p });
    }

    /**
     * Create a line from general form: Ax + By + C = 0
     */
    static fromGeneral(A, B, C) {
        return new Line({ type: 'general', A, B, C });
    }

    /**
     * Parse equation string
     */
    static parseEquation(equation) {
        let eq = equation.replace(/\s+/g, '').toLowerCase();

        // y = mx + c
        let match = eq.match(/y=([+-]?[\d.]*)?x([+-][\d.]+)?$/);
        if (match) {
            const m = match[1] === '' || match[1] === '+' ? 1 : match[1] === '-' ? -1 : parseFloat(match[1]);
            const c = match[2] ? parseFloat(match[2]) : 0;
            return StraightLinesEngine.fromSlopeIntercept(m, c);
        }

        // y = c (horizontal)
        match = eq.match(/y=([+-]?[\d.]+)$/);
        if (match) {
            return new Line({ type: 'horizontal', y: parseFloat(match[1]) });
        }

        // x = a (vertical)
        match = eq.match(/x=([+-]?[\d.]+)$/);
        if (match) {
            return new Line({ type: 'vertical', x: parseFloat(match[1]) });
        }

        // x/a + y/b = 1
        match = eq.match(/x\/([+-]?[\d.]+)\+y\/([+-]?[\d.]+)=1/);
        if (match) {
            return StraightLinesEngine.fromIntercepts(parseFloat(match[1]), parseFloat(match[2]));
        }

        // Ax + By + C = 0 or Ax + By = C
        match = eq.match(/([+-]?[\d.]*)x([+-][\d.]*)y([+-][\d.]+)?=([+-]?[\d.]+)?/);
        if (match) {
            const A = match[1] === '' || match[1] === '+' ? 1 : match[1] === '-' ? -1 : parseFloat(match[1]);
            const B = match[2] === '+' ? 1 : match[2] === '-' ? -1 : parseFloat(match[2]);
            const C = (match[3] ? parseFloat(match[3]) : 0) - (match[4] ? parseFloat(match[4]) : 0);
            return StraightLinesEngine.fromGeneral(A, B, C);
        }

        return { error: 'Could not parse equation' };
    }
}

// =====================================================
// LINE CLASS
// =====================================================

class Line {
    constructor(params) {
        Object.assign(this, params);
        this._normalize();
    }

    _normalize() {
        // Ensure we have A, B, C for general form
        if (this.type === 'slope-intercept' || this.type === 'point-slope' || this.type === 'two-point') {
            // y = mx + c → mx - y + c = 0
            this.A = this.m;
            this.B = -1;
            this.C = this.c;
        } else if (this.type === 'horizontal') {
            // y = k → 0x + 1y - k = 0
            this.A = 0;
            this.B = 1;
            this.C = -this.y;
            this.m = 0;
            this.c = this.y;
        } else if (this.type === 'vertical') {
            // x = k → 1x + 0y - k = 0
            this.A = 1;
            this.B = 0;
            this.C = -this.x;
            this.m = Infinity;
        }

        // Calculate slope and intercept from general form if not already set
        if (this.m === undefined && this.B !== 0) {
            this.m = -this.A / this.B;
            this.c = -this.C / this.B;
        }

        // Calculate intercepts
        if (this.xInt === undefined) {
            this.xInt = this.A !== 0 ? -this.C / this.A : null;
        }
        if (this.yInt === undefined) {
            this.yInt = this.B !== 0 ? -this.C / this.B : null;
        }
    }

    /**
     * Get y value for given x
     */
    getY(x) {
        if (this.type === 'vertical') return null;
        if (this.type === 'horizontal') return this.y;
        return this.m * x + this.c;
    }

    /**
     * Get x value for given y
     */
    getX(y) {
        if (this.type === 'horizontal') return null;
        if (this.type === 'vertical') return this.x;
        return (y - this.c) / this.m;
    }

    /**
     * Check if point is on line
     */
    containsPoint(x, y) {
        return Math.abs(this.A * x + this.B * y + this.C) < 0.0001;
    }

    /**
     * Get distance from point to line
     */
    distanceFromPoint(x, y) {
        const num = Math.abs(this.A * x + this.B * y + this.C);
        const den = Math.sqrt(this.A * this.A + this.B * this.B);
        return num / den;
    }

    /**
     * Get perpendicular foot from point to line
     */
    getPerpendicularFoot(px, py) {
        const A = this.A, B = this.B, C = this.C;
        const denom = A * A + B * B;
        const x = (B * B * px - A * B * py - A * C) / denom;
        const y = (A * A * py - A * B * px - B * C) / denom;
        return { x, y };
    }

    /**
     * Get parallel line through point
     */
    getParallelThrough(px, py) {
        // Ax + By + C' = 0 where C' = -Ax - By
        const C = -(this.A * px + this.B * py);
        return new Line({ type: 'general', A: this.A, B: this.B, C });
    }

    /**
     * Get perpendicular line through point
     */
    getPerpendicularThrough(px, py) {
        // Bx - Ay + C' = 0 where C' = -Bx + Ay
        const C = -(this.B * px - this.A * py);
        return new Line({ type: 'general', A: this.B, B: -this.A, C });
    }

    /**
     * Get equation strings
     */
    getEquations() {
        const fmt = (n) => {
            if (Number.isInteger(n)) return n.toString();
            return n.toFixed(3).replace(/\.?0+$/, '');
        };

        const fmtCoef = (n, isFirst = false) => {
            if (Math.abs(n) < 0.0001) return '';
            if (n === 1) return isFirst ? '' : '+';
            if (n === -1) return '-';
            return (n > 0 && !isFirst ? '+' : '') + fmt(n);
        };

        const equations = {};

        // Slope-intercept form
        if (this.m !== undefined && this.m !== Infinity) {
            if (Math.abs(this.c) < 0.0001) {
                equations.slopeIntercept = `y = ${fmt(this.m)}x`;
            } else if (this.c > 0) {
                equations.slopeIntercept = `y = ${fmt(this.m)}x + ${fmt(this.c)}`;
            } else {
                equations.slopeIntercept = `y = ${fmt(this.m)}x - ${fmt(Math.abs(this.c))}`;
            }
        }

        // General form
        let gen = '';
        if (Math.abs(this.A) > 0.0001) gen += `${fmtCoef(this.A, true)}x`;
        if (Math.abs(this.B) > 0.0001) gen += ` ${fmtCoef(this.B)}y`;
        if (Math.abs(this.C) > 0.0001) gen += ` ${fmtCoef(this.C)}`;
        equations.general = gen.trim() + ' = 0';

        // Intercept form (if both intercepts exist and non-zero)
        if (this.xInt && this.yInt && Math.abs(this.xInt) > 0.0001 && Math.abs(this.yInt) > 0.0001) {
            equations.intercept = `x/${fmt(this.xInt)} + y/${fmt(this.yInt)} = 1`;
        }

        return equations;
    }
}

// =====================================================
// TWO-LINE OPERATIONS
// =====================================================

class TwoLineOperations {
    /**
     * Get angle between two lines (in radians)
     */
    static angleBetween(line1, line2) {
        if (line1.m === Infinity || line2.m === Infinity) {
            // One vertical line
            const other = line1.m === Infinity ? line2 : line1;
            return Math.abs(Math.atan(other.m) - Math.PI / 2);
        }

        const tanTheta = Math.abs((line1.m - line2.m) / (1 + line1.m * line2.m));
        return Math.atan(tanTheta);
    }

    /**
     * Check if lines are parallel
     */
    static areParallel(line1, line2) {
        return Math.abs(line1.A * line2.B - line2.A * line1.B) < 0.0001;
    }

    /**
     * Check if lines are perpendicular
     */
    static arePerpendicular(line1, line2) {
        return Math.abs(line1.A * line2.A + line1.B * line2.B) < 0.0001;
    }

    /**
     * Get intersection point
     */
    static getIntersection(line1, line2) {
        const det = line1.A * line2.B - line2.A * line1.B;
        if (Math.abs(det) < 0.0001) {
            return null; // Parallel lines
        }
        const x = (line1.B * line2.C - line2.B * line1.C) / det;
        const y = (line2.A * line1.C - line1.A * line2.C) / det;
        return { x: -x, y: -y };
    }

    /**
     * Get distance between parallel lines
     */
    static distanceBetweenParallel(line1, line2) {
        if (!this.areParallel(line1, line2)) return null;
        const num = Math.abs(line1.C - line2.C);
        const den = Math.sqrt(line1.A * line1.A + line1.B * line1.B);
        return num / den;
    }

    /**
     * Get angle bisectors
     */
    static getAngleBisectors(line1, line2) {
        const norm1 = Math.sqrt(line1.A ** 2 + line1.B ** 2);
        const norm2 = Math.sqrt(line2.A ** 2 + line2.B ** 2);

        // (A1x + B1y + C1)/√(A1² + B1²) = ±(A2x + B2y + C2)/√(A2² + B2²)
        // Bisector 1: (A1/n1 - A2/n2)x + (B1/n1 - B2/n2)y + (C1/n1 - C2/n2) = 0
        // Bisector 2: (A1/n1 + A2/n2)x + (B1/n1 + B2/n2)y + (C1/n1 + C2/n2) = 0

        const A1 = line1.A / norm1, B1 = line1.B / norm1, C1 = line1.C / norm1;
        const A2 = line2.A / norm2, B2 = line2.B / norm2, C2 = line2.C / norm2;

        const bisector1 = new Line({ type: 'general', A: A1 - A2, B: B1 - B2, C: C1 - C2 });
        const bisector2 = new Line({ type: 'general', A: A1 + A2, B: B1 + B2, C: C1 + C2 });

        return [bisector1, bisector2];
    }

    /**
     * Get family of lines through intersection: L1 + kL2 = 0
     */
    static getFamilyLine(line1, line2, k) {
        return new Line({
            type: 'general',
            A: line1.A + k * line2.A,
            B: line1.B + k * line2.B,
            C: line1.C + k * line2.C
        });
    }
}

// =====================================================
// TRIANGLE OPERATIONS
// =====================================================

class TriangleOperations {
    constructor(p1, p2, p3) {
        this.vertices = [p1, p2, p3];
        this.sides = this._calculateSides();
    }

    _calculateSides() {
        const [A, B, C] = this.vertices;
        return {
            a: Math.sqrt((B.x - C.x) ** 2 + (B.y - C.y) ** 2), // BC
            b: Math.sqrt((A.x - C.x) ** 2 + (A.y - C.y) ** 2), // AC
            c: Math.sqrt((A.x - B.x) ** 2 + (A.y - B.y) ** 2)  // AB
        };
    }

    /**
     * Get area using shoelace formula
     */
    getArea() {
        const [A, B, C] = this.vertices;
        return Math.abs(A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) / 2;
    }

    /**
     * Get centroid (intersection of medians)
     */
    getCentroid() {
        const [A, B, C] = this.vertices;
        return {
            x: (A.x + B.x + C.x) / 3,
            y: (A.y + B.y + C.y) / 3,
            name: 'Centroid'
        };
    }

    /**
     * Get incentre (intersection of angle bisectors)
     */
    getIncentre() {
        const [A, B, C] = this.vertices;
        const { a, b, c } = this.sides;
        const perimeter = a + b + c;
        return {
            x: (a * A.x + b * B.x + c * C.x) / perimeter,
            y: (a * A.y + b * B.y + c * C.y) / perimeter,
            name: 'Incentre'
        };
    }

    /**
     * Get circumcentre (intersection of perpendicular bisectors)
     */
    getCircumcentre() {
        const [A, B, C] = this.vertices;
        const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
        if (Math.abs(d) < 0.0001) return null; // Collinear

        const ux = ((A.x ** 2 + A.y ** 2) * (B.y - C.y) + (B.x ** 2 + B.y ** 2) * (C.y - A.y) + (C.x ** 2 + C.y ** 2) * (A.y - B.y)) / d;
        const uy = ((A.x ** 2 + A.y ** 2) * (C.x - B.x) + (B.x ** 2 + B.y ** 2) * (A.x - C.x) + (C.x ** 2 + C.y ** 2) * (B.x - A.x)) / d;

        return { x: ux, y: uy, name: 'Circumcentre' };
    }

    /**
     * Get orthocentre (intersection of altitudes)
     */
    getOrthocentre() {
        const [A, B, C] = this.vertices;

        // Altitude from A to BC
        const lineBC = StraightLinesEngine.fromTwoPoints(B.x, B.y, C.x, C.y);
        const altA = lineBC.getPerpendicularThrough(A.x, A.y);

        // Altitude from B to AC
        const lineAC = StraightLinesEngine.fromTwoPoints(A.x, A.y, C.x, C.y);
        const altB = lineAC.getPerpendicularThrough(B.x, B.y);

        const H = TwoLineOperations.getIntersection(altA, altB);
        if (H) H.name = 'Orthocentre';
        return H;
    }

    /**
     * Get all medians
     */
    getMedians() {
        const [A, B, C] = this.vertices;
        return [
            { from: A, to: { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 }, name: 'Median from A' },
            { from: B, to: { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 }, name: 'Median from B' },
            { from: C, to: { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }, name: 'Median from C' }
        ];
    }

    /**
     * Get all altitudes
     */
    getAltitudes() {
        const [A, B, C] = this.vertices;
        const lineBC = StraightLinesEngine.fromTwoPoints(B.x, B.y, C.x, C.y);
        const lineAC = StraightLinesEngine.fromTwoPoints(A.x, A.y, C.x, C.y);
        const lineAB = StraightLinesEngine.fromTwoPoints(A.x, A.y, B.x, B.y);

        return [
            { from: A, line: lineBC.getPerpendicularThrough(A.x, A.y), name: 'Altitude from A' },
            { from: B, line: lineAC.getPerpendicularThrough(B.x, B.y), name: 'Altitude from B' },
            { from: C, line: lineAB.getPerpendicularThrough(C.x, C.y), name: 'Altitude from C' }
        ];
    }
}

// =====================================================
// PAIR OF STRAIGHT LINES
// =====================================================

class PairOfLines {
    /**
     * Parse homogeneous equation: ax² + 2hxy + by² = 0
     * Returns two lines through origin
     */
    static fromHomogeneous(a, h, b) {
        // Lines: y/x = m where am² + 2hm + b = 0... wait, that's wrong
        // Actually: y = mx where bm² + 2hm + a = 0 (divide by x²)
        const disc = h * h - a * b;
        if (disc < 0) return { error: 'No real lines (discriminant < 0)' };

        const sqrtDisc = Math.sqrt(disc);
        const m1 = (-h + sqrtDisc) / b;
        const m2 = (-h - sqrtDisc) / b;

        const line1 = StraightLinesEngine.fromSlopeIntercept(m1, 0);
        const line2 = StraightLinesEngine.fromSlopeIntercept(m2, 0);

        // Angle between lines
        const tanAngle = Math.abs(2 * sqrtDisc / (a + b));
        const angle = Math.atan(tanAngle);

        return { line1, line2, angle, slopes: [m1, m2] };
    }

    /**
     * Parse general second degree: ax² + 2hxy + by² + 2gx + 2fy + c = 0
     * Condition: abc + 2fgh - af² - bg² - ch² = 0
     */
    static fromGeneral(a, h, b, g, f, c) {
        const delta = a * b * c + 2 * f * g * h - a * f * f - b * g * g - c * h * h;
        if (Math.abs(delta) > 0.01) {
            return { error: 'Not a pair of lines (Δ ≠ 0)', delta };
        }

        // Find point of intersection
        const det = a * b - h * h;
        if (Math.abs(det) < 0.0001) {
            return { error: 'Parallel lines or degenerate case' };
        }

        const x0 = (h * f - b * g) / det;
        const y0 = (h * g - a * f) / det;

        // Get slopes from homogeneous part
        const homoResult = this.fromHomogeneous(a, h, b);
        if (homoResult.error) return homoResult;

        // Create lines through (x0, y0) with those slopes
        const line1 = StraightLinesEngine.fromPointSlope(x0, y0, homoResult.slopes[0]);
        const line2 = StraightLinesEngine.fromPointSlope(x0, y0, homoResult.slopes[1]);

        return {
            line1,
            line2,
            intersection: { x: x0, y: y0 },
            angle: homoResult.angle
        };
    }
}

// =====================================================
// PRESETS
// =====================================================

const STRAIGHT_LINE_PRESETS = [
    { name: 'Slope-Intercept', equation: 'y = 2x + 3', description: 'm = 2, c = 3' },
    { name: 'Horizontal', equation: 'y = 4', description: 'Parallel to x-axis' },
    { name: 'Vertical', equation: 'x = 2', description: 'Parallel to y-axis' },
    { name: 'Intercept Form', equation: 'x/3 + y/4 = 1', description: 'x-int=3, y-int=4' },
    { name: 'Through Origin', equation: 'y = -x', description: '45° line, negative slope' },
    { name: 'General Form', equation: '2x + 3y - 6 = 0', description: 'Standard form' }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StraightLinesEngine, Line, TwoLineOperations, TriangleOperations, PairOfLines, STRAIGHT_LINE_PRESETS };
}
