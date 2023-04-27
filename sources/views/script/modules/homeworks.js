
document.querySelector('.modules-container').innerHTML += `
<div id="hw" class="module-container module">
    <div class="module-header">
        <p>Devoirs</p>
        <button onclick="createHw()">Crée un devoir</button>
    </div>
    <div class="devoirs">
    </div>
</div>`;

function createHw() {
    document.getElementById('create-hw').style.display = 'flex';
    document.getElementById('create-hw').classList.add('active-modal');
}


