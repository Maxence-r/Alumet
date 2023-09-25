const path = window.location.pathname;
const parts = path.split('/');
const id = parts[parts.length - 1];
let alumet = {};

function getContent() {
    fetch('/alumet/' + id + '/content')
        .then(response => response.json())
        .then(data => {
            alumet = data;
            localStorage.setItem('alumet', JSON.stringify(data));
            document.querySelector('body').style.backgroundImage = `url(/cdn/u/${data.background})`;
            document.querySelector('.settings > img').src = `/cdn/u/${data.background}`;
            document.getElementById('alumetName').value = data.title;
            document.querySelector('.header-setting > h1').innerText = data.title;
            document.getElementById('alumetDescription').value = data.description;
            if (data.private && data.code) {
                document.getElementById('invitationCode').value = data.code;
            }
            document.getElementById('alumet-private').checked = data.private;
            document.getElementById('alumet-chat').checked = data.swiftchat;
            data.walls.forEach(wall => {
                const list = createInList(wall.title, wall.postAuthorized, wall._id);
                const draggingContainer = list.querySelector('.draggingContainer');
                wall.posts.forEach(post => {
                    const card = createTaskList(post);
                    draggingContainer.appendChild(card);
                });
                const button = document.getElementById('wall');
                const parent = button.parentNode;
                parent.insertBefore(list, button);
            });
            if (!data.admin) {
                document.querySelectorAll('.adminsOnly').forEach(el => {
                    el.style.display = 'none';
                });
            }
            if (data.user_infos) {
                user = data.user_infos;
                if (data.admin) {
                    document.querySelectorAll('.admin').forEach(el => {
                        el.style.display = 'block';
                    });
                }
                currentConversation = data.chat;
                loadConversation(data.chat);
                document.querySelector('#profile > img').src = '/cdn/u/' + data.user_infos.icon;
                document.querySelector('.user-infos > img').src = '/cdn/u/' + data.user_infos.icon;
                document.querySelector('.user-details > h3').innerText = data.user_infos.username;
                document.querySelector('.user-details > p').innerText = 'Connecté';
                document.querySelector('.profile > .row-bottom-buttons').classList.add('connected');
                loadFiles();
            } else {
                document.querySelectorAll('.connectedOnly').forEach(el => {
                    el.style.display = 'none';
                });
            }

            loadParticipants(data.participants, data.collaborators);

            socket.emit('joinAlumet', alumet._id, data.user_infos?._id);
            document.querySelector('body > section').style.display = 'none';
        });
}

function loadParticipants(participants, collaborators) {
    const participantsContainer = document.querySelector('.participants-container');
    if (participants.length === 0 && collaborators.length === 0) {
        return;
    }
    participantsContainer.innerHTML = '';

    participants.forEach(participant => {
        const user = document.createElement('div');
        user.classList.add('user');
        user.dataset.id = participant._id;

        const userImage = document.createElement('img');
        userImage.src = `/cdn/u/${participant.icon}`;

        const userInfo = document.createElement('div');
        const userName = document.createElement('h3');
        userName.textContent = `${participant.name} ${participant.lastname}`;
        const userRole = document.createElement('p');
        userRole.textContent = 'Participant';
        userInfo.appendChild(userName);
        userInfo.appendChild(userRole);

        user.appendChild(userImage);
        user.appendChild(userInfo);
        participantsContainer.prepend(user);
    });

    collaborators.forEach(collaborator => {
        const user = document.createElement('div');
        user.classList.add('user');
        user.dataset.id = collaborator._id;

        const userImage = document.createElement('img');
        userImage.src = `/cdn/u/${collaborator.icon}`;

        const userInfo = document.createElement('div');
        const userName = document.createElement('h3');
        userName.textContent = `${collaborator.name} ${collaborator.lastname}`;
        const userRole = document.createElement('p');
        userRole.textContent = 'Collaborateur';
        userInfo.appendChild(userName);
        userInfo.appendChild(userRole);

        user.appendChild(userImage);
        user.appendChild(userInfo);
        participantsContainer.prepend(user);
    });
}

async function modifyAlumet() {
    const file = document.getElementById('alumet-background').files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', document.getElementById('alumetName').value);
    formData.append('description', document.getElementById('alumetDescription').value);
    formData.append('private', document.getElementById('alumet-private').checked);
    formData.append('chat', document.getElementById('alumet-chat').checked);
    formData.append('alumet', alumet._id);
    fetch('/a/new', {
        method: 'PUT',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 });
            } else {
                navbar('loadingRessources');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        })
        .catch(error => {
            console.error(error);
        });
}

