const jwt = require('jsonwebtoken');
const Account = require('../../models/account');
require('dotenv').config();

const authentification = async (req, res, next) => {
    const token = req.cookies.token;
    req.connected = false;

    if (!token || token === 'undefined') {
        return next();
    }

    try {
        const decodedToken = jwt.verify(token, process.env.TOKEN.toString());
        const userId = decodedToken.userId;
        const user = await Account.findOne({ _id: userId });
        if (!user || user.suspended.reason) {
            res.clearCookie('token');
            return next();
        }

        req.user = user;
        req.connected = true;
        return next();
    } catch (error) {
        res.clearCookie('token');
        return next();
    }
};

module.exports = authentification;
