window.addEventListener("load", function () {
    document.querySelector("body > section").style.display = "none";
});

const currentPathId = window.location.pathname.split("/")[2];
if (currentPathId !== localStorage.getItem("authorizedAlumetId")) {
    window.location.href = `/portal/${currentPathId}`;
}
localStorage.removeItem("authorizedAlumetId");
