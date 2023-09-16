const Account = require('../../models/account');
const allowedDomains = [
    'ac-rennes.fr',
    'ac-caen.fr',
    'ac-amiens.fr',
    'ac-lille.fr',
    'ac-reims.fr',
    'ac-nancy-metz.fr',
    'ac-strasbourg.fr',
    'ac-versailles.fr',
    'ac-paris.fr',
    'ac-creteil.fr',
    'ac-nantes.fr',
    'ac-orleans-tours.fr',
    'ac-dijon.fr',
    'ac-besancon.fr',
    'ac-poitiers.fr',
    'ac-clermont.fr',
    'ac-lyon.fr',
    'ac-bordeaux.fr',
    'ac-grenoble.fr',
    'ac-toulouse.fr',
    'ac-montpellier.fr',
    'ac-aix-marseille.fr',
    'ac-nice.fr',
    'ac-corse.fr',
    'ac-martinique.fr',
    'ac-guadeloupe.fr',
    'ac-reunion.fr',
    'ac-guyane.fr',
    'ac-mayotte.fr',
    'easyvista.fr',
];
async function validateAccount(req, res, next) {
    const account = await Account.findOne({ mail: req.body.mail });
    if (account) {
        return res.status(400).json({ error: 'Un compte est déja lié a cette adresse mail' });
    }

    accountTypes = ['student', 'professor'];
    if (!accountTypes.includes(req.body.accountType)) {
        return res.status(400).json({ error: 'Invalid account type' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailDomain = req.body.mail.split('@')[1];

    if (req.body.accountType == 'professor' && (!emailRegex.test(req.body.mail) || !allowedDomains.includes(emailDomain))) {
        return res.status(400).json({ error: 'Seule les adresses mail académique peuve être utilisé pour créer un compte professeur.' });
    }
    next();
}
module.exports = validateAccount;
