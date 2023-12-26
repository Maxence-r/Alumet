const Alumet = require('../../models/alumet');

async function validateAlumet(req, res, next) {
    try {
        let responseSent = false;
        if ((req.body.title && req.body.title.length > 150) || req.body.title.length < 2) {
            responseSent = true;
            return res.status(400).json({ error: 'Le titre est trop long ou trop court' });
        }
        if (req.body.description && req.body.description.length > 2000) {
            responseSent = true;
            return res.status(400).json({ error: 'La description est trop longue' });
        }
        if (req.body.alumet) {
            Alumet.findById(req.body.alumet, (err, alumet) => {
                if (err || !alumet) {
                    responseSent = true;
                    return res.status(400).json({ error: 'An error occurred while validating the alumet.' });
                }
                if (alumet.owner !== req.user.id && alumet.participants.some(p => p.userId === req.user.id && p.status !== 1)) {
                    responseSent = true;
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                !responseSent ? next() : null;
            });
        } else {
            !responseSent ? next() : null;
        }
    } catch (error) {
        console.log(error);
        return res.status(400).json({ error: 'An error occurred while validating the alumet.' });
    }
}
module.exports = validateAlumet;
