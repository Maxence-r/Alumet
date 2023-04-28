const translateReference = {
    'acceuil': -198,
    'fileM': -148,
    'infos': -96,
    'parametres': -46
}

const sectionReference = {
    'acceuil': 'alumets',
    'fileM': 'file-manager',
    'infos': 'informations',
    'parametres': 'parametres'
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
        if (window.innerWidth < 1000) {
            document.querySelector('.open-menu').click()
        }
    })
})

const slider = document.querySelectorAll('.scroll-x');
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
    document.getElementById('file-background').click()
})

document.getElementById('file-background').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
        const img = new Image();
        img.src = reader.result;

        img.onload = () => {
            localStorage.removeItem('template');
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

fetch('/auth/info') 
    .then(res => res.json())
    .then(data => {
        
        if (data.prenom == 'undefined' || data.nom == 'undefined' || !data) {
            window.location.href = '/auth/logout'
        }
        document.getElementById('username').innerText = data.nom + ' ' + data.prenom
        document.getElementById('status').innerText = data.status
    })  
    .catch(err => console.log(err))

document.querySelector('.logout').addEventListener('click', () => {
    window.location.href = '/auth/logout'
})

document.querySelector('.file-drop').addEventListener('click', () => {
    document.getElementById('file-input').value = '';
    document.getElementById('file-input').click()
})
let files = [];
document.getElementById('file-input').addEventListener('change', (e) => {
    files = Array.from(e.target.files);
    document.querySelector('.files').innerText = '';
    files.forEach(file => {
        let fileDiv = document.createElement('div');
        fileDiv.setAttribute('id', file.name);
        fileDiv.classList.add('file-uplading-prev', 'file');
        fileDiv.innerHTML = `
        <div class="info">
          <img src="../assets/app/label.svg" alt="label"><span>${file.name}</span>
        </div>
        <div class="info">
          <img src="../assets/app/size.svg" alt="size">${(file.size / 1048576).toFixed(2)} MB
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

function resetFiles() {
    document.querySelector('.upload-s-2').style.display = 'none'
    document.querySelector('.upload-s-1').style.display = 'flex'
    document.getElementById('file-input').value = '';
    files = [];
    document.querySelector('.files').innerHTML = '';
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
            resetFiles();
        } else {
            document.getElementById('close-modal-upload').click()
            getFiles();
            resetFiles();
        }
    })
    .catch(() => {
        alert('Impossible d\'envoyez vos fichiers, assurez vous que vous envoyez moins de 50 fichiers. Si le problème persite, les administrateurs seront prévenus.');
        resetFiles();
    });
});



function getFiles() {
    fetch('/cdn/files')
        .then(res => res.json())
        .then(data => { 
            if (data.uploads.length == 0) {  
                document.querySelector('.file-container').innerHTML = '<div class="not-supported"><img src="./assets/app/uto.svg"><h3>Vos fichiers seront affichés ici</h3></div>'; 
            } else {
            document.querySelector('.file-container').innerHTML = '';
            data.uploads.forEach(file => {
                fileDiv = document.createElement('div');
                fileDiv.classList.add('file');
                fileDiv.innerHTML = `
                <div class="info">
                    <img src="../assets/app/label.svg" alt="label">${file.displayname}
                </div>
                    <div class="info">
                <img src="../assets/app/size.svg" alt="size">${(file.filesize / 1048576).toFixed(2)} MB
                    </div>
                <div class="quick-actions">
                <div onclick="deleteFile('${file._id}')" class="action"><img src="../assets/app/delete.svg" alt="Delete"></div>
                <div onclick="editDocument('${file._id}')" class="action"><img src="../assets/app/edit.svg" alt="Edit name"></div>
                <div onclick="downloadDocument('${file._id}')" class="action"><img src="../assets/app/download.svg" alt="Download"></div>
                <div onclick="openDocument('${file._id}')" class="action"><img src="../assets/app/open.svg" alt="Open"></div>
                </div>`;
                document.querySelector('.file-container').appendChild(fileDiv);
            });
        }
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

let supported = {};
fetch('/cdn/supported')
    .then(res => res.json())
    .then(data => {
        supported = data;
    })
    .catch(err => console.log(err));

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
                let x = supported[data.response.mimetype].replace('*', `${window.location.protocol}//${window.location.host}/cdn/u/${id}#toolbar=0&navpanes=0`);
                document.getElementById('file-viewer').innerHTML += x
            } else {
                document.getElementById('file-viewer').innerHTML += `<div class="not-supported"><img src="./assets/app/uto.svg"><h3>Impossible d'ouvrir ce fichier, tentez de le télécharger</h3></div>`;
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
            if (data.error) return alert(data.error);
            closeViewer();
            getFiles();
        })
}


function downloadDocument(id) {
    window.open(`/cdn/u/${id}`, '_blank');
}

let activeStep = 1;
let requestBody = {
    modules: []
};
let imgData = new FormData();
localStorage.removeItem('template');
document.getElementById('alumet-setup-continue').addEventListener('click', () => {
    switch (activeStep) {
        case 1:
            if (document.getElementById('alumet-name').value.length < 2) {
                return alert('Veuillez entrer un nom assez long.');
            } else {
                document.querySelector('.step1').style.display = 'none';
                document.querySelector('.step2').style.display = 'flex';
                requestBody.name = document.getElementById('alumet-name').value;
                requestBody.description = document.getElementById('alumet-description').value;
                activeStep++;
            }
            break;
        case 2:
            if (!localStorage.getItem('template')) {
                if (document.getElementById('file-background').files.length < 1) {
                    return alert('Veuillez choisir un fond');
                }
            }
                if (!localStorage.getItem('template')) {
                    if (!document.getElementById('file-background').files[0]) {
                        return alert('Veuillez choisir un fond');
                    } else if (document.getElementById('file-background').files[0].size > 3000000 || document.getElementById('file-background').files[0].type !== 'image/png' && document.getElementById('file-background').files[0].type !== 'image/jpeg'  && document.getElementById('file-background').files[0].type !== 'image/jpg') {
                        return alert('Le fichier est trop volumineux ou n\'est pas une image (png, jpeg, jpg)');
                    }
                }
                imgData.append('background', document.getElementById('file-background').files[0] || localStorage.getItem('template'));
                document.querySelector('.step2').style.display = 'none';
                document.querySelector('.step3').style.display = 'flex';
                activeStep++;
                
            
            break;
        case 3:
            if (document.getElementById('pssw').checked && document.getElementById('pssw-input').value.length > 0) {
                requestBody.password = document.getElementById('pssw-input').value;
            }
            document.getElementById('dm').checked ? requestBody.modules.push('dm') : null;
            document.getElementById('hw').checked ? requestBody.modules.push('hw') : null;
            document.getElementById('bd').checked ? requestBody.modules.push('bd') : null;
            document.querySelector('.step3').style.display = 'none';
            document.getElementById('new-alumet-loading').style.display = 'flex';
            document.getElementById('new-alumet-tracker').style.display = 'flex';
            document.getElementById('alumet-setup-continue').style.display = 'none';
            if (!localStorage.getItem('template')) {
                fetch('/alumet/new/background', {
                        method: 'POST',
                        body: imgData
                    })
                    .then(res => {
                        if (!res.ok) {
                            throw new Error('Une erreur est survenue');
                        } else {
                            return res.json();
                        }
                    })
                    .then(data => {
                        let dataU = data.uploaded
                        requestBody.background = dataU._id;
                        fetch('/alumet/new', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(requestBody)
                            })
                            .then(res => {
                                if (!res.ok) {
                                    throw new Error('Une erreur est survenue');
                                } else {
                                    return res.json();
                                }
                            })
                            .then(data => {
                                if (data.error) return alert(data.error);
                                window.open(`/a/${data.saved._id}`, '_blank');
                                window.location.reload();
                            })
                            .catch(err => {
                                console.log(err);
                            });
                    })
                    .catch(err => {
                        console.log(err);
                    });
                break;
            } else {
                requestBody.background = localStorage.getItem('template');
                fetch('/alumet/new', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    })
                    .then(res => {
                        if (!res.ok) {
                            throw new Error('Une erreur est survenue. Si le problème persiste contactez nous.');
                        } else {
                            return res.json();
                        }
                    })
                    .then(data => {
                        if (data.error) return alert(data.error);
                        window.open(`/a/${data.saved._id}`, '_blank');
                        window.location.reload();
                    })
                    .catch(err => {
                        console.log(err);
                    });


            }
    }
});




