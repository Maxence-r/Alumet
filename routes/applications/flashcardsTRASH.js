const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FlashcardSet = require('../../models/flashcardSet');
const Flashcard = require('../../models/flashcard');
const Account = require('../../models/account');
const path = require('path');
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');

/* -------------------------------------------------------------------------- */
/*                              Define functions                              */
/* -------------------------------------------------------------------------- */
const flashcardFunctions = (() => {
    const setUserDatas = (flashcard, userId) => {
        const userIdString = userId.toString();
        if (!toolsFunctions.checkIfAccountExist(userIdString)) {
            return { error: "Cet utilisateur n'existe pas" };
        }
        const existingData = {
            data: flashcard.userDatas.find(item => item.userId === userIdString),
            level: flashcard.userDatas.find(item => item.userId === userIdString)?.level,
            numberOfGood: flashcard.userDatas.find(item => item.userId === userIdString)?.numberOfGood,
            nextReview: flashcard.userDatas.find(item => item.userId === userIdString)?.nextReview,
            lastReview: flashcard.userDatas.find(item => item.userId === userIdString)?.lastReview,
        };
        if (!existingData.data) {
            flashcard.userDatas.push({ userId: userIdString, level: 0, numberOfGood: 0, lastReview: null, nextReview: null });
        } else {
            if (!existingData.level) {
                flashcard.userDatas.level = 0;
            } else if (!existingData.numberOfGood) {
                flashcard.userDatas.numberOfGood = 0;
            } else if (!existingData.nextReview) {
                flashcard.userDatas.nextReview = null;
            } else if (!existingData.lastReview) {
                flashcard.userDatas.lastReview = null;
            }
        }
        return flashcard;
    };
    const getOrChangeUserDatas = (flashcard, userId, level, numberOfGood, lastReview, nextReview) => {
        let updated = false;
        const userIdString = userId.toString();
        if (!toolsFunctions.checkIfAccountExist(userIdString)) return res.status(500).json({ error: "Cet utilisateur n'existe pas" });
        const existingData = {
            data: flashcard.userDatas.find(item => item.userId === userIdString),
            level: flashcard.userDatas.find(item => item.userId === userIdString)?.level,
            numberOfGood: flashcard.userDatas.find(item => item.userId === userIdString)?.numberOfGood,
            nextReview: flashcard.userDatas.find(item => item.userId === userIdString)?.nextReview,
            lastReview: flashcard.userDatas.find(item => item.userId === userIdString)?.lastReview,
        };
        if (!existingData.data && (level || numberOfGood || lastReview || nextReview)) {
            flashcard.userDatas.push({ userId: userIdString, level, numberOfGood, lastReview, nextReview });
            updated = true;
        } else {
            if (level) {
                if (existingData.level || existingData.level === 0) {
                    existingData.level = level;
                    flashcard.userDatas.find(item => item.userId === userIdString).level = level;
                }
                updated = true;
            }
            if (numberOfGood) {
                if (existingData.numberOfGood || existingData.numberOfGood === 0) {
                    existingData.numberOfGood = numberOfGood;
                    flashcard.userDatas.find(item => item.userId === userIdString).numberOfGood = numberOfGood;
                }
                updated = true;
            }
            if (lastReview) {
                if (existingData.lastReview) {
                    existingData.lastReview = lastReview;
                    flashcard.userDatas.find(item => item.userId === userIdString).lastReview = lastReview;
                }
                updated = true;
            }
            if (nextReview) {
                if (existingData.nextReview) {
                    existingData.nextReview = nextReview;
                    flashcard.userDatas.find(item => item.userId === userIdString).nextReview = nextReview;
                }
                updated = true;
            }
        }
        delete existingData.data;
        return { updated, userDatas: existingData, flashcard };
    };

    return {
        setUserDatas,
        getOrChangeUserDatas,
    };
})();

