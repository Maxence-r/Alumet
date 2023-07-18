const express = require('express');
const router = express.Router();
const path = require('path');
const Account = require('../../../models/account');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();


router.get('/signin', async (req, res) => {
    if (req.connected) return res.redirect('/dashboard');
    const filePath = path.join(__dirname, '../views/pages/signin.html');
    res.sendFile(filePath);
});

router.get('/u/:id', (req, res) => {
    Account.findOne( { _id: req.params.id } )
    .then(user => {
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé !' });
        res.status(200).json({
            name: user.name,
            lastname: user.lastname,
        });
    })
    .catch(error => res.status(500).json({ error }));
});


router.get('/signup', async (req, res) => {
    if (req.connected) return res.redirect('/dashboard');
    const filePath = path.join(__dirname, '../views/pages/signup.html');
    res.sendFile(filePath);
});

router.get('/logout', async (req, res) => {
    res.clearCookie('token').redirect('/');
});

router.get('/info', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/auth/signin');
    const decodedToken = jwt.verify(token, process.env.TOKEN.toString());
    const userId = decodedToken.userId;
    Account.findOne({ _id: userId })
        .then(user => {
            if (!user) return res.redirect('/auth/signin');
            res.status(200).json({
                lastname: user.lastname,
                name: user.name,
                mail: user.mail,
                accountType: user.accountType,
            });
        })
        .catch(error => res.status(500).json({ error }));
});

router.post('/signin', (req, res) => {
    Account.findOne({ $or: [ { mail: req.body.mail }, { lastname: req.body.mail }, { name: req.body.mail } ] })
    .then(user => {
        if (!user) {
            return res.status(401).json({
                error: 'Utilisateur non trouvé ! x00'
            });
        }
     
        bcrypt.compare(req.body.password, user.password)
            .then(valid => {
                if (!valid) {
                    return res.status(400).json({
                        error: 'Mot de passe incorrect !'
                    });
                }
                const token = jwt.sign({
                        userId: user._id,
                        mail: user.mail
                    },
                    process.env.TOKEN.toString(), {
                        expiresIn: '24h'
                    }
                )
                res.cookie('token', token).status(200).json({
                    message: 'Connexion réussie !'
                });
            })
            .catch(error => {
                console.log(error);
                res.status(500).json({
                  error
                });
              });
    })
    .catch(error => {
        console.log(error);
        res.status(500).json({
          error
        });
      });
});


router.post('/signup', async (req, res) => {
    const account = new Account({
        name: req.body.name,
        lastname: req.body.lastname,
        mail: req.body.email,
        password: req.body.password
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

router.post('/sign-mail', async (req, res) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(req.body.mail)) {
    return res.status(400).json({
      error: 'Adresse mail invalide !'
    });
  }

  Mail.findOne({
          mail: req.body.mail
      })
      .then(mail => {
          if (mail) {
              mail.deleteOne({
                      mail: req.body.mail
                  })
                  .then(() => {
                      res.status(200).json({
                          message: 'Mail supprimé !'
                      });
                  })
                  .catch(error => {
                      console.log(error);
                      res.status(500).json({
                          error
                      });
                  });
          } else {
              const newMail = new Mail({
                  mail: req.body.mail,
                  level: req.body.level
              });
              newMail.save()
                  .then(() => {
                      res.status(201).json({
                          message: 'Mail ajouté !'
                      });
                  })
                  .catch(error => {
                      console.log(error);
                      res.status(500).json({
                          error
                      });
                  });

          }

      })
      .catch(error => {
          console.log(error);
          res.status(500).json({
              error
          });
      });
});


module.exports = router;