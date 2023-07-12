const folderList = document.querySelector('.folder-list');
const folderSelection = document.getElementById('folder-selection');

function createOption(folder) {
    const option = document.createElement('option');
    option.value = folder._id;
    option.innerText = folder.name;
    return option;
}

function createFolderElement(folder) {
    const h2 = document.createElement('h2');
    h2.dataset.id = folder._id;
    h2.innerText = folder.name;
    return h2;
}

function openDetails(id) {
    localStorage.setItem('currentFile', id);
    let file = document.querySelector('.files-items').querySelector(`div[data-id="${id}"]`)
    document.querySelector('.file-basic-info > h4').innerText = file.dataset.name;
    document.getElementById('file-size').innerText = file.dataset.size;
    document.getElementById('file-date').innerText = file.dataset.date;
    document.getElementById('file-ext').innerText = file.dataset.ext;
    document.querySelector('.file-info').classList.remove('no-selected-file');
    document.querySelector('.file-basic-info > img').src = file.dataset.imgRef;
    const endpoint = endpointReference[file.dataset.ext];
    if (endpoint) {
        document.querySelector('.file-preview > img').src = `${endpoint.replace('*', id)}`;
    } else {
        document.querySelector('.file-preview > img').src = '../assets/files-ico/not-supported.png';
    }
    document.querySelector('.right-container').classList.add('active-sub-container');
}

function createFileElement(file) {
    const div = document.createElement('div');
    div.dataset.id = file._id;
    div.dataset.name = file.displayname;
    div.dataset.ext = file.mimetype;
    div.dataset.size = (file.filesize / 1000000).toFixed(2) + ' mo';
    div.dataset.date = file.date.split('T')[0];
    div.setAttribute('onclick', `openDetails('${file._id}')`)
    div.classList.add('file-item');
    const subDiv = document.createElement('div');
    subDiv.classList.add('file-name');
    const img = document.createElement('img');
    let imgRef = fileIconReference[file.mimetype];
    if (imgRef) {
    img.src = `${fileIconReference[file.mimetype]}`;
    } else {
        img.src = '../assets/files-ico/unknow.png';
        imgRef = '../assets/files-ico/unknow.png';
    }
    div.dataset.imgRef = imgRef;
    img.alt = 'file icon';
    const h4 = document.createElement('h4');
    const span = document.createElement('span');
    span.innerText = file.displayname.split('.')[0];
    h4.appendChild(span);
    h4.innerHTML += `.${file.displayname.split('.').pop()}`;
    subDiv.appendChild(img);
    subDiv.appendChild(h4);
    div.appendChild(subDiv);
    const sizeH4 = document.createElement('h4');
    sizeH4.innerText = (file.filesize / 1000000).toFixed(2) + ' mo';
    div.appendChild(sizeH4);
    const dateH4 = document.createElement('h4');
    dateH4.innerText = file.date.split('T')[0];
    div.appendChild(dateH4);
    return div;
}


function loadFolder(id) {
    document.querySelector('.files-items').classList.add('loading-files');
    localStorage.setItem('currentFolder', id);
    fetch(`/cdn/folder/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            document.querySelectorAll('.file-item').forEach(file => file.remove());
            data.forEach(file => {
                const fileElement = createFileElement(file);
                document.querySelector('.files-items').appendChild(fileElement);
            });
            document.querySelector('.files-items').classList.remove('loading-files');
        });
}

function editFolder() {
    createPrompt({
        head: 'Renommer le dossier',
        placeholder: 'Nouveau nom',
        action: 'renameFolder()',
        redAction: 'deleteFolder()',
        redActionText: 'Supprimer le dossier'
    });
}

function modifyFile() {
    createPrompt({
        head: 'Renommer le fichier',
        placeholder: 'Nouveau nom',
        action: 'renameFileRequest()',
        redAction: 'deleteFile()',
        redActionText: 'Supprimer'
    });
}

function deleteFile() {
    fetch(`/cdn/${localStorage.getItem('currentFile')}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                toast({
                    title: 'Erreur',
                    message: `${data.error}`,
                    type: 'error',
                    duration: 5000
                });
                return;
            }
            toast({
                title: 'Succès',
                message: 'Le fichier a été supprimé.',
                type: 'success',
                duration: 5000
            });
            document.querySelector('.files-items > div[data-id="' + localStorage.getItem('currentFile') + '"]').remove();
            document.querySelector('.file-info').classList.add('no-selected-file');
            document.querySelector('.right-container').classList.remove('active-sub-container');
            document.querySelector('.active-popup').classList.remove('active-popup');
        });
}

