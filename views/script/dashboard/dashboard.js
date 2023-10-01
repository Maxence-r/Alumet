const navButtons = document.querySelectorAll('.nav > button');
const sections = document.querySelectorAll('.sections-container > section');

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        navButtons.forEach(button => button.classList.remove('active'));
        button.classList.add('active');
        sections.forEach(section => section.classList.remove('active-section'));
        document.querySelector(`.${button.id}`).classList.add('active-section');
    });
});

document.getElementById('prompt-confirm').addEventListener('click', () => {
    document.querySelector('.prompt-popup').classList.remove('active-popup');
});

const params = new URL(window.location).searchParams;
let redirect = params.get('redirect');
if (redirect) {
    const element = document.getElementById(`${redirect}`);
    if (element) {
        element.click();
    }
}

fetch('/dashboard/items')
    .then(response => response.json())
    .then(data => {
        if (data.alumets.length !== 0) document.querySelector('.alumets').innerHTML = '';
        data.alumets.forEach(alumet => {
            const alumetBox = createAlumetBox(alumet.title, alumet.lastUsage, alumet.background, alumet._id);
            document.querySelector('.alumets').appendChild(alumetBox);
        });
        if (data.flashcardSets.length !== 0) document.querySelector('.flashcards').innerHTML = '';
        data.flashcardSets.forEach(flashcardSet => {
            const flashcardsBox = createFlashcardsBox(flashcardSet.subject, flashcardSet.likes.length, flashcardSet.title, flashcardSet.description, flashcardSet._id);
            document.querySelector('.flashcards').appendChild(flashcardsBox);
        });
    });

function createAlumetBox(title, lastUsage, background, id) {
    const alumetBox = document.createElement('div');
    alumetBox.classList.add('alumet-box');

    const img = document.createElement('img');
    img.src = '/cdn/u/' + background;
    alumetBox.appendChild(img);

    const layerBlurInfo = document.createElement('div');
    layerBlurInfo.classList.add('layer-blur-info');
    alumetBox.appendChild(layerBlurInfo);

    const h4 = document.createElement('h4');
    h4.textContent = title;
    layerBlurInfo.appendChild(h4);

    const p = document.createElement('p');
    p.textContent = `Utilisé ${relativeTime(lastUsage)}`;
    layerBlurInfo.appendChild(p);

    alumetBox.setAttribute('onclick', `openAlumet('${id}')`);

    return alumetBox;
}

function createFlashcardsBox(subject, likes, title, description, id) {
    const flashcardsBox = document.createElement('div');
    flashcardsBox.classList.add('flashcards-box');

    const innerDiv = document.createElement('div');

    const subjectDiv = document.createElement('div');
    subjectDiv.classList.add('subject');
    subjectDiv.textContent = subject;

    const likesDiv = document.createElement('div');
    const likesP = document.createElement('p');
    likesP.textContent = likes;
    const likesImg = document.createElement('img');
    likesImg.src = '../../assets/global/like.svg';
    likesDiv.appendChild(likesP);
    likesDiv.appendChild(likesImg);

    innerDiv.appendChild(subjectDiv);
    innerDiv.appendChild(likesDiv);

    const titleH1 = document.createElement('h1');
    titleH1.textContent = title;

    const descriptionP = document.createElement('p');
    descriptionP.textContent = description || 'Pas de description';

    flashcardsBox.appendChild(innerDiv);
    flashcardsBox.appendChild(titleH1);
    flashcardsBox.appendChild(descriptionP);
    flashcardsBox.setAttribute('onclick', `openFlashcards('${id}')`);
    return flashcardsBox;
}

openAlumet = alumetId => {
    window.open(`/portal/${alumetId}`, '_blank');
};

openFlashcards = flashcardsId => {
    window.open(`/flashcards/${flashcardsId}`, '_blank');
};

function joinAlumet() {
    createPrompt({
        head: 'Rejoindre un alumet',
        desc: "Si l'alumet est privé, vous devez entrez un code d'invitation ici.",
        placeholder: 'Entrer le code ici',
        action: 'authorizeAlumet()',
    });
}

function authorizeAlumet() {
    fetch('/portal/authorize/join', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            code: document.getElementById('prompt-input').value,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                return toast({
                    title: 'Erreur',
                    message: data.error,
                    type: 'error',
                    duration: 2500,
                });
            }
            toast({
                title: 'Succès',
                message: "Vous avez rejoint l'alumet !",
                type: 'success',
                duration: 2500,
            });
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        })
        .catch(err => console.log(err));
}

