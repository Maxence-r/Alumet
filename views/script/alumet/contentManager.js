let alumet = {};

function getContent() {
    fetch('/alumet/' + id + '/content')
        .then(response => response.json())
        .then(data => {
            alumet = data;
            localStorage.setItem('alumet', JSON.stringify(data));
            data.walls.forEach(wall => {
                const list = createInList(wall.title, wall.postAuthorized, wall._id);
                const draggingContainer = list.querySelector('.draggingContainer');
                wall.posts.forEach(post => {
                    const card = createPostElement(post);
                    draggingContainer.appendChild(card);
                });
                const button = document.getElementById('wall');
                const parent = button.parentNode;
                parent.insertBefore(list, button);
            });
            endLoading();
        });
}

function getPostData(id, replace) {
    let post;
    for (let wall of alumet.walls) {
        post = wall.posts.find(post => post._id === id);
        if (post) {
            break;
        }
    }

    if (post) {
        if (replace) {
            const wallIndex = alumet.walls.findIndex(wall => wall._id === post.wallId);
            const postIndex = alumet.walls[wallIndex].posts.findIndex(p => p._id === id);
            alumet.walls[wallIndex].posts[postIndex] = replace;
        }
        return post;
    } else {
        const wallId = replace.wallId;
        const wallIndex = alumet.walls.findIndex(wall => wall._id === wallId);
        if (wallIndex !== -1) {
            alumet.walls[wallIndex].posts.push(replace);
            return replace;
        }
    }
    return null;
}
function getWallData(id, replace) {
    const wallIndex = alumet.walls.findIndex(wall => wall._id === id);
    if (wallIndex !== -1) {
        const wall = alumet.walls[wallIndex];
        if (replace) {
            alumet.walls[wallIndex] = replace;
            alumet.walls[wallIndex].posts = wall.posts;
        }
        return wall;
    }
    if (replace) {
        replace.posts = [];
        alumet.walls.push(replace);
        return replace;
    }
    return null;
}

function patchWall(position) {
    navbar('loadingRessources');
    fetch('/api/wall/' + app.infos._id + '/' + wallToEdit + '/move?direction=' + position, {
        method: 'PATCH',
    })
        .then(response => response.json())
        .then(data => {
            setTimeout(() => {
                navbar('home');
            }, 500);
            if (data.error) {
                return toast({
                    title: 'Erreur',
                    message: data.error,
                    type: 'error',
                    duration: 5000,
                });
            }
        });
}

let wallToEdit;
async function editWall(id) {
    wallToEdit = id;
    let wallData = await getWallData(id);
    if (!wallData) {
        toast({
            title: 'Erreur',
            message: 'Impossible de trouver le tableau',
            type: 'error',
            duration: 5000,
        });
    }
    document.getElementById('wallTitle').value = wallData.title;
    document.getElementById('postAuthorized').checked = wallData.postAuthorized;
    navbar('wall');
    document.querySelector('.wall').classList.add('editing');
}

function clearWall() {
    document.getElementById('wallTitle').value = '';
    document.getElementById('postAuthorized').checked = false;
    document.querySelector('.wall').classList.remove('editing');
}

let postToEdit;
async function editPost(id) {
    clearPost();
    let postData = await getPostData(id);
    if (!postData) {
        toast({
            title: 'Erreur',
            message: 'Impossible de trouver la publication',
            type: 'error',
            duration: 5000,
        });
    }
    postToEdit = postData._id;
    document.querySelectorAll('.colorSelector > div').forEach(color => {
        color.classList.remove('selectedColor');
    });
    try {
        document.getElementById(postData.color).classList.add('selectedColor');
        selectedColor = document.querySelector('.colorSelector > div.selectedColor').id;
    } catch (error) {
        document.getElementById('white').classList.add('selectedColor');
        selectedColor = 'white';
    }
    localStorage.setItem('currentItem', postData.wallId);
    document.getElementById('postTitle').value = postData.title;
    document.getElementById('editor').innerHTML = postData.content;
    document.getElementById('postCommentAuthorized').checked = postData.commentAuthorized;
    document.getElementById('administatorsAuthorized').checked = postData.adminsOnly;
    if (postData.file) {
        selectedFile = [postData.file._id];
        document.querySelector('.file-sending-infos > h3').innerText = postData.file.displayname;
        document.querySelector('.drop-box').classList.add('ready-to-send');
    }
    if (postData.link) {
        localStorage.setItem('link', postData.link.url);
        document.querySelector('.link-preview').classList.add('active-link-preview');
        document.getElementById('preview-title').innerText = postData.link.title;
        document.getElementById('preview-link').innerText = postData.link.description;
        document.querySelector('.link-preview').style.backgroundImage = `url(${postData.link.image})`;
    }
    if (postData.postDate) {
        document.getElementById('publicationDate').checked = true;
        document.querySelector('.date').classList.add('active-date');
        const dateInput = document.getElementById('date');
        const postDate = new Date(postData.postDate);
        const formattedDate = `${postDate.getFullYear()}-${(postDate.getMonth() + 1).toString().padStart(2, '0')}-${postDate.getDate().toString().padStart(2, '0')}T${postDate.getHours().toString().padStart(2, '0')}:${postDate
            .getMinutes()
            .toString()
            .padStart(2, '0')}`;
        dateInput.value = formattedDate;
    }
    navbar('post');
    document.querySelector('.post-buttons > .reded').style.display = 'flex';
}

