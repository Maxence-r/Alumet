const items = document.querySelector('.items');

items.addEventListener('click', (event) => {
  let target = event.target;

  if (target.tagName.toLowerCase() === 'img' || target.tagName.toLowerCase() === 'p') {
    target = target.parentNode;
  }
  if (target.id == 'file') {
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

