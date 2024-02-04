const navButtons = document.querySelectorAll('.navbar > button');
const sections = document.querySelectorAll('.overlay > div');
const navbarMenu = document.querySelector('.menu');
const burgerMenu = document.getElementById('burger');
const url = new URL(window.location.href);
const id = url.pathname.split('/').pop();
let app = {};
function navbar(id, currentItem, newItem) {
    if (currentItem) {
        localStorage.setItem('currentItem', currentItem);
    }
    document.querySelector('.overlay').classList.add('active-layer');
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
        document.querySelectorAll('.connect').forEach(el => {
            el.style.display = 'none';
        });

        document.querySelector('.navProfile > img').src = '/cdn/u/' + data.icon;
        document.querySelector('.user-infos > img').src = '/cdn/u/' + data.icon;
        document.querySelector('.user-details > h3').innerText = data.username;
        document.querySelector('.user-details > p').innerText = 'Connecté';
        document.querySelector('.profile > .row-bottom-buttons').classList.add('connected');
        if (data.admin) {
            document.querySelectorAll('.app-link').forEach(el => {
                el.value = window.location.protocol + '//' + window.location.host + '/portal/' + app.infos._id + (app.infos.password !== '' || null ? '?password=' + app.infos.password : '');
            });
        }
        data.experiments.forEach(experiment => {
            document.querySelectorAll(`.experiments-${experiment}`).forEach(el => {
                el.style.display = 'flex';
            });

            document.querySelectorAll(`.experiments-${experiment}-rv`).forEach(el => {
                el.style.display = 'none';
            });
        });
    } else {
        document.querySelectorAll('.connectedOnly').forEach(el => {
            el.style.display = 'none';
        });
    }
    if (!data.admin) {
        document.querySelectorAll('.disabledInput').forEach(el => {
            el.disabled = true;
        });
        document.querySelectorAll('.admin').forEach(el => {
            el.style.display = 'none';
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
    document.getElementById('appSubject').value = data.subject;
    document.getElementById('appChat').checked = data.swiftchat;
    document.getElementById('appDiscovery').checked = data.discovery;
    document.getElementById('password-input').value = data.password || '';
    document.querySelectorAll(`.${app.infos.security}`).forEach(el => {
        el.style.display = 'flex';
    });
    if (data.type === 'alumet') {
        document.querySelector('body').style.backgroundImage = `url(/cdn/u/${data.background})`;
        socket.emit('joinAlumet', app.infos._id);
        getContent();
    }
    if (data.type === 'flashcard') {
        document.getElementById('flashcard-title').innerText = data.title;
        document.getElementById('flashcard-description').innerText = data.description;
    }
    document.getElementById(data.security).click();
}

function promptLeave() {
    createPrompt({
        head: "Quitter l'application",
        desc: "Êtes-vous sûr de vouloir quitter cette application ? Vous ne pourrez plus y accéder si vous n'êtes pas inviter a nouveau.",
        action: 'leaveApplication()',
    });
}

function leaveApplication() {
    fetch('/portal/leave/' + app.infos._id, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(data => {
            document.querySelector('.prompt-popup').classList.remove('active-popup');
            if (data.error) {
                return toast({ title: 'Erreur', message: data.error, type: 'error' });
            }
            window.location.href = '/dashboard';
        });
}

function loadParticipants(participants) {
    const participantsContainer = document.querySelector('.participants-container');
    if (participants.length === 0) return;
    participantsContainer.innerHTML = '';

    const createParticipant = participant => {
        const user = document.createElement('div');
        user.classList.add('user');
        user.dataset.id = participant._id;
        const userImage = document.createElement('img');
        userImage.src = `/cdn/u/${participant.icon}`;

        const userInfo = document.createElement('div');
        const userName = document.createElement('h3');
        userName.textContent = `${participant.name} ${participant.lastname.substr(0, 3)}`;
        const userRole = document.createElement('p');
        userRole.textContent = participant.status === 0 ? 'Propriétaire' : participant.status === 1 ? 'Collaborateur' : participant.status === 2 ? 'Participant' : 'Banni';
        userInfo.appendChild(userName);
        userInfo.appendChild(userRole);
        if (participant.badges.length > 0) {
            participant.badges.forEach(badge => {
                const badgeImg = document.createElement('img');
                badgeImg.src = `/assets/badges/${badge}.svg`;
                badgeImg.title = badge;
                badgeImg.classList.add('badge');
                badgeImg.setAttribute('draggable', false);
                userName.appendChild(badgeImg);
            });
        }
        user.appendChild(userImage);
        user.appendChild(userInfo);

        const select = document.createElement('select');
        select.setAttribute('name', 'role');
        select.classList.add('user-role', 'disabledInput');
        select.dataset.id = participant._id;
        select.addEventListener('change', event => {
            fetch('/app/role/' + app.infos._id, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: event.target.dataset.id,
                    role: event.target.options[event.target.selectedIndex].value,
                }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.alert) {
                        document.querySelector('.user-role[data-id="' + event.target.dataset.id + '"]').selectedIndex = participant.status;
                        return createPrompt({ head: 'Donner la propriété', desc: 'Souhaitez-vous donner la propriété de cette application. Cette action est irréversible.', action: `giveAppOwnership('${data.userId}')` });
                    }
                    if (data.error) {
                        document.querySelector('.user-role[data-id="' + event.target.dataset.id + '"]').selectedIndex = participant.status;
                        return toast({ title: 'Erreur', message: data.error, type: 'error' });
                    }

                    toast({ title: 'Succès', message: data.message, type: 'success' });
                });
        });
        const roles = ['Propriétaire', 'Collaborateur', 'Participant', 'Banni'];
        for (let i = 0; i < roles.length; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = roles[i];
            select.appendChild(option);
        }
        select.selectedIndex = participant.status;
        user.appendChild(select);
        participantsContainer.prepend(user);
    };
    participants.forEach(participant => createParticipant(participant));
}
function giveAppOwnership(id) {
    fetch('/app/giveOwnership/' + app.infos._id, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: id }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                return toast({ title: 'Erreur', message: data.error, type: 'error' });
            }
            toast({ title: 'Succès', message: data.message, type: 'success' });
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
}
async function modifyApp() {
    const file = document.getElementById('alumet-background').files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', document.getElementById('appName').value);
    formData.append('description', document.getElementById('appDescription').value);
    formData.append('subject', document.getElementById('appSubject').value);
    formData.append('chat', document.getElementById('appChat').checked);
    formData.append('discovery', document.getElementById('appDiscovery').checked);
    formData.append('app', app.infos._id);
    formData.append('security', document.querySelector('.radio-option > label > input:checked').id);
    formData.append('password', document.getElementById('password-input').value);
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

function addCollaborators() {
    document.querySelector('.user-popup').classList.add('active-popup');
    document.querySelectorAll('.selected-user').forEach(user => user.classList.remove('selected-user'));
    participants = [];
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
        head: "Suppression de l'application",
        desc: 'Êtes-vous sûr de vouloir supprimer cette application ? Cette action est irréversible et entraînera la suppression de toutes les données associées à cet alumet.',
        action: `deleteItem()`,
    });
}

