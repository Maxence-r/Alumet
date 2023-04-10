const Alumet = require('../../models/alumet');

const paramValidator = (req, res, next) => {
    if (!req.params.alumet) return next();
    if (!req.params.wall) return next();
    if (!req.params.post) return next();
    Alumet.findOne({
        _id: req.params.alumet
    }).then(alumet => {
        if (!alumet) return res.status(404).json({
            error: 'Alumet not found'
        });
        if (!req.auth && !req.logged) return res.status(401).json({
            error: 'Unauthorized'
        });
        if (req.auth && req.alumet.id != req.params.id) return res.status(401).json({
            error: 'Unauthorized'
        });
        console.log(req.user.id, alumet.owner.toString());
        if (req.logged && alumet.owner.toString() !== req.user.id) return res.status(401).json({
            error: 'Unauthorized'
        });
        return next();
    });
    
}

module.exports = paramValidator;