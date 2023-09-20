const express = require('express');
const router = express.Router();
const Wall = require('../../../models/wall');
const validateObjectId = require('../../../middlewares/modelsValidation/validateObjectId');
const authorize = require('../../../middlewares/authentification/authorize');

router.put('/:alumet', validateObjectId, authorize('alumetAdmins'), (req, res) => {
    if (req.body.wallToEdit) {
        Wall.findById(req.body.wallToEdit)
            .then(wall => {
                if (!wall) {
                    return res.status(404).json({ error: 'Wall not found' });
                }
                wall.title = req.body.title;
                wall.postAuthorized = req.body.postAuthorized;
                wall.save()
                    .then(wall => {
                        global.io.to(req.params.alumet).emit('editWall', wall);
                        res.json(wall);
                    })
                    .catch(error => res.json({ error }));
            })
            .catch(error => res.json({ error }));
    } else {
        Wall.find({ alumet: req.params.alumet })
            .sort({ position: -1 })
            .limit(1)
            .then(wall => {
                if (wall.length === 0) {
                    position = 0;
                } else {
                    position = wall[0].position + 1;
                }
                const wallObject = new Wall({
                    title: req.body.title,
                    postAuthorized: req.body.postAuthorized,
                    position: position,
                    alumetReference: req.params.alumet,
                });

                wallObject
                    .save()
                    .then(wall => {
                        global.io.to(req.params.alumet).emit('addWall', wall);
                        res.json(wall);
                    })
                    .catch(error => res.json({ error }));
            });
    }
});

router.patch('/:alumet/:wall/move', validateObjectId, authorize('alumetAdmins'), (req, res) => {
    const { direction } = req.query;
    const { wall } = req.params;

    Wall.findById(wall)
        .then(wallToMove => {
            if (!wallToMove) {
                return res.status(404).json({ error: 'Wall not found' });
            }

            Wall.find({ alumet: req.params.alumet })
                .sort({ position: 1 })
                .then(walls => {
                    const currentPosition = wallToMove.position;
                    let newPosition;

                    if (direction === 'right') {
                        newPosition = currentPosition + 1;
                    } else if (direction === 'left') {
                        newPosition = currentPosition - 1;
                    } else if (direction === 'first') {
                        newPosition = 0;
                    } else {
                        return res.status(400).json({ error: 'Invalid direction' });
                    }

                    if (newPosition < 0) {
                        newPosition = 0;
                    } else if (newPosition >= walls.length) {
                        newPosition = walls.length - 1;
                    }

                    if (newPosition === currentPosition) {
                        return res.status(200).json({ message: 'Wall position unchanged' });
                    }

                    const otherWall = walls.find(w => w.position === newPosition);
                    if (otherWall) {
                        otherWall.position = currentPosition;
                        otherWall.save();
                    }

                    wallToMove.position = newPosition;
                    wallToMove
                        .save()
                        .then(() => res.status(200).json({ message: 'Wall position updated' }))
                        .catch(error => res.status(500).json({ error }));
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
});

router.delete('/:alumet/:wall', authorize('alumetAdmins'), (req, res) => {
    Wall.findOneAndDelete({ _id: req.params.wall, alumetReference: req.params.alumet })
        .then(wall => {
            if (!wall) {
                return res.status(404).json({ error: 'Wall not found' });
            }
            global.io.to(req.params.alumet).emit('deleteWall', wall._id);
            res.status(200).json({ message: 'Wall deleted' });
        })
        .catch(error => res.json({ error }));
});

module.exports = router;
