//ANCHOR - Global functions
const informationsScreen = (() => {
    const noFlashcardDisplayed = () => {
        const container = document.querySelector('#flashcards-container :first-child.information-screen-flashcards-container');
        container.classList.remove('hidden');
    };
    const noFlashcardInSet = () => {
        console.log('no flashcard in set');
        const container = document.querySelector('#flashcards-container :nth-child(2).information-screen-flashcards-container');
        container.classList.remove('hidden');
    };
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
    };
})();
const loading = (() => {
    const enable = (() => {
        const fullScreen = () => (document.getElementById('loading-flashcards').style.display = 'flex');
        const mainContainer = () => document.querySelector('.main-container').classList.add('active-loading');
        const subContainerSection = () => document.querySelector('.main-sub-container > .informations').classList.add('active-loading');
        const flashcardContainer = () => document.getElementById('flashcards-container').classList.add('active-loading');
        return {
            fullScreen,
            mainContainer,
            subContainerSection,
            flashcardContainer,
        };
    })();
    const disable = (() => {
        const fullScreen = () => (document.getElementById('loading-flashcards').style.display = 'none');
        const mainContainer = () => document.querySelector('.main-container').classList.remove('active-loading');
        const subContainerSection = () => document.querySelector('.main-sub-container > .informations').classList.remove('active-loading');
        const flashcardContainer = () => document.getElementById('flashcards-container').classList.remove('active-loading');
        return {
            fullScreen,
            mainContainer,
            subContainerSection,
            flashcardContainer,
        };
    })();
    return {
        enable,
        disable,
    };
})();
const loadFlashcardSet = (() => {
    const title = title => {
        const titleElement = document.querySelector('.main-container > .infos-bar > h2');
        titleElement.textContent = title ? title : '';
    };
    const stats = async flashCardSetId => {
        try {
            const res = await fetch(`/flashcards/flashcardset/stats/${flashCardSetId}`);
            const data = await res.json();
            const subSectionBoxStats = document.querySelector('.sub-section-box.stats');
            subSectionBoxStats.classList.toggle('hidden', data.numberOfFlashcards === 0);
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
                { label: 'Non noté', percentage: data.percentageOfUnrated, count: data.numberOfUnrated },
            ];
            statsInfoContainer.innerHTML = '';
            statsInfo.forEach(info => {
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
            const numberOfFlashcards = document.querySelector('.set-basic-informations :nth-child(5) > h3 > span');
            if (numberOfFlashcards) {
                numberOfFlashcards.textContent = `${numberOfFlashcards}`;
            }
        } catch (err) {
            console.log(err);
        }
    };
    const setBasicInformations = async flashcardSetId => {
        try {
            const res = await fetch(`/flashcards/flashcardset/basicinformations/${flashcardSetId}`);
            const data = await res.json();
            console.log('info data', data);

            const setBasicInfosMainContainer = document.querySelector('.informations-section > .set-basic-informations');
            setBasicInfosMainContainer.innerHTML = '';
            const setBasicInfosTitle = document.createElement('h2');
            setBasicInfosTitle.textContent = 'Informations sur le set';
            setBasicInfosMainContainer.appendChild(setBasicInfosTitle);

            const setBasicInformations = [
                { label: 'Créateur de ce set', value: data.owner },
                { label: 'Nom du set', value: data.title },
                { label: 'Description', value: data.description },
                { label: 'Nombre de participants', value: data.numberOfParticipants },
                { label: 'Nombre de flashcards', value: data.numberOfFlashcards },
                { label: 'Matière du set', value: data.subject },
                { label: 'Dernière utilisation', value: data.lastUsage },
            ];
            setBasicInformations.forEach(element => {
                const setBasicInformationsContainer = document.createElement('div');
                setBasicInformationsContainer.classList.add('set-basic-informations-container');

                const h3Element = document.createElement('h3');
                h3Element.textContent = element.label;

                const paragraphElement = document.createElement('p');
                paragraphElement.textContent = element.value;

                setBasicInformationsContainer.appendChild(h3Element);
                setBasicInformationsContainer.appendChild(paragraphElement);
                setBasicInfosMainContainer.appendChild(setBasicInformationsContainer);
            });
        } catch (err) {
            console.log(err);
        }
    };
    const informationsSection = flashCardSetId => {
        loading.enable.subContainerSection();
        loadFlashcardSet.stats(flashCardSetId);
        loadFlashcardSet
            .setBasicInformations(flashCardSetId)
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
    };
})();
const createElement = (() => {
    const flashcard = flashcardData => {
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
        }

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
    };
    const flashcardInCreation = flashcardData => {
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
    };
    return {
        flashcard,
        flashcardInCreation,
    };
})();
const filterOrSortFlashcardSet = (() => {
    const toggleFilterBtn = btn => {
        if (btn.classList.contains('filter-activate')) {
            btn.classList.remove('filter-activate');
        } else {
            btn.classList.add('filter-activate');
        }
    };
    const toggleSortBtn = btn => {
        if (btn.classList.contains('sort-activate')) {
            btn.classList.remove('sort-activate');
        } else {
            btn.classList.add('sort-activate');
        }
    };
    const filterFlashcards = (goodFilter, okFilter, badFilter, unratedFilter) => {
        const flashcards = document.querySelectorAll('#flashcards-container > .flashcard');
        let flashcardsDisplayed = false;
        flashcards.forEach(flashcard => {
            const status = flashcard.classList[1].split('-').pop();
            if (status === 'good' && goodFilter) {
                flashcard.classList.remove('hidden');
                flashcardsDisplayed = true;
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

        if (!flashcardsDisplayed) {
            // Check if no flashcards are displayed
            informationsScreen.noFlashcardDisplayed();
        } else {
            informationsScreen.flashcardDisplayed();
        }
    };
    const sortFlashcards = sort => {
        const flashcards = Array.from(document.querySelectorAll('#flashcards-container > .flashcard'));
        if (flashcards.length === 0) {
            return informationsScreen.noFlashcardInSet();
        }
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
            } else if (sort === 'question') {
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
        const flashcards = document.querySelectorAll('#flashcards-container > .flashcard');
        flashcards.forEach(flashcard => {
            flashcard.classList.remove('hidden');
        });

        if (flashcards.length === 0) {
            informationsScreen.noFlashcardInSet();
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
    };
})();

const toolsFunctions = (() => {
    const redirectToDashboard = () => {
        window.location.href = '/dashboard';
    };
    return {
        redirectToDashboard,
    };
})();
const manageElementDisplay = (() => {
    const disable = (() => {
        const createFlashcardContainer = () => {
            const createFlashcardContainer = document.querySelector('.create-flashcard-container');
            createFlashcardContainer.classList.remove('prompt-active');

            const overlay = document.querySelector('body > .overlay');
            overlay.style.visibility = 'hidden';

            manageEventListener.createFlashcardSection.removeListener();

            localStorage.removeItem('newFlashcardList');
        };
        return {
            createFlashcardContainer,
        };
    })();
    const enable = (() => {
        const createFlashcard = (() => {
            const container = () => {
                if (localStorage.getItem('newFlashcardList')) {
                    localStorage.removeItem('newFlashcardList');
                }
                enable.createFlashcard.section(1.1);
                enable.createFlashcard.section2Buttons(1);

                const continueBtn = document.getElementById('creating-flashcard-continue-btn');
                continueBtn.textContent = `Poursuivre (0)`;
                const overlay = document.querySelector('body > .overlay');
                overlay.style.visibility = 'visible';

                const createFlashcardContainer = document.querySelector('.create-flashcard-container');
                createFlashcardContainer.classList.add('prompt-active');

                manageEventListener.createFlashcardSection.addListener();
            };
            const section = sectionNumber => {
                const section1 = document.querySelector('body > .create-flashcard-container > .create-one-flashcard-section');
                const section2 = document.querySelector('body > .create-flashcard-container > .check-flashcards-section');
                const section3 = document.querySelector('body > .create-flashcard-container > .modify-flashcard-section');
                const sectionIA1 = document.querySelector('body > .create-flashcard-container > .create-flashcard-ia');
                const sectionIA2 = document.querySelector('body > .create-flashcard-container > .loading-flashcards-ia');
                const allSections = [section1, section2, section3, sectionIA1, sectionIA2];

                function setSectionActive(section) {
                    allSections.forEach(section => {
                        section.classList.remove('active-section');
                    });
                    section.classList.add('active-section');
                }
                function setSectionHiddenLeft(sections) {
                    sections.forEach(section => {
                        section.classList.remove('hidden-right');
                        section.classList.add('hidden-left');
                    });
                }
                function setSectionHiddenRight(sections) {
                    sections.forEach(section => {
                        section.classList.remove('hidden-left');
                        section.classList.add('hidden-right');
                    });
                }

                switch (sectionNumber) {
                    /** 1: Création normale, 2: IA création */
                    case 1.1:
                        setSectionActive(section1);
                        setSectionHiddenRight(allSections.filter(section => section !== section1));

                        const newFlashcardList = JSON.parse(localStorage.getItem('newFlashcardList') || '[]');
                        const continueBtn = document.getElementById('creating-flashcard-continue-btn');
                        continueBtn.textContent = `Poursuivre (${newFlashcardList.length})`;
                        break;
                    case 2.1:
                        setSectionActive(sectionIA1);
                        setSectionHiddenLeft([section1]);
                        setSectionHiddenRight(allSections.filter(section => section !== (sectionIA1 || section1)));
                        break;
                    case 2.2:
                        setSectionActive(sectionIA2);
                        setSectionHiddenLeft([section1, sectionIA1]);
                        setSectionHiddenRight(allSections.filter(section => section !== (sectionIA2 || sectionLeft)));
                        break;
                    case 1.2:
                        setSectionActive(section2);
                        setSectionHiddenLeft([section1, sectionIA1]);
                        setSectionHiddenRight(allSections.filter(section => section !== (section2 || section1 || sectionIA1)));
                        break;
                    case 1.3:
                        section1.classList.add('hidden-left');
                        section1.classList.remove('active-section');
                        section2.classList.add('hidden-left');
                        section2.classList.remove('active-section');
                        setSectionActive(section3);
                        setSectionHiddenLeft(allSections.filter(section => section !== section3));

                        const flashcard = document.querySelector('#check-flashcards-container > .flashcard.flashcard-selected');
                        const flashcardQuestion = flashcard.querySelector('.flashcard-question').textContent;
                        const flashcardAnswer = flashcard.querySelector('.flashcard-answer').textContent;
                        const modifyFlashcardQuestionField = document.getElementById('modify-flashcard-question-field');
                        const modifyFlashcardAnswerField = document.getElementById('modify-flashcard-answer-field');
                        if (!modifyFlashcardQuestionField || !modifyFlashcardAnswerField) return;
                        modifyFlashcardQuestionField.value = flashcardQuestion;
                        modifyFlashcardAnswerField.value = flashcardAnswer;
                        break;
                    default:
                        return;
                }
            };
            const section2Buttons = state => {
                const goBackButton = document.getElementById('go-back-btn-new-flashcard');
                const modifyButton = document.getElementById('modify-btn-new-flashcard');
                const deleteButton = document.getElementById('delete-btn-new-flashcard');
                const addFlashcardsButton = document.getElementById('creating-flashcards-btn');
                addFlashcardsButton.style.right = '0';
                goBackButton.style.left = '0';
                modifyButton.style.left = '1px';
                deleteButton.style.left = '1px';
                function disableButton(button) {
                    button.style.opacity = '0';
                    button.disabled = true;
                    button.style.cursor = 'default';
                    button.style.position = 'absolute';
                    button.classList.add('hidden-right');
                }
                function enableButton(button) {
                    button.classList.remove('hidden-right');
                    button.style.position = 'relative';

                    button.style.opacity = '1';
                    button.disabled = false;
                    button.style.cursor = 'pointer';
                }

                if (state !== 1 && state !== 2) return;
                if (state === 1) {
                    disableButton(modifyButton);
                    disableButton(deleteButton);
                    enableButton(addFlashcardsButton);
                    enableButton(goBackButton);
                } else if (state === 2) {
                    disableButton(addFlashcardsButton);
                    disableButton(goBackButton);
                    enableButton(modifyButton);
                    enableButton(deleteButton);
                }
            };
            return {
                container,
                section,
                section2Buttons,
            };
        })();
        const subContainerSection = (btn, section) => {
            const sectionBtns = document.querySelectorAll('.informations-display-buttons > button');
            const informationsSection = document.querySelector('.informations > .informations-section');
            const filterSection = document.querySelector('.informations > .filter-section');
            const optionsSection = document.querySelector('.informations > .options-section');

            sectionBtns.forEach(btn => {
                btn.classList.remove('large');
                btn.classList.add('large-white');
            });
            btn.classList.remove('large-white');
            btn.classList.add('large');

            switch (section) {
                case 'informations':
                    informationsSection.classList.remove('hidden-right', 'hidden-left');
                    filterSection.classList.add('hidden-right');
                    optionsSection.classList.add('hidden-right');
                    break;
                case 'filter':
                    informationsSection.classList.add('hidden-left');
                    filterSection.classList.remove('hidden-right', 'hidden-left');
                    optionsSection.classList.add('hidden-right');
                    break;
                case 'options':
                    informationsSection.classList.add('hidden-left');
                    filterSection.classList.add('hidden-left');
                    optionsSection.classList.remove('hidden-right', 'hidden-left');
                    break;
                default:
                    return;
            }
        };
        return {
            createFlashcard,
            subContainerSection,
        };
    })();
    return {
        enable,
        disable,
    };
})();
const manageEventListener = (() => {
    const eventListenerActions = (() => {
        const overlay = () => {
            manageElementDisplay.disable.createFlashcardContainer();
        };
        const handleKeyDown = (() => {
            let canCreateFlashcard = true;

            const fields = event => {
                if (event.key === 'Enter' && canCreateFlashcard) {
                    event.preventDefault();
                    document.querySelector('section.active-section > .create-flashcard-buttons-container > button.right-button').click();
                    canCreateFlashcard = false;
                    setTimeout(() => {
                        canCreateFlashcard = true;
                    }, 500);
                }
            };

            const questionField = event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    fields(event, document.querySelector('.create-flashcard-container > section.active-section > .flashcard > textarea.flashcard-question'));
                } else if (event.key === 'Tab' && !event.shiftKey) {
                    document.querySelector('.create-flashcard-container > section.active-section > .flashcard > textarea.flashcard-answer').focus();
                }
            };

            const answerField = event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    fields(event, document.querySelector('.create-flashcard-container > section.active-section > .flashcard > textarea.flashcard-answer'));
                } else if (event.key === 'Tab' && event.shiftKey) {
                    document.querySelector('.create-flashcard-container > section.active-section > .flashcard > textarea.flashcard-question').focus();
                }
            };

            const window = event => {
                if (event.key === 'Escape') {
                    manageElementDisplay.disable.createFlashcardContainer();
                }
            };

            return {
                questionField,
                answerField,
                window,
            };
        })();
        const modifyNewFlashcardButton = event => {
            const flashcardTargetOverlay = event.target;
            const flashcardTarget = flashcardTargetOverlay.parentElement;
            const flashcardTargetClass = flashcardTarget.classList[1];

            const flashcards = document.querySelectorAll('#check-flashcards-container > .flashcard');
            flashcards.forEach(flashcard => {
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
            }

            const selectedFlashcard = document.querySelector('#check-flashcards-container > .flashcard.flashcard-selected');
            if (selectedFlashcard) {
                manageElementDisplay.enable.createFlashcard.section2Buttons(2);
            } else {
                manageElementDisplay.enable.createFlashcard.section2Buttons(1);
            }
        };
        return {
            overlay,
            handleKeyDown,
            modifyNewFlashcardButton,
        };
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
        };
    })();
    return {
        eventListenerActions,
        createFlashcardSection,
    };
})();
const flashcardSetFunctions = (() => {
    const generateFlashcardSet = flashcardSetId => {
        loading.enable.mainContainer();
        loading.enable.flashcardContainer();
        fetch(`/flashcards/getFlashcardset/${flashcardSetId}`)
            .then(res => res.json())
            .then(data => {
                loadFlashcardSet.title(data.flashcardSet.title);
                loadFlashcardSet.informationsSection(data.flashcardSet._id);

                const flashcards = data.flashcards;
                console.log('flashcards', flashcards);
                if (!flashcards) {
                    informationsScreen.noFlashcardInSet();
                    loading.disable.mainContainer();
                    loading.disable.flashcardContainer();
                    return;
                }
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
            .then(() => {
                loading.disable.mainContainer();
                loading.disable.flashcardContainer();
            })
            .catch(err => console.log(err));
    };
    return {
        generateFlashcardSet,
    };
})();
const flashcardFunctions = (() => {
    const createFlashcard = (() => {
        const checkFlashcardValidity = flascard => {
            const { question, answer } = flascard;
            if (question.length < 1 || answer.length < 1) {
                return 'noQuestionOrAnswer';
            } else if (question.length > 60 || answer.length > 60) {
                return 'tooLongQuestionOrAnswer';
            } else {
                return true;
            }
        };
        const addNewFlashcardToList = async () => {
            const question = document.getElementById('new-flashcard-question-field').value;
            const answer = document.getElementById('new-flashcard-answer-field').value;
            const newFlashcard = { question, answer };

            if (checkFlashcardValidity(newFlashcard) === 'noQuestionOrAnswer') {
                toast({
                    title: 'Erreur',
                    message: 'Veuillez remplir tous les champs',
                    type: 'error',
                    duration: 2500,
                });
                return;
            } else if (checkFlashcardValidity(newFlashcard) === 'tooLongQuestionOrAnswer') {
                toast({
                    title: 'Erreur',
                    message: 'Veuillez ne pas dépasser 60 caractères par champ',
                    type: 'error',
                    duration: 2500,
                });
                return;
            }

            const newFlashcardList = JSON.parse(localStorage.getItem('newFlashcardList') || '[]');
            newFlashcardList.push(newFlashcard);
            localStorage.setItem('newFlashcardList', JSON.stringify(newFlashcardList));

            const continueBtn = document.getElementById('creating-flashcard-continue-btn');
            continueBtn.textContent = `Poursuivre (${newFlashcardList.length})`;

            document.getElementById('new-flashcard-question-field').value = '';
            document.getElementById('new-flashcard-answer-field').value = '';
            document.getElementById('new-flashcard-question-field').focus();
        };
        const modifyFlashcard = () => {
            const newFlashcardList = JSON.parse(localStorage.getItem('newFlashcardList'));
            const flashcardQuestion = document.getElementById('modify-flashcard-question-field').value;
            const flashcardAnswer = document.getElementById('modify-flashcard-answer-field').value;
            const selectedFlashcard = document.querySelector('#check-flashcards-container > .flashcard.flashcard-selected');

            if (!newFlashcardList) {
                manageElementDisplay.enable.createFlashcard.section(1.1);
                toast({ title: 'Erreur', message: 'Veuillez recommencer la création de votre flashcard', type: 'error', duration: 2500 });
                return;
            }
            if (!selectedFlashcard) {
                toast({ title: 'Erreur', message: 'Aucune flashcard sélectionnée', type: 'error', duration: 2500 });
                return;
            }
            if (!flashcardQuestion || !flashcardAnswer) {
                toast({ title: 'Erreur', message: 'Veuillez remplir tous les champs', type: 'error', duration: 2500 });
                return;
            }
            if (flashcardQuestion === selectedFlashcard.querySelector('.flashcard-question').textContent && flashcardAnswer === selectedFlashcard.querySelector('.flashcard-answer').textContent) {
                toast({ title: 'Erreur', message: 'Veuillez modifier au moins un champ', type: 'error', duration: 2500 });
                return;
            }

            const flashcardSelectedIndex = Array.from(document.querySelectorAll('#check-flashcards-container > .flashcard')).indexOf(selectedFlashcard);
            const modifyFlashcard = { question: flashcardQuestion, answer: flashcardAnswer };
            newFlashcardList.splice(flashcardSelectedIndex, 1, modifyFlashcard);
            localStorage.setItem('newFlashcardList', JSON.stringify(newFlashcardList));

            const selectedFlashcardFields = { question: selectedFlashcard.querySelector('.flashcard-question'), answer: selectedFlashcard.querySelector('.flashcard-answer') };
            selectedFlashcardFields.question.textContent = flashcardQuestion;
            selectedFlashcardFields.answer.textContent = flashcardAnswer;

            manageElementDisplay.enable.createFlashcard.section(1.2);
            manageEventListener.eventListenerActions.modifyNewFlashcardButton({ target: selectedFlashcard });
            selectedFlashcard.classList.remove('flashcard-selected');

            toast({ title: 'Succès', message: 'La flashcard a bien été modifiée', type: 'success', duration: 2500 });
        };
        const deleteFlashcard = () => {
            const newFlashcardList = JSON.parse(localStorage.getItem('newFlashcardList'));
            const selectedFlashcard = document.querySelector('#check-flashcards-container > .flashcard.flashcard-selected');

            if (!newFlashcardList) {
                manageElementDisplay.enable.createFlashcard.section(1.1);
                toast({ title: 'Erreur', message: 'Veuillez recommencer la création de votre flashcard', type: 'error', duration: 2500 });
                return;
            }
            if (!selectedFlashcard) {
                toast({ title: 'Erreur', message: 'Aucune flashcard sélectionnée', type: 'error', duration: 2500 });
                return;
            }

            const flashcardSelectedIndex = Array.from(document.querySelectorAll('#check-flashcards-container > .flashcard')).indexOf(selectedFlashcard);
            newFlashcardList.splice(flashcardSelectedIndex, 1);
            localStorage.setItem('newFlashcardList', JSON.stringify(newFlashcardList));

            selectedFlashcard.remove();

            if (newFlashcardList.length === 0) {
                manageElementDisplay.enable.createFlashcard.section(1.1);
            }

            manageElementDisplay.enable.createFlashcard.section2Buttons(1);
            toast({ title: 'Succès', message: 'La flashcard a bien été supprimée', type: 'success', duration: 2500 });
        };
        const createNewFlashcardList = () => {
            const newFlashcardList = JSON.parse(localStorage.getItem('newFlashcardList'));
            if (!newFlashcardList || newFlashcardList.length === 0) {
                toast({
                    title: 'Erreur',
                    message: "Vous n'avez pas encore créé de flashcard",
                    type: 'error',
                    duration: 2500,
                });
            } else {
                const checkFlashcardsContainer = document.getElementById('check-flashcards-container');
                checkFlashcardsContainer.innerHTML = '';
                newFlashcardList.forEach(flashcard => {
                    createElement.flashcardInCreation(flashcard);
                });
                manageElementDisplay.enable.createFlashcard.section(1.2);
            }
        };
        const createFlashcards = async () => {
            const newFlashcardList = JSON.parse(localStorage.getItem('newFlashcardList'));
            if (!newFlashcardList) {
                toast({ title: 'Erreur', message: "Vous n'avez pas créé de flashcard", type: 'error', duration: 2500 });
                manageElementDisplay.enable.createFlashcard.section(1.1);
                return;
            }

            try {
                const res = await fetch('/flashcards/flashcard/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ flashcardSetId, flashcards: newFlashcardList }),
                });
                const data = await res.json();

                if (data.error) {
                    toast({ title: 'Erreur', message: data.error, type: 'error', duration: 2500 });
                    return;
                }

                manageElementDisplay.disable.createFlashcardContainer();
                newFlashcardList.forEach(createElement.flashcard);
                filterOrSortFlashcardSet.sortFlashcards();
                toast({ title: 'Succès', message: data.message, type: 'success', duration: 2500 });
                loadFlashcardSet.informationsSection(flashcardSetId);
            } catch {
                toast({ title: 'Erreur', message: 'Une erreur est survenue', type: 'error', duration: 2500 });
            }
        };
        return {
            modifyFlashcard,
            deleteFlashcard,
            addNewFlashcardToList,
            createNewFlashcardList,
            createFlashcards,
        };
    })();
    return {
        createFlashcard,
    };
})();

//ANCHOR - Initiator code
loading.enable.fullScreen();
loading.enable.mainContainer();
loading.enable.subContainerSection();
window.addEventListener('load', () => {
    loading.disable.fullScreen();
});

const currentUrl = window.location.href;
const flashcardSetId = currentUrl.split('/flashcards/').pop();
if (flashcardSetId && flashcardSetId.length === 24 && !flashcardSetId.includes('/')) {
    informationsScreen.noFlashcardInSet;
    flashcardSetFunctions.generateFlashcardSet(flashcardSetId);
}

//ANCHOR - Sub Main container section buttons
const openSubContainerBtn = document.getElementById('open-sub-container-btn');
const closeSubContainerBtn = document.getElementById('close-sub-container-btn');
const body = document.querySelector('body');
const mainSubContainer = document.querySelector('.main-sub-container');

const toggleSubContainer = () => {
    if (window.innerWidth < 1000) {
        body.classList.toggle('active-sub-container');
    }
};

openSubContainerBtn.addEventListener('click', toggleSubContainer);
closeSubContainerBtn.addEventListener('click', toggleSubContainer);

const sectionBtns = document.querySelectorAll('.informations-display-buttons > button');
sectionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.id.split('-')[0];
        manageElementDisplay.enable.subContainerSection(btn, section);
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

//ANCHOR - Test

function chooseFile(id) {
    manageElementDisplay.enable.createFlashcard.section(2.2);
}

function createFileElement(file) {
    const div = document.createElement('div');
    div.dataset.id = file._id;
    div.dataset.name = file.displayname;
    div.dataset.ext = file.mimetype;
    div.dataset.size = (file.filesize / 1024 / 1024).toFixed(2) + ' Mo';
    div.dataset.date = file.date.split('T')[0];
    div.setAttribute('onclick', `chooseFile('${file._id}')`);
    div.classList.add('file-item');
    const subDiv = document.createElement('div');
    subDiv.classList.add('file-name');
    const img = document.createElement('img');
    let imgRef = fileIconReference[file.mimetype];
    if (imgRef) {
        img.src = `${fileIconReference[file.mimetype]}`;
    } else {
        img.src = '../assets/files-icons/unknow.png';
        imgRef = '../assets/files-icons/unknow.png';
    }
    div.dataset.imgRef = imgRef;
    img.alt = 'file icon';
    const h4 = document.createElement('h4');
    const span = document.createElement('span');
    span.innerText = file.displayname.split('.')[0];
    h4.appendChild(span);
    h4.innerText += `.${file.displayname.split('.').pop()}`;
    subDiv.appendChild(img);
    subDiv.appendChild(h4);
    div.appendChild(subDiv);
    const sizeH4 = document.createElement('h4');
    sizeH4.innerText = (file.filesize / 1024 / 1024).toFixed(2) + ' Mo';
    div.appendChild(sizeH4);
    const dateH4 = document.createElement('h4');
    dateH4.innerText = file.date.split('T')[0];
    div.appendChild(dateH4);
    return div;
}

const folderSelection = document.getElementById('folder-selection');

folderSelection.addEventListener('change', e => {
    loadFolder(e.currentTarget.value);
});

fetch('/cdn/folder/list', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    },
})
    .then(res => res.json())
    .then(data => {
        data.forEach(addFolder);
        loadFolder(localStorage.getItem('currentFolder'));
    });

function addFolder(folder) {
    folderSelection.appendChild(createOption(folder));
}

function createOption(folder) {
    const option = document.createElement('option');
    option.value = folder._id;
    option.innerText = folder.name;
    return option;
}

document.getElementById('search-bar').addEventListener('input', e => {
    const search = e.currentTarget.value.toLowerCase();
    const allFiles = document.querySelectorAll('.file-item');
    allFiles.forEach(file => {
        const fileName = file.dataset.name.toLowerCase();
        if (fileName.includes(search)) {
            file.style.display = 'flex';
        } else {
            file.style.display = 'none';
        }
    });
});
