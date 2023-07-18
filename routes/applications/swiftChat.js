const express = require('express');
const router = express.Router();
const path = require('path');
const Conversation = require('../../models/conversation');
const validateConversation = require('../../middlewares/modelsValidation/validateConversation');

router.post('/create', validateConversation, async (req, res) => {
    const conversation = new Conversation({
        participants: req.body.participants,
        name: req.body.name,
        owner: req.body.owner,
        lastUsage: Date.now(),
        icon: req.body.icon
    });
    conversation.save()
        .then(conversation => res.status(201).json(conversation))  
        .catch(error => res.json({ error }));
});

router.delete('/delete', async (req, res) => {
    if (!req.connected || req.user.id !== req.alumetObj.owner) return res.status(401).json({ error: 'Not connected' });
    try {
        const conversation = await Conversation.findOne({ _id: req.params.conversation, alumet: req.alumetObj._id });
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
        await conversation.delete();
        res.json({ message: 'Conversation deleted' });
    }
    catch (error) {
        console.error(error);
        res.json({ error });
    }
});


module.exports = router;