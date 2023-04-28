const express = require('express');
const Message = require('../../models/message');
const alumetAuth = require('../../middlewares/api/alumetAuth');
const Alumet = require('../../models/alumet');
const Account = require('../../models/account');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { tokenC } = require('../../config.json');
const notification = require('../../middlewares/notification');

router.post('/send/:alumet', alumetAuth, notification("A envoyer un message"), async (req, res) => {
    try {
      const alumetObj = await Alumet.findOne({ _id: req.params.alumet });
  
      if (!alumetObj) {
        return res.status(404).json({ error: 'Alumet not found' });
      }
      
      if (req.logged && !req.auth && alumetObj.owner.toString() !== req.user.id) {
        return res.status(401).json({ error: 'Unauthorized x001' });
      }
      
      if (req.auth && !req.logged && req.params.alumet !== req.alumet.id) {
        return res.status(401).json({ error: 'Unauthorized x002' });
      }
  
      const { content } = req.body;
      if (content.length > 500 || content.includes('<')) {
        return res.status(400).json({ error: 'Invalid content' });
      }
      const messageObject = new Message({
        content,
        alumet: req.params.alumet,
        owner: req.logged ? req.user.id : req.cookies.alumetToken,
      });
  
        const message = await messageObject.save();
        if (req.logged) {
            const account = await Account.findById(req.user.id);
            console.log("SIGNAL");
            global.io.emit(`message-${req.params.alumet}`, { message: content, owner: account.prenom + ' ' + account.nom });
        } else {
            const decodedToken = jwt.verify(req.cookies.alumetToken, tokenC);
            message.username = decodedToken.username;
            global.io.emit(`message-${req.params.alumet}`, { message: content, owner: message.username });
        }
        
        return res.json(message);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  });


  router.get('/get/:alumet', alumetAuth, async (req, res) => {
    try {
      const alumetObj = await Alumet.findOne({ _id: req.params.alumet });
  
      if (!alumetObj) {
        return res.status(404).json({ error: 'Alumet not found' });
      }
  
      if (req.logged && !req.auth && alumetObj.owner.toString() !== req.user.id) {
        return res.status(401).json({ error: 'Unauthorized x001' });
      }
  
      if (req.auth && !req.logged && req.params.alumet !== req.alumet.id) {
        return res.status(401).json({ error: 'Unauthorized x002' });
      }
  
      const messages = await Message.find({ alumet: req.params.alumet })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
  
      for (let message of messages) {
        if (message.owner) {
          if (message.owner.toString().length === 24) {
            const account = await Account.findOne({ _id: message.owner });
            message.owner = account.prenom + ' ' + account.nom;
          } else {
            const decodedToken = jwt.verify(message.owner, tokenC);
            message.owner = decodedToken.username;
          }
        }
        
        let editedMessage = {
          id: message._id,
          text: message.text,
          createdAt: message.createdAt,
          owner: message.owner
        };
        message = editedMessage;
      }
  
      return res.json(messages);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
  


module.exports = router;