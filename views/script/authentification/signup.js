document.querySelectorAll('.options > div').forEach(div => {
    console.log(div);
    div.addEventListener('click', e => {
        document.querySelectorAll('.options > div').forEach(div => {
            div.classList.remove('selectedOption');
        });
        div.classList.add('selectedOption');
    });
});
let accountType;
document.querySelector('.continue').addEventListener('click', e => {
    let selectedOption = document.querySelector('.selectedOption');
    if (!selectedOption) return;
    accountType = selectedOption.id;
    if (accountType == 'student') {
        return toast({ title: 'Erreur', message: 'Les inscriptions étudiants ouvrirons à la rentrée', type: 'warning', duration: 6000 })
    }
    document.querySelector(`.signup`).classList.add('activeStep');
    document.querySelector(`.choose`).classList.remove('activeStep');
});

const allowedDomains = [
    'ac-rennes.fr',
    'ac-caen.fr',
    'ac-amiens.fr',
    'ac-lille.fr',
    'ac-reims.fr',
    'ac-nancy-metz.fr',
    'ac-strasbourg.fr',
    'ac-versailles.fr',
    'ac-paris.fr',
    'ac-creteil.fr',
    'ac-nantes.fr',
    'ac-orleans-tours.fr',
    'ac-dijon.fr',
    'ac-besancon.fr',
    'ac-poitiers.fr',
    'ac-clermont.fr',
    'ac-lyon.fr',
    'ac-bordeaux.fr',
    'ac-grenoble.fr',
    'ac-toulouse.fr',
    'ac-montpellier.fr',
    'ac-aix-marseille.fr',
    'ac-nice.fr',
    'ac-corse.fr',
    'ac-martinique.fr',
    'ac-guadeloupe.fr',
    'ac-reunion.fr',
    'ac-guyane.fr',
    'ac-mayotte.fr',
    'easyvista.fr',
];
let nameInput;
let lastnameInput;
let mailInput;
let passwordInput;

function verify() {
    nameInput = document.getElementById('name');
    lastnameInput = document.getElementById('lastname');
    mailInput = document.getElementById('mail');
    passwordInput = document.getElementById('password');

    if (nameInput.value.length < 2) {
        return toast({ title: 'Erreur', message: 'Le prénom doit faire au moins 2 caractères', type: 'error', duration: 6000 });
    }

    if (lastnameInput.value.length < 2) {
        return toast({ title: 'Erreur', message: 'Le nom doit faire au moins 2 caractères', type: 'error', duration: 6000 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailDomain = mailInput.value.split('@')[1];

    if (!emailRegex.test(mailInput.value) || (accountType == 'professor' && !allowedDomains.includes(emailDomain))) {
        return toast({ title: 'Erreur', message: 'Utiliser une adresse mail académique, @ac-{region}.fr', type: 'error', duration: 6000 });
    }

    if (passwordInput.value.length < 6) {
        return toast({ title: 'Erreur', message: 'Le mot de passe doit faire au moins 6 caractères', type: 'error', duration: 6000 });
    }
    send2FA(mailInput.value);
}

function send2FA(mail) {
    document.querySelector('.full-screen').style.display = 'flex';
    fetch('/mail/a2f', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mail,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 6000 });
            }
            document.querySelector('.full-screen').style.display = 'none';
            document.querySelector('.signup').classList.remove('activeStep');
            document.querySelector('.verify').classList.add('activeStep');
        });
}

document.querySelector('.confirm').addEventListener('click', e => {
    document.querySelector('.full-screen').style.display = 'flex';
    fetch('/auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: nameInput.value,
            lastname: lastnameInput.value,
            mail: mailInput.value,
            password: passwordInput.value,
            accountType,
            code: document.getElementById('code').value,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 6000 });
            } else {
                window.location.href = '/auth/signin';
            }
            document.querySelector('.full-screen').style.display = 'none';
        });
});

endLoading();
