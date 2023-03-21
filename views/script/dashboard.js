const translateReference = {
    'acceuil': -147,
    'fileM': -97,
    'infos': -46
}

const sectionReference = {
    'acceuil': 'alumets',
    'fileM': 'file-manager',
    'infos': 'informations'
}

document.querySelectorAll('.option').forEach(option => {
    let utility = option.id
    option.addEventListener('click', (e) => {
        const translate = translateReference[utility]
        document.querySelector('.selector').style.transform = `translateY(${translate}px)`
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active-section')
        })
        let section = sectionReference[utility]
        console.log(section)
        document.querySelector(`.${section}`).classList.add('active-section')
    })
})

const slider = document.querySelector('.alumet-container');
let isDown = false;
let startX;
let scrollLeft;

slider.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
});
slider.addEventListener('mouseleave', () => {
    isDown = false;
});
slider.addEventListener('mouseup', () => {
    isDown = false;

});
slider.addEventListener('mousemove', (e) => {
    if(!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 3; //scroll-fast
    slider.scrollLeft = scrollLeft - walk;
});

slider.addEventListener('mousewheel', (e) => {
    e.preventDefault();
    slider.scrollLeft += e.deltaY;
});

isOpen = false
document.querySelector('.open-menu').addEventListener('click', () => {
    if (!isOpen) {
        document.querySelector('.menu').style.transform = 'translateX(0)'
        isOpen = true
        document.querySelector('.open-menu > img').style.transform = 'rotate(180deg)'
    } else {
        document.querySelector('.menu').style.transform = 'translateX(-100%)'
        isOpen = false
        document.querySelector('.open-menu > img').style.transform = 'rotate(0deg)'
    }
})