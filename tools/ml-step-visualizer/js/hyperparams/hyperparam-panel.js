/**
 * Hyperparameter Panel Component
 * Dynamic UI for hyperparameter controls with tooltips
 */

class HyperparamPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentAlgorithm = null;
        this.values = {};
        this.onChangeCallback = null;
    }

    /**
     * Load algorithm parameters
     */
    load(algorithmKey) {
        this.currentAlgorithm = algorithmKey;
        const config = HyperparameterDB[algorithmKey];

        if (!config) {
            this.container.innerHTML = '<p class="text-muted">No parameters available</p>';
            return;
        }

        this.values = {};
        this.render(config);
    }

    /**
     * Render parameter controls
     */
    render(config) {
        this.container.innerHTML = '';

        // Algorithm info section
        const infoSection = document.createElement('div');
        infoSection.className = 'param-section';
        infoSection.innerHTML = `
            <div class="param-section-title">Algorithm Info</div>
            <p class="description" style="margin-bottom: 8px;">${config.description}</p>
            <code style="font-size: 0.7rem; color: var(--text-muted);">${config.importPath}</code>
        `;
        this.container.appendChild(infoSection);

        // Parameters section
        const paramsSection = document.createElement('div');
        paramsSection.className = 'param-section';
        paramsSection.innerHTML = '<div class="param-section-title">Parameters</div>';

        Object.entries(config.parameters).forEach(([key, param]) => {
            const paramDiv = this.createParamControl(key, param);
            paramsSection.appendChild(paramDiv);

            // Initialize value
            this.values[key] = param.default;
        });

        this.container.appendChild(paramsSection);

        // Taming strategy section
        if (config.tamingStrategy) {
            const strategySection = document.createElement('div');
            strategySection.className = 'param-section';
            strategySection.innerHTML = `
                <div class="param-section-title">💡 Tips</div>
                <ul class="taming-list">
                    ${config.tamingStrategy.slice(0, 4).map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            `;
            this.container.appendChild(strategySection);
        }
    }

    /**
     * Create individual parameter control
     */
    createParamControl(key, param) {
        const div = document.createElement('div');
        div.className = 'param-item';

        const header = document.createElement('div');
        header.className = 'param-header';

        // Label with tooltip
        const labelContainer = document.createElement('div');
        labelContainer.className = 'param-name';
        labelContainer.innerHTML = `
            <code>${key}</code>
            <span class="param-tooltip">
                <span class="param-tooltip-icon">?</span>
                <div class="param-tooltip-content">
                    <h4>${param.label}</h4>
                    <p>${param.description}</p>
                    ${this.renderGuidance(param.guidance)}
                </div>
            </span>
        `;

        // Value display
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'param-value';
        valueDisplay.id = `param-value-${key}`;
        valueDisplay.textContent = this.formatValue(param.default, param);

        header.appendChild(labelContainer);
        header.appendChild(valueDisplay);
        div.appendChild(header);

        // Control element
        const controlContainer = document.createElement('div');
        controlContainer.className = 'param-control';

        const control = this.createControl(key, param);
        controlContainer.appendChild(control);
        div.appendChild(controlContainer);

        // Description
        const desc = document.createElement('div');
        desc.className = 'param-description';
        desc.textContent = param.description;
        div.appendChild(desc);

        return div;
    }

    /**
     * Create specific control type
     */
    createControl(key, param) {
        let control;

        switch (param.type) {
            case 'select':
                control = document.createElement('select');
                control.className = 'select';
                param.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    if (opt === param.default) option.selected = true;
                    control.appendChild(option);
                });
                break;

            case 'int':
            case 'float':
                control = document.createElement('input');
                control.type = 'range';
                control.className = 'slider';
                control.min = param.range[0];
                control.max = param.range[1] || 100;
                control.step = param.step || (param.type === 'float' ? 0.01 : 1);
                control.value = param.default !== null ? param.default : (param.range[0] + param.range[1]) / 2;
                break;

            case 'boolean':
                control = document.createElement('input');
                control.type = 'checkbox';
                control.checked = param.default;
                control.style.width = 'auto';
                break;

            default:
                control = document.createElement('input');
                control.type = 'text';
                control.className = 'input';
                control.value = param.default;
        }

        control.id = `param-${key}`;
        control.dataset.key = key;

        // Add change listener
        control.addEventListener('input', (e) => this.handleChange(key, e.target, param));
        control.addEventListener('change', (e) => this.handleChange(key, e.target, param));

        return control;
    }

    /**
     * Handle parameter change
     */
    handleChange(key, element, param) {
        let value;

        switch (param.type) {
            case 'int':
                value = parseInt(element.value);
                break;
            case 'float':
                value = parseFloat(element.value);
                break;
            case 'boolean':
                value = element.checked;
                break;
            default:
                value = element.value;
        }

        this.values[key] = value;

        // Update display
        const display = document.getElementById(`param-value-${key}`);
        if (display) {
            display.textContent = this.formatValue(value, param);
        }

        // Callback
        if (this.onChangeCallback) {
            this.onChangeCallback(key, value, this.values);
        }
    }

    /**
     * Format value for display
     */
    formatValue(value, param) {
        if (value === null || value === undefined) return 'None';
        if (param.type === 'boolean') return value ? 'True' : 'False';
        if (param.type === 'float') {
            return typeof value === 'number' ? value.toFixed(4).replace(/\.?0+$/, '') : value;
        }
        return String(value);
    }

    /**
     * Render guidance section
     */
    renderGuidance(guidance) {
        if (!guidance) return '';

        let html = '<div class="param-guidance">';

        if (guidance.whenToIncrease) {
            html += `<div class="param-guidance-item">
                <span class="param-guidance-label guidance-increase">↑ Increase:</span>
                <span class="param-guidance-value">${guidance.whenToIncrease}</span>
            </div>`;
        }

        if (guidance.whenToDecrease) {
            html += `<div class="param-guidance-item">
                <span class="param-guidance-label guidance-decrease">↓ Decrease:</span>
                <span class="param-guidance-value">${guidance.whenToDecrease}</span>
            </div>`;
        }

        if (guidance.tuningRange) {
            html += `<div class="param-guidance-item">
                <span class="param-guidance-label">Range:</span>
                <span class="param-guidance-value">${guidance.tuningRange}</span>
            </div>`;
        }

        if (guidance.general) {
            html += `<div class="param-guidance-item">
                <span class="param-guidance-label">Note:</span>
                <span class="param-guidance-value">${guidance.general}</span>
            </div>`;
        }

        html += '</div>';
        return html;
    }

    /**
     * Get current values
     */
    getValues() {
        return { ...this.values };
    }

    /**
     * Set value programmatically
     */
    setValue(key, value) {
        this.values[key] = value;

        const control = document.getElementById(`param-${key}`);
        if (control) {
            if (control.type === 'checkbox') {
                control.checked = value;
            } else {
                control.value = value;
            }
        }

        const display = document.getElementById(`param-value-${key}`);
        if (display) {
            const param = HyperparameterDB[this.currentAlgorithm]?.parameters[key];
            display.textContent = this.formatValue(value, param || {});
        }
    }

    /**
     * Register change callback
     */
    onChange(callback) {
        this.onChangeCallback = callback;
    }
}

// Add taming list styles
const tamingStyles = document.createElement('style');
tamingStyles.textContent = `
    .taming-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .taming-list li {
        font-size: 0.7rem;
        color: var(--text-muted);
        padding: 4px 0 4px 16px;
        position: relative;
        line-height: 1.4;
    }
    
    .taming-list li::before {
        content: '→';
        position: absolute;
        left: 0;
        color: var(--success);
    }
`;
document.head.appendChild(tamingStyles);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HyperparamPanel;
}
