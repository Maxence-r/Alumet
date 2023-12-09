function loadFiles() {
    fetch('/cdn/folder/list', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(data => {
            if (data.length === 0) {
                if (data.length === 0) {
                    document.querySelector('.files-header').style.display = 'none';
                    document.querySelector('.files-items').style.display = 'none';
                    document.getElementById('folder-selection').style.display = 'none';
                    return;
                }
            }
            data.forEach(addFolder);
            localStorage.setItem('currentFolder', data[0]._id);
            loadFolder(localStorage.getItem('currentFolder'));
        });
}

function createFileElement(file) {
    const div = document.createElement('div');
    div.dataset.id = file._id;
    div.dataset.name = file.displayname;
    div.dataset.ext = file.mimetype;
    div.dataset.size = (file.filesize / 1024 / 1024).toFixed(2) + ' Mo';
    div.dataset.date = file.date.split('T')[0];
    div.setAttribute('onclick', `chooseFile('${file._id}')`);
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

const folderSelection = document.getElementById('folder-selection');

folderSelection.addEventListener('change', e => {
    loadFolder(e.currentTarget.value);
});

function addFolder(folder) {
    folderSelection.appendChild(createOption(folder));
}

function createOption(folder) {
    const option = document.createElement('option');
    option.value = folder._id;
    option.innerText = folder.name;
    return option;
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
