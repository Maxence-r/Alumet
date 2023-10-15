const express = require('express');
const router = express.Router();
const FlashcardSet = require('../../models/flashcardSet');
const sendInvitations = require('../../middlewares/mailManager/sendInvitations');
const { default: mongoose } = require('mongoose');
const path = require('path');
const Flashcards = require('../../models/flashcards');
const Account = require('../../models/account');
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

router.get('/:id/content', async (req, res) => {
    try {
        const flashcardSet = await FlashcardSet.findById(req.params.id);
        if (!flashcardSet) return res.redirect('/404');
        Flashcards.find({ flashcardSetId: req.params.id }, (err, flashcards) => {
            if (err) return res.json({ err });
            const collaborators = [];
            const getCollaboratorInfo = async () => {
                for (const collaboratorId of flashcardSet.collaborators) {
                    const collaborator = await Account.findById(collaboratorId, 'username icon _id name lastname');
                    if (collaborator) {
                        collaborators.push(collaborator);
                    }
                }
            };
            getCollaboratorInfo().then(() => {
                Account.findById(req.user._id, (err, account) => {
                    if (err) return res.json({ err });
                    const users_info = account ? { username: account.username, icon: account.icon, name: account.name, lastname: account.lastname } : null;
                    const flashcardSetInfo = { ...flashcardSet.toObject(), flashcards, collaborators, users_info };
                    res.json(flashcardSetInfo);
                });
            });
        });
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});

module.exports = router;
