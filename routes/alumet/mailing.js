const nodemailer = require('nodemailer');
const Account = require('../../models/account');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

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
    invitation: 'Alumet Education - Invitation',
    certification: 'Alumet Education - Certification',
};

function createMail(type, name, code) {
    const filePath = path.join(__dirname, `../../views/pages/mails/${type}.html`);
    console.log(filePath);
    let mail = fs.readFileSync(filePath, 'utf8');
    mail = mail.replace(/{{code}}/g, code);
    mail = mail.replace(/{{name}}/g, name)
    return mail;
}

async function sendMail(type, receiver, code) {
    let user = await Account.findOne({ mail: receiver });
    const mailOptions = {
        from: 'alumet.education@gmail.com',
        to: receiver,
        subject: mailsSubjects[type],
        html: createMail(type, user.name + ' ' + user.lastname, code)
    };

    transporter.sendMail(mailOptions, (error, info) => {
        !error ? console.log('Email sent: ' + code) : console.log(error);
    });

}

exports.sendMail = sendMail;
