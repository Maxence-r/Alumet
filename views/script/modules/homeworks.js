
document.querySelector('.modules-container').innerHTML += `
<div id="hw" class="module-container module">
    <div class="module-header">
        <p>Devoirs à faire</p>
        <button onclick="createHw()">Crée un devoir</button>
    </div>
    <div class="devoirs">
    <div class="no-items">
        <h1>Pas de devoirs 🙂</h1>
        <p>Alors qu'est ce qu'on fait ?</p>
      </div>
    </div>
</div>`;


    

function getHomeworks() {
    fetch(`/api/homeworks/${localStorage.getItem('currentAlumet')}`).then(res => res.json()).then(data => {
        if (data.length !== 0) {
            document.querySelector('.devoirs').innerHTML = '';
        }
        data.forEach(homework => {
            document.querySelector('.devoirs').innerHTML += `
            <div class="devoir">
                <div class="teacher-hw-layer">
                    <div class="quick-actions"><div onclick="deleteHomework('${homework._id}')" class="action"><img src="../../assets/app/delete.svg" alt="Close"></div></div>
                </div>
                <p class="devoir-date">${formatDate(homework.time)}</p>
                <p class="devoir-content">${homework.content}</p>
            </div>
            `;
        });
    });
}
getHomeworks();

function formatDate(dateString) {
    const inputDate = new Date(dateString);
    const today = new Date();
    const diffTime = inputDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays > 0) {
      return `Dans ${diffDays} jour(s)`;
    } else {
      return `Il y a ${-diffDays} jour(s)`;
    }
  }

function deleteHomework(id) {
    if (!confirm('Voulez-vous vraiment supprimer ce devoir ?')) return;
    fetch(`/api/homeworks/${localStorage.getItem('currentAlumet')}/${id}`, {
        method: 'DELETE'
    }).then(res => res.json()).then(data => {
        getHomeworks();
    });
}
  