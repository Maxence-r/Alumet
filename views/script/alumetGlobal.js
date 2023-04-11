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
    }, 500);
}






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

function modifySection(id, title, post) {
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

const items = document.querySelector('.items');

items.addEventListener('click', (event) => {
  let target = event.target;

  if (target.tagName.toLowerCase() === 'img') {
    target = target.parentNode;
  }

  console.log(target.id);
});
