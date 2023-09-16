const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/alumet', async (req, res) => {
    const filePath = path.join(__dirname, '../../../views/pages/setup/alumet.html');
    res.sendFile(filePath);
});

module.exports = router;
