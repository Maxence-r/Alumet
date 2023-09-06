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
    if (type === 'private') {
        setPictureOnError(iconElement, 'user');
    } else if (type === 'group') {
        setPictureOnError(iconElement, 'group');
    }
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

const createConversation = async () => {
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
        document.querySelector('.creating-conversation').classList.remove('creating-conversation');
        document.querySelectorAll('[data-id]').forEach(element => {
            element.remove();
        });
        participants = [];
        return data._id;
    } catch (error) {
        console.error(error);
    }
};

function initConversation() {
    const messagesContainer = document.querySelector('.messages');
    const subContainer = messagesContainer.querySelector('.sub-container');
    subContainer.classList.add('creating-conversation');
}

/* Start search manager */

let participants = [];
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};

const clearParticipants = container => {
    document.querySelectorAll(`#${container}-participants > div`).forEach(element => {
        element.remove();
    });
};

const searchUsers = async (query, container, type) => {
    if (query.length < 2) return document.getElementById(`${container}-participants`).classList.remove('active-searching');
    document.getElementById(`${container}-participants`).classList.add('active-searching');
    try {
        const response = await fetch(`/swiftChat/search?q=${query}&type=${type}`);
        const json = await response.json();
        clearParticipants(container);
        json.forEach(user => {
            const userElement = document.createElement('div');
            userElement.classList.add('participant');
            userElement.dataset.id = user._id;
            const iconElement = document.createElement('img');
            iconElement.src = `/cdn/u/${user.icon}`;
            iconElement.alt = 'user icon';
            setPictureOnError(iconElement, 'user');
            userElement.appendChild(iconElement);

            const columnInfosElement = document.createElement('div');
            columnInfosElement.classList.add('column-infos');
            userElement.appendChild(columnInfosElement);

            const nameElement = document.createElement('h4');
            nameElement.textContent = `${user.name} ${user.lastname}`;
            columnInfosElement.appendChild(nameElement);

            const accountTypeElement = document.createElement('span');
            accountTypeElement.textContent = user.accountType;
            columnInfosElement.appendChild(accountTypeElement);

            document.getElementById(`${container}-participants`).appendChild(userElement);
        });
    } catch (err) {
        console.error(err);
    }
};

const addParticipant = (user, reference) => {
    userElement = document.querySelector("[data-id='" + user + "']");
    if (participants.includes(user)) {
        return toast({
            title: 'Erreur',
            message: 'Vous avez déjà ajouté cet utilisateur',
            type: 'error',
            duration: 2500,
        });
    }
    participants.push(user);
    document.getElementById(`${reference}-confirmed-participants`).appendChild(userElement);
    document.getElementById(`${reference}-participants`).classList.remove('active-searching');
    document.getElementById(`${reference}`).value = '';
};

const removeParticipant = (user, reference) => {
    const userIndex = participants.indexOf(user);
    if (userIndex === -1) {
        return;
    }
    participants.splice(userIndex, 1);
    document.querySelector(`[data-id='${user}']`).remove();
};

document.querySelectorAll('.user-search-input').forEach(element => {
    const reference = element.id;
    let researchType = element.getAttribute('data-type');
    element.addEventListener(
        'input',
        debounce(() => searchUsers(element.value, element.id, researchType), 500)
    );
    document.getElementById(`${reference}-participants`).addEventListener('click', e => {
        let clickedElement = e.target;
        while (clickedElement !== document.getElementById(`${reference}-participants`)) {
            if (clickedElement.classList.contains('participant')) {
                addParticipant(clickedElement.dataset.id, reference);
                return;
            }
            clickedElement = clickedElement.parentNode;
        }
    });
    document.getElementById(`${reference}-confirmed-participants`).addEventListener('click', e => {
        let clickedElement = e.target;
        while (clickedElement !== document.getElementById(`${reference}-confirmed-participants`)) {
            if (clickedElement.classList.contains('participant')) {
                removeParticipant(clickedElement.dataset.id, reference);
                return;
            }
            clickedElement = clickedElement.parentNode;
        }
    });
});

/* End search manager */

document.getElementById('create-conversation').addEventListener('click', () => {
    if (participants.length >= 2) {
        return createPrompt({
            head: 'Nom de la converstion',
            desc: 'Veuillez donner un nom a cette conversation de groupe',
            placeholder: 'Nom de la conversation',
            action: 'createConversation()',
        });
    }
    createConversation();
});

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

document.getElementById('message').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
const sendMessageButton = document.getElementById('send-text');
if (sendMessageButton) {
    sendMessageButton.addEventListener('click', () => {
        sendMessage();
    });
}

function sendMessage() {
    const message = document.getElementById('message').value;
    const conversationId = localStorage.getItem('currentConversation');
    if (document.getElementById('message').value === '') return;
    document.getElementById('message').value = '';
    fetch('/swiftChat/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, conversationId }),
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
            socket.emit('message', conversationId, json.message._id, JSON.parse(localStorage.getItem('user')).id);
        })
        .catch(error => console.error(error));
}

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

const socket = io();

socket.on('connect', () => {
    console.log('Vous êtes connecté au serveur Alumet');
});

