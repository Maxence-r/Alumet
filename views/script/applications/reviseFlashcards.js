//NOTE - This file is for the flashcards revision page
//SECTION - Global variables

let storedData = null;
const id = window.location.pathname.split('/')[4];
const mode = window.location.pathname.split('/')[3];
mode !== 'sandbox' && mode !== 'smart' ? console.error('mode must be sandbox or smart') : null;
const flashcardContainer = document.querySelector('.flashcards');
const allCards = document.querySelectorAll('.flashcard--card');
let currentSection = [];
let index = 0;
let sections = [];
const verifyIfFlashcardFinish = flashcard => (flashcard.userDatas?.status === 3 && flashcard.numberOfReview === 2 ? true : false);
//!SECTION - Global variables

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

//SECTION - Initialize the page
fetch(`/flashcards/${id}/${mode}/content`, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    },
})
    .then(res => res.json())
    .then(data => {
        const { flashcardSetInfo } = data;

        if (mode === 'smart') {
            sections = createSections(flashcardSetInfo.flashcards);
            currentSection = sections[index];
            shuffleArray(currentSection);
            updateSmartStatusPercentages(currentSection);
        } else {
            shuffleArray(currentSection);
            currentSection = flashcardSetInfo.flashcards;
            updateStatusPercentages(currentSection);
        }
        document.querySelector('.header > h1').innerText = flashcardSetInfo.title;
        endLoading();
        nextFlashcard();
        currentSection.forEach(flashcard => (flashcard.numberOfReview = 0));
        storedData = flashcardSetInfo;
    })
    .catch(err => console.log(err));
//!SECTION - Initialize the page

// SECTION - Global functions
async function newStatusToServer(flashcardId, status, cardReview) {
    //cardReview = true if the flashcard is finished
    if (!storedData.user_infos) return;
    fetch(`/flashcards/${id}/${flashcardId}/review`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, cardReview }),
    })
        .then(res => res.json())
        .then(data => {
            mode == 'smart' && !cardReview ? (currentSection.find(flashcard => flashcard._id === flashcardId).userDatas = data.userDatas) : null; // if mode is smart and card always in section (cardReview is true), update the flashcard userDatas
        })
        .catch(err => console.log(err));
}
function toggleQuestionAnswer(card, reverseMode = false) {
    const question = card.querySelector('h3');
    const answer = card.querySelector('p');
    if (reverseMode) {
        answer.style.display = answer.style.display === 'none' ? 'block' : 'none';
        question.style.display = question.style.display === 'none' ? 'block' : 'none';
    } else {
        question.style.display = question.style.display === 'none' ? 'block' : 'none';
        answer.style.display = answer.style.display === 'none' ? 'block' : 'none';
    }
}
function setEventListener(card) {
    const hammertime = new Hammer(card);
    hammertime.on('pan', event => {
        card.classList.add('moving');
        if (event.deltaX === 0) return;
        if (event.center.x === 0 && event.center.y === 0) return;
        const xMulti = event.deltaX * 0.03;
        const yMulti = event.deltaY / 80;
        const rotate = xMulti * yMulti;
        card.style.transform = `translate(${event.deltaX}px, ${event.deltaY}px) rotate(${rotate}deg)`;
        flashcardContainer.classList.toggle('flashcard_love', event.deltaX > 0);
        flashcardContainer.classList.toggle('flashcard_nope', event.deltaX < 0);
    });
    hammertime.on('panend', async event => {
        card.classList.remove('moving');
        flashcardContainer.classList.remove('flashcard_love');
        flashcardContainer.classList.remove('flashcard_nope');
        const moveOutWidth = document.body.clientWidth;
        const keep = Math.abs(event.deltaX) < 30 || Math.abs(event.velocityX) < 0.1;
        card.classList.toggle('removed', !keep);
        if (keep) {
            card.style.transform = '';
        } else {
            const endX = Math.max(Math.abs(event.velocityX) * moveOutWidth, moveOutWidth);
            const toX = event.deltaX > 0 ? endX : -endX;
            const endY = Math.abs(event.velocityY) * moveOutWidth;
            const toY = event.deltaY > 0 ? endY : -endY;
            const xMulti = event.deltaX * 0.03;
            const yMulti = event.deltaY / 80;
            const rotate = xMulti * yMulti;
            card.style.transform = `translate(${toX}px, ${toY + event.deltaY}px) rotate(${rotate}deg)`;
            let status = parseInt(card.dataset.status);
            let newStatus;
            event.deltaX > 0 ? (newStatus = status === 0 ? 2 : status < 3 ? status + 1 : 3) : (newStatus = 1);

            const flashcard = storedData.flashcards.find(flashcard => flashcard._id === card.dataset.id);
            nextFlashcard(newStatus); // modifie status sur client et modifie emplacement carte
            mode === 'sandbox' ? updateStatusPercentages(currentSection) : updateSmartStatusPercentages(flashcard);
            currentSection.length == 1 ? (document.querySelector('.flashcards.loaded > div:first-child').style.display = 'none') : null;
            currentSection.length == 0 ? switchSectionIfFinished() : null;

            await newStatusToServer(card.dataset.id, newStatus, verifyIfFlashcardFinish(flashcard)); // modifie status sur serveur
            setTimeout(() => {
                card.remove();
            }, 300);
        }
    });
    card.addEventListener('click', () => {
        if (reverseCards) {
            toggleQuestionAnswer(card, true);
        } else {
            toggleQuestionAnswer(card);
        }
    });
}

