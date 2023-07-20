const conversationsContainer = document.querySelector('.conversations-container');

const createConversationElement = (user, conversation) => {
  const { lastUsage, isReaded, lastMessage, _id } = conversation;
  const { icon, name, lastname, isCertified } = user;
  const time = relativeTime(lastUsage);

  const conversationElement = document.createElement('div');
  conversationElement.classList.add('conversation');
  conversationElement.dataset.conversationid = _id;

  const iconElement = document.createElement('img');
  iconElement.src = `/cdn/u/${icon}`;
  iconElement.alt = 'file icon';
  conversationElement.appendChild(iconElement);

  if (isCertified) {
    const certifiedElement = document.createElement('img');
    conversationElement.classList.add('certified');
    certifiedElement.src = '../assets/global/certified.svg';
    certifiedElement.alt = 'certified icon';
    conversationElement.appendChild(certifiedElement);
  }

  const infosElement = document.createElement('div');
  infosElement.classList.add('conversation-infos');
  conversationElement.appendChild(infosElement);

  const nameElement = document.createElement('h4');
  nameElement.textContent = `${name} ${lastname}`;
  const timeElement = document.createElement('span');
  timeElement.textContent = time;
  nameElement.appendChild(timeElement);
  infosElement.appendChild(nameElement);

  const messageElement = document.createElement('p');
  messageElement.textContent = lastMessage || "Pas de messages";
  infosElement.appendChild(messageElement);

  const pingElement = document.createElement('div');
  pingElement.classList.add('ping-conv');
  infosElement.appendChild(pingElement);

  if (!isReaded) {
    conversationElement.classList.add('not-readed');
  }
  conversationElement.setAttribute('onclick', `openConversation('${_id}')`);
  return conversationElement;
};

const createConversation = async () => {
  const recipient = document.querySelector('#users>option').dataset.id;
  const participants = [recipient];

  try {
    const response = await fetch('/conversation/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ participants })
    });

    const data = await response.json();
    if (data.error) return toast({
        title: 'Erreur',
        message: `${data.error}`,
        type: 'error',
        duration: 5000
    });
    const user = await getUser(data.participants[0]);
    const conversationElement = createConversationElement(user, data);
    conversationsContainer.prepend(conversationElement);
  } catch (error) {
    console.error(error);
  }
};

const newConversation = () => {
  createPrompt({
    head: 'Nouvelle conversation',
    placeholder: 'Nom de la conversation',
    action: 'createConversation()',
    list: 'users'
  });

  const promptInput = document.querySelector('#prompt-input');
  promptInput.addEventListener('keyup', async (event) => {
    const response = await fetch(`/conversation/search?q=${event.target.value}`);
    const json = await response.json();
    const datalist = document.getElementById('users');
    datalist.innerHTML = '';

    json.forEach(user => {
      const { _id, name, lastname } = user;
      const option = document.createElement('option');
      option.value = `${name} ${lastname}`;
      option.dataset.id = _id;
      datalist.appendChild(option);
    });
  });
};

const getConversations = () => {
  fetch('/conversation')
    .then(response => response.json())
    .then(json => {
      const hasUnreadConversations = json.some(conversation => conversation.isReaded === false);
      if (hasUnreadConversations) {
        document.getElementById('messages').classList.add('pinged');
      }
      const promises = json.map(conversation => getUser(conversation.participants[0]));
      return Promise.all(promises)
        .then(users => {
          const conversations = json.map((conversation, index) => ({ conversation, user: users[index] }));
          conversations.sort((a, b) => b.conversation.lastUsage - a.conversation.lastUsage);
          conversations.forEach(({ conversation, user }) => {
            const conversationElement = createConversationElement(user, conversation);
            conversationsContainer.appendChild(conversationElement);
          });
        });
    })
    .catch(error => console.error(error));
};


document.getElementById('message').addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

sendMessage = () => {
  const message = document.getElementById('message').value;
  const conversationId = localStorage.getItem('currentConversation');
  fetch('/conversation/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message, conversationId })
  })
    .then(response => response.json())
    .then(json => {
      if (json.error) return toast({
        title: 'Erreur',
        message: `${json.error}`,
        type: 'error',
        duration: 5000
      });
      document.getElementById('message').value = '';
      const messageElement = createFirstMessageElement(json.message, json.user);
      document.querySelector('.conversation-body').prepend(messageElement);
    })
    .catch(error => console.error(error));
};

localStorage.removeItem('currentConversation');
function openConversation(id) {
    document.querySelector('.messages > .main-container').classList.add('active-loading');
    document.querySelector('.messages > .main-container').classList.remove('no-conversation');
    localStorage.setItem('currentConversation', id);
    document.querySelector('.messages').classList.add('active-messages');
    previousSender = null;
    document.querySelector('.conversation-body').innerHTML = '';
    document.querySelector('[data-conversationid="' + id + '"]').classList.remove('not-readed');
    fetch(`/conversation/${id}`)
      .then(response => response.json())
      .then(json => {
        if (!json) return
        Promise.all(json.messages.map(message => createFirstMessageElement(message.message, message.user )))
          .then(messageElements => {
            const conversationBody = document.querySelector('.conversation-body');
            messageElements.forEach(messageElement => conversationBody.prepend(messageElement));
          });
          document.querySelector('.messages > .main-container').classList.remove('active-loading');
      }) 
      .catch(error => console.error(error));
}

let previousSender = null;
function createFirstMessageElement(message, user) {
    const { sender, content, createdAt, isReaded } = message;
    const messageElement = document.createElement('div');
    if (previousSender !== sender) {
        messageElement.classList.add('first');
    }
    if(sender === JSON.parse(localStorage.getItem('user')).id) {
        messageElement.classList.add('right-message', 'message');
    } else {
        messageElement.classList.add('left-message', 'message');
    }
    
    const imageElement = document.createElement('img');
    imageElement.src = `/cdn/u/` + user.icon;
    imageElement.alt = 'file icon';

    const messageDetailsElement = document.createElement('div');
    messageDetailsElement.classList.add('message-details');

    const userNameElement = document.createElement('p');
    userNameElement.classList.add('user-name');
    userNameElement.textContent = user.name + ' ' + user.lastname;

    const createAt = document.createElement('span');
    createAt.id = 'message-date';
    createAt.textContent = relativeTime(createdAt);
    userNameElement.appendChild(createAt);

    const messageContentElement = document.createElement('p');
    messageContentElement.classList.add('message-content');
    messageContentElement.textContent = content;

    messageDetailsElement.appendChild(userNameElement);
    messageDetailsElement.appendChild(messageContentElement);
    messageElement.appendChild(imageElement);
    messageElement.appendChild(messageDetailsElement);

    previousSender = sender;
    return messageElement;
}



getConversations();