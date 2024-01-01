const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/:type', async (req, res) => {
    const type = req.params.type;
    if (!req.connected || (type === 'alumets' && req.user.accountType !== 'professor' && req.user.accountType !== 'staff')) {
        return res.redirect('/auth/signin');
    }
    const filePath = path.join(__dirname, `../../views/pages/setup/new-app.html`);
    res.sendFile(filePath);
});

module.exports = router;
