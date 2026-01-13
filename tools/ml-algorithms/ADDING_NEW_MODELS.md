# Adding New ML Model Visualizers

This guide explains how to add new step-by-step ML algorithm visualizers to the QML Visualization Hub.

## File Structure

```
tools/ml-algorithms/
├── your-algorithm.html    # Self-contained HTML file
```

## Template Structure

Every visualizer follows this layout:

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Algorithm Name + [Step] [Auto Run] [Reset] buttons │
├────────────────┬─────────────┬────────────────┬────────────┤
│ Training Data  │ Full        │ Visualization  │ Hyper-     │
│ [⛶ fullscreen] │ Calculations│ Canvas         │ parameters │
├────────────────┤ [⛶]         │                │            │
│ Core Metrics   │             │                │            │
│ [⛶ fullscreen] │             │                │            │
└────────────────┴─────────────┴────────────────┴────────────┘
```

**Left Column:** TWO separate equal-height panels, each with its own fullscreen button:
1. Training Data (observation table)
2. Core Metrics (epoch/iteration table)

## Required Features

### 1. Training Data Table
- Show all data points with row numbers (#)
- Include relevant features (X, Y, label, etc.)
- Add `id="data-row-{i}"` for hover highlighting

### 2. Epoch/Core Metrics Table
- Track key values at each step
- Example for Linear Regression: Epoch, Loss, w, b, ∂w, ∂b
- Example for K-Means: Iteration, Cluster assignments, Centroid positions

### 3. Fullscreen Support
Add to each panel header:
```html
<button class="btn-fs" onclick="openFullscreen('type')">⛶</button>
```

Include the fullscreen overlay and JavaScript:
```javascript
function openFullscreen(type) {
    const overlay = document.getElementById('fullscreen-overlay');
    overlay.classList.add('active');
    // Populate content based on type
}
function closeFullscreen() {
    document.getElementById('fullscreen-overlay').classList.remove('active');
}
```

### 4. Hover Interaction
```javascript
let pointPositions = [];  // Store {x, y, idx} for each point
let hoveredPoint = -1;

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let found = -1;
    pointPositions.forEach(p => {
        if (Math.hypot(p.x - mx, p.y - my) < 16) found = p.idx;
    });
    if (found !== hoveredPoint) {
        hoveredPoint = found;
        renderTable();  // Re-render with highlight
        render();       // Re-draw canvas
    }
});
```

### 5. Point Numbers on Graph
For each point, draw a number inside:
```javascript
ctx.fillStyle = '#fff';
ctx.font = 'bold 9px Inter';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(i + 1, px, py);
```

### 6. Random Data Button
```html
<button id="random-btn" class="btn btn-primary btn-block">🎲 Random Data</button>
```
```javascript
document.getElementById('random-btn').addEventListener('click', () => {
    data = generateData();
    reset();
});
```

## Algorithm-Specific Core Tables

| Algorithm | Core Metrics |
|-----------|-------------|
| Linear Regression | Epoch, Loss, w, b, ∂w, ∂b |
| Logistic Regression | Epoch, Loss, w₁, w₂, b |
| Decision Tree | Node, Gini/Entropy, Split Feature, Threshold |
| KNN | Query, Point, Distance, Selected |
| K-Means | Iteration, Centroid 1, Centroid 2, ..., Changes |
| SVM | Iteration, Margin, w₁, w₂, b |
| PCA | Component, Eigenvalue, Variance % |
| DBSCAN | Point, Neighbors, Type |
| Q-Learning | Episode, State, Action, Reward, Q-value |

## Registering in Hub

Add to `js/hub-app.js` in the ML category:
```javascript
{
    name: 'Your Algorithm',
    path: 'tools/ml-algorithms/your-algorithm.html',
    icon: '📊',
    description: 'Brief description'
}
```

## CSS Classes Reference

| Class | Purpose |
|-------|---------|
| `.data-table` | Styled table |
| `.data-table tr.highlighted td` | Highlighted row |
| `.calc-step` | Calculation step card |
| `.calc-step.active` | Current step |
| `.calc-box` | Code/formula box |
| `.btn-fs` | Fullscreen button |
| `.fullscreen-overlay` | Modal overlay |

## Testing Checklist

- [ ] Step button advances one step
- [ ] Auto Run progresses automatically
- [ ] Reset clears all state
- [ ] Random Data generates new dataset
- [ ] Fullscreen works on all panels
- [ ] Hover highlights table row
- [ ] Point numbers visible on graph
- [ ] Epoch table updates each step
