const endpointReference = {
    png: "/preview/image?id=*",
    jpg: "/preview/image?id=*",
    jpeg: "/preview/image?id=*",
    gif: "/cdn/u/*",
    apng: "/cdn/u/*",
    avif: "/cdn/u/*",
    webp: "/cdn/u/*",
    svg: "/cdn/u/*",
    pdf: "/preview/pdf?id=*",
};

const fileIconReference = {
    png: "../assets/files-icons/img.png",
    jpg: "../assets/files-icons/img.png",
    jpeg: "../assets/files-icons/img.png",
    gif: "../assets/files-icons/img.png",
    apng: "../assets/files-icons/img.png",
    avif: "../assets/files-icons/img.png",
    webp: "../assets/files-icons/img.png",
    svg: "../assets/files-icons/img.png",
    pdf: "../assets/files-icons/img.png",
    doc: "../assets/files-icons/doc.png",
    docx: "../assets/files-icons/doc.png",
    xls: "../assets/files-icons/xls.png",
    xlsx: "../assets/files-icons/xls.png",
    ppt: "../assets/files-icons/ppt.png",
    pptx: "../assets/files-icons/ppt.png",
    txt: "../assets/files-icons/doc.png",
    zip: "../assets/files-icons/zip.png",
    rar: "../assets/files-icons/zip.png",
    "7z": "../assets/files-icons/zip.png",
    tar: "../assets/files-icons/zip.png",
    gz: "../assets/files-icons/zip.png",
    bz2: "../assets/files-icons/zip.png",
    xz: "../assets/files-icons/zip.png",
    mp3: "../assets/files-icons/mp3.png",
    wav: "../assets/files-icons/mp3.png",
    ogg: "../assets/files-icons/mp3.png",
    flac: "../assets/files-icons/mp3.png",
    m4a: "../assets/files-icons/mp3.png",
    mp4: "../assets/files-icons/mov.png",
    mkv: "../assets/files-icons/mov.png",
    mov: "../assets/files-icons/mov.png",
    avi: "../assets/files-icons/mov.png",
    wmv: "../assets/files-icons/mov.png",
    flv: "../assets/files-icons/mov.png",
    webm: "../assets/files-icons/mov.png",
    m4v: "../assets/files-icons/mov.png",
    mpg: "../assets/files-icons/mov.png",
    mpeg: "../assets/files-icons/mov.png",
};

function toast({ title = "", message = "", type = "info", duration = 3000 }) {
    const main = document.getElementById("toast");
    if (main) {
        const toast = document.createElement("div");

        setTimeout(function () {
            main.removeChild(toast);
        }, duration + 1000);

        const delay = (duration / 1000).toFixed(2);

        toast.classList.add("toast", `toast--${type}`);
        toast.style.animation = `slideInLeft ease .3s, fadeOut linear 1s ${delay}s forwards`;

        const toastBody = document.createElement("div");
        toastBody.classList.add("toast__body");

        const toastTitle = document.createElement("h3");
        toastTitle.classList.add("toast__title");
        toastTitle.textContent = title;

        const toastMsg = document.createElement("p");
        toastMsg.classList.add("toast__msg");
        toastMsg.textContent = message;

        toastBody.appendChild(toastTitle);
        toastBody.appendChild(toastMsg);

        toast.appendChild(toastBody);
        main.appendChild(toast);
    }
}

function createPrompt(object) {
    document.getElementById("prompt-input").type = "text";
    document.getElementById("prompt-input").removeAttribute("list");
    document.getElementById("prompt-input").style.display = "none";
    document.getElementById("prompt-red").style.display = "none";
    document.getElementById("prompt-desc").style.display = "none";
    document.getElementById("prompt-head").innerText = object.head;
    document.getElementById("prompt-input").placeholder = object.placeholder;
    document.getElementById("prompt-confirm").setAttribute("onclick", object.action);
    if (object.list) {
        document.getElementById("prompt-input").setAttribute("list", object.list);
    }
    if (object.desc) {
        document.getElementById("prompt-desc").style.display = "block";
        document.getElementById("prompt-desc").innerText = object.desc;
    }
    if (object.redAction) {
        document.getElementById("prompt-red").style.display = "block";
        document.getElementById("prompt-red").innerText = object.redActionText;
        document.getElementById("prompt-red").setAttribute("onclick", object.redAction);
    }
    if (object.placeholder) {
        document.getElementById("prompt-input").style.display = "block";
        if (object.placeholderType) {
            document.getElementById("prompt-input").type = object.placeholderType;
        }
    }
    document.querySelector(".prompt-popup").classList.add("active-popup");
    document.getElementById("prompt-input").value = "";
}

function relativeTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);

    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
        return "Il y a " + diffInMinutes + "min";
    } else if (diffInHours < 24) {
        return "Il y a " + diffInHours + "h";
    } else {
        return "Il y a " + diffInDays + "j";
    }
}

function cancelLoading(classLoading) {
    document.querySelector(`.${classLoading}`).classList.remove("button--loading");
}

function getUser(id) {
    return fetch("/auth/u/" + id)
        .then((response) => response.json())
        .then((data) => {
            return data;
        });
}

function getMyInfos() {
    return new Promise((resolve, reject) => {
        fetch("/auth/info")
            .then((response) => response.json())
            .then((json) => {
                localStorage.setItem("user", JSON.stringify(json));
                resolve("cela fonctionne");
            })
            .catch((error) => {
                console.error(error);
                reject(error);
            });
    });
}

function setPictureOnError(icon, parameter) {
    icon.onerror = () => {
        if (parameter === "user") {
            icon.src = "../assets/global/default_user.png";
        } else if (parameter === "group") {
            icon.src = "../assets/global/default_group.png";
        } else if (parameter === "file") {
            icon.src = "../assets/global/default_file.png";
            toast({ title: "Erreur !", message: "Fichier introuvable", type: "error", duration: 2500 });
        }
    };
}
let supportedPreviewAlumet = {
    pdf: '<img loading="lazy" src="/preview/pdf?url=*">',
    png: '<img loading="lazy" src="/preview/image?url=*">',
    jpg: '<img loading="lazy" src="/preview/image?url=*">',
    jpeg: '<img loading="lazy" src="/preview/image?url=*">',
    gif: '<img loading="lazy" src="/preview/image?url=*">',
    apng: '<img loading="lazy" src="/preview/image?url=*">',
    avif: '<img loading="lazy" src="/preview/image?url=*">',
    webp: '<img loading="lazy" src="/preview/image?url=*">',
    mp4: '<video width="400" controls="false" preload="metadata"><source src="*" type="video/mp4"></video>',
    webm: '<video width="400" controls="controls" preload="metadata"><source src="*" type="video/mp4"></video>',
    ogg: '<video width="400" controls="controls" preload="metadata"><source src="*" type="video/mp4"></video>',
    mp3: '<img loading="lazy" src="./../../assets/global/audio.png">',
    wav: '<img loading="lazy" src="./../../assets/global/audio.png">',
    flac: 'img loading="lazy" src="./../../assets/global/audio.png">',
    pptx: '<img loading="lazy" src="./../../assets/global/empty_preview.png">',
    odt: '<img loading="lazy" src="./../../assets/global/empty_preview.png">',
    ods: '<img loading="lazy" src="./../../assets/global/empty_preview.png">',
    ppt: '<img loading="lazy" src="./../../assets/global/empty_preview.png">',
    odp: '<img loading="lazy" src="./../../assets/global/empty_preview.png">',
    docx: '<img loading="lazy" src="./../../assets/global/empty_preview.png">',
    doc: '<img loading="lazy" src="./../../assets/global/empty_preview.png">',
    xlsx: '<img loading="lazy" src="./../../assets/global/empty_preview.png">',
    xls: '<img loading="lazy" src="./../../assets/global/empty_preview.png">',
};

document.addEventListener("keydown", function (event) {
    if (event.key === "Tab") {
        event.preventDefault();
    }
});
