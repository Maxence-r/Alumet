const uploadGoogleDrive = file => {
    console.log('uploadGoogleDrive');
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log('uploadGoogleDrive 1', file.accessToken);
            resolve();
        }, 1000);
    });
};

module.exports = uploadGoogleDrive;
