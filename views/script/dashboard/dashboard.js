const navButtons = document.querySelectorAll('.nav > button');
const sections = document.querySelectorAll('.sections-container > section');


navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    navButtons.forEach((button) => button.classList.remove('active'));
    button.classList.add('active');
    sections.forEach((section) => section.classList.remove('active-section'));
    document.querySelector(`.${button.id}`).classList.add('active-section');
  });
});


toast({ title: 'Bienvenue !', message: 'Vous êtes connecté.', type: 'info', duration: 2500 });



document.getElementById('prompt-confirm').addEventListener('click', () => {
  document.querySelector('.prompt-popup').classList.remove('active-popup');
});

function createPrompt(object) {
  document.getElementById('prompt-red').style.display = 'none';
  document.getElementById('prompt-head').innerHTML = object.head;
  document.getElementById('prompt-input').placeholder = object.placeholder;
  document.getElementById('prompt-confirm').setAttribute('onclick', object.action);
  if (object.redAction) {
    document.getElementById('prompt-red').style.display = 'block';
    document.getElementById('prompt-red').innerHTML = object.redActionText;
    document.getElementById('prompt-red').setAttribute('onclick', object.redAction);
  }

  document.querySelector('.prompt-popup').classList.add('active-popup');
  document.getElementById('prompt-input').value = '';
}


const params = new URL(window.location).searchParams;
let redirect = params.get('redirect');
if (redirect) {
    const element = document.getElementById(`${redirect}`);
    if (element) {
        element.click();
    }
}