socket.on('message', messageObject => {
    const { message, user } = messageObject;
    const messageElement = createMessageElement(message, user);
    messageElement.classList.add('new-message');
    document.querySelector('.conversation-body').prepend(messageElement);
});

function openConversation(id) {
    if (localStorage.getItem('currentConversation')) {
        socket.emit('leaveRoom', localStorage.getItem('currentConversation'), JSON.parse(localStorage.getItem('user')).id);
    }
    socket.emit('joinRoom', id, JSON.parse(localStorage.getItem('user')).id);

    if (document.querySelector('.active-context')) {
        document.querySelector('.active-context').classList.remove('active-context');
    }
    if (document.querySelector('.showing-group-settings')) {
        document.querySelector('.showing-group-settings').classList.remove('showing-group-settings');
    }
    document.querySelector('.messages > .main-container').classList.add('active-loading');
    document.querySelector('.messages > .main-container').classList.remove('no-conversation');
    localStorage.setItem('currentConversation', id);
    document.querySelector('.messages').classList.add('active-messages');
    previousSender = null;
    document.querySelector('.conversation-body').innerHTML = '';
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
    setPictureOnError(document.querySelector('.conversation-user-infos > img'), 'user');

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
            if (json.conversationType != 'private') {
                createConversationParametersElement(conversationName, conversationIcon, participants, json.role);
            } else {
                console.log('Parameters for conversation of 2 persons are not configure yet');
            }
            setTimeout(() => {
                document.querySelector('.messages > .main-container').classList.remove('active-loading');
            }, 300);
        })
        .catch(error => console.error(error));
}

async function promoteOwnerPrompt() {
    createPrompt({
        head: 'Promouvoir cet utilisateur propriétaire',
        desc: 'Vous ne serez plus propriétaire de ce groupe après avoir promu cet utilisateur. Voulez-vous continuer ?',
        action: 'promoteOwner()',
    });
}
function promoteOwner() {
    let participantId = localStorage.getItem('popupParticipantId');
    let conversationId = localStorage.getItem('currentConversation');
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
            document.querySelector(`.participants-list > [data-participant-id="${JSON.parse(localStorage.getItem('user')).id}"] > .infos > .sub-infos > p`).textContent = 'Membre';
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
    let conversationId = localStorage.getItem('currentConversation');
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
    let conversationId = localStorage.getItem('currentConversation');
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
    let conversationId = localStorage.getItem('currentConversation');
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
    setPictureOnError(parameterGroupIcon, 'group');
    parameterGroupIcon.dataset.conversationIdGroupIcon = localStorage.getItem('currentConversation');
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
        setPictureOnError(iconElement, 'user');
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
let previousSender = null;
function createMessageElement(message, user) {
    const { sender, content, createdAt } = message;
    const messageElement = document.createElement('div');
    messageElement.dataset.messageid = message._id;
    if (previousSender !== sender) {
        messageElement.classList.add('first');
    }
    if (sender === JSON.parse(localStorage.getItem('user')).id) {
        messageElement.classList.add('right-message', 'message');
    } else {
        messageElement.classList.add('left-message', 'message');
    }

    const imageElement = document.createElement('img');
    imageElement.src = `/cdn/u/` + user.icon;
    imageElement.alt = 'file icon';
    setPictureOnError(imageElement, 'user');

    const messageDetailsElement = document.createElement('div');
    messageDetailsElement.classList.add('message-details');

    const userNameElement = document.createElement('p');
    userNameElement.classList.add('user-name');
    userNameElement.textContent = user.name + ' ' + user.lastname;

    if (user.isCertified) {
        const certifiedElement = document.createElement('img');
        certifiedElement.src = `../assets/badges/certified/${user.accountType}-certified.svg`;
        certifiedElement.alt = 'certified icon';
        userNameElement.appendChild(certifiedElement);
    }

    const createAt = document.createElement('span');
    createAt.id = 'message-date';
    createAt.textContent = relativeTime(createdAt);
    userNameElement.appendChild(createAt);

    const messageContentElement = document.createElement('p');
    messageContentElement.classList.add('message-content');
    messageContentElement.textContent = content;

    messageDetailsElement.appendChild(userNameElement);
    messageDetailsElement.appendChild(messageContentElement);
    messageElement.appendChild(imageElement);
    messageElement.appendChild(messageDetailsElement);

    previousSender = sender;
    return messageElement;
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

function deleteMessage(id) {
    fetch(`/swiftChat/delete/${id}`, {
        method: 'DELETE',
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
            document.querySelector(`[data-messageid="${id}"]`).remove();
        })
        .catch(error => console.error(error));
}

getConversations();

document.querySelector('.options > img').addEventListener('click', e => {
    document.querySelector('.messages > .main-container').classList.add('showing-group-settings');
});

document.querySelector('#group-profile-picture').addEventListener('click', () => {
    document.querySelector('#group-profile-picture-input').click();
});

function updateGroupIcon(iconId) {
    const conversationId = localStorage.getItem('currentConversation');
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

        const updateResponse = await fetch(`/swiftChat/${localStorage.getItem('currentConversation')}/updateicon`, {
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
    const conversationId = localStorage.getItem('currentConversation');
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
