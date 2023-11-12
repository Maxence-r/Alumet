'use strict';
let storedData = null;
const flashcardContainer = document.querySelector('.flashcards');
const allCards = document.querySelectorAll('.flashcard--card');
let flashcardsOrder = [];

function newStatusToServer(flashcardId, status) {
    fetch(`/flashcards/${id}/${flashcardId}/review`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: status }),
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);
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
            newStatusToServer(card.dataset.id, newStatus);
            setTimeout(() => {
                card.remove();
            }, 300);
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
    console.log(status);
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





let id = window.location.pathname.split('/')[4];
fetch(`/flashcards/${id}/sandbox/content`, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    }
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);
        flashcardsOrder = data.flashcards;
        endLoading();
        triggerFlashcard();
        storedData = data;
    })
    .catch(err => console.log(err));




function triggerFlashcard(direction) {
    if (flashcardsOrder.length > 0) {
        let card = flashcardsOrder[0]
        if (direction === 'love') {
            if (flashcardsOrder[flashcardsOrder.length - 1].userDatas.status === 0) {
                flashcardsOrder[flashcardsOrder.length - 1].userDatas.status = 2;
            } else {
                flashcardsOrder[flashcardsOrder.length - 1].userDatas.status = flashcardsOrder[flashcardsOrder.length - 1].userDatas.status === 3 ? 3 : flashcardsOrder[flashcardsOrder.length - 1].userDatas.status + 1;
            }
        } else if (direction === 'nope') {
            flashcardsOrder[flashcardsOrder.length - 1].userDatas.status = 1;
        }
        flashcardsOrder.shift();
        addFlashcard(card._id, card.question, card.answer, card.userDatas?.status, card.userDatas?.lastReview);
        flashcardsOrder.push(card);
        updateStatusPercentages(flashcardsOrder, 'sandbox');
    }
}


