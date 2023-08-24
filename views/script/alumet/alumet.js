window.addEventListener("load", function () {
    document.querySelector("body > section").style.display = "none";
});

const navButtons = document.querySelectorAll(".navbar > button");
const sections = document.querySelectorAll(".modules_container > section");

navButtons.forEach((button) => {
    button.addEventListener("click", () => {
        if (button.id == "home") {
            document.querySelector(".brightness-layer").classList.remove("active-layer");
        } else {
            document.querySelector(".brightness-layer").classList.add("active-layer");
        }
        navButtons.forEach((button) => button.classList.remove("active"));
        button.classList.add("active");
        sections.forEach((section) => section.classList.remove("active-section"));
        document.querySelector(`.${button.id}`).classList.add("active-section");
    });
});

const navbarMenu = document.getElementById("menu");
const burgerMenu = document.getElementById("burger");

if (burgerMenu && navbarMenu) {
    burgerMenu.addEventListener("click", () => {
        burgerMenu.classList.toggle("is-active");
        navbarMenu.classList.toggle("is-active");
    });
}

let cards = document.querySelectorAll(".card");
let lists = document.querySelectorAll(".draggingContainer");
cards.forEach((card) => {
    registerEventsOnCard(card);
});

lists.forEach((list) => {
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
});

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
