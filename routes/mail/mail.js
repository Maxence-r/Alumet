const express = require('express');
const router = express.Router();
const { sendMail } = require('../mail/mailing');
const A2F = require('../../models/a2f');


router.post('/a2f', async (req, res) => {
    const mail = req.user?.mail || req.body.mail;
    if (!mail) {
        return res.status(400).json({ error: 'Mail invalide !' });
    }
    sendMail('a2f', mail);
    res.status(200).json({ a2f: true });
});
async function sendA2FCode(mail, res) {
    try {
        const a2fCodeDb = await A2F.findOne({ owner: mail }).sort({ expireAt: -1 });
        let a2fCode = a2fCodeDb?.code;
        if (!a2fCodeDb || new Date(a2fCodeDb.expireAt) < new Date()) {
            a2fCodeDb ? await A2F.deleteOne({ owner: mail }) : null;
            a2fCode = Math.floor(Math.random() * 1000000)
                .toString()
                .padStart(6, '0');
            const now = new Date();
            const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
            const a2f = new A2F({
                owner: mail,
                code: a2fCode,
                expireAt: fifteenMinutesLater,
            });
            await a2f.save();
            await sendMail('a2f', mail, a2fCode);
        }
        res.json({ a2f: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
}


module.exports = router;
module.exports.sendA2FCode = sendA2FCode;