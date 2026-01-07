/**
 * Advanced Parabola Engine - Comprehensive Coordinate Geometry
 * 
 * Features:
 * - Multiple forms: y² = 4ax, x² = 4ay, (y-k)² = 4a(x-h), (x-h)² = 4a(y-k)
 * - Parametric representation: (at², 2at)
 * - Bidirectional input: define by equation, focus, directrix, vertex, or latus rectum
 * - Line tools: tangent, normal, chord with multiple input methods
 * - Advanced constructions: director circle, chord of contact, focal chord, diameter
 */

class AdvancedParabolaEngine {
    constructor() {
        this.reset();
    }

    reset() {
        // Canonical parameters (all parabolas reduce to this)
        this.a = 1;          // Parameter 'a' in y² = 4ax
        this.h = 0;          // Vertex x
        this.k = 0;          // Vertex y
        this.orientation = 'right'; // 'right', 'left', 'up', 'down'

        // Derived properties
        this.properties = null;

        // Active lines (tangent, normal, chord)
        this.lines = [];

        // Parametric point
        this.currentT = 1;
    }

    // =====================================================
    // BIDIRECTIONAL SETTERS - Any can define the parabola
    // =====================================================

    /**
     * Set from equation string
     * Supports: y² = 4ax, x² = 4ay, y = ax² + bx + c, x = ay² + by + c
     */
    setFromEquation(equation) {
        let eq = equation.replace(/\s+/g, '').toLowerCase();
        eq = eq.replace(/²/g, '^2');

        // Pattern: y^2 = 4ax or y² = 4ax (right-opening)
        let match = eq.match(/y\^2=(\d*\.?\d*)x/);
        if (match) {
            const coef = parseFloat(match[1]) || 4;
            this.a = coef / 4;
            this.h = 0;
            this.k = 0;
            this.orientation = 'right';
            return this.calculate();
        }

        // Pattern: y^2 = -4ax (left-opening)
        match = eq.match(/y\^2=-(\d*\.?\d*)x/);
        if (match) {
            const coef = parseFloat(match[1]) || 4;
            this.a = coef / 4;
            this.h = 0;
            this.k = 0;
            this.orientation = 'left';
            return this.calculate();
        }

        // Pattern: x^2 = 4ay (up-opening)
        match = eq.match(/x\^2=(\d*\.?\d*)y/);
        if (match) {
            const coef = parseFloat(match[1]) || 4;
            this.a = coef / 4;
            this.h = 0;
            this.k = 0;
            this.orientation = 'up';
            return this.calculate();
        }

        // Pattern: x^2 = -4ay (down-opening)
        match = eq.match(/x\^2=-(\d*\.?\d*)y/);
        if (match) {
            const coef = parseFloat(match[1]) || 4;
            this.a = coef / 4;
            this.h = 0;
            this.k = 0;
            this.orientation = 'down';
            return this.calculate();
        }

        // Pattern: y = ax^2 + bx + c (vertical, convert to standard form)
        match = eq.match(/y=([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)?x?([+-]\d*\.?\d*)?/);
        if (match) {
            const A = parseFloat(match[1]) || 1;
            const B = parseFloat(match[2]) || 0;
            const C = parseFloat(match[3]) || 0;

            // Convert to vertex form: y = A(x - h)² + k
            this.h = -B / (2 * A);
            this.k = C - (B * B) / (4 * A);
            this.a = 1 / (4 * Math.abs(A));
            this.orientation = A > 0 ? 'up' : 'down';
            return this.calculate();
        }

        // Pattern: (y-k)^2 = 4a(x-h) - shifted horizontal
        match = eq.match(/\(y([+-][\d.]+)?\)\^2=(\d*\.?\d*)\(x([+-][\d.]+)?\)/);
        if (match) {
            this.k = match[1] ? -parseFloat(match[1]) : 0;
            const coef = parseFloat(match[2]) || 4;
            this.a = coef / 4;
            this.h = match[3] ? -parseFloat(match[3]) : 0;
            this.orientation = 'right';
            return this.calculate();
        }

        return { error: 'Could not parse equation' };
    }

    /**
     * Set from focus coordinates
     */
    setFromFocus(fx, fy, vertexX = null, vertexY = null) {
        if (vertexX !== null && vertexY !== null) {
            this.h = vertexX;
            this.k = vertexY;

            // Determine orientation and 'a' from focus-vertex distance
            const dx = fx - vertexX;
            const dy = fy - vertexY;

            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal parabola
                this.a = Math.abs(dx);
                this.orientation = dx > 0 ? 'right' : 'left';
            } else {
                // Vertical parabola
                this.a = Math.abs(dy);
                this.orientation = dy > 0 ? 'up' : 'down';
            }
        } else {
            // Assume vertex at origin
            this.h = 0;
            this.k = 0;

            if (Math.abs(fx) > Math.abs(fy)) {
                this.a = Math.abs(fx);
                this.orientation = fx > 0 ? 'right' : 'left';
            } else {
                this.a = Math.abs(fy);
                this.orientation = fy > 0 ? 'up' : 'down';
            }
        }

        return this.calculate();
    }

