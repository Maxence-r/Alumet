document.querySelector('.drop-box').addEventListener('click', e => {
    if (e.target.classList.contains('drop-box')) {
        document.querySelector('.drop-box > input').click();
    }
});

document.querySelector('.drop-box > input').addEventListener('change', e => {
    const files = e.currentTarget.files;
    if (files.length === 0) {
        document.querySelector('.drop-box').classList.remove('ready-to-send');
        return;
    }
    document.getElementById('numbers-of-files').innerText = `${files.length}`;
    document.querySelector('.drop-box').classList.add('ready-to-send');
});

function cancelSend() {
    document.querySelector('.drop-box').classList.remove('ready-to-send');
    document.querySelector('.drop-box > input').value = '';
}

async function sendFiles() {
    const filesToUpload = document.querySelector('.drop-box > input').files;
    const fileInfoHead = document.querySelector('.file-sending-infos > h3');
    const fileInfoSub = document.querySelector('.file-sending-infos > p');
    const progress = document.querySelector('.progress');
    const progressRatio = 100 / filesToUpload.length;

    document.querySelector('.drop-box').classList.remove('ready-to-send');
    document.querySelector('.drop-box').classList.add('sending-data');
    let index = 0;
    try {
        for (const file of filesToUpload) {
            const formData = new FormData();
            formData.append('file', file);
            fileInfoHead.innerHTML = `<span>Envoi de</span> ${file.name}`;
            fileInfoSub.innerHTML = `${files.length} fichier(s) à envoyer`;
            const response = await fetch(`/cdn/upload/${localStorage.getItem('currentFolder')}`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            const folder = files.find(folder => folder._id === localStorage.getItem('currentFolder'));

            if (folder) {
                folder.uploads.push(data.file);
            }
            document.querySelector('.files-items').prepend(createFileElement(data.file));

            index++;
            const fileProgress = index * progressRatio;
            progress.style.width = `${fileProgress}%`;
        }

        document.querySelector('.drop-box > input').value = '';
        let audio = new Audio('../assets/sounds/success.mp3');
        audio.play();
        progress.style.width = '0%';
        document.querySelector('.files-items > .full-screen').style.display = 'none';
        document.querySelector('.drop-box').classList.remove('sending-data');

    } catch (error) {
        toast({
            title: 'Erreur',
            message: `${error}`,
            type: 'error',
            duration: 5000,
        });
        document.querySelector('.drop-box').classList.remove('sending-data');
    } finally {
        document.querySelector('.drop-box').classList.remove('ready-to-send');
    }
}
