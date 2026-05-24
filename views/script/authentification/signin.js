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
                toast({ title: 'Error', message: data.error, type: 'error', duration: 2500 });
                document.querySelector('.full-screen').style.display = 'none';
            } else if (data.a2f == true) {
                document.querySelector('.login-container').classList.remove('activeStep');
                document.querySelector('.verify').classList.add('activeStep');
                document.querySelector('.full-screen').style.display = 'none';
            } else {
                toast({ title: 'Success', message: 'You are signed in.', type: 'success', duration: 2500 });
                setTimeout(() => {
                    handleRedirect();
                }, 1500);
            }
        })
        .catch(err => {
            toast({ title: 'Error', message: 'An error occurred.', type: 'error', duration: 2500 });
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
                toast({ title: 'Error', message: data.error, type: 'error', duration: 6000 });
                document.querySelector('.full-screen').style.display = 'none';
            } else {
                toast({ title: 'Success', message: 'You are signed in.', type: 'success', duration: 2500 });
                handleRedirect();
            }
        });
}

function handleReset() {
    if (document.getElementById('mail').value == '') {
        return toast({ title: 'Error', message: 'Please enter an email address.', type: 'error', duration: 6000 });
    }
    document.querySelector('.full-screen').style.display = 'flex';
    fetch('/mail/a2f', {
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
                toast({ title: 'Error', message: data.error, type: 'error', duration: 3000 });
                document.querySelector('.full-screen').style.display = 'none';
            } else {
                document.querySelector('.login-container').classList.remove('activeStep');
                document.querySelector('.fg-passwd').classList.add('activeStep');
                document.querySelector('.full-screen').style.display = 'none';
            }
        });
}
function backToLogin() {
    document.querySelector('.fg-passwd').classList.remove('activeStep');
    document.querySelector('.login-container').classList.add('activeStep');
    document.querySelector('.full-screen').style.display = 'none';
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
                toast({ title: 'Error', message: data.error, type: 'error', duration: 6000 });
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

endLoading();
