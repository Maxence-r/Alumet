const jwt = require('jsonwebtoken');
const Account = require('../models/account');
const { tokenC } = require('../config.json');

const authentication = (req, res, next) => {
    const token = req.cookies.token;
    if (!token || token === 'undefined') {
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
                    res.clearCookie('token');
                    return next();
                }
                req.user = user;
                req.logged = true;
                return next();
            })
            .catch(error => res.json({ error }));
    } catch (error) {
        req.logged = false;
        res.clearCookie('token'); 
        return next();
    }
};

module.exports = authentication;
