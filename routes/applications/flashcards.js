const express = require('express');
const router = express.Router();
const FlashcardSet = require('../../models/flashcardSet');
const sendInvitations = require('../../middlewares/mailManager/sendInvitations');
const { default: mongoose } = require('mongoose');
const path = require('path');
const Flashcards = require('../../models/flashcards');
const Account = require('../../models/account');
const authorize = require('../../middlewares/authentification/authorize');
router.put('/set', authorize(), async (req, res) => {
    try {
        const { title, description, subject, isPublic, flashcardSetId } = req.body;
        let flashcardSet;
        if (flashcardSetId) {
            flashcardSet = await FlashcardSet.findById(flashcardSetId);
            if (flashcardSet.owner.toString() !== req.user._id.toString() && !flashcardSet.collaborators.includes(req.user?.id)) return res.json({ error: 'Unauthorized' });
            if (!flashcardSet) return res.redirect('/404');
            flashcardSet.title = title;
            flashcardSet.description = description;
            flashcardSet.isPublic = isPublic;
        } else {
            flashcardSet = new FlashcardSet({
                owner: req.user._id,
                title,
                description,
                subject,
                isPublic,
            });
        }
        await flashcardSet.save();
        if (!flashcardSetId) {
            sendInvitations(req, res, 'flashcards', flashcardSet._id);
        }
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

router.get('/:flashcard/content', async (req, res) => {
    try {
        const flashcardSet = await FlashcardSet.findById(req.params.flashcard);
        if (!flashcardSet) return res.redirect('/404');
        Flashcards.find({ flashcardSetId: req.params.id }, async (err, flashcards) => {
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
            await getCollaboratorInfo();
            const user_infos = req.user ? { username: req.user.username, icon: req.user.icon, name: req.user.name, lastname: req.user.lastname } : null;
            const isAdmin = req.user && (req.user._id.toString() === flashcardSet.owner.toString() || flashcardSet.collaborators.includes(req.user._id.toString()));
            const flashcardSetInfo = { ...flashcardSet.toObject(), flashcards, collaborators, user_infos, admin: isAdmin };
            res.json(flashcardSetInfo);
        });
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});

/* router.put('/:id/flashcard', authorize(), async (req, res) => { */

module.exports = router;
