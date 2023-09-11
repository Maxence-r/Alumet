const Account = require('../../models/account');
const Alumet = require('../../models/alumet');

async function validateAlumet(req, res, next) {
    try {
        let responseSent = false;
        if (req.body.collaborators) {
            const collaborators = JSON.parse(req.body.collaborators);
            for (const collaborator of collaborators) {
                const account = await Account.findById(collaborator);
                if (!account || (account.accountType !== 'professor' && account.accountType !== 'staff')) {
                    responseSent = true;
                    return res.status(400).json({ error: 'An error occurred while adding a collaborator.' });
                }
            }
        }
        if (req.body.alumet) {
            Alumet.findById(req.body.alumet, (err, alumet) => {
                if (err || !alumet) {
                    responseSent = true;
                    return res.status(400).json({ error: 'An error occurred while validating the alumet.' });
                }
                if (alumet.owner !== req.user.id) {
                    responseSent = true;
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                if (!responseSent) {
                    next();
                }
            });
        } else {
            if (!responseSent) {
                next();
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(400).json({ error: 'An error occurred while validating the alumet.' });
    }
}
module.exports = validateAlumet;
