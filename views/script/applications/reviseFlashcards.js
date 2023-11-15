//NOTE - This file is for the flashcards revision page
//SECTION - Global variables
'use strict';
let storedData = null;
const id = window.location.pathname.split('/')[4];
const mode = window.location.pathname.split('/')[3];
mode !== 'sandbox' && mode !== 'smart' ? console.error('mode must be sandbox or smart') : null;
const flashcardContainer = document.querySelector('.flashcards');
const allCards = document.querySelectorAll('.flashcard--card');
let currentSection = [];
let index = 0;
let sections = [];
const verifyIfFlashcardFinish = (flashcard) => flashcard.userDatas?.status === 3 && flashcard.numberOfReview === 2 ? true : false;
//!SECTION - Global variables

//SECTION - Initialize the page
fetch(`/flashcards/${id}/${mode}/content`, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    }
    })
    .then(res => res.json())
    .then(data => {
        if (mode === 'smart') {
            sections = createSections(data.flashcards);
            currentSection = sections[index];
            updateSmartStatusPercentages();
        } else { currentSection = data.flashcards; }
        endLoading();
        triggerFlashcard();
        currentSection.forEach(flashcard => flashcard.numberOfReview = 0);
        storedData = data;
    })
    .catch(err => console.log(err));
//!SECTION - Initialize the page
            
// SECTION - Global functions
async function newStatusToServer(flashcardId, status, cardReview) {
    fetch(`/flashcards/${id}/${flashcardId}/review`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, cardReview }),
    })
        .then(res => res.json())
        .then(data => {
            if (mode == 'smart') {
                currentSection.find(flashcard => flashcard._id === flashcardId).userDatas.smartReview = data.smartReview;
                updateSmartStatusPercentages(flashcardId);
                switchSectionIfFinished();
            }
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
    hammertime.on('panend', async (event) => {
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
            const flashcard = storedData.flashcards.find(flashcard => flashcard._id === card.dataset.id);
            await newStatusToServer(card.dataset.id, newStatus, verifyIfFlashcardFinish(flashcard));
            setTimeout(() => {
                currentSection.length == 1 ? document.querySelector('.flashcards.loaded > div:first-child').style.display = 'none' : null;
            }, 75); //FIXME - this is a temporary fix, the problem is that there is a latence during modifying currentSection.
            setTimeout(() => {
                card.remove();
            }, 300);
        }
    });
    card.addEventListener('click', () => toggleQuestionAnswer(card));
}
const statusInfos = {
    0: {text: 'Neutre', color: '#c6c9ce'},
    1: {text: 'Pas connu', color: '#ff0000'},
    2: {text: 'En cours', color: '#f0ac00'},
    3: {text: 'Acquis', color: '#296eff'},
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
    h3.innerText = question;
    let p = document.createElement('p');
    p.innerText = answer;
    p.style.display = 'none';
    newCard.appendChild(h3);
    newCard.appendChild(p);
    flashcardContainer.appendChild(newCard);
    setEventListener(newCard);
    currentSection[0] ? document.querySelector('.flashcards.loaded > div:first-child').style.border = `2px solid ${statusInfos[currentSection[0].userDatas.status].color}` : null;
}
function triggerFlashcard(direction) {
    if (currentSection && currentSection.length > 0) {
        let card = currentSection[0];
        const lastFlashcard = currentSection[currentSection.length - 1];
        function modifyStatus(status) {
            lastFlashcard.userDatas.status = status;
            status == 3 ? lastFlashcard.numberOfReview++ : lastFlashcard.numberOfReview = 0;
        };

        if (direction === 'love') {
            lastFlashcard.userDatas.status === 0 ? modifyStatus(2) : modifyStatus (lastFlashcard.userDatas.status === 3 ? 3 : lastFlashcard.userDatas.status + 1);
        } else if (direction === 'nope') { modifyStatus(1) };
        currentSection.shift();
        addFlashcard(card._id, card.question, card.answer, card.userDatas?.status, card.userDatas?.lastReview);
        currentSection.push(card);
        mode === 'sandbox' ? updateStatusPercentages(currentSection) : null;
    } else {
        console.log('no more flashcards');
    }
}
//!SECTION - Global functions

//SECTION - Smart mode functions
function createSections (flashcards) {
    for (let i = 0; i < flashcards.length; i++) {
        const sectionIndex = Math.floor(i / 10);
        if (!sections[sectionIndex]) {
            sections[sectionIndex] = [];
        }
        sections[sectionIndex].push(flashcards[i]);
    }
    return sections;
}
const switchSectionIfFinished = () => {
    function next() {
        document.querySelectorAll('.flashcard--card').forEach(card => card.remove());
        document.querySelector('.completed-flashcards').style.display = 'none';
        updateSmartStatusPercentages();
        triggerFlashcard();
    }
    if (!sections[index + 1] && currentSection.length === 0) {
        console.log('no more sections'); //TODO - make end of revision page
        next();
    } else if (currentSection.every(flashcard => verifyIfFlashcardFinish(flashcard))) {
        console.log('section finished, switching to next section'); //TODO - make end of section page + add a button to go to next section
        index++;
        currentSection = sections[index];
        next();
    } else console.log('Section not finished, staying in current');
}
const updateSmartStatusPercentages = (flashcardId) => {
    const completedFlashcardsContainer = document.querySelector('.completed-flashcards');
    const ongoingFlashcardsContainer = document.querySelector('.ongoing-flashcards');
    function validateElement (flashcardId) {
        const element = ongoingFlashcardsContainer.querySelector(`[data-id="${flashcardId}"]`);
        element.remove();
        completedFlashcardsContainer.prepend(element);
        currentSection = currentSection.filter(flashcard => flashcard._id !== flashcardId);
    }
    function addOrModifyElement (flashcard) {
        const status = flashcard.userDatas.status;
        const element = ongoingFlashcardsContainer.querySelector(`[data-id="${flashcardId}"]`);
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
        verifyIfFlashcardFinish(flashcard) && flashcardId ? validateElement(flashcardId) : null;
    }
    if (!flashcardId) {
        document.querySelectorAll('.smart-progression > div').forEach(div => div.innerHTML = '');
        currentSection ? currentSection.forEach(flashcard => addOrModifyElement(flashcard)) : console.log('no flashcards');
    } else { addOrModifyElement(storedData.flashcards.find(flashcard => flashcard._id === flashcardId)) };

    const numberOfFlashcards = sections[index].length;
    const elementWidth = 100 / numberOfFlashcards;
    completedFlashcardsContainer.style.width = elementWidth * completedFlashcardsContainer.children.length + '%';
    ongoingFlashcardsContainer.style.width = elementWidth * ongoingFlashcardsContainer.children.length + '%';
    completedFlashcardsContainer.children.length > 0 ? completedFlashcardsContainer.style.display = 'flex' : completedFlashcardsContainer.style.display = 'none';
}
//!SECTION - Smart mode functions