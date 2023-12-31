const express = require('express');
const router = express.Router();
const Wall = require('../../../models/wall');
const validateObjectId = require('../../../middlewares/modelsValidation/validateObjectId');
const authorize = require('../../../middlewares/authentification/authorize');
const applicationAuthentication = require('../../../middlewares/authentification/applicationAuthentication');
const rateLimit = require('../../../middlewares/authentification/rateLimit');

router.put('/:application', validateObjectId, applicationAuthentication([1]), rateLimit(30), (req, res) => {
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
                        global.io.to(req.params.application).emit('editWall', wall);
                        res.json(wall);
                    })
                    .catch(error => res.json({ error }));
            })
            .catch(error => res.json({ error }));
    } else {
        Wall.find({ alumet: req.params.application })
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
                    alumetReference: req.params.application,
                });

                wallObject
                    .save()
                    .then(wall => {
                        global.io.to(req.params.application).emit('addWall', wall);
                        res.json(wall);
                    })
                    .catch(error => res.json({ error }));
            });
    }
});

router.patch('/:application/:wall/move', validateObjectId, applicationAuthentication([1]), rateLimit(30), async (req, res) => {
    try {
        const { direction } = req.query;
        const { wall } = req.params;

        let currentWall = await Wall.findById(wall);

        if (!currentWall) {
            return res.status(404).json({ error: 'Wall not found' });
        }
        let wallToSwap;
        if (direction === 'right') {
            wallToSwap = await Wall.find({
                alumetReference: req.params.application,
                position: { $gt: currentWall.position }
            }).sort({ position: 1 }).limit(1);
        } else {
            wallToSwap = await Wall.find({
                alumetReference: req.params.application,
                position: { $lt: currentWall.position }
            }).sort({ position: -1 }).limit(1);
        }
        if (wallToSwap.length === 0) {
            return res.status(404).json({ error: 'Ce mur est déjà à une extremité !' });
        }
        let temp = currentWall.position;
        currentWall.position = wallToSwap[0].position;
        wallToSwap[0].position = temp;
        await currentWall.save();
        await wallToSwap[0].save();
        global.io.to(req.params.application).emit('moveWall', currentWall._id, req.query.direction);

        res.json({ message: 'Wall moved' })
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.delete('/:application/:wall', applicationAuthentication([1]), rateLimit(60), (req, res) => {
    Wall.findOneAndDelete({ _id: req.params.wall, alumetReference: req.params.application })
        .then(wall => {
            if (!wall) {
                return res.status(404).json({ error: 'Wall not found' });
            }
            global.io.to(req.params.application).emit('deleteWall', wall._id);
            res.status(200).json({ message: 'Wall deleted' });
        })
        .catch(error => res.json({ error }));
});

module.exports = router;
