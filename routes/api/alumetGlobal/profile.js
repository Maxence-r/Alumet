const express = require('express');
const router = express.Router();
const Account = require('../../../models/account');
const bcrypt = require('bcrypt');

const A2f = require('../../../models/a2f');
const { upload, uploadAndSaveToDb } = require('../../../middlewares/utils/uploadHandler');

router.put('/changepassword', async (req, res) => {
    try {
        const user = await Account.findById(req.user.id);
        if (!user) {
            return res.status(401).json({
                error: 'Utilisateur non trouvé !',
            });
        }
        const validPassword = await bcrypt.compare(req.body.oldPassword, user.password);
        if (!validPassword) {
            return res.status(400).json({
                error: 'Ancien mot de passe incorrect !',
            });
        }
        const hash = await bcrypt.hash(req.body.newPassword, 10);
        user.password = hash;
        if (req.body.newPassword.length < 4) {
            return res.status(400).json({
                error: 'Le mot de passe doit contenir au moins 4 caractères !',
            });
        }
        await user.save();
        res.status(200).json({
            message: 'Mot de passe modifié avec succès !',
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message,
        });
    }
});

router.put('/updateinfos', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await Account.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ error: 'Utilisateur non trouvé !' });
        }
        if (username.length < 4 || username.length > 60) {
            return res.status(400).json({ error: "Le nom d'utilisateur est trop court ou trop long" });
        }
        user.username = username;
        await user.save();
        res.status(200).json({ message: 'Informations modifiées avec succès !' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/toggleA2f', async (req, res) => {
    try {
        const user = await Account.findOne({ mail: req.user.mail });
        if (!user) {
            return res.status(401).json({
                error: 'Utilisateur non trouvé !',
            });
        }

        const a2f = await A2f.findOne({ owner: req.user.mail, code: req.body.code });
        if (!a2f || a2f.expireAt < new Date()) {
            return res.status(400).json({ error: 'Code invalide !' });
        }

        user.isA2FEnabled = !user.isA2FEnabled;
        await user.save();
        await A2f.deleteOne({ owner: req.user.mail });

        res.status(200).json({
            message: 'Authentification à deux facteurs modifiée avec succès !',
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message,
        });
    }
});

router.put('/updateicon', upload.single('file'), uploadAndSaveToDb('1', ['png', 'jpeg', 'jpg'], 'icon'), async (req, res) => {
    try {
        const user = await Account.findById(req.user.id);
        user.icon = req.upload._id;
        await user.save();
        res.status(200).json({
            icon: user.icon,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message,
        });
    }
});

module.exports = router;
