const Alumet = require('../../models/alumet');
const { verifyJwt } = require('../../utils/auth');
const logger = require('../../utils/logger');

const applicationAuthentication = status => async (req, res, next) => {
    try {
        const item = await Alumet.findOne({ _id: req.params.application });
        if (!item) return res.status(404).json({ error: 'Alumet not found' });
        switch (item.security) {
            case 'open':
                break;
            case 'onpassword':
                if (req.cookies.applicationToken) {
                    try {
                        const decoded = verifyJwt(req.cookies.applicationToken);
                        if (decoded.applicationId !== item._id.toString()) {
                            return req.method === 'GET' ? res.redirect(`/portal/${req.params.application}`) : res.status(403).json({ error: 'Forbidden' });
                        }
                    } catch (error) {
                        return req.method === 'GET' ? res.redirect(`/portal/${req.params.application}`) : res.status(403).json({ error: 'Forbidden' });
                    }
                } else {
                    if (!(item.participants.some(p => p.userId === req.user?.id && (p.status === 1 || p.status === 2)) || item.owner === req.user?.id)) {
                        return req.method === 'GET' ? res.redirect(`/portal/${req.params.application}`) : res.status(403).json({ error: 'Forbidden x001' });
                    }
                }
                break;
            case 'closed':
                if (!(item.participants.some(p => p.userId === req.user?.id && (p.status === 1 || p.status === 2)) || item.owner === req.user?.id)) {
                    return req.method === 'GET' ? res.redirect(`/portal/${req.params.application}`) : res.status(403).json({ error: 'Forbidden x001' });
                }
                break;
            default:
                break;
        }
        if (!status) return next();
        const isForbidden = !status.some(s => item.participants.some(p => p.userId === req.user?.id && p.status === s)) && item.owner !== req.user?.id;
        if (isForbidden) {
            return req.method === 'GET' ? res.redirect(`/portal/${req.params.application}`) : res.status(403).json({ error: 'Forbidden x002' });
        }

        return next();
    } catch (error) {
        logger.error('Application authentication failed', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
module.exports = applicationAuthentication;
