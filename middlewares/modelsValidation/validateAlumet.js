const Upload = require("../../models/upload");
const Account = require("../../models/account");
const authorizedMimeTypes = ["jpeg", "jpg", "png"];

async function validateAlumet(req, res, next) {
    try {
        if (req.body.background) {
            const upload = await Upload.findById(req.body.background);
            if (!upload || upload.size > 1000000 || !authorizedMimeTypes.includes(upload.mimetype)) {
                return res.status(400).json({ error: "An error occurred while uploading the background image." });
            }
        }
        if (req.body.collaborators) {
            const collaborators = JSON.parse(req.body.collaborators);
            for (const collaborator of collaborators) {
                const account = await Account.findById(collaborator);
                if (!account || (account.accountType !== "professor" && account.accountType !== "staff")) {
                    return res.status(400).json({ error: "An error occurred while adding a collaborator." });
                }
            }
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(400).json({ error: "An error occurred while validating the alumet." });
    }
}

module.exports = validateAlumet;
