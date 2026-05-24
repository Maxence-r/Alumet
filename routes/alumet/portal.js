const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose');
const Alumet = require('../../models/alumet');
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');
const rateLimit = require('../../middlewares/authentification/rateLimit');
const { authCookieOptions, signJwt, verifyJwt } = require('../../utils/auth');
const logger = require('../../utils/logger');

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
                    const decoded = verifyJwt(req.cookies.applicationToken);
                    if (decoded.applicationId === alumet._id.toString()) {
                        return res.redirect('/app/' + req.params.id);
                    }
                } catch (error) {
                    logger.warn('Application token verification failed', error.message);
                }
            }
            if (alumet.participants.some(p => p.userId === req.user.id && p.status === 1) || alumet.owner === req.user.id) {
                return res.redirect('/app/' + req.params.id);
            }
        }
        const filePath = path.join(__dirname, '../../views/pages/authentification/authentication.html');
        return res.sendFile(filePath);
    } catch (error) {
        logger.error('Portal render failed', error);
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
                if (req.user?.id && alumet.participants.every(p => p.userId !== req.user.id)) {
                    alumet.participants.push({ userId: req.user.id, status: 2 });
                    await alumet.save();
                }
                break;
            case 'onpassword':
                if (req.user?.id) {
                    if (req.body.password === alumet.password) {
                        if (alumet.participants.some(p => p.userId === req.user.id)) {
                            return res.status(400).json({
                                error: 'You have already joined this Alumet',
                            });
                        }
                        alumet.participants.push({ userId: req.user.id, status: 2 });
                        await alumet.save();
                        return res.status(200).json({
                            message: 'Alumet joined',
                        });
                    } else {
                        return res.status(400).json({
                            error: 'The password is incorrect.',
                        });
                    }
                } else {
                    if (req.body.password === alumet.password) {
                        const token = signJwt({ applicationId: alumet._id.toString() }, { expiresIn: '1h' });
                        return res.cookie('applicationToken', token, authCookieOptions(3600000)).status(200).json({
                            message: 'Alumet authorized',
                        });
                    } else {
                        return res.status(400).json({
                            error: 'Wrong password',
                        });
                    }
                }
                break;
            case 'closed':
                return res.status(400).json({
                    error: 'Alumet is closed',
                });
        }
        res.status(200).json({
            message: 'Alumet joined',
        });
    } catch (error) {
        logger.error('Portal authorization failed', error);
        res.status(500).json({
            error: 'Internal Server Error',
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
                error: "You must transfer ownership before leaving this Alumet",
            });
        }
        alumet.participants = alumet.participants.filter(participant => participant.userId !== req.user.id);
        await alumet.save();
        res.status(200).json({
            message: 'Alumet left',
        });
    } catch (error) {
        logger.error('Leave Alumet failed', error);
        res.status(500).json({
            error: 'Internal Server Error',
        });
    }
});

module.exports = router;
