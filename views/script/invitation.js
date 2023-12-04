const path = window.location.pathname;
const id = path.substring(path.lastIndexOf('/') + 1);

function fetchReferenceInfos() {
    fetch('/app/info/' + id, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(data => {
            loadReferenceInfos(data.alumet_infos);
            endLoading();
        })
        .catch(err => console.log(err));
}

function loadReferenceInfos(reference) {
    console.log(reference);
    document.querySelector('.alumet-infos > img').src = reference.background ? '/cdn/u/' + reference.background : '../assets/global/hands.jpg';
    document.querySelector('.alumet-details > h1').innerText = reference.title;
    document.querySelector('.alumet-details > h3').innerText = reference.description || 'Aucune description';
    document.getElementById('lastusage').innerText = relativeTime(reference.createdAt);
    const img = new Image();
    img.src = '/cdn/u/' + reference.background;
    document.querySelector('.access > .full-screen').style.display = 'none';
}

function acceptInvite() {
    fetch('/invitation/accept/' + id, {
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
    fetch('/invitation/decline/' + id, {
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

fetchReferenceInfos();
