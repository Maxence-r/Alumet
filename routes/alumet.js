const express = require('express');
const router = express.Router();
const Alumet = require('../models/alumet');
const auth = require('../middlewares/auth');
const multer = require('multer');
const {v4: uuidv4} = require('uuid');
const path = require('path');
const Upload = require('../models/upload');
const { authorizedModules } = require('../config.json');
const mongoose = require('mongoose');
const validateObjectId = require('../middlewares/validateObjectId');

const storage = multer.diskStorage({
    destination: './cdn',
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});

const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 3 * 1024 * 1024,
        files: 1,
    },
    fileFilter: function(req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
            return callback(new Error('Only images are allowed'))
        }
        callback(null, true)
    }
});

router.patch('/update/lastUsage', validateObjectId, async (req, res) => {
    if (!req.body.id) {
        return res.status(400).json({
            error: 'Missing id'
        });
    }
    try {
        const alumet = await Alumet.findOne({
            _id: req.body.id
        });
        if (!alumet) {
            return res.status(404).json({
                error: 'Alumet not found'
            });
        }
        alumet.lastUsage = Date.now();
        await alumet.save();
        res.json({
            message: 'Updated'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: 'Failed to update alumet'
        });
    }
});


router.post('/new/background', auth, upload.single('background'), async (req, res) => {
    if (!req.logged) {
        return res.status(401).json({
            error: 'Unauthorized'
        });
    }
    if (req.file) {
        const file = req.file;
        const ext = file.originalname.split('.').pop()
        const sanitizedFilename = sanitizeFilename(file.originalname);

        const upload = new Upload({
            filename: file.filename,
            displayname: sanitizedFilename,
            mimetype: ext,
            filesize: file.size,
            owner: req.user._id,
            modifiable: false
        });
        try {
            let uploaded = await upload.save();
            res.json({
                uploaded
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                error: 'Failed to save file'
            });
        }
    } else {
        if (req.fileValidationError) {
            res.status(400).json({
                error: "Invalid file format"
            })
        } else {
            res.status(400).json({
                error: 'Please select a file to upload'
            })
        }
    }
});




router.post('/new', auth, async (req, res) => {
    if (!req.logged) {
        return res.status(401).json({
            error: 'Unauthorized'
        });
    }
    if (!req.body.modules) {
        return res.status(400).json({
            error: 'Missing modules'
        });
    }
    const unauthorizedModules = req.body.modules.filter(module => !authorizedModules.includes(module));
    if (unauthorizedModules.length > 0) {
        return res.status(400).json({
            error: 'Invalid module'
        });
    }
    if (req.body.background && !mongoose.Types.ObjectId.isValid(req.body.background)) {
        return res.status(400).json({
            error: 'Invalid background'
        });
    }
    try {
        const upload = await Upload.findOne({
            _id: req.body.background
        });
        if (!upload || upload.owner != req.user.id ||upload.mimetype != 'png' && upload.mimetype != 'jpg' && upload.mimetype != 'jpeg' || upload.filesize > 3 * 1024 * 1024 ) {
            return res.status(404).json({error: 'Upload isn\'t valid'});
        }
        const alumet = new Alumet({
            ...req.body,
            owner: req.user.id,
            lastUsage: Date.now()
        });
        let saved = await alumet.save();
        res.json({
            saved
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: 'Failed to save alumet'
        });
    }
});

router.get('/all', auth, async (req, res) => {
    if (!req.logged) {
        return res.status(401).json({
            error: 'Unauthorized'
        });
    }
    try {
        const alumets = await Alumet.find({
            owner: req.user.id,
        }).sort({ createdAt: -1 });
        res.json({
            alumets
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: 'Failed to get alumets'
        });
    }
});


router.get('/info/:id', validateObjectId, async (req, res) => {
    Alumet.findOne({
        _id: req.params.id
    }).then(alumet => {
        if (!alumet) {
            return res.status(404).json({
                error: 'Alumet not found'
            });
        }
        let finalAlumet = alumet.toObject();
        if (alumet.password) {
            finalAlumet.hasPassword = true;
        } else {
            finalAlumet.hasPassword = false;
        }
        res.json({
            finalAlumet
        });
    }).catch(error => {
        console.log(error);
        res.status(500).json({
            error: 'Failed to get alumet'
        });
    });
});




module.exports = router;