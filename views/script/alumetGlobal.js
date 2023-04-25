function editPost(id) {
    document.getElementById('patch-post').style.display = 'flex';
    document.getElementById('patch-post').classList.add('active-modal');
} 

function closeModal(id) {
    document.getElementById(`${id}`).classList.remove('active-modal');
    document.getElementById(`${id}`).classList.add('idle-modal');
    setTimeout(() => {
        document.getElementById(`${id}`).style.display = 'none';
        document.getElementById(`${id}`).classList.remove('idle-modal');
        resetItems();
    }, 500);
}

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
      const replaceAll = (str, search, replace) => str.split(search).join(replace);
      document.getElementById('preview-title').innerHTML = data.title ? replaceAll(data.title, "<", "") : 'Pas de titre trouvé';
      document.getElementById('preview-description').innerHTML = data.description ? replaceAll(data.description, "<", "") : 'Pas de description trouvée';
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
    title = document.getElementById(id).innerHTML;
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
    document.querySelector('.file-modal > h3').innerHTML = 'Aucun fichier selectionné';
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
    document.querySelector('.file-title > span').innerHTML = name.substring(0, 20);
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