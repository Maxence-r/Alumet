const express = require('express');
const router = express.Router();
const path = require('path');
const Account = require('../../../models/account');
const bcrypt = require('bcrypt');
const validateUpdateInfos = require('../../../middlewares/authentification/validateUpdateInfos');
const mongoose = require('mongoose');

router.put('/changepassword', async (req, res) => {
    try {
      const user = await Account.findById(req.user.id);
      if (!user) {
        return res.status(401).json({
          error: 'Utilisateur non trouvé !'
        });
      }
      const validPassword = await bcrypt.compare(req.body.oldPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({
          error: 'Ancien mot de passe incorrect !'
        });
      }
      const hash = await bcrypt.hash(req.body.newPassword, 10);
      user.password = hash;
      if (req.body.newPassword.length < 4) {
          return res.status(400).json({
              error: 'Le mot de passe doit contenir au moins 4 caractères !'
          });
      }
      await user.save();
      res.status(200).json({
        message: 'Mot de passe modifié avec succès !'
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        error: err.message
      });
    }
});

router.put('/updateinfos', validateUpdateInfos, async (req, res) => {
    /* const session = await mongoose.startSession();
    session.startTransaction(); */
    try {
      const { name, lastname, mail } = req.body;
      const user = await Account.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ error: 'Utilisateur non trouvé !' });
      }
      if (name === user.name && lastname === user.lastname && mail === user.mail) {
        return res.status(400).json({ error: 'Vous n\'avez modifié aucune information' });
      }
      user.name = name;
      user.lastname = lastname;
      user.mail = mail;
      await user.save();
      /* await session.commitTransaction(); */
      res.status(200).json({ message: 'Informations modifiées avec succès !' });
    } catch (err) {
      /* await session.abortTransaction(); */
      console.log(err);
      res.status(500).json({ error: err.message });
    } finally {
     /*  session.endSession(); */
    }
 });

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

module.exports = router;