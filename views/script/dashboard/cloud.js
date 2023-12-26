const folderList = document.querySelector('.folder-list');
const folderSelection = document.getElementById('folder-selection');

function createOption(folder) {
    const option = document.createElement('option');
    option.value = folder._id;
    option.innerText = folder.name;
    return option;
}

function createFolderElement(folder) {
    const div = document.createElement('div');
    div.onclick = () => {
        loadFolder(folder._id);
    };
    let h2 = document.createElement('h2');
    div.dataset.id = folder._id;
    h2.innerText = folder.name;
    let edit = document.createElement('img');
    edit.src = '../assets/global/edit.svg';
    edit.alt = 'edit icon';
    edit.classList.add('edit-icon');
    edit.onclick = () => {
        localStorage.setItem('currentFolder', folder._id);
        editFolder();
    };
    div.appendChild(h2);
    div.appendChild(edit);
    return div;
}

function openDetails(id) {
    localStorage.setItem('currentFile', id);
    let file = document.querySelector('.files-items').querySelector(`div[data-id="${id}"]`);
    document.querySelector('.file-basic-info > h4').innerText = file.dataset.name;
    document.getElementById('file-size').innerText = file.dataset.size;
    document.getElementById('file-date').innerText = file.dataset.date;
    const ext = file.dataset.ext;
    document.getElementById('file-ext').innerText = ext.charAt(0).toUpperCase() + ext.slice(1);
    document.querySelector('.file-info').classList.remove('no-selected-file');
    document.querySelector('.file-basic-info > img').src = file.dataset.imgRef;
    document.querySelector('.file-basic-info > img').alt = 'file icon';
    document.querySelector('.file-preview').classList.add('loading-fp');
    document.querySelector('.file-preview > img').src = `/preview?id=${id}`;
    document.querySelector('.file-preview > img').onload = () => {
        document.querySelector('.file-preview').classList.remove('loading-fp');
    };
    document.querySelector('.file-preview > img').alt = 'file preview';
    document.querySelector('.right-container').classList.add('active-sub-container');
}

function createFileElement(file) {
    const div = document.createElement('div');
    div.dataset.id = file._id;
    div.dataset.name = file.displayname;
    div.dataset.ext = file.mimetype;
    div.dataset.size = (file.filesize / 1024 / 1024).toFixed(2) + ' Mo';
    div.dataset.date = file.date.split('T')[0];
    div.setAttribute('onclick', `openDetails('${file._id}')`);
    div.classList.add('file-item');
    const subDiv = document.createElement('div');
    subDiv.classList.add('file-name');
    const img = document.createElement('img');
    let imgRef = fileIconReference[file.mimetype];
    if (imgRef) {
        img.src = `${fileIconReference[file.mimetype]}`;
    } else {
        img.src = '../assets/files-icons/unknow.png';
        imgRef = '../assets/files-icons/unknow.png';
    }
    div.dataset.imgRef = imgRef;
    img.alt = 'file icon';
    const h4 = document.createElement('h4');
    const span = document.createElement('span');
    span.innerText = file.displayname.split('.')[0];
    h4.appendChild(span);
    h4.innerText += `.${file.displayname.split('.').pop()}`;
    subDiv.appendChild(img);
    subDiv.appendChild(h4);
    div.appendChild(subDiv);
    const sizeH4 = document.createElement('h4');
    sizeH4.innerText = (file.filesize / 1024 / 1024).toFixed(2) + ' Mo';
    div.appendChild(sizeH4);
    const dateH4 = document.createElement('h4');
    dateH4.innerText = file.date.split('T')[0];
    div.appendChild(dateH4);
    return div;
}

function editFolder() {
    createPrompt({
        head: 'Renommer le dossier',
        placeholder: 'Nouveau nom',
        action: 'renameFolder()',
        redAction: 'deleteFolder()',
        redActionText: 'Supprimer le dossier',
    });
}

