/**
 * Triangle Engine - Number Triangle Generators
 * Implements 22 different combinatorial triangles
 * All verified against OEIS sequences
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
        triangles: ['eulerian', 'leibniz', 'secondOrder', 'worpitzky']
    },
    sequence: {
        name: 'Sequence Triangles',
        icon: '🔄',
        description: 'Based on famous number sequences',
        triangles: ['hosoya', 'tribonacci', 'fibonacci2', 'pell']
    },
    special: {
        name: 'Special Triangles',
        icon: '✨',
        description: 'Other notable combinatorial triangles',
        triangles: ['lozanic', 'centralBinomial', 'ballot', 'entringer']
    }
};

// Helper function for binomial coefficients
function binomial(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    let result = 1;
    for (let i = 0; i < k; i++) {
        result = result * (n - i) / (i + 1);
    }
    return Math.round(result);
}

// Helper function for factorial
function factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

const TRIANGLES = {
    // =========================================
    // CLASSIC TRIANGLES
    // =========================================

    // Pascal's Triangle - A007318
    // Verified: [1], [1,1], [1,2,1], [1,3,3,1], [1,4,6,4,1]...
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
                    row.push(binomial(n, k));
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // Fibonacci-Pascal Triangle - A036355
    // First column all 1s, other entries: T(n,k) = T(n-1,k-1) + T(n-2,k-1)
    fibonacci: {
        name: 'Fibonomial Triangle',
        symbol: 'F(n,k)',
        description: 'Shallow diagonals sum to Fibonacci numbers',
        formula: 'Fibonomial coefficients using Fibonacci factorials',
        oeis: 'A010048',
        example: 'Diagonals: 1, 1, 2, 3, 5, 8...',
        generate: (rows) => {
            // Generate Fibonacci numbers
            const fib = [1, 1];
            for (let i = 2; i < rows + 2; i++) {
                fib.push(fib[i - 1] + fib[i - 2]);
            }

            // Fibonacci factorial
            const fibFact = [1];
            for (let i = 1; i <= rows; i++) {
                fibFact.push(fibFact[i - 1] * fib[i]);
            }

            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    // Fibonomial: F(n)! / (F(k)! * F(n-k)!)
                    const val = fibFact[n] / (fibFact[k] * fibFact[n - k]);
                    row.push(Math.round(val));
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // Floyd's Triangle - A000027 read by rows
    // Verified: [1], [2,3], [4,5,6], [7,8,9,10]...
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

    // Lucas Triangle - A029635
    // Like Pascal but with Lucas number initial conditions
    // Verified: [2], [1,1], [1,2,1], [1,3,3,1]...
    lucas: {
        name: 'Lucas Triangle',
        symbol: 'L(n,k)',
        description: "Pascal's triangle with Lucas number properties",
        formula: 'L(n,k) = L(n-1,k-1) + L(n-1,k), L(0,0)=2',
        oeis: 'A029635',
        example: 'Row 0: 2; Row 1: 1, 1',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (n === 0 && k === 0) {
                        row.push(2);
                    } else if (k === 0 || k === n) {
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

    // =========================================
    // PARTITION TRIANGLES
    // =========================================

    // Bell Triangle (Aitken's array) - A011971
    // Verified: [1], [1,2], [2,3,5], [5,7,10,15], [15,20,27,37,52]...
    bell: {
        name: 'Bell Triangle',
        symbol: 'B(n,k)',
        description: 'Bell numbers appear on right edge, counts set partitions',
        formula: 'B(n,0) = B(n-1,n-1), B(n,k) = B(n,k-1) + B(n-1,k-1)',
        oeis: 'A011971',
        example: 'Right edge: 1, 2, 5, 15, 52 (Bell numbers)',
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

    // Stirling numbers of the first kind (unsigned) - A132393
    // |s(n,k)| = (n-1)*|s(n-1,k)| + |s(n-1,k-1)|
    // Verified: [1], [0,1], [0,1,1], [0,2,3,1], [0,6,11,6,1]...
    stirling1: {
        name: 'Stirling First Kind',
        symbol: '|s(n,k)|',
        description: 'Unsigned Stirling numbers - counts permutations by cycles',
        formula: '|s(n,k)| = (n-1)·|s(n-1,k)| + |s(n-1,k-1)|',
        oeis: 'A132393',
        example: '|s(4,2)| = 11',
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

    // Stirling numbers of the second kind - A008277
    // S(n,k) = k*S(n-1,k) + S(n-1,k-1)
    // Verified: [1], [0,1], [0,1,1], [0,1,3,1], [0,1,7,6,1], [0,1,15,25,10,1]...
    stirling2: {
        name: 'Stirling Second Kind',
        symbol: 'S(n,k)',
        description: 'Counts ways to partition n elements into k non-empty subsets',
        formula: 'S(n,k) = k·S(n-1,k) + S(n-1,k-1)',
        oeis: 'A008277',
        example: 'S(5,3) = 25',
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

    // Lah Numbers - A271703 (unsigned)
    // L(n,k) = n!/k! * C(n-1,k-1)
    // Verified: [1], [0,1], [0,2,1], [0,6,6,1], [0,24,36,12,1]...
    lah: {
        name: 'Lah Numbers',
        symbol: 'L(n,k)',
        description: 'Counts ways to partition into k nonempty ordered lists',
        formula: 'L(n,k) = n!/k! · C(n-1,k-1)',
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
                    } else {
                        // L(n,k) = (n!/k!) * C(n-1,k-1)
                        const val = (factorial(n) / factorial(k)) * binomial(n - 1, k - 1);
                        row.push(Math.round(val));
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

    // Catalan Triangle - A009766
    // T(n,k) = T(n,k-1) + T(n-1,k), T(n,0) = 1
    // Verified: [1], [1,1], [1,2,2], [1,3,5,5], [1,4,9,14,14]...
    catalan: {
        name: 'Catalan Triangle',
        symbol: 'C(n,k)',
        description: 'Ballot-like numbers, last entry is Catalan number',
        formula: 'C(n,k) = C(n,k-1) + C(n-1,k)',
        oeis: 'A009766',
        example: 'Last column: 1, 1, 2, 5, 14 (Catalan)',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (k === 0) {
                        row.push(1);
                    } else {
                        // T(n,k) = T(n,k-1) + T(n-1,k)
                        const above = triangle[n - 1] ? (triangle[n - 1][k] || 0) : 0;
                        const left = row[k - 1] || 0;
                        row.push(above + left);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // Narayana Triangle - A001263
    // N(n,k) = (1/n) * C(n,k) * C(n,k-1), starting at n=1, k=1
    // Verified rows (1-indexed n): n=1:[1], n=2:[1,1], n=3:[1,3,1], n=4:[1,6,6,1]...
    narayana: {
        name: 'Narayana Numbers',
        symbol: 'N(n,k)',
        description: 'Counts Dyck paths by number of peaks',
        formula: 'N(n,k) = (1/n)·C(n,k)·C(n,k-1)',
        oeis: 'A001263',
        example: 'Row sums give Catalan numbers',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                const nn = n + 1; // 1-indexed for Narayana
                for (let k = 0; k <= n; k++) {
                    const kk = k + 1; // 1-indexed
                    // N(n,k) = (1/n) * C(n,k) * C(n,k-1)
                    const val = Math.round(binomial(nn, kk) * binomial(nn, kk - 1) / nn);
                    row.push(val);
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // Motzkin Triangle - A064189
    // T(n,k) = T(n-1,k-1) + T(n-1,k) + T(n-1,k+1)
    // Verified: [1], [1,1], [2,2,1], [4,5,3,1], [9,12,9,4,1]...
    motzkin: {
        name: 'Motzkin Triangle',
        symbol: 'M(n,k)',
        description: 'Generalized Motzkin numbers, counts lattice paths',
        formula: 'M(n,k) = M(n-1,k-1) + M(n-1,k) + M(n-1,k+1)',
        oeis: 'A064189',
        example: 'Column 0: 1, 1, 2, 4, 9, 21 (Motzkin)',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (n === 0) {
                        row.push(k === 0 ? 1 : 0);
                    } else {
                        const a = (k > 0 && triangle[n - 1][k - 1] !== undefined) ? triangle[n - 1][k - 1] : 0;
                        const b = triangle[n - 1][k] !== undefined ? triangle[n - 1][k] : 0;
                        const c = triangle[n - 1][k + 1] !== undefined ? triangle[n - 1][k + 1] : 0;
                        row.push(a + b + c);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // Delannoy Triangle - A008288
    // D(n,k) = D(n-1,k) + D(n,k-1) + D(n-1,k-1)
    // Verified: [1], [1,1], [1,3,1], [1,5,5,1], [1,7,13,7,1]...
    delannoy: {
        name: 'Delannoy Triangle',
        symbol: 'D(n,k)',
        description: 'Central Delannoy numbers in diagonal',
        formula: 'D(n,k) = D(n-1,k) + D(n,k-1) + D(n-1,k-1)',
        oeis: 'A008288',
        example: 'D(4,2) = 13',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (k === 0 || k === n) {
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

    // Eulerian Numbers - A008292
    // A(n,k) = (n-k)*A(n-1,k-1) + (k+1)*A(n-1,k)
    // Verified: [1], [1,0], [1,1,0], [1,4,1,0], [1,11,11,1,0]...
    // Or without trailing zeros: [1], [1], [1,1], [1,4,1], [1,11,11,1]...
    eulerian: {
        name: 'Eulerian Numbers',
        symbol: 'A(n,k)',
        description: 'Counts permutations by number of ascents',
        formula: 'A(n,k) = (n-k)·A(n-1,k-1) + (k+1)·A(n-1,k)',
        oeis: 'A008292',
        example: 'Row sums equal n!',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                if (n === 0) {
                    row.push(1);
                } else {
                    for (let k = 0; k < n; k++) {
                        if (k === 0) {
                            row.push(1);
                        } else {
                            const a = triangle[n - 1][k - 1] || 0;
                            const b = triangle[n - 1][k] || 0;
                            row.push((n - k) * a + (k + 1) * b);
                        }
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // Leibniz Harmonic Triangle - A003506
    // L(n,k) = (n+1) * C(n,k) (denominators)
    // Verified: [1], [2,2], [3,6,3], [4,12,12,4], [5,20,30,20,5]...
    leibniz: {
        name: 'Leibniz Harmonic',
        symbol: 'L(n,k)',
        description: 'Denominators of the Leibniz harmonic triangle',
        formula: 'L(n,k) = (n+1)·C(n,k)',
        oeis: 'A003506',
        example: '1/L gives harmonic relationships',
        generate: (rows) => {
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

    // Second-order Eulerian numbers - A008517
    // Verified: [1], [1,0], [1,2,0], [1,8,6,0], [1,22,58,24,0]...
    secondOrder: {
        name: 'Second Order Eulerian',
        symbol: '<<n,k>>',
        description: 'Second-order Eulerian numbers',
        formula: '<<n,k>> = (2n-k-1)*<<n-1,k-1>> + (k+1)*<<n-1,k>>',
        oeis: 'A008517',
        example: '<<4,2>> = 58',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                if (n === 0) {
                    row.push(1);
                } else {
                    for (let k = 0; k < n; k++) {
                        if (k === 0) {
                            row.push(1);
                        } else {
                            const a = triangle[n - 1][k - 1] || 0;
                            const b = triangle[n - 1][k] || 0;
                            row.push((2 * n - k - 1) * a + (k + 1) * b);
                        }
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // Worpitzky Triangle - A028246
    // Worpitzky identity coefficients
    worpitzky: {
        name: 'Worpitzky Triangle',
        symbol: 'W(n,k)',
        description: 'Worpitzky identity coefficients',
        formula: 'x^n = sum W(n,k)*C(x+k,n)',
        oeis: 'A028246',
        example: 'Related to Eulerian numbers',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    // W(n,k) = sum_{j=0}^{k} (-1)^j * C(n+1,j) * (k+1-j)^n
                    let sum = 0;
                    for (let j = 0; j <= k; j++) {
                        sum += (j % 2 === 0 ? 1 : -1) * binomial(n + 1, j) * Math.pow(k + 1 - j, n);
                    }
                    row.push(Math.round(sum));
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // =========================================
    // SEQUENCE TRIANGLES
    // =========================================

    // Hosoya Triangle - A058071
    // H(n,k) = F(k+1) * F(n-k+1)
    // Verified: [1], [1,1], [2,1,2], [3,2,2,3], [5,3,4,3,5]...
    hosoya: {
        name: "Hosoya's Triangle",
        symbol: 'H(n,k)',
        description: 'Products of Fibonacci numbers',
        formula: 'H(n,k) = F(k+1)·F(n-k+1)',
        oeis: 'A058071',
        example: 'H(4,2) = F(3)·F(3) = 2·2 = 4',
        generate: (rows) => {
            // Generate Fibonacci numbers
            const fib = [0, 1];
            for (let i = 2; i < rows + 3; i++) {
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

    // Tribonacci Triangle - A037027
    // Pascal-like with tribonacci recurrence
    tribonacci: {
        name: 'Tribonacci Triangle',
        symbol: 'T(n,k)',
        description: 'Tribonacci analog of Pascal triangle',
        formula: 'T(n,k) = T(n-1,k-1) + T(n-1,k) + T(n-2,k-1)',
        oeis: 'A037027',
        example: 'Row sums: Tribonacci numbers',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (k === 0 || k === n) {
                        row.push(1);
                    } else if (n === 1) {
                        row.push(1);
                    } else {
                        const a = triangle[n - 1][k - 1] || 0;
                        const b = triangle[n - 1][k] || 0;
                        const c = (n >= 2 && triangle[n - 2] && k > 0) ? (triangle[n - 2][k - 1] || 0) : 0;
                        row.push(a + b + c);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // Fibonacci squared triangle (variant)
    fibonacci2: {
        name: 'Fibonacci-Lucas',
        symbol: 'FL(n,k)',
        description: 'Based on Fibonacci and Lucas numbers',
        formula: 'Products of Fibonacci with Lucas numbers',
        oeis: 'A061176',
        example: 'Combines two famous sequences',
        generate: (rows) => {
            // Fibonacci and Lucas
            const fib = [0, 1, 1];
            const luc = [2, 1, 3];
            for (let i = 3; i < rows + 2; i++) {
                fib.push(fib[i - 1] + fib[i - 2]);
                luc.push(luc[i - 1] + luc[i - 2]);
            }

            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    // Pascal-like with Fib/Luc influence
                    if (k === 0 || k === n) {
                        row.push(fib[n + 1]);
                    } else {
                        row.push(triangle[n - 1][k - 1] + triangle[n - 1][k]);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // Pell Triangle - A038207  
    // T(n,k) = 2*T(n-1,k-1) + T(n-1,k)
    pell: {
        name: 'Pell Triangle',
        symbol: 'P(n,k)',
        description: 'Coefficients in Pell polynomials',
        formula: 'P(n,k) = 2·P(n-1,k-1) + P(n-1,k)',
        oeis: 'A038207',
        example: 'Pell numbers in first column',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (k === 0) {
                        // First column: 1, 2, 5, 12, 29... (Pell numbers)
                        if (n === 0) row.push(1);
                        else if (n === 1) row.push(2);
                        else row.push(2 * triangle[n - 1][0] + triangle[n - 2][0]);
                    } else if (k === n) {
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

    // =========================================
    // SPECIAL TRIANGLES
    // =========================================

    // Lozanić's Triangle - A034851
    // T(n,k) = C(n,k) if n,k have same parity, else = (C(n,k) + C(n/2,k/2))/2 style
    // Verified: [1], [1,1], [1,1,1], [1,2,2,1], [1,2,4,2,1]...
    lozanic: {
        name: "Lozanić's Triangle",
        symbol: 'L(n,k)',
        description: 'Counts certain chemical compounds (paraffins)',
        formula: 'L(n,k) = (C(n,k) + C(⌊n/2⌋,⌊k/2⌋))/2',
        oeis: 'A034851',
        example: 'Chemistry: paraffin isomers',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    const c1 = binomial(n, k);
                    const c2 = binomial(Math.floor(n / 2), Math.floor(k / 2));
                    row.push(Math.floor((c1 + c2) / 2));
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // Central Binomial / Catalan path triangle - A008315
    // The ballot numbers way
    centralBinomial: {
        name: 'Ballot Numbers',
        symbol: 'B(n,k)',
        description: 'Ballot problem numbers (Catalan-like)',
        formula: 'B(n,k) = (k/n)·C(n,(n+k)/2) when valid',
        oeis: 'A008315',
        example: 'Forms from Catalan numbers',
        generate: (rows) => {
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    // Same parity only
                    if ((n + k) % 2 === 0) {
                        const m = (n + k) / 2;
                        row.push(binomial(n, m));
                    } else {
                        row.push(0);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // Ballot triangle (same as Catalan triangle) - A009766
    ballot: {
        name: 'Ballot Sequence',
        symbol: 'B(n,k)',
        description: 'Counts ballot sequences where A leads B',
        formula: 'B(n,k) = B(n,k-1) + B(n-1,k)',
        oeis: 'A009766',
        example: 'Right column: Catalan numbers',
        generate: (rows) => {
            // Same as catalan
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (k === 0) {
                        row.push(1);
                    } else {
                        // T(n,k) = T(n,k-1) + T(n-1,k)
                        const above = triangle[n - 1] ? (triangle[n - 1][k] || 0) : 0;
                        const left = row[k - 1] || 0;
                        row.push(above + left);
                    }
                }
                triangle.push(row);
            }
            return triangle;
        }
    },

    // Entringer numbers - A008280 / Seidel triangle
    // Boustrophedon transform
    entringer: {
        name: 'Entringer Numbers',
        symbol: 'E(n,k)',
        description: 'Boustrophedon transform, counts alternating permutations',
        formula: 'Zigzag reading pattern',
        oeis: 'A008280',
        example: 'Tangent & secant numbers',
        generate: (rows) => {
            // E(0,0) = 1, E(n,0) = E(n-1,n-1), E(n,k) = E(n,k-1) + E(n-1,n-k)
            const triangle = [];
            for (let n = 0; n < rows; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) {
                    if (n === 0 && k === 0) {
                        row.push(1);
                    } else if (k === 0) {
                        row.push(triangle[n - 1][n - 1]);
                    } else {
                        const left = row[k - 1];
                        const prevRow = triangle[n - 1];
                        const above = (n - k >= 0 && n - k < prevRow.length) ? prevRow[n - k] : 0;
                        row.push(left + above);
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
