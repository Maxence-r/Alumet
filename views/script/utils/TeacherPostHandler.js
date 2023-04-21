const items = document.querySelector('.items');
localStorage.removeItem('postOption');
items.addEventListener('click', (event) => {
  let target = event.target;

  if (target.tagName.toLowerCase() === 'img' || target.tagName.toLowerCase() === 'p') {
    target = target.parentNode;
  }
  if (target.id == 'file') {
    localStorage.setItem('postOption', 'file')
    document.querySelector('.file-modal').style.display = 'flex';
    hideItems();
    document.getElementById('file-input').click();
  } else if (target.id == 'link') {
    localStorage.setItem('postOption', 'link')
    hideItems();
    document.querySelector('.link-modal').style.display = 'flex';
  }
});

function hideItems() {
    document.querySelector('.items').style.display = 'none';
    document.querySelector('.back-option').style.display = 'flex';
}

document.querySelector('.file-modal').addEventListener('click', (event) => {
  document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  document.querySelector('.file-modal > h3').innerHTML = file.name;
  if (file.size > 10000000) {
    document.querySelector('.file-modal > h3').innerHTML = 'Fichier trop volumineux';
  }
});


// Local verification to prevent user from posting empty content, a server-side verification is also done
document.querySelector('.p-post').addEventListener('click', () => {
  let title = document.getElementById('p-title').value;
  let content = document.getElementById('p-content').value;
  let option = localStorage.getItem('postOption');
  let tcs = document.getElementById('p-tcs').checked; // TCS: Teacher Can See
  let file = document.getElementById('file-input').files[0];
  let link = document.querySelector('.link-input').value;

  let wall = localStorage.getItem('currentWall');
  if (title == '' && content == '' && !option) {
    return abortPost('Vous n\'avez pas spécifié de titre, de contenu ou d\'option');
  }
  
  if (option) {
    switch (option) {
      case 'file':
        if (!file) return abortPost('Vous n\'avez pas spécifié de fichier');
        if (file.size > 10000000) return abortPost('Le fichier est trop volumineux');
        break;
      case 'link':
        if (!link) return abortPost('Vous n\'avez pas spécifié de lien');
        break;
    }
  }

  // Construct the request body dynamically
  let body = {};
  let formData = new FormData();
  if (title) body.title = title;
  if (content) body.content = content;
  if (option) body.option = option;
  if (link) body.link = link;
  body.tcs = tcs;

  if (file) {
    formData.append('file', file);
    fetch('/cdn/upload/guest', {
      method: 'POST',
      body: formData
    }).then(res => res.json()).then(data => {
      if (data.error) {
        return abortPost(data.error);
      }
      console.log(data);
      body.fileID = data.file._id;

      fetch(`/api/post/${localStorage.getItem('currentAlumet')}/${wall}/`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json"
        }
      }).then(res => res.json()).then(data => {
        if (data.error) {
          return abortPost(data.error);
        }
        document.querySelector('.p-post').classList.remove('button--loading');
        createPostHtml(data, data.wallId, true);
        closeModal('cp')
      });
    });
  } else {
    fetch(`/api/post/${localStorage.getItem('currentAlumet')}/${wall}/`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(res => res.json()).then(data => {
      if (data.error) {
        return abortPost(data.error);
      }
      document.querySelector('.p-post').classList.remove('button--loading');
      createPostHtml(data, data.wallId, true);
      closeModal('cp')
    });
  }
});



function abortPost(message) {
  alert(message);
  document.querySelector('.p-post').classList.remove('button--loading');
}