function setActive(element) {
    const flashcardSets = document.querySelectorAll('.flashcard-set');
    flashcardSets.forEach(set => set.classList.remove('active'));
    element.classList.add('active');
}
function createFlashcardSet() {
    console.log('ok');
    toast({
        title: "Create Flashcard Set",
        message: "Vous allez créer un set de flashcard",
        type: "success",
        duration: 2500,
    });
    getFlashcardSet('64de8c86191052b513979a2d'); 
    return
}

function getFlashcardSet(flashcardSetId) {
    fetch(`/mindFlash/${flashcardSetId}`)
        .then(res => res.json())
        .then(data => {
            console.log(data);
        })
        .catch(err => console.log(err));
}