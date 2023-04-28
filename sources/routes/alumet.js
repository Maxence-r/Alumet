const express = require('express');
const router = express.Router();
const Alumet = require('../models/alumet');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Upload = require('../models/upload');
const { authorizedModules } = require('../config.json');
const mongoose = require('mongoose');
const validateObjectId = require('../middlewares/validateObjectId');
const path = require('path');
const alumetItemsAuth = require('../middlewares/api/alumetItemsAuth');

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
  fileFilter: function (req, file, callback) {
    let ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return callback(new Error('Invalid file format'));
    }
    callback(null, true)
  }
});

router.post('/warn/multiple/:alumet', alumetItemsAuth, async (req, res) => {
  if (!req.logged || req.alumetObj.owner !== req.user._id.toString()) {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }
  global.io.emit(`warn-${req.user._id}`,req.params.alumet);
  res.json({
    message: 'Warned'
  });
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


router.post('/new/background', upload.single('background'), async (req, res) => {
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
    res.status(400).json({
      error: req.fileValidationError ? "Invalid file format" : 'Please select a file to upload'
    })
  }
});



const { supportedTemplate } = require('../config.json');
router.post('/new', async (req, res) => {
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
    if (req.body.name.includes('<') || req.body.description.includes('<')) {
        return res.status(400).json({
            error: 'Invalid characters'
        });
    }
    try {
       if (!(req.body.background in supportedTemplate)) {
        const upload = await Upload.findOne({
            _id: req.body.background
        });
        if (!upload || upload.owner != req.user.id ||upload.mimetype != 'png' && upload.mimetype != 'jpg' && upload.mimetype != 'jpeg' || upload.filesize > 3 * 1024 * 1024) {
            return res.status(404).json({error: 'Upload isn\'t valid'});
        }
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

router.patch('/update/:id', validateObjectId, async (req, res) => {
    req.body = req.body.body;
    if (!req.logged) {
        return res.status(401).json({
            error: 'Unauthorized'
        });
    }
    console.log(req.body.modules);
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
        const alumet = await Alumet.findOne({
            _id: req.params.id
        });
        if (!alumet) {
            return res.status(404).json({
                error: 'Alumet not found'
            });
        }
        if (alumet.owner != req.user.id) {
            return res.status(401).json({
                error: 'Unauthorized'
            });
        }
        if (!(req.body.background in supportedTemplate)) {
        if (req.body.background) {
            const upload = await Upload.findOne({
                _id: req.body.background
            });
            
              if (!upload || upload.owner != req.user.id ||upload.mimetype != 'png' && upload.mimetype != 'jpg' && upload.mimetype != 'jpeg' || upload.filesize > 3 * 1024 * 1024 ) {
                  return res.status(404).json({error: 'Upload isn\'t valid'});
              }
            }
        }
        if (req.body.background) {
          alumet.background = req.body.background;
        }
        alumet.password = req.body.password;
        alumet.name = req.body.name;
        alumet.modules = req.body.modules;
        alumet.blur = req.body.blur;
        alumet.brightness = req.body.brightness;
        alumet.lastUsage = Date.now();
        let saved = await alumet.save({ runValidators: true });
        res.json({
            saved
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: 'Failed to update alumet'
        });
    }
});


router.get('/all', async (req, res) => {
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
        if (req.cookies.alumetToken) {
          req.user = {_id: req.cookies.alumetToken}
        }
        res.json({
            finalAlumet,
            user: req.user
        });
    }).catch(error => {
        console.log(error);
        res.status(500).json({
            error: 'Failed to get alumet'
        });
    });
});




module.exports = router;