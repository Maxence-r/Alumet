/* document.querySelector('.sub-container').addEventListener('click', e => {
    document.querySelector('.file-viewer').classList.toggle('active-infos');
}); */

fetch('/cdn/info/' + window.location.href.split('/')[4])
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            toast({
                title: 'Erreur',
                message: data.error,
                type: 'error',
                duration: 2500,
            });
            return setTimeout(() => {
                window.close();
            }, 10000);
        }
        /* document.getElementById('file-name').innerText = data.upload.displayname.split('.').slice(0, -1).join('.') + '.' + data.upload.mimetype;
        document.getElementById('file-owner').innerText = data.account.name + ' ' + data.account.lastname;
        document.getElementById('file-creation').innerText = relativeTime(data.upload.date);
        document.getElementById('file-size').innerText = (data.upload.filesize / 1000 / 1000).toFixed(2) + ' Mo'; */
        loadViewer(data.upload.mimetype, data.upload._id);
    })
    .catch(err => console.log(err));

function loadViewer(mimetype, id) {
    switch (mimetype) {
        case 'png':
        case 'jpeg':
        case 'gif':
        case 'webp':
        case 'jpg':
            const img = document.createElement('img');
            img.src = '/cdn/u/' + id;
            img.onload = () => {
                document.querySelector('.full-screen-infos').style.display = 'none';
                document.querySelector('.main-container').appendChild(img);
            };
            break;
        case 'pdf':
            const pdf = document.createElement('iframe');
            pdf.src = '/cdn/u/' + id + '#toolbar=0&navpanes=0&scrollbar=0';
            document.querySelector('.main-container').appendChild(pdf);
            break;
        case 'mp4':
        case 'webm':
        case 'ogg':
        case 'mov':
            const video = document.createElement('video');
            video.src = '/cdn/u/' + id;
            video.controls = true;
            video.onloadeddata = () => {
                document.querySelector('.full-screen-infos').style.display = 'none';
                document.querySelector('.main-container').appendChild(video);
            };
            break;
        case 'peg':
        case 'mp3':
        case 'ogg':
        case 'wav':
            const audio = document.createElement('audio');
            audio.src = '/cdn/u/' + id;
            audio.controls = true;
            audio.onloadeddata = () => {
                document.querySelector('.full-screen-infos').style.display = 'none';
                document.querySelector('.main-container').appendChild(audio);
            };

            break;
        case 'docx':
        case 'doc':
        case 'pptx':
        case 'ppt':
        case 'xlsx':
        case 'xls':
            const iframe = document.createElement('iframe');
            iframe.src = `https://view.officeapps.live.com/op/embed.aspx?src=${window.location.origin}/cdn/u/${id}`;
            document.querySelector('.main-container').appendChild(iframe);
            break;
        default:
            document.getElementById('default').style.display = 'flex';
    }
    setTimeout(() => {
        document.querySelector('.full-screen-infos').style.display = 'none';
    }, 3000);
}

function downloadFile() {
    window.open('/cdn/u/' + window.location.href.split('/')[4] + '/download', '_blank');
}
