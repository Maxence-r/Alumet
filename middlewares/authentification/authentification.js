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

        if (!user) {
            res.clearCookie('token');
            return next();
        }

        req.user = user;
        // console.log('User connected: ' + user.name + ' ' + user.lastname);
        req.connected = true;
        return next();
    } catch (error) {
        res.clearCookie('token');
        return next();
    }
};

module.exports = authentification;
