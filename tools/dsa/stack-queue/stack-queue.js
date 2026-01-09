/**
 * Stack & Queue Visualization with Code Highlighting
 */

const STACK_CODE = {
    c: `#define MAX_SIZE 100
int stack[MAX_SIZE];
int top = -1;

// Push operation
void push(int value) {
    if (top >= MAX_SIZE - 1) {
        printf("Stack Overflow\\n");
        return;
    }
    top++;
    stack[top] = value;
}

// Pop operation
int pop() {
    if (top < 0) {
        printf("Stack Underflow\\n");
        return -1;
    }
    int value = stack[top];
    top--;
    return value;
}

// Peek operation
int peek() {
    if (top < 0) {
        return -1;
    }
    return stack[top];
}`,

    cpp: `class Stack {
    vector<int> data;
public:
    // Push operation
    void push(int value) {
        data.push_back(value);
    }
    
    // Pop operation
    int pop() {
        if (data.empty()) {
            throw runtime_error("Stack Underflow");
        }
        int value = data.back();
        data.pop_back();
        return value;
    }
    
    // Peek operation
    int peek() {
        if (data.empty()) {
            return -1;
        }
        return data.back();
    }
};`,

    python: `class Stack:
    def __init__(self):
        self.items = []
    
    # Push operation
    def push(self, value):
        self.items.append(value)
    
    # Pop operation
    def pop(self):
        if not self.items:
            raise Exception("Stack Underflow")
        return self.items.pop()
    
    # Peek operation
    def peek(self):
        if not self.items:
            return None
        return self.items[-1]`
};

const QUEUE_CODE = {
    c: `#define MAX_SIZE 100
int queue[MAX_SIZE];
int front = 0, rear = -1, count = 0;

// Enqueue operation
void enqueue(int value) {
    if (count >= MAX_SIZE) {
        printf("Queue Overflow\\n");
        return;
    }
    rear = (rear + 1) % MAX_SIZE;
    queue[rear] = value;
    count++;
}

// Dequeue operation
int dequeue() {
    if (count <= 0) {
        printf("Queue Underflow\\n");
        return -1;
    }
    int value = queue[front];
    front = (front + 1) % MAX_SIZE;
    count--;
    return value;
}

// Peek front
int peekFront() {
    if (count <= 0) {
        return -1;
    }
    return queue[front];
}`,

    cpp: `class Queue {
    deque<int> data;
public:
    // Enqueue operation
    void enqueue(int value) {
        data.push_back(value);
    }
    
    // Dequeue operation
    int dequeue() {
        if (data.empty()) {
            throw runtime_error("Queue Underflow");
        }
        int value = data.front();
        data.pop_front();
        return value;
    }
    
    // Peek front
    int peekFront() {
        if (data.empty()) {
            return -1;
        }
        return data.front();
    }
};`,

    python: `from collections import deque

class Queue:
    def __init__(self):
        self.items = deque()
    
    # Enqueue operation
    def enqueue(self, value):
        self.items.append(value)
    
    # Dequeue operation
    def dequeue(self):
        if not self.items:
            raise Exception("Queue Underflow")
        return self.items.popleft()
    
    # Peek front
    def peek_front(self):
        if not self.items:
            return None
        return self.items[0]`
};

const LINE_MAPPINGS = {
    stack: {
        push: { c: [7, 8, 9, 10, 11], cpp: [5, 6], python: [6, 7] },
        pop: { c: [15, 16, 17, 18, 19, 20, 21], cpp: [10, 11, 12, 13, 14, 15], python: [10, 11, 12, 13] },
        peek: { c: [25, 26, 27, 28], cpp: [19, 20, 21, 22], python: [16, 17, 18, 19] }
    },
    queue: {
        enqueue: { c: [6, 7, 8, 9, 10, 11, 12], cpp: [5, 6], python: [8, 9] },
        dequeue: { c: [16, 17, 18, 19, 20, 21, 22, 23], cpp: [10, 11, 12, 13, 14, 15], python: [12, 13, 14, 15] },
        peek: { c: [27, 28, 29, 30], cpp: [19, 20, 21, 22], python: [18, 19, 20, 21] }
    }
};

let stack = [];
let queue = [];
let codeViewer;
let currentMode = 'stack';

