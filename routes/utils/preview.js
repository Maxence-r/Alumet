const express = require('express');
const router = express.Router();
const urlMetadata = require('url-metadata');
const pdf2img = require('pdf-img-convert');
const sharp = require('sharp');
const axios = require('axios');
const { supportedPreviewAlumet } = require('../../config.json');
const Upload = require('../../models/upload');

router.get('/alumetPreview', async (req, res) => {
    res.json(supportedPreviewAlumet);
});

router.get('/meta', (req, res) => {
    const url = req.query.url;
    urlMetadata(url)
        .then(metadata => {
            res.json(metadata);
        })
        .catch(err => {
            res.json(err);
        });
});

router.get('/', async (req, res) => {
    const upload = await Upload.findOne({ _id: req.query.id });
    console.log(upload);
    if (!upload) {
        res.sendFile('unknow.png', { root: './views/assets/preview' });
    } else {
        switch (upload.mimetype) {
            case 'pdf':
                try {
                    const { id } = req.query;
                    const url = `${req.protocol}://${req.get('host')}/cdn/u/${id}`;
                    if (!url) {
                        throw new Error('URL parameter missing');
                    }

                    const outputImages = await pdf2img.convert(url, { width: 400 });
                    if (outputImages.length === 0) {
                        throw new Error('No images found');
                    }

                    const outputImage = outputImages[0];
                    const imageBuffer = Buffer.from(outputImage, 'base64');
                    res.writeHead(200, {
                        'Content-Type': 'image/png',
                        'Content-Length': imageBuffer.length,
                    });
                    res.end(imageBuffer);
                } catch (error) {
                    console.error(`Error generating image: ${error}`);
                    res.status(500).send('Error generating image');
                }
                break;
            case 'png':
            case 'jpeg':
            case 'jpg':
                try {
                    const { id } = req.query;
                    const url = `${req.protocol}://${req.get('host')}/cdn/u/${id}`;
                    const { data: imageData } = await axios.get(url, { responseType: 'arraybuffer' });

                    const previewImage = await sharp(imageData).resize(200).toBuffer();

                    res.set('Content-Type', 'image/png');
                    res.send(previewImage);
                } catch (err) {
                    console.error(`Error generating image: ${err}`);
                    res.status(500).send('Internal server error');
                }
                break;
            case 'mp3':
            case 'wav':
            case 'ogg':
            case 'flac':
            case 'm4a':
            case 'wma':
            case 'aac':
                res.sendFile('audio.png', { root: './views/assets/preview' });
                break;
            case 'mp4':
            case 'webm':
            case 'mkv':
            case 'avi':
            case 'mov':
            case 'wmv':
            case 'flv':
            case '3gp':
            case 'm4v':
                res.sendFile('video.png', { root: './views/assets/preview' });
                break;
            case 'doc':
            case 'docx':
                res.sendFile('doc.png', { root: './views/assets/preview' });
                break;
            case 'xls':
            case 'xlsx':
                res.sendFile('sheet.png', { root: './views/assets/preview' });
                break;
            case 'ppt':
            case 'pptx':
                res.sendFile('slide.png', { root: './views/assets/preview' });
                break;
            case 'zip':
            case 'rar':
            case '7z':
            case 'tar':
            case 'gz':
                res.sendFile('zip.png', { root: './views/assets/preview' });
                break;
            default:
                res.sendFile('unknow.png', { root: './views/assets/preview' });
                break;
        }
    }
});

router.get('/pdf', async (req, res) => {
    try {
        const { id } = req.query;
        const url = `${req.protocol}://${req.get('host')}/cdn/u/${id}`;
        if (!url) {
            throw new Error('URL parameter missing');
        }

        const outputImages = await pdf2img.convert(url, { width: 400 });
        if (outputImages.length === 0) {
            throw new Error('No images found');
        }

        const outputImage = outputImages[0];
        const imageBuffer = Buffer.from(outputImage, 'base64');
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': imageBuffer.length,
        });
        res.end(imageBuffer);
    } catch (error) {
        console.error(`Error generating image: ${error}`);
        res.status(500).send('Error generating image');
    }
});

router.get('/image', async (req, res) => {
    try {
        const { id } = req.query;
        const url = `${req.protocol}://${req.get('host')}/cdn/u/${id}`;
        const { data: imageData } = await axios.get(url, { responseType: 'arraybuffer' });

        const previewImage = await sharp(imageData).resize(200).toBuffer();

        res.set('Content-Type', 'image/png');
        res.send(previewImage);
    } catch (err) {
        console.error(`Error generating image: ${err}`);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
