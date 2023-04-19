const items = document.querySelector('.items');

items.addEventListener('click', (event) => {
  let target = event.target;

  if (target.tagName.toLowerCase() === 'img' || target.tagName.toLowerCase() === 'p') {
    target = target.parentNode;
  }
  if (target.id == 'file') {
    document.querySelector('.file-modal').style.display = 'flex';
    hideItems();
    document.getElementById('file-input').click();
  } else if (target.id == 'link') {
    hideItems();
    document.querySelector('.link-modal').style.display = 'flex';
  }
});

function hideItems() {
    document.querySelector('.items').style.display = 'none';
    document.querySelector('.back-option').style.display = 'flex';
}

document.getElementById('file-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  document.querySelector('.file-modal > h3').innerHTML = file.name;
});