const express = require('express');
const router = express.Router();
const Account = require('../../models/account');

const A2F = require('../../models/a2f');
const { upload, uploadAndSaveToDb } = require('../../middlewares/utils/uploadHandler');
const rateLimit = require('../../middlewares/authentification/rateLimit');

router.put('/updateinfos', rateLimit(10), async (req, res) => {
    try {
        const { username } = req.body;
        const user = await Account.findById(req.user?.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found.' });
        }
        if (username.length < 2 || username.length > 18) {
            return res.status(400).json({ error: "The username is too short" });
        }
        user.username = username;

        const notificationTypes = ['messageP', 'messageG', 'invitationC', 'commentP', 'alumetA', 'experiments'];

        notificationTypes.forEach(type => {
            if (req.body[type] && !user.notifications.includes(type)) {
                user.notifications.push(type);
            } else if (!req.body[type] && user.notifications.includes(type)) {
                user.notifications = user.notifications.filter(notification => notification !== type);
            }
        });
        await user.save();
        res.status(200).json({ message: 'Information updated successfully!' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/toggleA2f', rateLimit(3), async (req, res) => {
    try {
        const user = await Account.findOne({ mail: req.user.mail });
        if (!user) {
            return res.status(401).json({
                error: 'User not found.',
            });
        }
        const a2f = await A2F.findOne({ owner: req.user.mail, code: req.body.code });
        if (!a2f || a2f.expireAt < new Date()) return res.status(400).json({ error: 'Invalid code.' });

        user.isA2FEnabled = !user.isA2FEnabled;
        await user.save();
        await A2F.deleteOne({ owner: req.user.mail });

        res.status(200).json({
            isA2FEnabled: user.isA2FEnabled,
            message: 'Two-factor authentication updated successfully!',
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message,
        });
    }
});

router.put('/updateicon', rateLimit(5), upload.single('file'), uploadAndSaveToDb('1', ['png', 'jpeg', 'jpg'], 'icon'), async (req, res) => {
    try {
        const user = await Account.findById(req.user.id);
        user.icon = req.upload._id;
        await user.save();
        res.status(200).json({
            icon: user.icon,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message,
        });
    }
});

module.exports = router;
