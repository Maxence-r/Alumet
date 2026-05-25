const express = require('express');
const mongoose = require('mongoose');
const Alumet = require('../../models/alumet');
const Upload = require('../../models/upload');
const Account = require('../../models/account');
const Wall = require('../../models/wall');
const Post = require('../../models/post');
const Comment = require('../../models/comment');
const validateAlumet = require('../../middlewares/modelsValidation/validateAlumet');
const validatePost = require('../../middlewares/modelsValidation/validatePost');
const applicationAuthentication = require('../../middlewares/authentification/applicationAuthentication');
const rateLimit = require('../../middlewares/authentification/rateLimit');
const { upload, uploadAndSaveToDb } = require('../../middlewares/utils/uploadHandler');
const sendInvitations = require('../../middlewares/mailManager/sendInvitations');
const addBlurToImage = require('../../middlewares/utils/blur');
const { authCookieOptions, signJwt } = require('../../utils/auth');
const { ROLE, canAccessAlumet, canAdminAlumet, participantRole } = require('../../utils/roles');
const { validate } = require('../../middlewares/validation/validate');
const schemas = require('../../schemas/api');

const router = express.Router();

const requesterIp = req => req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection.remoteAddress;
const roomForPost = (post, alumetId) => (post.adminsOnly || new Date(post.postDate) > new Date() ? `admin-${alumetId}` : alumetId);
const emitToAlumet = (alumetId, event, ...payload) => global.io?.to(alumetId).emit(event, ...payload);

router.get('/alumets/:id', validate(schemas.alumetId), rateLimit(30), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.id);
        if (!alumet) return res.status(404).json({ error: 'Alumet not found', code: 'NOT_FOUND' });

        alumet.lastUsage = Date.now();
        await alumet.save();

        let participant = false;
        let user_infos = {};
        let admin = false;
        if (req.user) {
            const account = await Account.findById(req.user.id, 'id name icon lastname username badges experiments');
            if (account) {
                participant = canAccessAlumet(alumet, req.user.id);
                admin = canAdminAlumet(alumet, req.user.id);
                user_infos = { id: account._id, name: account.name, icon: account.icon, lastname: account.lastname, username: account.username, badges: account.badges, experiments: account.experiments, admin, participant };
            }
        }

        if (!canAdminAlumet(alumet, req.user?.id)) {
            alumet.code = null;
            alumet.password = null;
        }

        const participantIds = alumet.participants.map(p => p.userId);
        const participantAccounts = await Promise.all(participantIds.map(id => Account.findById(id, 'id name icon lastname username accountType badges')));
        const participants = participantAccounts
            .map((account, index) => (account ? { ...account.toObject(), role: participantRole(alumet.participants[index]), status: participantRole(alumet.participants[index]) } : null))
            .filter(Boolean);

        const ownerAccount = await Account.findById(alumet.owner, 'id name icon lastname username accountType badges');
        if (ownerAccount) participants.push({ ...ownerAccount.toObject(), role: 'owner', status: 'owner' });

        return res.json({ infos: { ...alumet.toObject(), participant, participants }, user_infos });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to get alumet', code: 'SERVER_ERROR' });
    }
});

