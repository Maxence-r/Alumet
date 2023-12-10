socket.on('connect', () => {
    //
});

socket.on('message', (messageObject, user) => {
    const messageElement = createMessageElement(messageObject, user);
    messageElement.classList.add('new-message');
    document.querySelector('.conversation-body').prepend(messageElement);
});