function modifyFile() {
    createPrompt({
        head: 'Renommer le fichier',
        placeholder: 'Nouveau nom',
        action: 'renameFileRequest()',
    });
}

function openFile() {
    window.open(`/viewer/${localStorage.getItem('currentFile')}`, '_blank');
}

function deleteFile() {
    fetch(`/cdn/${localStorage.getItem('currentFile')}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                toast({
                    title: 'Erreur',
                    message: `${data.error}`,
                    type: 'error',
                    duration: 5000,
                });
                return;
            }
            toast({
                title: 'Succès',
                message: 'Le fichier a été supprimé.',
                type: 'success',
                duration: 5000,
            });
            document.querySelector('.files-items > div[data-id="' + localStorage.getItem('currentFile') + '"]').remove();
            document.querySelector('.file-info').classList.add('no-selected-file');
            files.forEach(folder => {
                if (folder._id === localStorage.getItem('currentFolder')) {
                    folder.uploads.forEach((file, index) => {
                        if (file._id === localStorage.getItem('currentFile')) {
                            folder.uploads.splice(index, 1);
                        }
                    });
                }
            });
            document.querySelector('.right-container').classList.remove('active-sub-container');
            localStorage.removeItem('currentFile');
            if (document.querySelector('.active-popup')) {
                document.querySelector('.active-popup').classList.remove('active-popup');
            }
        });

}
localStorage.removeItem('currentFile');
document.addEventListener('keydown', e => {
    if (e.keyCode === 46 && localStorage.getItem('currentFile') && document.getElementById('cloud').classList.contains('active')) {
        createPrompt({
            head: 'Supprimer le fichier',
            desc: 'Êtes-vous sûr de vouloir supprimer ce fichier ?',
            action: 'deleteFile()',
        });
    }
});
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.querySelector('.active-popup')) {
        document.getElementById('prompt-confirm').click();
    }
});

function renameFileRequest() {
    let name = document.getElementById('prompt-input').value;
    if (!name) {
        toast({
            title: 'Erreur',
            message: 'Veuillez entrer un nom de fichier.',
            type: 'error',
            duration: 5000,
        });
        return;
    }
    fetch(`/cdn/update/${localStorage.getItem('currentFile')}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            displayname: name,
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                toast({
                    title: 'Erreur',
                    message: `${data.error}`,
                    type: 'error',
                    duration: 5000,
                });
                return;
            }
            toast({
                title: 'Succès',
                message: 'Le fichier a été renommé.',
                type: 'success',
                duration: 5000,
            });
            const file = document.querySelector('.files-items').querySelector(`div[data-id="${localStorage.getItem('currentFile')}"]`);
            file.dataset.name = data.upload[0].displayname;
            document.querySelector('.file-basic-info > h4').innerHTML = `<span>${data.upload[0].displayname.split('.')[0]}</span>.${data.upload[0].mimetype}`;
            file.querySelector('h4').innerHTML = `<span>${data.upload[0].displayname.split('.')[0]}</span>.${data.upload[0].mimetype}`;
            document.querySelector('.active-sub-container').classList.remove('active-sub-container');
        });
}

function deleteFolder(id) {
    fetch(`/cdn/folder/delete/${localStorage.getItem('currentFolder')}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                toast({
                    title: 'Erreur',
                    message: `${data.error}`,
                    type: 'error',
                    duration: 5000,
                });
                return;
            }
            toast({
                title: 'Succès',
                message: 'Le dossier a été supprimé.',
                type: 'success',
                duration: 5000,
            });
            const folder = folderList.querySelector(`div[data-id="${localStorage.getItem('currentFolder')}"]`);
            folder.remove();
            if (document.querySelector('.folder-list > div')) document.querySelector('.folder-list > div:first-child').click();
            else document.querySelector('.cloud > .full-screen').style.display = 'flex';
            document.querySelector('.active-popup').classList.remove('active-popup');
        });
}

function renameFolder() {
    let name = document.getElementById('prompt-input').value;
    if (!name) {
        toast({
            title: 'Erreur',
            message: 'Veuillez entrer un nom de dossier.',
            type: 'error',
            duration: 5000,
        });
        return;
    }
    fetch(`/cdn/folder/rename/${localStorage.getItem('currentFolder')}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                toast({
                    title: 'Erreur',
                    message: `${data.error}`,
                    type: 'error',
                    duration: 5000,
                });
                return;
            }
            toast({
                title: 'Succès',
                message: 'Le dossier a été renommé.',
                type: 'success',
                duration: 5000,
            });
            const folder = folderList.querySelector(`div[data-id="${localStorage.getItem('currentFolder')}"] > h2`);
            folder.innerText = name;
        });
}

