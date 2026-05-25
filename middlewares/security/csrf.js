const { doubleCsrf } = require('csrf-csrf');
const config = require('../../config/env');

const csrfSecret = () => config.auth.tokenSecret || 'development-csrf-secret';

const {
    doubleCsrfProtection,
    generateCsrfToken,
} = doubleCsrf({
    getSecret: csrfSecret,
    getSessionIdentifier: req => req.cookies.token || req.ip || 'anonymous',
    cookieName: 'alumet.csrf',
    cookieOptions: {
        httpOnly: true,
        sameSite: 'Lax',
        secure: config.auth.cookieSecure,
        path: '/',
    },
    getCsrfTokenFromRequest: req => req.headers['x-csrf-token'],
    errorConfig: {
        statusCode: 403,
        message: 'Invalid CSRF token.',
        code: 'EBADCSRFTOKEN',
    },
    skipCsrfProtection: req => req.originalUrl === '/api/billing/webhook',
});

const csrfTokenRoute = (req, res) => {
    const token = generateCsrfToken(req, res, { overwrite: true });
    res.json({ csrfToken: token });
};

module.exports = { csrfProtection: doubleCsrfProtection, csrfTokenRoute };
