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

const endpointReference = {
    'png': '/preview/image?id=*',
    'jpg': '/preview/image?id=*',
    'jpeg': '/preview/image?id=*',
    'gif': '/cdn/u/*',
    'apng': '/cdn/u/*',
    'avif': '/cdn/u/*',
    'webp': '/cdn/u/*',
    'svg': '/cdn/u/*',
    'pdf': '/preview/pdf?id=*',
}

const fileIconReference = {
    'png': '../assets/files-ico/img.png',
    'jpg': '../assets/files-ico/img.png',
    'jpeg': '../assets/files-ico/img.png',
    'gif': '../assets/files-ico/img.png',
    'apng': '../assets/files-ico/img.png',
    'avif': '../assets/files-ico/img.png',
    'webp': '../assets/files-ico/img.png',
    'svg': '../assets/files-ico/img.png',
    'pdf': '../assets/files-ico/img.png',
    'doc': '../assets/files-ico/doc.png',
    'docx': '../assets/files-ico/doc.png',
    'xls': '../assets/files-ico/xls.png',
    'xlsx': '../assets/files-ico/xls.png',
    'ppt': '../assets/files-ico/ppt.png',
    'pptx': '../assets/files-ico/ppt.png',
    'txt': '../assets/files-ico/doc.png',
    'zip': '../assets/files-ico/zip.png',
    'rar': '../assets/files-ico/zip.png',
    '7z': '../assets/files-ico/zip.png',
    'tar': '../assets/files-ico/zip.png',
    'gz': '../assets/files-ico/zip.png',
    'bz2': '../assets/files-ico/zip.png',
    'xz': '../assets/files-ico/zip.png',
    'mp3': '../assets/files-ico/mp3.png',
    'wav': '../assets/files-ico/mp3.png',
    'ogg': '../assets/files-ico/mp3.png',
    'flac': '../assets/files-ico/mp3.png',
    'm4a': '../assets/files-ico/mp3.png',
    'mp4': '../assets/files-ico/mov.png',
    'mkv': '../assets/files-ico/mov.png',
    'mov': '../assets/files-ico/mov.png',
    'avi': '../assets/files-ico/mov.png',
    'wmv': '../assets/files-ico/mov.png',
    'flv': '../assets/files-ico/mov.png',
    'webm': '../assets/files-ico/mov.png',
    'm4v': '../assets/files-ico/mov.png',
    'mpg': '../assets/files-ico/mov.png',
    'mpeg': '../assets/files-ico/mov.png',
}


function openDetails(id) {
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
    document.querySelector('.files-items').innerHTML = '';
    fetch(`/cdn/folder/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
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
        function: renameFolder,
        redAction: deleteFolder,
        redActionText: 'Supprimer le dossier'
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

function renameFolder(name) {
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
        function: createFolder
    });
}

function createFolder(name) {
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


