const navbarMenu = document.getElementById('menu');
const burgerMenu = document.getElementById('burger');
const headerMenu = document.getElementById('header');

if (burgerMenu && navbarMenu) {
    burgerMenu.addEventListener('click', () => {
        burgerMenu.classList.toggle('is-active');
        navbarMenu.classList.toggle('is-active');
    });
}

document.querySelectorAll('.menu-link').forEach(link => {
    link.addEventListener('click', () => {
        burgerMenu.classList.remove('is-active');
        navbarMenu.classList.remove('is-active');
    });
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        if (navbarMenu.classList.contains('is-active')) {
            navbarMenu.classList.remove('is-active');
        }
    }
});
