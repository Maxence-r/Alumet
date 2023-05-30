document.querySelector('.modules-container').innerHTML += `
<div id="fc" class="module-container module">
    <div class="module-header">
        <p>Flashcards</p>
        <button onclick="alert('Arrive bientôt')">Crée un jeu de flashcards</button>
    </div>
    <div id="boards">
      <div class="no-items">
        <h1>Aucune flascards</h1>
        <p>C'est pourtant la meilleur façon d'apprendre !</p>
      </div>
    </div>
</div>`;