const express = require('express');
const mongoose = require('mongoose');
const sanitizeHtml = require('sanitize-html');
const Flashcards = require('../../models/flashcards');
const Alumet = require('../../models/alumet');
const Account = require('../../models/account');
const rateLimit = require('../../middlewares/authentification/rateLimit');
const applicationAuthentication = require('../../middlewares/authentification/applicationAuthentication');
const { validate } = require('../../middlewares/validation/validate');
const schemas = require('../../schemas/api');
const flashcardGeneration = require('../openai/flashcards');

const router = express.Router();

const sanitizeOptions = {
    allowedTags: ['b', 'i', 'u', 'br', 'span'],
    allowedAttributes: {
        b: ['style'],
        i: ['style'],
        u: ['style'],
        span: ['style'],
    },
    allowedStyles: {
        span: {
            'background-color': [/^yellow$/],
        },
    },
};

const sanitizeCardHtml = value => sanitizeHtml(String(value || '').replace(/<div>/g, '<br>'), sanitizeOptions);

const buildFlashcardSetInfo = async (req, revisionMethod = 'sandbox') => {
    const flashcardSet = await Alumet.findById(req.params.id);
    if (!flashcardSet) return null;
    const owner = await Account.findById(flashcardSet.owner, 'username icon _id name lastname');
    const participants = [];
    for (const participant of flashcardSet.participants) {
        const participantUser = await Account.findById(participant.userId, 'username icon _id name lastname');
        if (participantUser) participants.push({ ...participantUser._doc, role: participant.role, status: participant.role });
    }
    const isAdmin = req.user && (req.user._id.toString() === flashcardSet.owner.toString() || flashcardSet.participants.some(p => p.userId === req.user._id.toString() && p.role === 'admin'));
    const flashcardSetInfo = { ...flashcardSet.toObject(), flashcards: [], owner, participants, user_infos: null, admin: isAdmin };
    if (req.user) flashcardSetInfo.user_infos = { username: req.user.username, icon: req.user.icon, name: req.user.name, lastname: req.user.lastname, id: req.user._id };
    const flashcards = await Flashcards.find({ flashcardSetId: flashcardSet._id }).sort({ dateCreated: -1 });

    for (let flashcard of flashcards) {
        let userDatas = flashcard.usersDatas.find(data => data.userId === req.user?.id) || {
            userId: req.user?.id,
            status: 0,
            lastReview: Date.now(),
            nextReview: new Date().setHours(new Date().getHours() - 3),
            inRow: 0,
        };
        flashcard = { ...flashcard.toObject(), userDatas };
        if (revisionMethod === 'smart') flashcard.userDatas.status = flashcard.userDatas.status === 3 ? 2 : flashcard.userDatas.status;
        delete flashcard.usersDatas;
        flashcardSetInfo.flashcards.push(flashcard);
    }

    return flashcardSetInfo;
};

router.get('/flashcard-sets/:id', validate(schemas.flashcardSet), applicationAuthentication(), rateLimit(60), async (req, res) => {
    const flashcardSet = await Alumet.findById(req.params.id);
    if (!flashcardSet) return res.status(404).json({ error: 'Flashcard set not found', code: 'NOT_FOUND' });
    return res.json({ flashcardSet });
});

