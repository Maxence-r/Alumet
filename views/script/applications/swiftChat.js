let currentConversation = null;

const sendMessageButton = document.querySelector('.send-text');
if (sendMessageButton) {
    sendMessageButton.addEventListener('click', () => {
        sendMessage();
    });
}

function sendMessage() {
    let textarea = document.getElementById('message');
    const message = textarea.value;
    if (textarea.value === '') return;
    textarea.value = '';
    textarea.style.height = '60px';
    fetch('/swiftChat/send/' + currentConversation, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
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
        })
        .catch(error => console.error(error));
}

function createMessageElement(message, userSender) {
    const { sender, content, createdAt } = message;
    const messageElement = document.createElement('div');
    messageElement.dataset.messageid = message._id;
    if (previousSender !== sender) {
        messageElement.classList.add('first');
    }
    if (sender === user?._id) {
        messageElement.classList.add('right-message', 'message');
    } else {
        messageElement.classList.add('left-message', 'message');
    }

    const imageElement = document.createElement('img');
    imageElement.src = `/cdn/u/` + userSender.icon;
    imageElement.alt = 'file icon';

    const messageDetailsElement = document.createElement('div');
    messageDetailsElement.classList.add('message-details');

    const userNameElement = document.createElement('p');
    userNameElement.classList.add('user-name');
    userNameElement.textContent = userSender.name + ' ' + userSender.lastname;

    if (userSender.isCertified) {
        const certifiedElement = document.createElement('img');
        certifiedElement.src = `../assets/badges/certified/${userSender.accountType}-certified.svg`;
        certifiedElement.alt = 'certified icon';
        userNameElement.appendChild(certifiedElement);
    }
    if (userSender.badges) {
        userSender.badges.forEach(badge => {
            const badgeImg = document.createElement('img');
            badgeImg.src = `/assets/badges/specials/${badge}.svg`;
            badgeImg.title = badge;
            badgeImg.classList.add('badge');
            userNameElement.appendChild(badgeImg);
        });
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

function joinSocketRoom(id, userId) {
    socket.emit('joinChatRoom', id, userId);
}


