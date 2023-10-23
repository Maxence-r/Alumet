const navButtons = document.querySelectorAll('.navbar > button');
const sections = document.querySelectorAll('.overlay > div');
const navbarMenu = document.querySelector('.menu');
const burgerMenu = document.getElementById('burger');
const url = new URL(window.location.href);
const id = url.pathname.split('/').pop();
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
        document.getElementById('home').classList.add('navbar-active');
    }
    isMouseDownOnOverlayContent = false;
});

function enableConnected(data) {
    if (data.user_infos) {
        user = data.user_infos;
        if (data.admin) {
            document.querySelectorAll('.admin').forEach(el => {
                el.style.display = 'block';
            });
        }
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
    if (!data.admin) {
        document.querySelectorAll('.adminsOnly').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('.disabledInput').forEach(el => {
            el.disabled = true;
        });
    }
}

function loadParticipants(participants, collaborators, admin) {
    const participantsContainer = document.querySelector('.participants-container');
    if (participants.length === 0 && collaborators.length === 0) return;
    participantsContainer.innerHTML = '';

    const createParticipant = (participant, role) => {
        const user = document.createElement('div');
        user.classList.add('user');
        user.dataset.id = participant._id;
        if (admin) user.setAttribute('onclick', `deleteParticipant("${participant._id}")`);
        const userImage = document.createElement('img');
        userImage.src = `/cdn/u/${participant.icon}`;

        const userInfo = document.createElement('div');
        const userName = document.createElement('h3');
        userName.textContent = `${participant.name} ${participant.lastname}`;
        const userRole = document.createElement('p');
        userRole.textContent = role;
        userInfo.appendChild(userName);
        userInfo.appendChild(userRole);

        user.appendChild(userImage);
        user.appendChild(userInfo);
        participantsContainer.prepend(user);
    };

    participants.forEach(participant => createParticipant(participant, 'Participant'));
    collaborators.forEach(collaborator => createParticipant(collaborator, 'Collaborateur'));
}

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
    fetch('/alumet/collaborators/' + alumet._id, {
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

function engageDeletion(typeToDelete) {
    type = typeToDelete;
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
    fetch('/item/' + id + '/' + type, {
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
