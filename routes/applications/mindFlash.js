const express = require('express');
const router = express.Router();
const flashCardSet = require('../../models/flashcardSet');
const flashcard = require('../../models/flashcard');
const Account = require('../../models/account');
const path = require('path');
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');
const { use } = require('node-vibrant');
const { type } = require('os');
const { stat } = require('fs');

router.get('/', async (req, res) => {
    if (!req.connected) return res.redirect('/auth/signin');
    const filePath = path.join(__dirname, '../../views/pages/applications/mindFlash.html');
    res.sendFile(filePath);
});

router.post('/create', (req, res) => {
    const newFlashCardSet = new flashCardSet();
    newFlashCardSet.owner = req.user._id;
    newFlashCardSet.title = req.body.title;
    newFlashCardSet.description = req.body.description;
    newFlashCardSet.subject = req.body.subject;
    newFlashCardSet.lastUsage = Date.now();
    newFlashCardSet.participants = [req.user._id];
    newFlashCardSet.numberOfFlashcards = 0;
    newFlashCardSet.save((err, flashCardSet) => {
        if (err) {
            return res.status(500).json({error: 'Une erreur est survenue lors de la création de votre set de flashcards'});
        }   
        return res.status(201).json({flashCardSet});
    });
});

router.post('/flashcard/create', async (req, res) => {
    const { flashcardSetId, question, answer } = req.body;
    const flashcardSet = await flashCardSet.findById(flashcardSetId);
    const newFlashcard = new flashcard({ flashcardSetId, question, answer, status: [], numberOfGood: [], lastReview: [], nextReview: [] });
    try {
        await newFlashcard.save();
        flashcardSet.numberOfFlashcards++;
        await flashcardSet.save();
        return res.status(201).json({ flashcard: newFlashcard });
    } catch (err) {
        return res.status(500).json({ error: 'Une erreur est survenue lors de la création de votre flashcard' });
    }
});

function extractFlashcardUserInfo(flashCard, userId, infoSearch) {
    if (!flashCard[infoSearch]) return null;
    switch (infoSearch) {
        case 'status':
            return 
        case 'numberOfGood':
            return flashCard.numberOfGood.find(object => object.userId.toString() === userId);
        case 'lastReview':
            return flashCard.lastReview.find(object => object.userId.toString() === userId);
        case 'nextReview':
            return flashCard.nextReview.find(object => object.userId.toString() === userId);
        default:
            return null;
    }
}
router.get('/:flashcardSetId', validateObjectId, async (req, res) => {
    try {
        const flashcardSet = await flashCardSet.findById(req.params.flashcardSetId);
        if (!flashcardSet) return res.status(404).json({error: "Ce set de flashcards n'existe pas"});
        const flashcards = await flashcard.find({flashcardSetId: req.params.flashcardSetId});
        const flashcardsInfo = flashcards.map(flashcard => {
            const flashcardInfo = {}; 
            flashcardInfo.question = flashcard.question;
            flashcardInfo.answer = flashcard.answer;
            // Not working yet here, doesn't find the status.
            flashcardInfo.status = flashCard.status.find(item => item.userId.toString() === req.user._id.toString());
            console.log('tet', flashcardInfo)
            flashcardInfo.numberOfGood = flashCard.numberOfGood.find(item => item.userId.toString() === req.user._id.toString());
            flashcardInfo.lastReview = flashCard.lastReview.find(item => item.userId.toString() === req.user._id.toString());
            flashcardInfo.nextReview = flashCard.nextReview.find(item => item.userId.toString() === req.user._id.toString());
            return flashcardInfo;
        })
        return res.status(200).json({flashcardSet, flashcards: flashcardsInfo});
    }
    catch (err) {
        return res.status(500).json({error: 'Une erreur est survenue lors de la récupération des données'});
    }
});

router.put('/flashcard/update/:id', async (req, res) => {
    const flashcardId = req.params.id;

    try {
        const updatedFlashcard = await flashcard.findById(flashcardId);
        const { userId, status, numberOfGood, lastReview, nextReview } = req.body;
        let updated = false;

        if (!updatedFlashcard) {
            return res.status(404).json({ error: "Cette flashcard n'existe pas" });
        }
        if (status) {
            const existingStatus = updatedFlashcard.status.find(item => item.userId.toString() === userId);
            if (existingStatus) {
                existingStatus.status = status;
            } else {
                updatedFlashcard.status.push({ userId, status });
            }
            updated = true;
        }
        if (numberOfGood || numberOfGood === 0) {
            const existingNumberOfGood = updatedFlashcard.numberOfGood.find(item => item.userId.toString() === userId);
            if (existingNumberOfGood) {
                existingNumberOfGood.numberOfGood = numberOfGood;
            } else {
                updatedFlashcard.numberOfGood.push({ userId, numberOfGood });
            }
            updated = true;
        }
        if (lastReview) {
            const existingLastReview = updatedFlashcard.lastReview.find(item => item.userId.toString() === userId);
            if (existingLastReview) {
                existingLastReview.lastReview = lastReview;
            } else {
                updatedFlashcard.lastReview.push({ userId, lastReview });
            }
            updated = true;
        }
        if (nextReview) {
            const existingNextReview = updatedFlashcard.nextReview.find(item => item.userId.toString() === userId);
            if (existingNextReview) {
                existingNextReview.nextReview = nextReview;
            } else {
                updatedFlashcard.nextReview.push({ userId, nextReview });
            }
            updated = true;
        }
        if (!updated) {
            return res.status(400).json({ error: "Vous devez spécifier un paramètre à modifier" });
        }

        await updatedFlashcard.save();
        return res.status(200).json({ flashcard: updatedFlashcard });

    } catch (err) {
        return res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour de la flashcard' });
    }
});

module.exports = router;



module.exports = router;