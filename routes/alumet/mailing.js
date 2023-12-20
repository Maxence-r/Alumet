const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: `${process.env.GMAIL_EMAIL}`,
        pass: `${process.env.GMAIL_API_KEY}`,
    },
});


const mails = {
    'a2f': {
        subject: 'Code de connexion Alumet',
        content: '<h1>Code de connexion Alumet</h1><p>Votre code de connexion est : </p>',
    },
    'resetpassword': {
        subject: 'Réinitialisation du mot de passe Alumet',
        content: '<h1>Réinitialisation du mot de passe Alumet</h1><p>Votre code de réinitialisation est : </p>',
    },
};

function sendMail(receiver, type, code) {
    const mailOptions = {
        from: 'alumet.education@gmail.com',
        to: receiver,
        subject: mails[type].subject,
        html: mails[type].content + code,
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent to: ' + receiver);
        }
    });
}

exports.sendMail = sendMail;