//SECTION - Check for reverse parameter in URL
const queryParams = new URLSearchParams(window.location.search);
const reverseCards = queryParams.get('reverse') === 'true';

const statusInfos = {
    0: { text: 'Neutre', color: '#c6c9ce' },
    1: { text: 'Pas connu', color: '#ff0000' },
    2: { text: 'En cours', color: '#f0ac00' },
    3: { text: 'Acquis', color: '#296eff' },
};
function addFlashcard(id, question, answer, status, date) {
    const newCard = document.createElement('div');
    newCard.setAttribute('data-id', id);
    newCard.classList.add('flashcard--card');
    newCard.dataset.status = status || 0;
    newCard.style.zIndex = 2;
    newCard.style.border = `2px solid ${statusInfos[status].color}`;
    const infos = document.createElement('div');
    infos.classList.add('flashcard--infos');

    const h2 = document.createElement('h2');
    const h2date = document.createElement('h2');
    h2date.innerText = relativeTime(date);
    h2.innerText = statusInfos[status].text;
    h2.dataset.statustext = status;
    infos.appendChild(h2);
    infos.appendChild(h2date);
    newCard.appendChild(infos);

    let h3 = document.createElement('h3');
    let p = document.createElement('p');

    h3.innerHTML = reverseCards ? answer : question;
    p.innerHTML = reverseCards ? question : answer;
    p.style.display = 'none';

    newCard.appendChild(h3);
    newCard.appendChild(p);
    flashcardContainer.appendChild(newCard);
    setEventListener(newCard);
    // modify design of the flashcard behind
    if (currentSection[1]) {
        document.querySelector('.flashcards.loaded > div:first-child').style.border = `2px solid ${statusInfos[currentSection[1].userDatas.status].color}`;
        document.querySelector('.flashcards.loaded > div:first-child > h3').innerText = currentSection[1].question;
    }
}

function nextFlashcard(newStatus) {
    if (currentSection.length === 0) return;
    let lastCard = currentSection[currentSection.length - 1]; // current flashcard displayed
    let newCard = currentSection[0]; // next flashcard

    if (newStatus) {
        lastCard.userDatas.status = newStatus;
        if (mode === 'smart') lastCard.numberOfReview = newStatus === 3 ? lastCard.numberOfReview + 1 : 0;
        currentSection.pop();
        newStatus === 1 ? currentSection.splice(3, 0, lastCard) : currentSection.push(lastCard);
    }
    addFlashcard(newCard._id, newCard.question, newCard.answer, newCard.userDatas?.status, newCard.userDatas?.lastReview);
    currentSection.shift();
    currentSection.push(newCard);
}
//!SECTION - Global functions

//SECTION - Smart mode functions
function createSections(flashcards) {
    flashcards = flashcards.filter(flashcard => flashcard.userDatas.nextReview <= Date.now());
    for (let i = 0; i < flashcards.length; i++) {
        const sectionIndex = Math.floor(i / 10); //NOTE - Number of flashcards per section
        !sections[sectionIndex] ? (sections[sectionIndex] = []) : null;
        sections[sectionIndex].push(flashcards[i]);
    }
    console.log(`There is ${sections.length} sections of revision`);
    if (sections.length === 0) {
        window.location.href = `/app/${id}`;
    }
    return sections;
}

function nextSection() {
    index++;
    currentSection = sections[index];
    currentSection.forEach(flashcard => (flashcard.numberOfReview = 0));
    Array.from(document.querySelectorAll('.flashcard--card'))
        .filter(card => !card.classList.contains('behind-flashcard'))
        .forEach(card => card.remove());
    document.querySelector('.completed-flashcards').innerHTML = '';
    document.querySelector('.ongoing-flashcards').innerHTML = '';
    document.querySelector('.flashcards.loaded > div:first-child').style.display = 'flex';
    updateSmartStatusPercentages(currentSection);
    nextFlashcard();
}

function resetProgress() {
    fetch('/flashcards/resetProgress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flashcardSetId: id }),
    })
        .then(res => res.json())
        .then(data => {
            toast({ title: 'Réinitialisation réussie', message: 'Les cartes ont bien été réinitialisées', type: 'success', duration: 2500 });
            document.getElementById('overlay').classList.remove('hidden');
            setTimeout(() => {
                window.location.href = `/app/${id}`;
            }, 1500);
        })
        .catch(err => console.log(err));
}

function stopRevision() {
    window.location.href = `/app/${id}`;
}

