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
      action: 'confirmPassword()'
  });
});
function confirmPassword() {
  let oldPassword = document.getElementById('prompt-input').value;
  createPrompt({
    head: 'Nouveau mot de passe',
    placeholder: 'Tapez votre nouveau mot de passe',
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
});
