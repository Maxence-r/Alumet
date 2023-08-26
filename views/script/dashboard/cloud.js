const folderList = document.querySelector(".folder-list");
const folderSelection = document.getElementById("folder-selection");

function createOption(folder) {
    const option = document.createElement("option");
    option.value = folder._id;
    option.innerText = folder.name;
    return option;
}

function createFolderElement(folder) {
    const h2 = document.createElement("h2");
    h2.dataset.id = folder._id;
    h2.innerText = folder.name;
    return h2;
}

function openDetails(id) {
    localStorage.setItem("currentFile", id);
    let file = document.querySelector(".files-items").querySelector(`div[data-id="${id}"]`);
    document.querySelector(".file-basic-info > h4").innerText = file.dataset.name;
    document.getElementById("file-size").innerText = file.dataset.size;
    document.getElementById("file-date").innerText = file.dataset.date;
    const ext = file.dataset.ext;
    document.getElementById("file-ext").innerText = ext.charAt(0).toUpperCase() + ext.slice(1);
    document.querySelector(".file-info").classList.remove("no-selected-file");
    document.querySelector(".file-basic-info > img").src = file.dataset.imgRef;
    document.querySelector(".file-basic-info > img").alt = "file icon";
    const endpoint = endpointReference[file.dataset.ext];
    if (endpoint) {
        document.querySelector(".file-preview > img").src = `${endpoint.replace("*", id)}`;
    } else {
        document.querySelector(".file-preview > img").src = "../assets/files-icons/not-supported.png";
    }
    document.querySelector(".file-preview > img").alt = "file preview";
    setPictureOnError(document.querySelector(".file-preview > img"), "file");
    document.querySelector(".right-container").classList.add("active-sub-container");
}

function createFileElement(file) {
    const div = document.createElement("div");
    div.dataset.id = file._id;
    div.dataset.name = file.displayname;
    div.dataset.ext = file.mimetype;
    div.dataset.size = (file.filesize / 1024 / 1024).toFixed(2) + " Mo";
    div.dataset.date = file.date.split("T")[0];
    div.setAttribute("onclick", `openDetails('${file._id}')`);
    div.classList.add("file-item");
    const subDiv = document.createElement("div");
    subDiv.classList.add("file-name");
    const img = document.createElement("img");
    let imgRef = fileIconReference[file.mimetype];
    if (imgRef) {
        img.src = `${fileIconReference[file.mimetype]}`;
    } else {
        img.src = "../assets/files-icons/unknow.png";
        imgRef = "../assets/files-icons/unknow.png";
    }
    div.dataset.imgRef = imgRef;
    img.alt = "file icon";
    const h4 = document.createElement("h4");
    const span = document.createElement("span");
    span.innerText = file.displayname.split(".")[0];
    h4.appendChild(span);
    h4.innerText += `.${file.displayname.split(".").pop()}`;
    subDiv.appendChild(img);
    subDiv.appendChild(h4);
    div.appendChild(subDiv);
    const sizeH4 = document.createElement("h4");
    sizeH4.innerText = (file.filesize / 1024 / 1024).toFixed(2) + " Mo";
    div.appendChild(sizeH4);
    const dateH4 = document.createElement("h4");
    dateH4.innerText = file.date.split("T")[0];
    div.appendChild(dateH4);
    return div;
}