function renameFileRequest() {
    let name = document.getElementById('prompt-input').value;
    if (!name) {
        toast({
            title: 'Erreur',
            message: 'Veuillez entrer un nom de fichier.',
            type: 'error',
            duration: 5000
        });
        return;
    }
    fetch(`/cdn/update/${localStorage.getItem('currentFile')}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                displayname: name
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                toast({
                    title: 'Erreur',
                    message: `${data.error}`,
                    type: 'error',
                    duration: 5000
                });
                return;
            }
            toast({
                title: 'Succès',
                message: 'Le fichier a été renommé.',
                type: 'success',
                duration: 5000
            });
            const file = document.querySelector('.files-items').querySelector(`div[data-id="${localStorage.getItem('currentFile')}"]`);
            file.dataset.name = data.upload[0].displayname;
            document.querySelector('.file-basic-info > h4').innerHTML = `<span>${data.upload[0].displayname.split('.')[0]}</span>.${data.upload[0].mimetype}`;
            file.querySelector('h4').innerHTML = `<span>${data.upload[0].displayname.split('.')[0]}</span>.${data.upload[0].mimetype}`;
            document.querySelector('.active-popup').classList.remove('active-popup');
    });
}


function deleteFolder(id) {
    fetch(`/cdn/folder/delete/${localStorage.getItem('currentFolder')}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                toast({
                    title: 'Erreur',
                    message: `${data.error}`,
                    type: 'error',
                    duration: 5000
                });
                return;
            }
            toast({
                title: 'Succès',
                message: 'Le dossier a été supprimé.',
                type: 'success',
                duration: 5000
            });
            const folder = folderList.querySelector(`h2[data-id="${localStorage.getItem('currentFolder')
      }"]`);
            folder.remove();
            document.querySelector('.folder-list > h2:first-child').click();
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
            duration: 5000
        });
        return;
    }
    fetch(`/cdn/folder/rename/${localStorage.getItem('currentFolder')}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                toast({
                    title: 'Erreur',
                    message: `${data.error}`,
                    type: 'error',
                    duration: 5000
                });
                return;
            }
            toast({
                title: 'Succès',
                message: 'Le dossier a été renommé.',
                type: 'success',
                duration: 5000
            });
            const folder = folderList.querySelector(`h2[data-id="${localStorage.getItem('currentFolder')
      }"]`);
            console.log(folder);
            folder.innerText = name;
        });
}

function triggerFolder() {
    const folderElements = folderList.querySelectorAll('h2');
    folderElements.forEach((folder) => {
        folder.removeEventListener('click', () => {});
        folder.addEventListener('click', () => {
            folderElements.forEach((folder) => folder.classList.remove('active-folder'));
            folder.classList.add('active-folder');
            const selector = document.querySelector('.selector');
            selector.style.top = `${folder.getBoundingClientRect().top - 31.5}px`;
            loadFolder(folder.dataset.id);
        });
    });
}

function addFolder(folder) {
    folderSelection.appendChild(createOption(folder));
    folderList.appendChild(createFolderElement(folder));
}

function newFolder() {
    createPrompt({
        head: 'Nouveau dossier',
        placeholder: 'Nom du dossier',
        action: 'createFolder()'
    });
}

function createFolder() {
    let name = document.getElementById('prompt-input').value;
    if (!name) {
        toast({
            title: 'Erreur',
            message: 'Veuillez entrer un nom de dossier.',
            type: 'error',
            duration: 5000
        });
        return;
    }
    fetch('/cdn/folder/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                toast({
                    title: 'Erreur',
                    message: `${data.error}`,
                    type: 'error',
                    duration: 5000
                });
                return;
            }
            addFolder(data);
            triggerFolder();
            const folder = folderList.querySelector(`h2[data-id="${data._id}"]`);
            folder.click();
            toast({
                title: 'Succès',
                message: 'Le dossier a été créé.',
                type: 'success',
                duration: 5000
            });
        });
}

folderSelection.addEventListener('change', (e) => {
    loadFolder(e.currentTarget.value);
});

fetch('/cdn/folder/list', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then((res) => res.json())
    .then((data) => {
        data.forEach(addFolder);
        document.querySelector('.folder-list > h2:first-child').classList.add('active-folder');
        loadFolder(data[0]._id);
        triggerFolder();
    });

window.addEventListener('load', () => {
    document.querySelector('.loading').style.display = 'none';
});

document.querySelectorAll('.files-items > div').forEach((file) => {
    file.addEventListener('click', (e) => {
        document.querySelector('.right-container').classList.add('active-sub-container');
    });
});


document.querySelector('.folder-selector').addEventListener('scroll', () => {
    let top = document.querySelector('.active-folder').getClientRects()[0].top;
    document.querySelector('.selector').style.top = `${top - 31.5}px`;
});


