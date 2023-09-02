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
        .then(response => response.json())
        .then(data => {
            document.querySelectorAll(".file-item").forEach(file => file.remove());
            data.forEach(file => {
                const fileElement = createFileElement(file);
                document.querySelector(".files-items").appendChild(fileElement);
            });
            document.querySelector(".files-items").classList.remove("loading-files");
        });
}

loadFolder(localStorage.getItem("currentFolder"));

const folderSelection = document.getElementById("folder-selection");

folderSelection.addEventListener("change", e => {
    loadFolder(e.currentTarget.value);
});

fetch("/cdn/folder/list", {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
})
    .then(res => res.json())
    .then(data => {
        data.forEach(addFolder);
    });

function addFolder(folder) {
    folderSelection.appendChild(createOption(folder));
}

function createOption(folder) {
    const option = document.createElement("option");
    option.value = folder._id;
    option.innerText = folder.name;
    return option;
}