function loadFolder(id) {
    document.querySelector(".files-items").classList.add("loading-files");
    localStorage.setItem("currentFolder", id);
    fetch(`/cdn/folder/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            document.querySelectorAll(".file-item").forEach((file) => file.remove());
            data.forEach((file) => {
                const fileElement = createFileElement(file);
                document.querySelector(".files-items").appendChild(fileElement);
            });
            document.querySelector(".files-items").classList.remove("loading-files");
        });
}

function editFolder() {
    createPrompt({
        head: "Renommer le dossier",
        placeholder: "Nouveau nom",
        action: "renameFolder()",
        redAction: "deleteFolder()",
        redActionText: "Supprimer le dossier",
    });
}

function modifyFile() {
    createPrompt({
        head: "Renommer le fichier",
        placeholder: "Nouveau nom",
        action: "renameFileRequest()",
        redAction: "deleteFile()",
        redActionText: "Supprimer ce fichier",
    });
}

function deleteFile() {
    fetch(`/cdn/${localStorage.getItem("currentFile")}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                toast({
                    title: "Erreur",
                    message: `${data.error}`,
                    type: "error",
                    duration: 5000,
                });
                return;
            }
            toast({
                title: "Succès",
                message: "Le fichier a été supprimé.",
                type: "success",
                duration: 5000,
            });
            document.querySelector('.files-items > div[data-id="' + localStorage.getItem("currentFile") + '"]').remove();
            document.querySelector(".file-info").classList.add("no-selected-file");
            document.querySelector(".right-container").classList.remove("active-sub-container");
            localStorage.removeItem("currentFile");
            if (document.querySelector(".active-popup")) {
                document.querySelector(".active-popup").classList.remove("active-popup");
            }
        });
    updateStats();
}
localStorage.removeItem("currentFile");
document.addEventListener("keydown", (e) => {
    if (e.keyCode === 46 && localStorage.getItem("currentFile") && document.getElementById("cloud").classList.contains("active")) {
        createPrompt({
            head: "Supprimer le fichier",
            desc: "Êtes-vous sûr de vouloir supprimer ce fichier ?",
            action: "deleteFile()",
        });
    }
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && document.querySelector(".active-popup")) {
        document.getElementById("prompt-confirm").click();
    }
});

function renameFileRequest() {
    let name = document.getElementById("prompt-input").value;
    if (!name) {
        toast({
            title: "Erreur",
            message: "Veuillez entrer un nom de fichier.",
            type: "error",
            duration: 5000,
        });
        return;
    }
    fetch(`/cdn/update/${localStorage.getItem("currentFile")}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            displayname: name,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                toast({
                    title: "Erreur",
                    message: `${data.error}`,
                    type: "error",
                    duration: 5000,
                });
                return;
            }
            toast({
                title: "Succès",
                message: "Le fichier a été renommé.",
                type: "success",
                duration: 5000,
            });
            const file = document.querySelector(".files-items").querySelector(`div[data-id="${localStorage.getItem("currentFile")}"]`);
            file.dataset.name = data.upload[0].displayname;
            document.querySelector(".file-basic-info > h4").innerHTML = `<span>${data.upload[0].displayname.split(".")[0]}</span>.${data.upload[0].mimetype}`;
            file.querySelector("h4").innerHTML = `<span>${data.upload[0].displayname.split(".")[0]}</span>.${data.upload[0].mimetype}`;
            document.querySelector(".active-sub-container").classList.remove("active-sub-container");
        });
}

function deleteFolder(id) {
    fetch(`/cdn/folder/delete/${localStorage.getItem("currentFolder")}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                toast({
                    title: "Erreur",
                    message: `${data.error}`,
                    type: "error",
                    duration: 5000,
                });
                return;
            }
            toast({
                title: "Succès",
                message: "Le dossier a été supprimé.",
                type: "success",
                duration: 5000,
            });
            const folder = folderList.querySelector(`h2[data-id="${localStorage.getItem("currentFolder")}"]`);
            folder.remove();
            document.querySelector(".folder-list > h2:first-child").click();
            document.querySelector(".active-popup").classList.remove("active-popup");
        });
}

