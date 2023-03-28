const express = require('express');
const router = express.Router();
const Alumet = require('../models/alumet');
const auth = require('../middlewares/auth');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: './cdn',
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 1,
    },
    fileFilter: function (req, file, callback) {
      var ext = path.extname(file.originalname);
      if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
          return callback(new Error('Only images are allowed'))
      }
      callback(null, true)
    }
});


router.post('/new', auth, async (req, res) => {
  console.log(req.body);
    upload.single('background');
    if (req.fileValidationError) {
        return res.status(400).send({ error: req.fileValidationError });
    } else {
      res.status(200).json({ success: true });
    }
});

module.exports = router;