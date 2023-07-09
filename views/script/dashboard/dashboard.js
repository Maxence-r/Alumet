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

async function createPrompt(object) {
  document.getElementById('prompt-head').innerHTML = object.head;
  document.getElementById('prompt-input').placeholder = object.placeholder;
  document.getElementById('prompt-confirm').removeEventListener('click', onClick);
  document.getElementById('prompt-confirm').addEventListener('click', onClick);
  if (object.redAction) {
    document.getElementById('prompt-red').style.display = 'block';
    document.getElementById('prompt-red').innerHTML = object.redActionText;
    document.getElementById('prompt-red').addEventListener('click', object.redAction);
  } else {
    document.getElementById('prompt-red').style.display = 'none';
  }

  function onClick() {
    const input = document.getElementById('prompt-input');
    if (typeof object.function === 'function') {
      object.function(input.value);
    }
    document.querySelector('.prompt-popup').classList.remove('active-popup');
    document.getElementById('prompt-confirm').removeEventListener('click', onClick);
  }

  document.querySelector('.prompt-popup').classList.add('active-popup');

  const inputValue = await new Promise((resolve) => {
    document.getElementById('prompt-confirm').addEventListener('click', () => {
      const input = document.getElementById('prompt-input');
      resolve(input.value);
    });
  });

  document.getElementById('prompt-input').value = '';
  document.getElementById('prompt-red').style.display = 'none';
}



const params = new URL(window.location).searchParams;
let redirect = params.get('redirect');
if (redirect) {
    const element = document.getElementById(`${redirect}`);
    if (element) {
        element.click();
    }
}