const conversationsContainer = document.querySelector('.conversations-container');

const createConversationElement = conversation => {
    const { lastUsage, isReaded, lastMessage, _id, type, conversationName, conversationIcon, participants } = conversation;
    const { name, lastname, icon, isCertified, accountType } = conversation.userinfos;
    const time = relativeTime(lastUsage);
    const conversationElement = document.createElement('div');
    conversationElement.classList.add('conversation');

    conversationElement.dataset.conversationid = _id;
    conversationElement.dataset.lastusage = lastUsage;
    conversationElement.dataset.icon = conversationIcon || icon;
    conversationElement.dataset.conversationType = type;
    if (conversationName) {
        conversationElement.dataset.name = conversationName;
    } else {
        conversationElement.dataset.name = `${name} ${lastname}`;
    }

    const iconElement = document.createElement('img');
    iconElement.src = `/cdn/u/${conversationIcon || icon}`;
    iconElement.alt = 'file icon';

    conversationElement.appendChild(iconElement);

    if (isCertified && participants.length === 1) {
        const certifiedElement = document.createElement('img');
        conversationElement.classList.add('certified');
        certifiedElement.src = `../assets/global/${accountType}-certified.svg`;
        certifiedElement.alt = 'certified icon';
        conversationElement.appendChild(certifiedElement);
    }

    const infosElement = document.createElement('div');
    infosElement.classList.add('conversation-infos');
    conversationElement.appendChild(infosElement);

    const nameElement = document.createElement('h4');
    const nameString = (conversationName || name + ' ' + lastname).slice(0, 20);
    nameElement.textContent = `${nameString}${nameString.length < (conversationName || name + ' ' + lastname).length ? '...' : ''}`;
    const timeElement = document.createElement('span');
    timeElement.textContent = time;
    nameElement.appendChild(timeElement);
    infosElement.appendChild(nameElement);

    const messageElement = document.createElement('p');
    if (lastMessage && lastMessage.sender && lastMessage.content) {
        const lastMessageText = lastMessage && lastMessage.content ? (lastMessage.content.length > 25 ? lastMessage.content.slice(0, 25) + '...' : lastMessage.content) : 'Pas de message';
        messageElement.textContent = lastMessage.sender + ': ' + lastMessageText;
    } else {
        messageElement.textContent = 'Pas de message';
    }
    infosElement.appendChild(messageElement);

    const pingElement = document.createElement('div');
    pingElement.classList.add('ping-conv');
    infosElement.appendChild(pingElement);

    if (!isReaded) {
        conversationElement.classList.add('not-readed');
    }
    conversationElement.setAttribute('onclick', `openConversation('${_id}')`);
    return conversationElement;
};

function initConversation() {
    document.querySelector('.user-popup').classList.add('active-popup');
}

const getConversations = () => {
    fetch('/swiftChat')
        .then(response => response.json())
        .then(json => {
            const hasUnreadConversations = Array.isArray(json) && json.some(conversation => conversation.isReaded === false);
            if (hasUnreadConversations) {
                document.getElementById('messages').classList.add('pinged');
            }
            json.forEach(conversation => {
                const conversationElement = createConversationElement(conversation);
                conversationsContainer.appendChild(conversationElement);
            });
        })
        .catch(error => console.error(error));
};

async function createConversation() {
    if (participants.length === 0) return toast({ title: 'Erreur', message: 'Vous devez sélectionner au moins un utilisateur', type: 'error', duration: 2500 });
    const conversationName = document.querySelector('#prompt-input').value;
    try {
        const response = await fetch('/swiftChat/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                participants: participants,
                name: conversationName ? conversationName : undefined,
            }),
        });

        const data = await response.json();
        if (data.error)
            return toast({
                title: 'Erreur',
                message: `${data.error}`,
                type: 'error',
                duration: 2500,
            });

        const conversationElement = createConversationElement(data);
        conversationsContainer.prepend(conversationElement);

        participants = [];
        document.querySelectorAll('.users-fetch > .user').forEach(element => {
            element.remove();
        });
        document.getElementById('user-prompt').value = '';
        document.querySelector('.user-popup').classList.remove('active-popup');
    } catch (error) {
        console.error(error);
    }
}

