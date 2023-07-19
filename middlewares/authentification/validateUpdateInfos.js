const Account = require('../../models/account');

async function validateUpdateInfos(req, res, next) {
  const { name, lastname, mail } = req.body;
  if (!name || !lastname || !mail) {
    return res.status(400).json({ error: 'Veuillez remplir tous les champs !' });
  }
  if (!isValidEmail(mail)) {
    return res.status(400).json({ error: 'Veuillez entrer une adresse mail valide !' });
  }
  if (mail.length > 50) {
    return res.status(400).json({ error: 'Veuillez entrer une adresse mail valide !' });
  }
  if (name.length < 3 || lastname.length < 3) {
    return res.status(400).json({ error: 'Veuillez entrer un nom et un prénom valide !' });
  }
  if (name.length > 20 || lastname.length > 20) {
    return res.status(400).json({ error: 'Veuillez entrer un nom et un prénom valide !' });
  }
  try {
    const existingAccount = await Account.findOne({ mail, _id: { $ne: req.user.id } });
    if (existingAccount) {
      return res.status(400).json({ error: 'Un compte avec cette adresse mail existe déjà !' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Une erreur est survenue lors de la vérification de l\'adresse mail.' });
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = validateUpdateInfos;