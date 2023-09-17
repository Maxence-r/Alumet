const express = require('express');
const router = express.Router();
const Alumet = require('../../../models/alumet');

const Upload = require('../../../models/upload');

const validateObjectId = require('../../../middlewares/modelsValidation/validateObjectId');

const authorize = require('../../../middlewares/authentification/authorize');
const Account = require('../../../models/account');
const Wall = require('../../../models/wall');
const Post = require('../../../models/post');

router.get('/', authorize(), async (req, res) => {
    try {
        const alumets = await Alumet.find({
            $or: [{ owner: req.user.id }, { participants: { $in: [req.user.id] } }, { collaborators: { $in: [req.user.id] } }],
        })
            .select('id title lastUsage background')
            .sort({ lastUsage: -1 });
        res.json({
            alumets,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: 'Failed to get alumets',
        });
    }
});

router.get('/:alumet/content', authorize('alumetPrivate'), validateObjectId, async (req, res) => {
    try {
        const alumet = await Alumet.findOne({
            _id: req.params.alumet,
        });
        let alumetContent = alumet.toObject();
        if (req.connected) {
            if (alumet.owner === req.user.id || alumet.collaborators.includes(req.user.id)) {
                alumetContent.admin = true;
            }
            if (alumet.participants.includes(req.user.id)) {
                alumetContent.participant = true;
            }
            const account = await Account.findOne(
                {
                    _id: req.user.id,
                },
                {
                    id: 1,
                    name: 1,
                    icon: 1,
                    lastname: 1,
                    username: 1,
                }
            );
            if (account) {
                alumetContent.user_infos = { id: account._id, name: account.name, icon: account.icon, lastname: account.lastname, username: account.username };
            }
        }
        const walls = await Wall.find({ alumetReference: req.params.alumet }).sort({ position: 1 }).lean();

        for (let wall of walls) {
            let posts;
            if (req.connected && (alumet.owner === req.user.id || alumet.collaborators.includes(req.user.id) || alumet.owner === req.user.id)) {
                posts = await Post.find({ wallId: wall._id }).sort({ position: -1 }).lean();
            } else {
                delete alumetContent.code;
                posts = await Post.find({
                    wallId: wall._id,

                    $and: [
                        {
                            $or: [{ adminsOnly: false }, { owner: req.user?.id }],
                        },
                        {
                            $or: [{ owner: req.user?.id }, { postDate: { $exists: false } }, { postDate: null }, { postDate: { $lt: new Date().toISOString() } }],
                        },
                    ],
                })
                    .sort({ position: -1 })
                    .lean();
            }
            for (let post of posts) {
                await Account.populate(post, { path: 'owner', select: 'id name icon lastname accountType isCertified badges username' });

                if (post.file) {
                    const upload = await Upload.findOne({
                        _id: post.file,
                    });
                    if (upload) {
                        post.file = upload;
                    }
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

router.get('/info/:id', validateObjectId, async (req, res) => {
    try {
        const alumet = await Alumet.findOne({
            _id: req.params.id,
        });
        if (!alumet) {
            return res.status(404).json({
                error: 'Alumet not found',
            });
        }
        if (req.cookies.alumetToken) {
            req.user = { _id: req.cookies.alumetToken };
        }

        let participant = false;
        let user_infos = {};
        if (req.user) {
            const account = await Account.findOne(
                {
                    _id: req.user.id,
                },
                {
                    id: 1,
                    name: 1,
                    icon: 1,
                    lastname: 1,
                }
            );
            if (account) {
                user_infos = { id: account._id, name: account.name, icon: account.icon, lastname: account.lastname };
                if (alumet.participants.includes(account._id) || alumet.collaborators.includes(account._id) || alumet.owner == account._id) {
                    participant = true;
                }
            }
        }
        alumet.code = null;
        alumet.participants = null;
        alumet.collaborators = null;
        let ownerInfo = await Account.findOne(
            {
                _id: alumet.owner,
            },
            {
                name: 1,
                lastname: 1,
                icon: 1,
            }
        );
        alumet.owner = ownerInfo.name + ' ' + ownerInfo.lastname;
        res.json({
            alumet_infos: { ...alumet.toObject(), participant },
            user_infos,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to get alumet',
        });
    }
});
module.exports = router;
