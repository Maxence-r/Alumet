const express = require('express');
const router = express.Router();
const getMetaData = require('metadata-scraper')

router.get('/meta', (req, res) => {
    const url = req.query.url;
    getMetaData(url).then((metadata) => {
        res.json(metadata);
    }).catch((err) => {
        res.json(err);
    });
});


module.exports = router;