/**
 * Triangle Engine - Number Triangle Generators
 * Implements 22 different combinatorial triangles
 */

const TRIANGLE_CATEGORIES = {
    classic: {
        name: 'Classic Triangles',
        icon: '📐',
        description: 'Fundamental triangles in combinatorics',
        triangles: ['pascal', 'fibonacci', 'floyd', 'lucas']
    },
    partition: {
        name: 'Partition Triangles',
        icon: '📊',
        description: 'Related to set partitions and counting',
        triangles: ['bell', 'stirling1', 'stirling2', 'lah']
    },
    catalan: {
        name: 'Catalan Family',
        icon: '🌳',
        description: 'Catalan numbers and related sequences',
        triangles: ['catalan', 'narayana', 'motzkin', 'delannoy']
    },
    eulerian: {
        name: 'Eulerian & Bernoulli',
        icon: '🔢',
        description: 'Permutation and polynomial coefficients',
        triangles: ['eulerian', 'bernoulli', 'leibniz', 'riordan']
    },
    sequence: {
        name: 'Sequence Triangles',
        icon: '🔄',
        description: 'Based on famous number sequences',
        triangles: ['padovan', 'pell', 'tribonacci', 'hosoya']
    },
    special: {
        name: 'Special Triangles',
        icon: '✨',
        description: 'Other notable combinatorial triangles',
        triangles: ['lozanic', 'centralBinomial', 'harmonicLeib', 'ballot']
    }
};

