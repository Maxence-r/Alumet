const conversationsContainer = document.querySelector(".conversations-container");

const createConversationElement = (user, conversation) => {
    const { lastUsage, isReaded, lastMessage, _id, conversationName, conversationIcon, participants } = conversation;
    const { icon, name, lastname, isCertified, accountType } = user;
    const time = relativeTime(lastUsage);
    const conversationElement = document.createElement("div");
    conversationElement.classList.add("conversation");
    conversationElement.dataset.conversationid = _id;
    conversationElement.dataset.lastusage = lastUsage;
    conversationElement.dataset.icon = conversationIcon || icon;
    if (conversationName) {
        conversationElement.dataset.name = conversationName;
    } else {
        conversationElement.dataset.name = `${name} ${lastname}`;
    }

    const iconElement = document.createElement("img");
    iconElement.src = `/cdn/u/${conversationIcon || icon}`;
    iconElement.alt = "file icon";
    conversationElement.appendChild(iconElement);

    if (isCertified && participants.length === 1) {
        const certifiedElement = document.createElement("img");
        conversationElement.classList.add("certified");
        certifiedElement.src = `../assets/global/${accountType}-certified.svg`;
        certifiedElement.alt = "certified icon";
        conversationElement.appendChild(certifiedElement);
    }

    const infosElement = document.createElement("div");
    infosElement.classList.add("conversation-infos");
    conversationElement.appendChild(infosElement);

    const nameElement = document.createElement("h4");
    const nameString = (conversationName || name + " " + lastname).slice(0, 25);
    nameElement.textContent = `${nameString}${nameString.length < (conversationName || name + " " + lastname).length ? "..." : ""}`;
    const timeElement = document.createElement("span");
    timeElement.textContent = time;
    nameElement.appendChild(timeElement);
    infosElement.appendChild(nameElement);

    const messageElement = document.createElement("p");
    if (lastMessage && lastMessage.sender && lastMessage.content) {
        const lastMessageText = lastMessage && lastMessage.content ? (lastMessage.content.length > 25 ? lastMessage.content.slice(0, 25) + "..." : lastMessage.content) : "Pas de message";
        messageElement.textContent = lastMessage.sender + ": " + lastMessageText;
    } else {
        messageElement.textContent = "Pas de message";
    }
    infosElement.appendChild(messageElement);

    const pingElement = document.createElement("div");
    pingElement.classList.add("ping-conv");
    infosElement.appendChild(pingElement);

    if (!isReaded) {
        conversationElement.classList.add("not-readed");
    }
    conversationElement.setAttribute("onclick", `openConversation('${_id}')`);
    return conversationElement;
};

const createConversation = async () => {
    const recipient = document.querySelector("#users>option").dataset.id;
    const participants = [recipient];

    try {
        const response = await fetch("/swiftChat/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ participants }),
        });

        const data = await response.json();
        if (data.error)
            return toast({
                title: "Erreur",
                message: `${data.error}`,
                type: "error",
                duration: 5000,
            });
        const user = await getUser(data.participants[0]);
        const conversationElement = createConversationElement(user, data);
        conversationsContainer.prepend(conversationElement);
    } catch (error) {
        console.error(error);
    }
};

const newConversation = () => {
    document.querySelector(".messages > .sub-container").classList.add("creating-conversation");

    const promptInput = document.querySelector("#search-user");
    promptInput.addEventListener("keyup", async (event) => {
        document.querySelector(".participants-container").classList.add("fetching-participants");
        const response = await fetch(`/swiftChat/search?q=${event.target.value}`);
        const json = await response.json();
        if (json.length === 0) {
            document.querySelector(".participants-container").innerHTML = "<h1>Aucun utilisateur trouvé</h1>";
        } else {
            document.querySelector(".participants-container > h1").remove();
            document.querySelectorAll(".participant").forEach((participant) => participant.remove());
            json.forEach((user) => {
                const userElement = document.createElement("div");
                userElement.classList.add("participant");
                userElement.dataset.id = user._id;
                userElement.dataset.name = `${user.name} ${user.lastname}`;
                userElement.dataset.icon = user.icon;
                userElement.setAttribute("onclick", "addParticipant(this)");
                const iconElement = document.createElement("img");
                iconElement.src = `/cdn/u/${user.icon}`;
                iconElement.alt = "user icon";
                userElement.appendChild(iconElement);
                const nameElement = document.createElement("h4");
                nameElement.textContent = `${user.name} ${user.lastname}`;
                userElement.appendChild(nameElement);
                document.querySelector(".participants-container").appendChild(userElement);
            });
        }

        document.querySelector(".participants-container").classList.remove("fetching-participants");
    });
};

const getConversations = () => {
    fetch("/swiftChat")
        .then((response) => response.json())
        .then((json) => {
            const hasUnreadConversations = Array.isArray(json) && json.some((conversation) => conversation.isReaded === false);
            if (hasUnreadConversations) {
                document.getElementById("messages").classList.add("pinged");
            }
            const promises = json.map((conversation) => getUser(conversation.participants[0]));
            return Promise.all(promises).then((users) => {
                const conversations = json.map((conversation, index) => ({ conversation, user: users[index] }));
                conversations.sort((a, b) => b.conversation.lastUsage - a.conversation.lastUsage);
                conversations.forEach(({ conversation, user }) => {
                    const conversationElement = createConversationElement(user, conversation);
                    conversationsContainer.appendChild(conversationElement);
                });
            });
        })
        .catch((error) => console.error(error));
};

