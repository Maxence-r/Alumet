function affichage_1() {
        document.querySelector(".changes").style.display = "none";
        document.querySelector(".presentation").style.display = "block";
        document.querySelector(".title-date").style.color = "#FF3D00";
        document.querySelector(".update-date").style.color = "#BBBBBB";
}
function affichage_2() {
    document.querySelector(".presentation").style.display = "none";
    document.querySelector(".changes").style.display = "block";
    document.querySelector(".update-date").style.color = "#FF3D00";
    document.querySelector(".title-date").style.color = "#BBBBBB";
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

let closed1 = true;

document.querySelector('.burger-menu').addEventListener("click", e => {
    if (closed1 == true) {
      document.querySelector('.date').style.transform = 'translateY(0%)'
      closed1 = false;
      document.querySelector('.date').style.display = "none";
    } else {
      document.querySelector('.date').style.transform = 'translateY(-100%)'
      closed1 = true;
      document.querySelector('.date').style.display = "flex";
    }
});
