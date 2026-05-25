const Alumet = require('../../models/alumet');
const { verifyJwt } = require('../../utils/auth');
const logger = require('../../utils/logger');
const { canAccessAlumet, hasRole } = require('../../utils/roles');

const normalizeRequiredRoles = roles => {
    if (!roles) {
        return null;
    }

    return roles.map(role => {
        if (role === 1) return 'admin';
        if (role === 2) return 'member';
        if (role === 3) return 'banned';
        if (role === 4) return 'requesting';
        return role;
    });
};

const applicationAuthentication = roles => async (req, res, next) => {
    try {
        const applicationId = req.params.application || req.params.id || req.params.alumetId;
        const item = await Alumet.findOne({ _id: applicationId });
        if (!item) return res.status(404).json({ error: 'Alumet not found' });
        const redirectUrl = `/alumets/${applicationId}/join`;
        switch (item.security) {
            case 'open':
                break;
            case 'onpassword':
                if (req.cookies.applicationToken) {
                    try {
                        const decoded = verifyJwt(req.cookies.applicationToken);
                        if (decoded.applicationId !== item._id.toString()) {
                            return req.method === 'GET' ? res.redirect(redirectUrl) : res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
                        }
                    } catch (error) {
                        return req.method === 'GET' ? res.redirect(redirectUrl) : res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
                    }
                } else {
                    if (!canAccessAlumet(item, req.user?.id)) {
                        return req.method === 'GET' ? res.redirect(redirectUrl) : res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
                    }
                }
                break;
            case 'closed':
                if (!canAccessAlumet(item, req.user?.id)) {
                    return req.method === 'GET' ? res.redirect(redirectUrl) : res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
                }
                break;
            default:
                break;
        }
        const requiredRoles = normalizeRequiredRoles(roles);
        if (!requiredRoles) return next();
        if (!hasRole(item, req.user?.id, requiredRoles)) {
            return req.method === 'GET' ? res.redirect(redirectUrl) : res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
        }

        return next();
    } catch (error) {
        logger.error('Application authentication failed', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
module.exports = applicationAuthentication;
