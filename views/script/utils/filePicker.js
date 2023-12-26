const folderList = document.querySelector('.folder-list');
const folderSelection = document.getElementById('folder-selection');


class FilePicker {
    constructor(reference, extensions = [], unique = true) {
        this.reference = reference;
        this.extensions = extensions;
        this.unique = unique;
        this.selectedFile = [];
        this.loadFiles();
        folderSelection.addEventListener('change', e => {
            this.loadFolder(e.currentTarget.value);
        });
        if (this.unique) {
            document.querySelector('.files-selected').style.display = 'none';
        } else {
            document.querySelector('.files-selected').style.display = 'flex';
        }
    }

    loadFiles() {
        fetch('/cdn/content?ext=' + this.extensions, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(res => res.json())
            .then(data => {
                files = data;
                data.forEach((folder) => {
                    folderList.appendChild(this.createFolderElement(folder));
                    folderSelection.appendChild(this.createOption(folder));
                });
                if (data.length > 0) {
                    document.querySelector('.folder-list > div:first-child').click();
                } else {
                    document.querySelector('.cloud > .full-screen').style.display = 'flex';
                }
            });
    }

    loadFolder(id) {
        document.querySelectorAll('.file-item').forEach(file => file.remove());
        localStorage.setItem('currentFolder', id);
        document.querySelectorAll('.active-folder').forEach(folder => folder.classList.remove('active-folder'));
        const loading = document.querySelector('.files-items > .full-screen')
        document.querySelector(`[data-id="${id}"]`).classList.add('active-folder');
        document
        files.forEach(folder => {
            if (folder._id === id) {
                if (folder.uploads.length === 0) {
                    loading.style.display = 'flex';
                } else {
                    loading.style.display = 'none';
                    folder.uploads.forEach(file => {
                        document.querySelector('.files-items').appendChild(this.createFileElement(file));
                    });
                }
            }
        });
    }

    open() {
        document.querySelector('.file-picker').style.display = 'flex';
    }

    close() {
        document.querySelector('.file-picker').style.display = 'none';
    }

    createFileElement(file) {
        const div = document.createElement('div');
        div.dataset.id = file._id;
        div.dataset.name = file.displayname;
        div.dataset.ext = file.mimetype;
        div.dataset.size = (file.filesize / 1024 / 1024).toFixed(2) + ' Mo';
        div.dataset.date = file.date.split('T')[0];
        div.setAttribute('onclick', `selectFile('${file._id}')`);
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


    createOption(folder) {
        const option = document.createElement('option');
        option.value = folder._id;
        option.innerText = folder.name;
        return option;
    }

    createFolderElement(folder) {
        const div = document.createElement('div');
        div.onclick = () => {
            this.loadFolder(folder._id);
        };
        let h2 = document.createElement('h2');
        div.dataset.id = folder._id;
        h2.innerText = folder.name;
        div.appendChild(h2);
        return div;
    }



}

/* let filePicker = new FilePicker('test', ['pdf'], true);
setTimeout(() => {
    filePicker.open();
}, 1500);
console.log(filePicker); */
/* filePicker.open(); */
