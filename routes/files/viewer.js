const express = require('express');
const router = express.Router();
const path = require('path');
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');

router.get('/:id', validateObjectId, async (req, res) => {
    const filePath = path.join(__dirname, '../../views/pages/viewer.html');
    res.sendFile(filePath);
});

module.exports = router;
