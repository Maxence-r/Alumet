const express = require('express');
const router = express.Router();
const path = require('path');
const Conversation = require('../../models/conversation');
const validateConversation = require('../../middlewares/modelsValidation/validateConversation');
const Message = require('../../models/message');
const Account = require('../../models/account');


router.post('/create', validateConversation, async (req, res) => {
  const { participants, name, icon } = req.body;
  const userId = req.user.id;

  if (participants.includes(userId)) {
    return res.status(400).json({ error: 'Vous ne pouvez pas créer une conversation avec vous même !' });
  }
  participants.push(userId);
  const existingConversation = await Conversation.findOne({
    participants: {
      $all: participants
    }
  });
  console.log(participants)
  if (existingConversation) {
    return res.status(400).json({ error: 'Une conversation avec cet utilisateur existe déjà !' });
  }
  const conversation = new Conversation({
    participants,
    name,
    lastUsage: Date.now(),
    icon
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
    const conversations = await Conversation.find({ participants: req.user.id }).sort({ lastUsage: -1 });
    const filteredConversations = await Promise.all(conversations.map(async conversation => {
      const participants = conversation.participants.filter(participant => participant !== req.user.id);
      const lastMessage = await Message.findOne({ reference: conversation._id}).sort({ _id: -1 })
      let lastMessageObject = {};
      if (lastMessage && lastMessage.content) {
        let senderAccount = await Account.findOne({ _id: lastMessage.sender});
        if(senderAccount.name == req.user.name) {
          senderAccount.name = "Vous";
        }        
        lastMessageObject = { content: lastMessage.content, sender: senderAccount.name };
      } else {
        lastMessageObject = {};
      }

      let isReaded = lastMessage ? lastMessage.isReaded : true;
      if (lastMessage && String(lastMessage.sender) === req.user.id) {
        isReaded = true;
      }
      const conversationId = conversation._id;

      return { ...conversation.toObject(), participants, lastMessage: lastMessageObject, isReaded: isReaded, conversationId: conversationId };
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
router.get('/:conversation', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.conversation, participants: req.user.id });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (!conversation.participants.includes(req.user.id)) { return res.status(401).json({ error: 'Not authorized' }) }
    Message.find({ reference: conversation._id }).sort({ _id: 1 })
      .then(async messages => {
        if (messages.length === 0) {
          return res.json({ messages: [] });
        }
        const messagePromises = messages.map(async message => {
          const user = await Account.findOne({ _id: message.sender }, { name: 1, lastname: 1, icon: 1 });
          return { message, user };
        });
        const messageObjects = await Promise.all(messagePromises);
        const lastMessage = messageObjects[messageObjects.length - 1].message;
        if (lastMessage && !lastMessage.isReaded && String(lastMessage.sender) !== req.user.id) {
          await Message.findOneAndUpdate({ _id: lastMessage._id }, { isReaded: true });
        }
        res.json({ messages: messageObjects });
      })
      .catch(error => res.json({ error }));
  } catch (error) {
    console.error(error);
    res.json({ error });
  }
});

router.post('/send', async (req, res) => {
  const { message, conversationId } = req.body;
  const sender = req.user.id;
  const reference = conversationId;
  const isReaded = false;
  const newMessage = new Message({ sender, content: message, reference, isReaded });
  const user = await Account.findOne({ _id: sender }, { name: 1, lastname: 1, icon: 1 });
  newMessage.save()
    .then(message => {
      Conversation.findOneAndUpdate({ _id: conversationId }, { lastUsage: Date.now() })
        .then(() => res.status(201).json({ message, user }))
        .catch(error => res.json({ error }));
    })
    .catch(error => res.json({ error }));
});


module.exports = router;