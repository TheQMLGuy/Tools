/**
 * Sorting Visualizer - Multiple algorithms with code highlighting
 */

const SORTING_CODE = {
    bubble: {
        c: `void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap arr[j] and arr[j+1]
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,
        cpp: `void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}`,
        python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]`
    },
    selection: {
        c: `void selectionSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        // Swap minimum with current
        int temp = arr[minIdx];
        arr[minIdx] = arr[i];
        arr[i] = temp;
    }
}`,
        cpp: `void selectionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        swap(arr[minIdx], arr[i]);
    }
}`,
        python: `def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[min_idx], arr[i] = arr[i], arr[min_idx]`
    },
    insertion: {
        c: `void insertionSort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
    }
}`,
        cpp: `void insertionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`,
        python: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key`
    },
    quick: {
        c: `int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    return i + 1;
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`,
        cpp: `int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`,
        python: `def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)`
    }
};

const LINE_MAPPINGS = {
    bubble: { compare: { c: [4], cpp: [5], python: [5] }, swap: { c: [6, 7, 8], cpp: [6], python: [6] } },
    selection: { compare: { c: [5], cpp: [6], python: [6] }, swap: { c: [10, 11, 12], cpp: [10], python: [8] } },
    insertion: { compare: { c: [5], cpp: [6], python: [5] }, shift: { c: [6], cpp: [7], python: [6] } },
    quick: { pivot: { c: [2], cpp: [2], python: [2] }, compare: { c: [5], cpp: [5], python: [5] }, swap: { c: [7, 8, 9], cpp: [7], python: [7] } }
};

let array = [];
let codeViewer;
let currentAlgo = 'bubble';
let isRunning = false;
let animationSpeed = 100;
let comparisons = 0;
let swaps = 0;

document.addEventListener('DOMContentLoaded', () => {
    codeViewer = new CodeViewer('code-container');
    codeViewer.setCode(SORTING_CODE[currentAlgo]);

    document.querySelectorAll('.algo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (isRunning) return;
            document.querySelector('.algo-btn.active').classList.remove('active');
            btn.classList.add('active');
            currentAlgo = btn.dataset.algo;
            codeViewer.setCode(SORTING_CODE[currentAlgo]);
        });
    });

    document.getElementById('speed').addEventListener('input', (e) => {
        animationSpeed = 510 - parseInt(e.target.value);
    });

    generateArray();
});

function generateArray() {
    if (isRunning) return;
    const size = parseInt(document.getElementById('array-size').value) || 20;
    array = Array.from({ length: size }, () => Math.floor(Math.random() * 95) + 5);
    comparisons = 0;
    swaps = 0;
    updateStats();
    renderBars();
}

function renderBars(comparing = [], swapping = [], sorted = [], pivot = -1) {
    const container = document.getElementById('viz-area');
    const maxVal = Math.max(...array);

    container.innerHTML = array.map((val, idx) => {
        let classes = 'bar';
        if (sorted.includes(idx)) classes += ' sorted';
        else if (swapping.includes(idx)) classes += ' swapping';
        else if (comparing.includes(idx)) classes += ' comparing';
        if (idx === pivot) classes += ' pivot';

        const height = (val / maxVal) * 100;
        return `<div class="${classes}" style="height: ${height}%" data-value="${val}"></div>`;
    }).join('');
}

function updateStats() {
    document.getElementById('comparisons').textContent = comparisons;
    document.getElementById('swaps').textContent = swaps;
}

async function startSort() {
    if (isRunning) return;
    isRunning = true;
    document.getElementById('start-btn').disabled = true;
    comparisons = 0;
    swaps = 0;

    switch (currentAlgo) {
        case 'bubble': await bubbleSort(); break;
        case 'selection': await selectionSort(); break;
        case 'insertion': await insertionSort(); break;
        case 'quick': await quickSort(0, array.length - 1); break;
    }

    // Mark all as sorted
    renderBars([], [], Array.from({ length: array.length }, (_, i) => i));
    codeViewer.clearHighlights();
    isRunning = false;
    document.getElementById('start-btn').disabled = false;
}

async function bubbleSort() {
    const n = array.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            codeViewer.highlightLines(LINE_MAPPINGS.bubble.compare);
            comparisons++;
            renderBars([j, j + 1]);
            updateStats();
            await sleep(animationSpeed);

            if (array[j] > array[j + 1]) {
                codeViewer.highlightLines(LINE_MAPPINGS.bubble.swap);
                [array[j], array[j + 1]] = [array[j + 1], array[j]];
                swaps++;
                renderBars([], [j, j + 1]);
                updateStats();
                await sleep(animationSpeed);
            }
        }
    }
}

async function selectionSort() {
    const n = array.length;
    const sorted = [];

    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            codeViewer.highlightLines(LINE_MAPPINGS.selection.compare);
            comparisons++;
            renderBars([minIdx, j], [], sorted);
            updateStats();
            await sleep(animationSpeed);

            if (array[j] < array[minIdx]) {
                minIdx = j;
            }
        }

        if (minIdx !== i) {
            codeViewer.highlightLines(LINE_MAPPINGS.selection.swap);
            [array[i], array[minIdx]] = [array[minIdx], array[i]];
            swaps++;
            renderBars([], [i, minIdx], sorted);
            updateStats();
            await sleep(animationSpeed);
        }
        sorted.push(i);
    }
}

async function insertionSort() {
    const n = array.length;
    const sorted = [0];

    for (let i = 1; i < n; i++) {
        const key = array[i];
        let j = i - 1;

        while (j >= 0) {
            codeViewer.highlightLines(LINE_MAPPINGS.insertion.compare);
            comparisons++;
            renderBars([j, j + 1], [], sorted);
            updateStats();
            await sleep(animationSpeed);

            if (array[j] > key) {
                codeViewer.highlightLines(LINE_MAPPINGS.insertion.shift);
                array[j + 1] = array[j];
                swaps++;
                renderBars([], [j, j + 1], sorted);
                updateStats();
                await sleep(animationSpeed);
                j--;
            } else {
                break;
            }
        }
        array[j + 1] = key;
        sorted.push(i);
    }
}

async function quickSort(low, high) {
    if (low < high) {
        const pi = await partition(low, high);
        await quickSort(low, pi - 1);
        await quickSort(pi + 1, high);
    }
}

async function partition(low, high) {
    const pivot = array[high];
    codeViewer.highlightLines(LINE_MAPPINGS.quick.pivot);
    renderBars([], [], [], high);
    await sleep(animationSpeed);

    let i = low - 1;

    for (let j = low; j < high; j++) {
        codeViewer.highlightLines(LINE_MAPPINGS.quick.compare);
        comparisons++;
        renderBars([j], [], [], high);
        updateStats();
        await sleep(animationSpeed);

        if (array[j] < pivot) {
            i++;
            codeViewer.highlightLines(LINE_MAPPINGS.quick.swap);
            [array[i], array[j]] = [array[j], array[i]];
            swaps++;
            renderBars([], [i, j], [], high);
            updateStats();
            await sleep(animationSpeed);
        }
    }

    [array[i + 1], array[high]] = [array[high], array[i + 1]];
    swaps++;
    renderBars([], [i + 1, high]);
    updateStats();
    await sleep(animationSpeed);

    return i + 1;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
