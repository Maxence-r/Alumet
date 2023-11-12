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
        console.log('sandbox')
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

router.get('/:flashcardSet/:revisionMethod/content', async (req, res) => {
    try {
        const flashcardSet = await FlashcardSet.findById(req.params.flashcardSet);
        if (!flashcardSet) return res.redirect('/404');
        const owner = await Account.findById(flashcardSet.owner, 'username icon _id name lastname');
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
        const flashcardSetInfo = { ...flashcardSet.toObject(), flashcards: [], owner, collaborators, user_infos: null, admin: isAdmin };
        if (req.user) {
            flashcardSetInfo.user_infos = { username: req.user.username, icon: req.user.icon, name: req.user.name, lastname: req.user.lastname, id: req.user._id };
        }

        const flashcards = await Flashcard.find({ flashcardSetId: flashcardSet._id }).sort({ dateCreated: -1 });
        switch (req.params.revisionMethod) {
            case 'sandbox':
                for (const flashcard of flashcards) {
                    const userDatas = flashcard.userDatas.find((data) => data.userId === req.user?.id) || { userId: req.user?.id, status: 0, lastReview: Date.now() };
                    const flashcardInfo = { ...flashcard.toObject(), userDatas: userDatas };
                    flashcardSetInfo.flashcards.push(flashcardInfo);
                }
                break;
            case 'smart':
                for (const flashcard of flashcards) {
                    const userDatas = flashcard.userDatas.find((data) => data.userId === req.user?.id) || { userId: req.user?.id, status: 0, lastReview: Date.now() };
                    const smartReview = userDatas?.smartReview || { nextReview: null, inRow: 0 };
                    userDatas.smartReview = smartReview;
                    if (smartReview.nextReview === null || smartReview.nextReview <= Date.now()) {
                        const flashcardInfo = { ...flashcard.toObject(), userDatas: userDatas || { status: 0, lastReview: Date.now(), smartReview } };
                        flashcardSetInfo.flashcards.push(flashcardInfo);    
                    }
                }
                break;
            default:
                break;
        }
        res.json(flashcardSetInfo);
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});

router.post('/:flashcardSet/check', authorize('flashcard', 'itemAdmins'), async (req, res) => {
    try {
        const { flashcardSetId, flashcards } = req.body;
        const flashcardSet = await FlashcardSet.findById(flashcardSetId);
        if (!flashcardSet) return res.json({ error: 'Flashcard not found' });
        const flashcardsData = [];
        for (let flashcard of flashcards) {
            let newFlashcard;
            if (flashcard._id && mongoose.Types.ObjectId.isValid(flashcard._id)) {
                newFlashcard = await Flashcards.findById(flashcard._id);
                if (!flashcard) return res.json({ error: 'Flashcard not found' });
                newFlashcard.question = flashcard.question;
                newFlashcard.answer = flashcard.answer;
            } else {
                newFlashcard = new Flashcards({
                    flashcardSetId: flashcardSetId,
                    question: flashcard.question,
                    answer: flashcard.answer,
                });
            }
            await newFlashcard.save();
            flashcardsData.push(newFlashcard);
        }
        res.json({ flashcards: flashcardsData });
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

function determineSmartReview(smartReview) {
    const nextDate = {
        0: Date.now() + 1000 * 60 * 60 * 24,
        1: Date.now() + 1000 * 60 * 60 * 24 * 3,
        2: Date.now() + 1000 * 60 * 60 * 24 * 7,
        3: Date.now() + 1000 * 60 * 60 * 24 * 15,
        4: Date.now() + 1000 * 60 * 60 * 24 * 30,
    };
    smartReview.nextReview = smartReview.inRow < 3 ? nextDate[smartReview.inRow] : nextDate[4];
    smartReview.inRow = smartReview.inRow + 1;
    return smartReview;
}
router.post('/:flashcardSet/:flashcardId/review', authorize(), async (req, res) => {
    try {
        const { flashcardId } = req.params;
        const { status, cardReview } = req.body;
        const flashcard = await Flashcards.findById(flashcardId);
        if (!flashcard) return res.json({ error: 'Flashcard not found' });
        const userDatas = flashcard.userDatas.find((data) => data.userId === req.user.id);

        if (!userDatas) {
            console.log('here')
            flashcard.userDatas.push({ userId: req.user.id, status: req.body.status, lastReview: Date.now(), smartReview: cardReview ? determineSmartReview(userDatas.smartReview || { nextReview: null, inRow: 0 }) : { nextReview: null, inRow: 0 } });
        } else {
            userDatas.status = status;
            userDatas.lastReview = Date.now();
            userDatas.smartReview = cardReview ? determineSmartReview(userDatas.smartReview) : userDatas.smartReview;
        }
        await flashcard.save();
        console.log(userDatas.smartReview);
        res.json({ smartReview: userDatas.smartReview });
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});

module.exports = router;
