const express = require('express');
const router = express.Router();
const path = require('path');


router.get('/tos', async (req, res) => {
    const filePath = path.join(__dirname, '../../views/assets/legal/tos.pdf');
    return res.sendFile(filePath);
});

router.get('/privacy', async (req, res) => {
    const filePath = path.join(__dirname, '../../views/assets/legal/pp.pdf');
    return res.sendFile(filePath);
});

module.exports = router;