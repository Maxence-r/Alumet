const express = require('express');
const router = express.Router();
const Wall = require('../../models/wall');
const validateObjectId = require('../../middlewares/validateObjectId');
const paramValidator = require('../../middlewares/api/paramValidator');

router.post('/', validateObjectId, (req, res) => {
    Wall.find({ alumet: req.body.id }).sort({ position: -1 }).limit(1)
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

router.get('/:alumet', paramValidator, validateObjectId, (req, res) => {
    Wall.find({ alumet: req.params.alumet }).sort({ position: -1 })
    .then(walls => res.json(walls))
    .catch(error => res.json({ error }));
});

router.delete('/:alumet/:id', validateObjectId, (req, res) => {
    Wall.findOneAndDelete({ _id: req.params.id })
    .then(wall => res.status(200).json({ message: 'Wall deleted' }))
    .catch(error => res.json({ error }));
});

router.patch('/:alumet/:id', validateObjectId, (req, res) => {
    Wall.findOneAndUpdate({ _id: req.params.id }, { $set: req.body }) 
    .then(wall => res.status(200).json({ message: 'Wall updated' }))
    .catch(error => res.json({ error }));
});

module.exports = router;