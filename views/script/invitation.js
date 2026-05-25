const path = window.location.pathname;
const id = path.substring(path.lastIndexOf('/') + 1);

function fetchReferenceInfos() {
    fetch('/api/alumets/' + id, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(data => {
            loadReferenceInfos(data.infos);
            endLoading();
        })
        .catch(err => console.log(err));
}

function loadReferenceInfos(reference) {
    document.querySelector('.appInfos > img').src = reference.background ? fileUrl(reference.background) : '../assets/global/hands.jpg';
    document.querySelector('.appDetails > h1').innerText = reference.title;
    document.querySelector('.appDetails > h3').innerText = reference.description || 'No description';
    document.getElementById('lastusage').innerText = relativeTime(reference.createdAt);
    const img = new Image();
    img.src = fileUrl(reference.background);
    document.querySelector('.access > .full-screen').style.display = 'none';
}

function acceptInvite() {
    fetch('/api/invitations/' + id, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Error', message: data.error, type: 'error', duration: 2500 });
            } else {
                window.location.href = '/dashboard';
            }
        })
        .catch(err => console.log(err));
}

function declineInvite() {
    fetch('/api/invitations/' + id, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'declined' }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({ title: 'Error', message: data.error, type: 'error', duration: 2500 });
            } else {
                window.location.href = '/dashboard';
            }
        })
        .catch(err => console.log(err));
}

fetchReferenceInfos();
