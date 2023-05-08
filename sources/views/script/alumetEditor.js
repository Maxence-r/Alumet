
let currentID = window.location.pathname.split('/');
function displayAlert(title, content, button, functionToCall) {
    document.querySelector('.warning-modal').style.display = 'flex';
    document.getElementById('warn-title').innerText = title;
    document.getElementById('warn-desc').innerText = content;
    document.getElementById('warn-button').innerText = button;
    document.getElementById('warn-button').setAttribute('onclick', functionToCall + '()');
}

function reload() {
    window.location.reload();
}

function closeWarning() {
    document.querySelector('.warning-modal').style.display = 'none';
}

if (!localStorage.getItem('getStarted')) {
    displayAlert("Bienvenue sur Alumet", "Nous n'attendions plus que vous ! Bienvenue sur le mode édition. Vous pouvez envoyer ce lien aux élèves, qui seront redirigés vers leur espace. Alors, allons-y et créons quelque chose de magnifique ensemble !", "C'est parti !", "closeWarning");
    localStorage.setItem('getStarted', true);
}

socket.on(`warn-${localStorage.getItem('userId')}`, data => {
    if(data === currentID[3]) return;
    displayAlert("Impossible de continuer", "Vous ne pouvez pas modifier plusieurs alumets en même temps", "Utiliser celui ci", "reload");
})


document.querySelector('.s-create').addEventListener('click', () => {
    const title = document.getElementById('s-title').value;
    const checked = document.getElementById('s-checked').checked;
    if (title === '') {
        alert('Please enter a title');
    }
    fetch(`/api/wall/${localStorage.getItem('currentAlumet')}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: title,
            post: checked,
            id: localStorage.getItem('currentAlumet')
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.error) {
            closeModal('cs')
            getWalls();
        }
        document.querySelector('.s-create').classList.remove('button--loading');
    })
});

function deleteWall() {
   fetch(`/api/wall/${localStorage.getItem('currentAlumet')}/${localStorage.getItem('currentItem')}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        
    })
    .then(response => response.json())
    .then(data => {
        if (!data.error) {
            closeModal('ms')
            getWalls();
        }
    })
}

document.querySelector('.s-modify').addEventListener('click', () => {
   let title = document.getElementById('s-m-title').value;
   let checked = document.getElementById('s-m-checked').checked;
    fetch(`/api/wall/${localStorage.getItem('currentAlumet')}/${localStorage.getItem('currentItem')}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: title,
            post: checked
        })
    })
    .then(response => response.json())
    .then(data => {
        document.querySelector('.s-modify').classList.remove('button--loading');
        if (!data.error) {
            closeModal('ms')
            getWalls();
        }
    })
});

function editAlumet() {
    fetch(`/alumet/info/${localStorage.getItem('currentAlumet')}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(data => {
        if (!data.error) {
            document.getElementById('a-p-title').value = data.finalAlumet.name;
            document.getElementById('a-p-description').value = data.finalAlumet.description;
            document.getElementById('p-alumet-back').src = `/cdn/u/${data.finalAlumet.background}`;
            document.querySelector('.layer-p-preview').style.backdropFilter = `blur(${data.finalAlumet.blur.$numberDecimal}px) brightness(${data.finalAlumet.brightness.$numberDecimal})`;
            data.finalAlumet.modules.forEach(module => {
                document.getElementById(`${module}-a-p`).checked = true;
            });
            document.getElementById("bright-range").value = data.finalAlumet.brightness.$numberDecimal;
            document.getElementById("blur-range").value = data.finalAlumet.blur.$numberDecimal;
            document.getElementById("blur-level").innerText = data.finalAlumet.blur.$numberDecimal;
            document.getElementById("bright-level").innerText = data.finalAlumet.brightness.$numberDecimal;
            document.getElementById("p-a").style.display = "flex";
            document.getElementById("p-a").classList.add('active-modal');
            if (data.finalAlumet.hasPassword === true) {
                document.getElementById("a-p-pswd").checked = true;
            }
        }
    })
}

let blurRange = document.getElementById("blur-range");
var outputBlurRange = document.getElementById("blur-level");
outputBlurRange.innerText = blurRange.value;

blurRange.oninput = function() {
    outputBlurRange.innerText = this.value;
    document.querySelector('.layer-p-preview').style.backdropFilter = `blur(${this.value}px) brightness(${document.getElementById("bright-range").value})`;
}   

let brightRange = document.getElementById("bright-range");
var outputBrightRange = document.getElementById("bright-level");
outputBrightRange.innerText = brightRange.value;

brightRange.oninput = function() {
    outputBrightRange.innerText = this.value;
    document.querySelector('.layer-p-preview').style.backdropFilter = `blur(${document.getElementById("blur-range").value}px) brightness(${this.value})`;
}   

document.querySelector('.p-a-modify').addEventListener('click', () => {
    console.log('ok')
    let file = document.getElementById('p-a-file') ? document.getElementById('p-a-file').files[0] : null;
    let title = document.getElementById('a-p-title').value;
    let description = document.getElementById('a-p-description').value;
    let password = document.getElementById('a-p-password').value;
    let modules = [];
    document.querySelectorAll('.a-p').forEach(module => {
        if (module.checked) {
            modules.push(module.id.split('-')[0]);
        }
    });

    body = {}
    if (title) {
        body.name = title;
    }
    if (description) {
        body.description = description;
    }
    if (password && document.getElementById("a-p-pswd").checked) {
        body.password = password;
    } else if (!document.getElementById("a-p-pswd").checked) {
        body.password = null;
    }
    body.modules = modules;
    body.blur = document.getElementById("blur-range").value;
    body.brightness = document.getElementById("bright-range").value;
    if (file) {
        formdata = new FormData();
        formdata.append('background', file);
        fetch('/alumet/new/background', {
            method: 'POST',
            body: formdata
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('Une erreur est survenue');
            } else {
                return res.json();
            }
        })
        .then(data => {
           body.background = data.uploaded._id;
           fetch(`/alumet/update/${localStorage.getItem('currentAlumet')}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    body: body
                })
            })
            .then(response => response.json())
            .then(data => {
                window.location.reload();
            })
        })
        .catch(err => {
            return alert(err);
        })
    } else {
    if (localStorage.getItem('templateAE')) {
        body.background = localStorage.getItem('templateAE');
    }
    fetch(`/alumet/update/${localStorage.getItem('currentAlumet')}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            body: body
        })
    })
    .then(response => response.json())
    .then(data => {
         window.location.reload();
    })
    }
});

