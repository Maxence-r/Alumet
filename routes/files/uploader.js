const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Upload = require('../../models/upload');
const fs = require('fs');
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');
const Post = require('../../models/post');
const Folder = require('../../models/folder');
const authorize = require('../../middlewares/authentification/authorize');
const mongoose = require('mongoose');

const storage = multer.diskStorage({
    destination: './cdn',
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname));
    },
});

router.get('/content', authorize(), async (req, res) => {
    try {
        let folders = await Folder.find({ owner: req.user?.id })
            .sort({ lastUsage: -1 })
            .lean();

        const extensions = req.query.ext ? req.query.ext.split(',') : [];
        const regex = extensions.length > 0 ? new RegExp(`\\.(${extensions.join('|')})$`, 'i') : null;

        await Promise.all(folders.map(async (folder) => {
            let query = { folder: folder._id };
            if (regex) query.filename = regex;
            folder.uploads = await Upload.find(query).sort({ _id: -1 });
        }));

        res.json(folders);
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});
router.post('/folder/create', authorize(), (req, res) => {
    const folder = new Folder({
        name: req.body.name,
        owner: req.user.id,
    });
    folder
        .save()
        .then(folder => res.status(201).json(folder))
        .catch(error => res.json({ error }));
});

router.get('/folder/list', authorize(), (req, res) => {
    Folder.find({ owner: req.user.id })
        .sort({ lastUsage: -1 })
        .then(folders => res.json(folders))
        .catch(error => res.json({ error }));
});
router.delete('/folder/delete/:id', authorize(), validateObjectId, async (req, res) => {
    if (!req.connected)
        return res.status(401).json({
            error: "Vous n'avez pas les permissions pour effectuer cette action !",
        });
    try {
        const folder = await Folder.findOne({ _id: req.params.id, owner: req.user.id });
        if (!folder) return res.status(404).json({ error: 'Dossier introuvable' });
        await folder.remove();
        const uploads = await Upload.find({ folder: folder._id });
        for (const upload of uploads) {
            const uploadRecord = await Upload.find({ _id: upload._id });
            if (!uploadRecord[0]) {
                return res.status(404).json({ error: 'Fichier non trouvé' });
            }
            await uploadRecord[0].deleteOne();
            await Post.deleteMany({ file: req.params.id });
            fs.unlink(`./cdn/${uploadRecord[0].filename}`, err => {
                if (err) {
                    console.error(err);
                }
            });
        }
        res.json(folder);
    } catch (error) {
        res.json({ error });
    }
});

router.post('/folder/rename/:id', authorize(), validateObjectId, (req, res) => {
    Folder.findOne({ _id: req.params.id, owner: req.user.id })
        .then(folder => {
            if (!folder) return res.status(404).json({ error: 'Dossier introuvable' });
            if (!req.body.name) return res.status(400).json({ error: 'Veuillez spéficier un nouveau nom' });
            folder.name = req.body.name;
            folder.save();
            res.json(folder);
        })
        .catch(error => res.json({ error }));
});

router.get('/folder/:id', authorize(), (req, res) => {
    Folder.findOne({ _id: req.params.id, owner: req.user.id })
        .then(folder => {
            if (!folder) return res.status(404).json({ error: 'Dossier introuvable' });
            folder.lastUsage = Date.now();
            folder.save();
            Upload.find({ folder: folder._id, mimetype: req.query.type || { $exists: true } })
                .sort({ _id: -1 })
                .then(uploads => res.json(uploads))
                .catch(error => res.json({ error }));
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



router.get('/u/:id', validateObjectId, (req, res) => {
    Upload.find({ _id: req.params.id })
        .then(upload => {
            if (!upload) return res.status(404).json({ error: 'Fichier non trouvé' });
            const filePath = path.join(__dirname, './../../cdn/' + upload[0].filename);
            if (fs.existsSync(filePath)) {
                res.sendFile(filePath);
            } else {
                res.redirect('/404');
            }
        })
        .catch(error => res.json({ error }));
});

router.get('/u/:id/download', validateObjectId, (req, res) => {
    Upload.find({ _id: req.params.id })
        .then(upload => {
            if (!upload) return res.status(404).json({ error: 'Fichier non trouvé' });
            const filePath = path.join(__dirname, './../../cdn/' + upload[0].filename);
            if (fs.existsSync(filePath)) {
                res.download(filePath, upload[0].originalname);
            } else {
                res.redirect('/404');
            }
        })
        .catch(error => res.json({ error }));
});

const sanitizeFilename = filename => {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
};

router.patch('/update/:id', authorize(), validateObjectId, (req, res) => {
    if (!req.body.displayname) return res.status(400).json({ error: 'Veuillez spéficier un nouveau nom' });
    Upload.find({ _id: req.params.id })
        .then(upload => {
            if (upload[0].modifiable === false)
                return res.status(401).json({
                    error: 'Ce fichiers est utilisé par un de vos Alumets, impossible de le modifié',
                });
            if (!upload) return res.status(404).json({ error: 'Fichier non trouvé' });
            upload[0].displayname = sanitizeFilename(req.body.displayname) + '.' + upload[0].mimetype;
            upload[0]
                .save()
                .then(() => res.json({ upload }))
                .catch(error => {
                    console.error(error);
                    res.status(500).json({ error });
                });
        })
        .catch(error => {
            console.error(error);
            res.status(500).json({ error });
        });
});

const accountUpload = multer({
    storage: storage,
    limits: {
        files: 50,
    },
});

router.post('/upload/:id', accountUpload.single('file'), async (req, res) => {
    try {
        let folder;
        if (req.params.id && mongoose.Types.ObjectId.isValid(req.params.id)) {
            folder = await Folder.findOne({
                _id: req.params.id,
                owner: req.user.id,
            });
        }

        if (req.file) {
            const ext = req.file.originalname.split('.').pop();
            const sanitizedFilename = sanitizeFilename(req.file.originalname);
            const upload = new Upload({
                filename: req.file.filename,
                displayname: sanitizedFilename,
                mimetype: ext.toLowerCase(),
                filesize: req.file.size,
                owner: req.user?.id || req.ip,
                folder: folder?._id || null,
            });
            await upload.save();
            res.json({ file: upload });
        } else {
            res.status(400).json({
                error: 'Une erreur inconnue est survenue ! x00',
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: "Une erreur est survenue lors de l'enregistrement du fichier",
        });
    }
});

router.get('/info/:id', validateObjectId, (req, res) => {
    Upload.findOne({ _id: req.params.id })
        .then(upload => {
            if (!upload) return res.status(404).json({ error: 'Fichier non trouvé' });
            res.json({ upload });
        })

        .catch(error => res.json({ error }));
});

router.delete('/:id', authorize(), validateObjectId, async (req, res) => {
    try {
        const upload = await Upload.find({ _id: req.params.id });
        if (!upload[0]) {
            return res.status(404).json({ error: 'Fichier non trouvé' });
        }
        if (!upload[0].modifiable) {
            return res.status(401).json({
                error: 'Ce fichier est utilisé par un de vos Alumet, impossible de le supprimer !',
            });
        }
        if (upload[0].owner.toString() !== req.user.id) {
            return res.status(401).json({
                error: "Vous n'avez pas les permissions pour effectuer cette action !",
            });
        }
        await upload[0].deleteOne();
        await Post.deleteMany({ file: req.params.id });
        fs.unlink(`./cdn/${upload[0].filename}`, err => {
            if (err) {
                console.error(err);
            }
        });
        return res.json({ success: 'Upload deleted' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
