const express = require("express");
const router = express.Router();
const path = require("path");
const Alumet = require("../../models/alumet");
const validateObjectId = require("../../middlewares/modelsValidation/validateObjectId");
const authorize = require("../../middlewares/authentification/authorize");
const validateAlumet = require("../../middlewares/modelsValidation/validateAlumet");
const { upload, uploadAndSaveToDb } = require("../../middlewares/utils/uploadHandler");

router.get("/:id", validateObjectId, async (req, res) => {
    let alumet = await Alumet.findById(req.params.id);
    if (!alumet) return res.redirect("/404");
    if (alumet.private === true && (!req.connected || (!alumet.collaborators.includes(req.user.id) && !alumet.participants.includes(req.user.id) && req.user.id !== alumet.owner))) {
        return res.redirect("/portal/" + req.params.id);
    }
    if ((req.connected && !alumet.collaborators.includes(req.user.id) && !alumet.participants.includes(req.user.id) && req.user.id !== alumet.owner) || (!req.connected && req.query.guest !== "true")) {
        return res.redirect("/portal/" + req.params.id);
    }
    const filePath = path.join(__dirname, "../../views/pages/alumet.html");
    res.sendFile(filePath);
});

router.post("/new", authorize("professor"), upload.single("file"), uploadAndSaveToDb("3", ["png", "jpeg", "jpg"]), validateAlumet, async (req, res) => {
    try {
        const alumet = new Alumet({
            owner: req.user.id,
            title: req.body.title,
            description: req.body.description,
            background: req.upload ? req.upload._id : undefined,
            collaborators: req.body.collaborators,
            private: req.body.private,
            swiftchat: req.body.chat,
        });
        await alumet.save();
        res.json({ alumet });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "An error occurred while creating the alumet." });
    }
});

module.exports = router;
