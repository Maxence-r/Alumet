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



function getBoards() {
    fetch(`/api/board/${localStorage.getItem('currentAlumet')}`)
    .then(res => res.json())
    .then(data => {
      if (data.length !== 0) {
        document.getElementById('boards').innerHTML = '';
      }
        data.forEach(board => {
          document.getElementById('boards').innerHTML += `
            <div onclick="openBoard('${board._id}')" id="${board._id}" class="board">
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

function openBoard(id) {
  window.open(`/board/${id}`, '_blank');
}

getBoards();