    /**
     * Set from directrix
     * @param {string} directrixEq - Equation like "x = -2" or "y = 3"
     * @param {number} vertexX - Optional vertex x
     * @param {number} vertexY - Optional vertex y
     */
    setFromDirectrix(directrixEq, vertexX = null, vertexY = null) {
        const eq = directrixEq.replace(/\s+/g, '').toLowerCase();

        // Parse directrix: x = value or y = value
        let match = eq.match(/x=([+-]?\d*\.?\d+)/);
        if (match) {
            const dx = parseFloat(match[1]);
            if (vertexX !== null) {
                this.a = Math.abs(vertexX - dx);
                this.h = vertexX;
                this.k = vertexY || 0;
                this.orientation = vertexX > dx ? 'right' : 'left';
            } else {
                this.a = Math.abs(dx);
                this.h = 0;
                this.k = 0;
                this.orientation = dx < 0 ? 'right' : 'left';
            }
            return this.calculate();
        }

        match = eq.match(/y=([+-]?\d*\.?\d+)/);
        if (match) {
            const dy = parseFloat(match[1]);
            if (vertexY !== null) {
                this.a = Math.abs(vertexY - dy);
                this.h = vertexX || 0;
                this.k = vertexY;
                this.orientation = vertexY > dy ? 'up' : 'down';
            } else {
                this.a = Math.abs(dy);
                this.h = 0;
                this.k = 0;
                this.orientation = dy < 0 ? 'up' : 'down';
            }
            return this.calculate();
        }

        return { error: 'Invalid directrix format' };
    }

    /**
     * Set from latus rectum length
     */
    setFromLatusRectum(length, orientation = 'right', h = 0, k = 0) {
        this.a = length / 4;
        this.orientation = orientation;
        this.h = h;
        this.k = k;
        return this.calculate();
    }

    /**
     * Set from parameter 'a' directly
     */
    setFromParameter(a, orientation = 'right', h = 0, k = 0) {
        this.a = Math.abs(a);
        this.orientation = orientation;
        this.h = h;
        this.k = k;
        return this.calculate();
    }

    /**
     * Set vertex position (preserves 'a' and orientation)
     */
    setVertex(h, k) {
        this.h = h;
        this.k = k;
        return this.calculate();
    }

    // =====================================================
    // CALCULATE ALL PROPERTIES
    // =====================================================

    calculate() {
        const { a, h, k, orientation } = this;

        if (a <= 0) {
            return { error: 'Parameter a must be positive' };
        }

        // Vertex
        const vertex = { x: h, y: k };

        // Focus and directrix based on orientation
        let focus, directrix, axisOfSymmetry;

        switch (orientation) {
            case 'right':
                focus = { x: h + a, y: k };
                directrix = { type: 'vertical', value: h - a, equation: `x = ${this._fmt(h - a)}` };
                axisOfSymmetry = { type: 'horizontal', value: k, equation: `y = ${this._fmt(k)}` };
                break;
            case 'left':
                focus = { x: h - a, y: k };
                directrix = { type: 'vertical', value: h + a, equation: `x = ${this._fmt(h + a)}` };
                axisOfSymmetry = { type: 'horizontal', value: k, equation: `y = ${this._fmt(k)}` };
                break;
            case 'up':
                focus = { x: h, y: k + a };
                directrix = { type: 'horizontal', value: k - a, equation: `y = ${this._fmt(k - a)}` };
                axisOfSymmetry = { type: 'vertical', value: h, equation: `x = ${this._fmt(h)}` };
                break;
            case 'down':
                focus = { x: h, y: k - a };
                directrix = { type: 'horizontal', value: k + a, equation: `y = ${this._fmt(k + a)}` };
                axisOfSymmetry = { type: 'vertical', value: h, equation: `x = ${this._fmt(h)}` };
                break;
        }

        // Latus rectum
        const latusRectumLength = 4 * a;
        const latusRectumEndpoints = this._getLatusRectumEndpoints(focus, orientation, a);

        // Eccentricity (always 1 for parabola)
        const eccentricity = 1;

        // Equation forms
        const equations = this._getEquationForms();

        // Intercepts
        const xIntercepts = this._getXIntercepts();
        const yIntercepts = this._getYIntercepts();

        this.properties = {
            parameter: a,
            vertex,
            focus,
            directrix,
            axisOfSymmetry,
            latusRectumLength,
            latusRectumEndpoints,
            eccentricity,
            orientation,
            equations,
            xIntercepts,
            yIntercepts
        };

        return this.properties;
    }

