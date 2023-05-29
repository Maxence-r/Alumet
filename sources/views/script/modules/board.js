document.querySelector('.modules-container').innerHTML += `
<div id="bd" class="module-container module">
    <div class="module-header">
        <p>Mur d'idées</p>
        <button onclick="createBd()">Crée un mur d'idées</button>
    </div>
    <div id="boards">
      <div class="no-items">
        <h1>Aucun murs d'idées</h1>
        <p>Commençons a créer une histoire !</p>
      </div>
    </div>
</div>`;


let board = document.createElement('div');
board.id = 'board-viewer';
board.className = 'view-modal';
board.innerHTML = `
   <div class="modal-header">
      <h1 class="modal-title"><span>Mur d'idées</span></h1>
      <div class="quick-actions">
         <div id="download-file" class="action"><img src="../../assets/app/new-print.svg" alt="new-print"></div>
         <div onclick="closeBoard()" id="close-viewer" style="margin-right: 10px;" class="action close-viewer"><img src="../../assets/app/close.svg" alt="Close"></div>
      </div>
   </div>
   <div id="canvas-container">
        <div id="canvas">
          <div id="items">
            <div class="item-bloc">
                <h1>Un dernier bloc pour la route</h1>
            </div>
            <div class="item-bloc">
                <h1>Noter que ce module n'est pas terminer</h1>
                <div class="YES">Mais bientôt</div>
            </div>
            <div class="item-bloc">
                <h1>Prenez cette élément et déplacer le</h1>
                <div class="YES">Une fois que vous relacher ca position est sauvegarder</div>
            </div>
          </div>
        </div>
      </div>
`;

document.body.insertBefore(board, document.body.firstChild);

function openBoard() {
    document.getElementById('board-viewer').style.display = 'flex';
}

function closeBoard() {
    document.getElementById('board-viewer').style.display = 'none';
}

const canvasContainer = document.querySelector("#canvas-container");
const itemsContainer = document.querySelector("#items");
let isDragging = false;
let lastX, lastY;

const gridSize = 40;
const gridMargin = 20;

canvasContainer.addEventListener("mousedown", (event) => {
  const target = event.target;
  if (
    target.classList.contains("item-bloc") ||
    target.closest(".item-bloc")
  ) {
    selectedElement = target.closest(".item-bloc");
    offsetX = event.clientX - selectedElement.offsetLeft;
    offsetY = event.clientY - selectedElement.offsetTop;
  } else {
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvasContainer.style.cursor = "grabbing";
  }
});

canvasContainer.addEventListener("mousemove", (event) => {
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

canvasContainer.addEventListener("mouseup", () => {
  if (selectedElement) {
    const left = parseInt(selectedElement.style.left);
    const top = parseInt(selectedElement.style.top);
    const col = Math.round((left - gridMargin) / gridSize);
    const row = Math.round((top - gridMargin) / gridSize);
    selectedElement.style.left = `${col * gridSize + gridMargin}px`;
    selectedElement.style.top = `${row * gridSize + gridMargin}px`;
  }

  isDragging = false;
  canvasContainer.style.cursor = "grab";
  selectedElement = null;
});


const canvas = document.querySelector("#canvas");
let selectedElement = null;
let offsetX = 0;
let offsetY = 0;

canvas.addEventListener("mousedown", (event) => {
  const target = event.target;
  if (target.classList.contains("item-bloc")) {
    selectedElement = target;
    offsetX = event.clientX - selectedElement.offsetLeft;
    offsetY = event.clientY - selectedElement.offsetTop;
  }
});

canvas.addEventListener("mouseup", (event) => {
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

canvas.addEventListener("mousemove", (event) => {
  if (selectedElement) {
    selectedElement.style.left = `${event.clientX - offsetX}px`;
    selectedElement.style.top = `${event.clientY - offsetY}px`;
  }
});

const itemContents = document.querySelectorAll(".item-content");
itemContents.forEach((itemContent) => {
  itemContent.addEventListener("mousedown", (event) => {
    const target = event.target;
    if (target.closest(".item-bloc")) {
      selectedElement = target.closest(".item-bloc");
      offsetX = event.clientX - selectedElement.offsetLeft;
        offsetY = event.clientY - selectedElement.offsetTop;
    }
    });
});





function getBoards() {
    fetch(`/api/board/${localStorage.getItem('currentAlumet')}`)
    .then(res => res.json())
    .then(data => {
      if (data.length !== 0) {
        document.getElementById('boards').innerHTML = '';
      }
        data.forEach(board => {
          document.getElementById('boards').innerHTML += `
            <div id="${board._id}" class="board">
              <div class="board-infos">
                <h1>${board.name}</h1>
                <p>${relativeTime(board.lastUsage)}</p>
              </div>
              <span onclick="openModifyBd('${board._id}')" class="material-symbols-rounded setting-ico">settings</span>
              </div>
          `;
        });
    })
    .catch(err => console.log(err));
}



getBoards();