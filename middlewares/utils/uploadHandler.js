const multer = require('multer');
const Upload = require('../../models/upload');
const { v4: uuidv4 } = require('uuid');
const Folder = require('../../models/folder');
const path = require('path');

const storage = multer.diskStorage({
    destination: './cdn',
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

const sanitizeFilename = filename => {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
};

const uploadAndSaveToDb =
    (maxSize, allowedExtensions = []) =>
    async (req, res, next) => {
        if (!req.file) {
            return next();
        }
        const ext = req.file.originalname.split('.').pop();
        const sanitizedFilename = sanitizeFilename(req.file.originalname);
        const fileSizeInMb = req.file.size / (1024 * 1024);
        if (maxSize && fileSizeInMb > maxSize) {
            return res.status(400).json({ error: `File size exceeds the maximum allowed size of ${maxSize} MB.` });
        }
        if (allowedExtensions.length && !allowedExtensions.includes(ext.toLowerCase())) {
            return res.status(400).json({ error: `File type not allowed. Allowed types are: ${allowedExtensions.join(', ')}.` });
        }
        try {
            const folder = await Folder.findOne({ name: 'system' });
            const upload = new Upload({
                filename: req.file.filename,
                displayname: sanitizedFilename,
                mimetype: ext.toLowerCase(),
                filesize: req.file.size,
                owner: req.user.id,
                folder: folder._id,
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
