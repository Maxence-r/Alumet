const appTypeByPath = { alumets: 'alumet', flashcards: 'flashcard', mindmaps: 'mindmap' };
let appType = appTypeByPath[window.location.pathname.split('/')[1]] || 'alumet';

const apps = { flashcard: 'flashcard set', mindmap: 'mind map', alumet: 'alumet' };
const titles = { alumet: 'un alumet', flashcard: 'un flashcard set', mindmap: 'une mind map' };
const names = { alumet: 'l\'alumet', flashcard: 'le flashcard set', mindmap: 'la mind map' };

document.title = `Create ${titles[appType]}`;
document.getElementById('new-app-title').textContent = `Create ${titles[appType]}`;
document.querySelectorAll('.app-name').forEach(text => {
    text.textContent = text.textContent.replace('l\'application', names[appType]);
});
document.querySelectorAll('.app-name').forEach(text => { text.textContent = text.textContent.replace('de le', 'du') });

document.querySelector('.alumet-background').addEventListener('click', () => {
    document.getElementById('alumet-background').click();
});

document.getElementById('alumet-background').addEventListener('change', () => {
    const file = document.getElementById('alumet-background').files[0];
    const fileType = file.type.split('/')[0];
    const fileSize = file.size / 1024 / 1024;
    if (fileType !== 'image' || fileSize > 3) {
        document.getElementById('alumet-background').value = '';
        return toast({ title: 'Error', message: 'Please select an image under 3 MB', type: 'error', duration: 2500 });
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
    fetch('/api/alumets', {
        method: 'POST',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.querySelector('.full-screen').style.display = 'none';
                toast({ title: 'Error', message: data.error, type: 'error', duration: 7500 });
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                toast({ title: 'Success', message: `Your ${apps[appType]} has been created successfully`, type: 'success', duration: 2500 });
                setTimeout(() => {
                    window.location.href = appUrl(data.alumet._id, data.alumet.type);
                }, 1000);
            }
        })
        .catch(error => {
            console.error(error);
        });
}

endLoading();
