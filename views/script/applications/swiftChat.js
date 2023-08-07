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
    const nameString = (conversationName || name + " " + lastname).slice(0, 20);
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
    if (participants.length === 0) return toast({ title: "Erreur", message: "Vous devez sélectionner au moins un utilisateur", type: "error", duration: 5000 });
    const conversationName = document.querySelector("#prompt-input").value;
    try {
        const response = await fetch("/swiftChat/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                participants: participants,
                name: conversationName ? conversationName : undefined,
            }),
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
        document.querySelector(".creating-conversation").classList.remove("creating-conversation");
        document.querySelectorAll("[data-id]").forEach((element) => {
            element.remove();
        });
        participants = [];
    } catch (error) {
        console.error(error);
    }
};

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};

function initConversation() {
    const messagesContainer = document.querySelector(".messages");
    const subContainer = messagesContainer.querySelector(".sub-container");
    subContainer.classList.add("creating-conversation");
    newConversation("search-user", "participants-container", "create-conversation", "confirmed-participants");
}

let participants = [];

const newConversation = (input, participantsBox, mainContainer, confirmed) => {
    const promptInput = document.getElementById(`${input}`);
    const participantsContainer = document.querySelector(`.${participantsBox}`);
    const container = document.querySelector(`.${mainContainer}`);
    const confirmedParticipants = document.querySelector(`.${confirmed}`);

    confirmedParticipants.addEventListener("click", (event) => {
        let clickedElement = event.target;
        while (clickedElement !== confirmedParticipants) {
            if (clickedElement.classList.contains("participant")) {
                const userId = clickedElement.dataset.id;
                removeParticipant(userId);
                return;
            }
            clickedElement = clickedElement.parentNode;
        }
    });

    participantsContainer.addEventListener("click", (event) => {
        let clickedElement = event.target;
        while (clickedElement !== participantsContainer) {
            if (clickedElement.classList.contains("participant")) {
                const userId = clickedElement.dataset.id;
                addParticipant(userId);
                return;
            }
            clickedElement = clickedElement.parentNode;
        }
    });

    const addParticipant = (user) => {
        userElement = document.querySelector("[data-id='" + user + "']");
        console.log(participants);
        if (participants.includes(user)) {
            return toast({
                title: "Erreur",
                message: "Vous avez déjà ajouté cet utilisateur",
                type: "error",
                duration: 5000,
            });
        }
        participants.push(user);
        confirmedParticipants.appendChild(userElement);
        container.classList.remove("searching-users");
        promptInput.value = "";
    };

    function removeParticipant(user) {
        userElement = document.querySelectorAll("[data-id='" + user + "']").forEach((element) => {
            element.remove();
        });
        participants.splice(participants.indexOf(user), 1);
    }

    const clearParticipants = () => {
        document.querySelectorAll(`.${participantsBox} > div`).forEach((element) => {
            element.remove();
        });
    };

    const showParticipants = (users) => {
        if (users.length === 0) {
            container.classList.remove("searching-users");
        } else {
            container.classList.add("searching-users");
            clearParticipants();
            users.forEach((user) => {
                const userElement = document.createElement("div");
                userElement.classList.add("participant");
                userElement.dataset.id = user._id;
                const iconElement = document.createElement("img");
                iconElement.src = `/cdn/u/${user.icon}`;
                iconElement.alt = "user icon";
                userElement.appendChild(iconElement);

                const columnInfosElement = document.createElement("div");
                columnInfosElement.classList.add("column-infos");
                userElement.appendChild(columnInfosElement);

                const nameElement = document.createElement("h4");
                nameElement.textContent = `${user.name} ${user.lastname}`;
                columnInfosElement.appendChild(nameElement);

                const accountTypeElement = document.createElement("span");
                accountTypeElement.textContent = user.accountType;
                columnInfosElement.appendChild(accountTypeElement);

                participantsContainer.appendChild(userElement);
            });
        }
    };

    const searchUsers = async (query) => {
        try {
            const response = await fetch(`/swiftChat/search?q=${query}`);
            const json = await response.json();
            showParticipants(json);
        } catch (err) {
            console.error(err);
        }
    };

    const debouncedSearchUsers = debounce(searchUsers, 500);

    promptInput.addEventListener("input", (event) => {
        const query = event.target.value.trim();
        if (query === "") {
            participantsContainer.classList.remove("searching-users");
        } else {
            debouncedSearchUsers(query);
        }
    });
};

