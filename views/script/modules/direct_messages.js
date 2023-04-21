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
        document.querySelector('.conversation').appendChild(div);
        let elem = document.querySelector('.conversation');
        elem.scrollTop = elem.scrollHeight;
})


document.querySelector('.modules-container').innerHTML = `
<div class="conversation-container">
    <div class="conversation-header">
        <p>${localStorage.getItem('name').substring(0, 20)}</p>
        <span class="loader"></span>
    </div>
    <div class="conversation">
    </div>
    <div class="conversation-footer">
        <input type="text" placeholder="Type a message" class="message-input">
        <button class="l-preview send-button" id="accent" type="button" onclick="this.classList.add('button--loading')">
            <span class="button__text"><img class="img-preview" src="../../assets/app/open.svg"></span>
        </button>
    </div>
</div>`;

function getMessages() {
     fetch(`http://localhost:3000/api/dm/get/${localStorage.getItem('currentAlumet')}`, {
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
            document.querySelector('.conversation').appendChild(div);
        })
        let elem = document.querySelector('.conversation');
        elem.scrollTop = elem.scrollHeight;
    })
}

getMessages();

function sendMessage() {
    let message = document.querySelector('.conversation-footer > input').value;
    if (message.length === 0) return;
    fetch(`http://localhost:3000/api/dm/send/${localStorage.getItem('currentAlumet')}`, {
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

document.querySelector('.send-button').addEventListener('click', () => {
    sendMessage();
})

document.querySelector('.conversation-footer > input').addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        document.querySelector('.send-button').classList.add('button--loading');
        sendMessage();
    }
})