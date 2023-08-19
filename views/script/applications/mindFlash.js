window.addEventListener('load', () => {
    loading.disable.mainContainer();
    loading.disable.subContainerSection();
    loading.disable.fullScreen();
});

const loading = (() => {
    const noFlashcardSet = () => {
        document.querySelector('.main-container > .full-screen').classList.remove('hidden');
    }
    const flashcardSetOpen = () => {
        document.querySelector('.main-container > .full-screen').classList.add('hidden');
    }
    const enable = (() => {
        const fullScreen = () => document.getElementById('loading-mindflash').style.display = 'flex';
        const mainContainer = () => document.querySelector('.main-container').classList.add('active-loading');
        const subContainerSection = () => document.querySelector('.main-sub-container > .informations').classList.add('active-loading');
        return {
            fullScreen,
            mainContainer,
            subContainerSection,
        }
    })();
    const disable = (() => {
        const fullScreen = () => document.getElementById('loading-mindflash').style.display = 'none';
        const mainContainer = () => document.querySelector('.main-container').classList.remove('active-loading');
        const subContainerSection = () => document.querySelector('.main-sub-container > .informations').classList.remove('active-loading');
        return {
            fullScreen,
            mainContainer,
            subContainerSection,
        }
    })();
    return {
        enable,
        disable,
        noFlashcardSet,
        flashcardSetOpen,
    }
})();

