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

function joinAlumet() {
    createPrompt({
        head: 'Rejoindre un alumet',
        desc: "Si l'alumet est privé, vous devez entrez un code d'invitation ici.",
        placeholder: 'Entrer le code ici',
        action: 'authorizeAlumet()',
    });
}

function authorizeAlumet() {
    fetch('/portal/authorize/join', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            code: document.getElementById('prompt-input').value,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                return toast({
                    title: 'Erreur',
                    message: data.error,
                    type: 'error',
                    duration: 2500,
                });
            }
            toast({
                title: 'Succès',
                message: "Vous avez rejoint l'alumet !",
                type: 'success',
                duration: 2500,
            });
            setTimeout(() => {
                window.location.reload();
            }, 2500);
        })
        .catch(err => console.log(err));
}
