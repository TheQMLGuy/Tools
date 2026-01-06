/**
 * STEM Visualization Hub - Main Application
 * Handles navigation between categories and tools
 */

// ============================================
// Tool Configuration
// ============================================

const CATEGORIES = {
    math: {
        name: 'Mathematics',
        icon: '📐',
        description: 'Explore operators, functions, and visualizations in mathematical spaces.',
        tools: [
            {
                id: 'operators-matrices',
                name: 'Operators As Matrices',
                icon: '⊗',
                description: 'Visualize how mathematical operators can be represented as matrix operations.',
                path: 'tools/operators-matrices/index.html'
            },
            {
                id: 'parallel-axes',
                name: 'Parallel Axes Visualizer',
                icon: '📊',
                description: 'Explore functions through parallel coordinate visualization.',
                path: 'tools/parallel-axes/index.html'
            },
            {
                id: 'function-analyzer',
                name: 'Function Analyzer',
                icon: '📈',
                description: '2D/3D function analysis with derivatives, integrals, and Taylor series.',
                path: 'tools/function-analyzer/index.html'
            },
            {
                id: 'cylinderviz',
                name: 'CylinderViz Plotter',
                icon: '⬡',
                description: 'Multi-dimensional feature relationship visualizer using cylindrical coordinates.',
                path: 'tools/cylinder-viz/index.html'
            }
        ]
    },
    ml: {
        name: 'Machine Learning',
        icon: '🤖',
        description: 'Classic ML algorithms - supervised, unsupervised, reinforcement, and semi-supervised.',
        subcategories: true,
        tools: [
            // Supervised Learning
            {
                id: 'linear-regression',
                name: 'Linear Regression',
                icon: '📈',
                description: 'Fit a line to data using gradient descent with live loss visualization.',
                path: 'tools/ml-algorithms/linear-regression.html',
                category: 'Supervised Learning'
            },
            {
                id: 'logistic-regression',
                name: 'Logistic Regression',
                icon: '🎯',
                description: 'Binary classification with sigmoid activation and decision boundary.',
                path: 'tools/ml-algorithms/logistic-regression.html',
                category: 'Supervised Learning'
            },
            {
                id: 'decision-tree',
                name: 'Decision Tree',
                icon: '🌳',
                description: 'Watch a tree grow node-by-node as it learns to split data.',
                path: 'tools/ml-algorithms/decision-tree.html',
                category: 'Supervised Learning'
            },
            {
                id: 'random-forest',
                name: 'Random Forest',
                icon: '🌲',
                description: 'Ensemble of decision trees with bagging visualization.',
                path: 'tools/ml-algorithms/random-forest.html',
                category: 'Supervised Learning'
            },
            {
                id: 'knn',
                name: 'K-Nearest Neighbors',
                icon: '🎯',
                description: 'Watch neighbor search and voting in real-time.',
                path: 'tools/ml-algorithms/knn.html',
                category: 'Supervised Learning'
            },
            {
                id: 'svm',
                name: 'Support Vector Machine',
                icon: '⚔️',
                description: 'Maximum margin classifier with kernel trick visualization.',
                path: 'tools/ml-algorithms/svm.html',
                category: 'Supervised Learning'
            },
            {
                id: 'naive-bayes',
                name: 'Naive Bayes',
                icon: '📊',
                description: 'Probabilistic classification with conditional probability display.',
                path: 'tools/ml-algorithms/naive-bayes.html',
                category: 'Supervised Learning'
            },
            // Unsupervised Learning
            {
                id: 'kmeans',
                name: 'K-Means Clustering',
                icon: '🔵',
                description: 'Animated centroid movement and cluster assignment.',
                path: 'tools/ml-algorithms/kmeans.html',
                category: 'Unsupervised Learning'
            },
            {
                id: 'dbscan',
                name: 'DBSCAN',
                icon: '🔴',
                description: 'Density-based clustering with epsilon-neighborhood visualization.',
                path: 'tools/ml-algorithms/dbscan.html',
                category: 'Unsupervised Learning'
            },
            {
                id: 'pca',
                name: 'PCA',
                icon: '📉',
                description: 'Principal component analysis with variance explained.',
                path: 'tools/ml-algorithms/pca.html',
                category: 'Unsupervised Learning'
            },
            {
                id: 'hierarchical',
                name: 'Hierarchical Clustering',
                icon: '🌿',
                description: 'Dendrogram construction with linkage methods.',
                path: 'tools/ml-algorithms/hierarchical.html',
                category: 'Unsupervised Learning'
            },
            // Reinforcement Learning
            {
                id: 'q-learning',
                name: 'Q-Learning',
                icon: '🎮',
                description: 'Grid world with live Q-table and policy visualization.',
                path: 'tools/ml-algorithms/q-learning.html',
                category: 'Reinforcement Learning'
            },
            {
                id: 'multi-armed-bandit',
                name: 'Multi-Armed Bandit',
                icon: '🎰',
                description: 'Explore-exploit tradeoff with UCB and epsilon-greedy.',
                path: 'tools/ml-algorithms/bandit.html',
                category: 'Reinforcement Learning'
            },
            // Semi-Supervised Learning
            {
                id: 'self-training',
                name: 'Self-Training',
                icon: '🔄',
                description: 'Watch pseudo-labels propagate through unlabeled data.',
                path: 'tools/ml-algorithms/self-training.html',
                category: 'Semi-Supervised Learning'
            },
            {
                id: 'label-propagation',
                name: 'Label Propagation',
                icon: '📡',
                description: 'Graph-based label spreading visualization.',
                path: 'tools/ml-algorithms/label-propagation.html',
                category: 'Semi-Supervised Learning'
            }
        ]
    },
    dl: {
        name: 'Deep Learning',
        icon: '🧠',
        description: 'Neural network architectures from feedforward to transformers.',
        tools: [
            {
                id: 'feedforward',
                name: 'Feedforward Network',
                icon: '🕸️',
                description: 'Classic multi-layer perceptron with backpropagation visualization.',
                path: 'tools/neural-network/index.html',
                hash: 'regression'
            },
            {
                id: 'classification',
                name: 'Classification Network',
                icon: '🎯',
                description: 'Neural network for 2D point classification with decision boundaries.',
                path: 'tools/neural-network/index.html',
                hash: 'classification'
            },
            {
                id: 'rnn',
                name: 'Recurrent Neural Network',
                icon: '🔄',
                description: 'Learn sequences and predict patterns using hidden state memory.',
                path: 'tools/neural-network/index.html',
                hash: 'rnn'
            },
            {
                id: 'lstm',
                name: 'LSTM Network',
                icon: '🧠',
                description: 'Advanced RNN with gates to control information flow.',
                path: 'tools/neural-network/index.html',
                hash: 'lstm'
            },
            {
                id: 'transformer',
                name: 'Transformer',
                icon: '⚡',
                description: 'Self-attention mechanism for parallel sequence processing.',
                path: 'tools/neural-network/index.html',
                hash: 'transformer'
            },
            {
                id: 'cnn',
                name: 'CNN',
                icon: '🖼️',
                description: 'Convolutional neural network for spatial pattern recognition.',
                path: 'tools/neural-network/index.html',
                hash: 'cnn'
            }
        ]
    },
    quantum: {
        name: 'Quantum Computing',
        icon: '⚛️',
        description: 'Design quantum circuits and visualize qubit states.',
        tools: [
            {
                id: 'circuit-playground',
                name: 'Quantum Circuit Playground',
                icon: '🔮',
                description: 'Design, simulate, and analyze quantum circuits with Bloch sphere visualization.',
                path: 'tools/quantum-circuits/index.html'
            }
        ]
    }
};

