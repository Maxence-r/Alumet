let currentConversation = null;
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
    const conversationId = currentConversation;
    if (document.getElementById('message').value === '') return;
    document.getElementById('message').value = '';
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
            socket.emit('message', currentConversation, json.message._id, JSON.parse(localStorage.getItem('user')).id);
        })
        .catch(error => console.error(error));
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
