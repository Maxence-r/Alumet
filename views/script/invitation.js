const path = window.location.pathname;
const id = path.substring(path.lastIndexOf('/') + 1);

function fetchAlumetInfos() {
    fetch('/invitation/info/' + id, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(data => {
            loadAlumetInfos(data.alumetInfos, data.inviter, data.invitation);
        })
        .catch(err => console.log(err));
}

function loadAlumetInfos(alumet, inviter, invitation) {
    document.querySelector('.alumet-infos > img').src = '/cdn/u/' + alumet.background;
    document.querySelector('.alumet-details > h1').innerText = alumet.title;
    document.querySelector('.alumet-details > h3').innerText = alumet.description || 'Aucune description';
    document.getElementById('creator').innerText = 'Invité par ' + inviter.name + ' ' + inviter.lastname;
    document.getElementById('lastusage').innerText = relativeTime(invitation.createdAt);
    const img = new Image();
    img.src = '/cdn/u/' + alumet.background;
    document.querySelector('.access > .full-screen').style.display = 'none';
}

function acceptInvite() {
    fetch('/portal/accept/' + id, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 2500 });
            } else {
                window.location.href = '/dashboard';
            }
        })
        .catch(err => console.log(err));
}

function declineInvite() {
    fetch('/portal/decline/' + id, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 2500 });
            } else {
                window.location.href = '/dashboard';
            }
        })
        .catch(err => console.log(err));
}

fetchAlumetInfos();
