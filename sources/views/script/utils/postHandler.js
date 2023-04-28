
function hideItems() {
    document.querySelector('.items').style.display = 'none';
    document.querySelector('.back-option').style.display = 'flex';
}

document.querySelector('.p-post').addEventListener('click', () => {
    document.querySelector('.p-post').disabled = true;
    let title = document.getElementById('p-title').value;
    let content = document.getElementById('p-content').value;
    let option = localStorage.getItem('postOption');
    let tcs = document.getElementById('p-tcs').checked; // TCS: Teacher Can See
    let file = document.getElementById('file-input').files[0] || localStorage.getItem('file');
    let link = document.querySelector('.link-input').value;
    let color = localStorage.getItem('postColor');
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
  

    let body = {};
    let formData = new FormData();
    if (title) body.title = title;
    if (content) body.content = content;
    if (option) body.option = option;
    if (link) body.link = link;
    if (color) body.color = color;
    body.tcs = tcs;
  
    if (file && document.getElementById('file-input').files[0]) {
      formData.append('file', file);
      fetch('/cdn/upload/guest', {
        method: 'POST',
        body: formData
      }).then(res => res.json()).then(data => {
        if (data.error) {
          return abortPost(data.error);
        }
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
          document.querySelector('.p-post').disabled = false;
          document.querySelector('.p-post').classList.remove('button--loading');
          createPostHtml(data, data.wallId, true);
          closeModal('cp')
        });
      });
    } else {
      if (file) body.fileID = file;
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
        document.querySelector('.p-post').disabled = false;
        closeModal('cp')
        localStorage.removeItem('postColor');
      });
    }
  });
  
  
  
  function abortPost(message) {
    document.querySelector('.p-post').disabled = false;
    alert(message);
    document.querySelector('.p-post').classList.remove('button--loading');
  }