function signin() {
    let mail = document.getElementById("mail").value
    let mdp = document.getElementById("password").value
    let requete = fetch("/auth/signin", {
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
        if (data.error) {
            alert(data.error)
            document.getElementById('signin').classList.toggle('button--loading')
        } else {
            window.location = "../dashboard"
        }
    })
}
document.querySelector('#signin').addEventListener('click' , () => {
    signin()
})
document.addEventListener('keydown' , (event) => {
    if (event.key === 'Enter') {
        signin()
    }
})

