// Modify user informations

/** set up the div elements, etc from the html page */
let userName = document.querySelector('.user-infos > .sub-infos > h4');
let userMail = document.querySelector('.user-infos > .sub-infos > p');
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
    toggleA2FBtn.innerText = userInfos.isA2FEnabled ? 'Désactiver la verification par mail' : 'Activer la verification par mail';
    if (userInfos.isCertified) {
        const certified = document.createElement('img');
        certified.src = `/assets/badges/certified/${userInfos.accountType}-certified.svg`;
        certified.title = 'Compte ' + userInfos.accountType + ' certifié';
        certified.classList.add('badge');
        userName.appendChild(certified);
    }
}

getMyInfos()
    .then(() => {
        const userInfos = JSON.parse(localStorage.getItem('user'));
        socket.emit('joinDashboard', JSON.parse(localStorage.getItem('user')).id);
        updateInfos(userInfos);
    })
    .catch(error => {
        console.error('Error retrieving user information:', error);
    });

saveInfosBtn.addEventListener('click', () => {
    fetch('/profile/updateinfos', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: usernameField.value,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (!data.error) {
                const userInfos = JSON.parse(localStorage.getItem('user'));
                toast({ title: 'Informations modifiées !', message: 'Vos informations ont bien été modifiées.', type: 'success', duration: 2500 });
                localStorage.setItem('user', JSON.stringify({ ...userInfos, username: usernameField.value }));
            } else {
                toast({ title: 'Erreur !', message: data.error, type: 'error', duration: 2500 });
                usernameField.value = JSON.parse(localStorage.getItem('user')).username;
            }
        });
});

/** Change the password */

function handleReset() {
    fetch('/auth/a2f', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mail: JSON.parse(localStorage.getItem('user')).mail,
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
            mail: JSON.parse(localStorage.getItem('user')).mail,
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

/** Toggle the 2FA */
toggleA2FBtn.addEventListener('click', () => {
    fetch('/auth/a2f', {
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
                document.getElementById('toggleA2FBtn').innerText = !JSON.parse(localStorage.getItem('user')).isA2FEnabled ? 'Désactiver la verification par mail' : 'Activer la verification par mail';
                toast({ title: 'A2F modifié !', message: "Vos paramètres d'authentification à double facteur ont bien été modifiés.", type: 'success', duration: 2500 });
            } else {
                toast({ title: 'Erreur !', message: data.error, type: 'error', duration: 2500 });
            }
        })
        .catch(err => {
            console.error(err);
            toast({ title: 'Erreur !', message: 'Une erreur est survenue.', type: 'error', duration: 2500 });
        });
}
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
            const userInfos = JSON.parse(localStorage.getItem('user'));
            userInfos.icon = updateData.icon;
            localStorage.setItem('user', JSON.stringify(userInfos));
        } else {
            toast({ title: 'Erreur !', message: updateData.error, type: 'error', duration: 2500 });
        }
    } catch (error) {
        console.error(error);
        toast({ title: 'Erreur !', message: 'Une erreur est survenue.', type: 'error', duration: 2500 });
    }
});
