let currentFlashcard = null;
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
        data.flashcards.forEach(flashcard => {
            flashcard = createFlashcardElement(flashcard.userDatas?.status, flashcard.question, flashcard.answer, flashcard._id);
            document.querySelector('.flashcards-container').appendChild(flashcard);
        });
        endLoading();
        updateStatusPercentages(data.flashcards);
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

function newFlashcards() {
    document.querySelector('.flashcards > .post-buttons > .reded').style.display = 'none';
    document.querySelector('.flashcards > .post-buttons > button:nth-of-type(2)').innerText = 'Créer';
    document.getElementById('answer').value = '';
    document.getElementById('question').value = '';
    navbar('flashcards')
    currentFlashcard = null;
}

function deleteFlashcard() {
    navbar('loadingRessources');
    fetch(`/flashcards/${id}/${currentFlashcard}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            flashcardId: currentFlashcard,
        }),
    }).then(res => {
        res.json().then(data => {
            if (data.error) {
                navbar('flashcards');
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 });
            } else {
                toast({ title: 'Succès', message: 'La carte a bien été supprimée !', type: 'success', duration: 2500 });
                document.querySelector(`.flashcard[data-flashcardid="${currentFlashcard}"]`).remove();
                setTimeout(() => {
                    navbar('home');
                }, 500);
            }
        }
        );
    });
}

function createFlashcardElement(status, question, answer, id) {
    const div = document.createElement('div');
    div.dataset.flashcardid = id;
    div.classList.add('flashcard');
    div.dataset.status = status;
    const h1 = document.createElement('h1');
    h1.textContent = question;
    div.appendChild(h1);
    div.addEventListener('click', () => {
        navbar('flashcards', id, 'flashcard')
        currentFlashcard = id;
        document.getElementById('question').value = question;
        document.getElementById('answer').value = answer;
        document.querySelector('.flashcards > .post-buttons > .reded').style.display = 'block';
        document.querySelector('.flashcards > .post-buttons > button:nth-of-type(2)').innerText = 'Modifier';
    });
    return div;
}

function revise(option) {
    if (option === 'sandbox') {
        window.location.href = `/flashcards/revise/sandbox/${id}`;
    } else {
        return toast({ title: 'Erreur', message: 'Cette option n\'est pas encore disponible', type: 'error', duration: 7500 });
    }
}

function createFlashcard() {
    let answer = document.getElementById('answer').value;
    let question = document.getElementById('question').value;
    console.log(answer, question);
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
            flashcardId: currentFlashcard,
        }),
    }).then(res => {
        setTimeout(() => {
            if (currentFlashcard) {
                navbar('home')
            } else {
                navbar('flashcards');
            }
        }, 500);
        res.json().then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 });
            } else {
                toast({ title: 'Succès', message: 'La carte a bien été ajoutée !', type: 'success', duration: 2500 });
                const newFlashcard = document.querySelector('.new-flashcard');
                const flashcard = createFlashcardElement('neutral', question, answer, data.flashcard._id);
                if (currentFlashcard) {
                    document.querySelector(`.flashcard[data-flashcardid="${currentFlashcard}"]`).replaceWith(flashcard);
                } else {
                    document.querySelector('.flashcards-container').appendChild(flashcard);
                }
                newFlashcard.insertAdjacentElement('afterend', flashcard);
                document.getElementById('answer').value = '';
                document.getElementById('question').value = '';
            }
        });
    });
}
