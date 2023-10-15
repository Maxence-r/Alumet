function createFlashcards() {
    document.querySelector('.full-screen').style.display = 'flex';
    let title = document.getElementById('flashcards-name').value;
    let description = document.getElementById('flashcards-description').value;
    let selectSubject = document.getElementById('flashcards-subject').options[document.getElementById('flashcards-subject').selectedIndex].value;
    let isPublic = document.getElementById('flashcards-public').checked;
    fetch('/flashcards/set', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            description,
            subject: selectSubject,
            isPublic,
            collaborators: participants,
        }),
    }).then(res => {
        res.json().then(data => {
            if (data.error) {
                document.querySelector('.full-screen').style.display = 'none';
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 });
                setTimeout(() => {
                    window.location.reload();
                }, 500);
                s;
            } else {
                toast({ title: 'Succès', message: "L'alumet a bien été créé !", type: 'success', duration: 2500 });
                setTimeout(() => {
                    window.location.href = `/dashboard`;
                }, 2500);
            }
        });
    });
}

endLoading();
