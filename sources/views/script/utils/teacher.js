
const items = document.querySelector('.items');
localStorage.removeItem('postOption');
items.addEventListener('click', (event) => {
  let target = event.target;

  if (target.tagName.toLowerCase() === 'img' || target.tagName.toLowerCase() === 'p') {
    target = target.parentNode;
  }
  if (target.id == 'file') {
    document.getElementById('choose-file').style.display = 'flex';
    document.getElementById('choose-file').classList.add('active-modal');
    fetch('/cdn/files')
      .then(res => res.json())
      .then(data => {
        if (data.uploads.length !== 0) {
          document.querySelector('.files-container').innerHTML = '';
        }
        data.uploads.forEach(file => {
          div = document.createElement('div');
          div.classList.add('file');
          div.setAttribute('onclick', onclick=`chooseFile('${file._id}', '${file.displayname}')`);
          
          div.innerHTML = `
                    <div class="box-header">
                        <img src="../../assets/files-ico/${fileICO[file.mimetype] || "object.svg"}" alt="file">
                        <h1>${file.displayname}</h1>
                    </div>
                    <div class="box-content">
                    ${(supportedPreviewAlumet[file.mimetype] || '').replace('*', `${window.location.protocol}//${window.location.host}/cdn/u/${file._id}`)}
                    </div>
                `;
          document.querySelector('.files-container').appendChild(div);
        });
      })
  } else if (target.id == 'link') {
    localStorage.setItem('postOption', 'link')
    hideItems();
    document.querySelector('.link-modal').style.display = 'flex';
  }
});
document.querySelector('.file-modal').addEventListener('click', () => {
  document.getElementById('choose-file').style.display = 'flex';
  document.getElementById('choose-file').classList.add('active-modal');
});

document.getElementById('file-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  document.querySelector('.file-modal > h3').innerHTML = file.name;
  if (file.size > 10000000) {
    document.querySelector('.file-modal > h3').innerHTML = 'Fichier trop volumineux';
  }
});

document.getElementById('search-input').addEventListener('input', (e) => {
  document.querySelectorAll('.file').forEach(file => {
      if (file.querySelector('.box-header > h1').innerText.toLowerCase().includes(e.target.value.toLowerCase())) {
          file.style.display = 'flex';
      } else {
          file.style.display = 'none';
      }
  });
});

function chooseFile(file, display) {
  document.querySelector('.file-modal').style.display = 'flex';
  hideItems();
  localStorage.setItem('postOption', 'file')
  localStorage.setItem('file', file)
  document.querySelector('.file-modal > h3').innerHTML = display;
  document.getElementById('choose-file').style.display = 'none';
  document.getElementById('choose-file').classList.remove('active-modal');
}
