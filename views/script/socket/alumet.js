socket.on("connect", () => {
    //
});

socket.io.on("reconnect", () => {
    socket.emit('joinAlumet', app.infos._id, "6505e1fc19c363addbab5c3d");
    navbar('home')
});


socket.on('disconnect', () => {
    navbar('disconnected');
});



socket.on('addPost', data => {
    const list = document.getElementById(data.wallId);
    const newPost = createPostElement(data);
    list.prepend(newPost);
    getPostData(data._id, data);
});

socket.on('deletePost', id => {
    const post = document.querySelector(`.card[data-id="${id}"]`);
    if (!post) return;
    post.parentNode.removeChild(post);
});

socket.on('movePost', (listId, blockId, position) => {
    let block = document.querySelector(`.card[data-id="${blockId}"]`);
    if (!block) return;
    let list = document.getElementById(listId);
    let cardAfterDraggingCard = list.querySelectorAll('.card')[position];
    if (cardAfterDraggingCard) {
        cardAfterDraggingCard.parentNode.insertBefore(block, cardAfterDraggingCard);
    } else {
        list.appendChild(block);
    }
});

socket.on('editPost', data => {
    const newPost = createPostElement(data);
    const post = document.querySelector(`.card[data-id="${data._id}"]`);
    if (!post) return;
    post.parentNode.replaceChild(newPost, post);
    getPostData(data._id, data);
});

socket.on('addWall', data => {
    getWallData(data._id, data);
    const list = createInList(data.title, data.postAuthorized, data._id);
    const button = document.getElementById('wall');
    const parent = button.parentNode;
    parent.insertBefore(list, button);
});

socket.on('editWall', data => {
    getWallData(data._id, data);
    const wall = document.querySelector(`.list[data-id="${data._id}"]`);
    wall.querySelector('h1').innerText = data.title;
    if (!data.postAuthorized && !app.user_infos.admin) {
        wall.querySelectorAll('button').forEach(button => {
            button.parentNode.removeChild(button);
        });
    } else if (!app.user_infos.admin && !wall.querySelector('.add')) {
        let button = document.createElement('button');
        button.classList.add('add');
        button.setAttribute('onclick', `navbar('post', '${data._id}')`, 'post');
        button.innerText = 'Ajouter une publication';
        const dragginContainer = wall.querySelector('.draggingContainer');
        dragginContainer.parentNode.insertBefore(button, dragginContainer);
    }
});

socket.on('deleteWall', id => {
    const wall = document.querySelector(`.list[data-id="${id}"]`);
    if (!wall) {
        return;
    }
    wall.parentNode.removeChild(wall);
});
