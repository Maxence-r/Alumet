const path = window.location.pathname;
const parts = path.split("/");
const id = parts[parts.length - 1];

function getContent() {
    fetch("/alumet/" + id + "/content")
        .then((response) => response.json())
        .then((data) => {
            localStorage.setItem("alumet", JSON.stringify(data));
            document.querySelector("body").style.backgroundImage = `url(/cdn/u/${data.background})`;
            data.walls.forEach((wall) => {
                const list = createInList(wall.title, wall.postAuthorized, wall._id);
                const draggingContainer = list.querySelector(".draggingContainer");
                wall.posts.forEach((post) => {
                    const card = createTaskList(post);
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

function createTaskList(post) {
    const card = document.createElement("div");
    card.classList.add("card");
    card.draggable = true;
    card.dataset.position = post.position;
    card.dataset.id = post._id;

    if (post.link) {
        const linkPreview = document.createElement("div");
        if (post.link.image) {
            linkPreview.style.backgroundImage = `url(${post.link.image})`;
        }
        linkPreview.classList.add("post-rich-content");
        const linkPreviewTitle = document.createElement("h2");
        linkPreviewTitle.textContent = post.link.title;
        const linkPreviewDescription = document.createElement("p");
        linkPreviewDescription.textContent = post.link.description;
        const gradient = document.createElement("div");
        gradient.classList.add("reader-gradient");
        linkPreview.appendChild(linkPreviewTitle);
        linkPreview.appendChild(linkPreviewDescription);
        linkPreview.appendChild(gradient);
        card.appendChild(linkPreview);
    }
    if (post.title) {
        const cardTitle = document.createElement("div");
        cardTitle.classList.add("title");
        cardTitle.textContent = post.title;
        card.appendChild(cardTitle);
    }
    if (post.content) {
        const cardDescription = document.createElement("div");
        cardDescription.classList.add("description");
        cardDescription.innerHTML = post.content;
        card.appendChild(cardDescription);
    }

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
        button.setAttribute("onclick", `navbar("post", "${id}")`);
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
    document.getElementById("post-file").value = "";
    document.querySelector(".ready-to-send").classList.remove("ready-to-send");
}

async function createPost() {
    let fileFromDevice = document.getElementById("post-file").files[0];
    let fileFromCloud = localStorage.getItem("file-ts");
    let title = document.getElementById("postTitle").value;
    let content = document.getElementById("editor").innerHTML;
    let postAuthorizedComments = document.getElementById("postCommentAuthorized").checked;
    let adminsOnly = document.getElementById("administatorsAuthorized").checked;
    let postDate = document.getElementById("dateFormat").value;
    let postTime = document.getElementById("timeFormat").value;
    let link = localStorage.getItem("link");

    if (!title && (!content || content === "Ecrivez ici le contenu") && !fileFromDevice && !fileFromCloud && !link) {
        return toast({
            title: "Erreur",
            message: "Vous n'avez pas spécifié de contenu pour cette publication",
            type: "error",
            duration: 5000,
        });
    }

    document.querySelector(".post > .loading").style.display = "flex";

    const body = {
        title,
        content,
        postAuthorizedComments,
        adminsOnly,
        link,
    };

    if (document.getElementById("publicationDate").checked && postDate && postTime) {
        body.postDate = convertToISODate(postDate, postTime);
    }

    if (fileFromDevice) {
        const fileUrl = await uploadFile(fileFromDevice);
        body.file = fileUrl;
    } else if (fileFromCloud) {
        body.file = fileFromCloud;
    }

    try {
        const response = await fetch("/api/post/" + JSON.parse(localStorage.getItem("alumet"))._id + "/" + localStorage.getItem("currentItem"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (data.error) {
            document.querySelector(".post > .loading").style.display = "none";
            return toast({
                title: "Erreur",
                message: data.error,
                type: "error",
                duration: 5000,
            });
        }
        navbar("home");
        setTimeout(() => {
            document.querySelector(".post > .loading").style.display = "none";
            clearPost();
        }, 1000);
    } catch (error) {
        console.error(error);
    }
}

function clearPost() {
    document.getElementById("postTitle").value = "";
    document.getElementById("editor").innerHTML = "Ecrivez ici le contenu";
    document.getElementById("post-file").value = "";
    document.getElementById("postCommentAuthorized").checked = false;
    document.getElementById("administatorsAuthorized").checked = false;
    document.getElementById("publicationDate").checked = false;
    document.querySelector(".date").classList.remove("active-date");
    document.querySelector(".drop-box").classList.remove("ready-to-send");
    oldLink = "";
    document.querySelector(".link-preview").classList.remove("active-link-preview");
    localStorage.removeItem("file-ts");
    localStorage.removeItem("link");
}

async function uploadFile(file) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);
        fetch("/cdn/upload/" + localStorage.getItem("currentFolder"), {
            method: "POST",
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    reject(data.error);
                } else {
                    resolve(data.file._id);
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
}
function convertToISODate(dateString, timeString) {
    const date = new Date(`${dateString}T${timeString}:00`);
    const isoDate = date.toISOString();
    return isoDate;
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
            }, 1000);
        });
}
