const jwt = require('jsonwebtoken');
const Account = require('../models/account');
const { tokenC } = require('../config.json');
const checkLogin = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return req.logged = false, next();
    const decodedToken = jwt.verify(token, tokenC);
    const userId = decodedToken.userId;
    Account.findOne({ _id: userId })
        .then(user => {
            if (!user) {
                req.logged = false;
                next();
            }
            req.user = user;
            req.logged = true;
            next();
        })
        .catch(error => res.json({ error }));
};


module.exports = checkLogin;