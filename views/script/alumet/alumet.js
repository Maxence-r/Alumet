const navButtons = document.querySelectorAll(".navbar > button");
const sections = document.querySelectorAll(".overlay > div");
const navbarMenu = document.querySelector(".menu");
const burgerMenu = document.getElementById("burger");

function navbar(id) {
    if (id == "home") {
        document.querySelector(".overlay").classList.remove("active-layer");
    } else {
        document.querySelector(".overlay").classList.add("active-layer");
    }
    navButtons.forEach((button) => button.classList.remove("navbar-active"));
    const element = document.getElementById(id);
    if (element) {
        element.classList.add("navbar-active");
    }
    sections.forEach((section) => section.classList.remove("active-section"));
    if (id !== "home") {
        burgerMenu.classList.add("is-active");
        document.querySelector(`.${id}`).classList.add("active-section");
    }
}

if (burgerMenu && navbarMenu) {
    burgerMenu.addEventListener("click", () => {
        burgerMenu.classList.toggle("is-active");
        navbarMenu.classList.toggle("active-section");
        document.querySelector(".overlay").classList.toggle("active-layer");
    });
}

function registerEventsOnList(list) {
    list.setAttribute("data-id", list.id);
    list.addEventListener("dragover", (e) => {
        e.preventDefault();
        let draggingCard = document.querySelector(".dragging");
        let cardAfterDraggingCard = getCardAfterDraggingCard(list, e.clientY);
        if (cardAfterDraggingCard) {
            cardAfterDraggingCard.parentNode.insertBefore(draggingCard, cardAfterDraggingCard);
        } else {
            list.appendChild(draggingCard);
        }
    });
    list.addEventListener("drop", (e) => {
        let listId = e.currentTarget.getAttribute("data-id");
        console.log(`Post dropped in list with id ${listId}`);
    });
}

function getCardAfterDraggingCard(list, yDraggingCard) {
    let listCards = [...list.querySelectorAll(".card:not(.dragging)")];

    return listCards.reduce(
        (closestCard, nextCard) => {
            let nextCardRect = nextCard.getBoundingClientRect();
            let offset = yDraggingCard - nextCardRect.top - nextCardRect.height / 2;

            if (offset < 0 && offset > closestCard.offset) {
                return { offset, element: nextCard };
            } else {
                return closestCard;
            }
        },
        { offset: Number.NEGATIVE_INFINITY }
    ).element;
}

function registerEventsOnCard(card) {
    card.addEventListener("dragstart", (e) => {
        card.classList.add("dragging");
    });

    card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
    });
}

const overlay = document.querySelector(".overlay");
const overlayContent = document.querySelectorAll(".overlay-content");
let isMouseDownOnOverlayContent = false;

overlayContent.forEach(function (content) {
    content.addEventListener("mousedown", function () {
        isMouseDownOnOverlayContent = true;
    });
});

overlay.addEventListener("click", function (event) {
    if (!event.target.closest(".overlay-content") && !isMouseDownOnOverlayContent) {
        overlay.classList.remove("active-layer");
        navButtons.forEach((button) => button.classList.remove("navbar-active"));
        document.getElementById("home").classList.add("navbar-active");
    }
    isMouseDownOnOverlayContent = false;
});

function makeBold() {
    document.execCommand("bold");
    if (document.getElementById("bold").isToggled) {
        document.getElementById("bold").isToggled = false;
        document.getElementById("bold").classList.remove("active-effect");
    } else {
        document.getElementById("bold").isToggled = true;
        document.getElementById("bold").classList.add("active-effect");
    }
}

function makeItalic() {
    document.execCommand("italic");
    if (document.getElementById("italic").isToggled) {
        document.getElementById("italic").isToggled = false;
        document.getElementById("bold").classList.remove("active-effect");
    } else {
        document.getElementById("italic").isToggled = true;
        document.getElementById("bold").classList.add("active-effect");
    }
}

function doUnderline() {
    document.execCommand("underline");
    if (document.getElementById("underline").isToggled) {
        document.getElementById("underline").isToggled = false;
        document.getElementById("bold").classList.remove("active-effect");
    } else {
        document.getElementById("underline").isToggled = true;
        document.getElementById("bold").classList.add("active-effect");
    }
}

document.querySelector(".drop-box").addEventListener("click", (e) => {
    if (e.target.classList.contains("drop-box")) {
        navbar("loadfile");
    }
});

const editor = document.getElementById("editor");
let oldLink = null;
editor.addEventListener("input", function () {
    const text = editor.textContent;
    const linkRegex = /(https?:\/\/[^\s]+\.[a-z]{2,}\S*)/gi;
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
        const link = match[1];
        if (link !== oldLink) {
            handleLink(link);
        }
        oldLink = match[1];
    }
});

function handleLink(link) {
    console.log(`Link detected: ${link}`);
}

function createFileElement(file) {
    const div = document.createElement("div");
    div.dataset.id = file._id;
    div.dataset.name = file.displayname;
    div.dataset.ext = file.mimetype;
    div.dataset.size = (file.filesize / 1024 / 1024).toFixed(2) + " Mo";
    div.dataset.date = file.date.split("T")[0];
    div.setAttribute("onclick", `chooseFile('${file._id}')`);
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

const folderSelection = document.getElementById("folder-selection");

folderSelection.addEventListener("change", (e) => {
    loadFolder(e.currentTarget.value);
});

function loadFiles() {
    fetch("/cdn/folder/list", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((res) => res.json())
        .then((data) => {
            data.forEach(addFolder);
            localStorage.setItem("currentFolder", data[0]._id);
            loadFolder(localStorage.getItem("currentFolder"));
        });
}

function addFolder(folder) {
    folderSelection.appendChild(createOption(folder));
}

function createOption(folder) {
    const option = document.createElement("option");
    option.value = folder._id;
    option.innerText = folder.name;
    return option;
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