document.addEventListener('DOMContentLoaded', () => {
    codeViewer = new CodeViewer('code-container');
    codeViewer.setCode(STACK_CODE);

    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelector('.mode-tab.active').classList.remove('active');
            tab.classList.add('active');
            currentMode = tab.dataset.mode;
            codeViewer.setCode(currentMode === 'stack' ? STACK_CODE : QUEUE_CODE);
        });
    });
});

function updateStatus(text, type = '') {
    const badge = document.getElementById('status');
    badge.textContent = text;
    badge.className = 'status-badge ' + type;
}

function renderStack(highlightIdx = -1) {
    const container = document.getElementById('stack-viz');
    if (stack.length === 0) {
        container.innerHTML = '<div class="empty-msg">Stack is empty</div>';
        return;
    }
    container.innerHTML = stack.map((val, idx) => `
        <div class="element ${idx === highlightIdx ? 'highlight' : ''}">${val}</div>
    `).join('');
}

function renderQueue(highlightIdx = -1) {
    const container = document.getElementById('queue-viz');
    if (queue.length === 0) {
        container.innerHTML = '<div class="empty-msg">Queue is empty</div>';
        return;
    }
    container.innerHTML = queue.map((val, idx) => `
        <div class="element ${idx === highlightIdx ? 'highlight' : ''}">${val}</div>
    `).join('');
}

async function pushStack() {
    const value = parseInt(document.getElementById('stack-value').value) || 0;
    codeViewer.setCode(STACK_CODE);
    codeViewer.highlightLines(LINE_MAPPINGS.stack.push);
    updateStatus('Pushing ' + value + '...', 'warning');

    await sleep(300);
    stack.push(value);
    renderStack(stack.length - 1);

    await sleep(500);
    codeViewer.clearHighlights();
    renderStack();
    updateStatus('Pushed ' + value, 'success');
}

async function popStack() {
    if (stack.length === 0) {
        updateStatus('Stack Underflow!', '');
        return;
    }

    codeViewer.setCode(STACK_CODE);
    codeViewer.highlightLines(LINE_MAPPINGS.stack.pop);
    renderStack(stack.length - 1);
    updateStatus('Popping...', 'warning');

    await sleep(500);
    const value = stack.pop();
    renderStack();

    codeViewer.clearHighlights();
    updateStatus('Popped ' + value, 'success');
}

async function peekStack() {
    if (stack.length === 0) {
        updateStatus('Stack is empty', '');
        return;
    }

    codeViewer.setCode(STACK_CODE);
    codeViewer.highlightLines(LINE_MAPPINGS.stack.peek);
    renderStack(stack.length - 1);
    updateStatus('Top: ' + stack[stack.length - 1], 'success');

    await sleep(1000);
    codeViewer.clearHighlights();
    renderStack();
}

async function enqueue() {
    const value = parseInt(document.getElementById('queue-value').value) || 0;
    codeViewer.setCode(QUEUE_CODE);
    codeViewer.highlightLines(LINE_MAPPINGS.queue.enqueue);
    updateStatus('Enqueueing ' + value + '...', 'warning');

    await sleep(300);
    queue.push(value);
    renderQueue(queue.length - 1);

    await sleep(500);
    codeViewer.clearHighlights();
    renderQueue();
    updateStatus('Enqueued ' + value, 'success');
}

async function dequeue() {
    if (queue.length === 0) {
        updateStatus('Queue Underflow!', '');
        return;
    }

    codeViewer.setCode(QUEUE_CODE);
    codeViewer.highlightLines(LINE_MAPPINGS.queue.dequeue);
    renderQueue(0);
    updateStatus('Dequeueing...', 'warning');

    await sleep(500);
    const value = queue.shift();
    renderQueue();

    codeViewer.clearHighlights();
    updateStatus('Dequeued ' + value, 'success');
}

async function peekQueue() {
    if (queue.length === 0) {
        updateStatus('Queue is empty', '');
        return;
    }

    codeViewer.setCode(QUEUE_CODE);
    codeViewer.highlightLines(LINE_MAPPINGS.queue.peek);
    renderQueue(0);
    updateStatus('Front: ' + queue[0], 'success');

    await sleep(1000);
    codeViewer.clearHighlights();
    renderQueue();
}

function resetAll() {
    stack = [];
    queue = [];
    renderStack();
    renderQueue();
    codeViewer.clearHighlights();
    updateStatus('Ready');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
