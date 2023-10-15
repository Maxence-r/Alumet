const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose');
const Alumet = require('../../../models/alumet');
require('dotenv').config();
const validateObjectId = require('../../../middlewares/modelsValidation/validateObjectId');
const authorize = require('../../../middlewares/authentification/authorize');
const Conversation = require('../../../models/conversation');
const Invitation = require('../../../models/invitation');
const flashCardSet = require('../../../models/flashcardSet');

router.get('/:id', validateObjectId, async (req, res) => {
    try {
        if (req.connected) {
            const alumet = await Alumet.findOne({
                _id: req.params.id,
            });
            if (!alumet) {
                return res.redirect('/404');
            }
            if (alumet.participants.includes(req.user.id) || alumet.owner === req.user.id || alumet.collaborators.includes(req.user.id)) {
                return res.redirect('/a/' + req.params.id);
            }
        }
        const filePath = path.join(__dirname, '../../../views/pages/authentification/authentication.html');
        return res.sendFile(filePath);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
});

router.post('/authorize/:id', authorize(), async (req, res) => {
    try {
        let alumet;
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            alumet = await Alumet.findById(req.params.id);
        } else {
            alumet = await Alumet.findOne({
                code: req.body.code,
            });
        }

        if (!alumet) {
            return res.status(404).json({
                error: 'Ce code ne correspond à aucun alumet',
            });
        }
        if (alumet.private && req.body.code !== alumet.code) {
            return res.status(401).json({
                error: 'Le code est incorrect',
            });
        }
        if (alumet.participants.includes(req.user.id)) {
            return res.status(400).json({
                error: 'User is already a participant',
            });
        }
        alumet.participants.push(req.user.id);
        let conversation = await Conversation.findOne({ _id: alumet.chat });
        conversation.participants.push(req.user.id);
        await conversation.save();

        await alumet.save();
        res.status(200).json({
            message: 'Alumet joined',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error,
        });
    }
});

router.get('/leave/:id', authorize(), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.id);
        if (!alumet) {
            return res.status(404).json({
                error: 'Alumet not found',
            });
        }
        if (!alumet.participants.includes(req.user.id) && !alumet.collaborators.includes(req.user.id)) {
            return res.status(400).json({
                error: "Vous devez conceder la propriété de l'alumet avant de le quitter",
            });
        }
        alumet.participants = alumet.participants.filter(participant => participant !== req.user.id);
        alumet.collaborators = alumet.collaborators.filter(collaborator => collaborator !== req.user.id);

        let conversation = await Conversation.findOne({ _id: alumet.chat });
        conversation.participants = conversation.participants.filter(participant => participant !== req.user.id);

        await conversation.save();
        await alumet.save();
        res.status(200).json({
            message: 'Alumet left',
        });
    } catch (error) {
        res.status(500).json({
            error,
        });
    }
});

router.post('/accept/:id', authorize(), async (req, res) => {
    try {
        const invitation = await Invitation.findOne({
            _id: req.params.id,
        });
        if (!invitation) {
            return res.status(404).json({
                error: 'Invitation not found',
            });
        }
        let referenceDetails;
        if (invitation.type === 'alumet') {
            referenceDetails = await Alumet.findById(invitation.reference);
        } else if (invitation.type === 'flashcards') {
            referenceDetails = await flashCardSet.findById(invitation.reference);
        }

        if (!referenceDetails) {
            invitation.remove();
            setTimeout(() => {
                return res.redirect('/dashboard');
            }, 500);
        }
        if (invitation.type === 'alumet') {
            referenceDetails.participants = referenceDetails.participants.filter(participant => participant !== req.user.id);
            let conversation = await Conversation.findOne({ _id: referenceDetails.chat });
            conversation.participants.push(req.user.id);
            await conversation.save();
        }
        referenceDetails.collaborators.push(req.user.id);

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

router.post('/decline/:id', authorize(), async (req, res) => {
    try {
        const invitation = await Invitation.findOne({
            _id: req.params.id,
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
