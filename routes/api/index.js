const express = require('express');
const { generateOpenApiDocument } = require('../../schemas/openapi');
const auth = require('./auth');
const alumets = require('./alumets');
const flashcards = require('./flashcards');
const files = require('./files');
const misc = require('./misc');
const { csrfTokenRoute } = require('../../middlewares/security/csrf');

const router = express.Router();

router.get('/csrf-token', csrfTokenRoute);
router.get('/openapi.json', (req, res) => res.json(generateOpenApiDocument()));

router.use(auth);
router.use(alumets);
router.use(flashcards);
router.use(files);
router.use(misc);

module.exports = router;
