const express = require('express');
const router = express.Router();
const getMetaData = require('metadata-scraper')
const pdf2img = require('pdf-img-convert');
const sharp = require('sharp');
const axios = require('axios');
const { supportedPreviewAlumet } = require('../config.json');

router.get('/alumetPreview', async (req, res) => {
    res.json(supportedPreviewAlumet);
});

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

        const outputImages = await pdf2img.convert(url, {width: 400});
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

router.get('/image', async (req, res) => {
    try {
      const { url } = req.query;
      const { data: imageData } = await axios.get(url, { responseType: 'arraybuffer' });
      
      const previewImage = await sharp(imageData)
        .resize(200)
        .toBuffer();
  
      res.set('Content-Type', 'image/png');
      res.send(previewImage);
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal server error');
    }
  });


module.exports = router;