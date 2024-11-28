const express = require('express');
const router = express.Router();
const Alumet = require('../../../models/alumet');
const Upload = require('../../../models/upload');
const validateObjectId = require('../../../middlewares/modelsValidation/validateObjectId');
const Account = require('../../../models/account');
const Wall = require('../../../models/wall');
const Post = require('../../../models/post');
const Comment = require('../../../models/comment');
const applicationAuthentication = require('../../../middlewares/authentification/applicationAuthentication');
const rateLimit = require('../../../middlewares/authentification/rateLimit');

router.get('/:application/content', applicationAuthentication(), rateLimit(60), validateObjectId, async (req, res) => {
    try {
        const alumet = await Alumet.findOne({
            _id: req.params.application,
        });
        let alumetContent = {};

        const walls = await Wall.find({ alumetReference: req.params.application }).sort({ position: 1 }).lean();

        for (let wall of walls) {
            let posts;
            if (req.connected && (alumet.owner === req.user?.id || alumet.participants.some(p => p.userId.toString() === req.user?.id && p.status === 1))) {
                posts = await Post.find({ wallId: wall._id }).sort({ position: -1 }).lean();
            } else {
                delete alumetContent.code;
                posts = await Post.find({
                    wallId: wall._id,
                    $and: [
                        {
                            $or: [{ adminsOnly: false }, { owner: { $exists: true, $eq: req.user?.id } }, { ip: req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection.remoteAddress }],
                        },
                        {
                            $or: [{ owner: req.user?.id }, { postDate: { $exists: false }, adminsOnly: false }, { postDate: null, adminsOnly: false }, { postDate: { $lt: new Date().toISOString() }, adminsOnly: false }],
                        },
                    ],
                })
                    .sort({ position: -1 })
                    .lean();
            }

            for (let post of posts) {
                await Account.populate(post, { path: 'owner', select: 'id name icon lastname accountType badges username' });

                if (!post.owner && post.ip === (req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection.remoteAddress)) {
                    post.editable = true;
                }
                post.commentsLength = await Comment.countDocuments({ postId: post._id });
                if (post.file) {
                    post.file = await Upload.findById(post.file);
                }
            }
            wall.posts = posts;
        }

        alumetContent.walls = walls;
        res.json(alumetContent);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: 'Failed to get alumet',
        });
    }
});

module.exports = router;