function triggerFolder() {
    const folderElements = folderList.querySelectorAll('h2');
    folderElements.forEach(folder => {
        folder.removeEventListener('click', () => { });
        folder.addEventListener('click', () => {
            folderElements.forEach(folder => folder.classList.remove('active-folder'));
            folder.classList.add('active-folder');


            loadFolder(folder.dataset.id);
        });
    });
}

function addFolder(folder, fp = false) {
    folderSelection.appendChild(createOption(folder, fp));
    folderList.appendChild(createFolderElement(folder, fp));
}

function newFolder() {
    createPrompt({
        head: 'Nouveau dossier',
        placeholder: 'Nom du dossier',
        action: 'createFolder()',
    });
}

function createFolder() {
    let name = document.getElementById('prompt-input').value;
    if (!name) {
        toast({
            title: 'Erreur',
            message: 'Veuillez entrer un nom de dossier.',
            type: 'error',
            duration: 5000,
        });
        return;
    }
    fetch('/cdn/folder/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                toast({
                    title: 'Erreur',
                    message: `${data.error}`,
                    type: 'error',
                    duration: 5000,
                });
                return;
            }
            document.querySelector('.cloud > .full-screen').style.display = 'none';
            addFolder(data);
            /*             triggerFolder(); */
            const folder = folderList.querySelector(`div[data-id="${data._id}"]`);
            folder.click();
            toast({
                title: 'Succès',
                message: 'Le dossier a été créé.',
                type: 'success',
                duration: 5000,
            });
        });
}

folderSelection.addEventListener('change', e => {
    loadFolder(e.currentTarget.value);
});

let files = null;
fetch('/cdn/content', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    },
})
    .then(res => res.json())
    .then(data => {
        files = data;
        data.forEach(addFolder);
        if (data.length > 0) {
            document.querySelector('.folder-list > div:first-child').click();
        } else {
            document.querySelector('.cloud > .full-screen').style.display = 'flex';
        }
    });




function loadFolder(id) {
    document.querySelectorAll('.file-item').forEach(file => file.remove());
    localStorage.setItem('currentFolder', id);
    document.querySelectorAll('.active-folder').forEach(folder => folder.classList.remove('active-folder'));
    const loading = document.querySelector('.files-items > .full-screen')
    document.querySelector(`[data-id="${id}"]`).classList.add('active-folder');
    console.log(files);
    files.forEach(folder => {
        if (folder._id === id) {
            if (folder.uploads.length === 0) {
                loading.style.display = 'flex';
            } else {
                loading.style.display = 'none';
                folder.uploads.forEach(file => {
                    document.querySelector('.files-items').appendChild(createFileElement(file));
                });
            }
        }
    });
}


document.getElementById('search-bar').addEventListener('input', e => {
    const search = e.currentTarget.value.toLowerCase();
    const allFiles = document.querySelectorAll('.file-item');
    allFiles.forEach(file => {
        const fileName = file.dataset.name.toLowerCase();
        if (fileName.includes(search)) {
            file.style.display = 'flex';
        } else {
            file.style.display = 'none';
        }
    });
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.querySelector('.cloud.active-section') && document.querySelector('.active-sub-container')) {
        document.querySelector('.active-sub-container').classList.remove('active-sub-container');
    }
});
