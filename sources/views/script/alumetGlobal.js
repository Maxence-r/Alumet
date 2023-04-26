function editPost(id) {
    document.getElementById('m-p-t').value = '';
    document.getElementById('m-p-c').value = '';
    localStorage.setItem('currentWall', document.querySelector(`[data-id~="${id}"]`).dataset.wall)
    document.querySelectorAll('.color-selector > div').forEach(selectedcolor => {
        selectedcolor.classList.remove('selected-color');
    })
    let postTitle = document.querySelector(`[data-id~="${id}"] > .post-title`);
    let postContent = document.querySelector(`[data-id~="${id}"] > .post-content`);
    let postColor = document.querySelector(`[data-id~="${id}"]`).classList[1];
    localStorage.setItem('currentItem', id);
    localStorage.setItem('postColor', postColor.split('-')[1]);

    if (postTitle) { document.getElementById('m-p-t').value = postTitle.innerText; }
    if (postContent) { document.getElementById('m-p-c').value = postContent.innerText; }
    if (postColor) { document.querySelector(`.${postColor}`).classList.add('selected-color'); }
    document.getElementById('patch-post').style.display = 'flex';
    document.getElementById('patch-post').classList.add('active-modal');
} 

document.querySelector('.m-p-b').addEventListener('click', () => {
    let postTitle = document.getElementById('m-p-t').value;
    let postContent = document.getElementById('m-p-c').value;
    let postColor = localStorage.getItem('postColor'); 
    let body = {}
    if (postTitle) { body.title = postTitle; }
    if (postContent) { body.content = postContent; }
    if (postColor) { body.color = postColor; }
    fetch(`/api/post/${localStorage.getItem('currentAlumet')}/${localStorage.getItem('currentWall')}/${localStorage.getItem('currentItem')}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            document.querySelector(`[data-id~="${localStorage.getItem('currentItem')}"] > .post-title`).innerText = data.title;
            document.querySelector(`[data-id~="${localStorage.getItem('currentItem')}"] > .post-content`).innerText = data.content;
            document.querySelector(`[data-id~="${localStorage.getItem('currentItem')}"]`).classList.remove(document.querySelector(`[data-id~="${localStorage.getItem('currentItem')}"]`).classList[1]);
            document.querySelector(`[data-id~="${localStorage.getItem('currentItem')}"]`).classList.add(`post-${data.color}`);
            closeModal('patch-post');
            document.querySelector('.m-p-b').classList.remove('button--loading');
        }
    })
    .catch(error => {
        console.log(error);
    });
});

function closeModal(id) {
    document.getElementById(`${id}`).classList.remove('active-modal');
    document.getElementById(`${id}`).classList.add('idle-modal');
    setTimeout(() => {
        document.getElementById(`${id}`).style.display = 'none';
        document.getElementById(`${id}`).classList.remove('idle-modal');
        resetItems();
    }, 500);
}

document.getElementById('delete-post').addEventListener('click', () => {
    fetch(`/api/post/${localStorage.getItem('currentAlumet')}/${localStorage.getItem('currentWall')}/${localStorage.getItem('currentItem')}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            closeModal('patch-post');
            document.querySelector(`[data-id~="${localStorage.getItem('currentItem')}"]`).remove();
        }
    })
    .catch(error => {
        console.log(error);
    });
});

let supported = {};
fetch('/cdn/supported')
    .then(res => res.json())
    .then(data => {
        console.log(data);
        supported = data;
    })
    .catch(err => console.log(err));

document.querySelector('.l-preview').addEventListener('click', async (e) => {
    const linkInputValue = document.querySelector('.link-input').value;
    if (!linkInputValue) {
      document.querySelector('.l-preview').classList.remove('button--loading');
      return;
    }
  
    try {
      const res = await fetch(`/preview/meta?url=${linkInputValue}`);
      const data = await res.json();
      document.getElementById('preview-title').innerText = data.title ? replaceAll(data.title, "$", "") : 'Pas de titre trouvé';
      document.getElementById('preview-description').innerText = data.description ? replaceAll(data.description, "<", "") : 'Pas de description trouvée';
      document.getElementById('preview-image').src = data.image ? data.image : '../../assets/app/no-preview.png';
    } catch (error) {
      console.error(error);
    }
    document.querySelector('.l-preview').classList.remove('button--loading');
  });
  


