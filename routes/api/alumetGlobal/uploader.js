const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Upload = require('../../../models/upload');
const fs = require('fs');
const validateObjectId = require('../../../middlewares/modelsValidation/validateObjectId');
const { supported } = require('../../../config.json');
const anonymeAuthentification = require('../../../middlewares/authentification/anonymeAuthentification');
const { supportedTemplate } = require('../../../config.json');
const Post = require('../../../models/post');
const Folder = require('../../../models/folder');

const storage = multer.diskStorage({
    destination: './cdn',
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});

router.get('/supported', (req, res) => {
    res.json(supported);
});
  

router.post('/folder/create', (req, res) => {
  if (!req.connected) return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
  const folder = new Folder({
    name: req.body.name,
    owner: req.user.id
  });
  folder.save()
    .then(folder => res.status(201).json(folder))
    .catch(error => res.json({ error }));
});

router.get('/folder/list', (req, res) => {
  if (!req.connected) return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
  Folder.find({ owner: req.user.id }).sort({ lastUsage: -1 })
    .then(folders => res.json(folders))
    .catch(error => res.json({ error }));
});
router.delete('/folder/delete/:id', validateObjectId, (req, res) => {
  if (!req.connected) return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
  Folder.findOne({ _id: req.params.id, owner: req.user.id })
    .then(folder => {
      if (folder.name === "system") return res.status(403).json({ error: 'Vous n\'avez pas la permission de modifier un dossier système !' });
      if (!folder) return res.status(404).json({ error: 'Dossier introuvable' });
      folder.remove()
      res.json(folder);
    })
    .catch(error => res.json({ error }));
});

router.post('/folder/rename/:id', anonymeAuthentification, validateObjectId, (req, res) => {
  if (!req.connected) return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
  Folder.findOne({ _id: req.params.id, owner: req.user.id })
    .then(folder => {
      if (folder.name === "system") return res.status(403).json({ error: 'Vous n\'avez pas la permission de modifier un dossier système !' });
      if (!folder) return res.status(404).json({ error: 'Dossier introuvable' });
      if (!req.body.name) return res.status(400).json({ error: 'Veuillez spéficier un nouveau nom' });
      folder.name = req.body.name;
      folder.save();
      res.json(folder);
    })
    .catch(error => res.json({ error }));
});


router.get('/folder/:id', validateObjectId, (req, res) => {
  if (!req.connected) return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
  Folder.findOne({ _id: req.params.id, owner: req.user.id })
    .then(folder => {
      if (!folder) return res.status(404).json({ error: 'Dossier introuvable' });
      Upload.find({ folder: folder._id }).sort({ _id: -1 })
        .then(uploads => res.json(uploads))
        .catch(error => res.json({ error }));
    })
    .catch(error => res.json({ error }));
});

router.get('/u/:id', validateObjectId, (req, res) => {
  if (Object.prototype.hasOwnProperty.call(supportedTemplate, req.params.id)) {
    res.sendFile(path.join(__dirname, supportedTemplate[req.params.id]));
  } else {
    Upload.find({ _id: req.params.id })
      .then(upload => {
        if (!upload) return res.status(404).json({ error: 'Upload not found' });
        const filePath = path.join(__dirname, "./../cdn/" + upload[0].filename);
        if (fs.existsSync(filePath)) {
          res.sendFile(filePath);
        } else {
          res.redirect('/404')
        }
      })
      .catch(error => res.json({ error }));
  }
});

const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

const upload = multer({ 
    storage: storage, 
    limits: {
      fileSize: 50 * 1024 * 1024,
      files: 10
    }
});
  