/* End search manager */

function closeConversation() {
    document.querySelector('.messages > .main-container').classList.remove('showing-group-settings');
    document.querySelector('.messages').classList.remove('active-messages');
}
document.getElementById('close-conversation-button').addEventListener('click', () => {
    closeConversation();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        closeConversation();
    }
});

async function promoteOwnerPrompt() {
    createPrompt({
        head: 'Promouvoir cet utilisateur propriétaire',
        desc: 'Vous ne serez plus propriétaire de ce groupe après avoir promu cet utilisateur. Voulez-vous continuer ?',
        action: 'promoteOwner()',
    });
}
function promoteOwner() {
    let participantId = localStorage.getItem('popupParticipantId');
    let conversationId = currentConversation;
    fetch(`/swiftChat/${conversationId}/promoteOwner/${participantId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId, participantId }),
    })
        .then(response => response.json())
        .then(json => {
            if (json.error)
                return toast({
                    title: 'Erreur',
                    message: `${json.error}`,
                    type: 'error',
                    duration: 2500,
                });
            modifyUserRole('Propriétaire');
            document.querySelector(`.participants-list > [data-participant-id="${user._id}"] > .infos > .sub-infos > p`).textContent = 'Membre';
            document.querySelector('.context-menu').classList.remove('active-context');
            return toast({
                title: 'Succès',
                message: `${json.message}`,
                type: 'success',
                duration: 2500,
            });
        })
        .catch(error => console.error(error));
}

function promoteAdmin() {
    let participantId = localStorage.getItem('popupParticipantId');
    let conversationId = currentConversation;
    fetch(`/swiftChat/${conversationId}/promoteAdmin/${participantId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId, participantId }),
    })
        .then(response => response.json())
        .then(json => {
            if (json.error)
                return toast({
                    title: 'Erreur',
                    message: `${json.error}`,
                    type: 'error',
                    duration: 2500,
                });
            modifyUserRole('Administrateur');
            document.querySelector('.context-menu').classList.remove('active-context');
            return toast({
                title: 'Succès',
                message: `${json.message}`,
                type: 'success',
                duration: 2500,
            });
        })
        .catch(error => console.error(error));
}

function demoteAdmin() {
    let participantId = localStorage.getItem('popupParticipantId');
    let conversationId = currentConversation;
    fetch(`/swiftChat/${conversationId}/demoteAdmin/${participantId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId, participantId }),
    })
        .then(response => response.json())
        .then(json => {
            if (json.error)
                return toast({
                    title: 'Erreur',
                    message: `${json.error}`,
                    type: 'error',
                    duration: 2500,
                });
            document.querySelector('.context-menu').classList.remove('active-context');
            modifyUserRole('Membre');
            return toast({
                title: 'Succès',
                message: `${json.message}`,
                type: 'success',
                duration: 2500,
            });
        })
        .catch(error => console.error(error));
}

function removeUser() {
    let participantId = localStorage.getItem('popupParticipantId');
    let conversationId = currentConversation;
    fetch(`/swiftChat/${conversationId}/removeUser/${participantId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId, participantId }),
    })
        .then(response => response.json())
        .then(json => {
            if (json.error)
                return toast({
                    title: 'Erreur',
                    message: `${json.error}`,
                    type: 'error',
                    duration: 2500,
                });
            document.querySelector(`.participants-list > [data-participant-id="${localStorage.getItem('popupParticipantId')}"]`).remove();
            document.querySelector('.context-menu').classList.remove('active-context');
            return toast({
                title: 'Succès',
                message: `${json.message}`,
                type: 'success',
                duration: 2500,
            });
        })
        .catch(error => console.error(error));
}
function modifyUserRole(role) {
    const userId = localStorage.getItem('popupParticipantId');
    document.querySelector(`.participants-list > [data-participant-id="${userId}"] > .infos > .sub-infos > p`).textContent = role;
}

