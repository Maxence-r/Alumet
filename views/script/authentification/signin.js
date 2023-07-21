const mailInput = document.getElementById('mail');
const passwordInput = document.getElementById('password');
const loginContainer = document.querySelector('.login-container');
const loginBtn = document.getElementById('login-btn');
const a2fLog = document.getElementById('a2f-log');
const a2fCodeInput = document.getElementById('a2f-code');

let a2fEnabled = false;

function signin() {
  const mail = mailInput.value;
  const password = passwordInput.value;
  loginContainer.classList.add('active-loading');
  fetch('/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mail,
      password
    })
  })
  .then(res => res.json())
  .then(data => {
    loginContainer.classList.remove('active-loading');
    if (data.error) {
      toast({ title: 'Quelque chose s\'est mal passé', message: `${data.error}`, type: 'error', duration: 3000 });
    } else if (data.a2f) {
      a2fEnabled = true;
      loginContainer.classList.add('active-a2f');
    } else {
      window.location = '../dashboard';
    }
  })
  .catch(error => console.error(error));
}

function authorize() {
  const mail = mailInput.value;
  const code = a2fCodeInput.value;
  loginContainer.classList.add('active-loading');
  fetch('/auth/authorize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mail,
      code
    })
  })
  .then(res => res.json())
  .then(data => {
    loginContainer.classList.remove('active-loading');
    if (data.error) {
      toast({ title: 'Quelque chose s\'est mal passé', message: `${data.error}`, type: 'error', duration: 30000 });
    } else {
      window.location = '../dashboard';
    }
  })
  .catch(error => console.error(error));
}

loginBtn.addEventListener('click', () => {
  if (!a2fEnabled) {
    signin();
  } else {
    authorize();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    if (!a2fEnabled) {
      signin();
    } else {
      authorize();
    }
  }
});

a2fLog.addEventListener('click', () => {
  authorize();
});

document.getElementById('forgot-password').addEventListener('click', () => {
  if (mailInput.value === '') {
    toast({ title: 'Quelque chose s\'est mal passé', message: 'Veuillez entrer votre adresse mail', type: 'error', duration: 3000 });
    return;
  }
  fetch('/auth/resetpassword', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mail: mailInput.value
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      toast({ title: 'Quelque chose s\'est mal passé', message: `${data.error}`, type: 'error', duration: 3000 });

    } else {
      toast({ title: 'Code envoyé', message: 'Un code de réinitialisation vous a été envoyé par mail', type: 'success', duration: 3000 });
      document.getElementsByClassName('login-container')[0].classList.add('active-forgot-password');
    }
  })
  .catch(error => console.error(error));
});

document.getElementById('log-reset-password').addEventListener('click', () => {
  fetch('/auth/resetpassword/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mail: mailInput.value,
      code: document.getElementById('code-reset-password').value,
      password: document.getElementById('new-password-input').value
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      toast({ title: 'Quelque chose s\'est mal passé', message: `${data.error}`, type: 'error', duration: 3000 });
    } else {
      toast({ title: 'Mot de passe modifié', message: 'Votre mot de passe a bien été modifié', type: 'success', duration: 3000 });
      setTimeout(() => {
          window.location.reload();
      }, 2500);
    }
  })
 });
