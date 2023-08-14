const express = require("express");
const router = express.Router();
const Alumet = require("../../../models/alumet");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const Upload = require("../../../models/upload");
const { authorizedModules } = require("../../../config.json");
const mongoose = require("mongoose");
const validateObjectId = require("../../../middlewares/modelsValidation/validateObjectId");
const path = require("path");
const authorize = require("../../../middlewares/authentification/authorize");
const Account = require("../../../models/account");

const storage = multer.diskStorage({
    destination: "./cdn",
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname));
    },
});

const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 3 * 1024 * 1024,
        files: 1,
    },
    fileFilter: function (req, file, callback) {
        let ext = path.extname(file.originalname);
        if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
            return callback(new Error("Invalid file format"));
        }
        callback(null, true);
    },
});

router.post("/new/background", authorize("professor"), upload.single("background"), async (req, res) => {
    if (req.file) {
        const file = req.file;
        const ext = file.originalname.split(".").pop();
        const sanitizedFilename = sanitizeFilename(file.originalname);

        const upload = new Upload({
            filename: file.filename,
            displayname: sanitizedFilename,
            mimetype: ext.toLowerCase(),
            filesize: file.size,
            owner: req.user._id,
            modifiable: false,
        });
        try {
            let uploaded = await upload.save();
            res.json({
                uploaded,
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                error: "Failed to save file",
            });
        }
    } else {
        res.status(400).json({
            error: req.fileValidationError ? "Invalid file format" : "Please select a file to upload",
        });
    }
});

router.patch("/update/:id", authorize("professor"), validateObjectId, async (req, res) => {
    req.body = req.body.body;
    const unauthorizedModules = req.body.modules.filter((module) => !authorizedModules.includes(module));
    if (unauthorizedModules.length > 0) {
        return res.status(400).json({
            error: "Invalid module",
        });
    }
    if (req.body.background && !mongoose.Types.ObjectId.isValid(req.body.background)) {
        return res.status(400).json({
            error: "Invalid background",
        });
    }
    try {
        const alumet = await Alumet.findOne({
            _id: req.params.id,
        });
        if (!alumet) {
            return res.status(404).json({
                error: "Alumet not found",
            });
        }
        if (alumet.owner != req.user.id) {
            return res.status(401).json({
                error: "Vous n'avez pas les permissions pour effectuer cette action !",
            });
        }
        if (!(req.body.background in supportedTemplate)) {
            if (req.body.background) {
                const upload = await Upload.findOne({
                    _id: req.body.background,
                });

                if (!upload || upload.owner !== req.user.id || (upload.mimetype !== "png" && upload.mimetype !== "jpg" && upload.mimetype !== "jpeg") || upload.filesize > 3 * 1024 * 1024) {
                    return res.status(404).json({ error: "Upload isn't valid" });
                }
            }
        }
        if (req.body.background) {
            alumet.background = req.body.background;
        }
        if (req.body.password) {
            alumet.password = req.body.password;
        } else if (req.body.password === null) {
            alumet.password = undefined;
        }
        alumet.description = req.body.description;
        alumet.title = req.body.name;
        alumet.blur = req.body.blur;
        alumet.brightness = req.body.brightness;
        alumet.lastUsage = Date.now();
        let saved = await alumet.save({ runValidators: true });
        res.json({
            saved,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: "Failed to update alumet",
        });
    }
});

router.get("/all", async (req, res) => {
    if (!req.connected) {
        return res.status(401).json({
            error: "Vous n'avez pas les permissions pour effectuer cette action !",
        });
    }
    try {
        const alumets = await Alumet.find({
            owner: req.user.id,
        }).sort({ createdAt: -1 });
        res.json({
            alumets,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: "Failed to get alumets",
        });
    }
});

router.get("/info/:id", validateObjectId, async (req, res) => {
    try {
        const alumet = await Alumet.findOne({
            _id: req.params.id,
        });
        if (!alumet) {
            return res.status(404).json({
                error: "Alumet not found",
            });
        }
        if (req.cookies.alumetToken) {
            req.user = { _id: req.cookies.alumetToken };
        }
        if (alumet.private) {
            delete alumet.code;
            delete alumet.owner;
            delete alumet.collaborators;
            delete alumet.participants;
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
        res.json({
            alumet_infos: { ...alumet.toObject(), participant },
            user_infos,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to get alumet",
        });
    }
});
module.exports = router;
