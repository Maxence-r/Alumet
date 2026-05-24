const A2F = require('../../models/a2f');

function authorizeA2F(req, res, next) {
    A2F.findOne({ owner: req.user?.mail || req.body.mail, code: req.body.code })
        .then(a2f => {
            if (!a2f || a2f.code !== req.body.code) return res.status(500).json({ error: 'The code is invalid' });

            a2f.delete();
            next();
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        });
}

module.exports = authorizeA2F;
