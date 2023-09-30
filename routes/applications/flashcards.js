const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FlashcardSet = require('../../models/flashcardSet');
const Flashcard = require('../../models/flashcard');
const Account = require('../../models/account');
const path = require('path');
const authorize = require('../../middlewares/authentification/authorize');

router.post('/set', authorize, async (req, res) => {
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
        res.json({ flashcardSet });
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});

module.exports = router;
