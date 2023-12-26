const express = require('express');
const router = express.Router();
const Post = require('../../../models/post');

const validatePost = require('../../../middlewares/modelsValidation/validatePost');
const Alumet = require('../../../models/alumet');
require('dotenv').config();

const Upload = require('../../../models/upload');
const authorize = require('../../../middlewares/authentification/authorize');
const Wall = require('../../../models/wall');
const Account = require('../../../models/account');
const Comment = require('../../../models/comment');
const rateLimit = require('../../../middlewares/authentification/rateLimit');


router.put('/:alumet/:wall', rateLimit(60), validatePost, authorize('alumet', 'alumetPrivate'), async (req, res) => {
    const postId = req.body.postId;
    const postFields = {
        title: req.body.title,
        content: req.body.content,
        owner: req.user && req.user.id,
        ip: req.ip,
        file: req.body.file || null,
        link: req.body.link,
        color: req.body.postColor,
        position: req.body.position,
        wallId: req.params.wall,
        adminsOnly: req.body.adminsOnly,
        postDate: req.body.postDate || null,
        commentAuthorized: req.body.commentAuthorized,
        createdAt: Date.now(),
    };
    try {
        let post;
        if (postId) {
            delete postFields.position;
            post = await Post.findByIdAndUpdate(postId, postFields, { new: true });
        } else {
            post = new Post(postFields);
            await post.save();
        }
        postFields.owner = await Account.findById(postFields.owner).select('id name icon lastname accountType isCertified badges username');
        postFields.file = await Upload.findById(postFields.file).select('displayname mimetype');
        postFields._id = post._id;
        const postDate = new Date(postFields.postDate);
        const currentDate = new Date();
        const room = postFields.adminsOnly || postDate > currentDate ? `admin-${req.params.alumet}` : req.params.alumet;
        if (postId) {
            global.io.to(room).emit('editPost', postFields);
        } else {
            global.io.to(room).emit('addPost', postFields);
        }
        res.json(postFields);
    } catch (error) {
        console.error(error);
        res.json({
            error,
        });
    }
});

router.put('/:alumet/:id/comments', rateLimit(5), authorize('alumet', 'itemParticipants'), authorize('alumet', 'alumetPrivate'), async (req, res) => {
    const commentFields = {
        owner: req.user && req.user.id,
        content: req.body.content,
        createdAt: Date.now(),
        postId: req.params.id,
    };
    try {
        const comment = new Comment(commentFields);
        await comment.save();
        commentFields.owner = await Account.findById(commentFields.owner).select('id name icon lastname accountType isCertified badges username');
        global.io.to(req.params.id).emit('addComment', commentFields);
        res.json(commentFields);
    } catch (error) {
        console.error(error);
        res.json({
            error,
        });
    }
});

router.get('/:alumet/:id/comments', authorize('alumet', 'alumetPrivate'), async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.id })

            .populate({
                path: 'owner',
                model: 'Account',
                select: 'id name lastname accountType isCertified badges username icon',
            })
            .sort({ createdAt: 1 });
        res.json(comments);
    } catch (error) {
        console.error(error);
        res.json({
            error,
        });
    }
});

router.put('/move/:alumet/:wall/:post', authorize('alumet', 'itemAdmins'), async (req, res) => {
    const { position } = req.body;
    try {
        const wall = await Wall.findOne({ _id: req.params.wall });
        if (!wall) {
            return res.status(404).json({
                error: 'Unable to proceed your requests',
            });
        }
        const topPost = await Post.findOne({ wallId: wall._id }).sort({ position: -1 });
        const post = await Post.findOne({ _id: req.params.post });
        if (!post) {
            return res.status(404).json({
                error: 'Unable to proceed your requests',
            });
        }
        const postDate = new Date(post.postDate);
        const currentDate = new Date();
        const room = post.adminsOnly || postDate > currentDate ? `admin-${req.params.alumet}` : req.params.alumet;
        if (!topPost) {
            await Post.findOneAndUpdate({ _id: req.params.post }, { position: 0, wallId: req.params.wall }, { new: true });
            global.io.to(room).emit('movePost', req.params.wall, req.params.post, position);
            return res.json({ message: 'Success' });
        }
        if (position === 0) {
            await Post.findOneAndUpdate({ _id: req.params.post }, { position: topPost.position + 1, wallId: req.params.wall }, { new: true });
            global.io.to(room).emit('movePost', req.params.wall, req.params.post, position);
            return res.json({ message: 'Success' });
        }
        const posts = await Post.find({ wallId: wall._id, _id: { $ne: req.params.post } })
            .sort({ position: -1 })
            .limit(position);
        for (let post of posts) {
            post.position += 1;
            await post.save();
        }

        await Post.findOneAndUpdate({ _id: req.params.post }, { position: posts[position - 1].position - 1, wallId: req.params.wall }, { new: true });
        global.io.to(room).emit('movePost', req.params.wall, req.params.post, position);
        return res.json({ message: 'Success' });
    } catch (error) {
        console.error(error);
        res.json({
            error,
        });
    }
});

router.delete('/:alumet/:post', async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.alumet);
        if (!req.connected) {
            return res.status(404).json({
                error: "Vous n'avez pas les permissions pour effectuer cette action !",
            });
        }

        const post = await Post.findById(req.params.post);
        if (!post || (post.owner !== req.user.id && !alumet.participants.some(p => p.userId === req.user.id && p.status === 1) && alumet.owner !== req.user.id)) {
            return res.status(404).json({
                error: "Vous n'avez pas les permissions pour effectuer cette action !",
            });
        }

        const deletedPost = await Post.findByIdAndDelete(req.params.post);
        global.io.to(req.params.alumet).emit('deletePost', req.params.post);
        res.json(deletedPost);
    } catch (error) {
        console.error(error);
    }
});

module.exports = router;
