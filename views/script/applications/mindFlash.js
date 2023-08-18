window.addEventListener('load', () => {
    document.getElementById('loading-mindflash').style.display = 'none';
});


// Here the container of the DOM doesn't exist anymore
function createFlashcardSetsColumn() {
    fetch('/mindFlash/flashcardsets')
        .then(res => res.json())
        .then(data => {
            const flashcardSets = data.flashcardSets;
            if (flashcardSets.length === 0) {
                console.log('no set')
                document.querySelector('.main-container > .full-screen').classList.remove('hidden');
            } else {
                flashcardSets.forEach(flashcardSet => {
                    createFlashcardSetPreview(flashcardSet.id, flashcardSet.title, flashcardSet.numberOfFlashcards, flashcardSet.owner);
                });
            }
            
        })
}

function createFlashcardSetPreview(flashcardSetId, title, numberOfFlashcards, owner) {
    const flashcardSetPreviewContainer = document.getElementById('flashcard-set-preview-container');
    const flashcardSet = document.createElement('div');
    flashcardSet.classList.add('flashcard-set');
    flashcardSet.dataset.flashcardSetId = flashcardSetId;
    flashcardSet.onclick = function() {
        setActive(this);
    };

    const flashcardSetTitle = document.createElement('div');
    flashcardSetTitle.classList.add('flashcard-set-title');

    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;

    flashcardSetTitle.appendChild(titleSpan);
    flashcardSet.appendChild(flashcardSetTitle);

    const flashcardSetInfos = document.createElement('div');
    flashcardSetInfos.classList.add('flashcard-set-infos');
    flashcardSetInfos.textContent = `${numberOfFlashcards} flashcards - a été créé par `;

    const ownerBold = document.createElement('b');
    ownerBold.textContent = owner;

    flashcardSetInfos.appendChild(ownerBold);
    flashcardSet.appendChild(flashcardSetInfos);

    const options = document.createElement('div');
    options.classList.add('options');

    const dots = document.createElement('img');
    dots.src = '../../assets/global/dots.svg';
    dots.alt = 'dots icon';

    options.appendChild(dots);
    flashcardSet.appendChild(options);

    flashcardSetPreviewContainer.appendChild(flashcardSet);
}

function createFlashcard(question, answer, status) {
    const flashcardContainer = document.getElementById('flashcards-container');
    const flashcard = document.createElement('div');
    flashcard.classList.add('flashcard');
    if (status) {
        flashcard.classList.add(`flashcard-${status}`);
    } else {
        flashcard.classList.add('unrated');
    }
    
    const options = document.createElement('div');
    options.classList.add('flashcard-options');

    const dots = document.createElement('img');
    dots.src = '../../assets/global/dots.svg';
    dots.alt = 'dots';
    dots.classList.add('flashcard-dots');

    options.appendChild(dots);
    flashcard.appendChild(options);

    const title = document.createElement('div');
    title.classList.add('flashcard-title');
    title.textContent = question;

    flashcard.appendChild(title);

    const divider = document.createElement('div');
    divider.classList.add('flashcard-divider');

    flashcard.appendChild(divider);

    const flashcardAnswer = document.createElement('div');
    flashcardAnswer.classList.add('flashcard-answer');
    flashcardAnswer.textContent = answer;

    flashcard.appendChild(flashcardAnswer);

    flashcardContainer.appendChild(flashcard);
}
function getFlashcardSet(flashcardSetId) {
    document.querySelector('.main-container').classList.add('active-loading');
    fetch(`/mindFlash/getFlashcardSet/${flashcardSetId}`)
        .then(res => res.json())
        .then(data => {
            console.log('data : ', data.flashcard);
            loadFlashcardSetInfos(data.flashcardSet.title);
            loadFlashcardSetStats(data.flashcardSet._id);
            const flashcards = data.flashcards;
            flashcards.forEach(flashcard => {
                createFlashcard(flashcard.question, flashcard.answer, flashcard.status);
            });
            document.querySelector('.main-container > .full-screen').classList.add('hidden');
            document.querySelector('.main-container').classList.remove('active-loading');
        })
        .catch(err => console.log(err));
}

function loadFlashcardSetInfos(title) {
    const titleElement = document.querySelector('.main-container > .infos-bar > h2');
    titleElement.textContent = title ? title : '';
}
function loadFlashcardSetStats(flashCardSetId) {
    /* fetch(`/mindFlash/flashcardset/stats/${flashCardSetId}`)
        .then(res => res.json())
        .then(data => {
            console.log('stats : ', data);
            const percentageBar = document.querySelector('.main-container > .options > .percentage-bar');
            const goodPercentage = document.getElementById('percentage-bar-good');
            const okPercentage = document.getElementById('percentage-bar-ok');
            const badPercentage = document.getElementById('percentage-bar-bad');
            const unratedPercentage = document.getElementById('percentage-bar-unrated');

            percentageBar.style.display = 'flex';
            goodPercentage.style.width = `${data.percentageOfGood}%`;
            okPercentage.style.width = `${data.percentageOfOk}%`;
            badPercentage.style.width = `${data.percentageOfBad}%`;
            unratedPercentage.style.width = `${data.percentageOfUnrated}%`;

        })
        .catch(err => console.log(err)); */
}

function redirectToDashboard(){
    window.location.href = '/dashboard';
}

function checkIfSetLoadRequired() {
    const currentUrl = window.location.href;
    const flashcardSetId = currentUrl.split('/mindflash/').pop();
    console.log('flashcardSetId : ', flashcardSetId);
    if (flashcardSetId && flashcardSetId.length === 24 && !flashcardSetId.includes('/')) {
        getFlashcardSet(flashcardSetId);
    }
}
checkIfSetLoadRequired();