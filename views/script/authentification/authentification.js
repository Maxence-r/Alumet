const path = window.location.pathname;
const id = path.substring(path.lastIndexOf('/') + 1);

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
if (code) {
    document.querySelector('.code').value = code;
}

function load(boolean) {
    document.querySelector('.access').classList.add('load');
    document.querySelectorAll('.container > div').forEach(e => {
        e.style.display = 'none';
    });
    fetch('/alumet/info/' + id, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(data => {
            if (boolean === undefined) {
                loadAlumetInfos(data.alumet_infos);
            }
            if (data.alumet_infos.participant === true) {
                window.location.href = '/a/' + id;
            }
            if (data.alumet_infos.private === false) {
                if (Object.keys(data.user_infos).length !== 0) {
                    document.querySelector('.public-c').style.display = 'flex';
                    loadUserInfos('public-c', data.user_infos);
                } else {
                    document.querySelector('.public-nc').style.display = 'flex';
                }
            } else {
                if (Object.keys(data.user_infos).length !== 0) {
                    document.querySelector('.private-c').style.display = 'flex';
                    loadUserInfos('private-c', data.user_infos);
                } else {
                    document.querySelector('.private-nc').style.display = 'flex';
                }
            }
            document.querySelector('.access').classList.remove('load');
        })
        .catch(err => console.log(err));
}
load();

function loadAlumetInfos(alumet) {
    document.querySelector('.alumet-infos > img').src = '/cdn/u/' + alumet.background;
    document.querySelector('.alumet-details > h1').innerText = alumet.title;
    document.querySelector('.alumet-details > h3').innerText = alumet.description;
    document.getElementById('creator').innerText = alumet.owner + ' ';
    document.getElementById('lastusage').innerText = relativeTime(alumet.lastUsage);
    const img = new Image();
    img.src = '/cdn/u/' + alumet.background;
    img.onload = () => {
        document.querySelector('.loading').classList.add('hidden');
    };
}

document.querySelectorAll('.connect').forEach(e => {
    e.addEventListener('click', () => {
        document.querySelector('.access').classList.add('load');
        const popupWindow = window.open('/auth/signin?redirect=loginCallback', '_blank', 'height=600,width=400');
        let timer = setInterval(function () {
            if (popupWindow.closed) {
                clearInterval(timer);
                load(false);
            }
        }, 1000);
    });
});

document.querySelector('.guest').addEventListener('click', () => {
    document.querySelector('.access').classList.add('load');
    setTimeout(() => {
        document.querySelector('.access').classList.remove('load');
        window.location.href = '/a/' + id + '?guest=true';
    }, 500);
});

document.querySelectorAll('.join').forEach(e => {
    e.addEventListener('click', () => {
        document.querySelector('.access').classList.add('load');
        fetch('/portal/authorize/' + id, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: document.querySelector('.code').value,
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    document.querySelector('.access').classList.remove('load');
                    return toast({
                        title: 'Erreur',
                        message: 'Code invalide',
                        type: 'error',
                        duration: 2500,
                    });
                }
                load(false);
            })
            .catch(err => console.log(err));
    });
});

function loadUserInfos(container, user) {
    document.querySelector(`.${container} > .user-infos > img`).src = '/cdn/u/' + user.icon;
    document.querySelector(`.${container} > .user-infos > .user-details > h3`).innerText = user.name + ' ' + user.lastname;
}
