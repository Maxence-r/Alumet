const Alumet = require('../../models/alumet');
const FlashCardSet = require('../../models/flashcardSet');

const authorize = (itemType, type) => {
    return async (req, res, next) => {
        let item = null;

        if (itemType === 'alumet') {
            item = await Alumet.findOne({ _id: req.params.alumet });
        } else if (itemType === 'flashcard') {
            console.log(req.params);
            item = await FlashCardSet.findOne({ _id: req.params.flashcard || req.params.flashcardSet});
        }

        if (type === 'alumetPrivate') {
            if (item.private && (!req.connected || (item.owner !== req.user.id && !item.collaborators.includes(req.user._id) && !item.participants.includes(req.user._id)))) {
                return res.status(401).json({ error: 'Unauthorized x006' });
            }
            return next();
        }

        if (!req.connected) return res.status(401).json({ error: 'Unauthorized x001' });
        let error;
        if (type === 'professor' && req.user.accountType !== 'professor' && req.user.accountType !== 'staff') error = 'Cette action ne peux pas être réaliser par votre compte (compte ELEVE)';
        else if (type === 'student' && req.user.accountType !== 'student' && req.user.accountType !== 'staff') error = 'Unauthorized x002';
        else if (type === 'staff' && req.user.accountType !== 'staff') error = 'Unauthorized x004';
        else if (type === 'itemAdmins' && (!item || (item.owner !== req.user.id && !item.collaborators.includes(req.user._id)))) error = 'Unauthorized x005';
        else if (type === 'itemParticipants' && (!item || (item.owner !== req.user.id && !item.collaborators.includes(req.user._id) && !item.participants.includes(req.user._id)))) error = 'Unauthorized x006';

        if (error) return res.status(401).json({ error });
        next();
    };
};

module.exports = authorize;