function createPostElement(post) {
    const card = document.createElement('div');
    card.classList.add(post.color);
    card.classList.add('card');
    card.draggable = true;
    card.dataset.position = post.position;
    card.dataset.id = post._id;

    author = document.createElement('div');
    author.classList.add('author');

    if (post.postDate && new Date(post.postDate) > Date.now()) {
        const date = document.createElement('h3');
        date.classList.add('info');
        date.textContent = 'Programmé: ' + new Date(post.postDate).toLocaleString();
        card.appendChild(date);
    }
    if (post.adminsOnly) {
        const date = document.createElement('h3');
        date.classList.add('info');
        date.textContent = 'Visible par les administrateurs';
        card.appendChild(date);
    }

    if (post.owner) {
        author.textContent = post.owner.username;
    } else {
        author.textContent = 'Anonyme';
    }
    if (post.owner?.badges) {
        post.owner.badges.forEach(badge => {
            const badgeImg = document.createElement('img');
            badgeImg.src = `/assets/badges/${badge}.svg`;
            badgeImg.title = badge;
            badgeImg.classList.add('badge');
            badgeImg.setAttribute('draggable', false);
            author.appendChild(badgeImg);
        });
    }
    const creationDate = document.createElement('p');
    creationDate.classList.add('creationDate');
    creationDate.textContent = relativeTime(post.createdAt);
    author.appendChild(creationDate);
    if (app.user_infos.admin || app.user_infos?.id === post.owner?._id) {
        const editButton = document.createElement('img');
        editButton.classList.add('edit');
        editButton.src = '/assets/global/edit.svg';
        editButton.setAttribute('onclick', `editPost("${post._id}")`);
        author.appendChild(editButton);
    }

    card.appendChild(author);

    if (post.file) {
        const postRichContentContainer = document.createElement('div');
        postRichContentContainer.classList.add('post-rich-content-container');
        const filePreview = document.createElement('img');
        filePreview.setAttribute('loading', 'lazy');
        postRichContentContainer.setAttribute('onclick', `window.open("/viewer/${post.file._id}")`);
        filePreview.src = `/preview?id=${post.file._id}`;
        filePreview.setAttribute;
        filePreview.classList.add('post-rich-content');
        const filePreviewTitle = document.createElement('h2');
        filePreviewTitle.textContent = post.file.displayname;

        postRichContentContainer.appendChild(filePreview);
        postRichContentContainer.appendChild(filePreviewTitle);
        card.appendChild(postRichContentContainer);
    }
    if (post.link) {
        const postRichContentContainer = document.createElement('div');
        postRichContentContainer.classList.add('post-rich-content-container');
        const linkPreview = document.createElement('div');
        linkPreview.setAttribute('onclick', `window.open("${post.link.url}")`);
        if (post.link.image) {
            linkPreview.style.backgroundImage = `url(${post.link.image})`;
        }
        linkPreview.classList.add('post-rich-content');
        const linkPreviewTitle = document.createElement('h2');
        linkPreviewTitle.textContent = post.link.title;
        const linkPreviewDescription = document.createElement('p');
        linkPreviewDescription.textContent = post.link.description;

        linkPreview.appendChild(linkPreviewDescription);
        postRichContentContainer.appendChild(linkPreview);
        postRichContentContainer.appendChild(linkPreviewTitle);

        card.appendChild(postRichContentContainer);
    }
    if (post.title) {
        const cardTitle = document.createElement('div');
        cardTitle.classList.add('title');
        cardTitle.textContent = post.title;
        card.appendChild(cardTitle);
    }
    if (post.content) {
        const cardDescription = document.createElement('div');
        cardDescription.classList.add('description');
        const latexRegex = /<latex>(.*?)<\/latex>/g;
        const matches = post.content.matchAll(latexRegex);
        let content = post.content;
        for (const match of matches) {
            let imgLatex = document.createElement('img');
            imgLatex.src = `https://latex.codecogs.com/svg.latex?\\dpi{300}&space;${match[1]}`;
            imgLatex.alt = 'LaTeX equation';
            imgLatex.classList.add('latexImg');
            content = content.replace(match[0], imgLatex.outerHTML);
        }

        cardDescription.innerHTML = content;
        card.appendChild(cardDescription);
    }
    if (post.commentAuthorized) {
        const divider = document.createElement('div');
        divider.classList.add('divider');
        card.appendChild(divider);
        const actionRow = document.createElement('div');
        actionRow.classList.add('actionRow');
        const commentIcon = document.createElement('img');
        commentIcon.setAttribute('onclick', `openPost("${post._id}")`);
        commentIcon.src = '/assets/global/comment.svg';
        const commentsLength = document.createElement('p');
        commentsLength.textContent = post.commentsLength;

        actionRow.appendChild(commentsLength);
        actionRow.appendChild(commentIcon);
        card.appendChild(actionRow);
    }

    if (!navigator.userAgent.includes('Mobile') && app.user_infos.admin) {
        registerEventsOnCard(card);
    }

    return card;
}

