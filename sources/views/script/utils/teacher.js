
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
    document.querySelector('.files-container').innerHTML = '';
    fetch('/cdn/files')
      .then(res => res.json())
      .then(data => {
        data.uploads.forEach(file => {
          div = document.createElement('div');
          div.classList.add('file');
          div.setAttribute('onclick', `chooseFile('${file}')`);
          div.innerHTML = `
                    <h1>${file.displayname}</h1>
                    <div class="actions">
                        <div onclick="openFile('${file._id}', '${file.displayname}', '${file.mimetype}')" class="action darker"><img src="../../assets/app/open.svg" alt="Ouvrir"></div>
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
document.querySelector('.file-modal').addEventListener('click', (event) => {
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
      if (file.querySelector('.file > h1').innerText.toLowerCase().includes(e.target.value.toLowerCase())) {
          file.style.display = 'flex';
      } else {
          file.style.display = 'none';
      }
  });
});

function chooseFile(file) {
  document.querySelector('.file-modal > h3').innerHTML = file;
  document.getElementById('choose-file').style.display = 'none';
  document.getElementById('choose-file').classList.remove('active-modal');
}
