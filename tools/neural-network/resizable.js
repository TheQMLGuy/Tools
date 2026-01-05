/**
 * Resizable Panes
 * Drag handles to resize the 3-column layout
 */

class ResizablePanes {
    constructor() {
        this.container = document.querySelector('.app-container.three-column');
        this.leftPanel = document.querySelector('.left-panel');
        this.rightPanel = document.querySelector('.right-panel');
        this.leftHandle = document.getElementById('resize-left');

        this.isResizing = false;
        this.currentHandle = null;
        this.startX = 0;
        this.startWidth = 0;

        this.minWidth = 200;
        this.maxWidthLeft = 400;
        this.maxWidthRight = 350;

        this.setupEvents();
    }

    setupEvents() {
        if (this.leftHandle) {
            this.leftHandle.addEventListener('mousedown', (e) => this.startResize(e, 'left'));
            console.log('ResizablePanes: Left handle initialized');
        } else {
            console.warn('ResizablePanes: Left handle not found');
        }

        document.addEventListener('mousemove', (e) => this.doResize(e));
        document.addEventListener('mouseup', () => this.stopResize());
    }

    startResize(e, handle) {
        e.preventDefault(); // Prevent text selection
        this.isResizing = true;
        this.currentHandle = handle;
        this.startX = e.clientX;

        if (handle === 'left') {
            this.startWidth = this.leftPanel.offsetWidth;
            console.log('Resize start. Width:', this.startWidth);
        }

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        if (this.leftHandle) this.leftHandle.classList.add('active');
    }

    doResize(e) {
        if (!this.isResizing) return;

        e.preventDefault();
        const deltaX = e.clientX - this.startX;

        if (this.currentHandle === 'left') {
            let newWidth = this.startWidth + deltaX;
            newWidth = Math.max(this.minWidth, Math.min(this.maxWidthLeft, newWidth));
            this.container.style.gridTemplateColumns = `${newWidth}px 1fr 220px`;
        }
    }

    stopResize() {
        if (!this.isResizing) return;

        this.isResizing = false;
        this.currentHandle = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        if (this.leftHandle) this.leftHandle.classList.remove('active');

        // Trigger resize on visualizers
        window.dispatchEvent(new Event('resize'));
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.resizablePanes = new ResizablePanes();
});