document.getElementById('a-p-password').addEventListener('input', () => {
    if (document.getElementById('a-p-password').value === '') {
        document.getElementById('a-p-pswd').checked = false;
    } else {
        document.getElementById('a-p-pswd').checked = true;
    }
});

document.getElementById('load-new-background').addEventListener('click', () => {
    document.getElementById('p-a-file').click();
});

document.getElementById('p-a-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    if (file.size > 3000000) {
        return alert('File is too big');
    }
    reader.onload = () => {
        const img = new Image();
        img.src = reader.result;

        img.onload = () => {
            localStorage.removeItem('templateAE');
            document.getElementById('p-alumet-back').src = `${reader.result}`;
        }
    }

    reader.readAsDataURL(file);
});

let loaded = false;
document.getElementById('templates').addEventListener('click', () => {
    document.getElementById('choose-template').style.display = 'flex';
    document.getElementById('choose-template').classList.add('active-modal');
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
            console.log("Error while fetching templates");
        });
    loaded = true;
});

localStorage.removeItem('templateAE');

function chooseTemplate(id) {
    document.getElementById('p-alumet-back').src = `/cdn/u/${id}`;
    localStorage.setItem('templateAE', id);
    document.getElementById('p-a-file').value = '';
    closeModal('choose-template')
}

function createHw() {
    document.getElementById('create-hw').style.display = 'flex';
    document.getElementById('create-hw').classList.add('active-modal');
}

function createBd() {
    document.getElementById('create-bd').style.display = 'flex';
    document.getElementById('create-bd').classList.add('active-modal');
}

document.querySelector('.hw-send').addEventListener('click', async () => {
    let content = document.getElementById('hw-c').value;
    let time = document.getElementById('hw-d').value;
    if (!content || !time) {
        document.querySelector('h.w-send').classList.remove('button--loading');
        return alert('Spécifier le contenu et la date');
    }
    if (content.length > 500 || content.includes('<')) {
        document.querySelector('.hw-send').classList.remove('button--loading');
        return alert('Contenu invalide');
    }
    fetch(`/api/homeworks/add/${localStorage.getItem('currentAlumet')}`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content,
            time
        })
    }).then(res => res.json()).then(data => {
        getHomeworks();
        if (data.error) {
            document.querySelector('.hw-send').classList.remove('button--loading');
            return alert(data.error);
            
        }
        document.querySelector('.hw-send').classList.remove('button--loading');
        closeModal("create-hw");
    });
});

function setFirst() {
    fetch(`/api/wall/prioritize/${localStorage.getItem('currentAlumet')}/${localStorage.getItem('currentItem')}`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
        }
    }).then(res => res.json()).then(data => {
        if (!data.error) {
            document.querySelector('.s-first').classList.remove('button--loading');
        }
        closeModal("ms");
        document.querySelector('.s-first').classList.remove('button--loading');
        getWalls()
    })
}

function modifySection(id, post) {
    title = document.getElementById(id).innerText;
    localStorage.setItem('currentItem', id);
    document.getElementById("ms").classList.add('active-modal');
    document.getElementById("ms").style.display = 'flex';
    localStorage.setItem('currentItem', id);
    document.getElementById('s-m-title').value = title;
    if (post == 'true') {
        document.getElementById('s-m-checked').checked = true;
    } else {
        document.getElementById('s-m-checked').checked = false;
    }
}

function createSection() {
    document.getElementById('cs').style.display = 'flex';
    document.getElementById('cs').classList.add('active-modal');
}

document.getElementById('add-file').addEventListener('click', () => {
    window.open('/dashboard?redirect=file', '_blank');
});


fetch(`/alumet/warn/multiple/${currentID[3]}`, {
    method: 'POST',
    headers: {
        "Content-Type": "application/json",
    }
}).then(res => res.json()).then(data => {
    if (data.error) {
        return console.log(data.error);
    }
});
