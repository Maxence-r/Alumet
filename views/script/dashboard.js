const translateReference = {
    'acceuil': -147,
    'fileM': -97,
    'infos': -46
}

const sectionReference = {
    'acceuil': 'alumets',
    'fileM': 'file-manager',
    'infos': 'informations'
}

document.querySelectorAll('.option').forEach(option => {
    let utility = option.id
    option.addEventListener('click', (e) => {
        const translate = translateReference[utility]
        document.querySelector('.selector').style.transform = `translateY(${translate}px)`
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active-section')
        })
        let section = sectionReference[utility]
        document.querySelector(`.${section}`).classList.add('active-section')
    })
})

const slider = document.querySelectorAll('.alumet-container');
let isDown = false;
let startX;
let scrollLeft;

slider.forEach(slider => {
    slider.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
    });
});
slider.forEach(slider => {
    slider.addEventListener('mouseleave', () => {
    isDown = false;
    });
});
slider.forEach(slider => {
    slider.addEventListener('mouseup', () => {
    isDown = false;
    });
});
slider.forEach(slider => {
    slider.addEventListener('mousemove', (e) => {
        if(!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 3; //scroll-fast
        slider.scrollLeft = scrollLeft - walk;
    });
});

slider.forEach(slider => {
        slider.addEventListener('wheel', (e) => {
        e.preventDefault();
        slider.scrollLeft += e.deltaY;
    });
});

isOpen = false
document.querySelector('.open-menu').addEventListener('click', () => {
    if (!isOpen) {
        document.querySelector('.menu').style.transform = 'translateX(0)'
        isOpen = true
        document.querySelector('.open-menu > img').style.transform = 'rotate(180deg)'
    } else {
        document.querySelector('.menu').style.transform = 'translateX(-100%)'
        isOpen = false
        document.querySelector('.open-menu > img').style.transform = 'rotate(0deg)'
    }
})

window.onload = () => {
    document.querySelector('.loading-screen').classList.add('end-loading')
    setTimeout(() => {
        document.querySelector('.loading-screen').style.display = 'none'
    }, 500)
}

document.getElementById('upload-alumet').addEventListener('click', () => {
    document.getElementById('file').click()
})

document.getElementById('file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
        const img = new Image();
        img.src = reader.result;

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            let brightness = 0;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                brightness += gray;
            }
            brightness /= (data.length / 4);

            if (brightness < 128) {
                document.querySelectorAll('.option-selector > p').forEach(p => {
                    p.classList.remove('selected')
                })
                document.querySelector('.option-selector > p:nth-child(2)').classList.add('selected')
            } else {
                document.querySelectorAll('.option-selector > p').forEach(p => {
                    p.classList.remove('selected')
                })
                document.querySelector('.option-selector > p:nth-child(1)').classList.add('selected')
            }

            document.querySelector('.setup-preview').style.backgroundImage = `url('${reader.result}')`;
        }
    }

    reader.readAsDataURL(file);
});


const checkbox = document.getElementById('pssw')

checkbox.addEventListener('change', () => {
  if (checkbox.checked) {
    document.getElementById('pssw-input').style.display = 'flex'
  } else {
    document.getElementById('pssw-input').style.display = 'none'
  }
});

fetch('/auths/info') 
    .then(res => res.json())
    .then(data => {
        document.getElementById('username').innerHTML = data.nom + ' ' + data.prenom
        document.getElementById('status').innerHTML = data.status
    })  
    .catch(err => console.log(err))

document.querySelector('.logout').addEventListener('click', () => {
    window.location.href = '/auths/logout'
})

document.querySelector('.file-drop').addEventListener('click', () => {
    document.getElementById('file-input').value = '';
    document.getElementById('file-input').click()
})
let files = [];
document.getElementById('file-input').addEventListener('change', (e) => {
    files = Array.from(e.target.files);
    document.querySelector('.files').innerHTML = '';
    files.forEach(file => {
        let fileDiv = document.createElement('div');
        fileDiv.setAttribute('id', file.name);
        fileDiv.classList.add('file-uplading-prev', 'file');
        fileDiv.innerHTML = `
        <div class="info">
          <img src="../assets/app/label.svg" alt="label"><span>${file.name}</span>
        </div>
        <div class="info">
          <img src="../assets/app/size.svg" alt="size">${file.size / 1000} MB
        </div>
        <div class="quick-actions">
            <div onclick="removeFile('${file.name}', '${files}')" class="action"><img src="../assets/app/delete.svg" alt="Delete"></div>
        </div>`;
        document.querySelector('.files').appendChild(fileDiv);
    });
});

function removeFile(name) {
    files = files.filter(file => file.name !== name);
    document.getElementById(name).remove();
}

document.getElementById('upload-files-b').addEventListener('click', () => {
    if (files.length === 0) {
        alert('Please select a file');
        return;
    }
    document.querySelector('.upload-s-1').style.display = 'none'
    document.querySelector('.upload-s-2').style.display = 'flex'
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });
    fetch('/cdn/upload', {
        method: 'POST',
        body: formData
    })
    .then(res => {
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }
        return res.json();
    })
    .then(data => {
        if (data.error) {
            alert(data.error);
            document.querySelector('.upload-s-2').style.display = 'none'
            document.querySelector('.upload-s-1').style.display = 'flex'
        } else {
            document.querySelector('.upload-s-2').style.display = 'none'
            document.querySelector('.upload-s-1').style.display = 'flex'
            document.getElementById('close-modal-upload').click()
            getFiles();
        }
    })
    .catch(err => console.log(err));
});


