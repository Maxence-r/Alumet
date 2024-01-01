const Request = require('../../models/request');

const rateLimit =
    (requestsPerMinutes, logged) =>
        async (req, res, next) => {
            if (logged) {
                if (!req.connected) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
            }
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const routeIdentifier = req.route.path;
            const now = new Date();
            const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
            const requests = await Request.find({ ip: ip, route: routeIdentifier, createdAt: { $gte: oneMinuteAgo } }).sort({ createdAt: -1 });

            if (requests.length >= requestsPerMinutes) {
                const oldestRequest = requests[requests.length - 1];
                const tryAgainIn = Math.ceil((oldestRequest.createdAt.getTime() + 60 * 1000 - now.getTime()) / 1000);
                return res.status(429).json({ error: `Vous agissez trop rapidement. Veuillez réessayer dans ${tryAgainIn} secondes.` });
            }

            const request = new Request({
                ip: ip,
                route: routeIdentifier,
            });
            await request.save();
            next();
        };

module.exports = rateLimit;