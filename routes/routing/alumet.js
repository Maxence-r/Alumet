const express = require("express");
const router = express.Router();
const path = require("path");
const Alumet = require("../../models/alumet");
const validateObjectId = require("../../middlewares/modelsValidation/validateObjectId");
const authorize = require("../../middlewares/authentification/authorize");
const validateAlumet = require("../../middlewares/modelsValidation/validateAlumet");
const { upload, uploadAndSaveToDb } = require("../../middlewares/utils/uploadHandler");

router.get("/:id", validateObjectId, (req, res) => {
    const filePath = path.join(__dirname, "../../views/pages/alumet.html");
    res.sendFile(filePath);
});

router.get("/edit/:id", validateObjectId, (req, res) => {
    Alumet.findOne({
        _id: req.params.id,
    }).then((alumet) => {
        if (!alumet) return res.redirect("/404");
        if (alumet.owner.toString() !== req.user.id) return res.redirect(`/portal/${req.params.id}`);
        res.clearCookie("alumetToken");
        const filePath = path.join(__dirname, "../views/pages/editor.html");
        res.sendFile(filePath);
    });
});

router.post("/new", authorize("professor"), upload.single("file"), uploadAndSaveToDb("3", ["png", "jpeg", "jpg"]), validateAlumet, async (req, res) => {
    try {
        const alumet = new Alumet({
            owner: req.user.id,
            title: req.body.title,
            description: req.body.description,
            background: req.upload ? req.upload._id : undefined,
            collaborators: req.body.participants,
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
