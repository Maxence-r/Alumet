document.querySelectorAll(".box").forEach(box => {
box.onmousemove = e => {
    for (const card of document.getElementsByClassName("box")) {
      const rect = card.getBoundingClientRect(),
            x = e.clientX - rect.left,
            y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
    }
  };
});

function changer_image(lien) {
  const image = document.querySelector(".class-argument-preview");
  image.setAttribute("src", lien);
}

let closed = true;

document.querySelector('.burger-button-open-menu').addEventListener("click", e => {
    if (closed == true) {
      document.querySelector('.main-header').style.transform = 'translateY(0%)'
      closed = false;
    } else {
      document.querySelector('.main-header').style.transform = 'translateY(-110%)'
      closed = true;
    }
});

function close() {
  document.querySelector(.banner).style.display = "none";
}
