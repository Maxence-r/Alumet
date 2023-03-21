const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', async (req, res) => {
    const filePath = path.join(__dirname, '../views/pages/main.html');
    res.sendFile(filePath);
});

module.exports = router;