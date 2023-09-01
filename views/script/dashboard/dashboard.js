const navButtons = document.querySelectorAll(".nav > button");
const sections = document.querySelectorAll(".sections-container > section");

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        navButtons.forEach(button => button.classList.remove("active"));
        button.classList.add("active");
        sections.forEach(section => section.classList.remove("active-section"));
        document.querySelector(`.${button.id}`).classList.add("active-section");
    });
});

/* toast({ title: "Bienvenue !", message: "Vous êtes connecté.", type: "info", duration: 2500 }); */

document.getElementById("prompt-confirm").addEventListener("click", () => {
    document.querySelector(".prompt-popup").classList.remove("active-popup");
});

const params = new URL(window.location).searchParams;
let redirect = params.get("redirect");
if (redirect) {
    const element = document.getElementById(`${redirect}`);
    if (element) {
        element.click();
    }
}

let setupProgress = 0;
let setupNameCurrent = null;
function setup(setupName) {
    if (!setupNameCurrent || setupNameCurrent !== setupName || !document.querySelector(`.${setupName}`).classList.contains("active-section")) {
        document.querySelector(`.${setupName}`).classList.add("active-section");
        participants = [];
        setupProgress = 0;
    }
    const inputs = document.querySelectorAll(`.${setupName} > .active-action > input[required]`);
    if (inputs && !Array.from(inputs).every(input => input.value)) {
        return toast({ title: "Erreur", message: `Veuillez remplir tous les champs`, type: "error", duration: 2500 });
    }
    setupNameCurrent = setupName;
    setupProgress++;
    const nextActionContent = document.querySelector(`.${setupName} > .action-content:nth-of-type(${setupProgress + 1}n)`);
    if (nextActionContent) {
        document.querySelectorAll(".active-action").forEach(element => element.classList.remove("active-action"));
        nextActionContent.classList.add("active-action");
        document.querySelectorAll(".completed").forEach(element => element.classList.remove("completed"));
        const actionDetails = document.querySelector(`.${setupName} > .progression-container > .progression-item:nth-child(${setupProgress + 1}n) > .action-details`);
        actionDetails.classList.add("completed");
        document.querySelector(`.${setupName} > h1`).textContent = actionDetails.querySelector("h3").textContent;
        document.querySelector(`.${setupName} > h4`).textContent = actionDetails.querySelector("p").textContent;
    } else {
        endSetup(setupName);
    }
}

function endSetup(setupName) {
    document.querySelector(`.${setupName} > .creating`).style.display = "flex";
    if (setupName === "create-alumet") {
        createAlumet();
    } else if (setupName === "create-flashcards") {
        createFlashcards();
    }
}
async function createAlumet() {
    toast({ title: "Création de l'alumet", message: "Cette opération peut prendre un peu de temps...", type: "info", duration: 5000 });
    const file = document.getElementById("alumet-background").files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", document.getElementById("alumet-name").value);
    formData.append("description", document.getElementById("alumet-description").value);
    formData.append("collaborators", JSON.stringify(participants));
    formData.append("private", document.getElementById("alumet-private").checked);
    formData.append("chat", document.getElementById("alumet-chat").checked);
    fetch("/a/new", {
        method: "POST",
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                toast({ title: "Erreur", message: data.error, type: "error", duration: 7500 });
                setTimeout(() => {
                    window.location.reload();
                }, 7500);
            } else {
                toast({ title: "Succès", message: "L'alumet a bien été créé !", type: "success", duration: 2500 });
                setTimeout(() => {
                    window.location.reload();
                }, 2500);
            }
        })
        .catch(error => {
            console.error(error);
        });
}

document.getElementById("load-background").addEventListener("click", () => {
    document.getElementById("alumet-background").click();
});

document.getElementById("alumet-background").addEventListener("change", () => {
    const file = document.getElementById("alumet-background").files[0];
    const fileType = file.type.split("/")[0];
    const fileSize = file.size / 1024 / 1024;
    if (fileType !== "image" || fileSize > 3) {
        document.getElementById("alumet-background").value = "";
        return toast({ title: "Erreur", message: "Veuillez sélectionner une image de moins de 3MB", type: "error", duration: 2500 });
    }
    document.querySelector(".alumet-background > img").src = URL.createObjectURL(file);
});

fetch("/alumet")
    .then(response => response.json())
    .then(data => {
        if (data.alumets.length !== 0) document.querySelector(".alumets").innerHTML = "";
        data.alumets.forEach(alumet => {
            const alumetBox = createAlumetBox(alumet.title, alumet.lastUsage, alumet.background, alumet._id);
            document.querySelector(".alumets").appendChild(alumetBox);
        });
    });

function createAlumetBox(title, lastUsage, background, id) {
    const alumetBox = document.createElement("div");
    alumetBox.classList.add("alumet-box");

    const img = document.createElement("img");
    img.src = "/cdn/u/" + background;
    alumetBox.appendChild(img);

    const layerBlurInfo = document.createElement("div");
    layerBlurInfo.classList.add("layer-blur-info");
    alumetBox.appendChild(layerBlurInfo);

    const h4 = document.createElement("h4");
    h4.textContent = title;
    layerBlurInfo.appendChild(h4);

    const p = document.createElement("p");
    p.textContent = `Utilisé ${relativeTime(lastUsage)}`;
    layerBlurInfo.appendChild(p);

    alumetBox.setAttribute("onclick", `openAlumet('${id}')`);

    return alumetBox;
}

openAlumet = alumetId => {
    window.open(`/portal/${alumetId}`, "_blank");
};
