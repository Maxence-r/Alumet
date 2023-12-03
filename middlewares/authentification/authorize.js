const Alumet = require('../../models/alumet');

const authorize = (itemType, type) => {
    return async (req, res, next) => {

        item = await Alumet.findOne({ _id: req.params.alumet });

        if (type === 'alumetPrivate') {
            if (item.private && (!req.connected || (item.owner !== req.user.id && !item.participants.some(p => p.userId === req.user.id)))) {
                return res.status(401).json({ error: 'Unauthorized x006' });
            }
            return next();
        }

        if (!req.connected) return res.redirect('/auth/signin');
        let error;
        if (type === 'professor' && req.user.accountType !== 'professor' && req.user.accountType !== 'staff') error = 'Cette action ne peux pas être réaliser par votre compte (compte ELEVE)';
        else if (type === 'student' && req.user.accountType !== 'student' && req.user.accountType !== 'staff') error = 'Unauthorized x002';
        else if (type === 'staff' && req.user.accountType !== 'staff') error = 'Unauthorized x004';
        else if (type === 'itemAdmins' && (!item || (item.owner !== req.user.id && !item.participants.some(p => p.userId === req.user.id && p.status === 1)))) error = 'Unauthorized x005';
        else if (type === 'itemParticipants' && (!item || (item.owner !== req.user.id && !item.participants.some(p => p.userId === req.user.id)))) error = 'Unauthorized x006';

        if (error) return res.status(401).json({ error });
        next();
    };
};

module.exports = authorize;
