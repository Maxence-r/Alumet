const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Alumet = require('../../models/alumet');
const Invitation = require('../../models/invitation');
const config = require('../../config/env');
const applicationAuthentication = require('../../middlewares/authentification/applicationAuthentication');
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');

const router = express.Router();

const sendPage = (res, relativePath) => res.sendFile(path.join(config.paths.pages, relativePath));

router.get(['/login', '/auth/signin'], (req, res) => {
    if (req.connected) return res.redirect('/dashboard');
    return sendPage(res, 'authentification/signin.html');
});

router.get(['/register', '/auth/signup'], (req, res) => {
    if (req.connected) return res.redirect('/dashboard');
    return sendPage(res, 'authentification/signup.html');
});

router.get('/dashboard', (req, res) => {
    if (!req.connected) return res.redirect('/login');
    return sendPage(res, req.user.accountType === 'student' ? 'dashboard/student.html' : 'dashboard/professor.html');
});

router.get(['/alumets/new', '/flashcards/new', '/mindmaps/new'], (req, res) => {
    if (!req.connected) return res.redirect('/login');
    return sendPage(res, 'new-app.html');
});

router.get('/alumets/:id/join', validateObjectId, async (req, res) => {
    const alumet = await Alumet.findById(req.params.id);
    if (!alumet) return res.redirect('/404');
    return sendPage(res, 'authentification/authentication.html');
});

router.get('/alumets/:id', validateObjectId, applicationAuthentication(), async (req, res) => sendPage(res, 'alumet.html'));

router.get('/flashcards/:id', validateObjectId, applicationAuthentication(), async (req, res) => sendPage(res, 'applications/flashcards.html'));

router.get('/mindmaps/:id', validateObjectId, applicationAuthentication(), async (req, res) => sendPage(res, 'applications/mindmap.html'));

router.get('/flashcards/:id/review/:mode', applicationAuthentication(), async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || !['sandbox', 'smart'].includes(req.params.mode)) {
        return res.redirect('/404');
    }

    const flashcardSet = await Alumet.findById(req.params.id);
    if (!flashcardSet) return res.redirect('/404');
    return sendPage(res, `applications/flashcards/${req.params.mode}.html`);
});

router.get('/invitations/:id', validateObjectId, async (req, res) => {
    if (!req.user || !req.user.mail) {
        return res.redirect('/login');
    }

    const invitation = await Invitation.findOne({ reference: req.params.id, mail: req.user.mail });
    if (!invitation) return res.redirect('/404');
    return sendPage(res, 'invitation.html');
});

router.get('/files/:id', validateObjectId, (req, res) => sendPage(res, 'viewer.html'));

router.get('/legal/terms', (req, res) => res.sendFile(path.join(config.paths.views, 'assets/legal/tos.pdf')));
router.get('/legal/privacy', (req, res) => res.sendFile(path.join(config.paths.views, 'assets/legal/pp.pdf')));

module.exports = router;
