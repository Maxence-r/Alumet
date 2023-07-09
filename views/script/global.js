const endpointReference = {
  'png': '/preview/image?id=*',
  'jpg': '/preview/image?id=*',
  'jpeg': '/preview/image?id=*',
  'gif': '/cdn/u/*',
  'apng': '/cdn/u/*',
  'avif': '/cdn/u/*',
  'webp': '/cdn/u/*',
  'svg': '/cdn/u/*',
  'pdf': '/preview/pdf?id=*',
}

const fileIconReference = {
  'png': '../assets/files-ico/img.png',
  'jpg': '../assets/files-ico/img.png',
  'jpeg': '../assets/files-ico/img.png',
  'gif': '../assets/files-ico/img.png',
  'apng': '../assets/files-ico/img.png',
  'avif': '../assets/files-ico/img.png',
  'webp': '../assets/files-ico/img.png',
  'svg': '../assets/files-ico/img.png',
  'pdf': '../assets/files-ico/img.png',
  'doc': '../assets/files-ico/doc.png',
  'docx': '../assets/files-ico/doc.png',
  'xls': '../assets/files-ico/xls.png',
  'xlsx': '../assets/files-ico/xls.png',
  'ppt': '../assets/files-ico/ppt.png',
  'pptx': '../assets/files-ico/ppt.png',
  'txt': '../assets/files-ico/doc.png',
  'zip': '../assets/files-ico/zip.png',
  'rar': '../assets/files-ico/zip.png',
  '7z': '../assets/files-ico/zip.png',
  'tar': '../assets/files-ico/zip.png',
  'gz': '../assets/files-ico/zip.png',
  'bz2': '../assets/files-ico/zip.png',
  'xz': '../assets/files-ico/zip.png',
  'mp3': '../assets/files-ico/mp3.png',
  'wav': '../assets/files-ico/mp3.png',
  'ogg': '../assets/files-ico/mp3.png',
  'flac': '../assets/files-ico/mp3.png',
  'm4a': '../assets/files-ico/mp3.png',
  'mp4': '../assets/files-ico/mov.png',
  'mkv': '../assets/files-ico/mov.png',
  'mov': '../assets/files-ico/mov.png',
  'avi': '../assets/files-ico/mov.png',
  'wmv': '../assets/files-ico/mov.png',
  'flv': '../assets/files-ico/mov.png',
  'webm': '../assets/files-ico/mov.png',
  'm4v': '../assets/files-ico/mov.png',
  'mpg': '../assets/files-ico/mov.png',
  'mpeg': '../assets/files-ico/mov.png',
}


function toast({ title = "", message = "", type = "info", duration = 3000 }) {
  const main = document.getElementById("toast");
  if (main) {
    const toast = document.createElement("div");

    setTimeout(function () {
      main.removeChild(toast);
    }, duration + 1000);

    const icons = {
      success: '<span class="material-symbols-rounded">check_circle</span>',
      info: '<span class="material-symbols-rounded">error</span>',
      warning: '<span class="material-symbols-rounded">warning</span>',
      error: '<span class="material-symbols-rounded">report</span>'
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



let supportedPreviewAlumet = {
  "pdf": "<img loading=\"lazy\" src=\"/preview/pdf?url=*\">",
  "png": "<img loading=\"lazy\" src=\"/preview/image?url=*\">",
  "jpg": "<img loading=\"lazy\" src=\"/preview/image?url=*\">",
  "jpeg": "<img loading=\"lazy\" src=\"/preview/image?url=*\">",
  "gif": "<img loading=\"lazy\" src=\"/preview/image?url=*\">",
  "apng": "<img loading=\"lazy\" src=\"/preview/image?url=*\">",
  "avif": "<img loading=\"lazy\" src=\"/preview/image?url=*\">",
  "webp": "<img loading=\"lazy\" src=\"/preview/image?url=*\">",
  "mp4": "<video width=\"400\" controls=\"false\" preload=\"metadata\"><source src=\"*\" type=\"video/mp4\"></video>",
  "webm": "<video width=\"400\" controls=\"controls\" preload=\"metadata\"><source src=\"*\" type=\"video/mp4\"></video>",
  "ogg": "<video width=\"400\" controls=\"controls\" preload=\"metadata\"><source src=\"*\" type=\"video/mp4\"></video>",
  "mp3": "<img loading=\"lazy\" src=\"./../../assets/app/audio.png\">",
  "wav": "<img loading=\"lazy\" src=\"./../../assets/app/audio.png\">",
  "flac": "img loading=\"lazy\" src=\"./../../assets/app/audio.png\">",
  "pptx": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
  "odt": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
  "ods": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
  "ppt": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
  "odp": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
  "docx": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
  "doc": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
  "xlsx": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">",
  "xls": "<img loading=\"lazy\" src=\"./../../assets/app/empty_preview.png\">"
}

