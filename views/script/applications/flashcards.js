let currentFlashcard = null;
let flashcardSet = null;
fetch(`/flashcards/${id}/sandbox/content`)
    .then(res => res.json())
    .then(async data => {
        const { flashcardSetInfo } = data;
        flashcardSetInfo.flashcards.forEach(flashcard => {
            flashcard = createFlashcardElement(flashcard.question, flashcard.answer, flashcard.userDatas?.status, 'modify', flashcard._id);
            document.querySelector('.flashcards-container').appendChild(flashcard);
        });
        flashcardSet = flashcardSetInfo;
        updateStatusPercentages(flashcardSetInfo.flashcards);
        endLoading();
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
function resetUsersdatas() {
    fetch('/flashcards/resetProgress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flashcardSetId: id }),
    })
        .then(res => res.json())
        .then(data => {
            toast({ title: 'Succès', message: 'Les données des utilisateurs ont bien été réinitialisées !', type: 'success', duration: 2500 });
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        })
        .catch(err => console.log(err));
}
function newFlashcards() {
    navbar('flashcards');
    localStorage.setItem('currentItem', null);
    document.querySelector('.flashcards > .header-setting > div > h1').innerText = 'Nouvelle flashcard';
    document.querySelector('.flashcards > .header-setting > div > p').innerText = 'Créez une nouvelle flashcard ci-dessous.';
    document.querySelector('.flashcards > .post-buttons > .reded').style.display = 'none';
    document.querySelector('.flashcards > .post-buttons > button:nth-of-type(2)').innerText = 'Créer';
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
                document.querySelector(`.flashcard[data-flashcardid="${currentFlashcard}"]`).remove();
                flashcardSet.flashcards = flashcardSet.flashcards.filter(flashcard => flashcard._id != currentFlashcard);
                toast({ title: 'Succès', message: 'La carte a bien été supprimée !', type: 'success', duration: 2500 });
                setTimeout(() => {
                    navbar('home');
                }, 500);
            }
        });
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
    // check flashcards for ia
    const flashcards = JSON.parse(localStorage.getItem('flashcards-ia'));
    const modifyFlashcard = flashcards.find(flashcard => flashcard.id == currentFlashcard);
    modifyFlashcard.question = document.getElementById('question').value;
    modifyFlashcard.answer = document.getElementById('answer').value;
    document.querySelector(`.flashcard[data-flashcardid="${currentFlashcard}"]`).replaceWith(createFlashcardElement(modifyFlashcard.question, modifyFlashcard.answer, 'neutral', 'modifyCreation', currentFlashcard));
    localStorage.setItem('flashcards-ia', JSON.stringify(flashcards));
    navbar('verify-flashcards');
}

