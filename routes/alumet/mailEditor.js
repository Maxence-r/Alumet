const express = require('express');
const router = express.Router();
const path = require('path');


router.get('/a2f', (req, res) => {
    const filePath = path.join(__dirname, '../../views/pages/mails/a2f-code.html');
    res.sendFile(filePath);
});

module.exports = router;
