let participants = [];
let user;
let previousSender = null;
let selectedColor = 'white';
const fileIconReference = {
    png: '../assets/files-icons/img.png',
    jpg: '../assets/files-icons/img.png',
    jpeg: '../assets/files-icons/img.png',
    gif: '../assets/files-icons/img.png',
    apng: '../assets/files-icons/img.png',
    avif: '../assets/files-icons/img.png',
    webp: '../assets/files-icons/img.png',
    svg: '../assets/files-icons/img.png',
    pdf: '../assets/files-icons/img.png',
    doc: '../assets/files-icons/doc.png',
    docx: '../assets/files-icons/doc.png',
    xls: '../assets/files-icons/xls.png',
    xlsx: '../assets/files-icons/xls.png',
    ppt: '../assets/files-icons/ppt.png',
    pptx: '../assets/files-icons/ppt.png',
    txt: '../assets/files-icons/doc.png',
    zip: '../assets/files-icons/zip.png',
    rar: '../assets/files-icons/zip.png',
    '7z': '../assets/files-icons/zip.png',
    tar: '../assets/files-icons/zip.png',
    gz: '../assets/files-icons/zip.png',
    bz2: '../assets/files-icons/zip.png',
    xz: '../assets/files-icons/zip.png',
    mp3: '../assets/files-icons/mp3.png',
    wav: '../assets/files-icons/mp3.png',
    ogg: '../assets/files-icons/mp3.png',
    flac: '../assets/files-icons/mp3.png',
    m4a: '../assets/files-icons/mp3.png',
    mp4: '../assets/files-icons/mov.png',
    mkv: '../assets/files-icons/mov.png',
    mov: '../assets/files-icons/mov.png',
    avi: '../assets/files-icons/mov.png',
    wmv: '../assets/files-icons/mov.png',
    flv: '../assets/files-icons/mov.png',
    webm: '../assets/files-icons/mov.png',
    m4v: '../assets/files-icons/mov.png',
    mpg: '../assets/files-icons/mov.png',
    mpeg: '../assets/files-icons/mov.png',
};

function toast({ title = '', message = '', type = 'info', duration = 3000 }) {
    const main = document.getElementById('toast');
    if (main) {
        const toast = document.createElement('div');

        setTimeout(function () {
            main.removeChild(toast);
        }, duration + 1000);

        const delay = (duration / 1000).toFixed(2);

        toast.classList.add('toast', `toast--${type}`);
        toast.style.animation = `slideInTop ease .3s, fadeOut linear 1s ${delay}s forwards`;

        const toastBody = document.createElement('div');
        toastBody.classList.add('toast__body');

        const toastTitle = document.createElement('h3');
        toastTitle.classList.add('toast__title');
        toastTitle.textContent = title;

        const toastMsg = document.createElement('p');
        toastMsg.classList.add('toast__msg');
        toastMsg.textContent = message;

        toastBody.appendChild(toastTitle);
        toastBody.appendChild(toastMsg);

        toast.appendChild(toastBody);
        main.appendChild(toast);
    }
    let audioNotif = new Audio('../assets/sounds/soft.mp3');
    audioNotif.play();
}

function createPrompt(object) {
    document.getElementById('prompt-input').disabled = false;
    document.getElementById('prompt-input').type = 'text';
    document.getElementById('prompt-input').removeAttribute('list');
    document.getElementById('prompt-input').style.display = 'none';
    document.getElementById('prompt-red').style.display = 'none';
    document.getElementById('prompt-desc').style.display = 'none';
    document.getElementById('prompt-head').innerText = object.head;
    document.getElementById('prompt-input').placeholder = object.placeholder;
    document.getElementById('prompt-confirm').setAttribute('onclick', object.action);
    if (object.list) {
        document.getElementById('prompt-input').setAttribute('list', object.list);
    }
    if (object.disabled) {
        document.getElementById('prompt-input').disabled = true;
    }
    if (object.desc) {
        document.getElementById('prompt-desc').style.display = 'block';
        document.getElementById('prompt-desc').innerText = object.desc;
    }
    if (object.redAction) {
        document.getElementById('prompt-red').style.display = 'block';
        document.getElementById('prompt-red').innerText = object.redActionText;
        document.getElementById('prompt-red').setAttribute('onclick', object.redAction);
    }
    if (object.placeholder) {
        document.getElementById('prompt-input').style.display = 'block';
        if (object.placeholderType) {
            document.getElementById('prompt-input').type = object.placeholderType;
        }
    }
    document.querySelector('.prompt-popup').classList.add('active-popup');
    document.getElementById('prompt-input').value = '';
}

function relativeTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);

    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInMinutes <= 0) {
        return "À l'instant";
    } else if (diffInMinutes < 60) {
        return 'Il y a ' + diffInMinutes + 'min';
    } else if (diffInHours < 24) {
        return 'Il y a ' + diffInHours + 'h';
    } else {
        return 'Il y a ' + diffInDays + 'j';
    }
}

function cancelLoading(classLoading) {
    document.querySelector(`.${classLoading}`).classList.remove('button--loading');
}

function getMyInfos() {
    return new Promise((resolve, reject) => {
        fetch('/auth/info')
            .then(response => response.json())
            .then(json => {
                user = json.user;
                resolve(json);
            })
            .catch(error => {
                console.error(error);
                reject(error);
            });
    });
}

function next(current, next) {
    let hasEmptyInput = false;
    document.querySelectorAll('.activeStep > input').forEach(input => {
        if (input.value.length < 2 && input.required) {
            hasEmptyInput = true;
            return toast({ title: 'Erreur', message: 'Veuillez remplir tous les champs avec 2 caractères minimum', type: 'error', duration: 2500 });
        }
    });
    if (hasEmptyInput) {
        return;
    }
    document.querySelector('.full-screen').style.display = 'flex';
    document.getElementById(`step${current}`).classList.remove('activeStep');
    document.getElementById(`step${next}`).classList.add('activeStep');
    setTimeout(() => {
        document.querySelector('.full-screen').style.display = 'none';
    }, 500);
}

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};

function toggleParticipant(id) {
    participants.includes(id) ? participants.splice(participants.indexOf(id), 1) : participants.push(id);
    document.querySelector(`[data-id="${id}"]`).classList.toggle('selected-user');
}

function endLoading() {
    document.querySelector('.loading').classList.add('hidden-loading');
    setTimeout(() => {
        document.querySelector('.loading').style.display = 'none';
    }, 600);
}

const searchUsers = async (query, type) => {
    if (query.length < 2 && participants.length === 0) {
        document.querySelector('.no-result').style.display = 'flex';
        return document.querySelector('.users-fetch').classList.remove('searching');
    } else {
        document.querySelector('.users-fetch').classList.add('searching');
    }
    document.querySelectorAll('.users-fetch > .user').forEach(element => {
        if (!element.classList.contains('selected-user')) {
            element.remove();
        }
    });

    try {
        const response = await fetch(`/swiftChat/search?q=${query}&type=${type}`);
        const json = await response.json();
        if (json.length === 0) {
            document.querySelector('.no-result').style.display = 'flex';
        } else {
            document.querySelector('.no-result').style.display = 'none';
        }

        json.forEach(user => {
            if (participants.includes(user._id)) {
                return;
            }
            const userElement = document.createElement('div');
            userElement.classList.add('user');
            userElement.dataset.id = user._id;
            userElement.setAttribute('onclick', `toggleParticipant('${user._id}')`);
            const iconElement = document.createElement('img');
            iconElement.src = `/cdn/u/${user.icon}`;

            userElement.appendChild(iconElement);

            const subInfosElement = document.createElement('div');

            userElement.appendChild(subInfosElement);

            const nameElement = document.createElement('h3');
            nameElement.textContent = `${user.name} ${user.lastname}`;
            subInfosElement.appendChild(nameElement);

            const roleElement = document.createElement('p');
            roleElement.textContent = user.accountType;
            subInfosElement.appendChild(roleElement);

            const selected = document.createElement('img');
            selected.src = '../../assets/global/selected.svg';
            selected.alt = 'selected icon';
            selected.classList.add('ticked-user');
            userElement.appendChild(selected);

            document.querySelector('.users-fetch').appendChild(userElement);
        });

        return document.querySelector('.users-fetch').classList.remove('searching');
    } catch (err) {
        console.error(err);
    }
};

function loadFolder(id) {
    document.querySelector('.files-items').classList.add('loading-files');
    localStorage.setItem('currentFolder', id);
    fetch(`/cdn/folder/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                document.querySelector('.files-items > .full-screen').style.display = 'flex';
            } else {
                document.querySelector('.files-items > .full-screen').style.display = 'none';
            }
            document.querySelectorAll('.file-item').forEach(file => file.remove());
            data.forEach(file => {
                const fileElement = createFileElement(file);
                document.querySelector('.files-items').appendChild(fileElement);
            });
            document.querySelector('.files-items').classList.remove('loading-files');
        });
}
