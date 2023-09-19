socket.on('connect', () => {
    document.querySelector('.stream-info').style.display = 'none';
    console.log(`Vous êtes connecté en temps réel`);
    if (retried) {
        socket.emit('joinAlumet', alumet._id, alumet.user_infos?.id);
    }
});

socket.on('disconnect', () => {
    document.querySelector('.stream-info').style.display = 'flex';
    console.log(`Vous êtes déconnecté en temps réel`);
    socket.emit('leaveAlumet', alumet._id);
    retried = true;
});

socket.on('addPost', data => {
    const list = document.getElementById(data.wallId);
    const newPost = createTaskList(data);
    list.prepend(newPost);
    getPostData(data._id, data);
});

socket.on('deletePost', data => {
    const post = document.querySelector(`.card[data-id="${data._id}"]`);
    if (!post) {
        return;
    }
    post.parentNode.removeChild(post);
});

socket.on('movePost', (listId, blockId, position) => {
    let block = document.querySelector(`.card[data-id="${blockId}"]`);
    if (!block) {
        return;
    }
    let list = document.getElementById(listId);
    let cardAfterDraggingCard = list.querySelectorAll('.card')[position];
    if (cardAfterDraggingCard) {
        cardAfterDraggingCard.parentNode.insertBefore(block, cardAfterDraggingCard);
    } else {
        list.appendChild(block);
    }
});

socket.on('editPost', data => {
    const newPost = createTaskList(data);
    const post = document.querySelector(`.card[data-id="${data._id}"]`);
    if (!post) {
        return;
    }
    post.parentNode.replaceChild(newPost, post);
    getPostData(data._id, data);
});
