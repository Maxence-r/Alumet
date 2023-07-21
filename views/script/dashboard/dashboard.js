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


const params = new URL(window.location).searchParams;
let redirect = params.get('redirect');
if (redirect) {
    const element = document.getElementById(`${redirect}`);
    if (element) {
        element.click();
    }
};

document.getElementById('close-conversation').addEventListener('click', () => {
  document.querySelector('.messages').classList.remove('active-messages');
  localStorage.removeItem('currentConversation');
});
