document.getElementById('signin').addEventListener('click', () => {
    let mail = document.getElementById("mail").value
    let mdp = document.getElementById("password").value
    let requete = fetch("/auths/signin", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            mail: mail,
            password: mdp
        })
    })
    requete.then((res) => {
        return res.json()
    }).then((data) => {
        console.log(data)
        if (data.error) {
            alert(data.error)
            document.getElementById('signin').classList.toggle('button--loading')
        } else {
            window.location = "../dashboard"
        }
    })
})