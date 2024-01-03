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

router.get('/:id', validateObjectId, async (req, res) => {
    let alumet = await Alumet.findById(req.params.id);
    if (!alumet) return res.redirect('/404');
    switch (alumet.security) {
        case 'open':
            if (!req.connected && req.query.guest !== 'true') {
                return res.redirect('/portal/' + req.params.id);
            } else if (req.connected && (alumet.participants.every(p => p.userId !== req.user?.id) && alumet.owner !== req.user?.id)) {
                return res.redirect('/portal/' + req.params.id);
            }
            break;
        case 'onpassword':
            if (!req.connected) {
                jwt.verify(req.cookies.applicationToken, process.env.TOKEN, async (err, decoded) => {
                    if (err) {
                        console.error(err);
                        return res.redirect('/portal/' + req.params.id);
                    }
                    if (decoded.applicationId !== alumet._id.toString()) {
                        console.log(decoded.applicationId, alumet._id.toString());
                        return res.redirect('/portal/' + req.params.id);
                    }
                });
                return;
            } else if (req.connected && (alumet.participants.every(p => p.userId !== req.user?.id) && alumet.owner !== req.user?.id)) {
                return res.redirect('/portal/' + req.params.id);
            }
            break;
        case 'closed':
            if ((alumet.participants.every(p => p.userId !== req.user?.id) && alumet.owner !== req.user?.id)) {
                return res.redirect('/portal/' + req.params.id);
            }
            break;
    }


    console.log("ok");
    let filePath;
    if (alumet.type === 'flashcard') {
        filePath = path.join(__dirname, '../../views/pages/applications/flashcards.html');
    } else if (alumet.type === 'alumet') {
        filePath = path.join(__dirname, '../../views/pages/alumet.html');
    } else if (alumet.type === 'mindmap') {
        filePath = path.join(__dirname, '../../views/pages/applications/mindmap.html');
    }

    else {
        filePath = path.join(__dirname, '../../views/pages/404.html');
    }
    res.sendFile(filePath);
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
            const account = await Account.findById(req.user.id, 'id name icon lastname username badges');
            if (account) {
                if (alumet.participants.some(p => p.userId === account._id.toString()) || alumet.owner === account._id) {
                    participant = true;
                }
                if (alumet.owner === account._id.toString() || alumet.participants.some(p => p.userId === account._id.toString() && p.status === 1)) {

                    admin = true;
                }
                user_infos = { id: account._id, name: account.name, icon: account.icon, lastname: account.lastname, username: account.username, badges: account.badges, admin, participant };
            }
        }
        if (!alumet.participants.some(p => p.userId === req.user?.id && p.status === 1) && alumet.owner !== req.user?.id) {
            alumet.code = null;
            alumet.password = null;
        }

        const participantIds = alumet.participants.map(p => p.userId);
        const participantAccounts = await Promise.all(participantIds.map(id => Account.findById(id, 'id name icon lastname username accountType badges')));

        let participants = participantAccounts.map((account, index) => {
            if (account) {
                return { ...account.toObject(), status: alumet.participants[index].status };
            }
        });

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
    console.log(req.params.app)
    req.params.app !== 'flashcard' && req.params.app !== 'mindmap' && req.params.app !== 'alumet' ? res.redirect('/404') : null;
    let filePath = req.connected ? path.join(__dirname, '../../views/pages/new-app.html') : path.join(__dirname, '../../views/pages/404.html');
    res.sendFile(filePath);
});

router.put('/new', rateLimit(3), upload.single('file'), uploadAndSaveToDb('3', ['png', 'jpeg', 'jpg']), addBlurToImage, validateAlumet, async (req, res) => {
    try {
        const existantAlumet = await Alumet.findById(req.body.app);
        let updatedAlumet;
        const alumetDatas = Object.fromEntries(
            Object.entries({
                owner: req.user.id,
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

        updatedAlumet = existantAlumet ? Object.assign(existantAlumet, alumetDatas) : new Alumet(alumetDatas);
        await updatedAlumet.save();

        /* !existantAlumet ? sendInvitations(req, res, updatedAlumet._id) : null; */ //TODO - Make mails work correctly
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
                error: 'L\'application n\'a pas été trouvée',
            });
        }
        if (alumet.owner !== req.user.id) {
            return res.status(403).json({
                error: 'Vous n\'êtes pas autorisé à effectuer cette action',
            });
        }
        if (alumet.owner === req.body.user) { //TODO - add button transfer ownership
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
            p.userId === req.body.user ? p.status = req.body.role : null;
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
                error: 'L\'application n\'a pas été trouvée',
            });
        }
        if (alumet.owner !== req.user.id) {
            return res.status(403).json({
                error: 'Vous n\'êtes pas autorisé à effectuer cette action',
            });
        }
        let owner = alumet.owner;
        alumet.owner = req.body.user;
        alumet.participants = alumet.participants.filter(p => p.userId !== req.body.user);
        alumet.participants.push({ userId: owner, status: 1 });
        await alumet.save();
        res.json({
            message: 'La propriété de l\'application a bien été transférée',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to update alumet',
        });        
    }
});

module.exports = router;
