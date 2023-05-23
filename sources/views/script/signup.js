let progresse = 1
function progress() {
    if (progresse == 1) {
        document.querySelector(".first").style.display = "none"
        document.querySelector(".second").style.display = "flex"
        progresse ++
    } else if (progresse == 2) {
        let nom = document.getElementById("nom").value
        let prenom = document.getElementById("prenom").value
        let ae = document.getElementById("mail").value
        let mdp = document.getElementById("password").value
        let requete = fetch("/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nom: nom,
                prenom: prenom,
                email: ae,
                password: mdp
            })
        })
        requete.then((res) => {
            return res.json()
        }).then((data) => {
            if (data.message) {
             alert("Une erreur est survenue")
            } else {
                document.querySelector(".second").style.display = "none"
                document.querySelector(".third").style.display = "flex"
                document.querySelector(".continue").innerText = "Acceder à l'application"
                progresse ++
            }
        })
    } else {
        window.location = "../auth/signin"
    }
}


