const jwt = require('jsonwebtoken');
const Account = require('../models/account');

const { tokenC } = require('../config.json');

const auth = (req, res, next) => {
    jwt.verify(req.cookies.token, tokenC, (err, decoded) => {
        if (err) return res.redirect('/auth/signin');
        Account.findOne({ _id: decoded.userId })
            .then(user => {
                if (!user) return res.redirect('/auth/signin');
                req.user = user;
                next();
            })
            .catch(error => res.json({ error }));
    });
};

module.exports = auth;