// Modify user informations

/** set up the div elements, etc from the html page */
let userName = document.querySelector('.user-infos > .user-details > h3');
let userMail = document.querySelector('.user-infos > .user-details > p');
let userIcon = document.querySelector('.user-infos > img');

let userFirstNameInput = document.getElementById('firstnameField');
let userLastNameInput = document.getElementById('lastnameField');
let userMailInput = document.getElementById('mailField');
let usernameField = document.getElementById('usernameField');

let saveInfosBtn = document.getElementById('saveInfosBtn');
let changePasswordBtn = document.getElementById('changePasswordBtn');
let toggleA2FBtn = document.getElementById('toggleA2FBtn');
let deleteAccountBtn = document.getElementById('deleteAccountBtn');

/** Get the user informations and display them*/
function updateInfos(userInfos) {
    userName.innerText = userInfos.name + ' ' + userInfos.lastname;
    userMail.innerText = userInfos.mail;
    usernameField.value = userInfos.username;

    userIcon.src = '/cdn/u/' + userInfos.icon;
    userIcon.alt = 'user icon';

    userFirstNameInput.value = userInfos.name;
    userLastNameInput.value = userInfos.lastname;
    userMailInput.value = userInfos.mail;
    toggleA2FBtn.innerText = userInfos.isA2FEnabled ? 'Désactiver la vérification par mail' : 'Activer la vérification par mail';
    if (userInfos.badges) {
        userInfos.badges.forEach(badge => {
            const badgeImg = document.createElement('img');
            badgeImg.src = `/assets/badges/${badge}.svg`;
            badgeImg.title = badge;
            badgeImg.classList.add('badge');
            badgeImg.setAttribute('draggable', false);
            userName.appendChild(badgeImg);
        });
    }
    userInfos.notifications.forEach(notification => {
        document.getElementById(notification).checked = true;
    });
}

function createNotifications(invitations) {
    if (invitations.length !== 0) {
        document.querySelector('.notifications-container > .information').style.display = 'none';
        document.querySelector('[data-module="notifications-container"] > .redot').style.display = 'block';
        document.querySelector('.ping').style.display = 'block';
    }
    invitations.forEach(invitation => {
        const notificationElement = document.createElement('div');
        notificationElement.classList.add('notification');

        let invitationElement = document.createElement('div');
        invitationElement.classList.add('invitation');

        let subInfosElement = document.createElement('div');
        let nameElement = document.createElement('h3');

        nameElement.textContent = invitation.inviter + ' vous à invité à collaborer sur "' + invitation.applicationName + '".';
        let roleElement = document.createElement('p');
        roleElement.textContent = relativeTime(invitation.createdAt);
        subInfosElement.appendChild(nameElement);
        subInfosElement.appendChild(roleElement);

        invitationElement.appendChild(subInfosElement);
        notificationElement.appendChild(invitationElement);

        notificationElement.setAttribute('onclick', `window.location.href = '/invitation/${invitation.invitationId}'`);

        document.querySelector('.notifications-container').appendChild(notificationElement);
    });
}

/* getMyInfos()
    .then(json => {
        createNotifications(json.invitationsToSend);
        socket.emit('joinDashboard', user._id);
        updateInfos(user);
    })
    .catch(error => {
        console.error('Error retrieving user information:', error);
    });
 */

/** Change the password */

function handleReset() {
    fetch('/mail/a2f', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mail: identity.user.mail,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 6000 });
                document.querySelector('.full-screen').style.display = 'none';
            } else {
                return toast({ title: 'Code envoyé !', message: 'Un code de vérification vous a été envoyé par mail.', type: 'success', duration: 2500 });
            }
        });
}

function resetPassword(code) {
    document.querySelector('.full-screen').style.display = 'flex';
    fetch('/auth/resetpassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mail: identity.user.mail,
            code: code,
            password: document.getElementById('prompt-input').value,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 6000 });
            } else {
                return toast({ title: 'Mot de passe modifié !', message: 'Votre mot de passe a bien été modifié.', type: 'success', duration: 2500 });
            }
        });
}
changePasswordBtn.addEventListener('click', () => {
    handleReset();
    createPrompt({
        head: 'Un code de sécurité vous a été envoyer',
        placeholder: 'Entrez le code reçu par mail',
        desc: 'Veuillez entrer le code de sécurité que vous avez reçu par mail.',
        action: 'confirmPassword()',
    });
});
function confirmPassword() {
    let code = document.getElementById('prompt-input').value;
    createPrompt({
        head: 'Nouveau mot de passe',
        desc: 'Veuillez entrer votre nouveau mot de passe sécurisé de 6 caractères minimum.',
        placeholder: 'Tapez votre nouveau mot de passe',
        placeholderType: 'password',
        action: `resetPassword('${code}')`,
    });
}

