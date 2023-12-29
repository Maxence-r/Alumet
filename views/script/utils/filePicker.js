const folderList = document.querySelector('.folder-list');
const folderSelection = document.getElementById('folder-selection');

let selectedFile = [];
let unique, ext;
function loadFiles() {

    fetch('/cdn/content', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(data => {
            files = data;
            if (data.error) return
            data.forEach((folder) => {
                folderList.appendChild(createFolderElement(folder));
                folderSelection.appendChild(createOption(folder));
            });
            if (data.length > 0) {

            } else {
                document.querySelector('.files-items > .full-screen').style.display = 'flex';
            }

        });
}

function loadFolder(id) {
    document.querySelectorAll('.file-item').forEach(file => file.remove());
    localStorage.setItem('currentFolder', id);
    document.querySelectorAll('.active-folder').forEach(folder => folder.classList.remove('active-folder'));
    const loading = document.querySelector('.files-items > .full-screen')
    document.querySelector(`[data-id="${id}"]`).classList.add('active-folder');
    files.forEach(folder => {
        if (folder._id === id) {
            if (folder.uploads.length === 0) {
                loading.style.display = 'flex';
            } else {
                loading.style.display = 'none';
                folder.uploads.forEach(file => {
                    if (ext.includes(file.mimetype) || ext.length === 0) {
                        document.querySelector('.files-items').appendChild(createFileElement(file));
                    }
                });
                if (document.querySelector('.files-items').children.length === 1) {
                    document.querySelector('.files-items > .full-screen').style.display = 'flex';
                }
            }
        }
    });
}

function openFP() {
    selectedFile = [];
    if (unique === 'true') {
        console.log('unique');
        document.getElementById('post-file').removeAttribute('multiple');
        document.querySelector('.files-selected').style.display = 'none';
    } else {
        document.getElementById('post-file').setAttribute('multiple', true);
        document.querySelector('.files-selected').style.display = 'flex';
    }
    if (!app.user_infos.id) {
        document.getElementById('load-post-file').click();
    } else {
        document.querySelector('.folder-list > div:first-child').click();
        document.querySelector('.file-picker').style.display = 'flex';
    }

}

function closeFP() {
    document.querySelector('.file-picker').style.display = 'none';
}

function cancelSend() {
    selectedFile = [];
    document.getElementById('post-file').value = '';
    document.querySelector('.ready-to-send').classList.remove('ready-to-send');
}

function createFileElement(file) {
    const div = document.createElement('div');
    div.dataset.id = file._id;
    div.dataset.name = file.displayname;
    div.dataset.ext = file.mimetype;
    div.dataset.size = (file.filesize / 1024 / 1024).toFixed(2) + ' Mo';
    div.dataset.date = file.date.split('T')[0];
    div.onclick = () => selectFile(file._id);
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
    return div;
}


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
    div.appendChild(h2);
    return div;
}

function selectFile(id) {
    if (unique === 'true') {
        selectedFile = [id];
        document.querySelector('.file-sending-infos > h3').innerText = `1 fichier(s) selectionné(s)`;
        document.querySelector('.drop-box').classList.add('ready-to-send');
        closeFP();
    } else {
        if (selectedFile.includes(id)) {
            selectedFile.splice(selectedFile.indexOf(id), 1);
            document.querySelector(`[data-id="${id}"]`).classList.remove('selected-file');
        } else {
            selectedFile.push(id);
            document.querySelector(`[data-id="${id}"]`).classList.add('selected-file');
        }
    }
}






document.querySelector('.file-picker').addEventListener('click', e => {
    if (e.target.classList.contains('file-picker')) {
        closeFP();
    }
});

document.getElementById('post-file').addEventListener('change', e => {
    const file = e.target.files;
    if (!file) return;
    localStorage.removeItem('file-ts');
    document.querySelector('.file-sending-infos > h3').innerText = `${file.length} fichier(s) selectionné(s)`;
    document.querySelector('.drop-box').classList.add('ready-to-send');
    closeFP();
});

document.getElementById('load-post-file').addEventListener('click', () => {
    document.getElementById('post-file').click();
});


loadFiles();



document.querySelectorAll('.drop-box').forEach(dropBox => {
    dropBox.addEventListener('click', (e) => {
        if (e.target.classList.contains('drop-box')) {
            unique = dropBox.dataset.unique;
            ext = dropBox.dataset.extensions?.split(',') || [];
            openFP();
        }

    });
});