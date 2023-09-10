const Alumet = require('../../models/alumet');
const Post = require('../../models/post');
const Upload = require('../../models/upload');
const Wall = require('../../models/wall');
const sanitizeHtml = require('sanitize-html');
const urlMetadata = require('url-metadata');

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
        if (req.body.postId && !req.connected) {
            return res.status(401).json({ error: 'Unauthorized x001' });
        }
        const alumet = await Alumet.findOne({ _id: req.params.alumet });
        const wall = await Wall.findOne({ _id: req.params.wall });
        let error = null;
        if (req.body.postId) {
            const post = await Post.findOne({ _id: req.body.postId });
            if (!post) {
                error = { error: 'Unable to proceed your requests x002' };
            } else if (post.owner !== req.user.id && !alumet.collaborators.includes(req.user._id) && alumet.owner !== req.user.id) {
                error = { error: 'Unauthorized post x001' };
            }
        }
        if ((!wall && !req.body.postId) || (!wall.postAuthorized && alumet.owner !== req.user.id && !alumet.collaborators.includes(req.user._id))) {
            error = { error: 'Unauthorized wall x001' };
        }
        if (error) {
            return res.status(400).json(error);
        }
        if (req.body.postDate) {
            const publicationDate = new Date(new Date(req.body.postDate).getTime() + 2 * 60 * 60 * 1000);
            const publicationDateString = publicationDate.toISOString();
            if (isNaN(publicationDate.getTime()) || publicationDateString <= new Date()) {
                return res.status(400).json({ error: 'La date de publication est déja passé' });
            }
            req.body.postDate = publicationDateString;
        }

        if (typeof req.body.content === 'string') {
            let formattedText = req.body.content;
            const regex = /<div>/g;
            formattedText = formattedText.replace(regex, '<br>');
            const sanitizedText = sanitizeHtml(formattedText, {
                allowedTags: ['b', 'i', 'u', 'br', 'latex'],
                allowedAttributes: {
                    b: ['style'],
                    i: ['style'],
                    u: ['style'],
                },
                allowedStyles: {},
            });
            req.body.content = sanitizedText;
        }

        const position = await Post.find({ wallId: req.params.wall }).sort({ position: -1 }).limit(1);

        req.body.position = position.length > 0 ? position[0].position + 1 : 1;

        if (req.body.file && req.body.drive == false) {
            console.log('file');
            const upload = await Upload.findOne({ _id: req.body.file });
            if (!upload) {
                return res.status(400).json({ error: 'Unable to proceed your requests x001' });
            }
        } else if (req.body.drive && req.body.file) {
            console.log('drive');
            await uploadGoogleDrive(req.body.file);
            console.log('uploadGoogleDrive 2');
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
