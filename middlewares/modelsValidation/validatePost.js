const Alumet = require("../../models/alumet");
const Post = require("../../models/post");
const Upload = require("../../models/upload");
const Wall = require("../../models/wall");
const sanitizeHtml = require("sanitize-html");
const urlMetadata = require("url-metadata");

function getDomainFromUrl(url) {
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(url)) {
        return null;
    }
    const domain = url.replace("http://", "").replace("https://", "").split("/")[0];
    return domain;
}

const validatePost = async (req, res, next) => {
    try {
        const alumet = await Alumet.findOne({ _id: req.params.alumet });
        const wall = await Wall.findOne({ _id: req.params.wall });
        if (!wall.postAuthorized && alumet.owner !== req.user.id && !alumet.collaborators.includes(req.user._id)) {
            return res.status(400).json({ error: "Unauthorized wall x001" });
        }

        if (req.body.postDate) {
            const publicationDate = new Date(req.body.postDate);
            if (isNaN(publicationDate.getTime()) || publicationDate <= new Date()) {
                return res.status(400).json({ error: "La date de publication est déja passé" });
            }
        }

        let formattedText = req.body.content;
        formattedText = formattedText.replace(/<\/div>(?=\w)/g, "<br>");
        const sanitizedText = sanitizeHtml(formattedText, {
            allowedTags: ["b", "i", "u", "br", "latex"],
            allowedAttributes: {
                b: ["style"],
                i: ["style"],
                u: ["style"],
            },
            allowedStyles: {},
        });
        req.body.content = sanitizedText;

        const position = await Post.find({ wallId: req.params.wall }).sort({ position: -1 }).limit(1);

        req.body.position = position.length > 0 ? position[0].position + 1 : 1;

        if (req.body.file) {
            const upload = await Upload.findOne({ _id: req.body.file, owner: req.user.id });
            if (!upload) {
                return res.status(400).json({ error: "Unable to proceed your requests x001" });
            }
        }

        if (req.body.link) {
            const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
            if (!urlRegex.test(req.body.link)) {
                return res.status(400).json({ error: "Invalid link format" });
            }
            const metadata = await urlMetadata(req.body.link);
            req.body.link = {
                url: req.body.link,
                title: metadata.title || metadata["og:title"] || getDomainFromUrl(req.body.link),
                description: getDomainFromUrl(req.body.link),
                image: metadata.image || metadata["og:image"] || null,
            };
        }
    } catch (error) {
        console.log(error);
        return res.status(404).json({ error: "Unable to proceed your requests x004" });
    }
    console.log(req.body);
    next();
};

module.exports = validatePost;
