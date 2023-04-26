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
            console.log(data);
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
            document.getElementById('p-alumet-back').src = `/cdn/u/${data.finalAlumet.background}`;
            document.querySelector('.layer-p-preview').style.backdropFilter = `blur(${data.finalAlumet.blur.$numberDecimal}px) brightness(${data.finalAlumet.brightness.$numberDecimal})`;
            data.finalAlumet.modules.forEach(module => {
                document.getElementById(`${module}-a-p`).checked = true;
            });
            document.getElementById("bright-range").value = data.finalAlumet.brightness.$numberDecimal;
            document.getElementById("blur-range").value = data.finalAlumet.blur.$numberDecimal;
            document.getElementById("blur-level").innerHTML = data.finalAlumet.blur.$numberDecimal;
            document.getElementById("bright-level").innerHTML = data.finalAlumet.brightness.$numberDecimal;
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
outputBlurRange.innerHTML = blurRange.value;

blurRange.oninput = function() {
    outputBlurRange.innerHTML = this.value;
    document.querySelector('.layer-p-preview').style.backdropFilter = `blur(${this.value}px) brightness(${document.getElementById("bright-range").value})`;
}   

let brightRange = document.getElementById("bright-range");
var outputBrightRange = document.getElementById("bright-level");
outputBrightRange.innerHTML = brightRange.value;

brightRange.oninput = function() {
    outputBrightRange.innerHTML = this.value;
    document.querySelector('.layer-p-preview').style.backdropFilter = `blur(${document.getElementById("blur-range").value}px) brightness(${this.value})`;
}   

document.querySelector('.p-a-modify').addEventListener('click', () => {
    let file = document.getElementById('p-a-file') ? document.getElementById('p-a-file').files[0] : null;
    let title = document.getElementById('a-p-title').value;
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
    if (password && document.getElementById("a-p-pswd").checked) {
        body.password = password;
    } else {
        body.password = null;
    }
    body.modules = modules;
    body.blur = document.getElementById("blur-range").value;
    body.brightness = document.getElementById("bright-range").value;
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
});

document.getElementById('a-p-password').addEventListener('input', () => {
    if (document.getElementById('a-p-password').value === '') {
        document.getElementById('a-p-pswd').checked = false;
    } else {
        document.getElementById('a-p-pswd').checked = true;
    }
});