// ============================================
// State Management
// ============================================

let currentView = 'landing'; // 'landing', 'subcategory', 'tool'
let currentCategory = null;
let currentTool = null;

// ============================================
// DOM Elements
// ============================================

const landingPage = document.getElementById('landing-page');
const subcategoryPage = document.getElementById('subcategory-page');
const toolViewer = document.getElementById('tool-viewer');

const categoryCardsContainer = document.getElementById('category-cards');
const toolCardsContainer = document.getElementById('tool-cards');

const categoryIcon = document.getElementById('category-icon');
const categoryName = document.getElementById('category-name');

const toolIframe = document.getElementById('tool-iframe');
const toolName = document.getElementById('tool-name');
const loadingOverlay = document.getElementById('loading-overlay');

// ============================================
// Navigation Functions
// ============================================

function showLanding() {
    currentView = 'landing';
    currentCategory = null;
    currentTool = null;

    landingPage.classList.remove('hidden');
    subcategoryPage.classList.add('hidden');
    toolViewer.classList.add('hidden');

    // Clear iframe
    toolIframe.src = '';

    // Update URL
    history.pushState({}, '', window.location.pathname);
}

function showCategory(categoryId) {
    const category = CATEGORIES[categoryId];
    if (!category) return;

    currentView = 'subcategory';
    currentCategory = categoryId;

    // Update header
    categoryIcon.textContent = category.icon;
    categoryName.textContent = category.name;

    // Render tool cards (grouped if has subcategories)
    if (category.subcategories) {
        renderGroupedToolCards(category.tools);
    } else {
        renderToolCards(category.tools);
    }

    // Show subcategory page
    landingPage.classList.add('hidden');
    subcategoryPage.classList.remove('hidden');
    toolViewer.classList.add('hidden');

    // Update URL
    history.pushState({ category: categoryId }, '', `#${categoryId}`);
}

