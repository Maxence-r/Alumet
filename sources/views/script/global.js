function toast({ title = "", message = "", type = "info", duration = 3000 }) {
  const main = document.getElementById("toast");
  if (main) {
    const toast = document.createElement("div");

    setTimeout(function () {
      main.removeChild(toast);
    }, duration + 1000);

    const icons = {
      success: `<span class="material-symbols-rounded">check_circle</span>`,
      info: `<span class="material-symbols-rounded">error</span>`,
      warning: `<span class="material-symbols-rounded">warning</span>`,
      error: `<span class="material-symbols-rounded">report</span>`
    };
    const icon = icons[type];
    const delay = (duration / 1000).toFixed(2);

    toast.classList.add("toast", `toast--${type}`);
    toast.style.animation = `slideInLeft ease .3s, fadeOut linear 1s ${delay}s forwards`;

    toast.innerHTML = `
                    <div class="toast__icon">
                        ${icon}
                    </div>
                    <div class="toast__body">
                        <h3 class="toast__title">${title}</h3>
                        <p class="toast__msg">${message}</p>
                    </div>
                `;
    main.appendChild(toast);
  }
}


function relativeTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);

    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
        return "Il y a " + diffInMinutes + "min";
    } else if (diffInHours < 24) {
        return "Il y a " + diffInHours + "h";
    } else {
        return "Il y a " + diffInDays + "j";
    }
  }

function cancelLoading(classLoading) {
    document.querySelector(`.${classLoading}`).classList.remove('button--loading');
}