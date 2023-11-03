const express = require('express');
const router = express.Router();
const FlashcardSet = require('../../models/flashcardSet');
const sendInvitations = require('../../middlewares/mailManager/sendInvitations');
const { default: mongoose } = require('mongoose');
const path = require('path');
const Flashcards = require('../../models/flashcards');
const Account = require('../../models/account');
const authorize = require('../../middlewares/authentification/authorize');
const Flashcard = require('../../models/flashcards');
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

router.put('/collaborators/:flashcard', authorize('flashcard', 'itemAdmins'), async (req, res) => {
    sendInvitations(req, res, 'flashcards', req.params.flashcard);
    res.json({ success: true });
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

router.get('/revise/sandbox/:flashcard', async (req, res) => {
    try {
        if (mongoose.Types.ObjectId.isValid(req.params.flashcard) === false) return res.redirect('/404');
        const flashcardSet = await FlashcardSet.findById(req.params.flashcard);
        if (!flashcardSet) return res.redirect('/404');
        const filePath = path.join(__dirname, '../../views/pages/applications/flashcards/sandbox.html');
        res.sendFile(filePath);
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});

router.get('/revise/smart/:flashcard', async (req, res) => {
    try {
        if (mongoose.Types.ObjectId.isValid(req.params.flashcard) === false) return res.redirect('/404');
        const flashcardSet = await FlashcardSet.findById(req.params.flashcard);
        if (!flashcardSet) return res.redirect('/404');
        const filePath = path.join(__dirname, '../../views/pages/applications/flashcards/smart.html');
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
        const flashcards = await Flashcard.find({ flashcardSetId: flashcardSet._id }).sort({ dateCreated: -1 });
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
        const isAdmin = req.user && (req.user._id.toString() === flashcardSet.owner.toString() || flashcardSet.collaborators.includes(req.user._id.toString()));
        const flashcardSetInfo = { ...flashcardSet.toObject(), flashcards: [], collaborators, user_infos: null, admin: isAdmin };
        for (const flashcard of flashcards) {
            const userData = flashcard.userDatas.find((data) => data.userId === req.user?.id) || { status: 0, lastReview: Date.now() };
            const flashcardInfo = { ...flashcard.toObject(), userDatas: userData };
            flashcardSetInfo.flashcards.push(flashcardInfo);
        }
        if (req.user) {
            flashcardSetInfo.user_infos = { username: req.user.username, icon: req.user.icon, name: req.user.name, lastname: req.user.lastname, id: req.user._id };
        }
        res.json(flashcardSetInfo);
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});

router.put('/:flashcard/', authorize('flashcard', 'itemAdmins'), async (req, res) => {
    try {
        const { question, answer, flashcardId } = req.body;
        console.log(req.body);
        let flashcard;
        if (flashcardId && mongoose.Types.ObjectId.isValid(flashcardId)) {
            flashcard = await Flashcards.findById(flashcardId);
            if (!flashcard) return res.json({ error: 'Flashcard not found' });
            flashcard.question = question;
            flashcard.answer = answer;
        } else {
            flashcard = new Flashcards({
                flashcardSetId: req.params.flashcard,
                question,
                answer,
                flashcardSetId: req.params.flashcard,
            });
        }
        await flashcard.save();
        res.json({ flashcard });
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});

router.delete('/:flashcard/:flashcardId', authorize('flashcard', 'itemAdmins'), async (req, res) => {
    try {
        const flashcard = await Flashcards.findById(req.params.flashcardId);
        if (!flashcard) return res.json({ error: 'Flashcard not found' });
        await flashcard.delete();
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});

router.post('/:flashcard/:flashcardId/review', authorize(), async (req, res) => {
    try {
        const flashcard = await Flashcards.findById(req.params.flashcardId);
        if (!flashcard) return res.json({ error: 'Flashcard not found' });
        const userData = flashcard.userDatas.find((data) => data.userId === req.user.id);
        if (!userData) {
            flashcard.userDatas.push({ userId: req.user.id, status: req.body.status, lastReview: Date.now() });
        } else {
            userData.status = req.body.status;
            userData.lastReview = Date.now();
        }
        await flashcard.save();
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});




module.exports = router;