function deleteItem() {
    fetch('/mail/a2f', {
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
                head: 'Confirmation de suppression',
                desc: "Un code de sécurité vous a été envoyé par mail. Veuillez le saisir ci-dessous pour confirmer la suppression de l'application. ",
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

const editors = document.querySelectorAll('.editor');
let oldLink = null;

editors.forEach(editor => {
    editor.addEventListener('input', function () {
        const text = editor.textContent;
        const linkRegex = /(https?:\/\/[^\s]+\.[a-z]{2,}\S*)/gi;
        let match;
        while ((match = linkRegex.exec(text)) !== null) {
            const link = match[1];
            if (link !== oldLink) {
                let x = editor.innerHTML;
                x = x.replace(/&amp;/g, '&');
                editor.innerHTML = x = x.replace(link, '');
                handleLink(link);
            }
            oldLink = link;
        }
    });

    editor.addEventListener('paste', function (event) {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                event.preventDefault();
                document.querySelector('.drop-box').click();
                return;
            }
        }
    });
});
function makeBold() {
    document.execCommand('bold');
    if (document.getElementById('bold').isToggled) {
        document.getElementById('bold').isToggled = false;
    } else {
        document.getElementById('bold').isToggled = true;
    }
}

let isToggled = false;
function makeHighlight() {
    document.execCommand('hiliteColor', false, 'yellow');
    if (isToggled) {
        document.execCommand('hiliteColor', false, 'transparent');
        isToggled = false;
    } else {
        document.execCommand('hiliteColor', false, 'yellow');
        isToggled = true;
    }
}

function makeItalic() {
    document.execCommand('italic');
    if (document.getElementById('italic').isToggled) {
        document.getElementById('italic').isToggled = false;
    } else {
        document.getElementById('italic').isToggled = true;
    }
}

function doUnderline() {
    document.execCommand('underline');
    if (document.getElementById('underline').isToggled) {
        document.getElementById('underline').isToggled = false;
    } else {
        document.getElementById('underline').isToggled = true;
    }
}

function handleLink(link) {
    document.querySelector('.link-preview').classList.add('active-link-loading', 'active-link-preview');
    fetch('/preview/meta?url=' + link)
        .then(res => res.json())
        .then(data => {
            document.getElementById('preview-title').innerText = data.title || data['og:title'] || getDomainFromUrl(link);
            document.querySelector('.link-preview').style.backgroundImage = `url(${data.image || data['og:image'] || '../assets/preview/site.png'})`;
            document.getElementById('preview-link').innerText = data.url || link;
            document.querySelector('.link-preview').classList.remove('active-link-loading');
            localStorage.setItem('link', link);
        });
}

function removeLink() {
    document.querySelector('.link-preview').classList.remove('active-link-preview');
    oldLink = null;
    localStorage.removeItem('link');
}

function getDomainFromUrl(url) {
    const a = document.createElement('a');
    a.href = url;
    return a.hostname;
}

document.querySelectorAll('.colorSelector > div').forEach(color => {
    color.addEventListener('click', () => {
        document.querySelector('.colorSelector > div.selectedColor').classList.remove('selectedColor');
        color.classList.add('selectedColor');
        selectedColor = document.querySelector('.colorSelector > div.selectedColor').id;
    });
});

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
                    resolve(data.file);
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}

document.getElementById('passwordLink').addEventListener('click', () => {
    if (document.getElementById('passwordLink').checked) {
        document.querySelector('.app-link').value = window.location.protocol + '//' + window.location.host + '/portal/' + app.infos._id + (app.infos.password ? '?password=' + app.infos.password : '');
    } else {
        document.querySelector('.app-link').value = window.location.protocol + '//' + window.location.host + '/portal/' + app.infos._id;
    }
});
