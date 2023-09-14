document.querySelectorAll('.options > div').forEach(div => {
    div.addEventListener('click', e => {
        document.querySelectorAll('.options > div').forEach(div => {
            div.classList.remove('selectedOption');
        });
        div.classList.add('selectedOption');
    });
});

document.querySelector('.continue').addEventListener('click', e => {
    let selectedOption = document.querySelector('.selectedOption');
    if (!selectedOption) return;

    document.querySelector(`.${selectedOption.id}`).style.display = 'flex';
    document.querySelector(`.choose`).style.display = 'none';
});

function next(current, next) {
    document.getElementById(`${current}`).style.display = 'none';
    document.getElementById(`${next}`).style.display = 'flex';
}
