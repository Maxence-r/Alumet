const { Worker } = require('worker_threads');
const Jimp = require('jimp');

const addBlurToImage = async (req, res, next) => {
    try {
        if (req.upload) {
            const worker = new Worker('./workers/utils/blur-worker.js', {
                workerData: { filename: req.upload.filename },
            });
            worker.on('message', () => {
                next();
            });
            worker.on('error', (error) => {
                console.error(error);
                res.status(400).json({ error: 'An error occurred while processing the image.' });
            });
        } else {
            next();
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'An error occurred while processing the image.' });
    }
};

module.exports = addBlurToImage;