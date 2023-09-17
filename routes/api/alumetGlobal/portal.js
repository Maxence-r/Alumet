const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose');
const Alumet = require('../../../models/alumet');
require('dotenv').config();
const validateObjectId = require('../../../middlewares/modelsValidation/validateObjectId');
const authorize = require('../../../middlewares/authentification/authorize');

router.get('/:id', validateObjectId, async (req, res) => {
    try {
        if (req.connected) {
            const alumet = await Alumet.findOne({
                _id: req.params.id,
            });
            if (!alumet) {
                console.log('Alumet not found');
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
            console.log(req.body.code);
            alumet = await Alumet.findOne({
                code: req.body.code,
            });
        }
        console.log(alumet);
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
        await alumet.save();
        res.status(200).json({
            message: 'Alumet joined',
        });
    } catch (error) {
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

module.exports = router;
