const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose');
const Alumet = require('../../models/alumet');
require('dotenv').config();
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');
const jwt = require('jsonwebtoken');
const rateLimit = require('../../middlewares/authentification/rateLimit');
router.get('/:id', validateObjectId, async (req, res) => {
    try {
        if (req.connected) {
            const alumet = await Alumet.findOne({
                _id: req.params.id,
            });
            if (!alumet) {
                return res.redirect('/404');
            }
            if (req.cookies.applicationToken) {
                try {
                    const decoded = jwt.verify(req.cookies.applicationToken, process.env.TOKEN);
                    if (decoded.applicationId === alumet._id) {
                        return res.redirect('/app/' + req.params.id);
                    }
                } catch (error) {
                    console.error('JWT verification error:', error);
                }
            }
            if (alumet.participants.some(p => p.userId === req.user.id && p.status === 1) || alumet.owner === req.user.id) {
                return res.redirect('/app/' + req.params.id);
            }
        }
        const filePath = path.join(__dirname, '../../views/pages/authentification/authentication.html');
        return res.sendFile(filePath);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
});

router.post('/authorize/:id', rateLimit(10), async (req, res) => {
    try {
        let alumet;
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            alumet = await Alumet.findById(req.params.id);
        }
        if (!alumet) {
            return res.status(404).json({
                error: 'Alumet not found',
            });
        }
        switch (alumet.security) {
            case 'open':
                if (req.user?.id) {
                    alumet.participants.push({ userId: req.user.id, status: 2 });
                    await alumet.save();
                }
                break;
            case 'onpassword':
                if (req.user?.id) {
                    if (req.body.password === alumet.password) {
                        alumet.participants.push({ userId: req.user.id, status: 2 });
                        await alumet.save();
                        return res.status(200).json({
                            message: 'Alumet joined',
                        });
                    } else {
                        return res.status(400).json({
                            error: 'Le mot de passe est incorrect.',
                        });
                    }
                } else {
                    if (req.body.password === alumet.password) {
                        return new Promise((resolve, reject) => {
                            jwt.sign(
                                { applicationId: alumet._id },
                                process.env.TOKEN,
                                { expiresIn: '1h' },
                                (err, token) => {
                                    if (err) {
                                        console.error(err);
                                        reject(res.status(500).json({
                                            error: 'Internal Server Error',
                                        }));
                                    } else {
                                        resolve(res.cookie('applicationToken', token, { maxAge: 3600000, httpOnly: true })
                                            .status(200).json({
                                                message: 'Alumet Authorized',
                                            }));
                                    }
                                }
                            );
                        });
                    } else {
                        return res.status(400).json({
                            error: 'Wrong password',
                        });
                    }
                }
                break;
            case 'closed':
                if (req.user?.id) {
                    console.log('req.user.id: ', req.user.id);
                    alumet.participants.push({ userId: req.user.id, status: 4 });
                    await alumet.save();
                }
                break;
        }
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

router.get('/leave/:id', rateLimit(30, true), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.id);
        if (!alumet) {
            return res.status(404).json({
                error: 'Alumet not found',
            });
        }
        if (!alumet.participants.some(p => p.userId === req.user.id)) {
            return res.status(400).json({
                error: "Vous devez conceder la propriété de l'alumet avant de le quitter",
            });
        }
        alumet.participants = alumet.participants.filter(participant => participant.userId !== req.user.id);
        await alumet.save();
        res.status(200).json({
            message: 'Alumet left',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error,
        });
    }
});



module.exports = router;
