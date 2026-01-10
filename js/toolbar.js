/**
 * Shared Tool Toolbar Component
 * Creates a uniform top toolbar for all QML Hub tools
 * Usage: Include this script and call ToolToolbar.init({...options})
 */

class ToolToolbar {
    static init(options = {}) {
        const {
            title = 'Tool',
            buttons = [],
            showClose = true,
            closeUrl = '../../index.html'
        } = options;

        // Create toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'tool-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-left">
                <span class="toolbar-title">${title}</span>
            </div>
            <div class="toolbar-center">
                ${buttons.map(btn => `
                    <button class="toolbar-btn ${btn.class || ''}" id="${btn.id || ''}" 
                        ${btn.disabled ? 'disabled' : ''}>
                        ${btn.label}
                    </button>
                `).join('')}
            </div>
            <div class="toolbar-right">
                ${showClose ? `<a href="${closeUrl}" class="toolbar-btn btn-close" title="Close">✕</a>` : ''}
            </div>
        `;

        // Insert at beginning of body
        document.body.insertBefore(toolbar, document.body.firstChild);

        // Add content wrapper if needed
        const existingContent = document.querySelector('.app-container, .main-content, main');
        if (existingContent) {
            existingContent.classList.add('tool-content');
        }

        // Attach button handlers
        buttons.forEach(btn => {
            if (btn.id && btn.handler) {
                const el = toolbar.querySelector(`#${btn.id}`);
                if (el) {
                    el.addEventListener('click', btn.handler);
                }
            }
        });

        return toolbar;
    }
}

// Auto-export for non-module usage
window.ToolToolbar = ToolToolbar;
