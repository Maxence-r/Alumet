const canvasContainer = document.querySelector('#canvas-container');
const itemsContainer = document.querySelector('#items');
let isDragging = false;
let lastX, lastY;

const gridSize = 40;
const gridMargin = 20;

canvasContainer.addEventListener('mousedown', event => {
    const target = event.target;
    if (target.classList.contains('item-bloc') || target.closest('.item-bloc')) {
        selectedElement = target.closest('.item-bloc');
        offsetX = event.clientX - selectedElement.offsetLeft;
        offsetY = event.clientY - selectedElement.offsetTop;
    } else {
        isDragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
        canvasContainer.style.cursor = 'grabbing';
    }
});

canvasContainer.addEventListener('mousemove', event => {
    if (isDragging) {
        const deltaX = event.clientX - lastX;
        const deltaY = event.clientY - lastY;

        canvasContainer.scrollLeft -= deltaX;
        canvasContainer.scrollTop -= deltaY;

        lastX = event.clientX;
        lastY = event.clientY;
    } else if (selectedElement) {
        selectedElement.style.left = `${event.clientX - offsetX}px`;
        selectedElement.style.top = `${event.clientY - offsetY}px`;
    }
});

canvasContainer.addEventListener('mouseup', () => {
    if (selectedElement) {
        const left = parseInt(selectedElement.style.left);
        const top = parseInt(selectedElement.style.top);
        const col = Math.round((left - gridMargin) / gridSize);
        const row = Math.round((top - gridMargin) / gridSize);
        selectedElement.style.left = `${col * gridSize + gridMargin}px`;
        selectedElement.style.top = `${row * gridSize + gridMargin}px`;
    }

    isDragging = false;
    canvasContainer.style.cursor = 'grab';
    selectedElement = null;
});

const canvas = document.querySelector('#canvas');
let selectedElement = null;
let offsetX = 0;
let offsetY = 0;

canvas.addEventListener('mousedown', event => {
    const target = event.target;
    if (target.classList.contains('item-bloc')) {
        selectedElement = target;
        offsetX = event.clientX - selectedElement.offsetLeft;
        offsetY = event.clientY - selectedElement.offsetTop;
    }
});

canvas.addEventListener('mouseup', event => {
    if (selectedElement) {
        const left = parseInt(selectedElement.style.left);
        const top = parseInt(selectedElement.style.top);
        const col = Math.round((left - gridMargin) / gridSize);
        const row = Math.round((top - gridMargin) / gridSize);
        selectedElement.style.left = `${col * gridSize + gridMargin}px`;
        selectedElement.style.top = `${row * gridSize + gridMargin}px`;
    }

    selectedElement = null;
});

canvas.addEventListener('mousemove', event => {
    if (selectedElement) {
        selectedElement.style.left = `${event.clientX - offsetX}px`;
        selectedElement.style.top = `${event.clientY - offsetY}px`;
    }
});

const itemContents = document.querySelectorAll('.item-content');
itemContents.forEach(itemContent => {
    itemContent.addEventListener('mousedown', event => {
        const target = event.target;
        if (target.closest('.item-bloc')) {
            selectedElement = target.closest('.item-bloc');
            offsetX = event.clientX - selectedElement.offsetLeft;
            offsetY = event.clientY - selectedElement.offsetTop;
        }
    });
});

window.onload = () => {
    document.querySelector('.loading').style.display = 'none';
};

document.querySelector('.tool-bar').addEventListener('click', () => {
    toast({
        title: 'Pas encore prêt',
        message: "Ce module n'est pas encore prêt",
        type: 'warning',
        duration: 3000,
    });
});

const elements = [
    [document.getElementById('1'), document.getElementById('2')],
    [document.getElementById('2'), document.getElementById('3')],
    [document.getElementById('2'), document.getElementById('4')],
    [document.getElementById('1'), document.getElementById('5')],
    [document.getElementById('5'), document.getElementById('6')],
    [document.getElementById('5'), document.getElementById('7')],
];

const svg = document.querySelector('svg');

for (const [element1, element2] of elements) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('stroke', 'black');
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('onclick', "alert('test')");
    svg.appendChild(line);

    function updateLinePosition() {
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();
        const x1 = rect1.left + rect1.width / 2;
        const y1 = rect1.top + rect1.height / 2;
        const x2 = rect2.left + rect2.width / 2;
        const y2 = rect2.top + rect2.height / 2;
        const lineVector = `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`;
        line.setAttribute('d', lineVector);
    }

    window.addEventListener('load', updateLinePosition);
    window.addEventListener('resize', updateLinePosition);
    element1.addEventListener('mousemove', updateLinePosition);
    element2.addEventListener('mousemove', updateLinePosition);
    document.getElementById('canvas').addEventListener('mousemove', updateLinePosition);
    element1.addEventListener('touchmove', updateLinePosition);
    element2.addEventListener('touchmove', updateLinePosition);
    document.getElementById('canvas').addEventListener('touchmove', updateLinePosition);
}
