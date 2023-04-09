const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const Wall = require('../models/wall');
const validateObjectId = require('../middlewares/validateObjectId');
const teacherAuth = require('../middlewares/api/accountAuth');

//routes 
router.post('/post', validateObjectId, teacherAuth, (req, res) => {
    const post = new Post({
        title: req.body.title,
        content: req.body.content,
        type: req.body.type,
        typeContent: req.body.typeContent,
        color: req.body.color,
        position: req.body.position,
        wallId: req.body.id
    });
    post.save()
    .then(post => res.json(post))
    .catch(error => res.json({ error }));
});


// Wall routes
router.post('/wall', validateObjectId, teacherAuth, (req, res) => {
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

router.get('/walls/:id', validateObjectId, (req, res) => {
    Wall.find({ alumet: req.params.id }).sort({ position: -1 })
    .then(walls => res.json(walls))
    .catch(error => res.json({ error }));
});

router.delete('/wall/:alumet/:id', validateObjectId, teacherAuth, (req, res) => {
    Wall.findOneAndDelete({ _id: req.params.id })
    .then(wall => res.status(200).json({ message: 'Wall deleted' }))
    .catch(error => res.json({ error }));
});

router.patch('/wall/:alumet/:id', validateObjectId, teacherAuth, (req, res) => {
    Wall.findOneAndUpdate({ _id: req.params.id }, { $set: req.body }) 
    .then(wall => res.status(200).json({ message: 'Wall updated' }))
    .catch(error => res.json({ error }));
});

module.exports = router;