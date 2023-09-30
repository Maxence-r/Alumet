function createFlashcards() {
    let name = document.getElementById('flashcards-name').value;
    let description = document.getElementById('flashcards-description').value;
    let selectSubject = document.getElementById('flashcards-subject').options[document.getElementById('flashcards-subject').selectedIndex].value;
    let isPublic = document.getElementById('flashcards-public').checked;
    fetch('/flashcards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            description,
            subject: selectSubject,
            isPublic,
        }),
    }).then(res => {
        res.json().then(data => {
            console.log(data);
        });
    });
}
