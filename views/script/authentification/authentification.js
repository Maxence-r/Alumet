const path = window.location.pathname;
const id = path.substring(path.lastIndexOf('/') + 1);

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('password');
if (code) {
    document.querySelectorAll('.code').forEach(e => {
        e.value = code;
    });
}

function load(boolean) {
    document.querySelector('.access').classList.add('load');
    document.querySelectorAll('.container > div').forEach(e => {
        e.style.display = 'none';
    });
    fetch('/app/info/' + id, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(data => {
            if (boolean === undefined) {
                loadAppInfos(data.infos);
            }
            if (data.infos.participant === true) {
                window.location.href = '/app/' + id;
            }
            if (Object.keys(data.user_infos).length !== 0) {
                switch (data.infos.security) {
                    case 'open':
                        document.querySelector('.public-c').style.display = 'flex';
                        loadUserInfos('public-c', data.user_infos);
                        break;
                    case 'onpassword':
                        document.querySelector('.onpassword-c').style.display = 'flex';
                        loadUserInfos('onpassword-c', data.user_infos);
                        break;
                    case 'closed':
                        document.querySelector('.closed-c').style.display = 'flex';
                        loadUserInfos('closed-c', data.user_infos);
                        break;
                    default:
                        break;
                }
            } else {
                switch (data.infos.security) {
                    case 'open':
                        document.querySelector('.public-nc').style.display = 'flex';
                        break;
                    case 'onpassword':
                        document.querySelector('.onpassword-nc').style.display = 'flex';
                        break;
                    case 'closed':
                        document.querySelector('.closed-nc').style.display = 'flex';
                        break;
                    default:
                        break;
                }
            }
            /*  if (data.infos.private === false) {
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
             } */
            document.querySelector('.access').classList.remove('load');
            endLoading();
        })
        .catch(err => console.log(err));
}
load();

function loadAppInfos(app) {
    document.querySelector('.appInfos > img').src = '/cdn/u/' + app.background;
    document.querySelector('.appDetails > h1').innerText = app.title;
    document.querySelector('.appDetails > h3').innerText = app.description;
    const img = new Image();
    img.src = '/cdn/u/' + app.background;
    img.onload = () => {
        endLoading();
    };
}

document.querySelector('.guest').addEventListener('click', () => {
    document.querySelector('.access').classList.add('load');
    setTimeout(() => {
        document.querySelector('.access').classList.remove('load');
        window.location.href = '/app/' + id;
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
                password: document.querySelectorAll('.code')[0].value || document.querySelectorAll('.code')[1].value || '',
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    document.querySelector('.access').classList.remove('load');
                    return toast({
                        title: 'Erreur',
                        message: data.error,
                        type: 'error',
                        duration: 2500,
                    });
                }
                window.location.href = '/app/' + id;
                load(false);
            })
            .catch(err => console.log(err));
    });
});

function loadUserInfos(container, user) {
    document.querySelector(`.${container} > .user-infos > img`).src = '/cdn/u/' + user.icon;
    document.querySelector(`.${container} > .user-infos > .user-details > h3`).innerText = user.name + ' ' + user.lastname;
}