const loadFlashcardSet = (() => {
    const title = (title) => {
        const titleElement = document.querySelector('.main-container > .infos-bar > h2');
        titleElement.textContent = title ? title : '';
    };
    const stats = async (flashCardSetId) => {
        try {
            const res = await fetch(`/mindFlash/flashcardset/stats/${flashCardSetId}`);
            const data = await res.json();
    
            const percentageBar = document.querySelector('.informations-section > .stats > .percentage-bar');
            const goodPercentage = document.getElementById('percentage-bar-good');
            const okPercentage = document.getElementById('percentage-bar-ok');
            const badPercentage = document.getElementById('percentage-bar-bad');
            const unratedPercentage = document.getElementById('percentage-bar-unrated');
    
            percentageBar.style.display = 'flex';
            goodPercentage.style.width = `${data.percentageOfGood}%`;
            okPercentage.style.width = `${data.percentageOfOk}%`;
            badPercentage.style.width = `${data.percentageOfBad}%`;
            unratedPercentage.style.width = `${data.percentageOfUnrated}%`;
    
            const statsInfoContainer = document.querySelector('.informations-section > .stats > .stats-info-container');
            const statsInfo = [
                { label: 'Bien', percentage: data.percentageOfGood, count: data.numberOfGood },
                { label: 'Moyen', percentage: data.percentageOfOk, count: data.numberOfOk },
                { label: 'Mauvais', percentage: data.percentageOfBad, count: data.numberOfBad },
                { label: 'Non noté', percentage: data.percentageOfUnrated, count: data.numberOfUnrated }
            ];
    
            statsInfo.forEach((info) => {
                if (info.count === 0) return;

                const statsInfoItem = document.createElement('div');
                statsInfoItem.classList.add('stats-info');

                const statsInfoTextContainer = document.createElement('p');
                let statsInfoText = `${info.label} (${info.percentage}% - ${info.count} flashcards)`;
                if (info.count === 1) {
                    statsInfoText = `${info.label} (${info.percentage}% - ${info.count} flashcard)`;
                }
                statsInfoTextContainer.textContent = statsInfoText;

                let color;
                switch (info.label) {
                    case 'Bien':
                    color = '#00C75A';
                    break;
                    case 'Moyen':
                    color = '#F0AC00';
                    break;
                    case 'Mauvais':
                    color = '#FF0000';
                    break;
                    case 'Non noté':
                    color = '#C6C9CE';
                    break;
                    default:
                    color = '#000000';
                }

                statsInfoItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="${color}"/></svg>`;
                statsInfoItem.appendChild(statsInfoTextContainer);
                statsInfoContainer.appendChild(statsInfoItem);
                });
        } catch (err) {
            console.log(err);
        }
    };
    const setBasicInformations = async (flashcardSetId) => {
        try {
            const res = await fetch(`/mindFlash/flashcardset/basicinformations/${flashcardSetId}`);
            const data = await res.json();

            const setBasicInfosMainContainer = document.querySelector('.informations-section > .set-basic-informations');
            setBasicInfosMainContainer.innerHTML = ''; 
            const setBasicInfosTitle = document.createElement('h2');
            setBasicInfosTitle.textContent = 'Informations sur le set';
            setBasicInfosMainContainer.appendChild(setBasicInfosTitle);
            
            const setBasicInformations = [
                { label: 'Créateur de ce set : ', value: data.owner },
                { label: 'Nom du set : ', value: data.title },
                { label: 'Description : ', value: data.description },
                { label: 'Nombre de participants : ', value: data.numberOfParticipants },
                { label: 'Nombre de flashcards : ', value: data.numberOfFlashcards },
                { label: 'Matière du set : ', value: data.subject},
                { label: 'Dernière utilisation : ', value: data.lastUsage}
            ];
            setBasicInformations.forEach(element => {
                const setBasicInformationsContainer = document.createElement('div');
                setBasicInformationsContainer.classList.add('set-basic-informations-container');

                const h3Element = document.createElement('h3');
                h3Element.textContent = element.label;
                const spanElement = document.createElement('span');
                spanElement.textContent = element.value;

                h3Element.appendChild(spanElement);
                setBasicInformationsContainer.appendChild(h3Element);
                setBasicInfosMainContainer.appendChild(setBasicInformationsContainer);
            });
        } catch (err) {
            console.log(err);
        }
    }
    const informationsSection = (flashCardSetId) => {
    loading.enable.subContainerSection();
    stats(flashCardSetId);
    setBasicInformations(flashCardSetId).then(() => {
        loading.disable.subContainerSection();
    });
    }
    return {
        title,
        stats,
        setBasicInformations,
        informationsSection,
    }
})();

const createElement = (() => {
    const flashcard = (question, answer, status, nextReview, lastReview) => {
        const flashcardContainer = document.getElementById('flashcards-container');
        const flashcard = document.createElement('div');
        flashcard.dataset.nextReview = nextReview;
        flashcard.dataset.lastReview = lastReview;
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
    return {
        flashcard,
    }
})();
const filterOrSortFlashcardSet = (() => {
    const toggleFilterBtn = (btn) => {
        let status = false;
        if (btn.classList.contains('filter-activate')) {
            btn.classList.remove('filter-activate');
            status = false;
        } else {
            btn.classList.add('filter-activate');
            status = true;
        }
    };
    const toggleSortBtn = (btn) => {
        let status = false;
        if (btn.classList.contains('sort-activate')) {
            btn.classList.remove('sort-activate');
            status = false;
        } else {
            btn.classList.add('sort-activate');
            status = true;
        }
    };
    const filterFlashcards = (goodFilter, okFilter, badFilter, unratedFilter) => {
        const flashcards = document.querySelectorAll('.flashcard');
        flashcards.forEach(flashcard => {
            const status = flashcard.classList[1].split('-').pop();
            if (status === 'good' && goodFilter) {
                flashcard.classList.remove('hidden');
            } else if (status === 'ok' && okFilter) {
                flashcard.classList.remove('hidden');
            } else if (status === 'bad' && badFilter) {
                flashcard.classList.remove('hidden');
            } else if (status === 'unrated' && unratedFilter) {
                flashcard.classList.remove('hidden');
            } else {
                flashcard.classList.add('hidden');
            }
        });
    };
    const sortFlashcards = (sort) => {
        const flashcards = Array.from(document.querySelectorAll('.flashcard'));

        function giveLevelNumber(level) {
        if (level === 'good') {
            return '3';
        } else if (level === 'ok') {
            return '2';
        } else if (level === 'bad') {
            return '1';
        } else {
            return '0';
        }
        }

        flashcards.sort((a, b) => {
        if (sort === 'random') {
            return Math.random() - 0.5;
        } else if (sort === 'question') {
            return a.querySelector('.flashcard-title').textContent.localeCompare(b.querySelector('.flashcard-title').textContent);
        } else if (sort === 'answer') {
            return b.querySelector('.flashcard-answer').textContent.localeCompare(a.querySelector('.flashcard-answer').textContent);
        } else if (sort === 'nextReview') {
            return a.dataset.nextReview.localeCompare(b.dataset.nextReview);
        } else if (sort === 'lastReview') {
            return a.dataset.lastReview.localeCompare(b.dataset.lastReview);
        } else if (sort === 'levelIncreasing') {
            const aLevel = giveLevelNumber(a.classList[1].split('-').pop());
            const bLevel = giveLevelNumber(b.classList[1].split('-').pop());
            return aLevel.toString().localeCompare(bLevel.toString());
        } else if (sort === 'levelDecreasing') {
            const aLevel = giveLevelNumber(a.classList[1].split('-').pop());
            const bLevel = giveLevelNumber(b.classList[1].split('-').pop());
            return bLevel.toString().localeCompare(aLevel.toString());
        } else {
            return 0;
        }
        });
        flashcards.forEach(flashcard => {
            flashcard.parentNode.appendChild(flashcard);
        });
    }
    return {
        toggleFilterBtn,
        filterFlashcards,
        toggleSortBtn,
        sortFlashcards,
    }
})();
function getFlashcardSet(flashcardSetId) {
    loading.enable.mainContainer();
    fetch(`/mindFlash/getFlashcardset/${flashcardSetId}`)
        .then(res => res.json())
        .then(data => {
            loadFlashcardSet.title(data.flashcardSet.title);
            loadFlashcardSet.informationsSection(data.flashcardSet._id)

            const flashcards = data.flashcards;
            flashcards.forEach(flashcard => {
                createElement.flashcard(flashcard.question, flashcard.answer, flashcard.status, flashcard.nextReview, flashcard.lastReview);
            });
            loading.flashcardSetOpen();
            loading.disable.mainContainer();
        })
        .catch(err => console.log(err));
}

function redirectToDashboard(){
    window.location.href = '/dashboard';
}
const currentUrl = window.location.href;
const flashcardSetId = currentUrl.split('/mindflash/').pop();
console.log('flashcardSetId : ', flashcardSetId);
if (flashcardSetId && flashcardSetId.length === 24 && !flashcardSetId.includes('/')) {
    getFlashcardSet(flashcardSetId);
}

function setSectionActive(btn, section) {    
    sectionBtns.forEach(btn => {
        btn.classList.remove('large'); 
        btn.classList.add('large-white')
    })
    btn.classList.remove('large-white');
    btn.classList.add('large');

    document.querySelectorAll('.informations > section').forEach(section => {
        section.classList.add('hidden');
    });
    document.querySelector(`.${section}-section`).classList.remove('hidden');
}
const sectionBtns = document.querySelectorAll('.informations-display-buttons > button');
sectionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.id.split('-')[0];
    setSectionActive(btn, section);
  });
});

const filterBtns = document.querySelectorAll('.filter-section > .filter-box > div');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterOrSortFlashcardSet.toggleFilterBtn(btn);
        const goodFilter = document.getElementById('filter-good').classList.contains('filter-activate');
        const okFilter = document.getElementById('filter-ok').classList.contains('filter-activate');
        const badFilter = document.getElementById('filter-bad').classList.contains('filter-activate');
        const unratedFilter = document.getElementById('filter-unrated').classList.contains('filter-activate');
        console.log('goodFilter : ', goodFilter);
        console.log('okFilter : ', okFilter);
        console.log('badFilter : ', badFilter);
        console.log('unratedFilter : ', unratedFilter);
        filterOrSortFlashcardSet.filterFlashcards(goodFilter, okFilter, badFilter, unratedFilter);        
    });
});

const sortBtns = document.querySelectorAll('.filter-section > .sort-box > div');
sortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sortBtns.forEach(btn => {
            btn.classList.remove('sort-activate');
        });
        btn.classList.add('sort-activate');
        const sort = btn.id.split('-')[1];
        filterOrSortFlashcardSet.sortFlashcards(sort);
        
        console.log('sort : ', sort);
    });
});
