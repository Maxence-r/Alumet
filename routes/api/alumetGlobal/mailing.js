const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'alumet.io@gmail.com',
    pass: 'fkplorygttnzrjyq'
  }
});



function sendMail(receiver, subject, content) { // A faire: différent design de mail: 1 pour la confirmation de compte, 1 pour la demande de réinitialisation de mot de passe
    const mailOptions = {
        from: 'Alumet.io@gmail.com',
        to: receiver,
        subject: subject,
        html: content
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}

exports.sendMail = sendMail;