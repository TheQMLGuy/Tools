/**
 * Linked List Explorer - Visualization with Code Highlighting
 */

// Code for each language with line mappings for operations
const LINKED_LIST_CODE = {
    c: `struct Node {
    int data;
    struct Node* next;
};

struct Node* head = NULL;

// Insert at Head
void insertAtHead(int value) {
    struct Node* newNode = malloc(sizeof(struct Node));
    newNode->data = value;
    newNode->next = head;
    head = newNode;
}

// Insert at Tail
void insertAtTail(int value) {
    struct Node* newNode = malloc(sizeof(struct Node));
    newNode->data = value;
    newNode->next = NULL;
    
    if (head == NULL) {
        head = newNode;
        return;
    }
    
    struct Node* temp = head;
    while (temp->next != NULL) {
        temp = temp->next;
    }
    temp->next = newNode;
}

// Search
struct Node* search(int value) {
    struct Node* temp = head;
    while (temp != NULL) {
        if (temp->data == value) {
            return temp;
        }
        temp = temp->next;
    }
    return NULL;
}

// Delete Head
void deleteHead() {
    if (head == NULL) return;
    struct Node* temp = head;
    head = head->next;
    free(temp);
}`,

    cpp: `struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

Node* head = nullptr;

// Insert at Head
void insertAtHead(int value) {
    Node* newNode = new Node(value);
    newNode->next = head;
    head = newNode;
}

// Insert at Tail
void insertAtTail(int value) {
    Node* newNode = new Node(value);
    
    if (head == nullptr) {
        head = newNode;
        return;
    }
    
    Node* temp = head;
    while (temp->next != nullptr) {
        temp = temp->next;
    }
    temp->next = newNode;
}

// Search
Node* search(int value) {
    Node* temp = head;
    while (temp != nullptr) {
        if (temp->data == value) {
            return temp;
        }
        temp = temp->next;
    }
    return nullptr;
}

// Delete Head
void deleteHead() {
    if (head == nullptr) return;
    Node* temp = head;
    head = head->next;
    delete temp;
}`,

    python: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

head = None

# Insert at Head
def insert_at_head(value):
    global head
    new_node = Node(value)
    new_node.next = head
    head = new_node

# Insert at Tail
def insert_at_tail(value):
    global head
    new_node = Node(value)
    
    if head is None:
        head = new_node
        return
    
    temp = head
    while temp.next is not None:
        temp = temp.next
    temp.next = new_node

# Search
def search(value):
    temp = head
    while temp is not None:
        if temp.data == value:
            return temp
        temp = temp.next
    return None

# Delete Head
def delete_head():
    global head
    if head is None:
        return
    head = head.next`
};

// Line mappings for highlighting during operations
const LINE_MAPPINGS = {
    insertAtHead: { c: [9, 10, 11, 12, 13], cpp: [9, 10, 11, 12], python: [8, 9, 10, 11] },
    insertAtTail: { c: [17, 18, 19, 20, 22, 23, 24, 27, 28, 29, 30, 31, 32], cpp: [15, 16, 18, 19, 20, 23, 24, 25, 26, 27], python: [14, 15, 17, 18, 19, 22, 23, 24, 25] },
    search: { c: [36, 37, 38, 39, 40, 41, 42, 43], cpp: [30, 31, 32, 33, 34, 35, 36, 37], python: [28, 29, 30, 31, 32, 33] },
    deleteHead: { c: [47, 48, 49, 50, 51], cpp: [40, 41, 42, 43, 44], python: [36, 37, 38, 39] }
};

// State
let list = [];
let codeViewer;
let animationSpeed = 500;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    codeViewer = new CodeViewer('code-container');
    codeViewer.setCode(LINKED_LIST_CODE);

    document.getElementById('speed').addEventListener('input', (e) => {
        animationSpeed = 1100 - parseInt(e.target.value);
    });
});

function updateStatus(text, type = '') {
    const badge = document.getElementById('status');
    badge.textContent = text;
    badge.className = 'status-badge ' + type;
}

function renderList(highlightIndex = -1) {
    const container = document.getElementById('viz-area');

    if (list.length === 0) {
        container.innerHTML = '<div class="empty-state">List is empty. Insert a node to begin.</div>';
        return;
    }

    let html = '';
    list.forEach((value, idx) => {
        const isHead = idx === 0;
        const isTail = idx === list.length - 1;
        const isHighlighted = idx === highlightIndex;

        html += `
            <div class="ll-node">
                <div class="node-box ${isHead ? 'head' : ''} ${isTail ? 'tail' : ''} ${isHighlighted ? 'highlight' : ''}">
                    ${value}
                </div>
                ${!isTail ? '<div class="arrow"></div>' : ''}
            </div>
        `;
    });

    html += '<div class="null-marker">NULL</div>';
    container.innerHTML = html;
}

async function insertAtHead() {
    const value = parseInt(document.getElementById('node-value').value) || 0;
    updateStatus('Inserting at head...', 'warning');

    codeViewer.highlightLines(LINE_MAPPINGS.insertAtHead);
    await sleep(animationSpeed);

    list.unshift(value);
    renderList(0);

    await sleep(animationSpeed);
    codeViewer.clearHighlights();
    updateStatus('Inserted ' + value, 'success');
}

async function insertAtTail() {
    const value = parseInt(document.getElementById('node-value').value) || 0;
    updateStatus('Inserting at tail...', 'warning');

    codeViewer.highlightLines(LINE_MAPPINGS.insertAtTail);

    if (list.length === 0) {
        await sleep(animationSpeed);
        list.push(value);
        renderList(0);
    } else {
        // Traverse animation
        for (let i = 0; i < list.length; i++) {
            renderList(i);
            await sleep(animationSpeed / 2);
        }
        list.push(value);
        renderList(list.length - 1);
    }

    await sleep(animationSpeed);
    codeViewer.clearHighlights();
    updateStatus('Inserted ' + value, 'success');
}

async function searchNode() {
    const value = parseInt(document.getElementById('search-value').value);
    updateStatus('Searching for ' + value + '...', 'warning');

    codeViewer.highlightLines(LINE_MAPPINGS.search);

    let foundIndex = -1;
    for (let i = 0; i < list.length; i++) {
        renderList(i);
        await sleep(animationSpeed);

        if (list[i] === value) {
            foundIndex = i;
            break;
        }
    }

    if (foundIndex >= 0) {
        renderList(foundIndex);
        updateStatus('Found at index ' + foundIndex, 'success');
    } else {
        renderList();
        updateStatus('Not found', '');
    }

    await sleep(animationSpeed);
    codeViewer.clearHighlights();
}

async function deleteHead() {
    if (list.length === 0) {
        updateStatus('List is empty', '');
        return;
    }

    updateStatus('Deleting head...', 'warning');
    codeViewer.highlightLines(LINE_MAPPINGS.deleteHead);

    renderList(0);
    await sleep(animationSpeed);

    const removed = list.shift();
    renderList();

    await sleep(animationSpeed);
    codeViewer.clearHighlights();
    updateStatus('Deleted ' + removed, 'success');
}

function resetList() {
    list = [];
    renderList();
    codeViewer.clearHighlights();
    updateStatus('Ready');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
