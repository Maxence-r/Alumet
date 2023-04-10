const express = require('express');
const router = express.Router();
const Post = require('../../models/post');
const validateObjectId = require('../../middlewares/validateObjectId');
const paramValidator = require('../../middlewares/api/paramValidator');

router.post('/', validateObjectId, (req, res) => {
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

module.exports = router;