const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', async (req, res) => {
    if (!req.connected) return res.redirect('/auth/signin');
    let filePath;
    if (req.user.accountType === 'student') {
        filePath = path.join(__dirname, '../../../views/pages/dashboard/student.html');
    } else {
        filePath = path.join(__dirname, '../../../views/pages/dashboard/professor.html');
    }

    res.sendFile(filePath);
});

module.exports = router;
