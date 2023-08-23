//ANCHOR - Global functions
const informationsScreen = (() => {
    const noFlashcardDisplayed = () => {
        const container = document.querySelector('#flashcards-container :first-child.information-screen-flashcards-container');
        container.classList.remove('hidden');
    };
    const noFlashcardInSet = (() => {
        const container = document.querySelector('#flashcards-container :nth-child(2).information-screen-flashcards-container');
        container.classList.remove('hidden');
    })();
    const flashcardDisplayed = () => {
        const firstContainer = document.querySelector('#flashcards-container :first-child.information-screen-flashcards-container');
        const lastContainer = document.querySelector('#flashcards-container :nth-child(2).information-screen-flashcards-container');
        firstContainer.classList.add('hidden');
        lastContainer.classList.add('hidden');
  };
return {
    noFlashcardDisplayed,
    noFlashcardInSet,
    flashcardDisplayed,
}    
})();
const loading = (() => {
    const enable = (() => {
        const fullScreen = () => document.getElementById('loading-mindflash').style.display = 'flex';
        const mainContainer = () => document.querySelector('.main-container').classList.add('active-loading');
        const subContainerSection = () => document.querySelector('.main-sub-container > .informations').classList.add('active-loading');
        const flashcardContainer = () => document.getElementById('flashcards-container').classList.add('active-loading');
        return {
            fullScreen,
            mainContainer,
            subContainerSection,
            flashcardContainer,
        }
    })();
    const disable = (() => {
        const fullScreen = () => document.getElementById('loading-mindflash').style.display = 'none';
        const mainContainer = () => document.querySelector('.main-container').classList.remove('active-loading');
        const subContainerSection = () => document.querySelector('.main-sub-container > .informations').classList.remove('active-loading');
        const flashcardContainer = () => document.getElementById('flashcards-container').classList.remove('active-loading');
        return {
            fullScreen,
            mainContainer,
            subContainerSection,
            flashcardContainer,
        }
    })();
    return {
        enable,
        disable,
    }
})();
const loadFlashcardSet = (() => {
    const title = (title) => {
        const titleElement = document.querySelector('.main-container > .infos-bar > .infos-bar-container > h2');
        titleElement.textContent = title ? title : '';
    };
    const stats = async (flashCardSetId) => {
        try {
            const res = await fetch(`/mindFlash/flashcardset/stats/${flashCardSetId}`);
            const data = await res.json();
            if (data.numberOfFlashcards === 0) {
                console.log('no flashcard');
            }
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
    loadFlashcardSet.stats(flashCardSetId);
    loadFlashcardSet.setBasicInformations(flashCardSetId)
        .then(() => {
            loading.disable.subContainerSection();
        })
        .catch(err => console.log(err));
    };
    return {
        title,
        stats,
        setBasicInformations,
        informationsSection,
    }
})();
const createElement = (() => {
    const flashcard = (flashcardData) => {
        const { question, answer, level, nextReview, lastReview, dateCreated } = flashcardData; 
        const flashcardContainer = document.getElementById('flashcards-container');
        const flashcard = document.createElement('div');
        flashcard.dataset.nextReview = nextReview;
        flashcard.dataset.lastReview = lastReview;
        flashcard.dataset.dateCreated = dateCreated;
        flashcard.classList.add('flashcard');
        switch (level) {
            case 3:
                flashcard.classList.add('flashcard-good');
                break;
            case 2:
                flashcard.classList.add('flashcard-ok');
                break;
            case 1:
                flashcard.classList.add('flashcard-bad');
                break;
            default:
                flashcard.classList.add('unrated');
        };
        
        const options = document.createElement('div');
        options.classList.add('flashcard-options');

        const dots = document.createElement('img');
        dots.src = '../../assets/global/dots.svg';
        dots.alt = 'dots';
        dots.classList.add('flashcard-dots');

        options.appendChild(dots);
        flashcard.appendChild(options);

        const flashcardquestion = document.createElement('div');
        flashcardquestion.classList.add('flashcard-question');
        flashcardquestion.textContent = question;

        flashcard.appendChild(flashcardquestion);

        const divider = document.createElement('div');
        divider.classList.add('flashcard-divider');

        flashcard.appendChild(divider);

        const flashcardAnswer = document.createElement('div');
        flashcardAnswer.classList.add('flashcard-answer');
        flashcardAnswer.textContent = answer;

        flashcard.appendChild(flashcardAnswer);

        flashcardContainer.appendChild(flashcard);
    }
    const flashcardInCreation = (flashcardData) => {
        const { question, answer } = flashcardData; 
        const flashcardContainer = document.getElementById('check-flashcards-container');
        const flashcard = document.createElement('div');
        flashcard.classList.add('flashcard', 'active-selection');

        const flashcardOverlay = document.createElement('div');
        flashcardOverlay.classList.add('flashcard-overlay', 'active-selection');

        flashcard.appendChild(flashcardOverlay);

        const flashcardquestion = document.createElement('div');
        flashcardquestion.classList.add('flashcard-question');
        flashcardquestion.textContent = question;

        flashcard.appendChild(flashcardquestion);

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
        flashcardInCreation,
    }
})();
const filterOrSortFlashcardSet = (() => {
    const toggleFilterBtn = (btn) => {
        if (btn.classList.contains('filter-activate')) {
            btn.classList.remove('filter-activate');
        } else {
            btn.classList.add('filter-activate');
        }
    };
    const toggleSortBtn = (btn) => {
        if (btn.classList.contains('sort-activate')) {
            btn.classList.remove('sort-activate');
        } else {
            btn.classList.add('sort-activate');
        }
    };
    const filterFlashcards = (goodFilter, okFilter, badFilter, unratedFilter) => {
        const flashcards = document.querySelectorAll('#flashcards-container > .flashcard');
        let flashcardsDisplayed = false; // Initialize a variable to track if any flashcards are displayed
        flashcards.forEach(flashcard => {
            const status = flashcard.classList[1].split('-').pop();
            if (status === 'good' && goodFilter) {
            flashcard.classList.remove('hidden');
            flashcardsDisplayed = true; // Set the variable to true if a flashcard is displayed
            } else if (status === 'ok' && okFilter) {
            flashcard.classList.remove('hidden');
            flashcardsDisplayed = true;
            } else if (status === 'bad' && badFilter) {
            flashcard.classList.remove('hidden');
            flashcardsDisplayed = true;
            } else if (status === 'unrated' && unratedFilter) {
            flashcard.classList.remove('hidden');
            flashcardsDisplayed = true;
            } else {
            flashcard.classList.add('hidden');
            }
        });
        
        if (!flashcardsDisplayed) { // Check if no flashcards are displayed
            informationsScreen.noFlashcardDisplayed();
        } else {
            informationsScreen.flashcardDisplayed();
        }
    };
    const sortFlashcards = (sort) => {
        const flashcards = Array.from(document.querySelectorAll('#flashcards-container > .flashcard'));

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
        if (sort === 'newest') {
            return b.dataset.dateCreated.localeCompare(a.dataset.dateCreated);
        } else if (sort === 'oldest') {
            return a.dataset.dateCreated.localeCompare(b.dataset.dateCreated);
        }
         else if (sort === 'question') {
            return a.querySelector('.flashcard-question').textContent.localeCompare(b.querySelector('.flashcard-question').textContent);
        } else if (sort === 'answer') {
            return a.querySelector('.flashcard-answer').textContent.localeCompare(b.querySelector('.flashcard-answer').textContent);
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
        } else if (sort === 'random') {
            return Math.random() - 0.5;
        } else {
            return b.dataset.dateCreated.localeCompare(a.dataset.dateCreated);
        }
        });
        flashcards.forEach(flashcard => {
            flashcard.parentNode.appendChild(flashcard);
        });
        if (flashcards.length === 0) {
            informationsScreen.noFlashcardDisplayed();
        } else {
            informationsScreen.flashcardDisplayed();
        }
        loading.disable.flashcardContainer();
    };
    const resetFilter = () => {
        const filterBtns = document.querySelectorAll('.filter-section > .filter-box > div');
        filterBtns.forEach(btn => {
            btn.classList.add('filter-activate');
        });
        const flashcards = document.querySelectorAll('.flashcard');
        flashcards.forEach(flashcard => {
            flashcard.classList.remove('hidden');
        });
        if (flashcards.length === 0) {
            informationsScreen.noFlashcardDisplayed();
        } else {
            informationsScreen.flashcardDisplayed();
        }
    };
    return {
        toggleFilterBtn,
        filterFlashcards,
        toggleSortBtn,
        sortFlashcards,
        resetFilter,
    }
})();
const toolsFunctions = (() => {
    const redirectToDashboard = () => {
        window.location.href = '/dashboard';
    };
    const setSubMainContainerSectionActive = (btn, section) => {
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
    return {
        redirectToDashboard,
        setSubMainContainerSectionActive,
    }
})();
const manageElementDisplay = (() => {
    const disable = (() => {
        const createFlashcardContainer = () => {
            const createFlashcardContainer = document.querySelector('.create-flashcard-container');
            createFlashcardContainer.classList.remove('prompt-active');

            const overlay = document.querySelector('body > .overlay');
            overlay.style.visibility = 'hidden';

            manageEventListener.createFlashcardSection.removeListener();

            localStorage.removeItem('newFlashcardsList');
        };
        return {
            createFlashcardContainer,
        }
    })();
    const enable = (() => {
        const createFlashcard = (() => {
            const container = () => {
                if (localStorage.getItem('newFlashcardsList')) {
                    localStorage.removeItem('newFlashcardsList');
                };
                enable.createFlashcard.section1();
                enable.createFlashcard.section2Buttons(1);

                const continueBtn = document.getElementById('creating-flashcard-continue-btn');
                continueBtn.textContent = `Poursuivre (0)`;
                const overlay = document.querySelector('body > .overlay');
                overlay.style.visibility = 'visible';
                
                const createFlashcardContainer = document.querySelector('.create-flashcard-container');
                createFlashcardContainer.classList.add('prompt-active');

                manageEventListener.createFlashcardSection.addListener();
            };
            const section1 = () => {
                const section1 = document.querySelector('body > .create-flashcard-container > .create-one-flashcard-section');
                const section2 = document.querySelector('body > .create-flashcard-container > .check-flashcards-section');
                const section3 = document.querySelector('body > .create-flashcard-container > .modify-flashcard-section');
                section1.classList.remove('hidden-left', 'hidden-right');
                section1.classList.add('active-section');
                section2.classList.add('hidden-right');
                section2.classList.remove('active-section');
                section3.classList.add('hidden-right');
                section3.classList.remove('active-section');
            };
            const section2 = () => {
                const section1 = document.querySelector('body > .create-flashcard-container > .create-one-flashcard-section');
                const section2 = document.querySelector('body > .create-flashcard-container > .check-flashcards-section');
                const section3 = document.querySelector('body > .create-flashcard-container > .modify-flashcard-section');
                section1.classList.add('hidden-left');
                section1.classList.remove('active-section');
                section2.classList.remove('hidden-right', 'hidden-left');
                section2.classList.add('active-section');
                section3.classList.add('hidden-right');
                section3.classList.remove('active-section');
            };
            const section3 = () => {
                const section1 = document.querySelector('body > .create-flashcard-container > .create-one-flashcard-section');
                const section2 = document.querySelector('body > .create-flashcard-container > .check-flashcards-section');
                const section3 = document.querySelector('body > .create-flashcard-container > .modify-flashcard-section');
                section1.classList.add('hidden-left');
                section1.classList.remove('active-section');
                section2.classList.add('hidden-left');
                section2.classList.remove('active-section');
                section3.classList.remove('hidden-right', 'hidden-left');
                section3.classList.add('active-section');

                const flashcard = document.querySelector('#check-flashcards-container > .flashcard.flashcard-selected');
                const flashcardQuestion = flashcard.querySelector('.flashcard-question').textContent;
                const flashcardAnswer = flashcard.querySelector('.flashcard-answer').textContent;
                const modifyFlashcardQuestionField = document.getElementById('modify-flashcard-question-field');
                const modifyFlashcardAnswerField = document.getElementById('modify-flashcard-answer-field');
                if (!modifyFlashcardQuestionField || !modifyFlashcardAnswerField) return
                modifyFlashcardQuestionField.value = flashcardQuestion;
                modifyFlashcardAnswerField.value = flashcardAnswer;
            };
            const section2Buttons = (state) => {
                const goBackButton = document.getElementById('go-back-btn-new-flashcard');
                const modifyButton = document.getElementById('modify-btn-new-flashcard');
                const deleteButton = document.getElementById('delete-btn-new-flashcard');
                const addFlashcardsButton = document.getElementById('creating-flashcards-btn');
                console.log(addFlashcardsButton)
                addFlashcardsButton.style.right = '0';
                goBackButton.style.left = '0';
                modifyButton.style.left = '1px';
                deleteButton.style.left = '1px';
                function disableButton(button) {
                    button.style.opacity = '0';
                    button.disabled = true;
                    button.style.cursor = 'default';

                    setTimeout(() => {
                        button.style.position = 'absolute';
                        button.classList.add('hidden-right');
                    }, 300);
                };
                function enableButton(button) {
                    button.classList.remove('hidden-right');
                    button.style.position = 'relative';
                    
                    button.style.opacity = '1';
                    button.disabled = false;
                    button.style.cursor = 'pointer';
                };

                if (state !== 1 && state !== 2) return;
                if (state === 1) {
                    disableButton(modifyButton);
                    disableButton(deleteButton);
                    enableButton(addFlashcardsButton);
                    setTimeout(() => {
                        enableButton(goBackButton);
                    }, 301);
                } else if (state === 2) {
                    disableButton(addFlashcardsButton);
                    disableButton(goBackButton);
                    setTimeout(() => {
                        enableButton(modifyButton);
                        enableButton(deleteButton);
                    }, 301);
                };
            };
            return {
                container,
                section1,
                section2,
                section3,
                section2Buttons,
            }
        })();
        return {
            createFlashcard,
        }
    })();
    return {
        enable,
        disable,
    }
})();
const manageEventListener = (() => {
    const eventListenerActions = (() => {
        const overlay = () => {
            manageElementDisplay.disable.createFlashcardContainer();
        };
        const handleKeyDown = (() => {
            let canCreateFlashcard = true;
          
            const fields = (event) => {
              if (event.key === 'Enter' && canCreateFlashcard) {
                event.preventDefault();
                document.querySelector('section.active-section > .create-flashcard-buttons-container > button.right-button').click();
                canCreateFlashcard = false;
                setTimeout(() => {
                canCreateFlashcard = true;
                }, 1000);
              }
            };
             
            const questionField = (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    fields(event, document.querySelector('.create-flashcard-container > section.active-section > .flashcard > textarea.flashcard-question'))
                } else if (event.key === 'Tab' && !event.shiftKey) {
                    document.querySelector('.create-flashcard-container > section.active-section > .flashcard > textarea.flashcard-answer').focus();
                }
            };
          
            const answerField = (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    fields(event, document.querySelector('.create-flashcard-container > section.active-section > .flashcard > textarea.flashcard-answer'))
                } else if (event.key === 'Tab' && event.shiftKey) {
                    document.querySelector('.create-flashcard-container > section.active-section > .flashcard > textarea.flashcard-question').focus();
                }
            };
          
            const window = (event) => {
              if (event.key === 'Escape') {
                manageElementDisplay.disable.createFlashcardContainer();
              }
            };
          
            return {
              questionField,
              answerField,
              window
            }
        })();
        const modifyNewFlashcardButton = (event) => {
            const flashcardTargetOverlay = event.target;
            const flashcardTarget = flashcardTargetOverlay.parentElement;
            const flashcardTargetClass = flashcardTarget.classList[1];

            const flashcards = document.querySelectorAll('#check-flashcards-container > .flashcard');
            flashcards.forEach((flashcard) => {
                flashcard.classList.remove('flashcard-selected');
                flashcard.classList.add('active-selection');
                flashcardTargetOverlay.classList.remove('flashcard-selected');
                flashcardTargetOverlay.classList.add('active-selection');
            });
            if (flashcardTarget.classList.contains(flashcardTargetClass)) {
                flashcardTarget.classList.add('flashcard-selected');
                flashcardTarget.classList.remove('active-selection');
                flashcardTargetOverlay.classList.add('flashcard-selected');
                flashcardTargetOverlay.classList.remove('active-selection');
            } else {
                flashcardTarget.classList.add('active-selection');
                flashcardTarget.classList.remove('flashcard-selected');
                flashcardTargetOverlay.classList.add('active-selection');
                flashcardTargetOverlay.classList.remove('flashcard-selected');
            };

            const selectedFlashcard = document.querySelector('#check-flashcards-container > .flashcard.flashcard-selected');
            if (selectedFlashcard) {
                manageElementDisplay.enable.createFlashcard.section2Buttons(2);
            } else {
                manageElementDisplay.enable.createFlashcard.section2Buttons(1);
            }   
        }
        return {
            overlay,
            handleKeyDown,
            modifyNewFlashcardButton,
        }
    })();
    const createFlashcardSection = (() => {
        const questionFields = document.querySelectorAll('.create-flashcard-container > section > .flashcard > .flashcard-question');
        const answerFields = document.querySelectorAll('.create-flashcard-container > section > .flashcard > .flashcard-answer');
        const overlay = document.querySelector('body > .overlay');
        const flashcardsContainer = document.getElementById('check-flashcards-container');

        const addListener = () => {
            window.addEventListener('keydown', eventListenerActions.handleKeyDown.window);
            overlay.addEventListener('click', eventListenerActions.overlay);
            flashcardsContainer.addEventListener('click', eventListenerActions.modifyNewFlashcardButton);
            questionFields.forEach(field => {
                field.addEventListener('keydown', eventListenerActions.handleKeyDown.questionField);
                console.log('event listener added')
            });
            answerFields.forEach(field => {
                field.addEventListener('keydown', eventListenerActions.handleKeyDown.answerField);
            });
        };
        const removeListener = () => {
            window.removeEventListener('keydown', eventListenerActions.handleKeyDown.window);
            overlay.removeEventListener('click', eventListenerActions.overlay);
            flashcardsContainer.removeEventListener('click', eventListenerActions.modifyNewFlashcardButton);
            questionFields.forEach(field => {
                field.removeEventListener('keydown', eventListenerActions.handleKeyDown.questionField);
            });
            answerFields.forEach(field => {
                field.removeEventListener('keydown', eventListenerActions.handleKeyDown.answerField);
            });
        };
        return {
            addListener,
            removeListener,
        }
    })();
    return {
        eventListenerActions,
        createFlashcardSection,
    }
})();
const flashcardSetFunctions = (() => {
    const generateFlashcardSet = (flashcardSetId) => {
        loading.enable.mainContainer();
        loading.enable.flashcardContainer();
        fetch(`/mindFlash/getFlashcardset/${flashcardSetId}`)
            .then(res => res.json())
            .then(data => {
                loadFlashcardSet.title(data.flashcardSet.title);
                loadFlashcardSet.informationsSection(data.flashcardSet._id)
    
                const flashcards = data.flashcards;
                flashcards.forEach(flashcard => {
                    createElement.flashcard(flashcard);
                });
                
                const sortBtn = document.querySelector('.filter-section > .sort-box > .sort-activate');
                document.querySelectorAll('.filter-section > .sort-box > div').forEach(btn => {
                    btn.classList.remove('sort-activate');
                });
                sortBtn.classList.add('sort-activate');
                filterOrSortFlashcardSet.sortFlashcards(sortBtn.id.split('-')[1]);

                filterOrSortFlashcardSet.resetFilter();
            })
            .then (() => {
                loading.disable.mainContainer();
                loading.disable.flashcardContainer();
            })
            .catch(err => console.log(err));
    };
    return {
        generateFlashcardSet,
    }
})();
const flashcardFunctions = (() => {
    const createFlashcard = (() => {
        const addNewFlashcardToList = async () => {
            const question = document.getElementById('new-flashcard-question-field').value;
            const answer = document.getElementById('new-flashcard-answer-field').value;
            try {
                const response = await fetch(`/mindFlash/flashcard/create/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question, answer })
                });
                const data = await response.json();
                if (data.error) {
                toast({
                    title: "Erreur",
                    message: data.error,
                    type: "error",
                    duration: 2500,
                });
                return;
                }
                const newFlashcard = { question, answer };
                const newFlashcardsList = JSON.parse(localStorage.getItem('newFlashcardsList') || '[]');
                console.log('before: ', newFlashcardsList);
                newFlashcardsList.push(newFlashcard);
                console.log('after: ', newFlashcardsList);
                localStorage.setItem('newFlashcardsList', JSON.stringify(newFlashcardsList));

                const continueBtn = document.getElementById('creating-flashcard-continue-btn');
                continueBtn.textContent = `Poursuivre (${newFlashcardsList.length})`;

                document.getElementById('new-flashcard-question-field').value = '';
                document.getElementById('new-flashcard-answer-field').value = '';
                document.getElementById('new-flashcard-question-field').focus();
            } catch (err) {
                console.log(err);
            }
        };
        const deleteNewFlashcardFromList = (flascard) => {
            
        }
        const createNewFlashcardList = () => {
            const newFlashcardsList = JSON.parse(localStorage.getItem('newFlashcardsList'));
            if (!newFlashcardsList || newFlashcardsList.length === 0) {
                toast({
                    title: "Erreur",
                    message: "Vous n'avez pas encore créé de flashcard",
                    type: "error",
                    duration: 2500,
                });
            } else {
                const checkFlashcardsContainer = document.getElementById('check-flashcards-container');
                checkFlashcardsContainer.innerHTML = '';
                newFlashcardsList.forEach(flashcard => {
                    createElement.flashcardInCreation(flashcard);
                });
                manageElementDisplay.enable.createFlashcard.section2();
            }
        };
        const toggleSelection = (flashcard) => {
            if (flashcard.classList.contains('active-selection')) {
                flashcard.classList.remove('active-selection');
                flashcard.classList.add('flashcard-selected');
            } else if (flashcard.classList.contains('flashcard-selected')) {
                flashcard.classList.remove('flashcard-selected');
                setTimeout(() => {
                    flashcard.classList.add('active-selection');
                }, 400);
            }
        };
        const modifyFlashcards = (flashcard) => {
            
        };
        const createFlashcards = () => {
            const newFlashcardList = JSON.parse(localStorage.getItem('newFlashcardsList'));
            if (!newFlashcardList) {
                toast({
                    title: "Erreur",
                    message: "Vous n'avez pas créé de flashcard",
                    type: "error",
                    duration: 2500,
                });
                manageElementDisplay.enable.createFlashcard.section1();
                return;
            };
            try {
                fetch('/mindflash/flashcard/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ flashcardSetId: flashcardSetId, flashcards: newFlashcardList })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        toast({
                            title: "Erreur",
                            message: data.error,
                            type: "error",
                            duration: 2500,
                            });
                        return
                    }
                    toast({
                        title: "Succès",
                        message: data.message,
                        type: "success",
                        duration: 2500,
                    });
                    manageElementDisplay.disable.createFlashcardContainer();
                    
                    newFlashcardList.forEach(flashcard => {
                        createElement.flashcard(flashcard);
                    });
                    filterOrSortFlashcardSet.sortFlashcards();
                });
            }
            catch {
                toast({
                    title: "Erreur",
                    message: "Une erreur est survenue",
                    type: "error",
                    duration: 2500,
                });
            }         
        }
        return {
            addNewFlashcardToList,
            createNewFlashcardList,
            createFlashcards,
            toggleSelection,
        }
    })();
    return {
        createFlashcard,
    }
})();

//ANCHOR - Initiator code
loading.enable.fullScreen();
loading.enable.mainContainer();
loading.enable.subContainerSection();
window.addEventListener('load', () => {
    loading.disable.fullScreen();
});

const currentUrl = window.location.href;
const flashcardSetId = currentUrl.split('/mindflash/').pop();
if (flashcardSetId && flashcardSetId.length === 24 && !flashcardSetId.includes('/')) {
    informationsScreen.noFlashcardInSet;
    flashcardSetFunctions.generateFlashcardSet(flashcardSetId);
}


//ANCHOR - Sub Main container section buttons
const sectionBtns = document.querySelectorAll('.informations-display-buttons > button');
sectionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.id.split('-')[0];
    toolsFunctions.setSubMainContainerSectionActive(btn, section);
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
    });
});

//ANCHOR - Test code
