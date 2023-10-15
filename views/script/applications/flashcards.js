const url = window.location.href;
const id = url.split('/').pop();
fetch(`/flashcards/${id}/content`)
    .then(res => res.json())
    .then(data => {
        console.log(data);
        document.getElementById('flashcard-title').innerText = data.title;
        document.getElementById('flashcard-description').innerText = data.description || 'Aucune description';
        document.getElementById('flashcardName').value = data.title;
        document.getElementById('flashcardDescription').value = data.description;
        document.getElementById('invitationLink').value = window.location.href;
        document.getElementById('flashcardPublic').checked = data.isPublic;
        loadParticipants([], data.collaborators, true);
        endLoading();
    })
    .catch(err => console.log(err));

function modifyFlashcard() {
    document.querySelector('.full-screen').style.display = 'flex';
    let name = document.getElementById('flashcardName').value;
    let description = document.getElementById('flashcardDescription').value;
    let isPublic = document.getElementById('flashcardPublic').checked;
    fetch(`/flashcards/${id}/content`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            description,
            isPublic,
            collaborators: participants,
        }),
    }).then(res => {
        res.json().then(data => {
            if (data.error) {
                document.querySelector('.full-screen').style.display = 'none';
                toast({ title: 'Erreur', message: data.error, type: 'error', duration: 7500 });
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                toast({ title: 'Succès', message: "L'alumet a bien été modifié !", type: 'success', duration: 2500 });
                setTimeout(() => {
                    window.location.href = `/dashboard`;
                }, 2500);
            }
        });
    });
}
