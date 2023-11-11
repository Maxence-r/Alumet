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
            flashcard = createFlashcardElement(flashcard.question, flashcard.answer, flashcard.userDatas?.status, 'modify', flashcard._id);
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
function deleteCreation() {
    const flashcards = JSON.parse(localStorage.getItem('flashcards-ia'));
    const index = flashcards.findIndex(flashcard => flashcard._id == currentFlashcard);
    console.log('index: ', index)
    flashcards.splice(index, 1);
    localStorage.setItem('flashcards-ia', JSON.stringify(flashcards));
    document.querySelector(`.flashcard[data-flashcardid="${currentFlashcard}"]`).remove();
    navbar('verify-flashcards');
}
function checkCreation() {
    const flashcards = JSON.parse(localStorage.getItem('flashcards-ia'));
    const modifyFlashcard = flashcards.find(flashcard => flashcard._id == currentFlashcard);
    modifyFlashcard.question = document.getElementById('question').value;
    modifyFlashcard.answer = document.getElementById('answer').value;
    document.querySelector(`.flashcard[data-flashcardid="${currentFlashcard}"]`).replaceWith(createFlashcardElement(modifyFlashcard.question, modifyFlashcard.answer, 'neutral', 'modifyCreation', currentFlashcard));
    localStorage.setItem('flashcards-ia', JSON.stringify(flashcards));
    navbar('verify-flashcards');
}


function createFlashcardElement(question, answer, status, parameter, id) {
    console.log(id)
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

        if (parameter === 'modifyCreation') {
            document.querySelector('.flashcards > .post-buttons > button:nth-of-type(2)').onclick = () => { checkCreation() }
            document.querySelector('.flashcards > .post-buttons > .reded').onclick = () => { deleteCreation() }
        } else if (parameter === 'modify') {
            document.querySelector('.flashcards > .post-buttons > button:nth-of-type(2)').onclick = () => { checkFlashcard() }
            document.querySelector('.flashcards > .post-buttons > .reded').onclick = () => { deleteFlashcard() }
        }
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
                const flashcard = createFlashcardElement(question, answer, 'neutral', 'modify', data.flashcard._id);
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
    const flashcards = JSON.parse(localStorage.getItem('flashcards-ia'));
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
                localStorage.removeItem('flashcards-ia');
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
    generateWithDocument(fileId);
}

//ANCHOR IA generation
function displayPageIA(){
    let flashcards = localStorage.getItem('flashcards-ia');
    document.querySelector('.verify-flashcards > .flashcards-container').innerHTML = '';
    if (flashcards && flashcards.length > 0) {
        JSON.parse(flashcards).forEach(flashcard => {
            const flashcardElement = createFlashcardElement(flashcard.question, flashcard.answer, 'neutral', 'modifyCreation', `${flashcard._id}`);
            console.log(flashcard._id)
            document.querySelector('.verify-flashcards > .flashcards-container').appendChild(flashcardElement);
        });
        navbar('verify-flashcards');
        document.getElementById('ia').classList.add('navbar-active');
    } else {
        navbar('ia');
    }
}
function backToIA() {
    localStorage.removeItem('flashcards-ia');
    navbar('ia');
}
function addKeyword() {
    const keywordInput = document.getElementById('keyword');
    const keywords = keywordInput.value.split(' ');

    if (keywords.some(keyword => keyword.length < 2)) {
        return toast({ title: 'Erreur', message: 'Chaque mot-clé doit contenir au moins 2 caractères', type: 'error', duration: 7500 });
    }

    const container = document.querySelector('.keywords-container');

    keywords.forEach(keyword => {
        const div = document.createElement('div');
        div.classList.add('keyword');
        div.textContent = keyword;
        container.appendChild(div);
    });
    keywordInput.value = '';
}

function generateWithKeywords() {
    const keywords = Array.from(document.querySelectorAll('.keywords-container > .keyword')).map(keyword => keyword.textContent);
    if (keywords.length < 1) {
        return toast({ title: 'Erreur', message: 'Vous devez ajouter au moins un mot-clé', type: 'error', duration: 7500 });
    }
    navbar('loading-flashcards');
    fetch('/openai/flashcards/generate-keywords', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                keywords,
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.error) {
                navbar('ia');
                return toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 })
            }
            let id = 0;
            data.flashcards.forEach(flashcard => {
                const flashcardElement = createFlashcardElement(flashcard.question, flashcard.answer, 'neutral', 'modifyCreation', `${id}`);
                flashcard._id = id;
                id++;
                document.querySelector('.verify-flashcards > .flashcards-container').appendChild(flashcardElement);

            });
            localStorage.setItem('flashcards-ia', JSON.stringify(data.flashcards));
            navbar('verify-flashcards');
        });
}

function generateWithDocument(fileId) {
    navbar('loading-flashcards');
    fetch('/openai/flashcards/generate-document', {
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
            } else if (data.message) {
                toast({ title: 'Attention', message: data.message, type: 'warning', duration: 7500 })
            }
        });
}
