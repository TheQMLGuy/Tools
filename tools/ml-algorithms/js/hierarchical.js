/**
 * Hierarchical Clustering Visualizer
 * Agglomerative clustering with dendrogram
 */

class HierarchicalApp {
    constructor() {
        this.data = [];
        this.merges = [];
        this.threshold = 0.5;
        this.linkage = 'single';
        this.colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444'];

        this.initCanvas();
        this.setupEventListeners();
        this.generateData();
    }

    initCanvas() {
        this.scatterCanvas = document.getElementById('scatter-canvas');
        this.scatterCtx = this.scatterCanvas.getContext('2d');

        this.dendrogramCanvas = document.getElementById('dendrogram-canvas');
        this.dendrogramCtx = this.dendrogramCanvas.getContext('2d');

        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
    }

    resizeCanvases() {
        document.querySelectorAll('.viz-half').forEach(container => {
            const canvas = container.querySelector('canvas');
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height - 40;
        });
        this.render();
    }

    setupEventListeners() {
        document.getElementById('dataset-select').addEventListener('change', () => this.generateData());
        document.getElementById('generate-btn').addEventListener('click', () => this.generateData());

        document.getElementById('linkage-select').addEventListener('change', (e) => {
            this.linkage = e.target.value;
        });

        document.getElementById('threshold').addEventListener('input', (e) => {
            this.threshold = parseInt(e.target.value) / 100;
            document.getElementById('threshold-value').textContent = this.threshold.toFixed(2);
            this.updateClusters();
            this.render();
        });

        document.getElementById('cluster-btn').addEventListener('click', () => this.buildDendrogram());
    }

    generateData() {
        const dataset = document.getElementById('dataset-select').value;
        this.data = [];
        this.merges = [];

        if (dataset === 'blobs') {
            const centers = [{ x: -0.5, y: 0.4 }, { x: 0.5, y: 0.4 }, { x: 0, y: -0.4 }];
            centers.forEach(c => {
                for (let i = 0; i < 10; i++) {
                    this.data.push({
                        x: c.x + (Math.random() - 0.5) * 0.3,
                        y: c.y + (Math.random() - 0.5) * 0.3
                    });
                }
            });
        } else {
            for (let i = 0; i < 20; i++) {
                this.data.push({
                    x: (Math.random() - 0.5) * 1.5,
                    y: (Math.random() - 0.5) * 1.2
                });
            }
        }

        this.updateStats();
        this.render();
    }

    distance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    clusterDistance(c1, c2) {
        const distances = [];
        for (const p1 of c1) {
            for (const p2 of c2) {
                distances.push(this.distance(this.data[p1], this.data[p2]));
            }
        }

        switch (this.linkage) {
            case 'single': return Math.min(...distances);
            case 'complete': return Math.max(...distances);
            case 'average': return distances.reduce((a, b) => a + b, 0) / distances.length;
        }
    }

    buildDendrogram() {
        this.merges = [];

        // Initialize: each point is its own cluster
        let clusters = this.data.map((_, i) => [i]);
        let clusterIds = this.data.map((_, i) => i);
        let nextId = this.data.length;

        while (clusters.length > 1) {
            // Find closest pair
            let minDist = Infinity;
            let minI = 0, minJ = 1;

            for (let i = 0; i < clusters.length; i++) {
                for (let j = i + 1; j < clusters.length; j++) {
                    const dist = this.clusterDistance(clusters[i], clusters[j]);
                    if (dist < minDist) {
                        minDist = dist;
                        minI = i;
                        minJ = j;
                    }
                }
            }

            // Merge
            const merged = [...clusters[minI], ...clusters[minJ]];

            this.merges.push({
                left: clusterIds[minI],
                right: clusterIds[minJ],
                distance: minDist,
                id: nextId,
                members: merged
            });

            // Update clusters
            clusters.splice(minJ, 1);
            clusters.splice(minI, 1, merged);

            clusterIds.splice(minJ, 1);
            clusterIds.splice(minI, 1, nextId);

            nextId++;
        }

        this.updateClusters();
        this.updateStats();
        this.render();
    }

