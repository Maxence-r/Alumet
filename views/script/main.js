function showToast() {
    if (typeof toast !== 'function') {
        return null;
    }

    return toast({
        title: 'Error',
        message: 'The conference recording is being edited, please try again later.',
        type: 'error',
        duration: 5000,
    });
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('.pages a').forEach((link, index) => {
    link.style.animation = `fadeIn 0.7s ${index * 0.12}s forwards`;
});

const burger = document.getElementById('burger');
const mobileNav = document.querySelector('.mobile-nav');

if (burger && mobileNav) {
    burger.addEventListener('click', function () {
        const isOpen = this.classList.toggle('is-active');
        mobileNav.classList.toggle('displayed', isOpen);
        this.setAttribute('aria-expanded', String(isOpen));

        document.querySelectorAll('.mobile-nav > .links > a').forEach((link, index) => {
            link.style.animation = `mobileFadeIn 0.45s ${index * 0.08}s forwards`;
        });
    });
}

if (!prefersReducedMotion && !/Mobi|Android/i.test(navigator.userAgent)) {
    const grid = document.querySelector('.grid-overlay');
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    if (grid) {
        window.addEventListener('mousemove', e => {
            targetX = e.clientX / window.innerWidth - 0.5;
            targetY = e.clientY / window.innerHeight - 0.5;
        });

        const animate = () => {
            currentX += (targetX - currentX) * 0.035;
            currentY += (targetY - currentY) * 0.035;
            grid.style.transform = `translate(${currentX * 80}px, ${currentY * 80}px)`;
            requestAnimationFrame(animate);
        };

        animate();
    }
}

const showRoomItems = [...document.querySelectorAll('.showRoom-item > div')];
const showRoomTexts = [...document.querySelectorAll('.showRoom-text > div:not(.progress-bar)')];
let currentIndex = 0;
let exitTimer;

function setShowRoomItem(index) {
    showRoomItems.forEach((item, itemIndex) => {
        item.classList.toggle('is-active', itemIndex === index);
    });
    showRoomTexts.forEach((text, textIndex) => {
        text.classList.toggle('is-active', textIndex === index);
    });
}

function switchShowRoomItem() {
    if (!showRoomItems.length || !showRoomTexts.length) {
        return;
    }

    window.clearTimeout(exitTimer);
    setShowRoomItem(currentIndex);

    const exitIndex = currentIndex;
    exitTimer = window.setTimeout(() => {
        showRoomItems[exitIndex]?.classList.add('is-leaving');
    }, 5200);

    currentIndex = (currentIndex + 1) % showRoomItems.length;
}

switchShowRoomItem();

if (!prefersReducedMotion && showRoomItems.length > 1) {
    window.setInterval(switchShowRoomItem, 6200);
}
