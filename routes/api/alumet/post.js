const express = require("express");
const router = express.Router();
const Post = require("../../../models/post");
const validateObjectId = require("../../../middlewares/modelsValidation/validateObjectId");
const validatePost = require("../../../middlewares/modelsValidation/validatePost");
const Alumet = require("../../../models/alumet");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const Upload = require("../../../models/upload");
const notification = require("../../../middlewares/utils/notification");
const authorize = require("../../../middlewares/authentification/authorize");
const Wall = require("../../../models/wall");

router.post("/:alumet/:wall", authorize("alumetParticipants"), validatePost, (req, res) => {
    const post = new Post({
        title: req.body.title,
        content: req.body.content,
        owner: req.user.id,
        file: req.body.file,
        link: req.body.link,
        color: req.body.color,
        position: req.body.position,
        wallId: req.params.wall,
        adminsOnly: req.body.adminsOnly,
        postDate: req.body.postDate,
        commentAuthorized: req.body.commentAuthorized,
    });
    post.save()
        .then((post) => {
            res.json(post);
        })
        .catch((error) => {
            res.json({
                error,
            });
        });
});

router.put("/move/:alumet/:wall/:post", authorize("alumetAdmins"), async (req, res) => {
    const { position } = req.body;
    try {
        const wall = await Wall.findOne({ _id: req.params.wall });
        if (!wall) {
            return res.status(404).json({
                error: "Unable to proceed your requests",
            });
        }
        const topPost = await Post.findOne({ wallId: wall._id }).sort({ position: -1 });
        if (!topPost) {
            console.log("GAY");
            await Post.findOneAndUpdate({ _id: req.params.post }, { position: 0, wallId: req.params.wall }, { new: true });
            return res.json({ message: "Success" });
        }
        if (position === 0) {
            await Post.findOneAndUpdate({ _id: req.params.post }, { position: topPost.position + 1, wallId: req.params.wall }, { new: true });
            return res.json({ message: "Success POSITION 0" });
        }
        const posts = await Post.find({ wallId: wall._id, _id: { $ne: req.params.post } })
            .sort({ position: -1 })
            .limit(position);
        for (let post of posts) {
            post.position += 1;
            await post.save();
        }
        console.log("updated", req.params.post, "to", position, "in", wall._id);
        await Post.findOneAndUpdate({ _id: req.params.post }, { position: posts[position - 1].position - 1, wallId: req.params.wall }, { new: true });
        return res.json({ message: "Success" });
    } catch (error) {
        console.error(error);
        res.json({
            error,
        });
    }
});

router.get("/:alumet/:wall", validateObjectId, async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.alumet);

        if (!alumet) {
            return res.status(404).json({
                error: "Unable to proceed your requests",
            });
        }

        if (!req.connected && !req.auth) {
            return res.status(404).json({
                error: "Vous n'avez pas les permissions pour effectuer cette action !",
            });
        }

        if (req.connected && !req.auth && alumet.owner !== req.user.id) {
            return res.status(404).json({
                error: "Vous n'avez pas les permissions pour effectuer cette action !",
            });
        }

        if (req.auth && !req.connected && alumet._id.toString() !== req.alumet.id) {
            return res.status(404).json({
                error: "Vous n'avez pas les permissions pour effectuer cette action !",
            });
        }

        const posts = await Post.find({
            wallId: req.params.wall,
        }).sort({
            position: -1,
        });

        const sendPosts = await Promise.all(
            posts.map(async (post) => {
                let editedPost = {
                    ...post._doc,
                };
                if (post.ownerType !== "teacher") {
                    if (req.cookies.alumetToken === editedPost.owner || req.connected) {
                        editedPost.owning = true;
                    }
                    const decodedToken = jwt.verify(post.owner, process.env.TOKEN.toString());
                    editedPost.owner = decodedToken.username;
                } else if (req.connected && alumet.owner === req.user.id) {
                    editedPost.owning = true;
                }
                if (post.type === "file") {
                    const upload = await Upload.findById(post.typeContent);

                    if (upload) {
                        editedPost.fileName = upload.displayname;
                        editedPost.fileExt = upload.mimetype;
                    }
                }
                if (editedPost.isVisible === false) {
                    return editedPost;
                } else if (req.auth && !req.connected && editedPost.isVisible === true) {
                    if (req.cookies.alumetToken === post.owner) {
                        return editedPost;
                    } else {
                        return {
                            content: "Ce post est uniquement visible par le professeur",
                            color: editedPost.color,
                        };
                    }
                } else if (req.connected && alumet.owner === req.user.id) {
                    return editedPost;
                }
                return editedPost;
            })
        );
        res.json(sendPosts);
    } catch (error) {
        console.error(error);
    }
});

router.patch("/:alumet/:wall/:post", validateObjectId, validatePost, notification("A modifié un post"), (req, res) => {
    Post.findOneAndUpdate(
        {
            _id: req.params.post,
        },
        {
            title: req.body.title,
            content: req.body.content,
            color: req.body.color,
        },
        {
            runValidators: true,
        }
    )
        .then(() => {
            Post.findOne({
                _id: req.params.post,
            }).then((post) => {
                res.json(post);
            });
        })
        .catch((error) =>
            res.json({
                error,
            })
        );
});

router.delete("/:alumet/:wall/:post", validateObjectId, notification("A supprimé un post"), async (req, res) => {
    try {
        const alumet = await Alumet.findById(req.params.alumet);

        if (!alumet) {
            return res.status(404).json({
                error: "Unable to proceed your requests",
            });
        }

        if (!req.connected && !req.auth) {
            return res.status(404).json({
                error: "Vous n'avez pas les permissions pour effectuer cette action !",
            });
        }

        const post = await Post.findById(req.params.post);

        if (req.auth && req.cookies.alumetToken !== post.owner) {
            return res.status(404).json({
                error: "Vous n'avez pas les permissions pour effectuer cette action !",
            });
        }

        if (!post) {
            return res.status(404).json({
                error: "Post not found",
            });
        }

        if (req.connected && alumet.owner !== req.user.id && post.owner !== req.user.id) {
            return res.status(404).json({
                error: "UVous n'avez pas les permissions pour effectuer cette action !",
            });
        }

        const deletedPost = await Post.findByIdAndDelete(req.params.post);
        res.json(deletedPost);
    } catch (error) {
        console.error(error);
    }
});

module.exports = router;