function createInList(title, postAuthorized, id) {
    const list = document.createElement('div');
    list.dataset.id = id;
    list.classList.add('list');
    const titleEl = document.createElement('div');
    titleEl.classList.add('titleList');
    let text = document.createElement('h1');
    text.textContent = title;
    titleEl.appendChild(text);
    const draggingContainer = document.createElement('div');
    draggingContainer.classList.add('draggingContainer');
    draggingContainer.setAttribute('id', id);
    list.appendChild(titleEl);
    if (postAuthorized || app.user_infos.admin) {
        const button = document.createElement('button');
        button.setAttribute('id', 'post');
        button.classList.add('add');
        button.textContent = 'Ajouter une publication';
        button.setAttribute('onclick', `navbar("post", "${id}", "post")`);
        list.appendChild(button);
    }
    if (app.user_infos.admin) {
        const imgEdit = document.createElement('img');
        imgEdit.src = '/assets/global/edit.svg';
        imgEdit.classList.add('edit');
        imgEdit.setAttribute('onclick', `editWall("${id}")`);
        titleEl.appendChild(imgEdit);
    }
    list.appendChild(draggingContainer);
    if (!navigator.userAgent.includes('Mobile') && app.user_infos.admin) {
        registerEventsOnList(draggingContainer);
    }
    return list;
}

document.getElementById('publicationDate').addEventListener('change', e => {
    document.querySelector('.date').classList.toggle('active-date');
});

async function createPost(confirmed) {
    if (!app.user_infos.username && !confirmed) {
        return createPrompt({
            head: "Vous n'êtes pas connecté",
            desc: 'Vous ne serez plus en capacité de modifier cette publication une fois créée',
            action: 'createPost(true)',
        });
    }
    document.querySelector('.prompt-popup').classList.remove('active-popup');
    let fileFromDevice = document.getElementById('post-file').files[0];
    let fileFromCloud = selectedFile[0];
    let title = document.getElementById('postTitle').value;
    let content = document.getElementById('editor').innerHTML;
    let commentAuthorized = document.getElementById('postCommentAuthorized').checked;
    let adminsOnly = document.getElementById('administatorsAuthorized').checked;
    let postDate = document.getElementById('date').value;
    let link = localStorage.getItem('link');
    let postColor = selectedColor;

    if (!title && (!content || content === 'Ecrivez ici le contenu') && !fileFromDevice && !fileFromCloud && !link) {
        return toast({
            title: 'Erreur',
            message: "Vous n'avez pas spécifié de contenu pour cette publication",
            type: 'error',
            duration: 5000,
        });
    }

    navbar('loadingRessources');

    const body = {
        title,
        content,
        commentAuthorized,
        adminsOnly,
        link,
        postColor,
    };

    if (postToEdit) {
        body.postId = postToEdit;
    }

    if (document.getElementById('publicationDate').checked && postDate) {
        body.postDate = postDate;
    }

    if (fileFromDevice) {
        const fileUrl = await uploadFile(fileFromDevice);
        body.file = fileUrl;
    } else if (fileFromCloud) {
        body.file = fileFromCloud;
    }

    try {
        const response = await fetch('/api/post/' + app.infos._id + '/' + localStorage.getItem('currentItem'), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (data.error) {
            navbar('post');
            return toast({
                title: 'Erreur',
                message: data.error,
                type: 'error',
                duration: 5000,
            });
        }
        setTimeout(() => {
            navbar('home');
        }, 500);
        if (!app.user_infos?.admin && adminsOnly) {
            document.getElementById(`${localStorage.getItem('currentItem')}`).prepend(createPostElement(data));
            getPostData(data._id, data);
        }
    } catch (error) {
        console.error(error);
    }
}

function deletePost() {
    navbar('loadingRessources');
    fetch('/api/post/' + app.infos._id + '/' + postToEdit, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                navbar('post');
                return toast({
                    title: 'Erreur',
                    message: data.error,
                    type: 'error',
                    duration: 5000,
                });
            }
            setTimeout(() => {
                navbar('home');
            }, 500);
        });
}

