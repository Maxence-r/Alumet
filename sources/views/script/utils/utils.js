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
        document.querySelector('.background-image').src = `/cdn/u/${data.finalAlumet.background}`;
       const layerFilter = document.querySelector('.layer-filter');
layerFilter.style.backdropFilter = `blur(${data.finalAlumet.blur.$numberDecimal}px) brightness(${data.finalAlumet.brightness.$numberDecimal})`;
layerFilter.style.webkitBackdropFilter = `blur(${data.finalAlumet.blur.$numberDecimal}px) brightness(${data.finalAlumet.brightness.$numberDecimal})`;
        if (data.finalAlumet.theme == 'dark') {
            document.documentElement.style.setProperty('--main-color', '#131313');
            document.documentElement.style.setProperty('--secondary-color', '#ffffff');
        } else {
            document.documentElement.style.setProperty('--main-color', '#f1f1f1');
            document.documentElement.style.setProperty('--secondary-color', '#131313');
        }
        document.getElementById('alumet-title').innerText = data.finalAlumet.name;
        document.getElementById('alumet-description').innerText = data.finalAlumet.description || 'Alumet, parce que l\'éducation compte.';
        document.title = 'Alumet: ' + data.finalAlumet.name;
        localStorage.setItem('modules', JSON.stringify(data.finalAlumet.modules));
        if (data.finalAlumet.modules.length < 1) {
            document.querySelector('.nav-bar').style.display = 'none';
            document.querySelector('.left-container').style.width = '100%';
        }
        localStorage.setItem('name', data.finalAlumet.name);
        localStorage.setItem('userId', data.user._id);
        getWalls();
        initModules();
    })
}

init();





function initModules() {
    JSON.parse(localStorage.getItem('modules')).forEach(module => {
        document.querySelector(`.${module}`).style.display = 'flex';
        switch (module) {
            case 'dm':
               const script = document.createElement('script');
                script.src = '../../script/modules/direct_messages.js';
                document.body.appendChild(script);
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '../../style/modules/direct_messages.css';
                document.head.appendChild(link);
                break;
            case 'hw':
                const script2 = document.createElement('script');
                script2.src = '../../script/modules/homeworks.js';
                document.body.appendChild(script2);
                const link2 = document.createElement('link');
                link2.rel = 'stylesheet';
                link2.href = '../../style/modules/homeworks.css';
                document.head.appendChild(link2);
                break;
            case 'bd':
                const script3 = document.createElement('script');
                script3.src = '../../script/modules/board.js';
                document.body.appendChild(script3);
                const link3 = document.createElement('link');
                link3.rel = 'stylesheet';
                link3.href = '../../style/modules/board.css';
                document.head.appendChild(link3);
                break;
            case 'fc':
                const script4 = document.createElement('script');
                script4.src = '../../script/modules/flashcards.js';
                document.body.appendChild(script4);
                const link4 = document.createElement('link');
                link4.rel = 'stylesheet';
                link4.href = '../../style/modules/flashcards.css';
                document.head.appendChild(link4);
                break;
        }
    }) 
}

