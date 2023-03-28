const jwt = require('jsonwebtoken');
const Account = require('../models/account');
const { tokenC } = require('../config.json');

const checkLogin = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        req.logged = false;
        return next();
    }
    try {
        const decodedToken = jwt.verify(token, tokenC);
        const userId = decodedToken.userId;
        Account.findOne({ _id: userId })
            .then(user => {
                if (!user) {
                    req.logged = false;
                    res.clearCookie('token'); // <-- delete the token
                    return next();
                }
                req.user = user;
                req.logged = true;
                return next();
            })
            .catch(error => res.json({ error }));
    } catch (error) {
        req.logged = false;
        res.clearCookie('token'); // <-- delete the token
        return next();
    }
};

module.exports = checkLogin;
