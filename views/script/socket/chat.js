socket.on('connect', () => {
    console.log('Vous êtes connecté au serveur Alumet');
    if (retried) {
        socket.emit('joinChatRoom', currentConversation, JSON.parse(localStorage.getItem('user')).id);
    }
});

socket.on('message', messageObject => {
    const { message, user } = messageObject;
    const messageElement = createMessageElement(message, user);
    messageElement.classList.add('new-message');
    document.querySelector('.conversation-body').prepend(messageElement);
});
