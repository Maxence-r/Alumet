const express = require('express');
const router = express.Router();
const User = require('../../models/account');
const { sendMail } = require('../mail/mailing');
const Incident = require('../../models/incident');
const rateLimit = require('../../middlewares/authentification/rateLimit');
router.post('/suspend/:userId', async (req, res) => {
    if (!req.connected || req.user.accountType !== 'staff') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.suspended = {
            reason: req.body.reason,
            date: new Date(),
        };
        await user.save();
        sendMail('suspended', user.mail);

        res.json({ message: 'User suspended successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/incidents', rateLimit(30), async (req, res) => {
    try {
        const incidents = await Incident.find().sort({ createdAt: 1 });
        res.json(incidents);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/incidents', async (req, res) => {
    try {
        if (!req.connected || req.user.accountType !== 'staff') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const incident = new Incident({
            title: req.body.title,
            description: req.body.description,
        });
        await incident.save();
        res.json({ message: 'Incident created successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Server error' });
    }
});
module.exports = router;