// SECTION - A2F
toggleA2FBtn.addEventListener('click', () => {
    fetch('/mail/a2f', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(data => {
            if (!data.error) {
                createPrompt({
                    head: 'Code de vérification',
                    desc: 'Un code de vérification vous a été envoyé par mail.',
                    placeholder: 'Tapez votre code de vérification',
                    action: `confirmA2F()`,
                });
            } else {
                toast({ title: 'Erreur !', message: data.error, type: 'error', duration: 2500 });
            }
        });
});

function confirmA2F() {
    let a2fCode = document.getElementById('prompt-input').value;
    fetch('/profile/toggleA2f', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            code: a2fCode,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (!data.error) {
                document.getElementById('toggleA2FBtn').innerText = data.isA2FEnabled ? 'Désactiver la vérification par mail' : 'Activer la vérification par mail';
                toast({ title: 'A2F modifié !', message: "Vos paramètres d'authentification à double facteurs ont bien été modifiés.", type: 'success', duration: 2500 });
            } else {
                toast({ title: 'Erreur !', message: data.error, type: 'error', duration: 2500 });
            }
        })
        .catch(err => {
            console.error(err);
            toast({ title: 'Erreur !', message: 'Une erreur est survenue.', type: 'error', duration: 2500 });
        });
}
//!SECTION  - A2F
document.getElementById('profile-picture').addEventListener('click', () => {
    document.getElementById('profile-picture-input').click();
});

document.getElementById('profile-picture-input').addEventListener('change', async () => {
    const file = document.getElementById('profile-picture-input').files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
        let fileName = document.getElementById('profile-picture-input').value;
        let fileSize = file.size;
        let idxDot = fileName.lastIndexOf('.') + 1;
        let extFile = fileName.substr(idxDot, fileName.length).toLowerCase();
        if (extFile !== 'jpg' && extFile !== 'jpeg' && extFile !== 'png') {
            return toast({ title: 'Erreur !', message: 'Seuls les fichiers jpg, jpeg et png sont autorisés !', type: 'error', duration: 2500 });
        }
        if (fileSize > 1 * 1024 * 1024) {
            return toast({ title: 'Erreur !', message: "La taille de l'image ne doit pas dépasser 1 Mo !", type: 'error', duration: 2500 });
        }

        const updateResponse = await fetch('/profile/updateicon', {
            method: 'PUT',
            body: formData,
        });
        const updateData = await updateResponse.json();
        if (!updateData.error) {
            toast({ title: 'Image de profil modifiée !', message: 'Votre image de profil a bien été modifiée', type: 'success', duration: 2500 });
            document.getElementById('profile-picture').src = '/cdn/u/' + updateData.icon;
            document.getElementById('profile-picture').alt = 'user icon';
            const userInfos = identity.user;
            userInfos.icon = updateData.icon;
            user = userInfos;
        } else {
            toast({ title: 'Erreur !', message: updateData.error, type: 'error', duration: 2500 });
        }
    } catch (error) {
        console.error(error);
        toast({ title: 'Erreur !', message: 'Une erreur est survenue.', type: 'error', duration: 2500 });
    }
});

function saveSettings() {
    let messageP = document.getElementById('messageP').checked;
    let messageG = document.getElementById('messageG').checked;
    let invitationC = document.getElementById('invitationC').checked;
    let alumetA = document.getElementById('alumetA').checked;
    let commentP = document.getElementById('commentP').checked;
    let experiments = document.getElementById('experiments').checked;
    let username = document.getElementById('usernameField').value;
    fetch('/profile/updateinfos', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            messageP: messageP,
            messageG: messageG,
            invitationC: invitationC,
            commentP: commentP,
            experiments: experiments,
            alumetA: alumetA,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (!data.error) {
                toast({ title: 'Paramètres modifiés !', message: 'Vos paramètres ont bien été modifiés.', type: 'success', duration: 2500 });
            } else {
                toast({ title: 'Erreur !', message: data.error, type: 'error', duration: 2500 });
            }
        })
        .catch(err => {
            console.error(err);
            toast({ title: 'Erreur !', message: 'Une erreur est survenue.', type: 'error', duration: 2500 });
        });
}
