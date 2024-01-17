const express = require('express');
const router = express.Router();
const User = require('../../models/account');
const { sendMail } = require('../mail/mailing');
router.post('/suspend/:userId', async (req, res) => {
    if (!req.connected || req.user.accountType !== 'staff') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log(req.body.reason);

        user.suspended = {
            reason: req.body.reason,
            date: new Date(),
        };
        sendMail('suspended', user.mail);
        await user.save();

        res.json({ message: 'User suspended successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
