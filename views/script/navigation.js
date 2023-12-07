const navButtons = document.querySelectorAll('.navbar > button');
const sections = document.querySelectorAll('.overlay > div');
const navbarMenu = document.querySelector('.menu');
const burgerMenu = document.getElementById('burger');
const url = new URL(window.location.href);
const id = url.pathname.split('/').pop();
let app = {}
function navbar(id, currentItem, newItem) {
    if (currentItem) {
        localStorage.setItem('currentItem', currentItem);
    }
    if (id == 'home') {
        burgerMenu.classList.remove('is-active');
        document.querySelector('.overlay').classList.remove('active-layer');
    } else {
        document.querySelector('.overlay').classList.add('active-layer');
    }
    if (newItem == 'post') {
        postToEdit = null;
        document.querySelector('.post-buttons > .reded').style.display = 'none';
        clearPost();
    } else if (newItem == 'wall') {
        document.querySelector('.wall').classList.remove('editing');
        wallToEdit = null;
        clearWall();
    }

    navButtons.forEach(button => button.classList.remove('navbar-active'));
    const element = document.getElementById(id);
    if (element) {
        element.classList.add('navbar-active');
    }
    sections.forEach(section => section.classList.remove('active-section'));
    if (id !== 'home') {
        burgerMenu.classList.add('is-active');
        document.querySelector(`.${id}`).classList.add('active-section');
    }
}

if (burgerMenu && navbarMenu) {
    burgerMenu.addEventListener('click', () => {
        if (burgerMenu.classList.contains('is-active')) {
            burgerMenu.classList.remove('is-active');
            sections.forEach(section => section.classList.remove('active-section'));
            document.querySelector('.overlay').classList.remove('active-layer');
        } else {
            burgerMenu.classList.add('is-active');
            navbarMenu.classList.add('active-section');
            document.querySelector('.overlay').classList.add('active-layer');
        }
    });
}

const overlay = document.querySelector('.overlay');
const overlayContent = document.querySelectorAll('.overlay-content');
let isMouseDownOnOverlayContent = false;

overlayContent.forEach(function (content) {
    content.addEventListener('mousedown', function () {
        isMouseDownOnOverlayContent = true;
    });
});

overlay.addEventListener('click', function (event) {
    if (!event.target.closest('.overlay-content') && !isMouseDownOnOverlayContent) {
        overlay.classList.remove('active-layer');
        sections.forEach(section => section.classList.remove('active-section'));
        navButtons.forEach(button => button.classList.remove('navbar-active'));
    }
    isMouseDownOnOverlayContent = false;
});

function enableConnected(data) {
    if (data.username) {
        if (data.admin) {
            document.querySelectorAll('.admin').forEach(el => {
                el.style.display = 'block';
            });
        }
        document.querySelector('.navProfile > img').src = '/cdn/u/' + data.icon;
        document.querySelector('.user-infos > img').src = '/cdn/u/' + data.icon;
        document.querySelector('.user-details > h3').innerText = data.username;
        document.querySelector('.user-details > p').innerText = 'Connecté';
        document.querySelector('.profile > .row-bottom-buttons').classList.add('connected');
        loadFiles();
    } else {
        document.querySelectorAll('.connectedOnly').forEach(el => {
            el.style.display = 'none';
        });
    }
    if (!data.admin) {
        document.querySelectorAll('.admin').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('.disabledInput').forEach(el => {
            el.disabled = true;
        });
    }
}

function fetchAppInfos() {
    fetch('/app/info/' + id, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(data => {
            app = data;
            loadParticipants(data.infos.participants);
            loadAppInfos(data.infos);
            enableConnected(data.user_infos);
        })
        .catch(err => console.log(err));
}

fetchAppInfos();

function loadAppInfos(data) {
    document.querySelector('.backgroundImg').src = `/cdn/u/${data.background}`;
    document.getElementById('appName').value = data.title;
    document.getElementById('appDescription').value = data.description;
    if (data.private && data.code) {
        document.getElementById('appInvitationCode').value = data.code;
    }
    document.getElementById('appPrivate').checked = data.private;
    document.getElementById('appChat').checked = data.swiftchat;
    document.getElementById('appDiscovery').checked = data.discovery
    if (data.type === 'alumet') {
        document.querySelector('body').style.backgroundImage = `url(/cdn/u/${data.background})`;
    }
}


function loadParticipants(participants) {
    const participantsContainer = document.querySelector('.participants-container');
    if (participants.length === 0) return;
    participantsContainer.innerHTML = '';

    const createParticipant = (participant) => {
        const user = document.createElement('div');
        user.classList.add('user');
        user.dataset.id = participant._id;
        const userImage = document.createElement('img');
        userImage.src = `/cdn/u/${participant.icon}`;

        const userInfo = document.createElement('div');
        const userName = document.createElement('h3');
        userName.textContent = `${participant.username} (${participant.name} ${participant.lastname})`;
        const userRole = document.createElement('p');
        userRole.textContent = participant.status === 0 ? 'Propriétaire' : participant.status === 1 ? 'Administrateur' : participant.status === 2 ? 'Participant' : 'Banni';
        userInfo.appendChild(userName);
        userInfo.appendChild(userRole);

        user.appendChild(userImage);
        user.appendChild(userInfo);
        participantsContainer.prepend(user);
    };
    participants.forEach(participant => createParticipant(participant));
}

async function modifyApp() {
    const file = document.getElementById('alumet-background').files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', document.getElementById('appName').value);
    formData.append('description', document.getElementById('appDescription').value);
    formData.append('private', document.getElementById('appPrivate').checked);
    formData.append('chat', document.getElementById('appChat').checked);
    formData.append('discovery', document.getElementById('appDiscovery').checked);
    formData.append('app', app.infos._id);
    navbar('loadingRessources');
    fetch('/app/new', {
        method: 'PUT',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                navbar('settings');
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 });
            } else {
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        })
        .catch(error => {
            console.error(error);
        });
}

