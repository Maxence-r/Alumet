const navButtons = document.querySelectorAll('.nav > button');
const sections = document.querySelectorAll('.sections-container > section');

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        navButtons.forEach(button => button.classList.remove('active'));
        button.classList.add('active');
        sections.forEach(section => section.classList.remove('active-section'));
        document.querySelector(`.${button.id}`).classList.add('active-section');
    });
});

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
}

fetch('/alumet')
    .then(response => response.json())
    .then(data => {
        if (data.alumets.length !== 0) document.querySelector('.alumets').innerHTML = '';
        data.alumets.forEach(alumet => {
            const alumetBox = createAlumetBox(alumet.title, alumet.lastUsage, alumet.background, alumet._id);
            document.querySelector('.alumets').appendChild(alumetBox);
        });
    });

function createAlumetBox(title, lastUsage, background, id) {
    const alumetBox = document.createElement('div');
    alumetBox.classList.add('alumet-box');

    const img = document.createElement('img');
    img.src = '/cdn/u/' + background;
    alumetBox.appendChild(img);

    const layerBlurInfo = document.createElement('div');
    layerBlurInfo.classList.add('layer-blur-info');
    alumetBox.appendChild(layerBlurInfo);

    const h4 = document.createElement('h4');
    h4.textContent = title;
    layerBlurInfo.appendChild(h4);

    const p = document.createElement('p');
    p.textContent = `Utilisé ${relativeTime(lastUsage)}`;
    layerBlurInfo.appendChild(p);

    alumetBox.setAttribute('onclick', `openAlumet('${id}')`);

    return alumetBox;
}

openAlumet = alumetId => {
    window.open(`/portal/${alumetId}`, '_blank');
};
