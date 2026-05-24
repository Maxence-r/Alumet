const multer = require('multer');
const Upload = require('../../models/upload');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const config = require('../../config/env');
const { extensionFromName, sanitizeFilename } = require('../../utils/files');

const storage = multer.diskStorage({
    destination: config.paths.cdn,
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 10,
    },
});

const uploadAndSaveToDb =
    (maxSize, allowedExtensions = []) =>
        async (req, res, next) => {
            if (!req.file) {
                return next();
            }
            const ext = extensionFromName(req.file.originalname);
            const sanitizedFilename = sanitizeFilename(req.file.originalname);
            const fileSizeInMb = req.file.size / (1024 * 1024);
            if (maxSize && fileSizeInMb > maxSize) {
                return res.status(400).json({ error: `File size exceeds the maximum allowed size of ${maxSize} MB.` });
            }
            if (allowedExtensions.length && !allowedExtensions.includes(ext.toLowerCase())) {
                return res.status(400).json({ error: `File type not allowed. Allowed types are: ${allowedExtensions.join(', ')}.` });
            }
            try {
                const upload = new Upload({
                    filename: req.file.filename,
                    displayname: sanitizedFilename,
                    mimetype: ext.toLowerCase(),
                    filesize: req.file.size,
                    owner: req.user.id,
                });
                await upload.save();
                req.upload = upload;
                next();
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'An error occurred while saving the file to the database.' });
            }
        };

module.exports = { upload, uploadAndSaveToDb };
