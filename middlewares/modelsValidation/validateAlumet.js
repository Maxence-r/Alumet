const Upload = require("../../models/upload");
const Account = require("../../models/account");
const authorizedMimeTypes = ["jpeg", "jpg", "png"];

function validateAlumet(req, res, next) {
    if (req.body.background) {
        Upload.findById(req.body.background)
            .then((upload) => {
                if (!upload || upload.size > 1000000 || !authorizedMimeTypes.includes(upload.mimetype)) {
                    return res.status(400).json({ error: "An error occurred while uploading the background image." });
                }
            })
            .catch((err) => {
                return res.status(400).json({ error: "An error occurred while uploading the background image." });
            });
    }
    if (req.body.collaborators) {
        req.body.collaborators.forEach((collaborator) => {
            Account.findById(collaborator)
                .then((account) => {
                    if (!account || accountType !== "professor" || accountType !== "staff") {
                        return res.status(400).json({ error: "An error occurred while adding a collaborator." });
                    }
                })
                .catch((err) => {
                    return res.status(400).json({ error: "An error occurred while adding a collaborator." });
                });
        });
    }
    next();
}

module.exports = validateAlumet;
