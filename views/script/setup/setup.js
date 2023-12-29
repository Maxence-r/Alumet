let appType = window.location.pathname.split('/')[3];

const apps = { flashcard: 'jeu de flashcards', mindmap: 'carte mentale', alumet: 'alumet' };
const titles = { alumet: 'un alumet', flashcard: 'un jeu de flashcards', mindmap: 'une carte mentale' };
const names = { alumet: 'l\'alumet', flashcard: 'le jeu de flashcards', mindmap: 'la carte mentale' };

document.title = `Créer ${titles[appType]}`;
document.getElementById('new-app-title').textContent = `Créer ${titles[appType]}`;
document.querySelectorAll('.app-name').forEach(text => {
    text.textContent = text.textContent.replace('l\'application', names[appType]);
});

document.querySelector('.alumet-background').addEventListener('click', () => {
    document.getElementById('alumet-background').click();
});

document.getElementById('alumet-background').addEventListener('change', () => {
    const file = document.getElementById('alumet-background').files[0];
    const fileType = file.type.split('/')[0];
    const fileSize = file.size / 1024 / 1024;
    if (fileType !== 'image' || fileSize > 3) {
        document.getElementById('alumet-background').value = '';
        return toast({ title: 'Erreur', message: 'Veuillez sélectionner une image de moins de 3MB', type: 'error', duration: 2500 });
    }
    document.querySelector('.alumet-background').src = URL.createObjectURL(file);
});

async function createApp() {
    document.querySelector('.full-screen').style.display = 'flex';
    const formData = new FormData();
    formData.append('file', document.getElementById('alumet-background').files[0]);
    formData.append('title', document.getElementById('app-name').value);
    formData.append('description', document.getElementById('app-description').value);
    formData.append('subject', document.getElementById('app-subject').options[document.getElementById('app-subject').selectedIndex].value);
    formData.append('collaborators', JSON.stringify(participants));
    formData.append('chat', document.getElementById('app-chat').checked);
    formData.append('security', document.querySelector('.radio-option > label > input:checked').id);
    formData.append('type', appType);
    fetch('/app/new', {
        method: 'PUT',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.querySelector('.full-screen').style.display = 'none';
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 });
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                toast({ title: 'Succès', message: `Votre ${apps[appType]} a bien été créé`, type: 'success', duration: 2500 });
                setTimeout(() => {
                    window.location.href = `/app/${data.alumet._id}`;
                }, 1000);
            }
        })
        .catch(error => {
            console.error(error);
        });
}

endLoading();