    _getLatusRectumEndpoints(focus, orientation, a) {
        if (orientation === 'right' || orientation === 'left') {
            return [
                { x: focus.x, y: focus.y + 2 * a },
                { x: focus.x, y: focus.y - 2 * a }
            ];
        } else {
            return [
                { x: focus.x + 2 * a, y: focus.y },
                { x: focus.x - 2 * a, y: focus.y }
            ];
        }
    }

    _getEquationForms() {
        const { a, h, k, orientation } = this;
        const fourA = this._fmt(4 * a);

        let standard, parametric, general;

        switch (orientation) {
            case 'right':
                if (h === 0 && k === 0) {
                    standard = `y² = ${fourA}x`;
                } else {
                    standard = `(y ${this._fmtOff(-k)})² = ${fourA}(x ${this._fmtOff(-h)})`;
                }
                parametric = `x = ${this._fmt(a)}t², y = ${this._fmt(2 * a)}t`;
                break;
            case 'left':
                if (h === 0 && k === 0) {
                    standard = `y² = -${fourA}x`;
                } else {
                    standard = `(y ${this._fmtOff(-k)})² = -${fourA}(x ${this._fmtOff(-h)})`;
                }
                parametric = `x = -${this._fmt(a)}t², y = ${this._fmt(2 * a)}t`;
                break;
            case 'up':
                if (h === 0 && k === 0) {
                    standard = `x² = ${fourA}y`;
                } else {
                    standard = `(x ${this._fmtOff(-h)})² = ${fourA}(y ${this._fmtOff(-k)})`;
                }
                parametric = `x = ${this._fmt(2 * a)}t, y = ${this._fmt(a)}t²`;
                break;
            case 'down':
                if (h === 0 && k === 0) {
                    standard = `x² = -${fourA}y`;
                } else {
                    standard = `(x ${this._fmtOff(-h)})² = -${fourA}(y ${this._fmtOff(-k)})`;
                }
                parametric = `x = ${this._fmt(2 * a)}t, y = -${this._fmt(a)}t²`;
                break;
        }

        return { standard, parametric };
    }

    _getXIntercepts() {
        const { a, h, k, orientation } = this;
        const intercepts = [];

        if (orientation === 'up' || orientation === 'down') {
            // x² = ±4a(y - k), set y = 0
            const val = (orientation === 'up') ? -k : k;
            if (val * 4 * a >= 0) {
                const xOff = Math.sqrt(Math.abs(4 * a * val));
                intercepts.push({ x: h + xOff, y: 0 });
                if (xOff > 0.0001) intercepts.push({ x: h - xOff, y: 0 });
            }
        } else {
            // (y - k)² = ±4a(x - h), set y = 0
            const yOff = -k;
            const xVal = (yOff * yOff) / (4 * a);
            if (orientation === 'right') {
                intercepts.push({ x: h + xVal, y: 0 });
            } else {
                intercepts.push({ x: h - xVal, y: 0 });
            }
        }

        return intercepts;
    }

