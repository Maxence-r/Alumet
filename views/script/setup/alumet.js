async function createAlumet() {
    document.querySelector('.full-screen').style.display = 'flex';
    const file = document.getElementById('alumet-background').files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', document.getElementById('alumet-name').value);
    formData.append('description', document.getElementById('alumet-description').value);
    formData.append('collaborators', JSON.stringify(participants));
    formData.append('private', document.getElementById('alumet-private').checked);
    formData.append('chat', document.getElementById('alumet-chat').checked);
    fetch('/a/new', {
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

const userPrompt = document.querySelector('#user-prompt');
const debounceDelay = 500;
let debounceTimeoutId;

userPrompt.addEventListener('input', e => {
    clearTimeout(debounceTimeoutId);
    debounceTimeoutId = setTimeout(() => {
        const query = e.target.value;
        const type = 'user';
        searchUsers(query, type);
    }, debounceDelay);
});
