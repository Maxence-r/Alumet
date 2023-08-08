const express = require("express");
const router = express.Router();
const path = require("path");
const Account = require("../../../models/account");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const A2F = require("../../../models/a2f");
const { sendMail } = require("../../api/alumetGlobal/mailing");

router.get("/signin", async (req, res) => {
    if (req.connected) return res.redirect("/dashboard");
    const filePath = path.join(__dirname, "../../../views/pages/authentification/signin.html");
    res.sendFile(filePath);
});

router.get("/u/:id", (req, res) => {
    Account.findOne({ _id: req.params.id })
        .then((user) => {
            if (!user) return res.status(404).json({ error: "Utilisateur non trouvé !" });
            res.status(200).json({
                name: user.name,
                lastname: user.lastname,
                icon: user.icon,
                isCertified: user.isCertified,
                accountType: user.accountType,
            });
        })
        .catch((error) => res.status(500).json({ error }));
});

router.get("/signup", async (req, res) => {
    if (req.connected) return res.redirect("/dashboard");
    const filePath = path.join(__dirname, "../views/pages/signup.html");
    res.sendFile(filePath);
});

router.get("/logout", async (req, res) => {
    res.clearCookie("token");
    res.redirect("/auth/signin");
});

router.get("/info", async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.redirect("/auth/signin");
    const decodedToken = jwt.verify(token, process.env.TOKEN.toString());
    const userId = decodedToken.userId;
    Account.findOne({ _id: userId })
        .then((user) => {
            if (!user) return res.redirect("/auth/signin");
            res.status(200).json({
                lastname: user.lastname,
                name: user.name,
                id: user._id,
                mail: user.mail,
                accountType: user.accountType,
                icon: user.icon,
                isCertified: user.isCertified,
                isA2FEnabled: user.isA2FEnabled,
            });
        })
        .catch((error) => res.status(500).json({ error }));
});

async function sendA2FCode(mail, res) {
    try {
        const existingCode = await A2F.findOne({ owner: mail }).sort({ expireAt: -1 });
        if (existingCode && existingCode.expireAt > new Date()) {
            const remainingTime = Math.ceil((existingCode.expireAt - new Date()) / 1000 / 60);
            res.status(400).json({ a2f: `Un code a déjà été envoyé à cette adresse. Veuillez attendre ${remainingTime} minutes avant d'en demander un nouveau.` });
        } else {
            const code = Math.floor(Math.random() * 1000000)
                .toString()
                .padStart(6, "0");
            const now = new Date();
            const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
            const a2f = new A2F({
                owner: mail,
                code,
                expireAt: fifteenMinutesLater,
            });
            await a2f.save();
            await sendMail(mail, "Code de vérification", `Votre code de vérification est : ${code}`);
            res.json({ a2f: "Code envoyé par mail!" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
}

router.post("/signin", async (req, res) => {
    try {
        const user = await Account.findOne({ mail: req.body.mail });
        if (!user) {
            return res.status(401).json({
                error: "Utilisateur non trouvé !",
            });
        }
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                error: "Mot de passe incorrect !",
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
                    expiresIn: "24h",
                }
            );
            res.cookie("token", token).status(200).json({
                message: "Connexion réussie !",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error,
        });
    }
});

router.post("/signup", async (req, res) => {
    const account = new Account({
        name: req.body.name,
        lastname: req.body.lastname,
        mail: req.body.email,
        password: req.body.password,
    });
    try {
        const hash = await bcrypt.hash(account.password, 10);
        account.password = hash;
        const newAccount = await account.save();
        res.status(201).json(newAccount);
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: err });
    }
});

router.post("/sign-mail", async (req, res) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.mail)) {
        return res.status(400).json({
            error: "Adresse mail invalide !",
        });
    }

    try {
        const mail = await Mail.findOne({ mail: req.body.mail });
        if (mail) {
            await mail.deleteOne({ mail: req.body.mail });
            res.status(200).json({ message: "Mail supprimé !" });
        } else {
            const newMail = new Mail({
                mail: req.body.mail,
                level: req.body.level,
            });
            await newMail.save();
            res.status(201).json({ message: "Mail ajouté !" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

router.post("/authorize", async (req, res) => {
    try {
        const a2f = await A2F.findOne({ owner: req.body.mail, code: req.body.code });
        console.log(a2f);
        if (!a2f || a2f.expireAt < new Date()) {
            res.status(400).json({ error: "Code invalide !" });
        } else {
            const user = await Account.findOne({ mail: a2f.owner });
            const token = jwt.sign(
                {
                    userId: user._id,
                    mail: user.mail,
                },
                process.env.TOKEN.toString(),
                {
                    expiresIn: "24h",
                }
            );
            await A2F.deleteOne({ owner: a2f.owner });
            res.cookie("token", token).status(200).json({
                message: "Connexion réussie !",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

router.post("/a2f", async (req, res) => {
    sendA2FCode(req.user.mail, res);
});

router.post("/resetpassword", async (req, res) => {
    const user = await Account.findOne({ mail: req.body.mail });
    if (!user) {
        return res.status(401).json({
            error: "Utilisateur non trouvé !",
        });
    }
    sendA2FCode(req.body.mail, res);
});

router.post("/resetpassword/confirm", async (req, res) => {
    try {
        const a2f = await A2F.findOne({ owner: req.body.mail, code: req.body.code });
        if (!a2f || a2f.expireAt < new Date()) {
            res.status(400).json({ error: "Code invalide !" });
        } else {
            const user = await Account.findOne({ mail: a2f.owner });
            const hash = await bcrypt.hash(req.body.password, 10);
            user.password = hash;
            await user.save();
            await A2F.deleteOne({ owner: a2f.owner });
            res.status(200).json({ message: "Mot de passe modifié !" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

module.exports = router;
