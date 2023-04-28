const express = require('express');
const router = express.Router();
const Homework = require('../../models/homework');
const alumetItemsAuth = require('../../middlewares/api/alumetItemsAuth');
const validateObjectId = require('../../middlewares/validateObjectId');

router.post('/add/:alumet', validateObjectId, alumetItemsAuth, async (req, res) => {
    try {
      if (!req.logged || req.alumetObj.owner !== req.user._id.toString()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { content, date } = req.body;
      if (!content || !date) {
        return res.status(400).json({ error: 'Missing parameters' });
        }
      if (content.length > 500 || content.includes('<')) {
        return res.status(400).json({ error: 'Invalid content' });
      }
      const dateArr = date.split('/');
      const day = parseInt(dateArr[0]);
      const month = parseInt(dateArr[1]);
      const year = parseInt(dateArr[2]);
  
      const inputDate = new Date(year, month - 1, day);
      const today = new Date();
  
      if (inputDate < today) {
        return res.status(400).json({ error: 'Invalid date' });
      }
  
      const homeworkObject = new Homework({
        content,
        date: inputDate,
      });
  
      const homework = await homeworkObject.save();
      return res.json(homework);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
  

  module.exports = router;