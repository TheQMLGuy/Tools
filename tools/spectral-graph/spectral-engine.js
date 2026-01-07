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

    /**
     * Jacobi eigenvalue algorithm for symmetric matrices
     * Improved version with better numerical stability
     */
    jacobiEigenvalue(matrix, maxIter = 200, tol = 1e-12) {
        const n = matrix.length;

        // Make a fresh copy
        let A = [];
        for (let i = 0; i < n; i++) {
            A[i] = [];
            for (let j = 0; j < n; j++) {
                A[i][j] = matrix[i][j];
            }
        }

        // Initialize eigenvector matrix as identity
        let V = [];
        for (let i = 0; i < n; i++) {
            V[i] = [];
            for (let j = 0; j < n; j++) {
                V[i][j] = (i === j) ? 1 : 0;
            }
        }

        for (let iter = 0; iter < maxIter; iter++) {
            // Find largest off-diagonal element
            let maxVal = 0;
            let p = 0, q = 1;

            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    if (Math.abs(A[i][j]) > maxVal) {
                        maxVal = Math.abs(A[i][j]);
                        p = i;
                        q = j;
                    }
                }
            }

            // Check convergence
            if (maxVal < tol) break;

            // Compute rotation angle
            const App = A[p][p];
            const Aqq = A[q][q];
            const Apq = A[p][q];

            let theta;
            if (Math.abs(Aqq - App) < tol) {
                theta = Math.PI / 4;
                if (Apq < 0) theta = -theta;
            } else {
                theta = 0.5 * Math.atan2(2 * Apq, Aqq - App);
            }

            const c = Math.cos(theta);
            const s = Math.sin(theta);

            // Apply Givens rotation to A: A' = G^T * A * G
            // Store old values
            const oldApp = App;
            const oldAqq = Aqq;
            const oldApq = Apq;

            // Update diagonal elements
            A[p][p] = c * c * oldApp - 2 * s * c * oldApq + s * s * oldAqq;
            A[q][q] = s * s * oldApp + 2 * s * c * oldApq + c * c * oldAqq;
            A[p][q] = 0;
            A[q][p] = 0;

            // Update off-diagonal elements
            for (let i = 0; i < n; i++) {
                if (i !== p && i !== q) {
                    const oldAip = A[i][p];
                    const oldAiq = A[i][q];
                    A[i][p] = c * oldAip - s * oldAiq;
                    A[p][i] = A[i][p];
                    A[i][q] = s * oldAip + c * oldAiq;
                    A[q][i] = A[i][q];
                }
            }

            // Update eigenvector matrix V' = V * G
            for (let i = 0; i < n; i++) {
                const oldVip = V[i][p];
                const oldViq = V[i][q];
                V[i][p] = c * oldVip - s * oldViq;
                V[i][q] = s * oldVip + c * oldViq;
            }
        }

        // Extract eigenvalues from diagonal, round near-zero values
        const eigenvalues = [];
        for (let i = 0; i < n; i++) {
            let val = A[i][i];
            if (Math.abs(val) < 1e-10) val = 0;
            eigenvalues.push(val);
        }

        // Get eigenvectors as rows (each column of V is an eigenvector)
        const eigenvectors = [];
        for (let i = 0; i < n; i++) {
            eigenvectors[i] = [];
            for (let j = 0; j < n; j++) {
                eigenvectors[i][j] = V[j][i];
            }
        }

        return { eigenvalues, eigenvectors };
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
