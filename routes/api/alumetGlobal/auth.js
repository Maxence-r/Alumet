const express = require('express');
const router = express.Router();
const path = require('path');
const Account = require('../../../models/account');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const A2F = require('../../../models/a2f');
const { sendMail } = require('../../api/alumetGlobal/mailing');
const authorizeA2F = require('../../../middlewares/authentification/authorizeA2f');
const validateAccount = require('../../../middlewares/modelsValidation/validateAccount');
const authorize = require('../../../middlewares/authentification/authorize');
const Invitation = require('../../../models/invitation');
const Alumet = require('../../../models/alumet');

router.get('/signin', async (req, res) => {
    if (req.connected) return res.redirect('/dashboard');
    const filePath = path.join(__dirname, '../../../views/pages/authentification/signin.html');
    res.sendFile(filePath);
});

router.get('/signup', async (req, res) => {
    if (req.connected) return res.redirect('/dashboard');
    const filePath = path.join(__dirname, '../../../views/pages/authentification/signup.html');
    res.sendFile(filePath);
});

router.get('/logout', async (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/signin');
});

router.get('/info', authorize(), async (req, res) => {
    const invitations = await Invitation.find({ mail: req.user.mail });
    let invitationsToSend = [];
    for (let invitation of invitations) {
        console.log(invitation.alumet);
        const owner = await Account.findOne({ _id: invitation.owner }, { name: 1, lastname: 1, _id: 1, mail: 1, accountType: 1, isCertified: 1, isA2FEnabled: 1, badges: 1, username: 1, icon: 1 });
        const alumet = await Alumet.findOne({ _id: invitation.alumet }, { _id: 1, title: 1, background: 1 });
        if (!owner || !alumet) {
            continue;
        }
        invitationsToSend.push({ ownerInfos: owner, alumetInfos: alumet });
    }
    const user = await Account.findOne({ _id: req.user.id }, { name: 1, lastname: 1, _id: 1, mail: 1, accountType: 1, isCertified: 1, isA2FEnabled: 1, badges: 1, username: 1, icon: 1 });
    res.json({ user, invitationsToSend });
});
async function sendA2FCode(mail, res) {
    try {
        const existingCode = await A2F.findOne({ owner: mail }).sort({ expireAt: -1 });
        if (existingCode && existingCode.expireAt > new Date()) {
            res.status(400).json({ a2f: true });
        } else {
            const code = Math.floor(Math.random() * 1000000)
                .toString()
                .padStart(6, '0');
            const now = new Date();
            const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
            const a2f = new A2F({
                owner: mail,
                code,
                expireAt: fifteenMinutesLater,
            });
            await a2f.save();
            await sendMail(mail, 'Code de vérification', `Votre code de vérification est : ${code}`);
            res.json({ a2f: true });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
}

router.post('/signin', async (req, res) => {
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
            await sendA2FCode(req.body.mail, res);
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

router.post('/signup', authorizeA2F, validateAccount, async (req, res) => {
    const account = new Account({
        name: req.body.name,
        lastname: req.body.lastname,
        mail: req.body.mail,
        password: req.body.password,
        accountType: req.body.accountType,
        username: req.body.name.substring(0, 22) + req.body.lastname.substring(0, 3),
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
        const a2f = await A2F.findOne({ owner: req.body.mail, code: req.body.code });
        if (!a2f || a2f.expireAt < new Date()) {
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

router.post('/a2f', async (req, res) => {
    if (req.user?.mail || req.body.mail) {
        sendA2FCode(req.user?.mail || req.body.mail, res);
    } else {
        res.status(400).json({ error: "Quelque chose c'est mal passé !" });
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