router.post('/upload/guest', anonymeAuthentification, upload.single('file'), (req, res) => {
  if (!req.auth) return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
  if (req.file) {
    const file = req.file;
    const ext = file.originalname.split('.').pop()
    const sanitizedFilename = sanitizeFilename(file.originalname);
    const upload = new Upload({
        filename: file.filename,
        displayname: sanitizedFilename,
        mimetype: ext.toLowerCase(),
        filesize: file.size,
        owner: req.cookies.alumetToken,
        date: Date.now()
    });
    upload.save()
        .then((file) => res.json({ file: file }))
        .catch(error => console.log(error));
  } else {
    if (req.fileValidationError) {
      res.status(400).json({ error: req.fileValidationError });
    } else {
      res.status(400).json({ error: 'Please select a file to upload' });
    }
  }
});



router.patch('/update/:id', validateObjectId, (req, res) => {
  if (req.connected === false) return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
  if (!req.body.displayname) return res.status(400).json({ error: 'Veuillez spéficier un nouveau nom' });
  Upload.find( { _id: req.params.id } )
    .then(upload => {
        if (upload[0].modifiable === false) return res.status(401).json({ error: 'Ce fichiers est utilisé par un de vos Alumets, impossible de le modifié' });
        if (!upload) return res.status(404).json({ error: 'Upload not found' });
        upload[0].displayname = sanitizeFilename(req.body.displayname)+ "." + upload[0].mimetype;
        upload[0].save()
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




router.get('/files', (req, res) => {
    if (!req.connected) return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
    Upload.find( { owner: req.user.id } ).sort({ date: -1 })
    .then(uploads => {
        res.json({ uploads });
    })
});


const accountUpload = multer({ 
  storage: storage, 
  limits: {
    files: 50
  }
});


router.post('/upload/:id', validateObjectId, accountUpload.single('file'), (req, res) => {
  if (req.connected === false || req.user === undefined) {
    return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
  }
  if (req.params.id) {
    Folder.findOne({ _id: req.params.id, owner: req.user.id })
      .then(folder => {
        if (!folder) return res.status(404).json({ error: 'Dossier introuvable' });
        if (folder.name === "system") return res.status(403).json({ error: 'Vous n\'avez pas la permission d\'envoyer des fichiers ici ! Créer un nouveau dossier.' });

        if (req.file) {
          const ext = req.file.originalname.split('.').pop();
          const sanitizedFilename = sanitizeFilename(req.file.originalname);
          const upload = new Upload({
            filename: req.file.filename,
            displayname: sanitizedFilename,
            mimetype: ext.toLowerCase(),
            filesize: req.file.size,
            owner: req.user.id,
            folder: req.params.id
          });
      
          upload.save()
            .then(() => {
              res.json({ file: upload });
            })
            .catch(error => {
              console.log(error);
              res.status(500).json({ error: 'Une erreur est survenue lors de l\'enregistrement du fichier' });
            });
        } else {
          res.status(400).json({ error: 'Une erreur inconnue est survenue !' });
        }

      })
      .catch(error => res.status(500).json({ error: error.message }));
  } else {
    res.status(400).json({ error: 'Une erreur inconnue est survenue !' });
  }
});


router.get('/info/:id', validateObjectId, (req, res) => {
    Upload.find( { _id: req.params.id } )
    .then(upload => {
        if (!upload) return res.status(404).json({ error: 'Upload not found' });
        response = upload[0];
        res.json({ response });
    })
    .catch(error => res.json({ error }));
});

router.delete('/:id', validateObjectId, async (req, res) => {
  console.log(req.params.id);
  try {
    const upload = await Upload.find({ _id: req.params.id })
    if (!upload[0]) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    if (req.connected === false) {
      return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
    }
    console.log(upload[0].modifiable);
    if (!upload[0].modifiable) {
      return res.status(401).json({ error: 'Ce fichier est utilisé par un de vos Alumet, impossible de le supprimer !' });
    }
    if (upload[0].owner.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Vous n\'avez pas les permissions pour effectuer cette action !' });
    }
    await upload[0].deleteOne();
    await Post.deleteMany({ typeContent: req.params.id });
    fs.unlink(`./cdn/${upload[0].filename}`, (err) => {
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

router.get('/templates', (req, res) => {
  res.json({ templates: supportedTemplate });
});



module.exports = router;