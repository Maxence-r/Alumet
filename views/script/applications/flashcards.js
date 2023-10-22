fetch(`/flashcards/${id}/content`)
    .then(res => res.json())
    .then(data => {
        console.log(data);
        document.getElementById('flashcard-title').innerText = data.title;
        document.getElementById('flashcard-description').innerText = data.description || 'Aucune description';
        document.getElementById('flashcardName').value = data.title;
        document.getElementById('flashcardDescription').value = data.description;
        document.getElementById('invitationLink').value = window.location.href;
        document.getElementById('flashcardPublic').checked = data.isPublic;
        loadParticipants([], data.collaborators, true);
        enableConnected(data);
        endLoading();
    })
    .catch(err => console.log(err));

function modifyFlashcard() {
    let title = document.getElementById('flashcardName').value;
    if (title.length < 2) {
        navbar('settings');
        return toast({ title: 'Erreur', message: 'Le titre doit contenir au moins 2 caractères', type: 'error', duration: 7500 });
    }
    let description = document.getElementById('flashcardDescription').value;
    let isPublic = document.getElementById('flashcardPublic').checked;
    navbar('loadingRessources');
    fetch(`/flashcards/set`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            flashcardSetId: id,
            description,
            isPublic,
        }),
    }).then(res => {
        res.json().then(data => {
            if (data.error) {
                navbar('settings');
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 });
            } else {
                toast({ title: 'Succès', message: 'Le jeu de flashcard a bien été modifié !', type: 'success', duration: 2500 });
                setTimeout(() => {
                    window.location.reload();
                }, 2500);
            }
        });
    });
}

function createFlashcard() {
    let answer = document.getElementById('answer').value;
    let question = document.getElementById('question').value;
    if (answer.length < 1 || question.length < 1) {
        return toast({ title: 'Erreur', message: 'La question et la réponse ne peuvent être vide !', type: 'error', duration: 7500 });
    }
    navbar('loadingRessources')
    fetch(`/flashcards/${id}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            answer,
            question,
        }),
    }).then(res => {
        setTimeout(() => {
            navbar('flashcards');
        }, 500);
        res.json().then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 });
            } else {
                toast({ title: 'Succès', message: 'La carte a bien été ajoutée !', type: 'success', duration: 2500 });
                document.getElementById('answer').value = '';
                document.getElementById('question').value = '';
            }
        });
    });
}
