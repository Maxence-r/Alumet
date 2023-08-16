const express = require('express');
const router = express.Router();
const flashCardSet = require('../../models/flashcardSet');
const Account = require('../../models/account');
const path = require('path');
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');

router.get('/', async (req, res) => {
    if (!req.connected) return res.redirect('/auth/signin');
    const filePath = path.join(__dirname, '../../views/pages/applications/mindFlash.html');
    res.sendFile(filePath);
});



router.get('/:id', validateObjectId, async (req, res) => {
    flashCardSet.findOne({ _id: req.params.id })
        .then(flashCardSet => {
            if (!flashCardSet) return res.redirect('/404');
            const filePath = path.join(__dirname, '../../views/pages/applications/mindFlash.html');
            res.sendFile(filePath);
        })
        .catch(error => res.json({ error }));
});

router.get('/edit/:id', validateObjectId, async (req, res) => {
    flashCardSet.findOne({ _id: req.params.id })
        .then(flashCardSet => {
            if (!flashCardSet) return res.redirect('/404');
            if(flashCardSet.owner != req.user._id) return res.redirect(`/mindFlash/${req.params.id}`);
            const filePath = path.join(__dirname, '../../views/pages/applications/mindFlashEditor.html');
            res.sendFile(filePath);
        })
        .catch(error => res.json({ error }));
});

router.post('/create', (req, res) => {
    const newFlashCardSet = new flashCardSet();
    newFlashCardSet.owner = req.user._id;
    newFlashCardSet.title = req.body.title;
    newFlashCardSet.description = req.body.description;
    newFlashCardSet.subject = req.body.subject;
    newFlashCardSet.lastUsage = Date.now();
    newFlashCardSet.save((err, flashCardSet) => {
        if (err) {
            return res.status(500).json({error: 'Une erreur est survenue lors de la création de votre set de flashcards'});
        }   
        return res.status(201).json({flashCardSet});
    });

});




module.exports = router;