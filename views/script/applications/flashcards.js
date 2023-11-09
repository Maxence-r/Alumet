let currentFlashcard = null;
fetch(`/flashcards/${id}/content`)
    .then(res => res.json())
    .then(async data => {
        console.log(data);
        document.getElementById('flashcard-title').innerText = data.title;
        document.getElementById('flashcard-description').innerText = data.description || 'Aucune description';
        document.getElementById('flashcardName').value = data.title;
        document.getElementById('flashcardDescription').value = data.description;
        document.getElementById('invitationLink').value = window.location.href;
        document.getElementById('flashcardPublic').checked = data.isPublic;
        loadParticipants([], data.collaborators, data.owner);
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
    document.querySelector('.flashcards > .header-setting > div > h1').innerText = 'Nouvelle flashcard';
    document.querySelector('.flashcards > .header-setting > div > p').innerText = 'Créez une nouvelle flashcard ci-dessous.'
    document.querySelector('.flashcards > .post-buttons > .reded').style.display = 'none';
    document.querySelector('.flashcards > .post-buttons > button:nth-of-type(2)').innerText = 'Créer';
    document.getElementById('answer').value = '';
    document.getElementById('question').value = '';
    document.getElementById('question').focus();
    navbar('flashcards');
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
        document.getElementById('question').focus();
        document.querySelector('.flashcards > .header-setting > div > h1').innerText = 'Modifier une carte';
        document.querySelector('.flashcards > .header-setting > div > p').innerText = 'Vous pouvez modifier la carte ci-dessous.'
        document.querySelector('.flashcards > .post-buttons > .reded').style.display = 'block';
        document.querySelector('.flashcards > .post-buttons > button:nth-of-type(2)').innerText = 'Modifier';
    });
    return div;
}

function revise(option) {
    if (option === 'sandbox') {
        window.location.href = `/flashcards/revise/sandbox/${id}`;
    } else if (option === 'smart') {
        window.location.href = `/flashcards/revise/smart/${id}`;
    } else {
        return toast({ title: 'Erreur', message: 'Cette option n\'est pas encore disponible', type: 'error', duration: 7500 });
    }
}

function createFlashcard(question, answer) {
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
                document.getElementById('question').focus();
            }
        });
    });
}
function createFlashcards() {
    const flashcards = JSON.parse(localStorage.getItem('flashcards'));
    fetch(`/flashcards/createIa`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            flashcards,
            flashcardSetId: id,
        }),
    }).then(res => {
        res.json().then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 });
            } else {
                toast({ title: 'Succès', message: 'Les cartes ont bien été ajoutées !', type: 'success', duration: 2500 });
                window.location.reload(); // ANCHOR A modifier plus tard
            }
        });
    });
}
function checkFlashcard() {
    const fields = [
        { id: 'question', message: 'Vous devez ajouter une question' },
        { id: 'answer', message: 'Vous devez ajouter une réponse' }
    ];

    for (const field of fields) {
        let fieldValue = document.getElementById(field.id).value;
        console.log(fieldValue);
        if (fieldValue.length < 1) {
            document.getElementById(field.id).focus();
            return toast({ title: 'Erreur', message: field.message, type: 'error', duration: 7500 });
        }
    }
    navbar('loadingRessources');
    createFlashcard(document.getElementById('question').value, document.getElementById('answer').value);
};

document.querySelector('.drop-box').addEventListener('click', e => {
    if (e.target.classList.contains('drop-box')) {
        document.querySelectorAll('.loadfile > .files-items > .file-item:not([data-ext="pdf"])').forEach(item => {
            item.remove();
        });
        navbar('loadfile');
    }
});
function chooseFile(fileId) {
    generateIA(fileId);
}

//ANCHOR IA generation
function generateIA(fileId) {
    navbar('loading-flashcards');
    fetch('/openai/flashcards/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                src: fileId,
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.error) {
                navbar('ia');
                return toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 })
            }
            const container = document.querySelector('.verify-flashcards > .flashcards-container');
            container.innerHTML = '';
            data.flashcards.forEach(flashcard => {
                const div = document.createElement('div');
                div.classList.add('flashcard');
                const question = document.createElement('h1');
                question.textContent = flashcard.question;
                const divider = document.createElement('div');
                divider.classList.add('divider');
                const answer = document.createElement('h1');
                answer.textContent = flashcard.answer;
                div.appendChild(question);
                div.appendChild(divider);
                div.appendChild(answer);    
                container.appendChild(div);
            });
            localStorage.setItem('flashcards', JSON.stringify(data.flashcards));
            navbar('verify-flashcards');
        });
}
