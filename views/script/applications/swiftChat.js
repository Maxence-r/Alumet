function newConversation() {
    createPrompt({
        head: 'Nouvelle conversation',
        placeholder: 'Nom de la conversation',
        action: 'createConversation()',
        list: 'users'
    });
    document.getElementById('prompt-input').addEventListener('keyup', function (event) {
        console.log(event.target.value);
        fetch('/conversation/search?q=' + event.target.value)
            .then(function (response) {
                return response.json();
            }
        ).then(function (json) {
            let datalist = document.getElementById('users');
            datalist.innerHTML = '';
            json.forEach(function (user) {
                console.log(user);
                let option = document.createElement('option');
                option.value = user.name + ' ' + user.lastname;
                option.dataset.id = user._id;
                datalist.appendChild(option);
            })
        });
    });
};

function createConversation() {
    let recipient = document.querySelector('#users>option').dataset.id;
    let users = [recipient];
    fetch('/conversation/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            participants: users,
        })
    })
        .then(function (response) {
        return response.json();
    })
        .then(function (json) {
            console.log(json);
        }
    );    
}

function getConversations() {
    fetch('/conversation')
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            json.forEach(function (conversation) {
                console.log(conversation)
                getUser(conversation.participants[0])
                .then(function (user) {
                    let time = relativeTime(conversation.lastUsage);
                    let icon = user.icon;
                    let name = user.name + ' ' + user.lastname;
                    let isVerified = user.isVerified;
                    let isReaded = conversation.isReaded;
                    let lastMessage = conversation.lastMessage;
                    
                    let conversationElement = createConversationElement(name, time, icon, isVerified, lastMessage, isReaded);
                    document.querySelector('.conversations-container').appendChild(conversationElement);
                });
            }
        )}
    );
} 


function createConversationElement(name, time, icon, isVerified, lastMessage, isReaded) {
  const conversationElement = document.createElement('div');
  conversationElement.classList.add('conversation');

  const iconElement = document.createElement('img');
  iconElement.src = '/cdn/u/' + icon;
  iconElement.alt = 'file icon';
  conversationElement.appendChild(iconElement);
  if (isVerified) {
    const certifiedElement = document.createElement('img');
    conversationElement.classList.add('verified');
    certifiedElement.src = '../assets/global/certified.svg';
    certifiedElement.alt = 'certified icon';
    conversationElement.appendChild(certifiedElement);
  }

  let infosElement = document.createElement('div');
  infosElement.classList.add('conversation-infos');
  conversationElement.appendChild(infosElement);

  const nameElement = document.createElement('h4');
  nameElement.textContent = name;
  const timeElement = document.createElement('span');
  timeElement.textContent = time;
  nameElement.appendChild(timeElement);
  infosElement.appendChild(nameElement);

  const messageElement = document.createElement('p');
  messageElement.textContent = lastMessage;
  infosElement.appendChild(messageElement);

  const pingElement = document.createElement('div');
  pingElement.classList.add('ping-conv');
  infosElement.appendChild(pingElement);
  if (isReaded) {
    conversationElement.classList.add('readed');
  }

  return conversationElement;
}

getConversations();