/* End search manager */

document.getElementById("create-conversation").addEventListener("click", () => {
    if (participants.length >= 2) {
        return createPrompt({
            head: "Nom de la converstion",
            desc: "Veuillez donner un nom a cette conversation de groupe",
            placeholder: "Nom de la conversation",
            action: "createConversation()",
        });
    }
    createConversation();
});

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

function sendMessage() {
    const message = document.getElementById("message").value;
    const conversationId = localStorage.getItem("currentConversation");
    if (document.getElementById("message").value === "") return;
    document.getElementById("message").value = "";
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
            const messageElement = createMessageElement(json.message, json.user);
            messageElement.classList.add("new-message");
            document.querySelector(".conversation-body").prepend(messageElement);
        })
        .catch((error) => console.error(error));
};

function closeConversation() {
    document.querySelector('.messages > .main-container').classList.remove("showing-group-settings");
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
    console.log('[data-conversationid="' + id + '"]'    );
    if (document.querySelector('[data-conversationid="' + id + '"]').classList.contains("not-readed")) {
        document.querySelector('[data-conversationid="' + id + '"]').classList.remove("not-readed");
    }
    
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
                    conversationBody.prepend(messageElement);
                });
            });
            /** Code for the group settings */
            const participants = json.participants;
            const conversationName = json.conversationName;
            const conversationIcon = json.conversationIcon;

            if (participants.length > 2) {
                createConversationParametersElement(conversationName, conversationIcon, participants);
                document.querySelectorAll(".participant-options-container").forEach((element) => {
                    element.addEventListener("click", () => {
                        document.querySelector(`[data-popup-conversation-id="${element.dataset.participantOptionsContainerId}"]`).style.display = "flex";
                    });
                });

                document.querySelector(".messages > .main-container").classList.remove("active-loading");
                return;
            } else {
                console.log('Parameters for conversation of 2 persons are not configure yet')
            }
            document.querySelector(".messages > .main-container").classList.remove("active-loading");
        })
        .catch((error) => console.error(error));
}
function findOrCreateConversation (userId) {
    fetch(`/swiftChat/findOrCreate/${userId}`)
        .then((response) => response.json())
        .then((json) => {
            if (json.error)
                return toast({
                    title: "Erreur",
                    message: `${json.error}`,
                    type: "error",
                    duration: 5000,
                });
            if (json.conversationId === null) {
                participants = [userId];
                closeConversation();
                createConversation();
                openConversation(json.conversationId);
            } else {
                closeConversation();
                openConversation(json.conversationId);
            }
        })
        .catch((error) => console.error(error));
}

function promoteAdmin(userId, conversationId) {
    fetch(`/swiftChat/${conversationId}/promoteAdmin/${userId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversationId, userId }),
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
            return toast({
                title: "Succès",
                message: `${json.message}`,
                type: "success",
                duration: 5000,
            });
        })
        .catch((error) => console.error(error));
}

function removeUser(userId, conversationId) {
    fetch(`/swiftChat/${conversationId}/removeUser/${userId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversationId, userId }),
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
            return toast({
                title: "Succès",
                message: `${json.message}`,
                type: "success",
                duration: 5000,
            });
        })
        .catch((error) => console.error(error));
}