document.getElementById("message").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});
const sendMessageButton = document.getElementById("send-text");
if (sendMessageButton) {
    sendMessageButton.addEventListener("click", () => {
        sendMessage();
    });
}

sendMessage = () => {
    const message = document.getElementById("message").value;
    const conversationId = localStorage.getItem("currentConversation");
    fetch("/swiftChat/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, conversationId }),
    })
        .then((response) => response.json())
        .then((json) => {
            if (json.error)
                return toast({
                    title: "Erreur",
                    message: `${json.error}`,
                    type: "error",
                    duration: 5000,
                });
            document.getElementById("message").value = "";
            const messageElement = createMessageElement(json.message, json.user);
            document.querySelector(".conversation-body").prepend(messageElement);
        })
        .catch((error) => console.error(error));
};

function closeConversation() {
    document.querySelector(".messages").classList.remove("active-messages");
    localStorage.removeItem("currentConversation");
}
document.getElementById("close-conversation-button").addEventListener("click", () => {
    closeConversation();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeConversation();
    }
});
closeConversation();

function openConversation(id) {
    document.querySelector(".messages > .main-container").classList.add("active-loading");
    document.querySelector(".messages > .main-container").classList.remove("no-conversation");
    localStorage.setItem("currentConversation", id);
    document.querySelector(".messages").classList.add("active-messages");
    previousSender = null;
    document.querySelector(".conversation-body").innerHTML = "";
    document.querySelector('[data-conversationid="' + id + '"]').classList.remove("not-readed");
    let lastUsage = document.querySelector('[data-conversationid="' + id + '"]').dataset.lastusage;
    let name = document.querySelector('[data-conversationid="' + id + '"]').dataset.name;
    let icon = document.querySelector('[data-conversationid="' + id + '"]').dataset.icon;
    document.querySelector("#conversation-username").textContent = name;
    document.getElementById("conversation-lastTime").textContent = relativeTime(lastUsage);
    document.querySelector(".conversation-user-infos > img").src = `/cdn/u/${icon}`;
    fetch(`/swiftChat/${id}`)
        .then((response) => response.json())
        .then((json) => {
            if (!json) return;
            Promise.all(json.messages.map((message) => createMessageElement(message.message, message.user))).then((messageElements) => {
                const conversationBody = document.querySelector(".conversation-body");
                messageElements.forEach((messageElement) => {
                    messageElement.addEventListener("dbclick", () => {
                        deleteMessage(messageElement.dataset.messageid);
                    });
                    conversationBody.prepend(messageElement);
                });
            });
            document.querySelector(".messages > .main-container").classList.remove("active-loading");
        })
        .catch((error) => console.error(error));
}

let previousSender = null;
function createMessageElement(message, user) {
    const { sender, content, createdAt } = message;
    const messageElement = document.createElement("div");
    messageElement.dataset.messageid = message._id;
    if (previousSender !== sender) {
        messageElement.classList.add("first");
    }
    if (sender === JSON.parse(localStorage.getItem("user")).id) {
        messageElement.classList.add("right-message", "message");
    } else {
        messageElement.classList.add("left-message", "message");
    }

    const imageElement = document.createElement("img");
    imageElement.src = `/cdn/u/` + user.icon;
    imageElement.alt = "file icon";

    const messageDetailsElement = document.createElement("div");
    messageDetailsElement.classList.add("message-details");

    const userNameElement = document.createElement("p");
    userNameElement.classList.add("user-name");
    userNameElement.textContent = user.name + " " + user.lastname;

    if (user.isCertified) {
        const certifiedElement = document.createElement("img");
        certifiedElement.src = `../assets/global/${user.accountType}-certified.svg`;
        certifiedElement.alt = "certified icon";
        userNameElement.appendChild(certifiedElement);
    }

    const createAt = document.createElement("span");
    createAt.id = "message-date";
    createAt.textContent = relativeTime(createdAt);
    userNameElement.appendChild(createAt);

    const messageContentElement = document.createElement("p");
    messageContentElement.classList.add("message-content");
    messageContentElement.textContent = content;

    messageDetailsElement.appendChild(userNameElement);
    messageDetailsElement.appendChild(messageContentElement);
    messageElement.appendChild(imageElement);
    messageElement.appendChild(messageDetailsElement);

    previousSender = sender;
    return messageElement;
}

document.getElementById("search-conv").addEventListener("input", (e) => {
    const search = e.currentTarget.value.toLowerCase();
    const allConversations = document.querySelectorAll(".conversation");
    allConversations.forEach((conversation) => {
        const conversationName = conversation.dataset.name.toLowerCase();
        if (conversationName.includes(search)) {
            conversation.style.display = "flex";
        } else {
            conversation.style.display = "none";
        }
    });
});

function deleteMessage(id) {
    fetch(`/swiftChat/delete/${id}`, {
        method: "DELETE",
    })
        .then((response) => response.json())
        .then((json) => {
            if (json.error)
                return toast({
                    title: "Erreur",
                    message: `${json.error}`,
                    type: "error",
                    duration: 5000,
                });
            document.querySelector(`[data-messageid="${id}"]`).remove();
        })
        .catch((error) => console.error(error));
}

getConversations();
