console.log('direct_messages.js loaded')

socket.on(`message-${localStorage.getItem('currentAlumet')}`, data => {
    let div = document.createElement('div');
        div.classList.add('user-message');
        div.innerHTML = `
        <div class="username">
            <p>${data.owner}</p>
        </div>
        <div class="message">
            <p>${data.message}</p>
        </div>`
        document.getElementById('conversation').appendChild(div);
        let elem = document.getElementById('conversation');
        elem.scrollTop = elem.scrollHeight;
})


document.querySelector('.modules-container').innerHTML += `
<div id="dm" class="module-container module">
    <div class="module-header">
        <p>${localStorage.getItem('name')}</p>
        <span class="loader"></span>
    </div>
    <div id="conversation" class="conversation">
    </div>
    <div class="module-footer">
        <input id="message-input" type="text" placeholder="Envoyer un message" class="message-input">
        <button class="l-preview send-button" id="accent" type="button" onclick="this.classList.add('button--loading')">
            <span class="button__text"><img class="img-preview" src="../../assets/app/open.svg"></span>
        </button>
    </div>
</div>`;

setTimeout(() => {
    document.querySelector('.send-button').addEventListener('click', () => {
        sendMessage();
    })


    document.querySelector('.message-input').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            document.querySelector('.send-button').classList.add('button--loading');
            sendMessage();
        }
    })
}, 1000)

function getMessages() {
     fetch(`/api/dm/get/${localStorage.getItem('currentAlumet')}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        data.forEach(message => {
            let div = document.createElement('div');
            div.classList.add('user-message');
            div.innerHTML = `
            <div class="username">
                <p>${message.owner}</p>
            </div>
            <div class="message">
                <p>${message.content}</p>
            </div>`
            document.getElementById('conversation').appendChild(div);
        })
        let elem = document.getElementById('conversation');
        elem.scrollTop = elem.scrollHeight;
    })
}
getMessages();

function sendMessage() {
    let message = document.getElementById('message-input').value;
    if (message.length === 0) return;
    fetch(`/api/dm/send/${localStorage.getItem('currentAlumet')}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            content: message
        })
    })
    .then(response => response.json())
    .then(data => {
        document.querySelector('.send-button').classList.remove('button--loading');
        document.querySelector('.message-input').value = '';
    })
}