function deleteWall() {
    navbar('loadingRessources');
    fetch('/api/wall/' + app.infos._id + '/' + wallToEdit, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                return toast({
                    title: 'Erreur',
                    message: data.error,
                    type: 'error',
                    duration: 5000,
                });
            }
            setTimeout(() => {
                navbar('home');
            }, 500);
        });
}

function clearPost() {
    selectedColor = 'white';
    document.querySelectorAll('.colorSelector > div').forEach(color => {
        color.classList.remove('selectedColor');
    });
    document.getElementById('white').classList.add('selectedColor');
    document.getElementById('postTitle').value = '';
    document.getElementById('editor').innerHTML = '';
    document.getElementById('post-file').value = '';
    document.getElementById('postCommentAuthorized').checked = false;
    document.getElementById('administatorsAuthorized').checked = false;
    document.getElementById('publicationDate').checked = false;
    document.querySelector('.date').classList.remove('active-date');
    document.querySelector('.drop-box').classList.remove('ready-to-send');
    oldLink = '';
    document.querySelector('.link-preview').classList.remove('active-link-preview');
    selectedFile = [];
    localStorage.removeItem('link');
}

async function uploadFile(file) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        fetch('/cdn/upload/default', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    reject(data.error);
                } else {
                    resolve(data.file._id);
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}
function convertToISODate(dateString, timeString) {
    const date = new Date(`${dateString}T${timeString}:00`);
    const isoDate = date.toISOString();
    return isoDate;
}

function createWall() {
    let title = document.getElementById('wallTitle').value;
    let postAuthorized = document.getElementById('postAuthorized').checked;
    if (title.length < 1) {
        return toast({
            title: 'Erreur',
            message: 'Vous devez entrer un titre',
            type: 'error',
            duration: 5000,
        });
    }
    navbar('loadingRessources');
    fetch('/api/wall/' + id, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, postAuthorized, wallToEdit }),
    })
        .then(response => response.json())
        .then(data => {
            if (!data.title) {
                navbar('wall');
                return toast({
                    title: 'Erreur',
                    message: data.error,
                    type: 'error',
                    duration: 5000,
                });
            }

            if (wallToEdit) {
                const wall = document.querySelector(`.list[data-id="${data._id}"]`);
                wall.querySelector('h1').innerText = data.title;
            }
            setTimeout(() => {
                navbar('home');
            }, 500);
        });
}

function openPost(id) {
    navbar('comments', id);
    document.querySelector('.comments > .full-screen').style.display = 'flex';
    fetch('/api/post/' + app.infos._id + '/' + id + '/comments', {
        method: 'GET',
    })
        .then(response => response.json())
        .then(data => {
            document.querySelector('.comments > .full-screen').style.display = 'none';
            if (data.error) {
                return toast({
                    title: 'Erreur',
                    message: data.error,
                    type: 'error',
                    duration: 5000,
                });
            }
            const commentsContainer = document.querySelector('.commentsContent');
            document.querySelectorAll('.commentsContent > .message').forEach(el => {
                el.remove();
            });
            if (data.length === 0) return;
            previousSender = null;
            data.forEach(comment => {
                comment.message = { content: comment.content, createdAt: comment.createdAt, sender: comment.owner._id };
                const commentElement = createMessageElement(comment.message, comment.owner);
                commentsContainer.prepend(commentElement);
            });
        });
}

function postComment() {
    const comment = document.getElementById('commentInput').value;
    if (comment.length < 1) return toast({ title: 'Erreur', message: 'Vous devez entrer un commentaire', type: 'error', duration: 5000 });
    if (comment.length < 1) {
        return toast({
            title: 'Erreur',
            message: 'Vous devez entrer un commentaire',
            type: 'error',
            duration: 5000,
        });
    }
    fetch('/api/post/' + app.infos._id + '/' + localStorage.getItem('currentItem') + '/comments', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: comment }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                return toast({
                    title: 'Erreur',
                    message: data.error,
                    type: 'error',
                    duration: 5000,
                });
            }
            if (document.querySelectorAll('.commentsContent > .message').length === 0) {
                previousSender = null;
            }
            data.comment = { content: data.content, createdAt: data.createdAt, sender: data.owner._id };
            const commented = createMessageElement(data.comment, data.owner);
            document.querySelector('.commentsContent').prepend(commented);
            document.getElementById('commentInput').value = '';
        });
}