router.get('/alumets/:id/content', validate(schemas.alumetId), applicationAuthentication(), rateLimit(60), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.id);
        const walls = await Wall.find({ alumetReference: req.params.id }).sort({ position: 1 }).lean();

        for (const wall of walls) {
            let posts;
            if (req.connected && canAdminAlumet(alumet, req.user?.id)) {
                posts = await Post.find({ wallId: wall._id }).sort({ position: -1 }).lean();
            } else {
                posts = await Post.find({
                    wallId: wall._id,
                    $and: [
                        {
                            $or: [{ adminsOnly: false }, { owner: { $exists: true, $eq: req.user?.id } }, { ip: requesterIp(req) }],
                        },
                        {
                            $or: [{ owner: req.user?.id }, { postDate: { $exists: false }, adminsOnly: false }, { postDate: null, adminsOnly: false }, { postDate: { $lt: new Date().toISOString() }, adminsOnly: false }],
                        },
                    ],
                })
                    .sort({ position: -1 })
                    .lean();
            }

            for (const post of posts) {
                await Account.populate(post, { path: 'owner', select: 'id name icon lastname accountType badges username' });
                if (!post.owner && post.ip === requesterIp(req)) post.editable = true;
                post.commentsLength = await Comment.countDocuments({ postId: post._id });
                if (post.file) post.file = await Upload.findById(post.file);
            }
            wall.posts = posts;
        }

        return res.json({ walls });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to get alumet', code: 'SERVER_ERROR' });
    }
});

router.post('/alumets', rateLimit(3), upload.single('file'), uploadAndSaveToDb('3', ['png', 'jpeg', 'jpg']), addBlurToImage, validate(schemas.createAlumet), validateAlumet, async (req, res) => {
    try {
        const alumetDatas = Object.fromEntries(
            Object.entries({
                title: req.body.title,
                description: req.body.description,
                background: req.upload ? req.upload._id : undefined,
                private: req.body.private,
                swiftchat: req.body.chat,
                lastUsage: Date.now(),
                type: req.body.type,
                subject: req.body.subject,
                discovery: req.body.discovery,
                security: req.body.security,
                password: req.body.password,
            }).filter(([_, value]) => value !== undefined)
        );

        const updatedAlumet = new Alumet({ ...alumetDatas, owner: req.user.id });
        await updatedAlumet.save();
        return res.status(201).json({ alumet: updatedAlumet });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', code: 'SERVER_ERROR' });
    }
});

router.patch('/alumets/:id', validate(schemas.alumetId), rateLimit(30), upload.single('file'), uploadAndSaveToDb('3', ['png', 'jpeg', 'jpg']), addBlurToImage, validateAlumet, async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.id);
        if (!alumet) return res.status(404).json({ error: 'Alumet not found', code: 'NOT_FOUND' });
        if (!canAdminAlumet(alumet, req.user?.id)) return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });

        Object.assign(
            alumet,
            Object.fromEntries(
                Object.entries({
                    title: req.body.title,
                    description: req.body.description,
                    background: req.upload ? req.upload._id : undefined,
                    private: req.body.private,
                    swiftchat: req.body.chat,
                    lastUsage: Date.now(),
                    subject: req.body.subject,
                    discovery: req.body.discovery,
                    security: req.body.security,
                    password: req.body.password,
                }).filter(([_, value]) => value !== undefined)
            )
        );
        await alumet.save();
        return res.json({ alumet });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', code: 'SERVER_ERROR' });
    }
});

router.delete('/alumets/:id', validate(schemas.alumetId), rateLimit(30), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.id);
        if (!alumet) return res.status(404).json({ error: 'Alumet not found', code: 'NOT_FOUND' });
        if (alumet.owner !== req.user?.id) return res.status(403).json({ error: 'Unauthorized', code: 'FORBIDDEN' });
        await alumet.remove();
        return res.json({ message: 'Alumet deleted' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to delete alumet', code: 'SERVER_ERROR' });
    }
});

