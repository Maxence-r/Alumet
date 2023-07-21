// Modify user informations

/** set up the div elements, etc from the html page */
let userName = document.querySelector('.user-infos > .sub-infos > h4');
let userMail = document.querySelector('.user-infos > .sub-infos > p');
let userIcon = document.querySelector('.user-infos > img');

let userFirstNameInput = document.getElementById('firstnameField');
let userLastNameInput = document.getElementById('lastnameField');
let userMailInput = document.getElementById('mailField');

let saveInfosBtn = document.getElementById('saveInfosBtn');
let changePasswordBtn = document.getElementById('changePasswordBtn');
let toggleA2FBtn = document.getElementById('toggleA2FBtn');
let deleteAccountBtn = document.getElementById('deleteAccountBtn');

/** Get the user informations and display them*/
function updateInfos(userInfos) {
  userName.innerText = userInfos.name + ' ' + userInfos.lastname;
  userMail.innerText = userInfos.mail;
  userIcon.src = '/cdn/u/' + userInfos.icon;
  userFirstNameInput.value = userInfos.name;
  userLastNameInput.value = userInfos.lastname;
  userMailInput.value = userInfos.mail;
  toggleA2FBtn.innerText = userInfos.isA2FEnabled ? 'Désactiver la verification par mail' : 'Activer la verification par mail';
}

getMyInfos()
  .then(() => {
    const userInfos = JSON.parse(localStorage.getItem('user'));
    updateInfos(userInfos);
  })
  .catch(error => {
    console.error('Error retrieving user information:', error);
  });
saveInfosBtn.addEventListener('click', () => {
    fetch('/profile/updateinfos', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: userFirstNameInput.value,
            lastname: userLastNameInput.value,
            mail: userMailInput.value
        })
    })
    .then(res => res.json())
    .then(data => {
        if (!data.error) {
          const userInfos = JSON.parse(localStorage.getItem('user'));
            toast({ title: 'Informations modifiées !', message: 'Vos informations ont bien été modifiées.', type: 'success', duration: 2500 });
            userInfos.name = userFirstNameInput.value;
            userInfos.lastname = userLastNameInput.value;
            userInfos.mail = userMailInput.value;
            localStorage.setItem('user', JSON.stringify(userInfos));
            updateInfos(userInfos);
        } else {
            toast({ title: 'Erreur !', message: data.error, type: 'error', duration: 2500 });
        }
    }
    )
});

/** Change the password */
changePasswordBtn.addEventListener('click', () => {
  createPrompt({
      head: 'Confirmez votre mot de passe',
      placeholder: 'Tapez votre mot de passe',
      placeholderType: 'password',
      action: 'confirmPassword()',

  });
});
function confirmPassword() {
  let oldPassword = document.getElementById('prompt-input').value;
  createPrompt({
    head: 'Nouveau mot de passe',
    placeholder: 'Tapez votre nouveau mot de passe',
    placeholderType: 'password',
    action: `changePassword("${oldPassword}")`,
  });
}
function changePassword(oldPassword) {
  let newPassword = document.getElementById('prompt-input').value;
  fetch('/profile/changepassword', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      oldPassword: oldPassword,
      newPassword: newPassword
    })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.error) {
      toast({ title: 'Mot de passe modifié !', message: 'Votre mot de passe a bien été modifié.', type: 'success', duration: 2500 });
    } else {
      toast({ title: 'Erreur !', message: data.error, type: 'error', duration: 2500 });
    }
  })
  .catch(err => {
    toast({ title: 'Erreur !', message: 'Une erreur est survenue.', type: 'error', duration: 2500 });
  });
}

/** Toggle the 2FA */
toggleA2FBtn.addEventListener('click', () => {
  fetch('/auth/a2f', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
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
  })
});

function confirmA2F() {
  let a2fCode = document.getElementById('prompt-input').value;
  fetch('/profile/toggleA2f', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: a2fCode,
    })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.error) {
      document.getElementById('toggleA2FBtn').innerText = !JSON.parse(localStorage.getItem('user')).isA2FEnabled ? 'Désactiver la verification par mail' : 'Activer la verification par mail';
      toast({ title: 'A2F modifié !', message: 'Vos paramètres d\'authentification à double facteur ont bien été modifiés.', type: 'success', duration: 2500 });
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
  console.log('click');
  document.getElementById('profile-picture-input').click();
}
);

document.getElementById('profile-picture-input').addEventListener('change', async () => {
  const file = document.getElementById('profile-picture-input').files[0];
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await fetch('/cdn/upload/system', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!data.error) {
      const updateResponse = await fetch('/profile/updateicon', {
        method: 'PUT',
        body: JSON.stringify({
          icon: data.file._id
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const updateData = await updateResponse.json();
      if (!updateData.error) {
        toast({ title: 'Image de profil modifiée !', message: 'Votre image de profil a bien été modifiée', type: 'success', duration: 2500 });
        document.getElementById('profile-picture').src = '/cdn/u/' + updateData.icon;
        const userInfos = JSON.parse(localStorage.getItem('user'));
        userInfos.icon = updateData.icon;
        localStorage.setItem('user', JSON.stringify(userInfos));
      } else {
        toast({ title: 'Erreur !', message: updateData.error, type: 'error', duration: 2500 });
      }
    } else {
      toast({ title: 'Erreur !', message: data.error, type: 'error', duration: 2500 });
    }
  } catch (error) {
    console.error(error);
    toast({ title: 'Erreur !', message: 'Une erreur est survenue.', type: 'error', duration: 2500 });
  }
});