const flashcardSetFunctions = (() => {
    const setUserDatas = (flashcardSet, userId) => {
        const userIdString = userId.toString();
        if (!toolsFunctions.checkIfAccountExist(userIdString)) {
            return { error: "Cet utilisateur n'existe pas" };
        }
        const existingData = {
            data: flashcardSet.userDatas.find(item => item.userId === userIdString),
            lastReview: flashcardSet.userDatas.find(item => item.userId === userIdString)?.lastReview,
        };
        if (!existingData.data) {
            flashcardSet.userDatas.push({ userId: userIdString, lastReview: null });
        } else {
            if (!existingData.lastReview) {
                flashcardSet.userDatas.lastReview = null;
            }
        }
        return flashcardSet;
    };
    const getStats = async req => {
        const flashcards = await Flashcard.find({ flashcardSetId: req.params.flashcardSetId });
        if (!flashcards) {
            return (stats = {
                numberOfFlashcards: 0,
            });
        }
        let numberOfFlashcards = flashcards.length;
        let numberOfGood = 0;
        let numberOfOk = 0;
        let numberOfBad = 0;
        let numberOfUnrated = 0;

        flashcards.forEach(flashcard => {
            const existinglevel = flashcard.userDatas.find(item => item.userId === req.user._id.toString())?.level;
            if (existinglevel) {
                switch (existinglevel) {
                    case 3:
                        numberOfGood++;
                        break;
                    case 2:
                        numberOfOk++;
                        break;
                    case 1:
                        numberOfBad++;
                        break;
                    case 0:
                        numberOfUnrated++;
                        break;
                }
            } else {
                numberOfUnrated++;
            }
        });

        const calculatePercentage = number => {
            return ((number / numberOfFlashcards) * 100).toFixed(0);
        };

        const stats = {
            numberOfFlashcards,
            numberOfGood,
            numberOfOk,
            numberOfBad,
            numberOfUnrated,
            percentageOfGood: calculatePercentage(numberOfGood),
            percentageOfOk: calculatePercentage(numberOfOk),
            percentageOfBad: calculatePercentage(numberOfBad),
            percentageOfUnrated: calculatePercentage(numberOfUnrated),
        };
        return stats;
    };
    const getInfos = async req => {
        const flashcardSet = await FlashcardSet.findById(req.params.flashcardSetId);
        if (!flashcardSet) return res.status(404).json({ error: "Ce set de flashcards n'existe pas" });
        const ownerAccount = await Account.findById(flashcardSet.owner);
        if (!ownerAccount) {
            return { error: "Ce set de flashcards n'existe plus, son détenteur n'a plus de compte" };
        }
        const existingLastUsage = flashcardSet.userDatas.find(item => item.userId === req.user._id.toString())?.lastUsage || 'Jamais utilisé';
        const flashcardSetInformations = {
            owner: ownerAccount.name + ' ' + ownerAccount.lastname,
            title: flashcardSet.title,
            description: flashcardSet.description,
            numberOfParticipants: flashcardSet.participants.length,
            numberOfFlashcards: flashcardSet.numberOfFlashcards,
            subject: flashcardSet.subject,
            lastUsage: existingLastUsage,
        };
        return flashcardSetInformations;
    };

    return {
        setUserDatas,
        getStats,
        getInfos,
    };
})();

const toolsFunctions = (() => {
    const checkIfAccountExist = async accountId => {
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            return false;
        }
        const account = await Account.findById(accountId);
        if (!account) return false;
        return true;
    };
    checkIfflashcardSetExist = async flashcardSetId => {
        if (!mongoose.Types.ObjectId.isValid(flashcardSetId)) {
            return false;
        }
        const flashcardSet = await FlashcardSet.findById(flashcardSetId);
        if (!flashcardSet) return false;
        return true;
    };
    return {
        checkIfAccountExist,
        checkIfflashcardSetExist,
    };
})();

/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */

//ANCHOR - Routes General

router.get('/', async (req, res) => {
    if (!req.connected) return res.redirect('/auth/signin');
    const filePath = path.join(__dirname, '../../views/pages/applications/flashcards.html');
    res.sendFile(filePath);
});

router.get('/:flashcardSetId', validateObjectId, async (req, res) => {
    if (!req.connected) return res.redirect('/auth/signin');
    const filePath = path.join(__dirname, '../../views/pages/applications/flashcards.html');
    res.sendFile(filePath);
});

// ANCHOR - Routes flashcardSet

router.post('/flashcardset/create', (req, res) => {
    let newflashcardSet = new FlashcardSet();
    newflashcardSet.owner = req.user._id;
    newflashcardSet.title = req.body.title;
    newflashcardSet.description = req.body.description;
    newflashcardSet.subject = req.body.subject;
    newflashcardSet.participants = [req.user._id];
    newflashcardSet.numberOfFlashcards = 0;
    newflashcardSet = flashcardSetFunctions.setUserDatas(newflashcardSet, req.user._id.toString());
    newflashcardSet.save((err, flashcardSet) => {
        if (err) {
            return res.status(500).json({ error: 'Une erreur est survenue lors de la création de votre set de flashcards' + err });
        }
        return res.status(201).json({ flashcardSet });
    });
});

router.get('/flashcardsets', async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const flashcardSets = await FlashcardSet.find({ participants: userId });
        const flashcardSetsInfo = [];
        for (const flashcardSet of flashcardSets) {
            const owner = await Account.findById(flashcardSet.owner);
            if (!toolsFunctions.checkIfAccountExist(flashcardSet.owner)) return res.status(404).json({ error: "Le propriétaire de ce set de flashcards n'existe pas" });
            const flashcardSetInfo = {
                id: flashcardSet._id,
                owner: owner.name + ' ' + owner.lastname,
                title: flashcardSet.title,
                numberOfFlashcards: flashcardSet.numberOfFlashcards,
            };
            flashcardSetsInfo.push(flashcardSetInfo);
        }
        return res.status(200).json({ flashcardSets: flashcardSetsInfo });
    } catch (err) {
        return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des données' });
    }
});

