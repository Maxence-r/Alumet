const navButtons = document.querySelectorAll(".nav > button");
const sections = document.querySelectorAll(".sections-container > section");

navButtons.forEach((button) => {
    button.addEventListener("click", () => {
        navButtons.forEach((button) => button.classList.remove("active"));
        button.classList.add("active");
        sections.forEach((section) => section.classList.remove("active-section"));
        document.querySelector(`.${button.id}`).classList.add("active-section");
    });
});

toast({ title: "Bienvenue !", message: "Vous êtes connecté.", type: "info", duration: 2500 });

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

let setupProgress = 1;
function setup(setupName) {
    const inputs = document.querySelectorAll(`.${setupName} > .active-action > input[required]`);
    if (!Array.from(inputs).every((input) => input.value)) {
        return toast({ title: "Erreur", message: `Veuillez remplir tous les champs`, type: "error", duration: 2500 });
    }
    setupProgress++;
    const nextActionContent = document.querySelector(`.${setupName} > .action-content:nth-of-type(${setupProgress + 1}n)`);
    if (nextActionContent) {
        document.querySelector(".active-action").classList.remove("active-action");
        nextActionContent.classList.add("active-action");
        document.querySelectorAll(".completed").forEach((element) => element.classList.remove("completed"));
        const actionDetails = document.querySelector(`.${setupName} > .progression-container > .progression-item:nth-child(${setupProgress + 1}n) > .action-details`);
        actionDetails.classList.add("completed");
        document.querySelector(`.${setupName} > h1`).textContent = actionDetails.querySelector("h3").textContent;
        document.querySelector(`.${setupName} > h4`).textContent = actionDetails.querySelector("p").textContent;
    } else {
        endSetup(setupName);
    }
}

function endSetup(setupName) {
    if (setupName === "create-alumet") {
        createAlumet();
    }
}

async function createAlumet() {
    toast({ title: "Création de l'alumet", message: "Cette opération peut prendre un peu de temps...", type: "info", duration: 5000 });
    document.querySelector(".creating-alumet").style.display = "flex";
}

document.getElementById("load-background").addEventListener("click", () => {
    document.getElementById("alumet-background").click();
});

document.getElementById("alumet-background").addEventListener("change", () => {
    const file = document.getElementById("alumet-background").files[0];
    const fileType = file.type.split("/")[0];
    const fileSize = file.size / 1024 / 1024; // Convert to MB
    if (fileType !== "image" || fileSize > 3) {
        return toast({ title: "Erreur", message: "Veuillez sélectionner une image de moins de 3MB", type: "error", duration: 2500 });
    }
    document.querySelector(".alumet-background > img").src = URL.createObjectURL(file);
});
