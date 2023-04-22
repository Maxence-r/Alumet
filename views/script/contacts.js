let progress = 1
function afficher() {
    if (progress == 1) {
        let a = document.body;
        let newP = document.createElement('h3');
        newP.textContent = 'Votre message a bien été envoyé !';
        let new2P = document.createElement('h3');
        new2P.textContent = 'Redirection dans 5 secondes';
        a.append(newP);
        a.append(new2P)
        setTimeout(fonctionAExecuter, 5000);
        progress ++
    }
}
function fonctionAExecuter() {
    document.location.href='/auth/main'
}