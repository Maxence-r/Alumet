const navButtons = document.querySelectorAll('.nav > button');
const sections = document.querySelectorAll('.sections-container > section');
const folderList = document.querySelector('.folder-list');
const folderSelection = document.getElementById('folder-selection');

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    navButtons.forEach((button) => button.classList.remove('active'));
    button.classList.add('active');
    sections.forEach((section) => section.classList.remove('active-section'));
    document.querySelector(`.${button.id}`).classList.add('active-section');
  });
});

function createOption(folder) {
  const option = document.createElement('option');
  option.value = folder._id;
  option.innerText = folder.name;
  return option;
}

function createFolderElement(folder) {
  const h2 = document.createElement('h2');
  h2.dataset.id = folder._id;
  h2.innerText = folder.name;
  return h2;
}

function loadFolder(id) {
  localStorage.setItem('currentFolder', id);
  console.log(`Loading folder ${id}`);
}

function editFolder() {
  createPrompt({
    head: 'Renommer le dossier',
    placeholder: 'Nouveau nom',
    function: renameFolder,
    redAction: deleteFolder,
    redActionText: 'Supprimer le dossier'
  });
}

function deleteFolder(id) {
  fetch(`/cdn/folder/delete/${localStorage.getItem('currentFolder')}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      toast({ title: 'Erreur', message: `${data.error}`, type: 'error', duration: 5000 });
      return;
    }
    toast({ title: 'Succès', message: 'Le dossier a été supprimé.', type: 'success', duration: 5000 });
    const folder = folderList.querySelector(`h2[data-id="${localStorage.getItem('currentFolder')
    }"]`);
    folder.remove();
    const selector = document.querySelector('.selector');
    selector.style.top = `${folderList.querySelector('h2').getBoundingClientRect().top - 31.5}px`;
    loadFolder(folderList.querySelector('h2').dataset.id);
    document.querySelector('.active-popup').classList.remove('active-popup');
  });
}

function renameFolder(name) {
  if (!name) {
    toast({ title: 'Erreur', message: 'Veuillez entrer un nom de dossier.', type: 'error', duration: 5000 });
    return;
  } 
  fetch(`/cdn/folder/rename/${localStorage.getItem('currentFolder')}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      toast({ title: 'Erreur', message: `${data.error}`, type: 'error', duration: 5000 });
      return;
    }
    toast({ title: 'Succès', message: 'Le dossier a été renommé.', type: 'success', duration: 5000 });
    const folder = folderList.querySelector(`h2[data-id="${localStorage.getItem('currentFolder')
    }"]`);
    console.log(folder);
    folder.innerText = name;
  });
}
function triggerFolder() {
  const folderElements = folderList.querySelectorAll('h2');
  folderElements.forEach((folder) => {
    folder.addEventListener('click', () => {
      folderElements.forEach((folder) => folder.classList.remove('active-folder'));
      folder.classList.add('active-folder');
      const selector = document.querySelector('.selector');
      selector.style.top = `${folder.getBoundingClientRect().top - 31.5}px`;
      loadFolder(folder.dataset.id);
    });
  });
}

function addFolder(folder) {
  folderSelection.insertBefore(createOption(folder), folderSelection.firstChild);
  folderList.insertBefore(createFolderElement(folder), folderList.firstChild);
}
function newFolder() {
  createPrompt({
    head: 'Nouveau dossier',
    placeholder: 'Nom du dossier',
    function: createFolder
  });
}

function createFolder(name) {
  if (!name) {
    toast({ title: 'Erreur', message: 'Veuillez entrer un nom de dossier.', type: 'error', duration: 5000 });
    return;
  }
  fetch('/cdn/folder/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      toast({ title: 'Erreur', message: `${data.error}`, type: 'error', duration: 5000 });
      return;
    }
    addFolder(data);
    triggerFolder();
    const folder = folderList.querySelector(`h2[data-id="${data._id}"]`);
    folder.click();
    toast({ title: 'Succès', message: 'Le dossier a été créé.', type: 'success', duration: 5000 });
  });
}

folderSelection.addEventListener('change', (e) => {
    loadFolder(e.currentTarget.value);
});

fetch('/cdn/folder/list', { method: 'GET', headers: { 'Content-Type': 'application/json' } })
.then((res) => res.json())
.then((data) => {
  data.forEach(addFolder);
  document.querySelector('.folder-list > h2:first-child').classList.add('active-folder');
  triggerFolder();
});

window.addEventListener('load', () => {
  document.querySelector('.loading').style.display = 'none';
});

document.querySelectorAll('.files-items > div').forEach((file) => {
  file.addEventListener('click', (e) => {
    document.querySelector('.right-container').classList.add('active-sub-container');
  });
});

toast({ title: 'Bienvenue !', message: 'Vous êtes connecté.', type: 'info', duration: 2500 });

async function createPrompt(object) {
  document.getElementById('prompt-head').innerHTML = object.head;
  document.getElementById('prompt-input').placeholder = object.placeholder;
  document.getElementById('prompt-confirm').addEventListener('click', onClick);
  if (object.redAction) {
    document.getElementById('prompt-red').style.display = 'block';
    document.getElementById('prompt-red').innerHTML = object.redActionText;
    document.getElementById('prompt-red').addEventListener('click', object.redAction);
  } else {
    document.getElementById('prompt-red').style.display = 'none';
  }


  function onClick() {
    const input = document.getElementById('prompt-input');
    object.function(input.value);
    document.querySelector('.prompt-popup').classList.remove('active-popup');
    document.getElementById('prompt-confirm').removeEventListener('click', onClick);
  }

  document.querySelector('.prompt-popup').classList.add('active-popup');

  const inputValue = await new Promise((resolve) => {
    document.getElementById('prompt-confirm').addEventListener('click', () => {
      const input = document.getElementById('prompt-input');
      resolve(input.value);
    });
  });

  document.getElementById('prompt-input').value = '';
  document.getElementById('prompt-red').style.display = 'none';
}

document.querySelector('.folder-selector').addEventListener('scroll', () => {
  let top = document.querySelector('.active-folder').getClientRects()[0].top;
  document.querySelector('.selector').style.top = `${top - 31.5}px`;
});

const params = new URL(window.location).searchParams;
let redirect = params.get('redirect');
if (redirect) {
    const element = document.getElementById(`${redirect}`);
    if (element) {
        element.click();
    }
}