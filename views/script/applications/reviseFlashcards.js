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
        data.flashcards.length === 0 ? console.log('no flashcards') : null; //TODO - add page when there is no flashcards in the set
        if (mode === 'smart') {
            sections = createSections(data.flashcards);
            currentSection = sections[index];
            updateSmartStatusPercentages(currentSection);
            if (sections.length === 0) { // TODO - add page when there is no flashcards to revise in smart mode
                console.log('no flashcards to revise');
                return
            }
        } else {
            currentSection = data.flashcards;
            updateStatusPercentages(currentSection);
        }
        document.querySelector('.header > h1').innerText = data.title;
        endLoading();
        nextFlashcard();
        currentSection.forEach(flashcard => flashcard.numberOfReview = 0);
        storedData = data;
    })
    .catch(err => console.log(err));
//!SECTION - Initialize the page
            
// SECTION - Global functions
async function newStatusToServer(flashcardId, status, cardReview) { //cardReview = true if the flashcard is finished
    fetch(`/flashcards/${id}/${flashcardId}/review`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, cardReview }),
    })
        .then(res => res.json())
        .then(data => {
            mode == 'smart' && !cardReview ? currentSection.find(flashcard => flashcard._id === flashcardId).userDatas = data.userDatas : null // if mode is smart and card always in section (cardReview is true), update the flashcard userDatas
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
            event.deltaX > 0 ? newStatus = status === 0 ? 2 : (status < 3 ? status + 1 : 3) : newStatus = 1;
            
            const flashcard = storedData.flashcards.find(flashcard => flashcard._id === card.dataset.id);
            nextFlashcard(newStatus); // modifie status sur client et modifie emplacement carte
            mode === 'sandbox' ? updateStatusPercentages(currentSection) :  updateSmartStatusPercentages(flashcard);
            currentSection.length == 1 ? document.querySelector('.flashcards.loaded > div:first-child').style.display = 'none' : null;
            currentSection.length == 0 ? switchSectionIfFinished() : null;
            
            await newStatusToServer(card.dataset.id, newStatus, verifyIfFlashcardFinish(flashcard)); // modifie status sur serveur 
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
    console.log('new flashcard added');
    // modify design of the flashcard behind
    if (currentSection[1]) {
        console.log(currentSection.length)
        document.querySelector('.flashcards.loaded > div:first-child').style.border = `2px solid ${statusInfos[currentSection[1].userDatas.status].color}`;
        document.querySelector('.flashcards.loaded > div:first-child > h3').innerText = currentSection[1].question;
    }
}

function nextFlashcard(newStatus) {
    if (currentSection.length === 0) return;
    let lastCard = currentSection[currentSection.length - 1];  // current flashcard displayed
    let newCard = currentSection[0] // next flashcard

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
function createSections (flashcards) {
    flashcards = flashcards.filter(flashcard => flashcard.userDatas.nextReview <= Date.now());
    for (let i = 0; i < flashcards.length; i++) {
        const sectionIndex = Math.floor(i / 1); //NOTE - Number of flashcards per section
        !sections[sectionIndex] ? sections[sectionIndex] = [] : null;
        sections[sectionIndex].push(flashcards[i]);
    }
    console.log(`There is ${sections.length} sections of revision`);
    return sections;
}

function nextSection() {
    index++;
    currentSection = sections[index];
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
            toast({ title: 'Réinitialisation réussie', message: 'Les cartes ont bien été réinitialisées', type: 'success', duration: 2500});
            document.getElementById('overlay').classList.remove('hidden');
            setTimeout(() => {
                window.location.href = `/app/${id}`;
            }, 1500);
        })
        .catch(err => console.log(err));
}

function stopRevision() { window.location.href = `/app/${id}` }
function redirectToSandBox() { window.location.href = `/flashcards/revise/sandbox/${id}`; }

function displayEndOfSection(type) {
    document.querySelectorAll('.intermediate-section').forEach(element => element.style.display = type === 'intermediate' ? 'flex' : 'none');
    document.querySelectorAll('.end-of-section').forEach(element => element.style.display = type === 'end' ? 'flex' : 'none');
    console.log(storedData.user_infos.name)
    document.querySelector('.finish-box > .text > h1').textContent = 'Bravo, ' + storedData.user_infos.name + ' !';
    const newCardText = sections[index].length === 1 ? ' nouvelle carte' : ' nouvelles cartes';
    document.querySelector('.finish-box > .text > p.intermediate-section').textContent = 'Tu as terminé cette section de révision et appris ' + sections[index].length + newCardText + ' !';
    
    document.querySelector('.finish-section').style.display = 'flex';
}

const switchSectionIfFinished = () => {
    if (!sections[index + 1] && currentSection.length === 0) {
        displayEndOfSection('end');
    } else if (currentSection.length === 0) {
        console.log('section finished, switching to next section'); //TODO - make end of section page + add a button to go to next section
        displayEndOfSection('intermediate');
    } else { console.log('section not finished'); }
}

const updateSmartStatusPercentages = (flashcards) => {
    const completedFlashcardsContainer = document.querySelector('.completed-flashcards');
    const ongoingFlashcardsContainer = document.querySelector('.ongoing-flashcards');

    function validateElement (flashcardId) {
        currentSection = currentSection.filter(flashcard => flashcard._id !== flashcardId);
        const element = ongoingFlashcardsContainer.querySelector(`[data-id="${flashcardId}"]`);
        element.remove();
        completedFlashcardsContainer.prepend(element);
    }
    function modifyElement (flashcard, isBad) {
        const status = flashcard.userDatas.status;
        const element = ongoingFlashcardsContainer.querySelector(`[data-id="${flashcard._id}"]`);
        element.dataset.cellulestatus = status;
        element.remove();
        isBad ? ongoingFlashcardsContainer.insertBefore(element, ongoingFlashcardsContainer.children[3]) : ongoingFlashcardsContainer.appendChild(element);
        verifyIfFlashcardFinish(flashcard) && flashcard._id ? validateElement(flashcard._id) : null;
    }
    function addElement (flashcard) {
        const status = flashcard.userDatas.status;
        const newElement = document.createElement('div');
        newElement.dataset.id = flashcard._id;
        newElement.dataset.cellulestatus = status;
        ongoingFlashcardsContainer.appendChild(newElement);
    }
    if (Array.isArray(flashcards)) { //check if flashcards is an array or a single flashcard
        flashcards.forEach(flashcard => {
            const element = ongoingFlashcardsContainer.querySelector(`[data-id="${flashcard._id}"]`);
            element ? modifyElement(flashcard) : addElement(flashcard);
        });
    } else { flashcards.userDatas.status === 1 ? modifyElement(flashcards, true) : modifyElement(flashcards) }

    const numberOfFlashcards = sections[index].length;
    const elementWidth = 100 / numberOfFlashcards;
    completedFlashcardsContainer.style.width = elementWidth * completedFlashcardsContainer.children.length + '%';
    ongoingFlashcardsContainer.style.width = elementWidth * ongoingFlashcardsContainer.children.length + '%';
    completedFlashcardsContainer.children.length > 0 ? completedFlashcardsContainer.style.display = 'flex' : completedFlashcardsContainer.style.display = 'none';
}
//!SECTION - Smart mode functions