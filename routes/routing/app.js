const express = require('express');
const router = express.Router();
const path = require('path');
const Alumet = require('../../models/alumet');
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');
const validateAlumet = require('../../middlewares/modelsValidation/validateAlumet');
const { upload, uploadAndSaveToDb } = require('../../middlewares/utils/uploadHandler');
const sendInvitations = require('../../middlewares/mailManager/sendInvitations');
const addBlurToImage = require('../../middlewares/utils/blur');
const authorizeA2F = require('../../middlewares/authentification/authorizeA2f');
const jwt = require('jsonwebtoken');
const rateLimit = require('../../middlewares/authentification/rateLimit');
const Account = require('../../models/account');
const applicationAuthentication = require('../../middlewares/authentification/applicationAuthentication');

router.get('/:application', validateObjectId, applicationAuthentication(), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.application);
        if (!alumet) {
            return res.redirect('/404');
        }

        const isParticipantOrOwner = (alumet, user) => {
            return alumet.participants.some(p => p.userId === user?.id) || alumet.owner === user?.id;
        };

        const filePath = path.join(
            __dirname,
            '../../views/pages/',
            {
                flashcard: 'applications/flashcards.html',
                alumet: 'alumet.html',
                mindmap: 'applications/mindmap.html',
            }[alumet.type] || '404.html'
        );

        res.sendFile(filePath);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/info/:application', validateObjectId, rateLimit(30), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.application);
        if (!alumet) {
            return res.status(404).json({
                error: 'Alumet not found',
            });
        }

        alumet.lastUsage = Date.now();
        await alumet.save();

        let participant = false;
        let user_infos = {};
        let admin = false;
        if (req.user) {
            const account = await Account.findById(req.user.id, 'id name icon lastname username badges experiments');
            if (account) {
                if (alumet.participants.some(p => p.userId === req.user?.id && (p.status === 1 || p.status === 2)) || alumet.owner === req.user?.id) {
                    participant = true;
                }
                if (alumet.owner === account._id.toString() || alumet.participants.some(p => p.userId === account._id.toString() && p.status === 1)) {
                    admin = true;
                }
                user_infos = { id: account._id, name: account.name, icon: account.icon, lastname: account.lastname, username: account.username, badges: account.badges, experiments: account.experiments, admin, participant };
            }
        }
        if (!alumet.participants.some(p => p.userId === req.user?.id && p.status === 1) && alumet.owner !== req.user?.id) {
            alumet.code = null;
            alumet.password = null;
        }

        const participantIds = alumet.participants.map(p => p.userId);
        const participantAccounts = await Promise.all(participantIds.map(id => Account.findById(id, 'id name icon lastname username accountType badges')));

        let participants = participantAccounts
            .map((account, index) => {
                if (account) {
                    return { ...account.toObject(), status: alumet.participants[index].status };
                }
            })
            .filter(Boolean);

        const ownerAccount = await Account.findById(alumet.owner, 'id name icon lastname username accountType badges');
        participants.push({ ...ownerAccount.toObject(), status: 0 });

        res.json({
            infos: { ...alumet.toObject(), participant, participants },
            user_infos,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to get alumet',
        });
    }
});

router.get('/setup/:app', async (req, res) => {
    req.params.app !== 'flashcard' && req.params.app !== 'mindmap' && req.params.app !== 'alumet' ? res.redirect('/dashboard') : null;
    let filePath = path.join(__dirname, '../../views/pages/new-app.html');
    if (req.connected) {
        res.sendFile(filePath);
    } else {
        res.redirect('/auth/signin');
    }
});

router.put('/new', rateLimit(3), upload.single('file'), uploadAndSaveToDb('3', ['png', 'jpeg', 'jpg']), addBlurToImage, validateAlumet, async (req, res) => {
    try {
        const existantAlumet = await Alumet.findById(req.body.app);
        let updatedAlumet;
        const alumetDatas = Object.fromEntries(
            Object.entries({
                title: req.body.title,
                description: req.body.description,
                background: req.upload ? req.upload._id : undefined,
                private: req.body.private,
                swiftchat: req.body.chat,
                lastUsage: Date.now(),
                type: req.body.type,
                subject: req.body.subject,
                discovery: req.body.discovery,
                security: req.body.security,
                password: req.body.password,
            }).filter(([_, value]) => value !== undefined)
        );

        if (existantAlumet) {
            updatedAlumet = Object.assign(existantAlumet, alumetDatas);
        } else {
            updatedAlumet = new Alumet({
                ...alumetDatas,
                owner: req.user.id,
            });
        }

        await updatedAlumet.save();

        res.json({ alumet: updatedAlumet });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/delete/:id', validateObjectId, rateLimit(30), authorizeA2F, async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.id);
        if (!alumet) {
            return res.status(404).json({
                error: 'Alumet not found',
            });
        }
        if (alumet.owner !== req.user.id) {
            return res.status(403).json({
                error: 'Unauthorized',
            });
        }
        await alumet.remove();
        res.json({
            message: 'Alumet deleted',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to delete alumet',
        });
    }
});

router.put('/collaborators/:app', rateLimit(4), async (req, res) => {
    sendInvitations(req, res, req.params.app);
    res.json({ success: true });
});

router.put('/role/:app', rateLimit(60), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.app);
        if (!alumet) {
            return res.status(404).json({
                error: "L'application n'a pas été trouvée",
            });
        }
        if (alumet.owner !== req.user.id) {
            return res.status(403).json({
                error: "Vous n'êtes pas autorisé à effectuer cette action",
            });
        }
        if (alumet.owner === req.body.user) {
            //TODO - add button transfer ownership
            return res.status(403).json({
                error: 'Vous ne pouvez pas vous retirer le rôle de propriétaire',
            });
        }
        if (req.body.role == 0) {
            return res.json({
                userId: req.body.user,
                alert: 'Vous ne pouvez pas retirer le rôle de propriétaire',
            });
        }
        alumet.participants = alumet.participants.map(p => {
            p.userId === req.body.user ? (p.status = req.body.role) : null;
            return p;
        });
        await alumet.save();
        res.json({
            message: 'Le rôle a bien été modifié',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to update alumet',
        });
    }
});

router.put('/giveOwnership/:app', rateLimit(60), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.app);
        if (!alumet) {
            return res.status(404).json({
                error: "L'application n'a pas été trouvée",
            });
        }
        if (alumet.owner !== req.user.id) {
            return res.status(403).json({
                error: "Vous n'êtes pas autorisé à effectuer cette action",
            });
        }
        let owner = alumet.owner;
        alumet.owner = req.body.user;
        alumet.participants = alumet.participants.filter(p => p.userId !== req.body.user);
        alumet.participants.push({ userId: owner, status: 1 });
        await alumet.save();
        res.json({
            message: "La propriété de l'application a bien été transférée",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to update alumet',
        });
    }
});

module.exports = router;
