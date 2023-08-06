const mongoose = require("mongoose");
const Upload = require("../../models/upload");

function validateConversation(req, res, next) {
    if (!req.connected) {
        return res.status(401).json({ error: "Non autorisé" });
    }
    if (req.body.participants) {
        if (!Array.isArray(req.body.participants)) {
            return res
                .status(400)
                .json({ error: "Les participants doivent être un tableau" });
        }
        req.body.participants.forEach((participant) => {
            if (!mongoose.Types.ObjectId.isValid(participant)) {
                return res
                    .status(400)
                    .json({ error: "Identifiant de participant invalide" });
            }
        });
    }

    if (req.body.icon) {
        Upload.findById(req.body.icon)
            .then((upload) => {
                if (
                    !upload ||
                    !["jpg", "png", "jpeg"].includes(upload.mimetype)
                ) {
                    return res.status(400).json({ error: "Identifiant d'icône invalide" });
                }
                next();
            })
            .catch((err) => {
                console.error(err);
                return res.status(500).json({ error: "Erreur interne du serveur" });
            });
    } else {
        next();
    }

    if (req.body.participants.length > 2) {
        req.body.owner = req.user._id;
    }
}

module.exports = validateConversation;