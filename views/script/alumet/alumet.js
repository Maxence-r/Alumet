window.addEventListener("load", function () {
    document.querySelector("body > section").style.display = "none";
});

const navButtons = document.querySelectorAll(".navbar > button, .add");
const sections = document.querySelectorAll(".overlay > div");
const navbarMenu = document.querySelector(".menu");
const burgerMenu = document.getElementById("burger");

navButtons.forEach((button) => {
    button.addEventListener("click", () => {
        if (button.id == "home") {
            document.querySelector(".overlay").classList.remove("active-layer");
        } else {
            document.querySelector(".overlay").classList.add("active-layer");
        }
        navButtons.forEach((button) => button.classList.remove("navbar-active"));
        button.classList.add("navbar-active");
        sections.forEach((section) => section.classList.remove("active-section"));
        if (button.id !== "home") {
            burgerMenu.classList.add("is-active");
            document.querySelector(`.${button.id}`).classList.add("active-section");
        }
    });
});

if (burgerMenu && navbarMenu) {
    burgerMenu.addEventListener("click", () => {
        burgerMenu.classList.toggle("is-active");
        navbarMenu.classList.toggle("active-section");
        document.querySelector(".overlay").classList.toggle("active-layer");
    });
}
if (!navigator.userAgent.includes("Mobile")) {
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
