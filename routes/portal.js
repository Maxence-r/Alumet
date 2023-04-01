const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
const Alumet = require('../models/alumet');
const { tokenC } = require('../config.json');

router.get('/:id', async (req, res) => {
    const filePath = path.join(__dirname, '../views/pages/authentication.html');
    res.sendFile(filePath);
});

router.post('/authorize', async (req, res) => {
    Alumet.findOne({
        _id: req.body.id
    }).then(alumet => {
        if (!alumet) {
            return res.status(404).json({
                error: 'Alumet not found'
            });
        }
        if (alumet.password === req.body.password || !alumet.password) {
            const token = jwt.sign({
                id: alumet._id,
                username: alumet.name || "Anonyme",
            }, tokenC, {
                expiresIn: '6h'
            });
            res.cookie('alumetToken', token).status(200).json({
                message: 'Connexion réussie !'
            });
        } else {
            res.status(401).json({
                error: 'Mot de passe incorrect !'
            });
        }
    }).catch(error => {
        console.log(error);
        res.status(500).json({
            error
        });
    });
});



module.exports = router;