function createFlashcardElement(question, answer, status, parameter, id) {
    const flashcardElement = document.createElement('div');
    flashcardElement.dataset.flashcardid = id;
    flashcardElement.classList.add('flashcard');
    flashcardElement.dataset.status = status;

    const questionElement = document.createElement('div');
    questionElement.textContent = question;
    flashcardElement.appendChild(questionElement);
    if (parameter === 'modifyCreation') {
        flashcardElement.classList.add('flashcard-with-answer');
        const divider = document.createElement('div');
        divider.classList.add('divider');
        flashcardElement.appendChild(divider);

        const answerElement = document.createElement('div');
        answerElement.classList.add('answer');
        answerElement.textContent = answer;
        flashcardElement.appendChild(answerElement);
    }
    flashcardElement.addEventListener('click', () => {
        navbar('flashcards', id, 'flashcard');
        currentFlashcard = id;
        document.getElementById('question').value = question;
        document.getElementById('answer').value = answer;
        document.querySelector('.flashcards > .header-setting > div > h1').innerText = 'Modifier une carte';
        document.querySelector('.flashcards > .header-setting > div > p').innerText = 'Vous pouvez modifier la carte ci-dessous.';
        document.querySelector('.flashcards > .post-buttons > .reded').style.display = 'block';
        document.querySelector('.flashcards > .post-buttons > button:nth-of-type(2)').innerText = 'Modifier';
        if (parameter === 'modifyCreation') {
            document.querySelector('.flashcards > .post-buttons > button').onclick = () => {
                checkCreation();
            };
            document.querySelector('.flashcards > .post-buttons > .buttons >.reded').onclick = () => {
                deleteCreation();
            };
            document.querySelector('.flashcards > .post-buttons > .buttons > button:nth-of-type(2)').onclick = () => {
                navbar('verify-flashcards');
            };
        } else if (parameter === 'modify') {
            document.querySelector('.flashcards > .post-buttons > button:nth-of-type(2)').onclick = () => {
                checkFlashcard();
            };
            document.querySelector('.flashcards > .post-buttons > .reded').onclick = () => {
                deleteFlashcard();
            };
        }
    });
    return flashcardElement;
}
async function revise() {
    console.log(flashcardSet)
    let selectedOption = document.querySelector('#radio-revise input[type="radio"]:checked')?.id;
    if (!selectedOption) return toast({ title: 'Erreur', message: 'Vous devez sélectionner une option', type: 'error', duration: 2500 });
    if (selectedOption == 'smart' && !flashcardSet.user_infos) return toast({ title: 'Erreur', message: 'Vous devez être connecté pour utiliser ce mode de révision', type: 'error', duration: 2500 });
    if (document.querySelectorAll('.alumet > .flashcards-container > .flashcard').length < 1) return toast({ title: 'Erreur', message: 'Vous devez ajouter au moins une carte pour réviser', type: 'error', duration: 2500 });
    let isSmartRevision = null;
    if (selectedOption === 'smart') {
        await fetch(`/flashcards/${id}/isSmartRevision`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })
            .then(res => res.json())
            .then(data => {
                isSmartRevision = data.isSmartRevision;
            });
    }
    if (!isSmartRevision && selectedOption === 'smart') return toast({ title: 'Erreur', message: 'Vous avez révisé toutes vos cartes ! Revenez plus tard', type: 'error', duration: 2500 });
    window.location.href = `/flashcards/revise/${selectedOption}/${id}`;
}
async function createFlashcards(info, flashcards) {
    if (!flashcards) {
        flashcards = JSON.parse(localStorage.getItem('flashcards-ia')) || [];
        flashcards = flashcards.map(flashcard => ({ question: flashcard.question, answer: flashcard.answer }));
    } else if (!Array.isArray(flashcards)) {
        flashcards = [flashcards];
    }
    const response = await fetch(`/flashcards/${id}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcards, flashcardSetId: id }),
    });

    setTimeout(() => {
        navbar(currentFlashcard || info == 'ia' ? 'home' : 'flashcards');
        info == 'ia' ? localStorage.removeItem('flashcards-ia') : null;
    }, 200);

    const data = await response.json();

    if (data.error) {
        toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 });
    } else {
        data.flashcards.forEach(flashcard => {
            const flashcardElement = createFlashcardElement(flashcard.question, flashcard.answer, 'neutral', 'modify', flashcard._id);
            if (flashcard._id == currentFlashcard) {
                document.querySelector(`.flashcard[data-flashcardid="${currentFlashcard}"]`).replaceWith(flashcardElement);
                toast({ title: 'Succès', message: 'La carte a bien été modifiée !', type: 'success', duration: 2500 });
            } else {
                document.querySelector('.flashcards-container').appendChild(flashcardElement);
            }
            document.querySelector('.new-flashcard').insertAdjacentElement('afterend', flashcardElement);
        });
        if (!data.flashcards.some(flashcard => flashcard._id == currentFlashcard))
            toast({ title: 'Succès', message: `La carte${data.flashcards.length > 1 ? 's ont' : ' a'} bien été ajoutée${data.flashcards.length > 1 ? 's' : ''} !`, type: 'success', duration: 2500 });
        document.getElementById('answer').value = '';
        document.getElementById('question').value = '';
    }
}

function checkFlashcard() {
    const fields = [
        { id: 'question', messageShort: 'Vous devez ajouter une question', messageLong: 'La question ne doit pas dépasser 100 caractères' },
        { id: 'answer', messageShort: 'Vous devez ajouter une réponse', messageLong: 'La réponse ne doit pas dépasser 100 caractères' },
    ];
    for (const field of fields) {
        let fieldValue = document.getElementById(field.id).value;
        if (fieldValue.length < 1) {
            return toast({ title: 'Erreur', message: field.messageShort, type: 'error', duration: 7500 });
        } else if (fieldValue.length > 100) {
            return toast({ title: 'Erreur', message: field.messageLong, type: 'error', duration: 7500 });
        }
    }
    navbar('loadingRessources');
    createFlashcards('normal', { question: document.getElementById('question').value, answer: document.getElementById('answer').value, _id: localStorage.getItem('currentItem') });
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
    }

    const button = document.querySelector('.buttons > button:nth-of-type(2)');
    flashcards && flashcards.length > 0 ? (button.style.display = 'block') : (button.style.display = 'none');

    flashcardSet ? (document.getElementById('app-subject').value = flashcardSet.subject) : null;
    navbar('ia');
}

function createKeywordElement(keyword) {
    const keywordBox = document.createElement('div');
    keywordBox.classList.add('keyword-box');
    keywordBox.classList.add('greyed');

    const keywordElement = document.createElement('div');
    keywordElement.classList.add('keyword');
    keywordElement.textContent = keyword;

    const deleteCross = document.createElement('img');
    deleteCross.src = '../../assets/global/cross.svg';
    deleteCross.alt = 'delete cross';

    keywordBox.appendChild(keywordElement);
    keywordBox.appendChild(deleteCross);

    keywordBox.addEventListener('click', () => {
        keywordBox.remove();
        const container = document.querySelector('.keywords-container');
        container.children.length > 0 ? (container.style.display = 'flex') : (container.style.display = 'none');
    });
    return keywordBox;
}

function addKeyword() {
    const keywordInput = document.getElementById('keyword');
    if (keywordInput.value.length < 2) return toast({ title: 'Erreur', message: 'Le mot-clé doit contenir au moins 2 caractères', type: 'error', duration: 7500 });

    document.querySelector('.keywords-container').style.display = 'flex';
    document.querySelector('.keywords-container').appendChild(createKeywordElement(keywordInput.value));
    keywordInput.value = '';
}
async function generateWithIA() {
    let data = '';
    const generationMode = document.querySelector('.module-selected').dataset.module;
    let numberOfFlashcards = document.getElementById('flashcards-amount').value;
    numberOfFlashcards = numberOfFlashcards < 1 || numberOfFlashcards > 20 ? 20 : numberOfFlashcards;
    let subject = document.getElementById('app-subject').value;

    const fileFromCloud = selectedFile[0];
    const fileFromPC = document.getElementById('post-file').files[0];
    const keywords = Array.from(document.querySelectorAll('.keyword')).map(keyword => keyword.textContent);

    if (generationMode === 'document') {
        if (!fileFromCloud && !fileFromPC) {
            return toast({ title: 'Erreur', message: 'Vous devez ajouter un fichier', type: 'error', duration: 2500 });
        }

        data = fileFromCloud ? fileFromCloud : (await uploadFile(fileFromPC))._id;
    } else if (generationMode === 'keywords') {
        if (keywords.length < 1) {
            return toast({ title: 'Erreur', message: 'Vous devez ajouter au moins un mot-clé', type: 'error', duration: 2500 });
        }

        data = [keywords.join(', ')];
    }
    navbar('loading-flashcards');
    fetch('/openai/flashcards/generate-flashcards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            generationMode,
            numberOfFlashcards,
            subject,
            data,
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                navbar('ia');
                return toast({ title: 'Erreur', message: data.error, type: 'error', duration: 2500 });
            }
            data.message ? toast({ title: 'Attention', message: data.message, type: 'warning', duration: 5000 }) : null;

            document.querySelector('.verify-flashcards > .flashcards-container').innerHTML = '';
            data.flashcards.forEach(flashcard => {
                const id = Math.random().toString(36).substring(2);
                flashcard.id = id;
                let flashcardElement = createFlashcardElement(flashcard.question, flashcard.answer, 'neutral', 'modifyCreation', `${id}`);
                document.querySelector('.verify-flashcards > .flashcards-container').appendChild(flashcardElement);
            });
            localStorage.setItem('flashcards-ia', JSON.stringify(data.flashcards));
            navbar('verify-flashcards');
        });
}
