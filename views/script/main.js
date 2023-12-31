
console.log("Welcome to Alumet Education website !");

//ANCHOR - Coutdown Timer
// Get the countdown date once
const countDownDate = new Date("Jan 1, 2024 20:00:00").getTime();

// Create a function to update the countdown
function updateCountdown() {
    const now = new Date().getTime();
    let distance = countDownDate - now;

    // Time calculations for days, hours, minutes and seconds
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    distance %= (1000 * 60 * 60 * 24);
    const hours = Math.floor(distance / (1000 * 60 * 60));
    distance %= (1000 * 60 * 60);
    const minutes = Math.floor(distance / (1000 * 60));
    distance %= (1000 * 60);
    const seconds = Math.floor(distance / 1000);

    document.getElementById("coutdown").innerHTML = days + "J " + hours + "H " + minutes + "M " + seconds + "S ";

    if (distance < 0) {
        clearInterval(intervalId);
        document.getElementById("demo").innerHTML = "0s...";
    }
}

// Call the function once immediately, then set the interval
updateCountdown();
const intervalId = setInterval(updateCountdown, 1000);

function showToast() {
    return toast({
        title: 'Erreur',
        message: "La montage de la conférence est en cours, veuillez réessayer plus tard.",
        type: 'error',
        duration: 5000,
    })
}