document.querySelector('.backgroundImg').addEventListener('click', () => {
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
    document.querySelector('.backgroundImg').src = URL.createObjectURL(file);
});


function loadFiles() {
    fetch('/cdn/folder/list', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(data => {
            if (data.length === 0) {
                if (data.length === 0) {
                    document.querySelector('.files-header').style.display = 'none';
                    document.querySelector('.files-items').style.display = 'none';
                    document.getElementById('folder-selection').style.display = 'none';
                    return;
                }
            }
            data.forEach(addFolder);
            localStorage.setItem('currentFolder', data[0]._id);
            loadFolder(localStorage.getItem('currentFolder'));
        });
}

function createFileElement(file) {
    const div = document.createElement('div');
    div.dataset.id = file._id;
    div.dataset.name = file.displayname;
    div.dataset.ext = file.mimetype;
    div.dataset.size = (file.filesize / 1024 / 1024).toFixed(2) + ' Mo';
    div.dataset.date = file.date.split('T')[0];
    div.setAttribute('onclick', `chooseFile('${file._id}')`);
    div.classList.add('file-item');
    const subDiv = document.createElement('div');
    subDiv.classList.add('file-name');
    const img = document.createElement('img');
    let imgRef = fileIconReference[file.mimetype];
    if (imgRef) {
        img.src = `${fileIconReference[file.mimetype]}`;
    } else {
        img.src = '../assets/files-icons/unknow.png';
        imgRef = '../assets/files-icons/unknow.png';
    }
    div.dataset.imgRef = imgRef;
    img.alt = 'file icon';
    const h4 = document.createElement('h4');
    const span = document.createElement('span');
    span.innerText = file.displayname.split('.')[0];
    h4.appendChild(span);
    h4.innerText += `.${file.displayname.split('.').pop()}`;
    subDiv.appendChild(img);
    subDiv.appendChild(h4);
    div.appendChild(subDiv);
    const sizeH4 = document.createElement('h4');
    sizeH4.innerText = (file.filesize / 1024 / 1024).toFixed(2) + ' Mo';
    div.appendChild(sizeH4);
    const dateH4 = document.createElement('h4');
    dateH4.innerText = file.date.split('T')[0];
    div.appendChild(dateH4);
    return div;
}

const folderSelection = document.getElementById('folder-selection');

folderSelection.addEventListener('change', e => {
    loadFolder(e.currentTarget.value);
});

function addFolder(folder) {
    folderSelection.appendChild(createOption(folder));
}

function createOption(folder) {
    const option = document.createElement('option');
    option.value = folder._id;
    option.innerText = folder.name;
    return option;
}

document.getElementById('search-bar').addEventListener('input', e => {
    const search = e.currentTarget.value.toLowerCase();
    const allFiles = document.querySelectorAll('.file-item');
    allFiles.forEach(file => {
        const fileName = file.dataset.name.toLowerCase();
        if (fileName.includes(search)) {
            file.style.display = 'flex';
        } else {
            file.style.display = 'none';
        }
    });
});

function addCollaborators() {
    document.querySelector('.user-popup').classList.add('active-popup');
}

function confirmCollaborators() {
    fetch(`/app/collaborators/` + id, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collaborators: participants }),
    })
        .then(res => res.json())
        .then(data => {
            document.querySelector('.user-popup').classList.remove('active-popup');
            if (data.error) {
                return toast({ title: 'Erreur', message: data.error, type: 'error' });
            }
            toast({ title: 'Succès', message: 'Les invitations ont bien été envoyées', type: 'success' });
        });
}

function engageDeletion() {

    createPrompt({
        head: "Suppression de l'Alumet",
        desc: 'Êtes-vous sûr de vouloir supprimer cet alumet ? Cette action est irréversible et entraînera la suppression de toutes les données associées à cet alumet.',
        action: `deleteItem()`,
    });
}

function deleteItem() {
    fetch('/auth/a2f', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 6000 });
            }
            createPrompt({
                head: "Confirmation de suppression de l'Alumet",
                desc: "Un code de sécurité vous a été envoyé par mail. Veuillez le saisir ci-dessous pour confirmer la suppression de l'alumet. ",
                placeholder: 'Code de sécurité',
                action: `confirmDeleteItem()`,
            });
        });
}

function confirmDeleteItem() {
    fetch('/app/delete/' + id, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            code: document.getElementById('prompt-input').value,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 6000 });
            } else {
                window.location.href = '/dashboard';
            }
        });
}