    updateClusters() {
        // Assign cluster labels based on threshold
        this.labels = new Array(this.data.length).fill(0);

        if (this.merges.length === 0) return;

        const maxDist = Math.max(...this.merges.map(m => m.distance));
        const cutHeight = this.threshold * maxDist * 1.1;

        // Find clusters at cut height
        const activeClusters = [];

        for (let i = 0; i < this.data.length; i++) {
            activeClusters.push([i]);
        }

        let clusterCount = 0;

        for (const merge of this.merges) {
            if (merge.distance <= cutHeight) {
                // Merge the clusters
                // Find and combine
            } else {
                break;
            }
        }

        // Simplified: traverse merges and assign
        const assignments = new Array(this.data.length);
        let numClusters = 0;

        const getCluster = (nodeId, cutHeight) => {
            if (nodeId < this.data.length) {
                return [nodeId];
            }

            const merge = this.merges.find(m => m.id === nodeId);
            if (!merge) return [];

            if (merge.distance > cutHeight) {
                return [];
            }

            return [...getCluster(merge.left, cutHeight), ...getCluster(merge.right, cutHeight)];
        };

        // Find root clusters at threshold
        const assigned = new Set();
        const clusters = [];

        for (let i = this.merges.length - 1; i >= 0; i--) {
            const merge = this.merges[i];

            if (merge.distance > cutHeight) {
                // This merge is above threshold - its children are separate clusters
                if (merge.left < this.data.length && !assigned.has(merge.left)) {
                    clusters.push([merge.left]);
                    assigned.add(merge.left);
                } else if (merge.left >= this.data.length) {
                    const members = getCluster(merge.left, Infinity);
                    members.forEach(m => { if (!assigned.has(m)) { clusters.push([m]); assigned.add(m); } });
                }

                if (merge.right < this.data.length && !assigned.has(merge.right)) {
                    clusters.push([merge.right]);
                    assigned.add(merge.right);
                } else if (merge.right >= this.data.length) {
                    const members = getCluster(merge.right, Infinity);
                    members.forEach(m => { if (!assigned.has(m)) { clusters.push([m]); assigned.add(m); } });
                }
            }
        }

        // Assign remaining points
        for (let i = 0; i < this.data.length; i++) {
            if (!assigned.has(i)) {
                // Find which cluster this belongs to
                for (const merge of this.merges) {
                    if (merge.distance <= cutHeight && merge.members.includes(i)) {
                        // Find all members of this cluster
                        let found = false;
                        for (let c = 0; c < clusters.length; c++) {
                            if (merge.members.some(m => clusters[c].includes(m))) {
                                clusters[c].push(...merge.members.filter(m => !clusters[c].includes(m)));
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            clusters.push([...merge.members]);
                        }
                        merge.members.forEach(m => assigned.add(m));
                        break;
                    }
                }
            }
        }

        // Fallback: remaining unassigned
        for (let i = 0; i < this.data.length; i++) {
            if (!assigned.has(i)) {
                clusters.push([i]);
            }
        }

        // Assign labels
        clusters.forEach((cluster, idx) => {
            cluster.forEach(pt => {
                this.labels[pt] = idx;
            });
        });

        document.getElementById('num-clusters').textContent = new Set(this.labels).size;
    }

    updateStats() {
        document.getElementById('merge-steps').textContent = this.merges.length || '-';
        if (this.merges.length === 0) {
            document.getElementById('num-clusters').textContent = '-';
        }
    }

    render() {
        this.renderScatter();
        this.renderDendrogram();
    }

    renderScatter() {
        const ctx = this.scatterCtx;
        const w = this.scatterCanvas.width;
        const h = this.scatterCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        const scale = Math.min(w, h) * 0.4;
        const cx = w / 2;
        const cy = h / 2;

        for (let i = 0; i < this.data.length; i++) {
            const p = this.data[i];
            const px = cx + p.x * scale;
            const py = cy - p.y * scale;

            const label = this.labels ? this.labels[i] : 0;

            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fillStyle = this.colors[label % this.colors.length];
            ctx.fill();

            // Label number
            ctx.fillStyle = '#fff';
            ctx.font = '9px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(i, px, py + 3);
        }
    }

    renderDendrogram() {
        const ctx = this.dendrogramCtx;
        const w = this.dendrogramCanvas.width;
        const h = this.dendrogramCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        if (this.merges.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Click "Build Dendrogram"', w / 2, h / 2);
            return;
        }

        const n = this.data.length;
        const maxDist = Math.max(...this.merges.map(m => m.distance));

        // Leaf positions
        const leafX = {};
        for (let i = 0; i < n; i++) {
            leafX[i] = (i + 0.5) / n * (w - 40) + 20;
        }

        // Node positions
        const nodeX = { ...leafX };
        const nodeY = {};

        for (let i = 0; i < n; i++) {
            nodeY[i] = h - 30;
        }

        for (const merge of this.merges) {
            const leftX = nodeX[merge.left];
            const rightX = nodeX[merge.right];
            const mergeX = (leftX + rightX) / 2;
            const mergeY = h - 30 - (merge.distance / maxDist) * (h - 60);

            nodeX[merge.id] = mergeX;
            nodeY[merge.id] = mergeY;
        }

        // Draw threshold line
        const thresholdY = h - 30 - this.threshold * (h - 60);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, thresholdY);
        ctx.lineTo(w, thresholdY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw merges
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;

        for (const merge of this.merges) {
            const leftX = nodeX[merge.left];
            const leftY = nodeY[merge.left];
            const rightX = nodeX[merge.right];
            const rightY = nodeY[merge.right];
            const mergeY = nodeY[merge.id];

            ctx.beginPath();
            ctx.moveTo(leftX, leftY);
            ctx.lineTo(leftX, mergeY);
            ctx.lineTo(rightX, mergeY);
            ctx.lineTo(rightX, rightY);
            ctx.stroke();
        }

        // Draw leaf labels
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '9px Inter';
        ctx.textAlign = 'center';

        for (let i = 0; i < n; i++) {
            ctx.fillText(i, leafX[i], h - 15);
        }
    }
}

// Additional CSS
const style = document.createElement('style');
style.textContent = `
    .split-viz {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        min-height: 0;
    }
    .viz-half {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-sm);
        padding: 12px;
        display: flex;
        flex-direction: column;
    }
    .viz-half h3 {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        margin-bottom: 8px;
    }
    .viz-half canvas { flex: 1; width: 100%; }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    window.app = new HierarchicalApp();
});
