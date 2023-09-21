socket.on('connect', () => {
    console.log('Vous êtes connecté au serveur Alumet');
    if (retried) {
        socket.emit('joinChatRoom', currentConversation, user._id);
    }
});

socket.on('message', (messageObject, user) => {
    const messageElement = createMessageElement(messageObject, user);
    messageElement.classList.add('new-message');
    document.querySelector('.conversation-body').prepend(messageElement);
});
