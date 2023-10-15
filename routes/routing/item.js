const express = require('express');
const authorizeA2F = require('../../middlewares/authentification/authorizeA2f');
const Alumet = require('../../models/alumet');
const Conversation = require('../../models/conversation');
const flashCardSet = require('../../models/flashcardSet');
const router = express.Router();

router.delete('/:id/:type', authorizeA2F, async (req, res) => {
    try {
        let item;
        if (req.params.type === 'alumet') {
            item = await Alumet.findOne({ _id: req.params.id });
        } else if (req.params.type === 'flashcard') {
            item = await flashCardSet.findOne({ _id: req.params.id });
        }
        if (item.owner !== req.user.id) {
            return res.status(401).json({ error: 'Seul le propriétaire peut effectuer une telle action !' });
        }
        if (req.params.type === 'alumet') {
            const alumet = await Alumet.findOne({ _id: req.params.id });
            if (!alumet) {
                return res.status(404).json({ error: 'Unable to proceed your requests' });
            }

            let conversation = await Conversation.findOne({ _id: alumet.chat });
            if (conversation) {
                await conversation.remove();
            }
            await alumet.remove();
        } else if (req.params.type === 'flashcard') {
            const flashcardSet = await flashCardSet.findOne({ _id: req.params.id });
            if (!flashcardSet) {
                return res.status(404).json({ error: 'Unable to proceed your requests' });
            }
            await flashcardSet.remove();
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while deleting the alumet.' });
    }
});

module.exports = router;