function renameFolder() {
    let name = document.getElementById("prompt-input").value;
    if (!name) {
        toast({
            title: "Erreur",
            message: "Veuillez entrer un nom de dossier.",
            type: "error",
            duration: 5000,
        });
        return;
    }
    fetch(`/cdn/folder/rename/${localStorage.getItem("currentFolder")}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                toast({
                    title: "Erreur",
                    message: `${data.error}`,
                    type: "error",
                    duration: 5000,
                });
                return;
            }
            toast({
                title: "Succès",
                message: "Le dossier a été renommé.",
                type: "success",
                duration: 5000,
            });
            const folder = folderList.querySelector(`h2[data-id="${localStorage.getItem("currentFolder")}"]`);
            folder.innerText = name;
        });
}

function triggerFolder() {
    const folderElements = folderList.querySelectorAll("h2");
    folderElements.forEach((folder) => {
        folder.removeEventListener("click", () => {});
        folder.addEventListener("click", () => {
            folderElements.forEach((folder) => folder.classList.remove("active-folder"));
            folder.classList.add("active-folder");
            const selector = document.querySelector(".selector");
            selector.style.top = `${folder.getBoundingClientRect().top - 31.5}px`;
            loadFolder(folder.dataset.id);
        });
    });
}

function addFolder(folder) {
    folderSelection.appendChild(createOption(folder));
    folderList.appendChild(createFolderElement(folder));
}

function newFolder() {
    createPrompt({
        head: "Nouveau dossier",
        placeholder: "Nom du dossier",
        action: "createFolder()",
    });
}

function createFolder() {
    let name = document.getElementById("prompt-input").value;
    if (!name) {
        toast({
            title: "Erreur",
            message: "Veuillez entrer un nom de dossier.",
            type: "error",
            duration: 5000,
        });
        return;
    }
    fetch("/cdn/folder/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                toast({
                    title: "Erreur",
                    message: `${data.error}`,
                    type: "error",
                    duration: 5000,
                });
                return;
            }
            addFolder(data);
            triggerFolder();
            const folder = folderList.querySelector(`h2[data-id="${data._id}"]`);
            folder.click();
            toast({
                title: "Succès",
                message: "Le dossier a été créé.",
                type: "success",
                duration: 5000,
            });
        });
}

folderSelection.addEventListener("change", (e) => {
    loadFolder(e.currentTarget.value);
});

fetch("/cdn/folder/list", {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
})
    .then((res) => res.json())
    .then((data) => {
        data.forEach(addFolder);
        document.querySelector(".folder-list > h2:first-child").classList.add("active-folder");
        loadFolder(data[0]._id);
        triggerFolder();
    });

window.addEventListener("load", () => {
    document.querySelector(".loading").style.display = "none";
});

document.querySelectorAll(".files-items > div").forEach((file) => {
    file.addEventListener("click", (e) => {
        document.querySelector(".right-container").classList.add("active-sub-container");
    });
});

document.querySelector(".folder-selector").addEventListener("scroll", () => {
    let top = document.querySelector(".active-folder").getClientRects()[0].top;
    document.querySelector(".selector").style.top = `${top - 31.5}px`;
});

function updateStats() {
    fetch("/cdn/stats", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((res) => res.json())
        .then((data) => {
            let sendItems = data.sendItems;
            let Item = ["document", "image", "video", "audio", "other"];
            function modifyOrDelete(element) {
                if (sendItems.includes(element)) {
                    document.getElementById("graph-" + element).style.width = `${data[element + "Percentage"]}%`;
                    document.getElementById("percentage-" + element).innerText = `${data[element + "Percentage"]}%`;
                    document.getElementById("graph-" + element).style.display = "block";
                    document.getElementById("percentage-" + element + "-container").style.display = "flex";
                } else {
                    document.getElementById("graph-" + element).style.width = `0%`;
                    document.getElementById("graph-" + element).style.display = "none";
                    document.getElementById("percentage-" + element + "-container").style.display = "none";
                }
            }
            Item.forEach((element) => {
                modifyOrDelete(element);
            });

            function modifyStorageUsed(totalSize, typeOfSize) {
                const headerElement = document.querySelector("#storage-usage > h5");
                const spanElement = document.createElement("span");
                const newTotalSize = Number(totalSize).toFixed(2);
                headerElement.innerText = newTotalSize;
                spanElement.textContent = typeOfSize;
                headerElement.appendChild(spanElement);
            }
            if (data.totalSizeMB > 1000) {
                modifyStorageUsed(data.totalSizeMB / 1024, "GB");
            } else {
                modifyStorageUsed(data.totalSizeMB, "MB");
            }
        });
}
updateStats();

document.getElementById("search-bar").addEventListener("input", (e) => {
    const search = e.currentTarget.value.toLowerCase();
    const allFiles = document.querySelectorAll(".file-item");
    allFiles.forEach((file) => {
        const fileName = file.dataset.name.toLowerCase();
        if (fileName.includes(search)) {
            file.style.display = "flex";
        } else {
            file.style.display = "none";
        }
    });
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.querySelector(".cloud.active-section") && document.querySelector(".active-sub-container")) {
        document.querySelector(".active-sub-container").classList.remove("active-sub-container");
    }
});
