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
    const inputs = document.querySelectorAll(`.${setupName} > .active-action > input`);
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        if (!input.value) {
            return toast({ title: "Erreur", message: `Veuillez remplir "${input.getAttribute("placeholder")}"`, type: "error", duration: 2500 });
        }
    }
    setupProgress++;

    document.querySelector(".active-action").classList.remove("active-action");
    document.querySelector(`.${setupName} > .action-content:nth-of-type(${setupProgress}n)`).classList.add("active-action");
    document.querySelector(`.${setupName} > .progression-container > .progression-item:nth-child(${setupProgress + 1}n) > .action-details`).classList.add("completed");
}
