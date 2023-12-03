let currentFlashcard = null;
fetch(`/flashcards/${id}/sandbox/content`)
    .then(res => res.json())
    .then(async data => {
        console.log(data);
        data.flashcards.forEach(flashcard => {
            console.log(flashcard.userDatas?.smartReview);
        });
        document.getElementById('flashcard-title').innerText = data.title;
        document.getElementById('flashcard-description').innerText = data.description || 'Aucune description';
        document.getElementById('flashcardName').value = data.title;
        document.getElementById('flashcardDescription').value = data.description;
        document.getElementById('invitationLink').value = window.location.href;
        document.getElementById('flashcardPublic').checked = data.discovery;
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

function modifyFlashcardSet() {
    let title = document.getElementById('flashcardName').value;
    if (title.length < 2) {
        navbar('settings');
        return toast({ title: 'Erreur', message: 'Le titre doit contenir au moins 2 caractères', type: 'error', duration: 7500 });
    }
    let description = document.getElementById('flashcardDescription').value;
    let isPublic = document.getElementById('flashcardPublic').checked;
    navbar('loadingRessources');
    fetch(`/app/new`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            app: id,
            title,
            description,
            discovery: isPublic,
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
function resetUserdatas() {
    fetch('/flashcards/reset', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flashcardSetId: id }),
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            window.location.reload();
        })
        .catch(err => console.log(err));
}
function newFlashcards() {
    navbar('flashcards');
    localStorage.setItem('currentItem', null);
    document.querySelector('.flashcards > .header-setting > div > h1').innerText = 'Nouvelle flashcard';
    document.querySelector('.flashcards > .header-setting > div > p').innerText = 'Créez une nouvelle flashcard ci-dessous.'
    document.querySelector('.flashcards > .post-buttons > .reded').style.display = 'none';
    document.querySelector('.flashcards > .post-buttons > button:nth-of-type(1)').innerText = 'Créer';
    document.getElementById('answer').value = '';
    document.getElementById('question').value = '';
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
    const index = flashcards.findIndex(flashcard => flashcard.id == currentFlashcard);
    flashcards.splice(index, 1);
    localStorage.setItem('flashcards-ia', JSON.stringify(flashcards));
    document.querySelector(`.flashcard[data-flashcardid="${currentFlashcard}"]`).remove();
    navbar('verify-flashcards');
}
function checkCreation() {
    const flashcards = JSON.parse(localStorage.getItem('flashcards-ia'));
    const modifyFlashcard = flashcards.find(flashcard => flashcard.id == currentFlashcard);
    modifyFlashcard.question = document.getElementById('question').value;
    modifyFlashcard.answer = document.getElementById('answer').value;
    document.querySelector(`.flashcard[data-flashcardid="${currentFlashcard}"]`).replaceWith(createFlashcardElement(modifyFlashcard.question, modifyFlashcard.answer, 'neutral', 'modifyCreation', currentFlashcard));
    localStorage.setItem('flashcards-ia', JSON.stringify(flashcards));
    navbar('verify-flashcards');
}

function createFlashcardElement(question, answer, status, parameter, id) {
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
        document.querySelector('.flashcards > .post-buttons > button:nth-of-type(1)').innerText = 'Modifier';
        if (parameter === 'modifyCreation') {
            document.querySelector('.flashcards > .post-buttons > button:nth-of-type(1)').onclick = () => { checkCreation() }
            document.querySelector('.flashcards > .post-buttons > .reded').onclick = () => { deleteCreation() }
        } else if (parameter === 'modify') {
            document.querySelector('.flashcards > .post-buttons > button:nth-of-type(1)').onclick = () => { checkFlashcard() }
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
async function createFlashcards(info, flashcards) {
    if (!flashcards) {
        console.log('flashcards', flashcards);
        flashcards = JSON.parse(localStorage.getItem('flashcards-ia')) || [];
        flashcards = flashcards.map(flashcard => ({ question: flashcard.question, answer: flashcard.answer }));
    } else if (!Array.isArray(flashcards)) {
        flashcards = [flashcards];
    }
    console.log('Gayyy', flashcards)
    const response = await fetch(`/flashcards/${id}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcards, flashcardSetId: id }),
    });

    setTimeout(() => {
        navbar(currentFlashcard || info == 'ia' ? 'home' : 'flashcards');
        if (info == 'ia') localStorage.removeItem('flashcards-ia');
    }, 500);

    const data = await response.json();

    if (data.error) {
        toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 });
    } else {
        data.flashcards.forEach(flashcard => {
            const flashcardElement = createFlashcardElement(flashcard.question, flashcard.answer, 'neutral', 'modify', flashcard._id);
            console.log(currentFlashcard)
            if (flashcard._id == currentFlashcard) {
                console.log('ahhhhhhhhhhhhhhh')
                document.querySelector(`.flashcard[data-flashcardid="${currentFlashcard}"]`).replaceWith(flashcardElement);
                toast({ title: 'Succès', message: 'La carte a bien été modifiée !', type: 'success', duration: 2500 });
            } else {
                document.querySelector('.flashcards-container').appendChild(flashcardElement);
            }
            document.querySelector('.new-flashcard').insertAdjacentElement('afterend', flashcardElement);
        });
        console.log(data.flashcards);
        if (!data.flashcards.some(flashcard => flashcard._id == currentFlashcard)) toast({ title: 'Succès', message: `La carte${data.flashcards.length > 1 ? 's ont' : ' a'} bien été ajoutée${data.flashcards.length > 1 ? 's' : ''} !`, type: 'success', duration: 2500 });
        document.getElementById('answer').value = '';
        document.getElementById('question').value = '';
        document.getElementById('question').focus();
    }
}

function checkFlashcard() {
    const fields = [
        { id: 'question', messageShort: 'Vous devez ajouter une question', messageLong: 'La question ne doit pas dépasser 100 caractères' },
        { id: 'answer', messageShort: 'Vous devez ajouter une réponse', messageLong: 'La réponse ne doit pas dépasser 100 caractères' }
    ];
    for (const field of fields) {
        let fieldValue = document.getElementById(field.id).value;
        if (fieldValue.length < 1) {
            document.getElementById(field.id).focus();
            return toast({ title: 'Erreur', message: field.messageShort, type: 'error', duration: 7500 });
        } else if (fieldValue.length > 100) {
            document.getElementById(field.id).focus();
            return toast({ title: 'Erreur', message: field.messageLong, type: 'error', duration: 7500 });
        }
    }
    navbar('loadingRessources');
    createFlashcards('normal', { question: document.getElementById('question').value, answer: document.getElementById('answer').value, _id: currentFlashcard });
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
    generateWithIA('document', fileId);
}

//ANCHOR IA generation
function displayPageIA() {
    let flashcards = localStorage.getItem('flashcards-ia');
    document.querySelector('.verify-flashcards > .flashcards-container').innerHTML = '';
    if (flashcards && flashcards.length > 0) {
        JSON.parse(flashcards).forEach(flashcard => {
            const flashcardElement = createFlashcardElement(flashcard.question, flashcard.answer, 'neutral', 'modifyCreation', `${flashcard.id}`);
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

function generateWithIA(parameter, data) {
    navbar('loading-flashcards');
    const keywords = Array.from(document.querySelectorAll('.keywords-container > .keyword')).map(keyword => keyword.textContent);
    /*  if (keywords.length < 1) return toast({ title: 'Erreur', message: 'Vous devez ajouter au moins un mot-clé', type: 'error', duration: 7500 }); */
    parameter == 'keywords' ? data = keywords : data = data;

    fetch('/openai/flashcards/generate-flashcards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            parameter,
            data,
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
            data.flashcards.forEach(flashcard => {
                const id = Math.random().toString(36).substring(2);
                const flashcardElement = createFlashcardElement(flashcard.question, flashcard.answer, 'neutral', 'modifyCreation', `${id}`);
                flashcard.id = id;
                console.log(flashcard);
                document.querySelector('.verify-flashcards > .flashcards-container').appendChild(flashcardElement);

            });
            localStorage.setItem('flashcards-ia', JSON.stringify(data.flashcards));
            navbar('verify-flashcards');
        });
}