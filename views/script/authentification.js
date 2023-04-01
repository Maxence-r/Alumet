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
    if (!data.finalAlumet.hasPassword) {
        enter();
    }
    document.getElementById('img').src = '/cdn/u/' + data.finalAlumet.background;
    document.querySelector('.alumet-infos h1').innerHTML = data.finalAlumet.name.substring(0, 75)
    const lastUsage = new Date(data.finalAlumet.lastUsage);
    const timeDiff = new Date() - lastUsage;
    const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesDiff = Math.floor((timeDiff / (1000 * 60)) % 60);
    const timeAgo = hoursDiff > 0 ? `${hoursDiff}h ago` : `${minutesDiff}m ago`;
    document.getElementById('time').innerHTML = timeAgo;
    fetch('/auth/u/' + data.finalAlumet.owner, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('owner').innerHTML = data.prenom + ' ' + data.nom;
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
    fetch('/portal/authorize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: path,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            window.location.href = "/a/" + path;
            if (data.error) {
                console.log(data.error);
            }
        })
        .catch(error => {
            console.log(error);
        });
}