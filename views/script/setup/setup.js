async function createAlumet() {
    document.querySelector('.full-screen').style.display = 'flex';
    const file = document.getElementById('alumet-background').files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', document.getElementById('alumet-name').value);
    formData.append('description', document.getElementById('alumet-description').value);
    formData.append('collaborators', JSON.stringify(participants));
    formData.append('discovery', document.getElementById('alumet-private').checked);
    formData.append('chat', document.getElementById('alumet-chat').checked);
    formData.append('type', "alumet");
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
                }, 3500);
            } else {
                toast({ title: 'Succès', message: "L'alumet a bien été créé !", type: 'success', duration: 2500 });
                setTimeout(() => {
                    window.location.href = `/dashboard`;
                }, 1000);
            }
        })
        .catch(error => {
            console.error(error);
        });
}



document.querySelectorAll('.load-background').forEach(element => {
    element.addEventListener('click', () => {
        document.getElementById('alumet-background').click();
    });
});

let alumet_background = document.getElementById('alumet-background');

if (alumet_background) {
    alumet_background.addEventListener('change', () => {
        const file = document.getElementById('alumet-background').files[0];
        const fileType = file.type.split('/')[0];
        const fileSize = file.size / 1024 / 1024;
        if (fileType !== 'image' || fileSize > 3) {
            document.getElementById('alumet-background').value = '';
            return toast({ title: 'Erreur', message: 'Veuillez sélectionner une image de moins de 3MB', type: 'error', duration: 2500 });
        }
        document.querySelector('.alumet-background').src = URL.createObjectURL(file);
    });
}



function createFlashcards() {
    document.querySelector('.full-screen').style.display = 'flex';
    let title = document.getElementById('flashcards-name').value;
    let description = document.getElementById('flashcards-description').value;
    let selectSubject = document.getElementById('flashcards-subject').options[document.getElementById('flashcards-subject').selectedIndex].value;
    let isPublic = document.getElementById('flashcards-public').checked;
    fetch('/app/new', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            description,
            subject: selectSubject,
            discovery: isPublic,
            collaborators: participants,
            type: "flashcard",
        }),
    }).then(res => {
        res.json().then(data => {
            if (data.error) {
                document.querySelector('.full-screen').style.display = 'none';
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 });
                setTimeout(() => {
                    window.location.reload();
                }, 500);
                s;
            } else {
                toast({ title: 'Succès', message: "Le jeu de flashcard à bien été crée !", type: 'success', duration: 2500 });
                setTimeout(() => {
                    window.location.href = `/dashboard`;
                }, 2500);
            }
        });
    });
}

function createMindmap() {
    document.querySelector('.full-screen').style.display = 'flex';
    let title = document.getElementById('mindmap-name').value;
    let description = document.getElementById('mindmap-description').value;
    let selectSubject = document.getElementById('mindmap-subject').options[document.getElementById('mindmap-subject').selectedIndex].value;
    let isPublic = document.getElementById('mindmap-public').checked;
    fetch('/app/new', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            description,
            subject: selectSubject,
            discovery: isPublic,
            collaborators: participants,
            type: "mindmap",
        }),
    }).then(res => {
        res.json().then(data => {
            if (data.error) {
                document.querySelector('.full-screen').style.display = 'none';
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 });
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                toast({ title: 'Succès', message: "La mindmap à bien été crée !", type: 'success', duration: 2500 });
                setTimeout(() => {
                    window.location.href = `/dashboard`;
                }, 2500);
            }
        });
    });
}

endLoading();
