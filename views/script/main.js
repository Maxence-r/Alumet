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

if (!/Mobi|Android/i.test(navigator.userAgent)) {
    const grid = document.querySelector('.grid-overlay');
    let targetX = 0,
        targetY = 0,
        currentX = 0,
        currentY = 0;

    window.addEventListener('mousemove', function (e) {
        targetX = e.clientX / window.innerWidth;
        targetY = e.clientY / window.innerHeight;
    });

    function animate() {
        currentX += (targetX - currentX) * 0.015;
        currentY += (targetY - currentY) * 0.015;

        grid.style.transform = `translate(${currentX * 300}px, ${currentY * 300}px)`;

        requestAnimationFrame(animate);
    }

    animate();
}

const showRoomItems = document.querySelectorAll('.showRoom-item > div');
const showRoomTexts = document.querySelectorAll('.showRoom-text > div:not(.progress-bar)');
let currentIndex = 0;

function switchShowRoomItem() {
    // Hide all items and texts
    showRoomItems.forEach(item => {
        item.style.display = 'none';
        item.style.opacity = '1';
        item.style.transform = 'none';
    });
    showRoomTexts.forEach(text => {
        text.style.display = 'none';
        text.style.opacity = '1';
        text.style.transform = 'none';
    });

    // Show the current item and text
    showRoomItems[currentIndex].style.display = 'flex';
    showRoomTexts[currentIndex].style.display = 'flex';

    // Store the current index in a separate variable
    const exitIndex = currentIndex;

    // Start the exit animation 1 second before the next switch
    setTimeout(() => {
        showRoomItems[exitIndex].style.opacity = '0';
        showRoomItems[exitIndex].style.transform = 'scale(0.95)';
    }, 5000);

    // Increment the current index, wrapping around to 0 if it's too large
    currentIndex = (currentIndex + 1) % showRoomItems.length;
}

// Switch the show room item immediately, then every 6 seconds
switchShowRoomItem();
setInterval(switchShowRoomItem, 6000);
