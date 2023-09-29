const express = require('express');
const router = express.Router();
const path = require('path');
const authorize = require('../../../middlewares/authentification/authorize');

router.get('/alumet', authorize(), async (req, res) => {
    if (!req.connected || (req.user.accountType !== 'professor' && req.user.accountType !== 'staff')) {
        return res.redirect('/auth/signin');
    }
    const filePath = path.join(__dirname, '../../../views/pages/setup/alumet.html');
    res.sendFile(filePath);
});

router.get('/flashcards', authorize(), async (req, res) => {
    if (!req.connected) {
        return res.redirect('/auth/signin');
    }
    const filePath = path.join(__dirname, '../../../views/pages/setup/flashcards.html');
    res.sendFile(filePath);
});

module.exports = router;
