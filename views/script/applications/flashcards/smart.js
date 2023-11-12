'use strict';

let storedData = null;
const flashcardContainer = document.querySelector('.flashcards');
const allCards = document.querySelectorAll('.flashcard--card');
let currentSection = [];
let sections = [];

function newStatusToServer(flashcardId, status, cardReview) {
        
    fetch(`/flashcards/${id}/${flashcardId}/review`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, cardReview }),
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            if (cardReview) {
                currentSection.find(flashcard => flashcard._id === flashcardId).userDatas.smartReview = data.smartReview;
            }
            updateSmartStatusPercentages(flashcardId);
        })
        .catch(err => console.log(err));
}

function toggleQuestionAnswer(card) {
    const question = card.querySelector('h3');
    const answer = card.querySelector('p');
    question.style.display = question.style.display === 'none' ? 'block' : 'none';
    answer.style.display = answer.style.display === 'none' ? 'block' : 'none';
}
function setEventListener(card) {
    const hammertime = new Hammer(card);
    hammertime.on('pan', (event) => {
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
    hammertime.on('panend', (event) => {
        card.classList.remove('moving');
        flashcardContainer.classList.remove('flashcard_love');
        flashcardContainer.classList.remove('flashcard_nope');
        const moveOutWidth = document.body.clientWidth;
        const keep = Math.abs(event.deltaX) < 80 || Math.abs(event.velocityX) < 0.5;
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
            if (event.deltaX > 0) {
                newStatus = status === 0 ? 2 : (status < 3 ? status + 1 : 3);
                triggerFlashcard('love');
            } else {
                newStatus = 1;
                triggerFlashcard('nope');
            }
            newStatus == 3 ? newStatusToServer(card.dataset.id, newStatus, true) : newStatusToServer(card.dataset.id, newStatus);
            setTimeout(() => {
                card.remove();
            }, 300);
            switchSectionIfFinished();
        }
    });
    card.addEventListener('click', () => toggleQuestionAnswer(card));
}

const statusToFrench = {
    0: 'Neutre',
    1: 'Pas connu',
    2: 'En cours',
    3: 'Acquis',
};

function addFlashcard(id, question, answer, status, date) {
    const newCard = document.createElement('div');
    newCard.setAttribute('data-id', id);
    newCard.classList.add('flashcard--card');
    newCard.dataset.status = status || 0;
    newCard.style.zIndex = 2;
    const infos = document.createElement('div');
    infos.classList.add('flashcard--infos');

    const h2 = document.createElement('h2');
    const h2date = document.createElement('h2');
    h2date.innerText = relativeTime(date);
    h2.innerText = statusToFrench[status];
    h2.dataset.statustext = status;
    infos.appendChild(h2);
    infos.appendChild(h2date);
    newCard.appendChild(infos);
    let h3 = document.createElement('h3');
    h3.innerText = question;
    let p = document.createElement('p');
    p.innerText = answer;
    p.style.display = 'none';
    newCard.appendChild(h3);
    newCard.appendChild(p);
    flashcardContainer.appendChild(newCard);
    setEventListener(newCard);
}

function createSections (flashcards) {
    for (let i = 0; i < flashcards.length; i++) {
        const sectionIndex = Math.floor(i / 2);
        if (!sections[sectionIndex]) {
            sections[sectionIndex] = [];
        }
        sections[sectionIndex].push(flashcards[i]);
    }
    return sections;
}
const switchSectionIfFinished = () => {
    if (!currentSection) return;
    else if(currentSection.every(flashcard => flashcard.userDatas.status == 3 && flashcard.userDatas.smartReview.nextReview > Date.now())) {
        console.log('section finished, switch to next section');
        sections.shift();
        currentSection = sections[0];
        document.querySelectorAll('.flashcard--card').forEach(card => card.remove());
        triggerFlashcard();
    } else {
        console.log('section not finished');
    }
}


let id = window.location.pathname.split('/')[4];
fetch(`/flashcards/${id}/smart/content`, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    }
    })
    .then(res => res.json())
    .then(data => {
        sections = createSections(data.flashcards);
        currentSection = sections[0];
        console.log('current section' , currentSection);
        endLoading();
        triggerFlashcard();
        updateSmartStatusPercentages();
        storedData = data;
    })
    .catch(err => console.log(err));


function triggerFlashcard(direction) {
    if (currentSection && currentSection.length > 0) {
        let card = currentSection[0];
        const lastFlashcard = currentSection[currentSection.length - 1];

        function modifyStatus(status) {
            lastFlashcard.userDatas.status = status;
            lastFlashcard.userDatas.smartReview.status = status;
        }

        if (direction === 'love') {
            if (lastFlashcard.userDatas.status === 0) {
                modifyStatus(2);
            } else {
                const newStatus = lastFlashcard.userDatas.status === 3 ? 3 : lastFlashcard.userDatas.status + 1;
                modifyStatus(newStatus);
            }
        } else if (direction === 'nope') {
            modifyStatus(1);
        }
        currentSection.shift();
        addFlashcard(card._id, card.question, card.answer, card.userDatas?.status, card.userDatas?.lastReview);
        currentSection.push(card);
    } else {
        console.log('no more flashcards');
    }
}

const updateSmartStatusPercentages = (flashcardId) => {
    const completedFlashcardsContainer = document.querySelector('.completed-flashcards');
    const ongoingFlashcardsContainer = document.querySelector('.ongoing-flashcards');

    function validateElement (flashcardId) {
        const element = ongoingFlashcardsContainer.querySelector(`[data-id="${flashcardId}"]`);
        element.remove();
        completedFlashcardsContainer.appendChild(element);
    }
    function addOrModifyElement (flashcard) {
        const status = flashcard.userDatas.status;
        const element = ongoingFlashcardsContainer.querySelector(`[data-id="${flashcard._id}"]`);
        if (element) {
            element.dataset.cellulestatus = status;
            element.remove();
            ongoingFlashcardsContainer.appendChild(element);
        } else {
            const newElement = document.createElement('div');
            newElement.dataset.id = flashcard._id;
            newElement.dataset.cellulestatus = status;
            ongoingFlashcardsContainer.appendChild(newElement);
        }
        flashcard.userDatas.status == 3 && flashcard.userDatas.smartReview.nextReview > Date.now()  ? validateElement(flashcard._id) : null;
    }
    !flashcardId ? currentSection.forEach(flashcard => addOrModifyElement(flashcard)) : addOrModifyElement(storedData.flashcards.find(flashcard => flashcard._id === flashcardId));
    
    const numberOfFlashcards = currentSection.length;
    const elementWidth = 100 / numberOfFlashcards;
    completedFlashcardsContainer.style.width = elementWidth * completedFlashcardsContainer.children.length + '%';
    ongoingFlashcardsContainer.style.width = elementWidth * ongoingFlashcardsContainer.children.length + '%';
    completedFlashcardsContainer.children.length > 0 ? completedFlashcardsContainer.style.display = 'flex' : completedFlashcardsContainer.style.display = 'none';
}