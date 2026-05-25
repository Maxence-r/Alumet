const viewedFileId = window.location.pathname.split('/').pop();

fetch('/api/files/' + viewedFileId)
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            toast({
                title: 'Error',
                message: data.error,
                type: 'error',
                duration: 2500,
            });
            return setTimeout(() => {
                window.close();
            }, 10000);
        }
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
            img.src = fileUrl(id);
            img.onload = () => {
                document.querySelector('.full-screen-infos').style.display = 'none';
                document.querySelector('.main-container').appendChild(img);
            };
            break;
        case 'pdf':
            const pdf = document.createElement('iframe');
            pdf.src = fileUrl(id) + '#toolbar=0&navpanes=0&scrollbar=0';
            document.querySelector('.main-container').appendChild(pdf);
            break;
        case 'mp4':
        case 'webm':
        case 'ogg':
        case 'mov':
            const video = document.createElement('video');
            video.src = fileUrl(id);
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
            audio.src = fileUrl(id);
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
            iframe.src = `https://view.officeapps.live.com/op/embed.aspx?src=${window.location.origin}/api/files/${id}/content`;
            document.querySelector('.main-container').appendChild(iframe);
            break;
        default:
            document.getElementById('default').style.display = 'flex';
    }
    endLoading();
}

function downloadFile() {
    window.open(`/api/files/${viewedFileId}/download`, '_blank');
}
