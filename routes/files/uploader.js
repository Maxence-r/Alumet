const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Upload = require('../../models/upload');
const fs = require('fs');
const fsp = require('fs/promises');
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');
const Post = require('../../models/post');
const Folder = require('../../models/folder');
const mongoose = require('mongoose');
const rateLimit = require('../../middlewares/authentification/rateLimit');
const config = require('../../config/env');
const logger = require('../../utils/logger');
const asyncHandler = require('../../utils/asyncHandler');
const { extensionFromName, sanitizeFilename } = require('../../utils/files');

const storage = multer.diskStorage({
    destination: config.paths.cdn,
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname));
    },
});

const removeFromDisk = async filename => {
    if (!filename) {
        return;
    }

    try {
        await fsp.unlink(path.join(config.paths.cdn, filename));
    } catch (error) {
        if (error.code !== 'ENOENT') {
            logger.warn('Unable to remove uploaded file from disk', filename, error.message);
        }
    }
};

const requireConnected = (req, res, next) => {
    if (!req.connected) {
        return res.status(401).json({
            error: "You do not have permission to perform this action.",
        });
    }

    return next();
};

router.get('/content', rateLimit(30), requireConnected, async (req, res) => {
    try {
        let folders = await Folder.find({ owner: req.user?.id }).sort({ lastUsage: -1 }).lean();

        const extensions = req.query.ext ? req.query.ext.split(',').map(extensionFromName).filter(Boolean) : [];
        const escapedExtensions = extensions.map(ext => ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = escapedExtensions.length > 0 ? new RegExp(`\\.(${escapedExtensions.join('|')})$`, 'i') : null;

        await Promise.all(
            folders.map(async folder => {
                let query = { folder: folder._id };
                if (regex) query.filename = regex;
                folder.uploads = await Upload.find(query).sort({ _id: -1 });
            })
        );

        res.json(folders);
    } catch (error) {
        logger.error('Cloud content loading failed', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/folder/create', rateLimit(30), requireConnected, (req, res) => {
    if (!req.body.name) {
        return res.status(400).json({ error: 'Please specify a folder name' });
    }

    const folder = new Folder({
        name: sanitizeFilename(req.body.name),
        owner: req.user.id,
    });
    folder
        .save()
        .then(folder => res.status(201).json(folder))
        .catch(error => res.json({ error }));
});

router.delete('/folder/delete/:id', rateLimit(30), requireConnected, validateObjectId, async (req, res) => {
    try {
        const folder = await Folder.findOne({ _id: req.params.id, owner: req.user.id });
        if (!folder) return res.status(404).json({ error: 'Folder not found' });
        const uploads = await Upload.find({ folder: folder._id });
        for (const upload of uploads) {
            await upload.deleteOne();
            await Post.deleteMany({ file: upload._id.toString() });
            await removeFromDisk(upload.filename);
        }
        await folder.deleteOne();
        res.json(folder);
    } catch (error) {
        logger.error('Folder deletion failed', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/folder/rename/:id', rateLimit(30), requireConnected, validateObjectId, (req, res) => {
    Folder.findOne({ _id: req.params.id, owner: req.user.id })
        .then(folder => {
            if (!folder) return res.status(404).json({ error: 'Folder not found' });
            if (!req.body.name) return res.status(400).json({ error: 'Please specify a new name' });
            folder.name = sanitizeFilename(req.body.name);
            folder.save();
            res.json(folder);
        })
        .catch(error => res.json({ error }));
});

router.get('/u/defaultUser', (req, res) => {
    const filePath = path.join(__dirname, './../../views/assets/default/default_user.png');
    res.sendFile(filePath);
});

router.get('/u/defaultAlumet', (req, res) => {
    const filePath = path.join(__dirname, './../../views/assets/default/default_alumet.jpg');
    res.sendFile(filePath);
});

router.get('/u/defaultGroup', (req, res) => {
    const filePath = path.join(__dirname, './../../views/assets/default/default_group.png');
    res.sendFile(filePath);
});

router.get('/u/:id', rateLimit(60), validateObjectId, asyncHandler(async (req, res) => {
    const upload = await Upload.findById(req.params.id);
    if (!upload) return res.status(404).json({ error: 'File not found' });

    const filePath = path.join(config.paths.cdn, upload.filename);
    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }

    return res.redirect('/404');
}));

router.get('/u/:id/download', rateLimit(30), validateObjectId, asyncHandler(async (req, res) => {
    const upload = await Upload.findById(req.params.id);
    if (!upload) return res.status(404).json({ error: 'File not found' });

    const filePath = path.join(config.paths.cdn, upload.filename);
    if (fs.existsSync(filePath)) {
        return res.download(filePath, upload.displayname);
    }

    return res.redirect('/404');
}));

router.patch('/update/:id', rateLimit(30), requireConnected, validateObjectId, asyncHandler(async (req, res) => {
    if (!req.body.displayname) return res.status(400).json({ error: 'Please specify a new name' });
    const upload = await Upload.findOne({ _id: req.params.id, owner: req.user.id });
    if (!upload) return res.status(404).json({ error: 'File not found' });
    if (upload.modifiable === false) {
        return res.status(401).json({
            error: 'This file is used by one of your Alumets and cannot be edited.',
        });
    }

    upload.displayname = sanitizeFilename(req.body.displayname) + '.' + upload.mimetype;
    await upload.save();
    res.json({ upload: [upload] });
}));

const accountUpload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 150,
    },
});

router.post('/upload/:id', rateLimit(240), requireConnected, async (req, res) => {
    let folder;
    if (req.params.id && mongoose.Types.ObjectId.isValid(req.params.id)) {
        folder = await Folder.findOne({
            _id: req.params.id,
            owner: req.user.id,
        });
    }

    accountUpload.single('file')(req, res, async err => {
        try {
            if (err) {
                return res.status(500).json({ error: 'Upload failed' });
            }
            if (req.file) {
                const ext = extensionFromName(req.file.originalname);
                const sanitizedFilename = sanitizeFilename(req.file.originalname);
                const upload = new Upload({
                    filename: req.file.filename,
                    displayname: sanitizedFilename,
                    mimetype: ext.toLowerCase(),
                    filesize: req.file.size,
                    owner: req.user?.id || req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection.remoteAddress,
                    folder: folder?._id || null,
                });
                await upload.save();
                res.json({ file: upload });
            } else {
                res.status(400).json({
                    error: 'An unknown error occurred.',
                });
            }
        } catch (error) {
            logger.error('Upload save failed', error);
            res.status(500).json({
                error: "An error occurred while saving the file",
            });
        }
    });
});

router.get('/info/:id', rateLimit(30), validateObjectId, (req, res) => {
    Upload.findOne({ _id: req.params.id })
        .then(upload => {
            if (!upload) return res.status(404).json({ error: 'File not found' });
            res.json({ upload });
        })

        .catch(error => res.json({ error }));
});

router.delete('/:id', rateLimit(30), requireConnected, validateObjectId, async (req, res) => {
    try {
        const upload = await Upload.findById(req.params.id);
        if (!upload) {
            return res.status(404).json({ error: 'File not found' });
        }
        if (!upload.modifiable) {
            return res.status(401).json({
                error: 'This file is used by one of your Alumets and cannot be deleted.',
            });
        }
        if (upload.owner.toString() !== req.user.id) {
            return res.status(401).json({
                error: "You do not have permission to perform this action.",
            });
        }
        await upload.deleteOne();
        await Post.deleteMany({ file: req.params.id });
        await removeFromDisk(upload.filename);
        return res.json({ success: 'Upload deleted' });
    } catch (error) {
        logger.error('Upload deletion failed', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
