document.querySelector('.s-create').addEventListener('click', () => {
    const title = document.getElementById('s-title').value;
    const checked = document.getElementById('s-checked').checked;
    if (title === '') {
        alert('Please enter a title');
    }
    fetch(`/api/wall/${localStorage.getItem('currentAlumet')}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: title,
            post: checked,
            id: localStorage.getItem('currentAlumet')
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.error) {
            console.log(data);
            closeModal('cs')
            getWalls();
        }
        document.querySelector('.s-create').classList.remove('button--loading');
    })
});

function deleteWall() {
   fetch(`/api/wall/${localStorage.getItem('currentAlumet')}/${localStorage.getItem('currentItem')}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        
    })
    .then(response => response.json())
    .then(data => {
        if (!data.error) {
            closeModal('ms')
            getWalls();
        }
    })
}

document.querySelector('.s-modify').addEventListener('click', () => {
   let title = document.getElementById('s-m-title').value;
   let checked = document.getElementById('s-m-checked').checked;
    fetch(`/api/wall/${localStorage.getItem('currentAlumet')}/${localStorage.getItem('currentItem')}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: title,
            post: checked
        })
    })
    .then(response => response.json())
    .then(data => {
        document.querySelector('.s-modify').classList.remove('button--loading');
        if (!data.error) {
            closeModal('ms')
            getWalls();
        }
    })
});