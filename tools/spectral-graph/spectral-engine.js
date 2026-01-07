/**
 * Spectral Graph Theory Engine
 * Computes Laplacian matrices, eigenvalues, and spectral decomposition
 */

class SpectralEngine {
    constructor() {
        this.adjacencyMatrix = [];
        this.laplacianType = 'combinatorial';
    }

    setAdjacencyMatrix(matrix) {
        this.adjacencyMatrix = matrix.map(row => [...row]);
    }

    getSize() {
        return this.adjacencyMatrix.length;
    }

    getDegrees() {
        const n = this.getSize();
        return Array(n).fill(0).map((_, i) => {
            let degree = 0;
            for (let j = 0; j < n; j++) {
                if (this.adjacencyMatrix[i][j] !== 0) degree++;
            }
            return degree;
        });
    }

    getLaplacian(type = null) {
        const laplacianType = type || this.laplacianType;
        const n = this.getSize();
        if (n === 0) return [];

        const A = this.adjacencyMatrix;
        const degrees = this.getDegrees();
        const L = Array(n).fill(0).map(() => Array(n).fill(0));

        if (laplacianType === 'combinatorial') {
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    L[i][j] = i === j ? degrees[i] : -A[i][j];
                }
            }
        } else if (laplacianType === 'normalized') {
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (i === j) L[i][j] = degrees[i] > 0 ? 1 : 0;
                    else if (degrees[i] > 0 && degrees[j] > 0)
                        L[i][j] = -A[i][j] / Math.sqrt(degrees[i] * degrees[j]);
                }
            }
        } else {
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (i === j) L[i][j] = degrees[i] > 0 ? 1 : 0;
                    else if (degrees[i] > 0) L[i][j] = -A[i][j] / degrees[i];
                }
            }
        }
        return L;
    }

    computeEigendecomposition() {
        const L = this.getLaplacian();
        const n = L.length;
        if (n === 0) return { eigenvalues: [], eigenvectors: [] };
        if (n === 1) return { eigenvalues: [L[0][0]], eigenvectors: [[1]] };

        const result = this.jacobiEigenvalue(L);
        const indices = Array(n).fill(0).map((_, i) => i);
        indices.sort((a, b) => result.eigenvalues[a] - result.eigenvalues[b]);

        return {
            eigenvalues: indices.map(i => result.eigenvalues[i]),
            eigenvectors: indices.map(i => result.eigenvectors[i])
        };
    }

    jacobiEigenvalue(matrix, maxIter = 100, tol = 1e-10) {
        const n = matrix.length;
        let A = matrix.map(row => [...row]);
        let V = Array(n).fill(0).map((_, i) => Array(n).fill(0).map((_, j) => i === j ? 1 : 0));

        for (let iter = 0; iter < maxIter; iter++) {
            let maxVal = 0, p = 0, q = 1;
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    if (Math.abs(A[i][j]) > maxVal) { maxVal = Math.abs(A[i][j]); p = i; q = j; }
                }
            }
            if (maxVal < tol) break;

            const diff = A[q][q] - A[p][p];
            let t = Math.abs(diff) < tol ? (A[p][q] > 0 ? 1 : -1) :
                1 / (Math.abs(diff / (2 * A[p][q])) + Math.sqrt((diff / (2 * A[p][q])) ** 2 + 1));
            if (diff < 0 && Math.abs(diff) >= tol) t = -t;

            const c = 1 / Math.sqrt(t * t + 1), s = t * c;
            const newA = A.map(row => [...row]);

            for (let i = 0; i < n; i++) {
                if (i !== p && i !== q) {
                    newA[i][p] = newA[p][i] = c * A[i][p] - s * A[i][q];
                    newA[i][q] = newA[q][i] = s * A[i][p] + c * A[i][q];
                }
            }
            newA[p][p] = c * c * A[p][p] - 2 * s * c * A[p][q] + s * s * A[q][q];
            newA[q][q] = s * s * A[p][p] + 2 * s * c * A[p][q] + c * c * A[q][q];
            newA[p][q] = newA[q][p] = 0;
            A = newA;

            for (let i = 0; i < n; i++) {
                const vip = V[i][p], viq = V[i][q];
                V[i][p] = c * vip - s * viq;
                V[i][q] = s * vip + c * viq;
            }
        }

        return {
            eigenvalues: A.map((row, i) => row[i]),
            eigenvectors: Array(n).fill(0).map((_, i) => Array(n).fill(0).map((_, j) => V[j][i]))
        };
    }

    getFiedlerVector() {
        const result = this.computeEigendecomposition();
        return result.eigenvectors.length < 2 ? null :
            { eigenvalue: result.eigenvalues[1], eigenvector: result.eigenvectors[1] };
    }

    getAlgebraicConnectivity() {
        const result = this.computeEigendecomposition();
        return result.eigenvalues.length >= 2 ? result.eigenvalues[1] : 0;
    }

    getNumConnectedComponents() {
        const result = this.computeEigendecomposition();
        return result.eigenvalues.filter(λ => Math.abs(λ) < 1e-8).length;
    }

    static createCycleGraph(n) {
        const A = Array(n).fill(0).map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) { A[i][(i + 1) % n] = A[(i + 1) % n][i] = 1; }
        return A;
    }

    static createCompleteGraph(n) {
        const A = Array(n).fill(0).map(() => Array(n).fill(1));
        for (let i = 0; i < n; i++) A[i][i] = 0;
        return A;
    }

    static createPathGraph(n) {
        const A = Array(n).fill(0).map(() => Array(n).fill(0));
        for (let i = 0; i < n - 1; i++) { A[i][i + 1] = A[i + 1][i] = 1; }
        return A;
    }

    static createRandomGraph(n, density = 0.4) {
        const A = Array(n).fill(0).map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (Math.random() < density) A[i][j] = A[j][i] = 1;
            }
        }
        return A;
    }
}

window.SpectralEngine = SpectralEngine;
