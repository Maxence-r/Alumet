console.log('Welcome to Alumet Education website !');

function showToast() {
    return toast({
        title: 'Erreur',
        message: 'La montage de la conférence est en cours, veuillez réessayer plus tard.',
        type: 'error',
        duration: 5000,
    });
}

let links = document.querySelectorAll('.pages a');
for (let i = 0; i < links.length; i++) {
    links[i].style.animation = `fadeIn 1s ${i * 0.2}s forwards`;
}

let burger = document.getElementById('burger');
let mobileNav = document.querySelector('.mobile-nav');

burger.addEventListener('click', function () {
    this.classList.toggle('is-active');
    mobileNav.classList.toggle('displayed');
    let links = document.querySelectorAll('.mobile-nav > .links > a');
    for (let i = 0; i < links.length; i++) {
        links[i].style.animation = `mobileFadeIn 1s ${i * 0.3}s forwards`;
    }
});
