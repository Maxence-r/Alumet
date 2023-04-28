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
  
  
  