const express = require('express');
const router = express.Router();
const Alumet = require('../../../models/alumet');

const Upload = require('../../../models/upload');

const validateObjectId = require('../../../middlewares/modelsValidation/validateObjectId');

const authorize = require('../../../middlewares/authentification/authorize');
const Account = require('../../../models/account');
const Wall = require('../../../models/wall');
const Post = require('../../../models/post');
const sendInvitations = require('../../../middlewares/mailManager/sendInvitations');
const Comment = require('../../../models/comment');

router.get('/:alumet/content', authorize('alumet', 'alumetPrivate'), validateObjectId, async (req, res) => {
    try {
        const alumet = await Alumet.findOne({
            _id: req.params.alumet,
        })

        participants_alumet = [];
        alumet.participants.forEach(participant => {
            Account.findById(participant.userId, 'id name icon lastname username accountType isCertified badges').then(account => {
                if (account) {
                    participants_alumet.push({ ...account.toObject(), status: participant.status });
                }
            })
        })
        const ownerAccount = await Account.findById(alumet.owner, 'id name icon lastname username accountType isCertified badges');
        participants_alumet.push({ ...ownerAccount.toObject(), status: 0 });

        let alumetContent = alumet.toObject();
        console.log(alumet.owner === req.user?.id)
        alumetContent.admin = alumet.owner === req.user?.id || alumet.participants.some(p => p.userId.toString() === req.user?.id && p.status === 1);
        alumetContent.participants = participants_alumet;
        if (req.connected) {
            const account = await Account.findById(req.user.id, 'id name icon lastname username');
            if (account) {
                alumetContent.user_infos = account;
            }
        }
        const walls = await Wall.find({ alumetReference: req.params.alumet }).sort({ position: 1 }).lean();

        for (let wall of walls) {
            let posts;
            if (req.connected && (alumet.owner === req.user.id || alumet.participants.some(p => p.userId.toString() === req.user.id && p.status === 1))) {
                posts = await Post.find({ wallId: wall._id }).sort({ position: -1 }).lean();
            } else {
                delete alumetContent.code;
                posts = await Post.find({
                    wallId: wall._id,
                    $and: [
                        {
                            $or: [{ adminsOnly: false }, { owner: { $exists: true, $eq: req.user?.id } }, { ip: req.ip }],
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
                await Account.populate(post, { path: 'owner', select: 'id name icon lastname accountType isCertified badges username' });
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



router.put('/collaborators/:alumet', authorize('alumet', 'itemAdmins'), async (req, res) => {
    sendInvitations(req, res, 'alumet', req.params.alumet);
    res.json({ success: true });
});

router.delete('/:alumet/participant/:participant', authorize('alumet', 'itemAdmins'), validateObjectId, async (req, res) => {
    try {
        const alumet = await Alumet.findOne({ _id: req.params.alumet });
        if (!alumet) {
            return res.status(404).json({ error: 'Unable to proceed your requests' });
        }
        if (alumet.owner !== req.user.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        alumet.participants = alumet.participants.filter(participant => participant.userId !== req.params.participant);
        await alumet.save();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while deleting the participant.' });
    }
});
module.exports = router;