router.get('/flashcard-sets/:id/cards', validate(schemas.flashcardSet), applicationAuthentication(), rateLimit(60), async (req, res) => {
    try {
        const flashcardSetInfo = await buildFlashcardSetInfo(req, req.query.mode || 'sandbox');
        if (!flashcardSetInfo) return res.status(404).json({ error: 'Flashcard set not found', code: 'NOT_FOUND' });
        return res.json({ flashcardSetInfo, redirect: false });
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.post('/flashcard-sets/:id/imports', validate(schemas.flashcardSet), rateLimit(10), applicationAuthentication(['admin']), async (req, res) => {
    try {
        const { content } = req.body;
        const flashcardSet = await Alumet.findById(req.params.id);
        if (!flashcardSet) return res.status(404).json({ error: 'Flashcard set not found', code: 'NOT_FOUND' });

        const flashcardsData = String(content || '')
            .split('!!!')
            .map(line => {
                const [question, answer] = line.split('$$$');
                if (!question || !answer) return null;
                return {
                    flashcardSetId: req.params.id,
                    question: sanitizeHtml(question, sanitizeOptions),
                    answer: sanitizeHtml(answer, sanitizeOptions),
                };
            })
            .filter(Boolean);

        const flashcards = await Promise.all(flashcardsData.map(flashcardData => new Flashcards(flashcardData).save()));
        return res.json({ flashcards });
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.put('/flashcard-sets/:id/cards', validate(schemas.flashcardSet), rateLimit(10), applicationAuthentication(['admin']), async (req, res) => {
    try {
        const flashcardSet = await Alumet.findById(req.params.id);
        if (!flashcardSet) return res.status(404).json({ error: 'Flashcard not found', code: 'NOT_FOUND' });

        const flashcardsData = await Promise.all(
            (req.body.flashcards || []).map(async flashcard => {
                let newFlashcard;
                if (flashcard._id && mongoose.Types.ObjectId.isValid(flashcard._id)) {
                    newFlashcard = await Flashcards.findById(flashcard._id);
                    if (!newFlashcard) return null;
                    newFlashcard.question = sanitizeCardHtml(flashcard.question);
                    newFlashcard.answer = sanitizeCardHtml(flashcard.answer);
                } else {
                    newFlashcard = new Flashcards({
                        flashcardSetId: req.params.id,
                        question: sanitizeCardHtml(flashcard.question),
                        answer: sanitizeCardHtml(flashcard.answer),
                    });
                }
                return newFlashcard.save();
            })
        );
        return res.json({ flashcards: flashcardsData.filter(Boolean) });
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.get('/flashcard-sets/:id/review-availability', validate(schemas.flashcardSet), rateLimit(10), applicationAuthentication(), async (req, res) => {
    try {
        const flashcardSet = await Alumet.findById(req.params.id);
        if (!flashcardSet) return res.status(404).json({ error: 'Flashcard not found', code: 'NOT_FOUND' });
        const flashcards = await Flashcards.find({ flashcardSetId: flashcardSet._id }).sort({ dateCreated: -1 });
        if (flashcards.length === 0) return res.json({ isSmartRevision: false });
        const isSmartRevision = flashcards.some(flashcard => !flashcard.usersDatas.some(data => data.userId === req.user.id)) || flashcards.some(flashcard => flashcard.usersDatas.find(data => data.userId === req.user.id)?.nextReview <= Date.now());
        return res.json({ isSmartRevision });
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.delete('/flashcard-sets/:id/cards/:cardId', validate(schemas.flashcardCardParams), rateLimit(30), applicationAuthentication(['admin']), async (req, res) => {
    try {
        const flashcard = await Flashcards.findById(req.params.cardId);
        if (!flashcard) return res.status(404).json({ error: 'Flashcard not found', code: 'NOT_FOUND' });
        await flashcard.delete();
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

function determineNextReview(inRowNumber) {
    const days = [1, 3, 5, 8, 13, 21, 34, 55];
    return inRowNumber < 8 ? Date.now() + 1000 * 60 * 60 * 24 * days[inRowNumber] : Date.now() + 1000 * 60 * 60 * 24 * days[7];
}

router.post('/flashcard-sets/:id/cards/:cardId/reviews', validate(schemas.flashcardReview), rateLimit(120), applicationAuthentication(), async (req, res) => {
    try {
        const { cardId } = req.params;
        const { status, cardReview } = req.body;
        const flashcard = await Flashcards.findById(cardId);
        if (!flashcard) return res.status(404).json({ error: 'Flashcard not found', code: 'NOT_FOUND' });
        let userDatas = flashcard.usersDatas.find(data => data.userId == req.user.id);
        if (!userDatas) userDatas = { nextReview: Date.now(), inRow: 0 };
        userDatas = {
            userId: req.user.id,
            status,
            lastReview: Date.now(),
            nextReview: cardReview ? determineNextReview(userDatas.inRow) : userDatas.nextReview,
            inRow: cardReview ? parseInt(userDatas.inRow + 1) : 0,
        };
        flashcard.usersDatas = flashcard.usersDatas.filter(data => data.userId !== req.user.id);
        flashcard.usersDatas.push(userDatas);
        await flashcard.save();
        return res.json({ userDatas });
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.delete('/flashcard-sets/:id/progress/me', validate(schemas.flashcardSet), rateLimit(60), applicationAuthentication(), async (req, res) => {
    try {
        const flashcards = await Flashcards.find({ flashcardSetId: req.params.id });
        for (const flashcard of flashcards) {
            let userDatas = flashcard.usersDatas.find(data => data.userId === req.user.id);
            if (userDatas) {
                userDatas.status = 0;
                userDatas.lastReview = Date.now();
                userDatas.nextReview = Date.now();
                userDatas.inRow = 0;
            } else {
                flashcard.usersDatas.push({ userId: req.user.id, status: 0, lastReview: Date.now(), nextReview: Date.now(), inRow: 0 });
            }
            await flashcard.save();
        }
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.use('/flashcard-generations', flashcardGeneration);

module.exports = router;
