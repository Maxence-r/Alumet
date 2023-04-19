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