router.post('/alumets/:id/access-grants', validate(schemas.alumetId), rateLimit(10), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.id);
        if (!alumet) return res.status(404).json({ error: 'Alumet not found', code: 'NOT_FOUND' });

        if (req.body.collaborators) {
            sendInvitations(req, res, req.params.id);
            return res.json({ success: true });
        }

        switch (alumet.security) {
            case 'open':
                if (req.user?.id && alumet.participants.every(p => p.userId !== req.user.id)) {
                    alumet.participants.push({ userId: req.user.id, role: ROLE.MEMBER });
                    await alumet.save();
                }
                break;
            case 'onpassword':
                if (req.body.password !== alumet.password) return res.status(400).json({ error: 'The password is incorrect.', code: 'BAD_PASSWORD' });
                if (req.user?.id) {
                    if (alumet.participants.some(p => p.userId === req.user.id)) return res.status(400).json({ error: 'You have already joined this Alumet', code: 'ALREADY_JOINED' });
                    alumet.participants.push({ userId: req.user.id, role: ROLE.MEMBER });
                    await alumet.save();
                } else {
                    const token = signJwt({ applicationId: alumet._id.toString() }, { expiresIn: '1h' });
                    return res.cookie('applicationToken', token, authCookieOptions(3600000)).status(200).json({ message: 'Alumet authorized', application: { type: alumet.type } });
                }
                break;
            case 'closed':
                return res.status(400).json({ error: 'Alumet is closed', code: 'ALUMET_CLOSED' });
        }
        return res.status(200).json({ message: 'Alumet joined', application: { type: alumet.type } });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', code: 'SERVER_ERROR' });
    }
});

router.delete('/alumets/:id/members/me', validate(schemas.alumetId), rateLimit(30, true), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.id);
        if (!alumet) return res.status(404).json({ error: 'Alumet not found', code: 'NOT_FOUND' });
        if (!alumet.participants.some(p => p.userId === req.user.id)) return res.status(400).json({ error: 'You must transfer ownership before leaving this Alumet', code: 'OWNER_CANNOT_LEAVE' });
        alumet.participants = alumet.participants.filter(participant => participant.userId !== req.user.id);
        await alumet.save();
        return res.status(200).json({ message: 'Alumet left' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', code: 'SERVER_ERROR' });
    }
});

router.patch('/alumets/:id/members/:userId', validate(schemas.updateMember), rateLimit(60), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.id);
        if (!alumet) return res.status(404).json({ error: 'The application was not found', code: 'NOT_FOUND' });
        if (alumet.owner !== req.user?.id) return res.status(403).json({ error: 'You are not allowed to perform this action', code: 'FORBIDDEN' });
        if (alumet.owner === req.params.userId) return res.status(403).json({ error: 'You cannot change the owner role', code: 'OWNER_ROLE_LOCKED' });

        alumet.participants = alumet.participants.map(participant => {
            if (participant.userId === req.params.userId) participant.role = req.body.role;
            return participant;
        });
        await alumet.save();
        return res.json({ message: 'The role was updated successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update alumet', code: 'SERVER_ERROR' });
    }
});

router.patch('/alumets/:id/owner', validate(schemas.updateOwner), rateLimit(60), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.id);
        if (!alumet) return res.status(404).json({ error: 'The application was not found', code: 'NOT_FOUND' });
        if (alumet.owner !== req.user?.id) return res.status(403).json({ error: 'You are not allowed to perform this action', code: 'FORBIDDEN' });
        const owner = alumet.owner;
        alumet.owner = req.body.user;
        alumet.participants = alumet.participants.filter(p => p.userId !== req.body.user);
        alumet.participants.push({ userId: owner, role: ROLE.ADMIN });
        await alumet.save();
        return res.json({ message: 'Application ownership was transferred successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update alumet', code: 'SERVER_ERROR' });
    }
});

