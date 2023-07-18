const express = require('express');
const router = express.Router();
const path = require('path');
const Conversation = require('../../models/conversation');
const validateConversation = require('../../middlewares/modelsValidation/validateConversation');
const Message = require('../../models/message');
const Account = require('../../models/account');
router.post('/create', validateConversation, async (req, res) => {
    req.body.participants.push(req.user.id);
    const conversation = new Conversation({
        participants: req.body.participants,
        name: req.body.name,
        owner: req.user.id,
        lastUsage: Date.now(),
        icon: req.body.icon
    });
    conversation.save()
        .then(conversation => res.status(201).json(conversation))  
        .catch(error => res.json({ error }));
});

router.delete('/delete', async (req, res) => {
    if (!req.connected || req.user.id !== req.alumetObj.owner) return res.status(401).json({ error: 'Not authorized' });
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

router.get('/', async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id });
    const filteredConversations = await Promise.all(conversations.map(async conversation => {
      const participants = conversation.participants.filter(participant => participant !== req.user.id);
      const lastMessage = await Message.findOne({ reference: conversation._id }).sort({ _id: -1 });
      const lastMessageText = lastMessage && lastMessage.content ? lastMessage.content : 'Pas de message';

      const isReaded = lastMessage && lastMessage.isReaded? lastMessage.isReaded : false;

      return { ...conversation.toObject(), participants, lastMessage: lastMessageText, isReaded: isReaded };
    }));
    res.json(filteredConversations);
  } catch (error) {
    console.error(error);
    res.json({ error });
  }
});

router.get('/search', async (req, res) => {
  const searchQuery = req.query.q;
  const [firstName, lastName] = searchQuery.split(' ');
  try {
    const contacts = await Account.find({
      $and: [
        { name: { $regex: firstName.toString(), $options: 'i' } },
        { lastname: { $regex: lastName ? lastName.toString() : '', $options: 'i' } }
      ]
    }, '_id name lastname');
    res.json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;