function createConversationParametersElement(conversationName, conversationIcon, participants, myRole) {
    const parameterGroupIcon = document.querySelector('.group-infos > div > #group-profile-picture');
    const parameterGroupName = document.querySelector('#parameter-group-name');
    const parameterParticipantsContainer = document.querySelector('.group-participants-container > .participants-list');
    document.querySelector('.context-menu').classList.remove('owner', 'administrator', 'member');
    document.querySelector('.context-menu').classList.add(`${myRole}`);
    parameterGroupIcon.src = `/cdn/u/${conversationIcon}`;
    parameterGroupIcon.alt = 'group icon';

    parameterGroupIcon.dataset.conversationIdGroupIcon = currentConversation;
    parameterGroupName.value = conversationName;
    parameterParticipantsContainer.innerHTML = '';
    participants.forEach(participant => {
        const participantElement = document.createElement('div');
        participantElement.classList.add('participant');
        participantElement.dataset.participantId = participant.id;

        const infosElement = document.createElement('div');
        infosElement.classList.add('infos');
        participantElement.appendChild(infosElement);

        const iconElement = document.createElement('img');
        iconElement.src = `/cdn/u/${participant.icon}`;
        iconElement.alt = 'user icon';

        infosElement.appendChild(iconElement);

        const subInfosElement = document.createElement('div');
        subInfosElement.classList.add('sub-infos');
        infosElement.appendChild(subInfosElement);

        const nameElement = document.createElement('h4');
        nameElement.textContent = `${participant.name} ${participant.lastname}`;
        subInfosElement.appendChild(nameElement);

        const roleElement = document.createElement('p');
        roleElement.textContent = participant.role;
        subInfosElement.appendChild(roleElement);

        const participantOptionsContainerElement = document.createElement('div');
        participantOptionsContainerElement.classList.add('participant-options-container');
        participantOptionsContainerElement.dataset.participantOptionsContainerId = participant.id;
        participantElement.appendChild(participantOptionsContainerElement);

        const participantOptionsElement = document.createElement('img');
        participantOptionsElement.src = '../../assets/global/dots.svg';
        participantOptionsElement.alt = 'options icon';
        participantOptionsElement.setAttribute('onclick', `openParametersPopup('${participant.id}')`);
        participantOptionsContainerElement.appendChild(participantOptionsElement);

        parameterParticipantsContainer.appendChild(participantElement);
    });
}

function openParametersPopup(userId) {
    localStorage.setItem('popupParticipantId', userId);
    if (document.querySelector('.context-menu').classList.contains('active-context')) {
        document.querySelector('.context-menu').classList.remove('active-context');
        setTimeout(() => {
            document.querySelector('.context-menu').classList.add('active-context');
        }, 300);
        return;
    }
    document.querySelector('.context-menu').classList.add('active-context');
}

document.getElementById('search-conv').addEventListener('input', e => {
    const search = e.currentTarget.value.toLowerCase();
    const allConversations = document.querySelectorAll('.conversation');
    allConversations.forEach(conversation => {
        const conversationName = conversation.dataset.name.toLowerCase();
        if (conversationName.includes(search)) {
            conversation.style.display = 'flex';
        } else {
            conversation.style.display = 'none';
        }
    });
});

getConversations();

document.querySelector('.options > img').addEventListener('click', e => {
    document.querySelector('.messages > .main-container').classList.add('showing-group-settings');
});

document.querySelector('#group-profile-picture').addEventListener('click', () => {
    document.querySelector('#group-profile-picture-input').click();
});

function updateGroupIcon(iconId) {
    const conversationId = currentConversation;
    document.querySelector('.conversation-user-infos > img').src = `/cdn/u/${iconId}`;
    document.querySelector(`[data-conversation-id-group-icon="${conversationId}"]`).src = `/cdn/u/${iconId}`;
    document.querySelector(`[data-conversationid="${conversationId}"] img`).src = `/cdn/u/${iconId}`;
    document.querySelector(`[data-conversationid="${conversationId}"]`).dataset.icon = iconId;
}