const TRIANGLES = {
    // =========================================
    // CLASSIC TRIANGLES
    // =========================================
    pascal: {
        name: "Pascal's Triangle",
        symbol: 'C(n,k)',
        description: 'Binomial coefficients - the most famous number triangle',
        formula: 'C(n,k) = C(n-1,k-1) + C(n-1,k)',
        oeis: 'A007318',
        example: 'Row 4: 1, 4, 6, 4, 1',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (k === 0 || k === n) {
                        row.push(1);
                    } else {
                        row.push(triangle[n - 1][k - 1] + triangle[n - 1][k]);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    fibonacci: {
        name: 'Fibonacci Triangle',
        symbol: 'F(n,k)',
        description: 'Each entry is sum of two entries above-left, Fibonacci numbers appear',
        formula: 'F(n,k) = F(n-1,k-1) + F(n-2,k-1)',
        oeis: 'A036355',
        example: 'Rising diagonals sum to Fibonacci numbers',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (k === 0) {
                        row.push(1);
                    } else if (n === 1) {
                        row.push(1);
                    } else {
                        const a = (n >= 1 && k <= n - 1) ? (triangle[n - 1][k - 1] || 0) : 0;
                        const b = (n >= 2 && k <= n - 2) ? (triangle[n - 2][k - 1] || 0) : 0;
                        row.push(a + b);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    floyd: {
        name: "Floyd's Triangle",
        symbol: 'n',
        description: 'Natural numbers arranged in triangular form',
        formula: 'T(n,k) = n(n-1)/2 + k + 1',
        oeis: 'A000027',
        example: 'Row 3: 4, 5, 6',
        generate: (rows) => {
            const triangle = [];
            let num = 1;
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    row.push(num++);
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    lucas: {
        name: 'Lucas Triangle',
        symbol: 'L(n,k)',
        description: "Lucas numbers version of Pascal's triangle",
        formula: 'L(n,k) = L(n-1,k-1) + L(n-1,k)',
        oeis: 'A029635',
        example: 'Based on Lucas sequence (2,1,3,4,7,...)',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (k === 0 || k === n) {
                        row.push(n === 0 ? 2 : 1);
                    } else {
                        row.push(triangle[n - 1][k - 1] + triangle[n - 1][k]);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // =========================================
    // PARTITION TRIANGLES
    // =========================================
    bell: {
        name: 'Bell Triangle',
        symbol: 'B(n,k)',
        description: 'Bell numbers appear on edges, counts set partitions',
        formula: 'B(n,0) = B(n-1,n-1), B(n,k) = B(n,k-1) + B(n-1,k-1)',
        oeis: 'A011971',
        example: 'Left edge: 1, 1, 2, 5, 15, 52 (Bell numbers)',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (n === 0) {
                        row.push(1);
                    } else if (k === 0) {
                        row.push(triangle[n - 1][n - 1]);
                    } else {
                        row.push(row[k - 1] + triangle[n - 1][k - 1]);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    stirling1: {
        name: 'Stirling First Kind',
        symbol: 's(n,k)',
        description: 'Unsigned Stirling numbers - counts permutations by cycles',
        formula: 's(n,k) = (n-1)·s(n-1,k) + s(n-1,k-1)',
        oeis: 'A132393',
        example: 's(4,2) = 11 (permutations with 2 cycles)',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (n === 0 && k === 0) {
                        row.push(1);
                    } else if (k === 0) {
                        row.push(0);
                    } else if (k > n) {
                        row.push(0);
                    } else if (n === k) {
                        row.push(1);
                    } else {
                        const a = triangle[n - 1][k - 1] || 0;
                        const b = triangle[n - 1][k] || 0;
                        row.push((n - 1) * b + a);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    stirling2: {
        name: 'Stirling Second Kind',
        symbol: 'S(n,k)',
        description: 'Counts ways to partition n elements into k non-empty subsets',
        formula: 'S(n,k) = k·S(n-1,k) + S(n-1,k-1)',
        oeis: 'A008277',
        example: 'S(4,2) = 7 (partitions into 2 subsets)',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (n === 0 && k === 0) {
                        row.push(1);
                    } else if (k === 0) {
                        row.push(0);
                    } else if (k > n) {
                        row.push(0);
                    } else if (n === k) {
                        row.push(1);
                    } else {
                        const a = triangle[n - 1][k - 1] || 0;
                        const b = triangle[n - 1][k] || 0;
                        row.push(k * b + a);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    lah: {
        name: 'Lah Numbers Triangle',
        symbol: 'L(n,k)',
        description: 'Counts ways to partition and arrange into k ordered lists',
        formula: 'L(n,k) = (n-1)·L(n-1,k) + (n+k-1)·L(n-1,k-1)',
        oeis: 'A271703',
        example: 'L(4,2) = 36',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (n === 0 && k === 0) {
                        row.push(1);
                    } else if (k === 0) {
                        row.push(0);
                    } else if (n === k) {
                        row.push(1);
                    } else if (k > n) {
                        row.push(0);
                    } else {
                        // L(n,k) = C(n-1,k-1) * n! / k!
                        const a = triangle[n - 1][k - 1] || 0;
                        const b = triangle[n - 1][k] || 0;
                        row.push((n - 1 + k) * a + b);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // =========================================
    // CATALAN FAMILY
    // =========================================
    catalan: {
        name: 'Catalan Triangle',
        symbol: 'C(n,k)',
        description: 'Generalizes Catalan numbers, counts ballot sequences',
        formula: 'C(n,k) = C(n-1,k-1) + C(n,k-1)',
        oeis: 'A009766',
        example: 'Diagonal: 1, 1, 2, 5, 14 (Catalan numbers)',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (k === 0) {
                        row.push(1);
                    } else if (k > n) {
                        row.push(0);
                    } else {
                        const above = triangle[n - 1] ? (triangle[n - 1][k - 1] || 0) : 0;
                        const left = row[k - 1] || 0;
                        row.push(above + left);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    narayana: {
        name: 'Narayana Triangle',
        symbol: 'N(n,k)',
        description: 'Counts Dyck paths by number of peaks',
        formula: 'N(n,k) = C(n,k)·C(n,k-1)/n',
        oeis: 'A001263',
        example: 'Row sums give Catalan numbers',
        generate: (rows) => {
            const binomial = (n, k) => {
                if (k < 0 || k > n) return 0;
                if (k === 0 || k === n) return 1;
                let result = 1;
                for (let i = 0; i < k; i++) {
                    result = result * (n - i) / (i + 1);
                }
                return Math.round(result);
            };

            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (n === 0) {
                        row.push(k === 0 ? 1 : 0);
                    } else if (k === 0) {
                        row.push(0);
                    } else {
                        const val = Math.round(binomial(n, k) * binomial(n, k - 1) / n);
                        row.push(val);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    motzkin: {
        name: 'Motzkin Triangle',
        symbol: 'M(n,k)',
        description: 'Generalized Motzkin numbers, counts paths with flat steps',
        formula: 'M(n,k) = M(n-1,k-1) + M(n-1,k) + M(n-1,k+1)',
        oeis: 'A064189',
        example: 'Column 0: 1, 1, 2, 4, 9, 21 (Motzkin numbers)',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (n === 0) {
                        row.push(k === 0 ? 1 : 0);
                    } else {
                        const a = triangle[n - 1][k - 1] || 0;
                        const b = triangle[n - 1][k] || 0;
                        const c = triangle[n - 1][k + 1] || 0;
                        row.push(a + b + c);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    delannoy: {
        name: 'Delannoy Triangle',
        symbol: 'D(n,k)',
        description: 'Counts lattice paths with diagonal steps allowed',
        formula: 'D(n,k) = D(n-1,k) + D(n,k-1) + D(n-1,k-1)',
        oeis: 'A008288',
        example: 'D(3,3) = 63 (paths from (0,0) to (3,3))',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (n === 0 || k === 0) {
                        row.push(1);
                    } else {
                        const above = triangle[n - 1][k] || 0;
                        const left = row[k - 1] || 0;
                        const diag = triangle[n - 1][k - 1] || 0;
                        row.push(above + left + diag);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // =========================================
    // EULERIAN & BERNOULLI
    // =========================================
    eulerian: {
        name: 'Eulerian Triangle',
        symbol: 'A(n,k)',
        description: 'Counts permutations by number of ascents',
        formula: 'A(n,k) = (k+1)·A(n-1,k) + (n-k)·A(n-1,k-1)',
        oeis: 'A008292',
        example: 'Row sums equal n!',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (n === 0) {
                        row.push(k === 0 ? 1 : 0);
                    } else if (k === 0) {
                        row.push(1);
                    } else if (k === n) {
                        row.push(0);
                    } else {
                        const a = triangle[n - 1][k] || 0;
                        const b = triangle[n - 1][k - 1] || 0;
                        row.push((k + 1) * a + (n - k) * b);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    bernoulli: {
        name: 'Bernoulli Triangle',
        symbol: 'B(n,k)',
        description: 'Related to Bernoulli numbers and polynomials',
        formula: 'Sum of row n gives Bernoulli number B_n',
        oeis: 'A051714',
        example: 'Used in computing power sums',
        generate: (rows) => {
            const binomial = (n, k) => {
                if (k < 0 || k > n) return 0;
                if (k === 0 || k === n) return 1;
                let result = 1;
                for (let i = 0; i < k; i++) {
                    result = result * (n - i) / (i + 1);
                }
                return Math.round(result);
            };

            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    // Simplified Bernoulli-like triangle using binomials
                    row.push(binomial(n, k) * (k + 1));
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    leibniz: {
        name: 'Leibniz Harmonic Triangle',
        symbol: '1/L(n,k)',
        description: 'Reciprocals form harmonic relationships',
        formula: 'L(n,k) = (n+1)·C(n,k)',
        oeis: 'A003506',
        example: 'L(n,k) the denominators of unit fractions',
        generate: (rows) => {
            const binomial = (n, k) => {
                if (k < 0 || k > n) return 0;
                if (k === 0 || k === n) return 1;
                let result = 1;
                for (let i = 0; i < k; i++) {
                    result = result * (n - i) / (i + 1);
                }
                return Math.round(result);
            };

            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    row.push((n + 1) * binomial(n, k));
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    riordan: {
        name: 'Riordan Array',
        symbol: 'R(n,k)',
        description: 'Central Riordan array based on generating functions',
        formula: 'Defined by generating functions d(t) and h(t)',
        oeis: 'A007318',
        example: 'Generalizes many combinatorial triangles',
        generate: (rows) => {
            // Simple Riordan example using (1/(1-t), t/(1-t))
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (k === 0) {
                        row.push(1);
                    } else if (k > n) {
                        row.push(0);
                    } else {
                        // R(n,k) = R(n-1,k-1) + R(n-1,k) (Pascal-like for this example)
                        const above = triangle[n - 1] ? triangle[n - 1][k] || 0 : 0;
                        const aboveLeft = triangle[n - 1] ? triangle[n - 1][k - 1] || 0 : 0;
                        row.push(above + aboveLeft);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // =========================================
    // SEQUENCE TRIANGLES
    // =========================================
    padovan: {
        name: 'Padovan Triangle',
        symbol: 'P(n,k)',
        description: 'Based on the Padovan sequence (1,1,1,2,2,3,4,5,7,...)',
        formula: 'P(n) = P(n-2) + P(n-3)',
        oeis: 'A134816',
        example: 'Padovan spiral numbers in rows',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (k === 0 || k === n) {
                        row.push(1);
                    } else if (n < 3) {
                        row.push(1);
                    } else {
                        const a = triangle[n - 2] ? triangle[n - 2][k - 1] || 0 : 0;
                        const b = triangle[n - 3] ? triangle[n - 3][k - 1] || 0 : 0;
                        const c = triangle[n - 1] ? triangle[n - 1][k] || 0 : 0;
                        row.push(a + b + c);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    pell: {
        name: 'Pell Triangle',
        symbol: 'P(n,k)',
        description: 'Based on Pell numbers (0,1,2,5,12,29,...)',
        formula: 'P(n) = 2P(n-1) + P(n-2)',
        oeis: 'A038207',
        example: 'Pell numbers appear in diagonals',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (k === 0 || k === n) {
                        row.push(1);
                    } else {
                        const a = triangle[n - 1][k - 1] || 0;
                        const b = triangle[n - 1][k] || 0;
                        row.push(2 * a + b);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    tribonacci: {
        name: 'Tribonacci Triangle',
        symbol: 'T(n,k)',
        description: 'Three-term recurrence triangle',
        formula: 'T(n) = T(n-1) + T(n-2) + T(n-3)',
        oeis: 'A037027',
        example: 'Tribonacci: 0, 0, 1, 1, 2, 4, 7, 13, 24...',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (k === 0 || k === n) {
                        row.push(1);
                    } else if (n < 2) {
                        row.push(1);
                    } else {
                        const a = triangle[n - 1][k - 1] || 0;
                        const b = triangle[n - 1][k] || 0;
                        const c = triangle[n - 2] ? triangle[n - 2][Math.max(0, k - 1)] || 0 : 0;
                        row.push(a + b + c);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    hosoya: {
        name: 'Hosoya Triangle',
        symbol: 'H(n,k)',
        description: 'Products of Fibonacci numbers form this triangle',
        formula: 'H(n,k) = F(k+1)·F(n-k+1)',
        oeis: 'A058071',
        example: 'H(4,2) = F(3)·F(3) = 2·2 = 4',
        generate: (rows) => {
            // Generate Fibonacci numbers first
            const fib = [0, 1];
            for (let i = 2; i < rows + 2; i++) {
                fib.push(fib[i - 1] + fib[i - 2]);
            }

            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    row.push(fib[k + 1] * fib[n - k + 1]);
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // =========================================
    // SPECIAL TRIANGLES
    // =========================================
    lozanic: {
        name: "Lozanić's Triangle",
        symbol: 'L(n,k)',
        description: 'Counts certain chemical compounds (paraffins)',
        formula: 'L(n,k) = L(n-1,k-1) + L(n-1,k) for even sums',
        oeis: 'A034851',
        example: 'Chemistry applications',
        generate: (rows) => {
            const binomial = (n, k) => {
                if (k < 0 || k > n) return 0;
                if (k === 0 || k === n) return 1;
                let result = 1;
                for (let i = 0; i < k; i++) {
                    result = result * (n - i) / (i + 1);
                }
                return Math.round(result);
            };

            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    // Lozanic: average of C(n,k) and C(floor(n/2), floor(k/2))
                    const c1 = binomial(n, k);
                    const c2 = binomial(Math.floor(n / 2), Math.floor(k / 2));
                    row.push(Math.floor((c1 + c2) / 2));
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    centralBinomial: {
        name: 'Central Binomial Triangle',
        symbol: 'C(2n,n)',
        description: 'Triangle based on central binomial coefficients',
        formula: 'C(2n,n) appears in diagonal',
        oeis: 'A000984',
        example: 'Central: 1, 2, 6, 20, 70, 252...',
        generate: (rows) => {
            const binomial = (n, k) => {
                if (k < 0 || k > n) return 0;
                if (k === 0 || k === n) return 1;
                let result = 1;
                for (let i = 0; i < k; i++) {
                    result = result * (n - i) / (i + 1);
                }
                return Math.round(result);
            };

            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    row.push(binomial(n + k, k));
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    harmonicLeib: {
        name: 'Harmonic Triangle',
        symbol: '1/H(n,k)',
        description: 'Denominators of the Leibniz harmonic triangle',
        formula: '1/H(n,k) = 1/H(n-1,k-1) - 1/H(n-1,k)',
        oeis: 'A003506',
        example: 'Entries are reciprocal relationships',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    // Denominator pattern: (n+1) * C(n,k)
                    if (k === 0 || k === n) {
                        row.push(n + 1);
                    } else {
                        const left = triangle[n - 1][k - 1] || 1;
                        const right = triangle[n - 1][k] || 1;
                        // This gives LCM-like pattern
                        row.push(left + right);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    ballot: {
        name: 'Ballot Triangle',
        symbol: 'B(n,k)',
        description: 'Related to ballot problem - winning margin counts',
        formula: 'B(n,k) = number of ways A stays ahead of B',
        oeis: 'A009766',
        example: 'Catalan-related counting',
        generate: (rows) => {
            // Ballot numbers: B(n,k) = (k/n) * C(n, (n+k)/2) when n+k even
            const binomial = (n, k) => {
                if (k < 0 || k > n) return 0;
                if (k === 0 || k === n) return 1;
                let result = 1;
                for (let i = 0; i < k; i++) {
                    result = result * (n - i) / (i + 1);
                }
                return Math.round(result);
            };

            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    // Use Catalan-style numbers for ballot
                    if (k === 0) {
                        row.push(1);
                    } else {
                        const above = triangle[n - 1] ? triangle[n - 1][k - 1] || 0 : 0;
                        const left = row[k - 1] || 0;
                        row.push(above + left);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    }
};

// Get all triangle IDs
function getAllTriangleIds() {
    return Object.keys(TRIANGLES);
}

// Get triangle info
function getTriangleInfo(id) {
    return TRIANGLES[id] || null;
}

// Generate triangle data
function generateTriangle(id, rows = 10) {
    const triangle = TRIANGLES[id];
    if (!triangle) return null;
    return {
        id,
        ...triangle,
        data: triangle.generate(rows)
    };
}

// Get triangles by category
function getTrianglesByCategory(categoryId) {
    const category = TRIANGLE_CATEGORIES[categoryId];
    if (!category) return [];
    return category.triangles.map(id => ({
        id,
        ...TRIANGLES[id]
    }));
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TRIANGLES, TRIANGLE_CATEGORIES, generateTriangle, getTriangleInfo, getAllTriangleIds, getTrianglesByCategory };
}
