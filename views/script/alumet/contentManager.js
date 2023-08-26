const path = window.location.pathname;
const parts = path.split("/");
const id = parts[parts.length - 1];

function getContent() {
    fetch("/alumet/" + id + "/content")
        .then((response) => response.json())
        .then((data) => {
            document.querySelector("body").style.backgroundImage = `url(/cdn/u/${data.background})`;
            data.walls.forEach((wall) => {
                const list = createInList(wall.title, wall.postAuthorized, wall._id);
                const draggingContainer = list.querySelector(".draggingContainer");
                wall.posts.forEach((post) => {
                    const card = createTaskList(post.title, post.description);
                    draggingContainer.appendChild(card);
                });
                const button = document.getElementById("wall");
                const parent = button.parentNode;
                parent.insertBefore(list, button);
            });
            if (data.user_infos) {
                loadFiles();
            }
            document.querySelector("body > section").style.display = "none";
        });
}

function createTaskList(title, description) {
    const card = document.createElement("div");
    card.classList.add("card");
    card.draggable = true;
    const cardTitle = document.createElement("div");
    cardTitle.classList.add("title");
    cardTitle.textContent = title;
    const cardDescription = document.createElement("div");
    cardDescription.classList.add("description");
    cardDescription.textContent = description;
    card.appendChild(cardTitle);
    card.appendChild(cardDescription);
    if (!navigator.userAgent.includes("Mobile")) {
        registerEventsOnCard(card);
    }
    return card;
}

function createInList(title, authorizedPost, id) {
    const list = document.createElement("div");
    list.classList.add("list");
    const titleEl = document.createElement("h1");
    titleEl.textContent = title;
    const draggingContainer = document.createElement("div");
    draggingContainer.classList.add("draggingContainer");
    draggingContainer.setAttribute("id", id);
    list.appendChild(titleEl);
    if (authorizedPost) {
        const button = document.createElement("button");
        button.setAttribute("id", "post");
        button.classList.add("add");
        button.textContent = "Ajouter une publication";
        button.setAttribute("onclick", `navbar("post")`);
        list.appendChild(button);
    }
    list.appendChild(draggingContainer);
    if (!navigator.userAgent.includes("Mobile")) {
        registerEventsOnList(draggingContainer);
    }
    return list;
}

getContent();

function chooseFile(id) {
    const fileDiv = document.querySelector(`div[data-id="${id}"]`);
    document.querySelector(".file-sending-infos > h3").innerText = fileDiv.dataset.name;
    localStorage.setItem("file-ts", id);
    navbar("post");
    document.querySelector(".drop-box").classList.add("ready-to-send");
}

document.getElementById("load-post-file").addEventListener("click", () => {
    document.getElementById("post-file").click();
});

document.getElementById("post-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    localStorage.removeItem("file-ts");
    const formData = new FormData();
    formData.append("file", file);
    document.querySelector(".file-sending-infos > h3").innerText = file.name;
    navbar("post");
    document.querySelector(".drop-box").classList.add("ready-to-send");
});

document.getElementById("publicationDate").addEventListener("change", (e) => {
    document.querySelector(".date").classList.toggle("active-date");
});

function cancelSend() {
    localStorage.removeItem("file-ts");
    document.querySelector(".ready-to-send").classList.remove("ready-to-send");
}

function createWall() {
    let title = document.getElementById("wallTitle").value;
    let postAuthorized = document.getElementById("postAuthorized").checked;
    if (title.length < 1) {
        return toast({
            title: "Erreur",
            message: "Vous devez entrer un titre",
            type: "error",
            duration: 5000,
        });
    }
    document.querySelector(".wall > .loading").style.display = "flex";
    fetch("/api/wall/" + id, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, postAuthorized }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (!data.title) {
                document.querySelector(".wall > .loading").style.display = "none";
                return toast({
                    title: "Erreur",
                    message: data.error,
                    type: "error",
                    duration: 5000,
                });
            }
            setTimeout(() => {
                document.querySelector(".wall > .loading").style.display = "none";
                const list = createInList(data.title, data.postAuthorized);
                const button = document.getElementById("wall");
                const parent = button.parentNode;
                parent.insertBefore(list, button);
                document.getElementById("home").click();
                navButtons = document.querySelectorAll(".navbar > button, .add");
            }, 1000);
        });
}