// Utils functions
let color = 'white';
document.querySelectorAll('.color-selector > div').forEach(color => {
    color.addEventListener('click', (a) => {
        document.querySelectorAll('.color-selector > div').forEach(selectedcolor => {
            selectedcolor.classList.remove('selected-color');
        })
        a.target.classList.add('selected-color');
        console.log(a.target);
        localStorage.setItem('postColor', a.target.classList[0]);
    })
})


// Modifier function

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



// Creator functions


function createSection() {
    document.getElementById('cs').style.display = 'flex';
    document.getElementById('cs').classList.add('active-modal');
}


function createPost(id) {
    localStorage.setItem('currentWall', id);
    document.getElementById('cp').style.display = 'flex';
    document.getElementById('cp').classList.add('active-modal');
}

document.querySelector('.back-option').addEventListener('click', () => {
    document.querySelector('.file-modal > h3').innerText = 'Aucun fichier selectionné';
    document.getElementById('file-input').value = '';
    document.querySelector('.link-input').value = '';
    localStorage.removeItem('postOption');
    resetItems();
})

function resetItems() {
    document.querySelector('.items').style.display = 'flex';
    document.querySelector('.back-option').style.display = 'none';

    document.querySelector('.file-modal').style.display = 'none';
    document.querySelector('.link-modal').style.display = 'none';
}

function enableModule(id) {
    JSON.parse(localStorage.getItem('modules')).forEach(module => {
        document.querySelector(`.${module}`).id = ''
        document.querySelector(`.home`).id = ''
        document.getElementById(module).classList.remove('active-module');
    });
    document.querySelector(`.${id}`).id = 'selected-item'
    document.querySelector('.modules-container').style.display = 'flex';
    document.getElementById(id).classList.add('active-module');
    
}

function home() {
    document.querySelector('.modules-container').style.display = 'none';
    document.querySelector(`.home`).id = 'selected-item'
    JSON.parse(localStorage.getItem('modules')).forEach(module => {
        document.querySelector(`.${module}`).id = ''
        document.getElementById(module).classList.remove('active-module');
    });
}

const slider = document.querySelectorAll('.wall-container');
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

function closeViewer() {
    document.querySelector('.view-modal').style.transform = 'translateY(110%)';
    document.getElementById('file-loading').style.display = 'flex';
    const elementToRemoveAfter = document.getElementById("file-loading");
    let nextElement = elementToRemoveAfter.nextElementSibling;
    while (nextElement !== null) {
        nextElement.remove();
        nextElement = elementToRemoveAfter.nextElementSibling;
    } 
}
function openFile(id, name, ext) {
    document.getElementById('download-file').setAttribute('onclick', `downloadFile("./../../cdn/u/${id}")`);
    document.querySelector('.view-modal').style.display = 'flex'; 
    document.querySelector('.view-modal').style.transform = 'translateY(0)'; 
    document.querySelector('.file-title > span').innerText = name.substring(0, 20);
    document.getElementById('file-loading').style.display = 'none';
    if (supported[ext]) {
        let x = supported[ext].replace('*', `${window.location.protocol}//${window.location.host}/cdn/u/${id}#toolbar=0&navpanes=0`);
        document.getElementById('file-viewer').innerHTML += x
    } else {
        document.getElementById('file-viewer').innerHTML += `<div class="not-supported"><img loading="eager" src="./../../assets/app/uto.svg"><h3>Impossible d'ouvrir ce fichier, tentez de le télécharger</h3></div>`;
    }
      
}

function downloadFile(url) {
    window.open(url, '_blank');
}