const Account = require('../../models/account');
const { verifyJwt } = require('../../utils/auth');

const authentification = async (req, res, next) => {
    const token = req.cookies.token;
    req.connected = false;

    if (!token || token === 'undefined') {
        return next();
    }

    try {
        const decodedToken = verifyJwt(token);
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
