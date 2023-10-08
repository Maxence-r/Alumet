const express = require('express');
const router = express.Router();
const FlashcardSet = require('../../models/flashcardSet');
const sendInvitations = require('../../middlewares/mailManager/sendInvitations');
const { default: mongoose } = require('mongoose');
const path = require('path');
router.post('/set', async (req, res) => {
    try {
        const { name, description, subject, isPublic } = req.body;
        const flashcardSet = new FlashcardSet({
            owner: req.user._id,
            title: name,
            description,
            subject,
            isPublic,
        });
        await flashcardSet.save();
        sendInvitations(req, res, 'flashcards', flashcardSet._id);
        res.json({ flashcardSet });
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});

router.get('/:id', async (req, res) => {
    try {
        if (mongoose.Types.ObjectId.isValid(req.params.id) === false) return res.redirect('/404');
        const flashcardSet = await FlashcardSet.findById(req.params.id);
        if (!flashcardSet) return res.redirect('/404');
        const filePath = path.join(__dirname, '../../views/pages/applications/flashcards.html');
        res.sendFile(filePath);
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});

module.exports = router;
