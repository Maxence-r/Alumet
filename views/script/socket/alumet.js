socket.on("connect", () => {
    //
});

socket.io.on("reconnect", () => {
    socket.emit('alumet:join', app.infos._id);
    navbar('home')
});


socket.on('disconnect', () => {
    navbar('disconnected');
});



socket.on('alumet:post:created', data => {
    const list = document.getElementById(data.wallId);
    const newPost = createPostElement(data);
    list.prepend(newPost);
    getPostData(data._id, data);
});

socket.on('alumet:post:deleted', id => {
    const post = document.querySelector(`.card[data-id="${id}"]`);
    if (!post) return;
    post.parentNode.removeChild(post);
});

socket.on('alumet:post:moved', (listId, blockId, position) => {
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

socket.on('alumet:post:updated', data => {
    const newPost = createPostElement(data);
    const post = document.querySelector(`.card[data-id="${data._id}"]`);
    if (!post) return;
    post.parentNode.replaceChild(newPost, post);
    getPostData(data._id, data);
});

socket.on('alumet:wall:created', data => {
    getWallData(data._id, data);
    const list = createInList(data.title, data.postAuthorized, data._id);
    const button = document.getElementById('wall');
    const parent = button.parentNode;
    parent.insertBefore(list, button);
});

socket.on('alumet:wall:updated', data => {
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
        button.innerText = 'Add a post';
        const dragginContainer = wall.querySelector('.draggingContainer');
        dragginContainer.parentNode.insertBefore(button, dragginContainer);
    }
});

socket.on('alumet:wall:deleted', id => {
    const wall = document.querySelector(`.list[data-id="${id}"]`);
    if (!wall) {
        return;
    }
    wall.parentNode.removeChild(wall);
});


socket.on('alumet:wall:moved', (id, direction) => {
    const wall = document.querySelector(`.list[data-id="${id}"]`);
    if (!wall) {
        return;
    }
    const wallToSwap = direction === 'right' ? wall.nextElementSibling : wall.previousElementSibling;
    if (!wallToSwap) {
        return;
    }
    if (direction === 'right') {
        wall.parentNode.insertBefore(wallToSwap, wall);
    } else {
        wall.parentNode.insertBefore(wall, wallToSwap);
    }
});