function getFiles() {
    fetch('/cdn/files')
        .then(res => res.json())
        .then(data => {
            document.querySelector('.file-container').innerHTML = '';
            data.uploads.forEach(file => {
                fileDiv = document.createElement('div');
                fileDiv.classList.add('file');
                fileDiv.innerHTML = `
                <div class="info">
                    <img src="../assets/app/label.svg" alt="label">${file.displayname}
                </div>
                    <div class="info">
                <img src="../assets/app/size.svg" alt="size">${file.filesize / 10000} MB
                    </div>
                <div class="quick-actions">
                <div onclick="deleteFile('${file._id}')" class="action"><img src="../assets/app/delete.svg" alt="Delete"></div>
                <div onclick="downloadDocument('${file._id}')" class="action"><img src="../assets/app/download.svg" alt="Download"></div>
                <div onclick="openDocument('${file._id}')" class="action"><img src="../assets/app/open.svg" alt="Open"></div>
                </div>`;
                document.querySelector('.file-container').appendChild(fileDiv);
            });
        })
        .catch(err => console.log(err));
}
getFiles();
document.getElementById('search-input').addEventListener('input', (e) => {
    document.querySelectorAll('.file').forEach(file => {
        if (file.querySelector('.info').innerText.toLowerCase().includes(e.target.value.toLowerCase())) {
            file.style.display = 'flex';
        } else {
            file.style.display = 'none';
        }
    });
});

const supported = {
    'pdf': '<iframe src="*?#toolbar=0" frameBorder="0"></iframe>',
    'png': '<img class="image-view" src="*">',
    'jpg': '<img class="image-view" src="*">',
    'jpeg': '<img class="image-view" src="*">',
    'gif': '<img class="image-view" src="*">',
    'apng': '<img class="image-view" src="*">',
    'avif': '<img class="image-view" src="*">',
    'webp': '<img class="image-view" src="*">',
    'mp4': '<video class="video-view" controls><source src="*" type="video/mp4"></video>',
    'webm': '<video class="video-view" controls><source src="*" type="video/webm"></video>',
    'ogg': '<video class="video-view" controls><source src="*" type="video/ogg"></video>',
    'mp3': '<audio class="audio-view" controls><source src="*" type="audio/mpeg"></audio>',
    'wav': '<audio class="audio-view" controls><source src="*" type="audio/wav"></audio>',
    'flac': '<audio class="audio-view" controls><source src="*" type="audio/flac"></audio>',
    'youtube': '<iframe src="https://www.youtube.com/embed/*" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
    'pptx': `<iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${window.location.protocol}//${window.location.host}*" frameborder='0'>This is an embedded <a target='_blank' href='http://office.com'>Microsoft Office</a> document, powered by <a target='_blank' href='http://office.com/webapps'>Office Online</a>.</iframe>`,
    'ppt': `<iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${window.location.protocol}//${window.location.host}*" frameborder='0'>This is an embedded <a target='_blank' href='http://office.com'>Microsoft Office</a> document, powered by <a target='_blank' href='http://office.com/webapps'>Office Online</a>.</iframe>`,
    'docx': `<iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${window.location.protocol}//${window.location.host}*" frameborder='0'>This is an embedded <a target='_blank' href='http://office.com'>Microsoft Office</a> document, powered by <a target='_blank' href='http://office.com/webapps'>Office Online</a>.</iframe>`,
    'doc': `<iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${window.location.protocol}//${window.location.host}*" frameborder='0'>This is an embedded <a target='_blank' href='http://office.com'>Microsoft Office</a> document, powered by <a target='_blank' href='http://office.com/webapps'>Office Online</a>.</iframe>`,
    'xlsx': `<iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${window.location.protocol}//${window.location.host}*" frameborder='0'>This is an embedded <a target='_blank' href='http://office.com'>Microsoft Office</a> document, powered by <a target='_blank' href='http://office.com/webapps'>Office Online</a>.</iframe>`,
    'xls': `<iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${window.location.protocol}//${window.location.host}*" frameborder='0'>This is an embedded <a target='_blank' href='http://office.com'>Microsoft Office</a> document, powered by <a target='_blank' href='http://office.com/webapps'>Office Online</a>.</iframe>`,
    'csv': `<iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${window.location.protocol}//${window.location.host}*" frameborder='0'>This is an embedded <a target='_blank' href='http://office.com'>Microsoft Office</a> document, powered by <a target='_blank' href='http://office.com/webapps'>Office Online</a>.</iframe>`,
}

function openDocument(id) {
    document.getElementById('file-loading').style.display = 'flex';
    document.getElementById('file-viewer').classList.add('isDisplayed');
    fetch(`/cdn/info/${id}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('delete-file').setAttribute('onclick', `deleteFile('${id}')`);
            document.querySelector('.file-title > span').innerHTML = data.response.displayname;
            document.getElementById('file-loading').style.display = 'none';
            if (supported[data.response.mimetype]) {
                let x = supported[data.response.mimetype].replace('*', `/cdn/u/${id}#toolbar=0&navpanes=0`);
                document.getElementById('file-viewer').innerHTML += x
            } else {
                document.getElementById('file-viewer').innerHTML += `<h1>File type not supported</h1>`;
            }
        })
}

function closeViewer() {
    document.getElementById('file-viewer').classList.remove('isDisplayed');
    const elementToRemoveAfter = document.getElementById("file-loading"); // replace "example" with the ID of the element after which you want to remove all elements

    let nextElement = elementToRemoveAfter.nextElementSibling;
    while (nextElement !== null) {
    nextElement.remove();
    nextElement = elementToRemoveAfter.nextElementSibling;
    }

}

function deleteFile(id) {
    if (!confirm('Are you sure you want to delete this file?')) return;
    fetch(`/cdn/delete/${id}`)
        .then(res => res.json())
        .then(data => {
            closeViewer();
            getFiles();
        })
}


function downloadDocument(id) {
    window.open(`/cdn/u/${id}`, '_blank');
}
