const express = require('express');
const router = express.Router();
const Invitation = require('../../models/invitation');
const path = require('path');
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');
const Alumet = require('../../models/alumet');
const rateLimit = require('../../middlewares/authentification/rateLimit');

router.get('/:id', validateObjectId, async (req, res) => {
    try {
        if (!req.user || !req.user.mail) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        let invitation = await Invitation.findOne({ reference: req.params.id, mail: req.user.mail });
        if (!invitation) {
            res.redirect('/404');
        }

        const filePath = path.join(__dirname, '../../views/pages/invitation.html');
        res.sendFile(filePath);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
});

router.post('/accept/:id', rateLimit(30), async (req, res) => {
    try {
        if (!req.user || !req.user.mail) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const invitation = await Invitation.findOne({
            reference: req.params.id,
            mail: req.user.mail,
        });
        if (!invitation) {
            return res.status(404).json({
                error: 'Invitation not found',
            });
        }
        let referenceDetails = await Alumet.findById(invitation.reference);
        if (!referenceDetails) {
            invitation.remove();
            setTimeout(() => {
                return res.redirect('/dashboard');
            }, 500);
        }
        referenceDetails.participants = referenceDetails.participants.filter(participant => participant.userId !== req.user.id);
        referenceDetails.participants.push({ userId: req.user.id, status: 1 });

        await referenceDetails.save();
        await invitation.remove();
        res.status(200).json({
            message: 'Invitation accepted',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error,
        });
    }
});

router.post('/decline/:id', rateLimit(30), async (req, res) => {
    try {
        if (!req.user || !req.user.mail) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const invitation = await Invitation.findOne({
            reference: req.params.id,
            mail: req.user.mail,
        });
        if (!invitation) {
            return res.status(404).json({
                error: 'Invitation not found',
            });
        }
        await invitation.remove();
        res.status(200).json({
            message: 'Invitation declined',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Internal server error',
        });
    }
});

module.exports = router;
