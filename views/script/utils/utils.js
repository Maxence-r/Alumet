// Load the current alumet data

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
        localStorage.setItem('modules', JSON.stringify(data.finalAlumet.modules));
        console.log(data.finalAlumet.modules);
        if (data.finalAlumet.modules.length < 1) {
            document.querySelector('.nav-bar').style.display = 'none';
        }
        localStorage.setItem('name', data.finalAlumet.name);
        localStorage.setItem('userId', data.user._id);
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
                <div onclick="modifySection('${wall._id}', '${wall.post}')" class="dots"><div></div><div></div><div></div></div>
            </div>`;
            let userID = localStorage.getItem('userId')
            if (userID.length > 50) {
                console.log(userID);
                if(wall.post === true) {
                    div.innerHTML += `
                    <button onclick="createPost('${wall._id}')" id="add-post" class="main-button">Add post</button>
                    `
                }
            } else {
                div.innerHTML += `
                <button onclick="createPost('${wall._id}')" id="add-post" class="main-button">Add post</button>
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
                console.log(data);
                data.forEach(post => {
                    createPostHtml(post, wall._id, false);
                })
            })
        })
        document.querySelector('.loading').classList.add('hidden');
        try {
            enableDrag();
        } catch (error) {}
        initModules();
    })
    
}



function createPostHtml(post, wallId, postFirst) {
    let postDiv = document.createElement('div');
                    postDiv.setAttribute('data-id', post._id);
                    postDiv.setAttribute('data-position', post.position);
                    postDiv.classList.add('post');
                    if (post.ownerType === "student") {
                        let postheader = document.createElement('div');
                        postheader.classList.add('post-header');
                        postheader.innerHTML = `
                        <div class="post-user-infos">
                        <img src="../../assets/app/default.png" class="post-user-img" alt="avatar">
                        <p class="post-user-username">${post.owner}</p>
                        <pre class="post-user-date">12/12/2021</pre>
                        </div>
                        `
                        if (post.owning === true) {
                            postheader.innerHTML += `
                            <div onclick="editPost('${post._id}')" class="dots"><div></div><div></div><div></div></div>
                            `
                        }
                        postDiv.appendChild(postheader);
                    } else {
                        postDiv.innerHTML = `
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
                            console.log(post);
                            filePreview.innerHTML = `<img loading="lazy" src="/cdn/u/${post.typeContent}"><p class="file-type">${post.fileExt.toUpperCase()}</p><p class="file-name">${post.fileName.substring(0, 36)}</p>`;
                            postDiv.appendChild(filePreview);
                        }
                    }
                    if (post.content) {
                        let postContent = document.createElement('p');
                        postContent.classList.add('post-content');
                        postContent.innerText = `${post.content}`;
                        postDiv.appendChild(postContent);
                    }
                    if (postFirst) {
                        document.querySelector(`.post-${wallId}`).insertBefore(postDiv, document.querySelector(`.post-${wallId}`).childNodes[0]);
                    } else {

                    document.querySelector(`.post-${wallId}`).appendChild(postDiv);
                    }
}

getWalls();