/**
 * Binary Search Visualization with Code Highlighting
 */

const BINARY_SEARCH_CODE = {
    c: `int binarySearch(int arr[], int n, int target) {
    int left = 0;
    int right = n - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        // Check if target is at mid
        if (arr[mid] == target) {
            return mid;  // Found!
        }
        
        // Target is greater, ignore left half
        if (arr[mid] < target) {
            left = mid + 1;
        }
        // Target is smaller, ignore right half
        else {
            right = mid - 1;
        }
    }
    
    return -1;  // Not found
}`,

    cpp: `int binarySearch(vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size() - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        // Check if target is at mid
        if (arr[mid] == target) {
            return mid;  // Found!
        }
        
        // Target is greater, ignore left half
        if (arr[mid] < target) {
            left = mid + 1;
        }
        // Target is smaller, ignore right half
        else {
            right = mid - 1;
        }
    }
    
    return -1;  // Not found
}`,

    python: `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    
    while left <= right:
        mid = left + (right - left) // 2
        
        # Check if target is at mid
        if arr[mid] == target:
            return mid  # Found!
        
        # Target is greater, ignore left half
        if arr[mid] < target:
            left = mid + 1
        # Target is smaller, ignore right half
        else:
            right = mid - 1
    
    return -1  # Not found`
};

const LINE_MAPPINGS = {
    init: { c: [2, 3], cpp: [2, 3], python: [2, 3] },
    loop: { c: [5], cpp: [5], python: [5] },
    calcMid: { c: [6], cpp: [6], python: [6] },
    checkMid: { c: [9, 10], cpp: [9, 10], python: [9, 10] },
    goRight: { c: [14, 15], cpp: [14, 15], python: [13, 14] },
    goLeft: { c: [18, 19], cpp: [18, 19], python: [16, 17] },
    notFound: { c: [23], cpp: [23], python: [19] }
};

let array = [];
let codeViewer;
let isRunning = false;
let animationSpeed = 800;
let comparisons = 0;

document.addEventListener('DOMContentLoaded', () => {
    codeViewer = new CodeViewer('code-container');
    codeViewer.setCode(BINARY_SEARCH_CODE);

    document.getElementById('speed').addEventListener('input', (e) => {
        animationSpeed = parseInt(e.target.value);
    });

    generateArray();
});

function generateArray() {
    if (isRunning) return;

    // Generate sorted array
    const size = 15;
    array = [];
    let val = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < size; i++) {
        array.push(val);
        val += Math.floor(Math.random() * 10) + 1;
    }

    // Set a random target from the array (80% chance) or outside (20%)
    const target = Math.random() < 0.8
        ? array[Math.floor(Math.random() * array.length)]
        : array[array.length - 1] + Math.floor(Math.random() * 20) + 1;

    document.getElementById('search-target').value = target;
    document.getElementById('target-display').textContent = target;
    comparisons = 0;
    document.getElementById('comparisons').textContent = 0;

    renderArray();
    updateStatus('Ready');
}

function renderArray(left = -1, right = -1, mid = -1, eliminated = [], found = -1) {
    const container = document.getElementById('viz-area');

    container.innerHTML = array.map((val, idx) => {
        let classes = 'array-cell';
        if (idx === found) classes += ' found';
        else if (idx === mid) classes += ' mid';
        else if (idx === left) classes += ' left';
        else if (idx === right) classes += ' right';
        if (eliminated.includes(idx)) classes += ' eliminated';

        let pointers = '';
        if (idx === left && left !== -1) pointers += '<span class="pointer left-ptr">L</span>';
        if (idx === right && right !== -1) pointers += '<span class="pointer right-ptr">R</span>';
        if (idx === mid && mid !== -1) pointers += '<span class="pointer mid-ptr">M</span>';

        return `
            <div class="${classes}">
                <span class="index">[${idx}]</span>
                ${val}
                ${pointers}
            </div>
        `;
    }).join('');
}

function updateStatus(text, type = '') {
    const badge = document.getElementById('status');
    badge.textContent = text;
    badge.className = 'status-badge ' + type;
}

async function startSearch() {
    if (isRunning) return;

    const target = parseInt(document.getElementById('search-target').value);
    if (isNaN(target)) {
        updateStatus('Enter a target', '');
        return;
    }

    isRunning = true;
    document.getElementById('search-btn').disabled = true;
    document.getElementById('target-display').textContent = target;
    comparisons = 0;
    document.getElementById('comparisons').textContent = 0;

    await binarySearch(target);

    isRunning = false;
    document.getElementById('search-btn').disabled = false;
}

async function binarySearch(target) {
    let left = 0;
    let right = array.length - 1;
    const eliminated = [];

    // Highlight initialization
    codeViewer.highlightLines(LINE_MAPPINGS.init);
    renderArray(left, right);
    updateStatus('Initializing pointers...', 'warning');
    await sleep(animationSpeed);

    while (left <= right) {
        // Highlight while condition
        codeViewer.highlightLines(LINE_MAPPINGS.loop);
        await sleep(animationSpeed / 2);

        // Calculate mid
        const mid = Math.floor(left + (right - left) / 2);
        codeViewer.highlightLines(LINE_MAPPINGS.calcMid);
        renderArray(left, right, mid, eliminated);
        updateStatus(`Checking mid = ${mid}, value = ${array[mid]}`, 'warning');
        await sleep(animationSpeed);

        comparisons++;
        document.getElementById('comparisons').textContent = comparisons;

        // Check if found
        codeViewer.highlightLines(LINE_MAPPINGS.checkMid);
        await sleep(animationSpeed / 2);

        if (array[mid] === target) {
            renderArray(left, right, -1, eliminated, mid);
            updateStatus(`Found ${target} at index ${mid}!`, 'success');
            codeViewer.highlightLines(LINE_MAPPINGS.checkMid);
            return mid;
        }

        if (array[mid] < target) {
            // Go right
            codeViewer.highlightLines(LINE_MAPPINGS.goRight);
            updateStatus(`${array[mid]} < ${target}, search right half`, '');

            // Mark left half as eliminated
            for (let i = left; i <= mid; i++) eliminated.push(i);
            left = mid + 1;
        } else {
            // Go left
            codeViewer.highlightLines(LINE_MAPPINGS.goLeft);
            updateStatus(`${array[mid]} > ${target}, search left half`, '');

            // Mark right half as eliminated
            for (let i = mid; i <= right; i++) eliminated.push(i);
            right = mid - 1;
        }

        renderArray(left, right, -1, eliminated);
        await sleep(animationSpeed);
    }

    // Not found
    codeViewer.highlightLines(LINE_MAPPINGS.notFound);
    renderArray(-1, -1, -1, Array.from({ length: array.length }, (_, i) => i));
    updateStatus(`${target} not found in array`, '');
    return -1;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
