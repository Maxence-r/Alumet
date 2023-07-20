document.querySelector('.drop-box').addEventListener('click', (e) => {
    if (e.target.classList.contains('drop-box')) {
    document.querySelector('.drop-box > input').click();
    }
});

document.querySelector('.drop-box > input').addEventListener('change', (e) => {
    const files = e.currentTarget.files;
    if (files.length === 0) {
        document.querySelector('.drop-box').classList.remove('ready-to-send');
        return;
    }
    document.getElementById('numbers-of-files').innerHTML = `${files.length}`;
    document.querySelector('.drop-box').classList.add('ready-to-send');
});



function cancelSend() {
    document.querySelector('.drop-box').classList.remove('ready-to-send');
    document.querySelector('.drop-box > input').value = '';
}

async function sendFiles() {
    const files = document.querySelector('.drop-box > input').files;
    const fileInfoHead = document.querySelector('.file-sending-infos > h3');
    const fileInfoSub = document.querySelector('.file-sending-infos > p');
    const progress = document.querySelector('.progress');
    const progressRatio = 100 / files.length;

    document.querySelector('.drop-box').classList.remove('ready-to-send');
    document.querySelector('.drop-box').classList.add('sending-data');
    let index = 0;
    try {
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            fileInfoHead.innerHTML = `<span>Envoi de</span> ${file.name}`;
            fileInfoSub.innerHTML = `${files.length} fichier(s) à envoyer`;
            const response = await fetch(`/cdn/upload/${localStorage.getItem('currentFolder')}`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            index++;
            const fileProgress = index * progressRatio;
            progress.style.width = `${fileProgress}%`;
        }
        document.querySelector('.drop-box').classList.add('success-upload');
        document.querySelector('.drop-box > input').value = '';
        let audio = new Audio('../assets/sounds/success.mp3');
        audio.play();
        progress.style.width = "0%";
        setTimeout(() => {
            document.querySelector('.drop-box').classList.remove('sending-data');
            document.querySelector('.drop-box').classList.remove('success-upload');
        }, 5000);
    } catch (error) {
        toast({
            title: 'Erreur',
            message: `${error}`,
            type: 'error',
            duration: 5000
        });
        document.querySelector('.drop-box').classList.remove('sending-data');
    } finally {
        document.querySelector('.drop-box').classList.remove('ready-to-send');
        loadFolder(localStorage.getItem('currentFolder'));
    }
    updateStats()
}