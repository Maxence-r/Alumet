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
    return
}