function editDocument(id) {
   let newname = prompt('Nouveau nom');
    if (!newname) return;
    fetch(`/cdn/update/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            displayname: newname
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) return alert(data.error);
        getFiles();
    })
}

function relativeTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);

    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
        return "Il y a " + diffInMinutes + "min";
    } else if (diffInHours < 24) {
        return "Il y a " + diffInHours + "h";
    } else {
        return "Il y a " + diffInDays + "j";
    }
  }
  

function getAlumets() {
    fetch('/alumet/all')
      .then(res => res.json())
      .then(data => {
        const sortedData = sortAlumetsByLastUsage(data.alumets);
        if (data.alumets.length > 0) {
            document.getElementById('open-alumet').innerHTML = '';
        } 
        sortedData.forEach(alumet => {
            let alumetDiv = document.createElement('div');
            alumetDiv.classList.add('alumet');
            alumetDiv.style.backgroundImage = `url(/cdn/u/${alumet.background})`;
            alumetDiv.setAttribute('onclick', `openAlumet('${alumet._id}')`);
            alumetDiv.innerHTML = `
            <div class="alumet-infos">
                <h3 class="alumet-title">${alumet.name.substring(0, 75)}</h3>
                <h4 class="alumet-last-use">${relativeTime(alumet.lastUsage)}</h4>
            </div>
            `;
            document.getElementById('open-alumet').appendChild(alumetDiv);
        });
      })  
  }
  
  function sortAlumetsByLastUsage(alumets) {
    return alumets.sort((a, b) => {
      const aTime = new Date(a.lastUsage);
      const bTime = new Date(b.lastUsage);
      return bTime - aTime;
    });
  }
  
getAlumets();

function openAlumet(id) {
    console.log(id);
    fetch('/alumet/update/lastUsage', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: id
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) return alert(data.error);
            window.open(`/portal/${id}`);
        })
        .catch(err => {
            console.log(err);
        })

}
let loaded = false;
document.getElementById('template-alumet').addEventListener('click', () => {
    document.querySelector('.modal-choose').style.display = 'flex';
    if (loaded) return;
    fetch('/cdn/templates')
        .then(res => res.json())
        .then(data => {
            for (const [key, value] of Object.entries(data.templates)) {
                let img = document.createElement('img');
                img.src = `/cdn/u/${key}`;
                img.setAttribute('onclick', `chooseTemplate('${key}')`);
                document.querySelector('.images-container').appendChild(img);
            }
        })
        .catch(err => {
            console.log(err);
        });
    loaded = true;
});

function chooseTemplate(id) {
    document.querySelector('.setup-preview').style.backgroundImage = `url(/cdn/u/${id})`;
    localStorage.setItem('template', id);
    document.querySelector('.modal-choose').style.display = 'none';
}

document.getElementById('close-modal-choose').addEventListener('click', () => {
    document.querySelector('.modal-choose').style.display = 'none';
});

function getNotifications() {
    fetch('/api/notifications')
        .then(res => res.json())
        .then(data => {
            if (data.length > 0) {
                document.querySelector('.notifications-container').innerHTML = '';
            }
            data.forEach(notification => {
                let notifDiv = document.createElement('div');
                notifDiv.classList.add('notification');
                notifDiv.innerHTML = `
                <div class="info">
                  <img src="../assets/app/action.svg" alt="arborescence de fichiers">${notification.action}
                </div>
                <div class="info responsive">
                  <img src="../assets/app/path.svg" alt="path">${notification.alumet}
                </div>
                <div class="info">
                  <img src="../assets/app/time.svg" alt="sablier">${relativeTime(notification.date)}
                </div>
                <div id="user" class="info">
                  <img src="../assets/app/user.svg" alt="icon d'utilisateur">${notification.owner}
                </div>`;
                document.querySelector('.notifications-container').appendChild(notifDiv);
            });
        })
        .catch(err => {
            console.log(err);
        });
}

getNotifications();