router.get('/getflashcardset/:flashcardSetId', validateObjectId, async (req, res) => {
    try {
        const flashcardSet = await FlashcardSet.findById(req.params.flashcardSetId);
        if (!flashcardSet) return res.status(404).json({ error: "Ce set de flashcards n'existe pas" });
        const flashcards = await Flashcard.find({ flashcardSetId: req.params.flashcardSetId });
        const flashcardsInfo = flashcards.map(flashcard => {
            const flashcardInfo = {};
            flashcardInfo.question = flashcard.question;
            flashcardInfo.answer = flashcard.answer;
            const flashcardUserInfos = flashcardFunctions.getOrChangeUserDatas(flashcard, req.user._id.toString()).userDatas;
            flashcardInfo.level = flashcardUserInfos.level;
            flashcardInfo.numberOfGood = flashcardUserInfos.numberOfGood;
            flashcardInfo.lastReview = flashcardUserInfos.lastReview;
            flashcardInfo.nextReview = flashcardUserInfos.nextReview;
            flashcardInfo.dateCreated = flashcard.dateCreated;
            return flashcardInfo;
        });
        return res.status(200).json({ flashcardSet, flashcards: flashcardsInfo });
    } catch (err) {
        return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des données' });
    }
});

router.get('/flashcardset/stats/:flashcardSetId', validateObjectId, async (req, res) => {
    try {
        return res.json(await flashcardSetFunctions.getStats(req));
    } catch (err) {
        console.error('error : ' + err);
        return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des données' });
    }
});

router.get('/flashcardset/basicinformations/:flashcardSetId', validateObjectId, async (req, res) => {
    try {
        return res.json(await flashcardSetFunctions.getInfos(req));
    } catch (err) {
        return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des données : ' });
    }
});

// ANCHOR - Routes flashcard

router.post('/flashcard/create', async (req, res) => {
    const { _id: userId } = req.user;
    const { flashcards, flashcardSetId } = req.body;

    try {
        const flashcardSet = await FlashcardSet.findById(flashcardSetId);
        if (!flashcardSet) {
            return res.status(404).json({ error: "Ce set de flashcards n'existe pas" });
        }

        for (const flashcard of flashcards) {
            const { question, answer } = flashcard;
            if (question.length < 1 || answer.length < 1) {
                return res.status(400).json({ error: 'Vous devez spécifier une question et une réponse pour chacune de vos flashcards' });
            }
            if (question.length > 60 || answer.length > 60) {
                return res.status(400).json({ error: `La question et la réponse doivent faire moins de 60 caractères, flashcard : ${flashcard.question}` });
            }
            const dateCreated = Date.now();
            const newFlashcard = new Flashcard({ flashcardSetId, question, answer, dateCreated, userDatas: [] });
            flashcardFunctions.setUserDatas(newFlashcard, userId);
            await newFlashcard.save();
            flashcardSet.numberOfFlashcards++;
            console.log('number of flashcards', flashcardSet.numberOfFlashcards);
        }

        await flashcardSet.save();
        return res.status(201).json({ message: 'Les flashcards ont bien été créées' });
    } catch (err) {
        console.log(err);
        if (flashcards.length === 1) {
            return res.status(500).json({ error: 'Une erreur est survenue lors de la création de votre flashcard' });
        }
        return res.status(500).json({ error: 'Une erreur est survenue lors de la création de vos flashcards' });
    }
});

router.put('/flashcard/update/:id', async (req, res) => {
    const flashcardId = req.params.id;
    try {
        let updatedflashcard = await Flashcard.findById(flashcardId);
        const { userId, level, numberOfGood, lastReview, nextReview } = req.body;
        const isExistantAccount = await toolsFunctions.checkIfAccountExist(userId);
        if (isExistantAccount === false) return res.status(404).json({ error: "Cet utilisateur n'existe pas" });
        if (!updatedflashcard) {
            return res.status(404).json({ error: "Cette flashcard n'existe pas" });
        }
        userDatasFunction = flashcardFunctions.getOrChangeUserDatas(updatedflashcard, userId, level, numberOfGood, lastReview, nextReview);
        const updated = userDatasFunction.updated;
        updatedflashcard = userDatasFunction.flashcard;
        if (!updated) {
            return res.status(400).json({ error: 'Vous devez spécifier un paramètre à modifier' });
        }
        await updatedflashcard.save();
        return res.status(200).json({ flashcard: updatedflashcard });
    } catch (err) {
        return res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour de la flashcard' });
    }
});

module.exports = router;
