const express = require('express');
const router = express.Router();
const getMetaData = require('metadata-scraper')
const pdf2img = require('pdf-img-convert');
const sharp = require('sharp');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const ffmpeg = require('fluent-ffmpeg');


router.get('/meta', (req, res) => {
    const url = req.query.url;
    getMetaData(url).then((metadata) => {
        res.json(metadata);
    }).catch((err) => {
        res.json(err);
    });
});

router.get('/video-preview', async (req, res) => {
  try {
    const { url } = req.query;
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });

    const buffer = Buffer.from(response.data, 'binary');
    const videoDataUrl = `data:video/mp4;base64,${buffer.toString('base64')}`;

    const ffmpegCommand = ffmpeg(videoDataUrl)
      .screenshots({
        count: 1,
        timemarks: ['0'],
        filename: 'preview.jpg',
        folder: '/public',
        size: '640x360'
      });

    await new Promise((resolve, reject) => {
      ffmpegCommand.on('end', async () => {
        const img = await loadImage('./public/preview.jpg');
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = canvas.toDataURL('image/jpeg');
        res.write('<img src="');
        res.write(imageData);
        res.end('" alt="Video Preview" />');
        resolve();
      });

      ffmpegCommand.on('error', (err) => {
        console.error(err);
        res.status(500).send('An error occurred');
        reject(err);
      });

      ffmpegCommand.run();
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
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