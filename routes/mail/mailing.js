const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const A2F = require('../../models/a2f');
require('dotenv').config();
const Account = require('../../models/account');

const transporter = nodemailer.createTransport({
    host: 'smtp.email.eu-paris-1.oci.oraclecloud.com',
    port: 587,
    secure: false,
    auth: {
        user: `${process.env.SMTP_USERNAME}`,
        pass: `${process.env.SMTP_PASSWORD}`,
    },
});

const mailsSubjects = {
    a2f: 'Alumet Education - Code de vérification',
    passwordReset: 'Alumet Education - Réinitialisation de mot de passe',
    collaboration: 'Alumet Education - Invitation',
    certification: 'Alumet Education - Certification',
    suspended: 'Alumet Education - Suspension de compte',
    experiment: 'Alumet Education - Nouvelle fonctionnalité expérimentale',
};

const experiments = {
    aiFlashcards:
        "L'intelligence Artificielle est disponible sur votre compte ! Créez rapidement des jeux de flashcards (cartes mémoires) directement à partir de vos cours(pdf) ou de mots-clés spécifiques. Lancez-vous dans la révision en seulement quelques clics ! Pour accéder à cette fonctionnalité, rendez-vous sur un jeu de flashcards existant et sélectionnez l`'option 'IA' dans le menu.",
};

async function createMail(type, receiver) {
    const receiverInfos = await Account.findOne({ mail: receiver });

    let receiverName = receiverInfos?.name ? receiverInfos.name : '';
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
        case 'suspended':
            mailContent = mailContent.replace(/{{name}}/g, receiverName);
            mailContent = mailContent.replace(/{{raison}}/g, receiverInfos.suspended.reason);
            return mailContent;
        case 'experiment':
            mailContent = mailContent.replace(/{{name}}/g, receiverName);
            mailContent = mailContent.replace(/{{raison}}/g, experiments[receiverInfos.experiments[receiverInfos.experiments.length - 1]]);
            return mailContent;
    }
}

async function sendMail(type, receiver) {
    const mailContent = await createMail(type, receiver);
    if (!mailContent) return;

    const mailOptions = {
        from: {
            name: 'Alumet Education',
            address: 'security@alumet.io',
        },
        to: receiver,
        subject: mailsSubjects[type],
        html: mailContent,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        !error ? console.log('Email sent: ' + info.response) : console.log(error);
    });
}

exports.sendMail = sendMail;