router.post('/alumets/:alumetId/walls', validate(schemas.createWall), applicationAuthentication(['admin']), rateLimit(30), async (req, res) => {
    try {
        const topWall = await Wall.find({ alumetReference: req.params.alumetId }).sort({ position: -1 }).limit(1);
        const wallObject = new Wall({
            title: req.body.title,
            postAuthorized: req.body.postAuthorized,
            position: topWall.length === 0 ? 0 : topWall[0].position + 1,
            alumetReference: req.params.alumetId,
        });
        const wall = await wallObject.save();
        emitToAlumet(req.params.alumetId, 'alumet:wall:created', wall);
        return res.status(201).json(wall);
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.patch('/alumets/:alumetId/walls/:wallId', validate(schemas.wallParams), applicationAuthentication(['admin']), rateLimit(30), async (req, res) => {
    try {
        const wall = await Wall.findById(req.params.wallId);
        if (!wall) return res.status(404).json({ error: 'Wall not found', code: 'NOT_FOUND' });
        wall.title = req.body.title;
        wall.postAuthorized = req.body.postAuthorized;
        await wall.save();
        emitToAlumet(req.params.alumetId, 'alumet:wall:updated', wall);
        return res.json(wall);
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.patch('/alumets/:alumetId/walls/:wallId/position', validate(schemas.updateWallPosition), applicationAuthentication(['admin']), rateLimit(30), async (req, res) => {
    try {
        const direction = req.body.direction || req.query.direction;
        const currentWall = await Wall.findById(req.params.wallId);
        if (!currentWall) return res.status(404).json({ error: 'Wall not found', code: 'NOT_FOUND' });

        const wallToSwap = await Wall.find({
            alumetReference: req.params.alumetId,
            position: direction === 'right' ? { $gt: currentWall.position } : { $lt: currentWall.position },
        })
            .sort({ position: direction === 'right' ? 1 : -1 })
            .limit(1);
        if (wallToSwap.length === 0) return res.status(404).json({ error: 'This board is already at an edge.', code: 'WALL_AT_EDGE' });

        const temp = currentWall.position;
        currentWall.position = wallToSwap[0].position;
        wallToSwap[0].position = temp;
        await currentWall.save();
        await wallToSwap[0].save();
        emitToAlumet(req.params.alumetId, 'alumet:wall:moved', currentWall._id, direction);
        return res.json({ message: 'Wall moved' });
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.delete('/alumets/:alumetId/walls/:wallId', validate(schemas.wallParams), applicationAuthentication(['admin']), rateLimit(60), async (req, res) => {
    try {
        const wall = await Wall.findOneAndDelete({ _id: req.params.wallId, alumetReference: req.params.alumetId });
        if (!wall) return res.status(404).json({ error: 'Wall not found', code: 'NOT_FOUND' });
        emitToAlumet(req.params.alumetId, 'alumet:wall:deleted', wall._id);
        return res.status(200).json({ message: 'Wall deleted' });
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.post('/alumets/:alumetId/walls/:wallId/posts', validate(schemas.createPost), rateLimit(30), applicationAuthentication(), validatePost, async (req, res) => {
    const postFields = {
        title: req.body.title,
        content: req.body.content,
        owner: req.user && req.user.id,
        ip: requesterIp(req),
        file: req.body.file || null,
        link: req.body.link,
        color: req.body.postColor,
        position: req.body.position,
        wallId: req.params.wallId,
        adminsOnly: req.body.adminsOnly,
        postDate: req.body.postDate || null,
        commentAuthorized: req.body.commentAuthorized,
        createdAt: Date.now(),
    };
    try {
        const post = new Post(postFields);
        await post.save();
        postFields.owner = await Account.findById(postFields.owner).select('id name icon lastname accountType badges username');
        postFields.file = await Upload.findById(postFields.file).select('displayname mimetype');
        postFields._id = post._id;
        postFields.editable = true;
        emitToAlumet(roomForPost(postFields, req.params.alumetId), 'alumet:post:created', postFields);
        return res.status(201).json(postFields);
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.patch('/alumets/:alumetId/posts/:postId', validate(schemas.postParams), rateLimit(30), applicationAuthentication(), validatePost, async (req, res) => {
    try {
        const postFields = {
            title: req.body.title,
            content: req.body.content,
            owner: req.user && req.user.id,
            ip: requesterIp(req),
            file: req.body.file || null,
            link: req.body.link,
            color: req.body.postColor,
            wallId: req.body.wallId,
            adminsOnly: req.body.adminsOnly,
            postDate: req.body.postDate || null,
            commentAuthorized: req.body.commentAuthorized,
            createdAt: Date.now(),
        };
        const post = await Post.findByIdAndUpdate(req.params.postId, postFields, { new: true });
        postFields.owner = await Account.findById(postFields.owner).select('id name icon lastname accountType badges username');
        postFields.file = await Upload.findById(postFields.file).select('displayname mimetype');
        postFields._id = post._id;
        postFields.editable = true;
        emitToAlumet(roomForPost(postFields, req.params.alumetId), 'alumet:post:updated', postFields);
        return res.json(postFields);
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.patch('/alumets/:alumetId/walls/:wallId/posts/:postId/position', validate(schemas.movePost), applicationAuthentication(['admin']), rateLimit(60), async (req, res) => {
    const { position } = req.body;
    try {
        const wall = await Wall.findOne({ _id: req.params.wallId });
        if (!wall) return res.status(404).json({ error: 'Unable to proceed your requests', code: 'NOT_FOUND' });
        const topPost = await Post.findOne({ wallId: wall._id }).sort({ position: -1 });
        const post = await Post.findOne({ _id: req.params.postId });
        if (!post) return res.status(404).json({ error: 'Unable to proceed your requests', code: 'NOT_FOUND' });
        const room = roomForPost(post, req.params.alumetId);
        if (!topPost || position === 0) {
            await Post.findOneAndUpdate({ _id: req.params.postId }, { position: !topPost ? 0 : topPost.position + 1, wallId: req.params.wallId }, { new: true });
            emitToAlumet(room, 'alumet:post:moved', req.params.wallId, req.params.postId, position);
            return res.json({ message: 'Success' });
        }
        const posts = await Post.find({ wallId: wall._id, _id: { $ne: req.params.postId } }).sort({ position: -1 }).limit(position);
        for (const orderedPost of posts) {
            orderedPost.position += 1;
            await orderedPost.save();
        }
        await Post.findOneAndUpdate({ _id: req.params.postId }, { position: posts[position - 1].position - 1, wallId: req.params.wallId }, { new: true });
        emitToAlumet(room, 'alumet:post:moved', req.params.wallId, req.params.postId, position);
        return res.json({ message: 'Success' });
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.delete('/alumets/:alumetId/posts/:postId', validate(schemas.postParams), applicationAuthentication(), rateLimit(60), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.alumetId);
        const post = await Post.findById(req.params.postId);
        if (!post || ((!req.connected && post.ip !== requesterIp(req)) || (post.owner !== req.user?.id && !canAdminAlumet(alumet, req.user?.id)))) {
            return res.status(404).json({ error: 'You do not have permission to perform this action.', code: 'FORBIDDEN' });
        }
        const deletedPost = await Post.findByIdAndDelete(req.params.postId);
        emitToAlumet(req.params.alumetId, 'alumet:post:deleted', req.params.postId);
        return res.json(deletedPost);
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.post('/alumets/:alumetId/posts/:postId/comments', validate(schemas.createComment), rateLimit(5), applicationAuthentication(['admin', 'member']), async (req, res) => {
    const commentFields = {
        owner: req.user && req.user.id,
        content: req.body.content,
        createdAt: Date.now(),
        postId: req.params.postId,
    };
    try {
        const comment = new Comment(commentFields);
        await comment.save();
        commentFields.owner = await Account.findById(commentFields.owner).select('id name icon lastname accountType badges username');
        global.io?.to(req.params.postId).emit('alumet:comment:created', commentFields);
        return res.status(201).json(commentFields);
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.get('/alumets/:alumetId/posts/:postId/comments', validate(schemas.postParams), applicationAuthentication(), rateLimit(60), async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId })
            .populate({ path: 'owner', model: 'Account', select: 'id name lastname accountType badges username icon' })
            .sort({ createdAt: 1 });
        return res.json(comments);
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

module.exports = router;
