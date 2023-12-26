const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const A2F = require('../../models/a2f');
require('dotenv').config();
const Account = require('../../models/account');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: `${process.env.GMAIL_EMAIL}`,
        pass: `${process.env.GMAIL_API_KEY}`,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

const mailsSubjects = {
    a2f: 'Alumet Education - Code de vérification',
    passwordReset: 'Alumet Education - Réinitialisation de mot de passe',
    collaboration: 'Alumet Education - Invitation',
    certification: 'Alumet Education - Certification',
};

async function createMail(type, receiver) {
    const receiverInfos = await Account.findOne({ mail: receiver }, { name: 1, notifications: 1, lastname: 1, _id: 1, mail: 1, accountType: 1, isCertified: 1, isA2FEnabled: 1, badges: 1, username: 1, icon: 1 });

    let receiverName = receiverInfos?.name ? receiverInfos.name : "";
    const filePath = path.join(__dirname, `../../views/pages/mails/${type}.html`);
    let mailContent = fs.readFileSync(filePath, 'utf8');
    switch (type) {
        case 'a2f':
            const a2fCodeDb = await A2F.findOne({ owner: receiver }).sort({ expireAt: -1 });
            let a2fCode = a2fCodeDb?.code;
            if (!a2fCodeDb || new Date(a2fCodeDb.expireAt) < new Date()) {
                a2fCodeDb ? await A2F.deleteOne({ owner: receiver }) : null;
                a2fCode = Math.floor(Math.random() * 1000000)
                    .toString()
                    .padStart(6, '0');
                const now = new Date();
                const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
                const a2f = new A2F({
                    owner: receiver,
                    code: a2fCode,
                    expireAt: fifteenMinutesLater,
                });
                await a2f.save();
            }

            mailContent = mailContent.replace(/{{code}}/g, a2fCode);
            mailContent = mailContent.replace(/{{name}}/g, receiverName);
            return mailContent;
        case 'passwordReset':
        // to do
        case 'collaboration':
            mailContent = mailContent.replace(/{{name}}/g, receiverName);

            if (!receiverInfos?.notifications.includes('invitationC')) {
                return;
            }
            return mailContent;
        case 'certification':
        // to do
    }
}

async function sendMail(type, receiver) {
    const mailContent = await createMail(type, receiver);
    if (!mailContent) return;

    const mailOptions = {
        from: 'alumet.education@gmail.com',
        to: receiver,
        subject: mailsSubjects[type],
        html: mailContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        !error ? console.log('Email sent: ' + info.response) : console.log(error);
    });
}

exports.sendMail = sendMail;