document.getElementById('group-profile-picture-input').addEventListener('change', async () => {
    const file = document.getElementById('group-profile-picture-input').files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
        let fileName = file.name;
        let fileSize = file.size;
        let idxDot = fileName.lastIndexOf('.') + 1;
        let extFile = fileName.substr(idxDot, fileName.length).toLowerCase();
        if (extFile !== 'jpg' && extFile !== 'jpeg' && extFile !== 'png') {
            return toast({ title: 'Erreur !', message: 'Seuls les fichiers jpg, jpeg et png sont autorisés !', type: 'error', duration: 2500 });
        }
        if (fileSize > 1 * 1024 * 1024) {
            return toast({ title: 'Erreur !', message: "La taille de l'image ne doit pas dépasser 1 Mo !", type: 'error', duration: 2500 });
        }

        const updateResponse = await fetch(`/swiftChat/${currentConversation}/updateicon`, {
            method: 'PUT',
            body: formData,
        });
        const updateData = await updateResponse.json();
        if (!updateData.error) {
            toast({ title: 'Image de groupe modifiée !', message: "L'icone du groupe a bien été modifiée", type: 'success', duration: 2500 });
            updateGroupIcon(updateData.icon);
        } else {
            return toast({ title: 'Erreur !', message: updateData.error, type: 'error', duration: 2500 });
        }
    } catch (error) {
        console.error(error);
        toast({ title: 'Erreur !', message: 'Une erreur est survenue.', type: 'error', duration: 2500 });
    }
});

document.getElementById('leave-group-btn').addEventListener('click', async () => {
    const conversationId = currentConversation;
    fetch(`/swiftChat/${conversationId}/leave`, {
        method: 'POST',
    })
        .then(response => response.json())
        .then(json => {
            if (json.error) {
                return toast({ title: 'Erreur !', message: json.error, type: 'error', duration: 2500 });
            }
            document.querySelector(`[data-conversationid="${conversationId}"]`).remove();
            closeConversation();
            toast({ title: 'Groupe quitté !', message: 'Vous avez quitté le groupe avec succès.', type: 'success', duration: 2500 });
        })
        .catch(error => console.error(error));
});

function openConversation(id) {
    if (currentConversation) {
        socket.emit('leaveChatRoom', currentConversation, user._id);
    }
    joinSocketRoom(id, user._id);

    if (document.querySelector('.active-context')) {
        document.querySelector('.active-context').classList.remove('active-context');
    }
    if (document.querySelector('.showing-group-settings')) {
        document.querySelector('.showing-group-settings').classList.remove('showing-group-settings');
    }
    document.querySelector('.messages > .main-container').classList.add('active-loading');
    document.querySelector('.messages > .main-container').classList.remove('no-conversation');
    currentConversation = id;
    document.querySelector('.messages').classList.add('active-messages');
    previousSender = null;
    document.querySelectorAll('.message').forEach(element => {
        element.remove();
    });
    if (document.querySelector('[data-conversationid="' + id + '"]').classList.contains('not-readed')) {
        document.querySelector('[data-conversationid="' + id + '"]').classList.remove('not-readed');
    }

    let lastUsage = document.querySelector('[data-conversationid="' + id + '"]').dataset.lastusage;
    let name = document.querySelector('[data-conversationid="' + id + '"]').dataset.name;
    let icon = document.querySelector('[data-conversationid="' + id + '"]').dataset.icon;
    document.querySelector('#conversation-username').textContent = name;
    document.getElementById('conversation-lastTime').textContent = relativeTime(lastUsage);
    document.querySelector('.conversation-user-infos > img').src = `/cdn/u/${icon}`;
    document.querySelector('.conversation-user-infos > img').alt = 'user icon';

    fetch(`/swiftChat/${id}`)
        .then(response => response.json())
        .then(json => {
            if (!json) return;
            Promise.all(json.messages.map(message => createMessageElement(message.message, message.user))).then(messageElements => {
                const conversationBody = document.querySelector('.conversation-body');
                messageElements.forEach(messageElement => {
                    conversationBody.prepend(messageElement);
                });
            });

            const participants = json.participants;
            const conversationName = json.conversationName;
            const conversationIcon = json.conversationIcon;
            document.querySelector('.conversation-settings').classList.remove('private', 'group', 'alumet');
            document.querySelector('.conversation-settings').classList.add(`${json.conversationType}`);
            if (json.conversationType != 'private') {
                createConversationParametersElement(conversationName, conversationIcon, participants, json.role);
            }
            setTimeout(() => {
                document.querySelector('.messages > .main-container').classList.remove('active-loading');
            }, 300);
        })
        .catch(error => console.error(error));
}

const userPrompt = document.querySelector('#user-prompt');
const debounceDelay = 500;
let debounceTimeoutId;

userPrompt.addEventListener('input', e => {
    clearTimeout(debounceTimeoutId);
    debounceTimeoutId = setTimeout(() => {
        const query = e.target.value;
        const type = 'user';
        searchUsers(query, type);
    }, debounceDelay);
});
