const Alumet = require('../../models/alumet');
const Post = require('../../models/post');
const Upload = require('../../models/upload');
const Wall = require('../../models/wall');
const sanitizeHtml = require('sanitize-html');
const urlMetadata = require('url-metadata');
const { canAdminAlumet } = require('../../utils/roles');

function getDomainFromUrl(url) {
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(url)) {
        return null;
    }
    const domain = url.replace('http://', '').replace('https://', '').split('/')[0];
    return domain;
}

const validatePost = async (req, res, next) => {
    try {
        const applicationId = req.params.application || req.params.alumetId;
        const wallId = req.params.wall || req.params.wallId || req.body.wallId;
        const postId = req.body.postId || req.params.postId;
        const alumet = await Alumet.findOne({ _id: applicationId });
        const wall = await Wall.findOne({ _id: wallId });
        let error = null;
        if (!alumet || !wall) {
            return res.status(404).json({ error: 'Unable to proceed your requests x002' });
        }

        if (postId) {
            const post = await Post.findOne({ _id: postId });
            if (!req.connected && post.ip !== (req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection.remoteAddress)) {
                return res.status(401).json({ error: 'Unauthorized x001' });
            } else if (req.connected && (!post || (post.owner !== req.user.id && !canAdminAlumet(alumet, req.user.id)))) {
                return res.status(400).json({ error: "You do not have permission to edit this post!" });
            }
        }

        if ((!wall && !postId) || (!wall.postAuthorized && !canAdminAlumet(alumet, req.user?.id))) {
            return res.status(400).json({ error: 'Unauthorized wall x001' });
        }

        const authorizedColor = ['white', 'red', 'yellow', 'green', 'blue'];
        if (!authorizedColor.includes(req.body.postColor)) {
            return res.status(400).json({ error: 'Unauthorized color x001' });
        }
        if (error) {
            return res.status(400).json(error);
        }
        if (req.body.postDate) {
            const publicationDate = new Date(new Date(req.body.postDate).getTime());
            const publicationDateString = publicationDate.toISOString();
            if (isNaN(publicationDate.getTime()) || publicationDateString <= new Date()) {
                return res.status(400).json({ error: 'The publication date has already passed' });
            }
            req.body.postDate = publicationDateString;
        }

        if (typeof req.body.content === 'string') {
            let formattedText = req.body.content;
            const regex = /<div>/g;
            formattedText = formattedText.replace(regex, '<br>');
            const sanitizedText = sanitizeHtml(formattedText, {
                allowedTags: ['b', 'i', 'u', 'br', 'span'],
                allowedAttributes: {
                    b: ['style'],
                    i: ['style'],
                    u: ['style'],
                    span: ['style'],
                },
                allowedStyles: {
                    span: {
                        'background-color': [/^yellow$/],
                    },
                },
            });
            req.body.content = sanitizedText;
        }

        const position = await Post.find({ wallId }).sort({ position: -1 }).limit(1);

        req.body.position = position.length > 0 ? position[0].position + 1 : 1;

        if (req.body.file) {
            const upload = await Upload.findOne({ _id: req.body.file });
            if (!upload) {
                return res.status(400).json({ error: 'Unable to proceed your requests x001' });
            }
        }

        if (req.body.link) {
            const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
            if (!urlRegex.test(req.body.link)) {
                return res.status(400).json({ error: 'Invalid link format' });
            }
            try {
                const metadata = await urlMetadata(req.body.link);
                req.body.link = {
                    url: req.body.link,
                    title: metadata.title || metadata['og:title'] || getDomainFromUrl(req.body.link),
                    description: getDomainFromUrl(req.body.link),
                    image: metadata.image || metadata['og:image'] || null,
                };
            } catch (error) {
                req.body.link = {
                    url: req.body.link,
                    title: getDomainFromUrl(req.body.link),
                    description: getDomainFromUrl(req.body.link),
                    image: null,
                };
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(404).json({ error: 'Unable to proceed your requests x004' });
    }
    next();
};

module.exports = validatePost;
