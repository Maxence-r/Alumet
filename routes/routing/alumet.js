const express = require('express');
const router = express.Router();
const path = require('path');
const Alumet = require('../../models/alumet');
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');
const authorize = require('../../middlewares/authentification/authorize');
const validateAlumet = require('../../middlewares/modelsValidation/validateAlumet');
const { upload, uploadAndSaveToDb } = require('../../middlewares/utils/uploadHandler');
const Conversation = require('../../models/conversation');
const sendInvitations = require('../../middlewares/mailManager/sendInvitations');
const authorizeA2F = require('../../middlewares/authentification/authorizeA2f');

router.get('/:id', validateObjectId, async (req, res) => {
    let alumet = await Alumet.findById(req.params.id);
    if (!alumet) return res.redirect('/404');
    if (alumet.private === true && (!req.connected || (!alumet.collaborators.includes(req.user.id) && !alumet.participants.includes(req.user.id) && req.user.id !== alumet.owner))) {
        return res.redirect('/portal/' + req.params.id);
    }
    if ((req.connected && !alumet.collaborators.includes(req.user.id) && !alumet.participants.includes(req.user.id) && req.user.id !== alumet.owner) || (!req.connected && req.query.guest !== 'true')) {
        return res.redirect('/portal/' + req.params.id);
    }
    const filePath = path.join(__dirname, '../../views/pages/alumet.html');
    res.sendFile(filePath);
});
router.put('/new', authorize('professor'), upload.single('file'), uploadAndSaveToDb('3', ['png', 'jpeg', 'jpg']), validateAlumet, async (req, res) => {
    try {
        let alumet;
        if (!req.body.alumet) {
            alumet = new Alumet({
                owner: req.user.id,
                title: req.body.title,
                description: req.body.description,
                background: req.upload ? req.upload._id : undefined,
                private: req.body.private,
                swiftchat: req.body.chat,
                lastUsage: Date.now(),
            });
            const conversation = new Conversation({
                name: alumet.title,
                type: 'alumet',
                owner: alumet.owner,
                icon: alumet.background,
            });
            await conversation.save();
            alumet.chat = conversation._id;
            req.alumetId = alumet._id;
            await alumet.save();
            sendInvitations(req, res, 'alumet', alumet._id);
            res.json({ alumet });
        } else {
            alumet = await Alumet.findByIdAndUpdate(req.body.alumet, {
                title: req.body.title,
                description: req.body.description,
                background: req.upload ? req.upload._id : undefined,
                private: req.body.private,
                swiftchat: req.body.chat,
                lastUsage: Date.now(),
            });
            await Conversation.findByIdAndUpdate(alumet.chat, {
                name: req.body.title,
                icon: req.upload ? req.upload._id : undefined,
            });
            res.json({ alumet });
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'An error occurred while creating the alumet.' });
    }
});

module.exports = router;
