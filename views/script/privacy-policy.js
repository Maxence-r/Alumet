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