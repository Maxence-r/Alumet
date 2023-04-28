const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
const Alumet = require('../models/alumet');
const { tokenC } = require('../config.json');
const validateObjectId = require('../middlewares/validateObjectId');


router.get('/:id', validateObjectId, async (req, res) => {
    try {
        if (req.logged) {
            const alumet = await Alumet.findOne({
                _id: req.params.id
            });
            if (!alumet) {
                return res.status(404).json({
                    error: 'Alumet not found'
                });
            }
            if (alumet.owner.toString() === req.user.id) {
                res.clearCookie('alumetToken');
                return res.redirect('/a/edit/' + req.params.id)
            }
        }
        if (req.auth && req.alumet.id.toString() === req.params.id) {
            return res.redirect('/a/' + req.params.id);
        }
        const filePath = path.join(__dirname, '../views/pages/authentication.html');
        return res.sendFile(filePath);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});


router.post('/authorize', validateObjectId, async (req, res) => {
    Alumet.findOne({
        _id: req.body.id
    }).then(alumet => {
        if (!alumet) {
            return res.status(404).json({
                error: 'Alumet not found'
            });
        }
        if (req.body.username.length > 40 || req.body.username.includes('<')) {
            return res.status(400).json({
                error: 'Choississez un nom d\'utilisateur plus court !'
            });
        }
        if (alumet.password === req.body.password || !alumet.password) {
            const token = jwt.sign({
                id: alumet._id,
                username: req.body.username || "Anonyme",
            }, tokenC);
            res.cookie('alumetToken', token).status(200).json({
                message: 'Connexion réussie !'
            });
        } else {
            res.status(401).json({
                error: 'Mot de passe incorrect !'
            });
        }
    }).catch(error => {
        res.status(500).json({
            error
        });
    });
});



module.exports = router;