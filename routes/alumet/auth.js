const express = require('express');
const router = express.Router();
const path = require('path');
const Account = require('../../models/account');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const A2F = require('../../models/a2f');
const { sendA2FCode } = require('../../routes/mail/mail');
const authorizeA2F = require('../../middlewares/authentification/authorizeA2f');
const validateAccount = require('../../middlewares/modelsValidation/validateAccount');
const authorize = require('../../middlewares/authentification/authorize');
const Invitation = require('../../models/invitation');
const Alumet = require('../../models/alumet');
const { sendMail } = require('../mail/mailing');
const rateLimit = require('../../middlewares/authentification/rateLimit');



router.get('/signin', async (req, res) => {
    if (req.connected) return res.redirect('/dashboard');
    const filePath = path.join(__dirname, '../../views/pages/authentification/signin.html');
    res.sendFile(filePath);
});

router.get('/signup', async (req, res) => {
    if (req.connected) return res.redirect('/dashboard');
    const filePath = path.join(__dirname, '../../views/pages/authentification/signup.html');
    res.sendFile(filePath);
});

router.get('/logout', async (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/signin');
});

router.get('/info', authorize(), async (req, res) => {
    const invitations = await Invitation.find({ to: req.user.id }).sort({ createdAt: -1 });
    let invitationsToSend = [];
    for (let invitation of invitations) {
        const owner = await Account.findOne({ _id: invitation.owner }, { name: 1, lastname: 1, _id: 1, mail: 1, accountType: 1, isCertified: 1, isA2FEnabled: 1, badges: 1, username: 1, icon: 1 });
        let referenceDetails = await Alumet.findById(invitation.reference).select('_id title background');

        if (!owner || !referenceDetails) {
            continue;
        }
        invitationsToSend.push({ ownerInfos: owner, referenceInfos: referenceDetails, invitation: invitation });
    }
    const user = await Account.findOne({ _id: req.user.id }, { name: 1, lastname: 1, _id: 1, mail: 1, accountType: 1, isCertified: 1, isA2FEnabled: 1, badges: 1, username: 1, icon: 1, notifications: 1 });
    res.json({ user, invitationsToSend });
});

router.post('/signin', rateLimit(3), async (req, res) => {
    try {
        const user = await Account.findOne({ mail: req.body.mail });
        if (!user) {
            return res.status(401).json({
                error: 'Utilisateur non trouvé !',
            });
        }
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                error: 'Mot de passe incorrect !',
            });
        }
        if (user.isA2FEnabled) {
            await sendMail('a2f', user.mail);
            res.status(200).json({
                a2f: true,
            });
        } else {
            const token = jwt.sign(
                {
                    userId: user._id,
                    mail: user.mail,
                },
                process.env.TOKEN.toString(),
                {
                    expiresIn: '24h',
                }
            );
            res.cookie('token', token).status(200).json({
                message: 'Connexion réussie !',
            });
        }
    } catch (error) {
        console.log('error: ', error);
        res.status(500).json({
            error,
        });
    }
});

router.post('/signup', rateLimit(1), authorizeA2F, validateAccount, async (req, res) => {
    const account = new Account({
        name: req.body.name,
        lastname: req.body.lastname,
        mail: req.body.mail,
        password: req.body.password,
        accountType: req.body.accountType,
        username: req.body.name.substring(0, 1) + req.body.lastname.substring(0, 22),
    });
    try {
        const hash = await bcrypt.hash(account.password, 10);
        account.password = hash;
        const newAccount = await account.save();
        delete newAccount.password;
        res.status(201).json(newAccount);
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: err });
    }
});

router.post('/authorize', async (req, res) => {
    try {
        console.log(req.body)
        const a2f = await A2F.findOne({ owner: req.body.mail, code: req.body.code });
        if (!a2f || a2f.expireAt > new Date()) {
            res.status(400).json({ error: 'Code invalide !' });
        } else {
            const user = await Account.findOne({ mail: a2f.owner });
            const token = jwt.sign(
                {
                    userId: user._id,
                    mail: user.mail,
                },
                process.env.TOKEN.toString(),
                {
                    expiresIn: '24h',
                }
            );
            await A2F.deleteOne({ owner: a2f.owner });
            res.cookie('token', token).status(200).json({
                message: 'Connexion réussie !',
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});





router.post('/resetpassword', authorizeA2F, async (req, res) => {
    try {
        if (req.body.password.length < 6) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères !' });
        }
        const user = await Account.findOne({ mail: req.body.mail });
        if (!user) {
            return res.status(400).json({ error: "L'utilisateur n'existe pas !" });
        }
        const hash = await bcrypt.hash(req.body.password, 10);
        user.password = hash;
        await user.save();
        await A2F.deleteOne({ owner: req.body.mail });
        res.status(200).json({ message: 'Mot de passe modifié !' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

module.exports = router;
