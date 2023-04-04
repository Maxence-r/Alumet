const currentUrl = window.location.href;
const path = currentUrl.split('/').pop();

function init() {
    fetch(`/alumet/info/${path}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(document.getElementsByTagName('body'));
        document.querySelector('.background-image').style.backgroundImage = `url("/cdn/u/${data.finalAlumet.background}")`;
        document.querySelector('.layer-filter').style.backdropFilter = `blur(${data.finalAlumet.blur}px) brightness(${data.finalAlumet.brightness})`;
    })
}

init();