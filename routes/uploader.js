const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middlewares/checkLogin');
const Upload = require('../models/upload');

// Set storage engine
const storage = multer.diskStorage({
    destination: './cdn',
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});


router.get('/u/:id', (req, res) => {
    console.log(req.params.id);
    Upload.find( { _id: req.params.id } )
    .then(upload => {
        console.log(upload);
        if (!upload) return res.status(404).json({ error: 'Upload not found' });
        res.sendFile("./cdn/" + upload[0].filename, {root: './'});
    })
    .catch(error => res.json({ error }));
});

// Initialize multer upload object
const upload = multer({ 
    storage: storage, 
    limits: {
      fileSize: 50 * 1024 * 1024 
    }
});
  
const accountUpload = multer({ storage: storage});

router.post('/upload/guest', upload.array('files', 10), (req, res) => {
    if (req.files && req.files.length > 0) {
      const files = req.files.map(file => {
        return {
          fieldname: file.fieldname,
          displayname: file.displayname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          filename: file.filename,
          size: file.size
        }
      })
      res.json({ files: files })
    } else {
      if (req.fileValidationError) {
        res.status(400).json({ error: req.fileValidationError })
      } else {
        res.status(400).json({ error: 'Please select at least one file to upload' })
      }
    }
});


router.get('/files', auth, (req, res) => {
    if (req.logged == false) return res.status(401).json({ error: 'Unauthorized' });
    Upload.find( { owner: req.user.id } )
    .then(uploads => {
        res.json({ uploads });
    })
});



const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
}
  
router.post('/upload', auth, accountUpload.array('files', 50), (req, res) => {
    if (req.logged == false) return res.status(401).json({ error: 'Unauthorized' });
    if (req.files && req.files.length > 0) {
      const files = req.files.map(file => {
        const sanitizedFilename = sanitizeFilename(file.originalname);
        return {
          fieldname: file.fieldname,
          displayname: sanitizedFilename,
          encoding: file.encoding,
          mimetype: file.mimetype,
          filename: file.filename,
          size: file.size
        }
      });
      files.forEach(file => {
        const upload = new Upload({
            filename: file.filename,
            displayname: file.displayname,
            mimetype: file.mimetype,
            filesize: file.size,
            owner: req.user.id
        });
        upload.save()
            .then(() => console.log('Upload saved !'))
            .catch(error => console.log(error));
        });
      res.json({ files: files })
    } else {
      if (req.fileValidationError) {
        res.status(400).json({ error: req.fileValidationError })
      } else {
        res.status(400).json({ error: 'Please select at least one file to upload' })
      }
    }
});
  
module.exports = router;