function login() {
    document.querySelector('.full-screen').style.display = 'flex';
    fetch('/auth/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mail: document.getElementById('mail').value,
            password: document.getElementById('password').value,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 2500 });
                document.querySelector('.full-screen').style.display = 'none';
            } else if (data.a2f == true) {
                document.querySelector('.login-container').classList.remove('activeStep');
                document.querySelector('.verify').classList.add('activeStep');
                document.querySelector('.full-screen').style.display = 'none';
            } else {
                toast({ title: 'Succès', message: 'Vous êtes connecté !', type: 'success', duration: 2500 });
                handleRedirect();
            }
        })
        .catch(err => {
            toast({ title: 'Erreur', message: 'Une erreur est survenue.', type: 'error', duration: 2500 });
            document.querySelector('.full-screen').style.display = 'none';
        });
}

function authorizeCode() {
    document.querySelector('.full-screen').style.display = 'flex';
    fetch('/auth/authorize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mail: document.getElementById('mail').value,
            code: document.getElementById('code').value,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 6000 });
                document.querySelector('.full-screen').style.display = 'none';
            } else {
                toast({ title: 'Succès', message: 'Vous êtes connecté !', type: 'success', duration: 2500 });
                handleRedirect();
            }
        });
}

function handleReset() {
    if (document.getElementById('mail').value == '') {
        return toast({ title: 'Erreur', message: 'Veuillez entrer une adresse mail.', type: 'error', duration: 6000 });
    }
    document.querySelector('.full-screen').style.display = 'flex';
    fetch('/auth/a2f', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mail: document.getElementById('mail').value,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 6000 });
                document.querySelector('.full-screen').style.display = 'none';
            } else {
                document.querySelector('.login-container').classList.remove('activeStep');
                document.querySelector('.fg-passwd').classList.add('activeStep');
                document.querySelector('.full-screen').style.display = 'none';
            }
        });
}

function resetPassword() {
    document.querySelector('.full-screen').style.display = 'flex';
    fetch('/auth/resetpassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mail: document.getElementById('mail').value,
            code: document.getElementById('auth-code').value,
            password: document.getElementById('new-password').value,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 6000 });
                document.querySelector('.full-screen').style.display = 'none';
            } else {
                window.location.reload();
            }
        });
}

function handleRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    if (redirect === 'loginCallback') {
        window.close();
    } else {
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 500);
    }
}
