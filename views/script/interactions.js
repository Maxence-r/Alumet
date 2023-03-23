function toDisplay(toget, toshow) {
    document.getElementById(toget).addEventListener('click', () => {
        document.getElementById(toshow).classList.add('isDisplayed')
    })
}

function toHide(toget, tohide) {
    document.getElementById(toget).addEventListener('click', () => {
        document.getElementById(tohide).classList.remove('isDisplayed')
        document.getElementById(tohide).style.display = 'none'
    })
}

toHide('close-modal-setup', 'alumet-setup')
toDisplay('create-new-alumet', 'alumet-setup')
toHide('close-file-viewer', 'file-viewer')