function createConversationParametersElement(conversationName, conversationIcon, participants) {
    const parameterGroupIcon = document.querySelector(".group-infos > .group-profile-picture");
    const parameterGroupName = document.querySelector("#parameter-group-name");
    const parameterParticipantsContainer = document.querySelector(".group-participants-container > .participants-list");

    parameterGroupIcon.src = `/cdn/u/${conversationIcon}`;
    parameterGroupName.textContent = conversationName;
    parameterParticipantsContainer.innerHTML = "";
    participants.forEach((participant) => {
        const participantElement = document.createElement("div");
        participantElement.classList.add("participant");
        participantElement.dataset.participantId = participant.id;

        const infosElement = document.createElement("div");
        infosElement.classList.add("infos");
        participantElement.appendChild(infosElement);

        const iconElement = document.createElement("img");
        iconElement.src = `/cdn/u/${participant.icon}`;
        iconElement.alt = "user icon";
        infosElement.appendChild(iconElement);

        const subInfosElement = document.createElement("div");
        subInfosElement.classList.add("sub-infos");
        infosElement.appendChild(subInfosElement);

        const nameElement = document.createElement("h4");
        nameElement.textContent = `${participant.name} ${participant.lastname}`;
        subInfosElement.appendChild(nameElement);

        const roleElement = document.createElement("p");
        roleElement.textContent = participant.role;
        subInfosElement.appendChild(roleElement);

        const participantOptionsContainerElement = document.createElement("div");
        participantOptionsContainerElement.classList.add("participant-options-container");
        participantOptionsContainerElement.dataset.participantOptionsContainerId = participant.id;
        participantElement.appendChild(participantOptionsContainerElement);

        const participantOptionsElement = document.createElement("img");
        participantOptionsElement.src = "../../assets/global/dots.svg";
        participantOptionsElement.alt = "options icon";
        participantOptionsElement.dataset.dotsId = participant.id;
        participantOptionsContainerElement.appendChild(participantOptionsElement);

        const participantOptionsPopupElement = document.createElement("div");
        participantOptionsPopupElement.style.display = "none";
        participantOptionsPopupElement.classList.add("participant-options-popup");
        participantOptionsPopupElement.dataset.popupConversationId = participant.id;
        participantOptionsContainerElement.appendChild(participantOptionsPopupElement);

        const participantOptionPrivateMessage = document.createElement("div");
        participantOptionPrivateMessage.classList.add("participant-option");
        participantOptionPrivateMessage.dataset.id = participant.id;
        participantOptionPrivateMessage.dataset.option = "private-message";
        participantOptionPrivateMessage.textContent = "Ouvrir la conversation";
        participantOptionsPopupElement.appendChild(participantOptionPrivateMessage);

        const participantOptionDivider1 = document.createElement("div");
        participantOptionDivider1.classList.add("participant-option-divider");
        participantOptionsPopupElement.appendChild(participantOptionDivider1);

        const participantOptionAdmin = document.createElement("div");
        participantOptionAdmin.classList.add("participant-option");
        participantOptionAdmin.dataset.id = participant.id;
        participantOptionAdmin.dataset.option = "admin";
        participantOptionAdmin.textContent = "Promouvoir administrateur";
        participantOptionsPopupElement.appendChild(participantOptionAdmin);

        const participantOptionDivider2 = document.createElement("div");
        participantOptionDivider2.classList.add("participant-option-divider");
        participantOptionsPopupElement.appendChild(participantOptionDivider2);

        const participantOptionRemove = document.createElement("div");
        participantOptionRemove.classList.add("participant-option");
        participantOptionRemove.dataset.id = participant.id;
        participantOptionRemove.dataset.option = "remove";
        participantOptionRemove.textContent = "Retirer du groupe";
        participantOptionsPopupElement.appendChild(participantOptionRemove);

        parameterParticipantsContainer.appendChild(participantElement);
    });
    document.querySelectorAll('.participant-options-popup').forEach((element) => {
    element.addEventListener("click", (event) => {
        let clickedElement = event.target;
        while (clickedElement !== element) {
            if (clickedElement.classList.contains("participant-option")) {
                const conversationId = localStorage.getItem("currentConversation");
                console.log('converasiton ID :' + conversationId)
                const userId = clickedElement.dataset.id;
                const option = clickedElement.dataset.option;
                if (option === "private-message") {
                    findOrCreateConversation(userId);
                } else if (option === "admin") {
                    promoteAdmin(userId, conversationId);
                    console.log('promote admin');
                } else if (option === "remove") {
                    console.log('remove user')
                }
                return;
            }
            clickedElement = clickedElement.parentNode;
        }
    });

    document.querySelectorAll('.participant-options-container').forEach((element) => {
        window.addEventListener("click", (event) => {
            if (
                event.target !== element &&
                !element.contains(event.target)
            ) {
                const document1 = document.querySelector(`[data-popup-conversation-id="${element.dataset.participantOptionsContainerId}"]`);
                document1.style.display = "none";
            }
        });

    });
});

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

document.querySelector(".options > img").addEventListener("click", (e) => {
    document.querySelector(".messages > .main-container").classList.add("showing-group-settings");
});

document.querySelector(".group-profile-picture").addEventListener("click", () => {
    console.log('click');
    document.querySelector(".group-profile-picture-input").click();
});