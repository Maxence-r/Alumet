const Alumet = require('../../models/alumet');
const jwt = require('jsonwebtoken');

const applicationAuthentication = status => async (req, res, next) => {
    item = await Alumet.findOne({ _id: req.params.application });
    if (!item) return res.status(404).json({ error: 'Alumet not found' });
    switch (item.security) {
        case 'open':
            break;
        case 'onpassword':
            if (req.cookies.applicationToken) {
                try {
                    const decoded = jwt.verify(req.cookies.applicationToken, process.env.TOKEN);
                    if (decoded.applicationId !== item._id.toString()) {
                        return res.status(403).json({ error: 'Forbidden' });
                    }
                } catch (error) {
                    console.error('JWT verification error:', error);
                }
            } else {
                if (!(item.participants.some(p => (p.userId === req.user?.id && p.status === 1) || p.status === 2) || item.owner === req.user?.id)) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
            }
            break;
        case 'closed':
            if (!(item.participants.some(p => (p.userId === req.user?.id && p.status === 1) || p.status === 2) || item.owner === req.user?.id)) {
                return res.status(403).json({ error: 'Forbidden x001' });
            }
            break;
        default:
            break;
    }
    if (!status) return next();
    const isForbidden = !status.some(s => item.participants.some(p => p.userId === req.user?.id && p.status === s)) && item.owner !== req.user?.id;
    if (isForbidden) {
        return res.status(403).json({ error: 'Forbidden x002' });
    }

    next();
};

module.exports = applicationAuthentication;