function displayEndOfSection(type) {
    document.querySelectorAll('.intermediate-section').forEach(element => (element.style.display = type === 'intermediate' ? 'flex' : 'none'));
    document.querySelectorAll('.end-of-section').forEach(element => (element.style.display = type === 'end' ? 'flex' : 'none'));
    document.querySelector('.finish-box > .text > h1').textContent = 'Bravo ' + storedData.user_infos.name + ' !';
    const newCardText = sections[index].length === 1 ? ' nouvelle carte' : ' nouvelles cartes';
    document.querySelector('.finish-box > .text > p.intermediate-section').textContent = 'Tu as terminé cette section de révision et appris ' + sections[index].length + newCardText + ' !';

    document.querySelector('.finish-section').style.display = 'flex';
}

const switchSectionIfFinished = () => {
    if (!sections[index + 1] && currentSection.length === 0) {
        displayEndOfSection('end');
    } else if (currentSection.length === 0) {
        displayEndOfSection('intermediate');
    }
};

const updateSmartStatusPercentages = flashcards => {
    const completedFlashcardsContainer = document.querySelector('.completed-flashcards');
    const ongoingFlashcardsContainer = document.querySelector('.ongoing-flashcards');

    function validateElement(flashcardId) {
        currentSection = currentSection.filter(flashcard => flashcard._id !== flashcardId);
        const element = ongoingFlashcardsContainer.querySelector(`[data-id="${flashcardId}"]`);
        element.remove();
        completedFlashcardsContainer.prepend(element);
    }
    function modifyElement(flashcard, isBad) {
        const status = flashcard.userDatas.status;
        const element = ongoingFlashcardsContainer.querySelector(`[data-id="${flashcard._id}"]`);
        element.dataset.cellulestatus = status;
        element.remove();
        isBad ? ongoingFlashcardsContainer.insertBefore(element, ongoingFlashcardsContainer.children[3]) : ongoingFlashcardsContainer.appendChild(element);
        verifyIfFlashcardFinish(flashcard) && flashcard._id ? validateElement(flashcard._id) : null;
    }
    function addElement(flashcard) {
        const status = flashcard.userDatas.status;
        const newElement = document.createElement('div');
        newElement.dataset.id = flashcard._id;
        newElement.dataset.cellulestatus = status;
        ongoingFlashcardsContainer.appendChild(newElement);
    }
    if (Array.isArray(flashcards)) {
        //check if flashcards is an array or a single flashcard
        flashcards.forEach(flashcard => {
            const element = ongoingFlashcardsContainer.querySelector(`[data-id="${flashcard._id}"]`);
            element ? modifyElement(flashcard) : addElement(flashcard);
        });
    } else {
        flashcards.userDatas.status === 1 ? modifyElement(flashcards, true) : modifyElement(flashcards);
    }

    const numberOfFlashcards = sections[index].length;
    const elementWidth = 100 / numberOfFlashcards;
    completedFlashcardsContainer.style.width = elementWidth * completedFlashcardsContainer.children.length + '%';
    ongoingFlashcardsContainer.style.width = elementWidth * ongoingFlashcardsContainer.children.length + '%';
    completedFlashcardsContainer.children.length > 0 ? (completedFlashcardsContainer.style.display = 'flex') : (completedFlashcardsContainer.style.display = 'none');
};
//!SECTION - Smart mode functions

// SECTION - Keyboard controls
let canInteract = true;

document.addEventListener('keydown', function (event) {
    if (!canInteract) return;
    canInteract = false;
    setTimeout(() => (canInteract = true), 100);

    const cards = document.querySelectorAll('.flashcard--card:not(.removed)');
    const activeCard = cards[cards.length - 1];
    if (!activeCard) return; // No active card to interact with

    switch (event.key) {
        case 'ArrowRight':
            swipeCard(activeCard, true);
            break;
        case 'ArrowLeft':
            swipeCard(activeCard, false);
            break;
        case ' ':
            toggleQuestionAnswer(activeCard);
            break;
        default:
            break;
    }
});

function swipeCard(card, isRightSwipe) {
    const moveOutWidth = document.body.clientWidth;
    const endX = moveOutWidth * (isRightSwipe ? 1 : -1);
    card.style.transform = `translate(${endX}px, 0px)`;
    card.classList.add('removed');

    let status = parseInt(card.dataset.status);
    let newStatus = isRightSwipe ? (status === 0 ? 2 : status < 3 ? status + 1 : 3) : 1;

    const flashcard = storedData.flashcards.find(flashcard => flashcard._id === card.dataset.id);
    nextFlashcard(newStatus);
    mode === 'sandbox' ? updateStatusPercentages(currentSection) : updateSmartStatusPercentages(flashcard);
    currentSection.length === 1 && (document.querySelector('.flashcards.loaded > div:first-child').style.display = 'none');
    currentSection.length === 0 && switchSectionIfFinished();

    newStatusToServer(card.dataset.id, newStatus, verifyIfFlashcardFinish(flashcard));
    setTimeout(() => {
        card.remove();
    }, 300);
}

if (!localStorage.getItem('flashcardsTutorial')) {
    document.getElementById('tutorial-fc').style.display = 'flex';
    localStorage.setItem('flashcardsTutorial', true);
}
