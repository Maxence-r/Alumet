document.getElementById('password').focus();
const currentUrl = window.location.href;
const path = currentUrl.split('/').pop();


fetch(`/alumet/info/${path}`, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => {
    if (data.error) {
        window.location.href = '/404';
    }
    if (!data.finalAlumet.hasPassword) {
        enter();
    }
    document.getElementById('img').src = '/cdn/u/' + data.finalAlumet.background;
    document.querySelector('.alumet-infos h1').innerText = data.finalAlumet.name.substring(0, 75)
    document.getElementById('time').innerText = relativeTime(data.finalAlumet.lastUsage);
    if (data.finalAlumet.theme == 'dark') {
        document.querySelector('.alumet-infos h1').style.color = 'dark';
        document.querySelector('.alumet-infos h3').style.color = 'dark';
    } else {
        document.querySelector('.alumet-infos h1').style.color = 'white';
        document.querySelector('.alumet-infos h3').style.color = 'white';
        document.querySelector('.alumet-info').style.backgroundColor = '#131313';
    }
    fetch('/auth/u/' + data.finalAlumet.owner, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('owner').innerText = data.prenom + ' ' + data.nom;
    })
})
.catch(error => {
    console.log(error);
});

document.getElementById('enter').addEventListener('click', () => {
    enter();
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        enter();
    }
});

function enter() {
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
    fetch('/portal/authorize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: path,
                password: password,
                username: username
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                toast({
                    title: "Quelque chose s'est mal passé",
                    message: `${data.error}`,
                    type: "error",
                    duration: 3000
                  })
            } else {
                window.location.href = "/a/" + path;
            }
        })
        .catch(error => {
            console.log(error);
        });
}

document.getElementById('img').onload = () => {
    document.querySelector('.loading').classList.add('hidden');
}

setTimeout(() => {
    document.querySelector('.loading').classList.add('hidden');
}, 5000);
