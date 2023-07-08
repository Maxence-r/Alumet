const express = require('express');
const router = express.Router();
const Wall = require('../../models/wall');
const validateObjectId = require('../../middlewares/validateObjectId');
const alumetItemsAuth = require('../../middlewares/api/alumetItemsAuth');
const alumetAuth = require('../../middlewares/api/alumetAuth');

router.post('/:alumet', validateObjectId, alumetItemsAuth, (req, res) => {
    if (!req.logged || req.alumetObj.owner.toString() !== req.user.id) return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
    Wall.find({ alumet: req.params.alumet }).sort({ position: -1 }).limit(1)
    .then(wall => {
        if (wall.length === 0) {
            position = 0;
        } else {
            position = wall[0].position + 1;
        }
        const wallObject = new Wall({
            title: req.body.title,
            post: req.body.post,
            position: position,
            alumet: req.body.id
        });
        wallObject.save()
        .then(wall => res.json(wall))
        .catch(error => res.json({ error }));
    });
});

router.get('/:alumet', alumetItemsAuth, alumetAuth, validateObjectId, (req, res) => {
    if (!req.logged && !req.auth) return res.status(404).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' })
    if (req.logged && !req.auth && req.alumetObj.owner.toString() !== req.user.id) return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
    if (req.auth && req.alumetObj.id !== req.params.alumet) return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
    Wall.find({ alumet: req.params.alumet }).sort({ position: -1 })
    .then(walls => res.json(walls))
    .catch(error => res.json({ error }));
});

router.delete('/:alumet/:wall', validateObjectId, alumetItemsAuth, (req, res) => {
    if (!req.logged || req.alumetObj.owner.toString() !== req.user.id) return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
    Wall.findOneAndDelete({ _id: req.params.wall })
    .then(wall => res.status(200).json({ message: 'Wall deleted' }))
    .catch(error => res.json({ error }));
});

router.patch('/:alumet/:wall', validateObjectId, alumetItemsAuth, (req, res) => {
    if (!req.logged || req.alumetObj.owner.toString() !== req.user.id) return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
    Wall.findOneAndUpdate({ _id: req.params.wall }, { $set: req.body }, { runValidators: true }) 
    .then(wall => res.status(200).json({ message: 'Wall updated' }))
    .catch(error => res.json({ error }));
});

router.get('/prioritize/:alumet/:wall', validateObjectId, alumetItemsAuth, (req, res) => {
    if (!req.logged || req.alumetObj.owner.toString() !== req.user.id) return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
    Wall.find({ alumet: req.params.alumet }).sort({ position: 1 }).limit(1)
    .then(wall => {
        if (wall.length === 0) {
            position = 0;
        } else {
            position = wall[0].position + -1;
        }
        Wall.findOneAndUpdate({ _id: req.params.wall }, { $set: { position: position } }, { runValidators: true })
        .then(wall => res.status(200).json({ message: 'Wall updated' }))
        .catch(error => res.json({ error }));
    });
});



module.exports = router;