const jwt = require('jsonwebtoken');
const config = require('../config/env');

const authCookieOptions = maxAge => ({
    maxAge,
    httpOnly: true,
    sameSite: 'Lax',
    secure: config.auth.cookieSecure,
});

const requireTokenSecret = () => {
    if (!config.auth.tokenSecret) {
        const error = new Error('TOKEN is not configured');
        error.status = 500;
        throw error;
    }

    return config.auth.tokenSecret;
};

const signJwt = (payload, options) => jwt.sign(payload, requireTokenSecret(), options);

const verifyJwt = token => jwt.verify(token, requireTokenSecret());

module.exports = { authCookieOptions, requireTokenSecret, signJwt, verifyJwt };