function getWalls() {
    document.querySelectorAll('.wall').forEach(wall => wall.remove());
    fetch(`/api/wall/${path}`, {
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
                <p id="${wall._id}" class="wall-title">${wall.title}</p>
                <div id="dots-wall" onclick="modifySection('${wall._id}', '${wall.post}')" class="dots"><div></div><div></div><div></div></div>
            </div>`;
            let userID = localStorage.getItem('userId')
            if (userID.length > 50) {
                if(wall.post === true) {
                    div.innerHTML += `
                    <button onclick="createPost('${wall._id}')" id="add-post" class="main-button">Ajouter</button>
                    `
                }
            } else {
                div.innerHTML += `
                <button onclick="createPost('${wall._id}')" id="add-post" class="main-button">Ajouter</button>
                `
            }
            div.innerHTML += `
            <div class="post-scroll post-${wall._id}">
                
            </div>`
            document.querySelector('.wall-container').insertBefore(div, document.querySelector('.wall-container').childNodes[0]);
            fetch(`/api/post/${localStorage.getItem('currentAlumet')}/${wall._id}/`, {	
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                data.forEach(post => {
                    createPostHtml(post, wall._id, false);
                })
            })
        })
        document.querySelector('.loading').classList.add('hidden');
        try {
            enableDrag();
        } catch (error) {}
    })
    
}





 function createPostHtml(post, wallId, postFirst) {
    let postDiv = document.createElement('div');
    postDiv.setAttribute('data-id', post._id);
    postDiv.setAttribute('data-position', post.position);
    postDiv.setAttribute('data-wall', wallId);
    postDiv.classList.add('post');
    if (post.ownerType === "student") {
        let postheader = document.createElement('div');
        postheader.classList.add('post-header');
        postheader.innerHTML = `
                        <div class="post-user-infos">
                        <img src="../../assets/app/default.png" class="post-user-img" alt="avatar">
                        <p class="post-user-username">${post.owner}</p>
                        </div>
                        `
        if (post.owning === true) {
            postheader.innerHTML += `
                            <div onclick="editPost('${post._id}')" class="dots"><div></div><div></div><div></div></div>
                            `
        }
        postDiv.appendChild(postheader);
    } else if (post.owning) {
        postDiv.innerHTML += `
                        <div onclick="editPost('${post._id}')" id="dots-absolute" class="dots"><div></div><div></div><div></div></div>
                        `
    }
    if (post.title) {
        let postTitle = document.createElement('div');
        postTitle.classList.add('post-title');
        postTitle.innerText = `${post.title}`;
        postDiv.appendChild(postTitle);
    }
    if (post.type !== "default") {
        if (post.type === "file") {
            let filePreview = document.createElement('div');
            filePreview.classList.add('file-preview');
            filePreview.setAttribute('onclick', `openFile("${post.typeContent}", "${post.fileName}", "${post.fileExt}")`);
            let fileContainer = document.createElement('div');
            fileContainer.classList.add('file-container');
            fileContainer.id = post.fileExt;
            if (supportedPreviewAlumet[post.fileExt]) {
                fileContainer.innerHTML = `${supportedPreviewAlumet[post.fileExt].replace('*', `${window.location.protocol}//${window.location.host}/cdn/u/${post.typeContent}`)}`;
            } else {
                fileContainer.innerHTML = `<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">`;
            }
            fileContainer.innerHTML += `
                            <p class="file-type">${post.fileExt.toUpperCase()}</p>
                            `
            filePreview.appendChild(fileContainer);
            filePreview.innerHTML += `
                            <p class="file-name">${post.fileName}</p>
                            `
            postDiv.appendChild(filePreview);
        } else if (post.type === "link") {
            let filePreview = document.createElement('div');
            filePreview.classList.add('file-preview');
            filePreview.setAttribute('onclick', `openLink("${post.typeContent}")`);
            fetch('/preview/meta?url=' + post.typeContent)
                .then(res => res.json())
                .then(data => {
                    let fileContainer = document.createElement('div');
                    fileContainer.classList.add('file-container');
                    if (data.image) {
                        fileContainer.innerHTML = `<img id="cover-center" loading=\"lazy\" src=\"${data.image}">`;
                    } else {
                        fileContainer.innerHTML = `<img id="cover-center" loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">`;
                    }
                    fileContainer.innerHTML += `
                                    <p class="file-type">${data.title || "Aucun titre"}</p>
                                    `
                    filePreview.appendChild(fileContainer);
                    if (data.title) {
                        filePreview.innerHTML += `
                                        <p class="file-name">${data.url || post.typeContent}</p>
                                        `
                    } else {
                        filePreview.innerHTML += `
                                        <p class="file-name">${data.url || post.typeContent}</p>
                                        `
                    }
                })
            postDiv.appendChild(filePreview);
        }
    }
    if (post.content) {
        let postContent = document.createElement('p');
        postContent.classList.add('post-content');
        postContent.innerText = `${post.content}`;
        postDiv.appendChild(postContent);
    }
    if (post.color) {
        postDiv.classList.add(`post-${post.color}`);
    }
    if (postFirst) {
        document.querySelector(`.post-${wallId}`).insertBefore(postDiv, document.querySelector(`.post-${wallId}`).childNodes[0]);
    } else {
        document.querySelector(`.post-${wallId}`).appendChild(postDiv);
    }
}

