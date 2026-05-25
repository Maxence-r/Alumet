const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const fsp = require('fs/promises');
const mongoose = require('mongoose');
const axios = require('axios');
const Upload = require('../../models/upload');
const Post = require('../../models/post');
const Folder = require('../../models/folder');
const rateLimit = require('../../middlewares/authentification/rateLimit');
const config = require('../../config/env');
const logger = require('../../utils/logger');
const asyncHandler = require('../../utils/asyncHandler');
const { extensionFromName, sanitizeFilename } = require('../../utils/files');
const { validate } = require('../../middlewares/validation/validate');
const schemas = require('../../schemas/api');

const router = express.Router();

const storage = multer.diskStorage({
    destination: config.paths.cdn,
    filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
});

const accountUpload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 150,
    },
});

const removeFromDisk = async filename => {
    if (!filename) return;
    try {
        await fsp.unlink(path.join(config.paths.cdn, filename));
    } catch (error) {
        if (error.code !== 'ENOENT') logger.warn('Unable to remove uploaded file from disk', filename, error.message);
    }
};

const requireConnected = (req, res, next) => {
    if (!req.connected) return res.status(401).json({ error: 'You do not have permission to perform this action.', code: 'UNAUTHORIZED' });
    return next();
};

const sendUploadContent = async (req, res, download = false) => {
    const upload = await Upload.findById(req.params.id);
    if (!upload) return res.status(404).json({ error: 'File not found', code: 'NOT_FOUND' });
    const filePath = path.join(config.paths.cdn, upload.filename);
    if (!fs.existsSync(filePath)) return res.redirect('/404');
    return download ? res.download(filePath, upload.displayname) : res.sendFile(filePath);
};

