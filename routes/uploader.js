const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Upload = require('../models/upload');
const fs = require('fs');
const validateObjectId = require('../middlewares/validateObjectId');
const { supported } = require('../config.json');
const alumetAuth = require('../middlewares/api/alumetAuth');

// Set storage engine
const storage = multer.diskStorage({
    destination: './cdn',
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});

router.get('/supported', (req, res) => {
    res.json(supported);
});
  

router.get('/u/:id', validateObjectId, (req, res) => {
    Upload.find( { _id: req.params.id } )
    .then(upload => {
        if (!upload) return res.status(404).json({ error: 'Upload not found' });
        res.sendFile("./cdn/" + upload[0].filename, {root: './'});
    })
    .catch(error => res.json({ error }));
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
  
const accountUpload = multer({ 
  storage: storage, 
  limits: {
    files: 50
  }
});

router.post('/upload/guest', alumetAuth, upload.single('file'), (req, res) => {
  if (!req.auth) return res.status(401).json({ error: 'Unauthorized' });
  if (req.file) {
    const file = req.file;
    const ext = file.originalname.split('.').pop()
    const sanitizedFilename = sanitizeFilename(file.originalname);
    const upload = new Upload({
        filename: file.filename,
        displayname: sanitizedFilename,
        mimetype: ext,
        filesize: file.size,
        owner: req.cookies.alumetToken,
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
  if (req.logged == false) return res.status(401).json({ error: 'Unauthorized' });
  if (!req.body.displayname) return res.status(400).json({ error: 'Veuillez spéficier un nouveau nom' });
  if (req.body.displayname.length > 100) return res.status(400).json({ error: 'Nom trop long' });
  Upload.find( { _id: req.params.id } )
    .then(upload => {
        if (upload[0].modifiable == false) return res.status(401).json({ error: 'Ce fichiers est utilisé par un de vos Alumets, impossible de le modifié' });
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
    if (!req.logged) return res.status(401).json({ error: 'Unauthorized' });
    Upload.find( { owner: req.user.id } ).sort({ date: -1 })
    .then(uploads => {
        res.json({ uploads });
    })
});




  
router.post('/upload', accountUpload.array('files'), (req, res) => {
    if (req.logged == false || req.user === undefined) return res.status(401).json({ error: 'Unauthorized' });
    if (req.files && req.files.length > 0) {
      const files = req.files.map(file => {
        const ext = file.originalname.split('.').pop()
        const sanitizedFilename = sanitizeFilename(file.originalname);
        return {
          fieldname: file.fieldname,
          displayname: sanitizedFilename,
          encoding: file.encoding,
          mimetype: ext,
          filename: file.filename,
          size: file.size
        }
      });
      files.forEach(file => {
        console.log(file);
        const upload = new Upload({
            filename: file.filename,
            displayname: file.displayname,
            mimetype: file.mimetype,
            filesize: file.size,
            owner: req.user.id
        });
        upload.save()
            .then(() => console.log('Upload saved !' + file.filename))
            .catch(error => console.log(error));
        });
      res.json({ files: files })
    } else {
      if (req.fileValidationError) {
        res.status(400).json({ error: "Erreur inconnue: Trop de fichiers"})
      } else {
        res.status(400).json({ error: 'Please select at least one file to upload' })
      }
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

router.get('/delete/:id', validateObjectId, (req, res) => {
    if (req.logged == false) return res.status(401).json({ error: 'Unauthorized' });
    Upload.find( { _id: req.params.id } )
    .then(upload => {
        if (upload[0].modifiable == false) return res.status(401).json({ error: 'Ce fichiers est utilisé par un de vos Alumets, impossible de le supprimé' });
        if (!upload) return res.status(404).json({ error: 'Upload not found' });
        if (upload[0].owner != req.user.id) return res.status(401).json({ error: 'Unauthorized' });
        Upload.deleteOne( { _id: req.params.id } )
        .then(() => 
          res.json({ success: 'Upload deleted' }),
          fs.unlink("./cdn/" + upload[0].filename, (err) => {
            if (err) {
              console.error(err)
              return
            }
          })
        )
        .catch(error => res.json({ error }));
    })
    .catch(error => res.json({ error }));
});


module.exports = router;