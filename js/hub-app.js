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
        description: 'Classic ML algorithms with interactive visualizations.',
        tools: [
            {
                id: 'regression',
                name: 'Regression',
                icon: '📈',
                description: 'Fit curves to continuous functions like sine, cosine, and polynomials.',
                path: 'tools/neural-network/index.html',
                hash: 'regression'
            },
            {
                id: 'classification',
                name: 'Classification',
                icon: '🎯',
                description: 'Classify 2D points and visualize decision boundaries in real-time.',
                path: 'tools/neural-network/index.html',
                hash: 'classification'
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

    // Render tool cards
    renderToolCards(category.tools);

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
