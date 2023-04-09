const Alumet = require('../../models/alumet');

const accountAuth = (req, res, next) => {
    Alumet.findOne({ _id: req.params.alumet})
    .then(alumet => {
        if (!alumet) return res.json({ error: 'Alumet not found' });
        if (req.logged && req.user._id == alumet.owner) {
            return next();
        } else {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    })
    .catch(error => res.json({ error }));
}

module.exports = accountAuth;