    _getYIntercepts() {
        const { a, h, k, orientation } = this;
        const intercepts = [];

        if (orientation === 'right' || orientation === 'left') {
            // (y - k)² = ±4a(x - h), set x = 0
            const xVal = -h;
            const ySquared = 4 * a * (orientation === 'right' ? xVal : -xVal);
            if (ySquared >= 0) {
                const yOff = Math.sqrt(ySquared);
                intercepts.push({ x: 0, y: k + yOff });
                if (yOff > 0.0001) intercepts.push({ x: 0, y: k - yOff });
            }
        } else {
            // (x - h)² = ±4a(y - k), set x = 0
            const xOff = -h;
            const yVal = (xOff * xOff) / (4 * a);
            if (orientation === 'up') {
                intercepts.push({ x: 0, y: k + yVal });
            } else {
                intercepts.push({ x: 0, y: k - yVal });
            }
        }

        return intercepts;
    }

    // =====================================================
    // PARAMETRIC REPRESENTATION
    // =====================================================

    /**
     * Get point on parabola at parameter t
     * For y² = 4ax: point is (at², 2at)
     */
    getParametricPoint(t) {
        const { a, h, k, orientation } = this;

        switch (orientation) {
            case 'right':
                return { x: h + a * t * t, y: k + 2 * a * t, t };
            case 'left':
                return { x: h - a * t * t, y: k + 2 * a * t, t };
            case 'up':
                return { x: h + 2 * a * t, y: k + a * t * t, t };
            case 'down':
                return { x: h + 2 * a * t, y: k - a * t * t, t };
        }
    }

    /**
     * Get parameter t from a point (inverse of getParametricPoint)
     */
    getParameterFromPoint(x, y) {
        const { a, h, k, orientation } = this;

        switch (orientation) {
            case 'right':
            case 'left':
                return (y - k) / (2 * a);
            case 'up':
            case 'down':
                return (x - h) / (2 * a);
        }
    }

    /**
     * Find the closest parameter t for a given point
     */
    getClosestParameter(px, py) {
        const { a, h, k, orientation } = this;

        // For horizontal parabola y² = 4ax
        if (orientation === 'right' || orientation === 'left') {
            // t = y / (2a), but we need to verify x matches
            const t = (py - k) / (2 * a);
            return t;
        } else {
            // For vertical parabola x² = 4ay
            const t = (px - h) / (2 * a);
            return t;
        }
    }

    // =====================================================
    // LINE TOOLS: TANGENT, NORMAL, CHORD
    // =====================================================

    /**
     * Get tangent line at parameter t
     * For y² = 4ax at (at², 2at): tangent is ty = x + at²
     */
    getTangentAt(t) {
        const { a, h, k, orientation } = this;
        const point = this.getParametricPoint(t);

        let slope, equation, yIntercept;

        switch (orientation) {
            case 'right':
                // ty = x + at² → y = (1/t)x + at
                if (Math.abs(t) < 0.0001) {
                    // Vertical tangent at vertex
                    return {
                        type: 'tangent',
                        point,
                        slope: Infinity,
                        equation: `x = ${this._fmt(h)}`,
                        isVertical: true
                    };
                }
                slope = 1 / t;
                yIntercept = k + a * t;
                equation = `y = ${this._fmt(slope)}x + ${this._fmt(yIntercept)}`;
                break;
            case 'left':
                if (Math.abs(t) < 0.0001) {
                    return { type: 'tangent', point, slope: Infinity, equation: `x = ${this._fmt(h)}`, isVertical: true };
                }
                slope = -1 / t;
                yIntercept = k + a * t;
                equation = `y = ${this._fmt(slope)}x + ${this._fmt(yIntercept)}`;
                break;
            case 'up':
                if (Math.abs(t) < 0.0001) {
                    return { type: 'tangent', point, slope: 0, equation: `y = ${this._fmt(k)}`, isHorizontal: true };
                }
                slope = t;
                yIntercept = k - a * t * t + slope * h;
                equation = `y = ${this._fmt(slope)}(x - ${this._fmt(h)}) + ${this._fmt(k)}`;
                break;
            case 'down':
                if (Math.abs(t) < 0.0001) {
                    return { type: 'tangent', point, slope: 0, equation: `y = ${this._fmt(k)}`, isHorizontal: true };
                }
                slope = -t;
                yIntercept = k + a * t * t + slope * h;
                equation = `y = ${this._fmt(slope)}(x - ${this._fmt(h)}) + ${this._fmt(k)}`;
                break;
        }

        return {
            type: 'tangent',
            point,
            t,
            slope,
            equation,
            // Line data for rendering
            getY: (x) => slope * (x - h) + point.y - slope * (point.x - h)
        };
    }