function showTool(categoryId, toolId) {
    const category = CATEGORIES[categoryId];
    if (!category) return;

    const tool = category.tools.find(t => t.id === toolId);
    if (!tool) return;

    currentView = 'tool';
    currentCategory = categoryId;
    currentTool = toolId;

    // Update tool name
    toolName.textContent = tool.name;

    // Show loading
    loadingOverlay.classList.remove('hidden');

    // Build URL with hash if needed
    let toolUrl = tool.path;
    if (tool.hash) {
        toolUrl += `#${tool.hash}`;
    }

    // Load tool in iframe
    toolIframe.src = toolUrl;

    // Show tool viewer
    landingPage.classList.add('hidden');
    subcategoryPage.classList.add('hidden');
    toolViewer.classList.remove('hidden');

    // Update URL
    history.pushState({ category: categoryId, tool: toolId }, '', `#${categoryId}/${toolId}`);
}

// ============================================
// Rendering Functions
// ============================================

function renderToolCards(tools) {
    toolCardsContainer.innerHTML = tools.map(tool => `
        <div class="tool-card" data-tool-id="${tool.id}">
            <span class="tool-icon">${tool.icon}</span>
            <h3>${tool.name}</h3>
            <p>${tool.description}</p>
            <span class="tool-arrow">→</span>
        </div>
    `).join('');

    // Add click handlers
    toolCardsContainer.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', () => {
            const toolId = card.dataset.toolId;
            showTool(currentCategory, toolId);
        });
    });
}

function renderGroupedToolCards(tools) {
    // Group tools by category
    const groups = {};
    tools.forEach(tool => {
        const cat = tool.category || 'Other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(tool);
    });

    // Render grouped
    let html = '';
    for (const [groupName, groupTools] of Object.entries(groups)) {
        html += `<div class="tool-group">
            <h3 class="tool-group-title">${groupName}</h3>
            <div class="tool-group-cards">
                ${groupTools.map(tool => `
                    <div class="tool-card" data-tool-id="${tool.id}">
                        <span class="tool-icon">${tool.icon}</span>
                        <h3>${tool.name}</h3>
                        <p>${tool.description}</p>
                        <span class="tool-arrow">→</span>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    toolCardsContainer.innerHTML = html;

    // Add click handlers
    toolCardsContainer.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', () => {
            const toolId = card.dataset.toolId;
            showTool(currentCategory, toolId);
        });
    });
}

// ============================================
// Event Handlers
// ============================================

// Category card clicks
categoryCardsContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.category-card');
    if (card) {
        const categoryId = card.dataset.category;
        showCategory(categoryId);
    }
});

// Back button
document.getElementById('back-to-home').addEventListener('click', showLanding);

// Close tool button
document.getElementById('close-tool').addEventListener('click', () => {
    if (currentCategory) {
        showCategory(currentCategory);
    } else {
        showLanding();
    }
});

// Open in new tab
document.getElementById('open-new-tab').addEventListener('click', () => {
    if (currentCategory && currentTool) {
        const category = CATEGORIES[currentCategory];
        const tool = category.tools.find(t => t.id === currentTool);
        if (tool) {
            let url = tool.path;
            if (tool.hash) url += `#${tool.hash}`;
            window.open(url, '_blank');
        }
    }
});

// Iframe load complete
toolIframe.addEventListener('load', () => {
    loadingOverlay.classList.add('hidden');
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (currentView === 'tool') {
            showCategory(currentCategory);
        } else if (currentView === 'subcategory') {
            showLanding();
        }
    }
});

// Browser back/forward
window.addEventListener('popstate', () => {
    handleUrlHash();
});

// ============================================
// URL Hash Routing
// ============================================

function handleUrlHash() {
    const hash = window.location.hash.slice(1); // Remove #

    if (!hash) {
        showLanding();
        return;
    }

    const parts = hash.split('/');
    const categoryId = parts[0];
    const toolId = parts[1];

    if (toolId && CATEGORIES[categoryId]) {
        showTool(categoryId, toolId);
    } else if (CATEGORIES[categoryId]) {
        showCategory(categoryId);
    } else {
        showLanding();
    }
}

// ============================================
// Initialize
// ============================================

function init() {
    // Handle initial URL hash
    handleUrlHash();
}

// Start app
init();