router.get('/folders', rateLimit(30), requireConnected, async (req, res) => {
    try {
        const folders = await Folder.find({ owner: req.user?.id }).sort({ lastUsage: -1 }).lean();
        const extensions = req.query.ext ? req.query.ext.split(',').map(extensionFromName).filter(Boolean) : [];
        const escapedExtensions = extensions.map(ext => ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = escapedExtensions.length > 0 ? new RegExp(`\\.(${escapedExtensions.join('|')})$`, 'i') : null;
        await Promise.all(
            folders.map(async folder => {
                const query = { folder: folder._id };
                if (regex) query.filename = regex;
                folder.uploads = await Upload.find(query).sort({ _id: -1 });
            })
        );
        return res.json(folders);
    } catch (error) {
        logger.error('Cloud content loading failed', error);
        return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
    }
});

router.get('/files', rateLimit(30), requireConnected, async (req, res) => {
    req.url = '/folders';
    return router.handle(req, res);
});

router.post('/folders', rateLimit(30), requireConnected, validate(schemas.folderBody), async (req, res) => {
    const folder = new Folder({ name: sanitizeFilename(req.body.name), owner: req.user.id });
    try {
        const saved = await folder.save();
        return res.status(201).json(saved);
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.patch('/folders/:id', rateLimit(30), requireConnected, validate(schemas.folder), validate(schemas.folderBody), async (req, res) => {
    try {
        const folder = await Folder.findOne({ _id: req.params.id, owner: req.user.id });
        if (!folder) return res.status(404).json({ error: 'Folder not found', code: 'NOT_FOUND' });
        folder.name = sanitizeFilename(req.body.name);
        await folder.save();
        return res.json(folder);
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.delete('/folders/:id', rateLimit(30), requireConnected, validate(schemas.folder), async (req, res) => {
    try {
        const folder = await Folder.findOne({ _id: req.params.id, owner: req.user.id });
        if (!folder) return res.status(404).json({ error: 'Folder not found', code: 'NOT_FOUND' });
        const uploads = await Upload.find({ folder: folder._id });
        for (const upload of uploads) {
            await upload.deleteOne();
            await Post.deleteMany({ file: upload._id.toString() });
            await removeFromDisk(upload.filename);
        }
        await folder.deleteOne();
        return res.json(folder);
    } catch (error) {
        logger.error('Folder deletion failed', error);
        return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
    }
});

router.post('/files', rateLimit(240), requireConnected, async (req, res) => {
    let folder;
    if (req.query.folderId && mongoose.Types.ObjectId.isValid(req.query.folderId)) {
        folder = await Folder.findOne({ _id: req.query.folderId, owner: req.user.id });
    }

    accountUpload.single('file')(req, res, async err => {
        try {
            if (err) return res.status(500).json({ error: 'Upload failed', code: 'UPLOAD_FAILED' });
            if (!req.file) return res.status(400).json({ error: 'An unknown error occurred.', code: 'BAD_REQUEST' });

            const ext = extensionFromName(req.file.originalname);
            const upload = new Upload({
                filename: req.file.filename,
                displayname: sanitizeFilename(req.file.originalname),
                mimetype: ext.toLowerCase(),
                filesize: req.file.size,
                owner: req.user?.id || req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection.remoteAddress,
                folder: folder?._id || null,
            });
            await upload.save();
            return res.status(201).json({ file: upload });
        } catch (error) {
            logger.error('Upload save failed', error);
            return res.status(500).json({ error: 'An error occurred while saving the file', code: 'SERVER_ERROR' });
        }
    });
});

router.get('/files/:id', rateLimit(30), validate(schemas.file), async (req, res) => {
    const upload = await Upload.findById(req.params.id);
    if (!upload) return res.status(404).json({ error: 'File not found', code: 'NOT_FOUND' });
    return res.json({ upload });
});

router.get('/files/:id/content', rateLimit(60), validate(schemas.file), asyncHandler(async (req, res) => sendUploadContent(req, res, false)));
router.get('/files/:id/download', rateLimit(30), validate(schemas.file), asyncHandler(async (req, res) => sendUploadContent(req, res, true)));

router.patch('/files/:id', rateLimit(30), requireConnected, validate(schemas.filePatch), async (req, res) => {
    const upload = await Upload.findOne({ _id: req.params.id, owner: req.user.id });
    if (!upload) return res.status(404).json({ error: 'File not found', code: 'NOT_FOUND' });
    if (upload.modifiable === false) return res.status(401).json({ error: 'This file is used by one of your Alumets and cannot be edited.', code: 'FILE_LOCKED' });
    upload.displayname = sanitizeFilename(req.body.displayname) + '.' + upload.mimetype;
    await upload.save();
    return res.json({ upload: [upload] });
});

router.delete('/files/:id', rateLimit(30), requireConnected, validate(schemas.file), async (req, res) => {
    try {
        const upload = await Upload.findById(req.params.id);
        if (!upload) return res.status(404).json({ error: 'File not found', code: 'NOT_FOUND' });
        if (!upload.modifiable) return res.status(401).json({ error: 'This file is used by one of your Alumets and cannot be deleted.', code: 'FILE_LOCKED' });
        if (upload.owner.toString() !== req.user.id) return res.status(401).json({ error: 'You do not have permission to perform this action.', code: 'UNAUTHORIZED' });
        await upload.deleteOne();
        await Post.deleteMany({ file: req.params.id });
        await removeFromDisk(upload.filename);
        return res.json({ success: 'Upload deleted' });
    } catch (error) {
        logger.error('Upload deletion failed', error);
        return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
    }
});

router.get('/files/:id/preview', rateLimit(60), validate(schemas.file), async (req, res) => {
    const upload = await Upload.findById(req.params.id);
    if (!upload) return res.sendFile('unknow.png', { root: `${config.paths.views}/assets/preview` });

    switch (upload.mimetype) {
        case 'pdf':
            try {
                const pdf2img = require('pdf-img-convert');
                const url = `${req.protocol}://${req.get('host')}/api/files/${req.params.id}/content`;
                const outputImages = await pdf2img.convert(url, { width: 400 });
                if (outputImages.length === 0) throw new Error('No images found');
                const imageBuffer = Buffer.from(outputImages[0], 'base64');
                res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': imageBuffer.length });
                return res.end(imageBuffer);
            } catch (error) {
                logger.error('Error generating PDF preview', error);
                return res.status(500).send('Error generating image');
            }
        case 'png':
        case 'jpeg':
        case 'jpg':
            try {
                const sharp = require('sharp');
                const url = `${req.protocol}://${req.get('host')}/api/files/${req.params.id}/content`;
                const { data: imageData } = await axios.get(url, { responseType: 'arraybuffer' });
                const previewImage = await sharp(imageData).resize(500).toBuffer();
                res.set('Content-Type', 'image/png');
                return res.send(previewImage);
            } catch (error) {
                logger.error('Error generating image preview', error);
                return res.status(500).send('Internal server error');
            }
        case 'mp3':
        case 'wav':
        case 'ogg':
        case 'flac':
        case 'm4a':
        case 'wma':
        case 'aac':
            return res.sendFile('audio.png', { root: `${config.paths.views}/assets/preview` });
        case 'mp4':
        case 'webm':
        case 'mkv':
        case 'avi':
        case 'mov':
        case 'wmv':
        case 'flv':
        case '3gp':
        case 'm4v':
            return res.sendFile('video.png', { root: `${config.paths.views}/assets/preview` });
        case 'doc':
        case 'docx':
            return res.sendFile('doc.png', { root: `${config.paths.views}/assets/preview` });
        case 'xls':
        case 'xlsx':
            return res.sendFile('sheet.png', { root: `${config.paths.views}/assets/preview` });
        case 'ppt':
        case 'pptx':
            return res.sendFile('slide.png', { root: `${config.paths.views}/assets/preview` });
        case 'zip':
        case 'rar':
        case '7z':
        case 'tar':
        case 'gz':
            return res.sendFile('zip.png', { root: `${config.paths.views}/assets/preview` });
        default:
            return res.sendFile('unknow.png', { root: `${config.paths.views}/assets/preview` });
    }
});

router.get('/files/default/user', (req, res) => res.sendFile(path.join(config.paths.views, 'assets/default/default_user.png')));
router.get('/files/default/alumet', (req, res) => res.sendFile(path.join(config.paths.views, 'assets/default/default_alumet.jpg')));
router.get('/files/default/group', (req, res) => res.sendFile(path.join(config.paths.views, 'assets/default/default_group.png')));

module.exports = router;
