const currentUrl = window.location.href;
const path = currentUrl.split('/').pop();

function init() {
    fetch(`/alumet/info/${path}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        localStorage.setItem('currentAlumet', data.finalAlumet._id);
        document.querySelector('.background-image').style.backgroundImage = `url("/cdn/u/${data.finalAlumet.background}")`;
        document.querySelector('.layer-filter').style.backdropFilter = `blur(${data.finalAlumet.blur.$numberDecimal}px) brightness(${data.finalAlumet.brightness.$numberDecimal})`;
        if (data.finalAlumet.theme == 'dark') {
            document.documentElement.style.setProperty('--main-color', '#131313');
            document.documentElement.style.setProperty('--secondary-color', '#ffffff');
            document.documentElement.style.setProperty('--accent-color', '#cfcfcf');
        } else {
            document.documentElement.style.setProperty('--main-color', '#f1f1f1');
            document.documentElement.style.setProperty('--secondary-color', '#131313');
            document.documentElement.style.setProperty('--accent-color', '#555555');
        }
    })
}

init();

const slider = document.querySelectorAll('.wall-container');
let isDown = false;
let startX;
let scrollLeft;

slider.forEach(slider => {
    slider.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
    });
});
slider.forEach(slider => {
    slider.addEventListener('mouseleave', () => {
    isDown = false;
    });
});
slider.forEach(slider => {
    slider.addEventListener('mouseup', () => {
    isDown = false;
    });
});
slider.forEach(slider => {
    slider.addEventListener('mousemove', (e) => {
        if(!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 3; //scroll-fast
        slider.scrollLeft = scrollLeft - walk;
    });
});

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


function createSection() {
    document.getElementById('cs').style.display = 'flex';
    document.getElementById('cs').classList.add('active-modal');
}

// get all post scroll containers
function createPost(id) {
    document.getElementById('cp').style.display = 'flex';
    document.getElementById('cp').classList.add('active-modal');
}

function getWalls() {
    document.querySelectorAll('.wall').forEach(wall => wall.remove());
    fetch(`/api/walls/${localStorage.getItem('currentAlumet')}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }, 
    })
    .then(response => response.json())
    .then(data => {
        data.forEach(wall => {
            div = document.createElement('div');
            div.classList.add('wall');
            div.setAttribute('data-position', wall.position);
            div.innerHTML = `
            <div class="wall-header">
                <p class="wall-title">${wall.title}</p>
                <div class="dots"><div></div><div></div><div></div></div>
            </div>
            <button onclick="createPost('${wall._id}')" id="add-post" class="main-button">Add post</button>
            <div class="post-scroll">
                
            </div>`;
            document.querySelector('.wall-container').insertBefore(div, document.querySelector('.wall-container').childNodes[0]);
        })
    })
}
let color = 'white';
document.querySelectorAll('.color-selector > div').forEach(color => {
    color.addEventListener('click', () => {
        color = color.id
        document.querySelectorAll('.color-selector > div').forEach(selectedcolor => {
            selectedcolor.classList.remove('selected-color');
        })
        color.classList.add('selected-color');
    })
})

getWalls();