    /**
     * Get tangent line by slope
     * For y² = 4ax with slope m: y = mx + a/m
     */
    getTangentBySlope(m) {
        const { a, h, k, orientation } = this;

        if (Math.abs(m) < 0.0001) {
            return { error: 'Slope cannot be zero for this orientation' };
        }

        let equation, yIntercept, point;

        switch (orientation) {
            case 'right':
                yIntercept = k + a / m;
                equation = `y = ${this._fmt(m)}x + ${this._fmt(yIntercept)}`;
                // Point of tangency: (a/m², 2a/m)
                point = { x: h + a / (m * m), y: k + 2 * a / m };
                break;
            case 'left':
                yIntercept = k - a / m;
                equation = `y = ${this._fmt(m)}x + ${this._fmt(yIntercept)}`;
                point = { x: h - a / (m * m), y: k + 2 * a / m };
                break;
            case 'up':
                yIntercept = k - a * m * m;
                equation = `y = ${this._fmt(m)}x + ${this._fmt(yIntercept - m * h)}`;
                point = { x: h + 2 * a * m, y: k + a * m * m };
                break;
            case 'down':
                yIntercept = k + a * m * m;
                equation = `y = ${this._fmt(m)}x + ${this._fmt(yIntercept - m * h)}`;
                point = { x: h + 2 * a * m, y: k - a * m * m };
                break;
        }

        return {
            type: 'tangent',
            point,
            slope: m,
            equation,
            getY: (x) => m * x + yIntercept - m * h
        };
    }

    /**
     * Get normal line at parameter t
     * Normal is perpendicular to tangent
     */
    getNormalAt(t) {
        const { a, h, k, orientation } = this;
        const point = this.getParametricPoint(t);
        const tangent = this.getTangentAt(t);

        if (tangent.isVertical) {
            // Normal is horizontal
            return {
                type: 'normal',
                point,
                t,
                slope: 0,
                equation: `y = ${this._fmt(point.y)}`,
                isHorizontal: true
            };
        }

        if (tangent.isHorizontal) {
            return {
                type: 'normal',
                point,
                t,
                slope: Infinity,
                equation: `x = ${this._fmt(point.x)}`,
                isVertical: true
            };
        }

        const normalSlope = -1 / tangent.slope;
        const equation = `y = ${this._fmt(normalSlope)}(x - ${this._fmt(point.x)}) + ${this._fmt(point.y)}`;

        return {
            type: 'normal',
            point,
            t,
            slope: normalSlope,
            equation,
            getY: (x) => normalSlope * (x - point.x) + point.y
        };
    }

    /**
     * Get chord between two parametric points t1 and t2
     */
    getChord(t1, t2) {
        const p1 = this.getParametricPoint(t1);
        const p2 = this.getParametricPoint(t2);

        if (Math.abs(p2.x - p1.x) < 0.0001) {
            // Vertical chord
            return {
                type: 'chord',
                points: [p1, p2],
                t: [t1, t2],
                slope: Infinity,
                equation: `x = ${this._fmt(p1.x)}`,
                isVertical: true,
                isFocalChord: this._isFocalChord(t1, t2)
            };
        }

        const slope = (p2.y - p1.y) / (p2.x - p1.x);
        const equation = `y = ${this._fmt(slope)}(x - ${this._fmt(p1.x)}) + ${this._fmt(p1.y)}`;

        return {
            type: 'chord',
            points: [p1, p2],
            t: [t1, t2],
            slope,
            equation,
            isFocalChord: this._isFocalChord(t1, t2),
            getY: (x) => slope * (x - p1.x) + p1.y
        };
    }

    /**
     * Check if chord is a focal chord (passes through focus)
     * For y² = 4ax, focal chord has t1 * t2 = -1
     */
    _isFocalChord(t1, t2) {
        return Math.abs(t1 * t2 + 1) < 0.01;
    }

    /**
     * Get focal chord at parameter t (the other end is at -1/t)
     */
    getFocalChord(t) {
        if (Math.abs(t) < 0.0001) {
            return { error: 't cannot be zero for focal chord' };
        }
        return this.getChord(t, -1 / t);
    }

    // =====================================================
    // ADVANCED CONSTRUCTIONS
    // =====================================================

