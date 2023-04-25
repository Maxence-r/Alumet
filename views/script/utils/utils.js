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
        document.title = 'Alumet: ' + data.finalAlumet.name;
        localStorage.setItem('modules', JSON.stringify(data.finalAlumet.modules));
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
        initModules();
    })
    
}
let supportedPreviewAlumet = {
    "pdf": "<img loading=\"lazy\" src=\"/preview/pdf?url=*\">",
    "png": "<img loading=\"lazy\" src=\"/preview/image?url=*\">",
    "jpg": "<img loading=\"lazy\" src=\"/preview/image?url=*\">",
    "jpeg": "<img loading=\"lazy\" src=\"/preview/image?url=*\">",
    "gif": "<img loading=\"lazy\" src=\"/preview/image?url=*\">",
    "apng": "<img loading=\"lazy\" src=\"/preview/image?url=*\">",
    "avif": "<img loading=\"lazy\" src=\"/preview/image?url=*\">",
    "webp": "<img loading=\"lazy\" src=\"/preview/image?url=*\">",
    "mp4": "<video width=\"400\" controls=\"false\" preload=\"metadata\"><source src=\"*\" type=\"video/mp4\"></video>",
    "webm": "<video width=\"400\" controls=\"controls\" preload=\"metadata\"><source src=\"*\" type=\"video/mp4\"></video>",
    "ogg": "<video width=\"400\" controls=\"controls\" preload=\"metadata\"><source src=\"*\" type=\"video/mp4\"></video>",
    "mp3": "<audio class=\"audio-view\" controls><source src=\"*\" type=\"audio/mpeg\"></audio>",
    "wav": "<audio class=\"audio-view\" controls><source src=\"*\" type=\"audio/wav\"></audio>",
    "flac": "<audio class=\"audio-view\" controls><source src=\"*\" type=\"audio/flac\"></audio>",
    "pptx": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
    "odt": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
    "ods": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
    "ppt": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
    "odp": "<img loading=\"lazy\" src=\"./....//assets/app/empty_preview.png\">",
    "docx": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
    "doc": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
    "xlsx": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
    "xls": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">"
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
                            if (supportedPreviewAlumet[post.fileExt]) {
                                filePreview.innerHTML = `${supportedPreviewAlumet[post.fileExt].replace('*', `${window.location.protocol}//${window.location.host}/cdn/u/${post.typeContent}`)}`;
                            } else {
                                filePreview.innerHTML = `<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">`;
                            }
                            filePreview.innerHTML += `
                            <p class="file-type">${post.fileExt.toUpperCase()}</p><p class="file-name">${post.fileName.substring(0, 36)}</p>
                            `
                            postDiv.appendChild(filePreview);
                        } else if (post.type === "link") {
                            if (post.typeContent.includes("youtube")) {
                                let youtubePreview = document.createElement('div');
                                youtubePreview.classList.add('youtube-preview');
                                youtubePreview.innerHTML = `
                                <img loading="lazy" src="https://img.youtube.com/vi/${post.typeContent.split('v=')[1]}/maxresdefault.jpg">
                                `
                                postDiv.appendChild(youtubePreview);
                            } else {
                                let linkPreview = document.createElement('div');
                                linkPreview.classList.add('link-preview');
                                linkPreview.innerHTML = `
                                <a href="${post.typeContent}" target="_blank"><img loading="lazy" src="https://www.google.com/s2/favicons?domain=${post.typeContent}"><p>${post.typeContent}</p></a>
                                `
                                postDiv.appendChild(linkPreview);
                            }
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