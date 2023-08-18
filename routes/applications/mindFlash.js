const express = require('express');
const router = express.Router();
const flashCardSet = require('../../models/flashcardSet');
const flashcard = require('../../models/flashcard');
const Account = require('../../models/account');
const path = require('path');
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');

function getOrChangeFlashcardUserInfos(flashCard, userId, status, numberOfGood, lastReview, nextReview) {
  const userIdString = userId.toString();
  let updated = false;

  const flashcardUserInfo = {
    status: "unrated",
    numberOfGood: 0,
    lastReview: null,
    nextReview: null
  };

  const existingStatus = flashCard.status.find(item => item.userId === userIdString);
  if (existingStatus) {
    flashcardUserInfo.status = existingStatus.status;
  }

  const existingNumberOfGood = flashCard.numberOfGood.find(item => item.userId === userIdString);
  if (existingNumberOfGood) {
    flashcardUserInfo.numberOfGood = existingNumberOfGood.numberOfGood;
  }

  const existingLastReview = flashCard.lastReview.find(item => item.userId === userIdString);
  if (existingLastReview) {
    flashcardUserInfo.lastReview = existingLastReview.lastReview;
  }

  const existingNextReview = flashCard.nextReview.find(item => item.userId === userIdString);
  if (existingNextReview) {
    flashcardUserInfo.nextReview = existingNextReview.nextReview;
  }

  if (status) {
    if (existingStatus) {
      existingStatus.status = status;
    } else {
      flashCard.status.push({ userId: userIdString, status });
    }
    updated = true;
    flashcardUserInfo.status = status;
  }

  if (numberOfGood || numberOfGood === 0) {
    if (existingNumberOfGood) {
      existingNumberOfGood.numberOfGood = numberOfGood;
    } else {
      flashCard.numberOfGood.push({ userId: userIdString, numberOfGood });
    }
    updated = true;
    flashcardUserInfo.numberOfGood = numberOfGood;
  }

  if (lastReview) {
    if (existingLastReview) {
      existingLastReview.lastReview = lastReview;
    } else {
      flashCard.lastReview.push({ userId: userIdString, lastReview });
    }
    updated = true;
    flashcardUserInfo.lastReview = lastReview;
  }

  if (nextReview) {
    if (existingNextReview) {
      existingNextReview.nextReview = nextReview;
    } else {
      flashCard.nextReview.push({ userId: userIdString, nextReview });
    }
    updated = true;
    flashcardUserInfo.nextReview = nextReview;
  }

  return { updated, flashcardUserInfo };
}

async function getFlashcardSetStats (req) {
  const flashcards = await flashcard.find({flashcardSetId: req.params.flashcardSetId});
  let numberOfFlashcards = flashcards.length;
  let numberOfGood = 0;
  let numberOfOk = 0;
  let numberOfBad = 0;
  let numberOfUnrated = 0;

  
  flashcards.forEach(flashcard => {
    const existingStatus = flashcard.status.find(item => item.userId === req.user._id.toString());
    if (existingStatus) {
      switch (existingStatus.status) {
        case 'good':
          numberOfGood++;
          break;
        case 'ok':
          numberOfOk++;
          break;
        case 'bad':
          numberOfBad++;
          break;
        case 'unrated':
          numberOfUnrated++;
          break;
      }
    } else {
      numberOfUnrated++;
    }        
  })

  const calculatePercentage = (number) => { return ((number / numberOfFlashcards) * 100).toFixed(2) };
    const stats = {
      numberOfFlashcards,
      numberOfGood,
      numberOfOk,
      numberOfBad,
      numberOfUnrated,
      percentageOfGood: calculatePercentage(numberOfGood),
      percentageOfOk: calculatePercentage(numberOfOk),
      percentageOfBad: calculatePercentage(numberOfBad),
      percentageOfUnrated: calculatePercentage(numberOfUnrated)
    };
    return stats;
}

router.get('/', async (req, res) => {
    if (!req.connected) return res.redirect('/auth/signin');
    const filePath = path.join(__dirname, '../../views/pages/applications/mindFlash.html');
    res.sendFile(filePath);
});

router.get('/:flashcardSetId', validateObjectId, async (req, res) => {
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
            return res.status(500).json({error: 'Une erreur est survenue lors de la création de votre set de flashcards' + err});
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

router.get('/flashcardsets', async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const flashcardSets = await flashCardSet.find({ participants: userId });
    const flashcardSetsInfo = [];
    for (const flashcardSet of flashcardSets) {
      const owner = await Account.findById(flashcardSet.owner);
      if (!owner) {
        return res.status(404).json({ error: "Le propriétaire de ce set de flashcards n'existe pas" });
      };
      const flashcardSetInfo = {
        id: flashcardSet._id,
        owner: owner.name + ' ' + owner.lastname,
        title: flashcardSet.title,
        numberOfFlashcards: flashcardSet.numberOfFlashcards
      };
      flashcardSetsInfo.push(flashcardSetInfo);
    }
    return res.status(200).json({ flashcardSets: flashcardSetsInfo });
  } catch (err) {
    return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des données' });
  }
});


router.get('/getFlashcardset/:flashcardSetId', validateObjectId, async (req, res) => {
    try {
        const flashcardSet = await flashCardSet.findById(req.params.flashcardSetId);
        if (!flashcardSet) return res.status(404).json({error: "Ce set de flashcards n'existe pas"});
        const flashcards = await flashcard.find({flashcardSetId: req.params.flashcardSetId});
        const flashcardsInfo = flashcards.map(flashcard => {
            const flashcardInfo = {};
            flashcardInfo.question = flashcard.question;
            flashcardInfo.answer = flashcard.answer;
            const flashcardUserInfos = getOrChangeFlashcardUserInfos(flashcard, req.user._id.toString()).flashcardUserInfo;
            flashcardInfo.status = flashcardUserInfos.status;
            flashcardInfo.numberOfGood = flashcardUserInfos.numberOfGood;
            flashcardInfo.lastReview = flashcardUserInfos.lastReview;
            flashcardInfo.nextReview = flashcardUserInfos.nextReview;
            return flashcardInfo;
        })
        return res.status(200).json({flashcardSet, flashcards: flashcardsInfo});
    }
    catch (err) {
        return res.status(500).json({error: 'Une erreur est survenue lors de la récupération des données'});
    }
});

router.get('/flashcardset/stats/:flashcardSetId', validateObjectId, async (req, res) => {
  try {
      return res.json(await getFlashcardSetStats(req));
  }
  catch (err) {
      console.error('error : ' + err);
      return res.status(500).json({error: 'Une erreur est survenue lors de la récupération des données'});
  }
});

router.put('/flashcard/update/:id', async (req, res) => {
    const flashcardId = req.params.id;
    try {
        const updatedFlashcard = await flashcard.findById(flashcardId);
        const { userId, status, numberOfGood, lastReview, nextReview } = req.body;
        if (!updatedFlashcard) {
            return res.status(404).json({ error: "Cette flashcard n'existe pas" });
        }
        const updated = getOrChangeFlashcardUserInfos(updatedFlashcard, userId, status, numberOfGood, lastReview, nextReview).updated;
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