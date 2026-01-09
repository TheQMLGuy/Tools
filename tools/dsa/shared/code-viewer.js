/**
 * DSA Common - Code Viewer with Line Highlighting
 * Provides synchronized code highlighting during algorithm visualization
 */

class CodeViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`CodeViewer: Container #${containerId} not found`);
            return;
        }
        this.languages = {};
        this.currentLang = 'c';
        this.highlightedLines = new Set();
        this.render();
    }

    setCode(codeByLanguage) {
        // codeByLanguage: { c: "...", cpp: "...", python: "..." }
        this.languages = {};
        for (const [lang, code] of Object.entries(codeByLanguage)) {
            const lines = code.trim().replace(/\r\n/g, '\n').split('\n');
            this.languages[lang] = lines;
        }

        if (!this.languages[this.currentLang]) {
            this.currentLang = Object.keys(this.languages)[0] || 'c';
        }

        this.renderTabs();
        this.renderCode();
    }

    render() {
        this.container.innerHTML = `
            <div class="code-panel">
                <div class="lang-tabs" id="cv-tabs"></div>
                <div class="code-content" id="cv-content"></div>
            </div>
        `;
        this.tabsEl = this.container.querySelector('#cv-tabs');
        this.contentEl = this.container.querySelector('#cv-content');
    }

    renderTabs() {
        if (!this.tabsEl) return;

        const langLabels = { c: 'C', cpp: 'C++', python: 'Python', java: 'Java', js: 'JavaScript' };

        this.tabsEl.innerHTML = Object.keys(this.languages).map(lang => `
            <button class="lang-tab ${lang === this.currentLang ? 'active' : ''}" 
                    data-lang="${lang}">
                ${langLabels[lang] || lang.toUpperCase()}
            </button>
        `).join('');

        this.tabsEl.querySelectorAll('.lang-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchLang(tab.dataset.lang));
        });
    }

    switchLang(lang) {
        if (!this.languages[lang]) return;
        this.currentLang = lang;
        this.renderTabs();
        this.renderCode();
    }

    renderCode() {
        if (!this.contentEl || !this.languages[this.currentLang]) return;

        const lines = this.languages[this.currentLang];
        this.contentEl.innerHTML = lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = this.highlightedLines.has(lineNum);
            return `
                <div class="code-line ${isHighlighted ? 'highlight' : ''}" data-line="${lineNum}">
                    <span class="line-num">${lineNum}</span>
                    <span class="line-text">${this.escapeHtml(line)}</span>
                </div>
            `;
        }).join('');
    }

    highlightLines(lineNumbers) {
        // lineNumbers can be a single number, array, or object { c: [...], cpp: [...], python: [...] }
        this.highlightedLines.clear();

        let lines = [];
        if (typeof lineNumbers === 'number') {
            lines = [lineNumbers];
        } else if (Array.isArray(lineNumbers)) {
            lines = lineNumbers;
        } else if (typeof lineNumbers === 'object' && lineNumbers !== null) {
            // Per-language line numbers
            lines = lineNumbers[this.currentLang] || [];
        }

        lines.forEach(n => this.highlightedLines.add(n));
        this.applyHighlights();
    }

    applyHighlights() {
        if (!this.contentEl) return;

        const allLines = this.contentEl.querySelectorAll('.code-line');
        allLines.forEach(el => {
            const lineNum = parseInt(el.dataset.line);
            if (this.highlightedLines.has(lineNum)) {
                el.classList.add('highlight');
                // Scroll into view if needed
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                el.classList.remove('highlight');
            }
        });
    }

    clearHighlights() {
        this.highlightedLines.clear();
        if (this.contentEl) {
            this.contentEl.querySelectorAll('.code-line.highlight').forEach(el => {
                el.classList.remove('highlight');
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use
window.CodeViewer = CodeViewer;
