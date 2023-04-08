const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const Wall = require('../models/wall');
const validateObjectId = require('../middlewares/validateObjectId');
const studentAuth = require('../middlewares/studentAuth');
const teacherAuth = require('../middlewares/api/accountAuth');

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


router.post('/wall', validateObjectId, teacherAuth, (req, res) => {
    Wall.find({ alumet: req.body.id })
    const wall = new Wall({
        title: req.body.title,
        post: req.body.post,
        position: req.body.position,
        alumet: req.body.id
    });
    wall.save()
    .then(wall => res.json(wall))
    .catch(error => res.json({ error }));
});
    

module.exports = router;