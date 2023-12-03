const express = require('express');
const router = express.Router();

const sendInvitations = require('../../../middlewares/mailManager/sendInvitations');
const { default: mongoose } = require('mongoose');
const path = require('path');
const Flashcards = require('../../../models/flashcards');
const Alumet = require('../../../models/alumet');
const Account = require('../../../models/account');
const authorize = require('../../../middlewares/authentification/authorize');
const Flashcard = require('../../../models/flashcards');



router.get('/revise/sandbox/:flashcard', async (req, res) => {
    try {
        console.log('sandbox')
        if (mongoose.Types.ObjectId.isValid(req.params.flashcard) === false) return res.redirect('/404');
        const flashcardSet = await Alumet.findById(req.params.flashcard);
        if (!flashcardSet) return res.redirect('/404');
        const filePath = path.join(__dirname, '../../../views/pages/applications/flashcards/sandbox.html');
        res.sendFile(filePath);
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});

router.get('/revise/smart/:flashcard', async (req, res) => {
    try {
        if (mongoose.Types.ObjectId.isValid(req.params.flashcard) === false) return res.redirect('/404');
        const flashcardSet = await Alumet.findById(req.params.flashcard);
        if (!flashcardSet) return res.redirect('/404');
        const filePath = path.join(__dirname, '../../../views/pages/applications/flashcards/smart.html');
        res.sendFile(filePath);
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});

router.get('/:flashcardSet/:revisionMethod/content', async (req, res) => {
    try {
        const flashcardSet = await Alumet.findById(req.params.flashcardSet);
        if (!flashcardSet) return res.redirect('/404');
        const owner = await Account.findById(flashcardSet.owner, 'username icon _id name lastname');
        const participants = [];
        const getParticipantInfo = async () => {
            for (const participant of flashcardSet.participants) {
                const participantUser = await Account.findById(participant.userId, 'username icon _id name lastname');
                if (participantUser) {
                    participants.push({ ...participantUser._doc, status: participant.status });
                }
            }
        };
        await getParticipantInfo();
        const isAdmin = req.user && (req.user._id.toString() === flashcardSet.owner.toString() || flashcardSet.participants.some(p => p.userId === req.user._id.toString() && [0, 1].includes(p.status)));
        const flashcardSetInfo = { ...flashcardSet.toObject(), flashcards: [], owner, participants, user_infos: null, admin: isAdmin };
        if (req.user) {
            flashcardSetInfo.user_infos = { username: req.user.username, icon: req.user.icon, name: req.user.name, lastname: req.user.lastname, id: req.user._id };
        }
        const flashcards = await Flashcard.find({ flashcardSetId: flashcardSet._id }).sort({ dateCreated: -1 });
        for (const flashcard of flashcards) {
            const userDatas = flashcard.userDatas.find((data) => data.userId === req.user?.id) || { userId: req.user?.id, status: 0, lastReview: Date.now() };
            const smartReview = userDatas?.smartReview || { nextReview: null, inRow: 0 };
            userDatas.smartReview = smartReview;
            let flashcardInfo = { ...flashcard.toObject(), userDatas: userDatas };
            if (req.params.revisionMethod == 'smart' && smartReview.nextReview <= Date.now()) {
                flashcardInfo.userDatas = userDatas || { status: 0, lastReview: Date.now(), smartReview };
                flashcardSetInfo.flashcards.push(flashcardInfo);
            } else if (req.params.revisionMethod !== 'smart') {
                flashcardSetInfo.flashcards.push(flashcardInfo);
            }
        }
        res.json(flashcardSetInfo);
    }
    catch (error) {
        console.log(error);
        res.json({ error });
    }
});

router.post('/:flashcardSet/check', authorize(''), async (req, res) => {
    try {
        const { flashcardSetId, flashcards } = req.body;
        const flashcardSet = await Alumet.findById(flashcardSetId);
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

router.delete('/:flashcard/:flashcardId', authorize(''), async (req, res) => {
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
        let userDatas = flashcard.userDatas.find((data) => data.userId === req.user.id);

        if (!userDatas) {
            console.log('new user data')
            userDatas = { userId: req.user.id, status, lastReview: Date.now(), smartReview: { nextReview: null, inRow: 0 } };
            flashcard.userDatas.push(userDatas);
        } else {
            userDatas.status = status;
            userDatas.lastReview = Date.now();
            userDatas.smartReview = cardReview ? determineSmartReview(userDatas.smartReview) : userDatas.smartReview;
            console.log(userDatas.smartReview)
        }
        flashcard.userDatas = flashcard.userDatas.filter((data) => data.userId !== req.user.id);
        flashcard.userDatas.push(userDatas);
        await flashcard.save();
        res.json({ smartReview: userDatas.smartReview });
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});
router.post('/reset', async (req, res) => {
    try {
        const { flashcardSetId } = req.body;
        const flashcards = await Flashcards.find({ flashcardSetId });
        for (const flashcard of flashcards) {
            flashcard.userDatas = [];
            await flashcard.save();
        }
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
}
);

module.exports = router;
