const Request = require('../../models/request');
const logger = require('../../utils/logger');

const rateLimit =
    (requestsPerMinutes, logged) =>
        async (req, res, next) => {
            if (logged) {
                if (!req.connected) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
            }
            const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.connection.remoteAddress;
            const routeIdentifier = `${req.method}:${req.baseUrl}${req.route?.path || req.path}`;
            const now = new Date();
            const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
            try {
                const requests = await Request.find({ ip, route: routeIdentifier, createdAt: { $gte: oneMinuteAgo } }).sort({ createdAt: -1 }).limit(requestsPerMinutes);

                if (requests.length >= requestsPerMinutes) {
                    const oldestRequest = requests[requests.length - 1];
                    const tryAgainIn = Math.ceil((oldestRequest.createdAt.getTime() + 60 * 1000 - now.getTime()) / 1000);
                    return res.status(429).json({ error: `You are acting too quickly. Please try again in ${tryAgainIn} seconds.` });
                }

                await Request.create({
                    ip,
                    route: routeIdentifier,
                });

                return next();
            } catch (error) {
                logger.warn('Rate limit check failed; allowing request through.', error.message);
                return next();
            }
        };

module.exports = rateLimit;
