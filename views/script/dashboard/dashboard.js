const navButtons = document.querySelectorAll('.nav > button');
const sections = document.querySelectorAll('.sections-container > section');
let identity = null;
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

fetch('/dashboard/identity')
    .then(response => response.json())
    .then(data => {
        identity = data;
        createNotifications(data.invitations);
        socket.emit('joinDashboard', data.user._id);
        updateInfos(data.user);
        data.alumets.forEach(alumet => {
            document.querySelector(`.${alumet.type}s`).append(createAppBox(alumet.title, alumet.lastUsage, alumet.background, alumet._id, alumet.subject));
        });
        endLoading();
    });

document.addEventListener('keydown', function (event) {
    if (event.key === 'Tab') {
        event.preventDefault();
    }
});


function createAppBox(title, lastUsage, background, id, subject) {
    const appBox = document.createElement('div');
    appBox.classList.add('app-box');

    const img = document.createElement('img');
    img.src = '/cdn/u/' + background;
    appBox.appendChild(img);

    const layerBlurInfo = document.createElement('div');
    layerBlurInfo.classList.add('layer-blur-info');
    appBox.appendChild(layerBlurInfo);

    const h4 = document.createElement('h4');
    h4.textContent = title;
    layerBlurInfo.appendChild(h4);

    const p = document.createElement('p');
    p.textContent = `Utilisé ${relativeTime(lastUsage)} - ${subject}`;
    layerBlurInfo.appendChild(p);

    appBox.setAttribute('onclick', `openItem('${id}')`);

    return appBox;
}

openItem = itemId => {
    window.location.href = `/app/${itemId}`;
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
    return toast({
        title: 'Restreint',
        message: 'Cette fonctionnalité a été restreinte sur ce compte. Ressayer plus tard. Vous avez toujours accès aux messages officiels.',
        type: 'warning',
        duration: 10000,
    })
}



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



function startSetup() {
    let type = document.querySelector('.module-selected').dataset.module.slice(0, -1);
    window.location.href = `/app/setup/${type}`;
}
document.addEventListener('DOMContentLoaded', function () {
    var subContainer = document.querySelector('.right-container');
    var startY;

    subContainer.addEventListener('touchstart', function (e) {
        startY = e.touches[0].clientY;
    }, false);

    subContainer.addEventListener('touchend', function (e) {
        var endY = e.changedTouches[0].clientY;

        // Check if it was a swipe down
        if (endY - startY > 100) { // 100 is the minimum swipe length
            subContainer.classList.remove('active-sub-container');
        }
    }, false);
});
