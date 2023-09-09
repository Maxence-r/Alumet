const Alumet = require('../../models/alumet');

const authorize = type => {
    return async (req, res, next) => {
        /* 
        Professor: Check if the user is connected and if his account type is professor or staff
        Student: Check if the user is connected and if his account type is student or staff
        All: Check if the user is connected
        Staff: Check if the user is connected and if his account type is staff
        AlumetAdmins: Check if the user is connected and if his account type is staff or if he is the owner of the alumet
        */
        const alumet = await Alumet.findOne({ _id: req.params.alumet });
        if (type === 'alumetPrivate') {
            if (alumet.private && (!req.connected || (alumet.owner !== req.user.id && !alumet.collaborators.includes(req.user._id) && !alumet.participants.includes(req.user._id)))) {
                return res.status(401).json({ error: 'Unauthorized x006' });
            }
            return next();
        }

        if (!req.connected) return res.status(401).json({ error: 'Unauthorized x001' });
        let error;

        if (type === 'professor' && req.user.accountType !== 'professor' && req.user.accountType !== 'staff') error = 'Cette action ne peux pas être réaliser par votre compte (compte ELEVE)';
        else if (type === 'student' && req.user.accountType !== 'student' && req.user.accountType !== 'staff') error = 'Unauthorized x002';
        else if (type === 'staff' && req.user.accountType !== 'staff') error = 'Unauthorized x004';
        else if (type === 'alumetAdmins' && (!alumet || (alumet.owner !== req.user.id && !alumet.collaborators.includes(req.user._id)))) error = 'Unauthorized x005';
        else if (type === 'alumetParticipants' && (!alumet || (alumet.owner !== req.user.id && !alumet.collaborators.includes(req.user._id) && !alumet.participants.includes(req.user._id)))) error = 'Unauthorized x006';

        if (error) return res.status(401).json({ error });
        next();
    };
};

module.exports = authorize;
