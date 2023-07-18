const Alumet = require('../models/alumet');
const Wall = require('../models/wall');

const alumetItemsAuth = async (req, res, next) => {
    try {
        if (req.params.alumet) {
            const alumet = await Alumet.findOne({ _id: req.params.alumet });
            if (!alumet) return res.status(404).json({ error: 'Alumet not found' });
            req.alumetObj = alumet;
        }
        if (req.params.wall) {
            const wall = await Wall.findOne({ _id: req.params.wall });
            if (!wall) return res.status(404).json({ error: 'Wall not found' });
            req.wall = wall;
        }
        next();
    } catch (err) {
        next(err);
    } 
    return null;
};



module.exports = alumetItemsAuth;