function engageDeletion() {
    createPrompt({
        head: "Suppression de l'Alumet",
        desc: 'Êtes-vous sûr de vouloir supprimer cet alumet ? Cette action est irréversible et entraînera la suppression de toutes les données associées à cet alumet.',
        action: 'deleteAlumet()',
    });
}

function deleteAlumet() {
    fetch('/a/' + alumet._id, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                return toast({ title: 'Erreur', message: data.error, type: 'error', duration: 5000 });
            }
            toast({ title: 'Succès', message: "L'alumet a bien été supprimé !", type: 'success', duration: 2500 });
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 500);
        });
}

document.querySelector('.settings > img').addEventListener('click', () => {
    document.getElementById('alumet-background').click();
});

document.getElementById('alumet-background').addEventListener('change', () => {
    const file = document.getElementById('alumet-background').files[0];
    const fileType = file.type.split('/')[0];
    const fileSize = file.size / 1024 / 1024;
    if (fileType !== 'image' || fileSize > 3) {
        document.getElementById('alumet-background').value = '';
        return toast({ title: 'Erreur', message: 'Veuillez sélectionner une image de moins de 3MB', type: 'error', duration: 2500 });
    }
    document.querySelector('.settings > img').src = URL.createObjectURL(file);
});

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
    fetch('/api/wall/' + JSON.parse(localStorage.getItem('alumet'))._id + '/' + wallToEdit + '/move?direction=' + position, {
        method: 'PATCH',
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
            const wall = document.querySelector(`.list[data-id="${data._id}"]`);
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
    localStorage.setItem('currentItem', postData.wallId);
    document.getElementById('postTitle').value = postData.title;
    document.getElementById('editor').innerHTML = postData.content;
    document.getElementById('postCommentAuthorized').checked = postData.commentAuthorized;
    document.getElementById('administatorsAuthorized').checked = postData.adminsOnly;
    if (postData.file) {
        localStorage.setItem('file-ts', postData.file._id);
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

function createTaskList(post) {
    const card = document.createElement('div');
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
    if (post.owner?.isCertified) {
        const certified = document.createElement('img');
        certified.src = `/assets/badges/certified/${post.owner.accountType}-certified.svg`;
        certified.title = 'Compte ' + post.owner.accountType + ' certifié';
        certified.classList.add('badge');
        certified.setAttribute('draggable', false);
        author.appendChild(certified);
    }
    if (post.owner?.badges) {
        post.owner.badges.forEach(badge => {
            const badgeImg = document.createElement('img');
            badgeImg.src = `/assets/badges/specials/${badge}.svg`;
            badgeImg.title = badge;
            badgeImg.classList.add('badge');
            badgeImg.setAttribute('draggable', false);
            author.appendChild(badgeImg);
        });
    }
    if (alumet.admin || (alumet.user_infos?._id === post.owner?._id && alumet.user_infos)) {
        const editButton = document.createElement('img');
        editButton.classList.add('edit');
        editButton.src = '/assets/global/edit.svg';
        editButton.setAttribute('onclick', `editPost("${post._id}")`);
        author.appendChild(editButton);
    }
    card.appendChild(author);

    if (post.file) {
        const filePreview = document.createElement('div');
        filePreview.setAttribute('onclick', `window.open("/viewer/${post.file._id}")`);
        filePreview.style.backgroundImage = `url("/preview?id=${post.file._id}")`;
        filePreview.classList.add('post-rich-content');
        const filePreviewTitle = document.createElement('h2');
        filePreviewTitle.textContent = post.file.displayname;
        const filePreviewExt = document.createElement('div');
        filePreviewExt.classList.add('ext');
        filePreviewExt.textContent = post.file.mimetype.toUpperCase();
        const gradient = document.createElement('div');
        gradient.classList.add('reader-gradient');
        filePreview.appendChild(filePreviewTitle);
        filePreview.appendChild(filePreviewExt);
        filePreview.appendChild(gradient);
        card.appendChild(filePreview);
    }
    if (post.link) {
        const linkPreview = document.createElement('div');
        if (post.link.image) {
            linkPreview.style.backgroundImage = `url(${post.link.image})`;
        }
        linkPreview.setAttribute('onclick', `window.open("${post.link.url}")`);
        linkPreview.classList.add('post-rich-content');
        const linkPreviewTitle = document.createElement('h2');
        linkPreviewTitle.textContent = post.link.title;
        const linkPreviewDescription = document.createElement('p');
        linkPreviewDescription.textContent = post.link.description;
        const gradient = document.createElement('div');
        gradient.classList.add('reader-gradient');
        linkPreview.appendChild(linkPreviewTitle);
        linkPreview.appendChild(linkPreviewDescription);
        linkPreview.appendChild(gradient);
        card.appendChild(linkPreview);
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
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Laisser un commentaire';
        input.classList.add('comment-input');
        input.setAttribute('onkeydown', `if (event.keyCode === 13) { commentPost("${post._id}") }`);
        card.appendChild(input);
    }

    if (!navigator.userAgent.includes('Mobile') && alumet.admin) {
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
    if (postAuthorized || alumet.admin) {
        const button = document.createElement('button');
        button.setAttribute('id', 'post');
        button.classList.add('add');
        button.textContent = 'Ajouter une publication';
        button.setAttribute('onclick', `navbar("post", "${id}", "post")`);
        list.appendChild(button);
    }
    if (alumet.admin) {
        const imgEdit = document.createElement('img');
        imgEdit.src = '/assets/global/edit.svg';
        imgEdit.classList.add('edit');
        imgEdit.setAttribute('onclick', `editWall("${id}")`);
        titleEl.appendChild(imgEdit);
    }
    list.appendChild(draggingContainer);
    if (!navigator.userAgent.includes('Mobile') && alumet.admin) {
        registerEventsOnList(draggingContainer);
    }
    return list;
}

getContent();

function chooseFile(id) {
    const fileDiv = document.querySelector(`div[data-id="${id}"]`);
    document.querySelector('.file-sending-infos > h3').innerText = fileDiv.dataset.name;
    localStorage.setItem('file-ts', id);
    navbar('post');
    document.querySelector('.drop-box').classList.add('ready-to-send');
}

document.getElementById('load-post-file').addEventListener('click', () => {
    document.getElementById('post-file').click();
});

document.getElementById('post-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    localStorage.removeItem('file-ts');
    const formData = new FormData();
    formData.append('file', file);
    document.querySelector('.file-sending-infos > h3').innerText = file.name;
    navbar('post');
    document.querySelector('.drop-box').classList.add('ready-to-send');
});

document.getElementById('publicationDate').addEventListener('change', e => {
    document.querySelector('.date').classList.toggle('active-date');
});

function cancelSend() {
    localStorage.removeItem('file-ts');
    localStorage.removeItem('gDrive');
    document.getElementById('post-file').value = '';
    document.querySelector('.ready-to-send').classList.remove('ready-to-send');
}

async function createPost(confirmed) {
    if (!alumet.user_infos && !confirmed) {
        return createPrompt({
            head: "Vous n'êtes pas connecté",
            desc: 'Vous ne serez plus en capacité de modifier cette publication une fois créée',
            action: 'createPost(true)',
        });
    }
    document.querySelector('.prompt-popup').classList.remove('active-popup');
    let fileFromDevice = document.getElementById('post-file').files[0];
    let fileFromCloud = localStorage.getItem('file-ts');
    let fileFromGdrive = JSON.parse(localStorage.getItem('gDrive'));
    let title = document.getElementById('postTitle').value;
    let content = document.getElementById('editor').innerHTML;
    let commentAuthorized = document.getElementById('postCommentAuthorized').checked;
    let adminsOnly = document.getElementById('administatorsAuthorized').checked;
    let postDate = document.getElementById('date').value;
    let link = localStorage.getItem('link');

    if (!title && (!content || content === 'Ecrivez ici le contenu') && !fileFromDevice && !fileFromCloud && !link && !fileFromGdrive) {
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
    } else if (fileFromGdrive) {
        body.drive = true;
        body.file = fileFromGdrive;
    }

    try {
        const response = await fetch('/api/post/' + JSON.parse(localStorage.getItem('alumet'))._id + '/' + localStorage.getItem('currentItem'), {
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
    } catch (error) {
        console.error(error);
    }
}

function deletePost() {
    navbar('loadingRessources');
    fetch('/api/post/' + JSON.parse(localStorage.getItem('alumet'))._id + '/' + postToEdit, {
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

function deleteWall() {
    navbar('loadingRessources');
    fetch('/api/wall/' + JSON.parse(localStorage.getItem('alumet'))._id + '/' + wallToEdit, {
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
    localStorage.removeItem('file-ts');
    localStorage.removeItem('gDrive');
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

function loadConversation(id) {
    fetch(`/swiftChat/` + id)
        .then(response => response.json())
        .then(json => {
            const conversationBody = document.querySelector('.conversation-body');

            if (!json) return;
            Promise.all(json.messages.map(message => createMessageElement(message.message, message.user))).then(messageElements => {
                messageElements.forEach(messageElement => {
                    conversationBody.prepend(messageElement);
                });

                let warningBox = document.createElement('div');
                warningBox.classList.add('warning-box');
                warningBox.innerText = 'Cet espace est privé et accessible uniquement aux membres de cet Alumet. La conversation est automatiquement modérée par une intelligence artificielle.';
                conversationBody.prepend(warningBox);
            });

            joinSocketRoom(id, user._id);
        })
        .catch(error => console.error(error));
}
