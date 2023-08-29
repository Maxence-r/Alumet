const Alumet = require("../../models/alumet");

const authorize = (type) => {
    return async (req, res, next) => {
        /* 
        Professor: Check if the user is connected and if his account type is professor or staff
        Student: Check if the user is connected and if his account type is student or staff
        All: Check if the user is connected
        Staff: Check if the user is connected and if his account type is staff
        */
        if (type === "professor") {
            if (!req.connected || (req.user.accountType !== "professor" && req.user.accountType !== "staff")) {
                return res.status(401).json({ error: "Cette action ne peux pas être réaliser par votre compte (compte ELEVE)" });
            }
        } else if (type === "student") {
            if (!req.connected || (req.user.accountType !== "student" && req.user.accountType !== "staff")) {
                return res.status(401).json({ error: "Unauthorized x002" });
            }
        } else if (type === "all") {
            if (!req.connected) {
                return res.status(401).json({ error: "Unauthorized x003" });
            }
        } else if (type === "staff") {
            if (!req.connected || req.user.accountType !== "staff") {
                return res.status(401).json({ error: "Unauthorized x004" });
            }
        } else if (type === "alumetAdmins") {
            const alumet = await Alumet.findOne({ _id: req.params.alumet });
            if (!req.connected || !alumet || (alumet.owner !== req.user.id && !alumet.collaborators.includes(req.user._id))) {
                return res.status(401).json({ error: "Unauthorized x005" });
            }
        } else if (type === "alumetPrivate") {
            const alumet = await Alumet.findOne({ _id: req.params.alumet });
            if (alumet.private && (!req.connected || (alumet.owner !== req.user.id && !alumet.collaborators.includes(req.user._id) && !alumet.participants.includes(req.user._id)))) {
                return res.status(401).json({ error: "Unauthorized x006" });
            }
        } else if (type === "alumetParticipants") {
            const alumet = await Alumet.findOne({ _id: req.params.alumet });
            if (!req.connected || !alumet || (alumet.owner !== req.user.id && !alumet.collaborators.includes(req.user._id) && !alumet.participants.includes(req.user._id))) {
                return res.status(401).json({ error: "Unauthorized x007" });
            }
        }
        next();
    };
};

module.exports = authorize;
