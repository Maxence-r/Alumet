const SCOPES = 'https://www.googleapis.com/auth/drive';

const CLIENT_ID = '384898759096-ktgccjo9lnm37s93p136nqjj8sst9n3k.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDQD_HQTIFHhnR8LmgnTnyP6cY2dsAacD0';

const APP_ID = 'alumet-391720';

let tokenClient;
let accessToken = null;
let pickerInited = false;
let gisInited = false;

function gapiLoaded() {
    gapi.load('client:picker', initializePicker);
}

async function initializePicker() {
    await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
    pickerInited = true;
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
}

let logged = false;
function handleAuthClick() {
    if (logged) {
        return createPicker();
    }
    tokenClient.callback = async response => {
        if (response.error !== undefined) {
            throw response;
        }
        accessToken = response.access_token;
        await createPicker();
    };

    if (accessToken === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

function createPicker() {
    const view = new google.picker.View(google.picker.ViewId.DOCS);
    view.setMimeTypes('');
    const picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .setDeveloperKey(API_KEY)
        .setAppId(APP_ID)
        .setOAuthToken(accessToken)
        .addView(view)
        .addView(new google.picker.DocsUploadView())
        .setCallback(pickerCallback)
        .build();
    picker.setVisible(true);
    logged = true;
}

async function pickerCallback(data) {
    if (data.action === google.picker.Action.PICKED) {
        let text = `Picker response: \n${JSON.stringify(data, null, 2)}\n`;
        const document = data[google.picker.Response.DOCUMENTS][0];
        const fileId = document[google.picker.Document.ID];
        console.log(fileId);
        const res = await gapi.client.drive.files.get({
            fileId: fileId,
            fields: '*',
        });
        text += `Drive API response for first document: \n${JSON.stringify(res.result, null, 2)}\n`;
        console.log(text);
        const driveObject = {
            id: res.result.id,
            accessToken: accessToken,
        };
        localStorage.setItem('gDrive', JSON.stringify(driveObject));
        tes(res.result);

        navbar('post');
    }
}

function tes(data) {
    document.querySelector('.drop-box').classList.add('ready-to-send');
    document.querySelector('.file-sending-infos > h3').innerText = data.name;
}

gisLoaded();
gapiLoaded();
