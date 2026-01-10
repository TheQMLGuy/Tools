/**
 * Prompt Engineering Tool - Application Controller
 * Handles UI interactions and updates
 */

// ============================================
// Initialize
// ============================================

const engine = new PromptEngine();

// DOM Elements
const inputSection = document.getElementById('input-section');
const analysisSection = document.getElementById('analysis-section');
const promptInput = document.getElementById('prompt-input');
const analyzeBtn = document.getElementById('analyze-btn');
const resetBtn = document.getElementById('reset-btn');
const copyBtn = document.getElementById('copy-btn');
const editOriginalBtn = document.getElementById('edit-original-btn');

const scoreBadge = document.getElementById('score-badge');
const scoreFill = document.getElementById('score-fill');
const scoreText = document.getElementById('score-text');

const principlesNav = document.getElementById('principles-nav');
const questionsContainer = document.getElementById('questions-container');
const improvedPrompt = document.getElementById('improved-prompt');

let currentPrinciple = null;
let analysisResult = null;

// ============================================
// Event Handlers
// ============================================

analyzeBtn.addEventListener('click', () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        promptInput.focus();
        return;
    }

    analyzePrompt(prompt);
});

resetBtn.addEventListener('click', () => {
    resetTool();
});

copyBtn.addEventListener('click', () => {
    const text = improvedPrompt.textContent;
    navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => {
            copyBtn.textContent = '📋 Copy';
        }, 2000);
    });
});

editOriginalBtn.addEventListener('click', () => {
    inputSection.classList.remove('hidden');
    analysisSection.classList.add('hidden');
});

// Enter key to analyze
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        analyzeBtn.click();
    }
});

// ============================================
// Core Functions
// ============================================

function analyzePrompt(prompt) {
    analysisResult = engine.analyzePrompt(prompt);

    // Show analysis section
    inputSection.classList.add('hidden');
    analysisSection.classList.remove('hidden');

    // Render principles nav
    renderPrinciplesNav();

    // Select first missing principle or first principle
    const firstPrinciple = analysisResult.missing[0] || Object.keys(PRINCIPLES)[0];
    selectPrinciple(firstPrinciple);

    // Update preview
    updatePreview();
    updateScore();
}

function renderPrinciplesNav() {
    principlesNav.innerHTML = '';

    for (const [key, principle] of Object.entries(PRINCIPLES)) {
        const tab = document.createElement('button');
        tab.className = 'principle-tab';
        tab.dataset.principle = key;

        // Check if any questions answered
        const answered = principle.questions.some(q => engine.answers[q.id]);
        if (answered) {
            tab.classList.add('completed');
        }

        if (key === currentPrinciple) {
            tab.classList.add('active');
        }

        tab.innerHTML = `${principle.icon} ${principle.name}`;
        tab.addEventListener('click', () => selectPrinciple(key));

        principlesNav.appendChild(tab);
    }
}

function selectPrinciple(principleKey) {
    currentPrinciple = principleKey;

    // Update nav
    document.querySelectorAll('.principle-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.principle === principleKey);
    });

    // Render questions
    renderQuestions(principleKey);
}

function renderQuestions(principleKey) {
    const principle = engine.getQuestions(principleKey);
    if (!principle) return;

    questionsContainer.innerHTML = `
        <div class="principle-intro">
            <p style="color: var(--text-secondary); margin-bottom: 16px;">
                ${principle.description}
            </p>
        </div>
    `;

    principle.questions.forEach(question => {
        const card = document.createElement('div');
        card.className = 'question-card';

        const existingAnswer = engine.answers[question.id] || '';

        card.innerHTML = `
            <div class="question-label">${question.text}</div>
            <div class="question-hint">💡 ${question.hint}</div>
            <textarea 
                class="question-input" 
                data-question-id="${question.id}"
                placeholder="${question.placeholder}"
            >${existingAnswer}</textarea>
        `;

        const textarea = card.querySelector('textarea');
        textarea.addEventListener('input', (e) => {
            engine.saveAnswer(question.id, e.target.value);
            updatePreview();
            updateScore();
            renderPrinciplesNav(); // Update completed status
        });

        questionsContainer.appendChild(card);
    });
}

function updatePreview() {
    const improved = engine.buildImprovedPrompt();
    improvedPrompt.textContent = improved;
}

function updateScore() {
    const score = engine.getImprovementScore();
    scoreBadge.textContent = `${score}% Enhanced`;
    scoreFill.style.width = `${score}%`;

    if (score === 0) {
        scoreText.textContent = 'Answer questions to enhance your prompt';
    } else if (score < 30) {
        scoreText.textContent = 'Good start! Keep adding details for better results';
    } else if (score < 60) {
        scoreText.textContent = 'Nice progress! Your prompt is becoming more refined';
    } else if (score < 100) {
        scoreText.textContent = 'Excellent! Your prompt is well-structured';
    } else {
        scoreText.textContent = '🎉 Perfect! Your prompt covers all key principles';
    }
}

function resetTool() {
    engine.reset();
    promptInput.value = '';
    currentPrinciple = null;
    analysisResult = null;

    inputSection.classList.remove('hidden');
    analysisSection.classList.add('hidden');

    promptInput.focus();
}

// ============================================
// Initialize on Load
// ============================================

promptInput.focus();
