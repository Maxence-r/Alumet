const express = require('express');
const router = express.Router();
const Homework = require('../../models/homework');
const alumetItemsAuth = require('../../middlewares/api/alumetItemsAuth');
const validateObjectId = require('../../middlewares/validateObjectId');
const alumetAuth = require('../../middlewares/api/alumetAuth');

router.post('/add/:alumet', validateObjectId, alumetItemsAuth, async (req, res) => {
  try {
    if (!req.logged || req.alumetObj.owner !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { content, time } = req.body;
    if (!content || !time) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
    if (content.length > 500 || content.includes('<')) {
      return res.status(400).json({ error: 'Invalid content' });
    }
    const dateArr = time.split('-');
    const year = parseInt(dateArr[0]);
    const month = parseInt(dateArr[1]);
    const day = parseInt(dateArr[2]);

    const inputDate = new Date(year, month - 1, day);
    const today = new Date();

    if (inputDate < today) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const homeworkObject = new Homework({
      content,
      time: inputDate,
      alumet: req.params.alumet
    });

    const homework = await homeworkObject.save();
    return res.json(homework);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.get('/:alumet', validateObjectId, alumetItemsAuth, alumetAuth, async (req, res) => {
  try {
    if (req.logged && !req.auth && req.alumetObj.owner !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Unauthorized x001' });
    }
    if (req.auth && req.alumet.id !== req.params.alumet) {
      return res.status(401).json({ error: 'Unauthorized x002' });
    }
    const homeworks = await Homework.find({ alumet: req.params.alumet, time: { $gte: new Date() } }).sort({ time: 1 });
    return res.json(homeworks);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:alumet/:id', validateObjectId, alumetItemsAuth, async (req, res) => {
  try {
    if (!req.logged || req.alumetObj.owner !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Unauthorized x002' });
    }
    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }
    await homework.remove();
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

  

  module.exports = router;