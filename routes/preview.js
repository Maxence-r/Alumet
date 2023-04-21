const express = require('express');
const router = express.Router();
const getMetaData = require('metadata-scraper')
const pdf2img = require('pdf-img-convert');
const path = require('path');
const fs = require('fs');


router.get('/meta', (req, res) => {
    const url = req.query.url;
    getMetaData(url).then((metadata) => {
        res.json(metadata);
    }).catch((err) => {
        res.json(err);
    });
});


router.get('/pdf', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            throw new Error('URL parameter missing');
        }

        const outputImages = await pdf2img.convert(url, {width: 200});
        if (outputImages.length === 0) {
            throw new Error('No images found');
        }

        const outputImage = outputImages[0];
        const imageBuffer = Buffer.from(outputImage, 'base64');
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': imageBuffer.length
        });
        res.end(imageBuffer);

    } catch (error) {
        console.error(`Error generating image: ${error}`);
        res.status(500).send('Error generating image');
    }
});


module.exports = router;