    /**
     * Get chord of contact from external point (x1, y1)
     * For y² = 4ax: yy₁ = 2a(x + x₁)
     */
    getChordOfContact(x1, y1) {
        const { a, h, k, orientation } = this;

        // Adjust for translation
        const px = x1 - h;
        const py = y1 - k;

        let equation;

        switch (orientation) {
            case 'right':
            case 'left':
                // yy₁ = 2a(x + x₁) shifted
                equation = `${this._fmt(py)}y = ${this._fmt(2 * a)}(x + ${this._fmt(px)})`;
                break;
            case 'up':
            case 'down':
                equation = `${this._fmt(px)}x = ${this._fmt(2 * a)}(y + ${this._fmt(py)})`;
                break;
        }

        return {
            type: 'chord_of_contact',
            externalPoint: { x: x1, y: y1 },
            equation
        };
    }

    /**
     * Get diameter of parabola for chords with slope m
     * For y² = 4ax: diameter is y = 2a/m
     */
    getDiameter(m) {
        const { a, k, orientation } = this;

        if (Math.abs(m) < 0.0001) {
            return { error: 'Slope cannot be zero' };
        }

        let equation, value;

        switch (orientation) {
            case 'right':
            case 'left':
                value = k + 2 * a / m;
                equation = `y = ${this._fmt(value)}`;
                return { type: 'diameter', slope: m, equation, value, isHorizontal: true };
            case 'up':
            case 'down':
                value = this.h + 2 * a / m;
                equation = `x = ${this._fmt(value)}`;
                return { type: 'diameter', slope: m, equation, value, isVertical: true };
        }
    }

    /**
     * Get director circle
     * For parabola y² = 4ax: the directrix is x = -a (not a circle)
     * But the locus of intersection of perpendicular tangents is the directrix
     */
    getDirectorCircle() {
        // For a parabola, perpendicular tangents meet on the directrix
        return {
            type: 'director_locus',
            description: 'For a parabola, perpendicular tangents meet on the directrix',
            locus: this.properties?.directrix
        };
    }

    /**
     * Get normal chord - chord joining feet of two normals
     */
    getNormalChord(t) {
        // For normal at t, it meets parabola again at t' where t' = -t - 2/t
        if (Math.abs(t) < 0.0001) {
            return { error: 't cannot be zero' };
        }
        const t2 = -t - 2 / t;
        return this.getChord(t, t2);
    }

    // =====================================================
    // PLOTTING
    // =====================================================

    generatePlotPoints(tMin = -5, tMax = 5, steps = 200) {
        const points = [];
        const dt = (tMax - tMin) / steps;

        for (let i = 0; i <= steps; i++) {
            const t = tMin + i * dt;
            points.push(this.getParametricPoint(t));
        }

        return points;
    }

    getViewBounds(padding = 2) {
        const { a, h, k, orientation } = this;
        const extent = Math.max(4 * a, 3) + padding;

        switch (orientation) {
            case 'right':
                return { minX: h - padding, maxX: h + extent, minY: k - extent / 2, maxY: k + extent / 2 };
            case 'left':
                return { minX: h - extent, maxX: h + padding, minY: k - extent / 2, maxY: k + extent / 2 };
            case 'up':
                return { minX: h - extent / 2, maxX: h + extent / 2, minY: k - padding, maxY: k + extent };
            case 'down':
                return { minX: h - extent / 2, maxX: h + extent / 2, minY: k - extent, maxY: k + padding };
        }
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
}

// Preset examples
const PARABOLA_PRESETS = [
    { id: 'standard', name: 'Standard (y² = 4x)', equation: 'y² = 4x', description: 'a = 1, opens right' },
    { id: 'wide', name: 'Wide (y² = 8x)', equation: 'y² = 8x', description: 'a = 2, opens right' },
    { id: 'narrow', name: 'Narrow (y² = 2x)', equation: 'y² = 2x', description: 'a = 0.5, opens right' },
    { id: 'left', name: 'Left Opening', equation: 'y² = -4x', description: 'Opens left' },
    { id: 'up', name: 'Up Opening', equation: 'x² = 4y', description: 'Opens up' },
    { id: 'down', name: 'Down Opening', equation: 'x² = -4y', description: 'Opens down' },
    { id: 'vertex', name: 'Vertex Form', equation: 'y = x² - 4x + 3', description: 'Vertex at (2, -1)' },
    { id: 'shifted', name: 'Shifted', equation: '(y - 2)² = 8(x - 1)', description: 'Vertex at (1, 2)' }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvancedParabolaEngine, PARABOLA_PRESETS };
}
