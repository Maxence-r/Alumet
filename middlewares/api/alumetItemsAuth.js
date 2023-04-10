const Alumet = require('../../models/alumet');

const alumetItemsAuth = async (req, res, next) => {
    try {
        if (req.params.alumet) {
            const alumet = await Alumet.findOne({ _id: req.params.alumet });
            if (!alumet) return res.status(404).json({ error: 'Alumet not found' });
            req.alumet = alumet;
        }
        if (req.params.wall) {
            console.log(req.params.wall);
        }
        next();
    } catch (err) {
        next(err);
    }
};


module.exports = alumetItemsAuth;