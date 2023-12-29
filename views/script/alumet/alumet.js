localStorage.removeItem('file-ts');
localStorage.removeItem('link');

function registerEventsOnList(list) {
    list.setAttribute('data-id', list.id);
    list.addEventListener('dragover', e => {
        e.preventDefault();
        let draggingCard = document.querySelector('.dragging');
        let cardAfterDraggingCard = getCardAfterDraggingCard(list, e.clientY);
        if (cardAfterDraggingCard) {
            if (draggingCard instanceof Node) {
                cardAfterDraggingCard.parentNode.insertBefore(draggingCard, cardAfterDraggingCard);
            }
        } else {
            if (draggingCard instanceof Node) {
                list.appendChild(draggingCard);
            }
        }
    });
    list.addEventListener('drop', e => {
        let draggedCard = document.querySelector('.dragging');
        if (!draggedCard) {
            return;
        }
        let listId = e.currentTarget.getAttribute('data-id');
        let postPosition = [...e.currentTarget.querySelectorAll('.card')].indexOf(e.currentTarget.querySelector('.dragging'));

        fetch('/api/post/move/' + app.infos._id + '/' + listId + '/' + draggedCard.dataset.id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                position: postPosition,
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    return toast({
                        title: 'Erreur',
                        message: data.error,
                        type: 'error',
                    });
                }
            });
    });
}

function getCardAfterDraggingCard(list, yDraggingCard) {
    let listCards = [...list.querySelectorAll('.card:not(.dragging)')];

    return listCards.reduce(
        (closestCard, nextCard) => {
            let nextCardRect = nextCard.getBoundingClientRect();
            let offset = yDraggingCard - nextCardRect.top - nextCardRect.height / 2;

            if (offset < 0 && offset > closestCard.offset) {
                return { offset, element: nextCard };
            } else {
                return closestCard;
            }
        },
        { offset: Number.NEGATIVE_INFINITY }
    ).element;
}

function registerEventsOnCard(card) {
    card.addEventListener('dragstart', e => {
        card.classList.add('dragging');
    });

    card.addEventListener('dragend', e => {
        card.classList.remove('dragging');
    });
}



document.getElementById('latexInput').addEventListener('input', e => {
    const latex = e.currentTarget.value;
    const latexPreview = document.getElementById('latexPreview');
    latexPreview.src = `https://latex.codecogs.com/svg.latex?${latex}`;
});

function insertLatex() {
    const latex = document.getElementById('latexInput').value;
    const latexBlock = document.createElement('latex');
    latexBlock.setAttribute('contenteditable', false);
    latexBlock.innerText = latex;
    document.getElementById('editor').appendChild(latexBlock);
    navbar('post');
}