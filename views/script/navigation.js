const navButtons = document.querySelectorAll('.navbar > button');
const sections = document.querySelectorAll('.overlay > div');
const navbarMenu = document.querySelector('.menu');
const burgerMenu = document.getElementById('burger');

function navbar(id, currentItem, newItem) {
    if (currentItem) {
        localStorage.setItem('currentItem', currentItem);
    }
    if (id == 'home') {
        burgerMenu.classList.remove('is-active');
        document.querySelector('.overlay').classList.remove('active-layer');
    } else {
        document.querySelector('.overlay').classList.add('active-layer');
    }
    if (newItem == 'post') {
        postToEdit = null;
        document.querySelector('.post-buttons > .reded').style.display = 'none';
        clearPost();
    } else if (newItem == 'wall') {
        document.querySelector('.wall').classList.remove('editing');
        wallToEdit = null;
        clearWall();
    }

    navButtons.forEach(button => button.classList.remove('navbar-active'));
    const element = document.getElementById(id);
    if (element) {
        element.classList.add('navbar-active');
    }
    sections.forEach(section => section.classList.remove('active-section'));
    if (id !== 'home') {
        burgerMenu.classList.add('is-active');
        document.querySelector(`.${id}`).classList.add('active-section');
    }
}

if (burgerMenu && navbarMenu) {
    burgerMenu.addEventListener('click', () => {
        if (burgerMenu.classList.contains('is-active')) {
            burgerMenu.classList.remove('is-active');
            sections.forEach(section => section.classList.remove('active-section'));
            document.querySelector('.overlay').classList.remove('active-layer');
        } else {
            burgerMenu.classList.add('is-active');
            navbarMenu.classList.add('active-section');
            document.querySelector('.overlay').classList.add('active-layer');
        }
    });
}

const overlay = document.querySelector('.overlay');
const overlayContent = document.querySelectorAll('.overlay-content');
let isMouseDownOnOverlayContent = false;

overlayContent.forEach(function (content) {
    content.addEventListener('mousedown', function () {
        isMouseDownOnOverlayContent = true;
    });
});

overlay.addEventListener('click', function (event) {
    if (!event.target.closest('.overlay-content') && !isMouseDownOnOverlayContent) {
        overlay.classList.remove('active-layer');
        sections.forEach(section => section.classList.remove('active-section'));
        navButtons.forEach(button => button.classList.remove('navbar-active'));
        document.getElementById('home').classList.add('navbar-active');
    }
    isMouseDownOnOverlayContent = false;
});

function loadParticipants(participants, collaborators, admin) {
    const participantsContainer = document.querySelector('.participants-container');
    if (participants.length === 0 && collaborators.length === 0) return;
    participantsContainer.innerHTML = '';

    const createParticipant = (participant, role) => {
        const user = document.createElement('div');
        user.classList.add('user');
        user.dataset.id = participant._id;
        if (admin) user.setAttribute('onclick', `deleteParticipant("${participant._id}")`);
        const userImage = document.createElement('img');
        userImage.src = `/cdn/u/${participant.icon}`;

        const userInfo = document.createElement('div');
        const userName = document.createElement('h3');
        userName.textContent = `${participant.name} ${participant.lastname}`;
        const userRole = document.createElement('p');
        userRole.textContent = role;
        userInfo.appendChild(userName);
        userInfo.appendChild(userRole);

        user.appendChild(userImage);
        user.appendChild(userInfo);
        participantsContainer.prepend(user);
    };

    participants.forEach(participant => createParticipant(participant, 'Participant'));
    collaborators.forEach(collaborator => createParticipant(collaborator, 'Collaborateur'));
}
