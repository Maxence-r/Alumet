const express = require('express');
const router = express.Router();
const path = require('path');
const authorize = require('../../../middlewares/authentification/authorize');
const Alumet = require('../../../models/alumet');
const FlashCardSet = require('../../../models/flashcardSet');

router.get('/', async (req, res) => {
    if (!req.connected) return res.redirect('/auth/signin');
    let filePath;
    if (req.user.accountType === 'student') {
        filePath = path.join(__dirname, '../../../views/pages/dashboard/student.html');
    } else {
        filePath = path.join(__dirname, '../../../views/pages/dashboard/professor.html');
    }

    res.sendFile(filePath);
});

router.get('/items', authorize(), async (req, res) => {
    try {
        const alumets = await Alumet.find({
            $or: [{ owner: req.user.id }, { participants: { $in: [req.user.id] } }, { collaborators: { $in: [req.user.id] } }],
        })
            .select('id title lastUsage background')
            .sort({ lastUsage: -1 });

        const flashcardSets = await FlashCardSet.find({
            $or: [{ owner: req.user.id }, { collaborators: { $in: [req.user.id] } }, { likes: { $in: [req.user.id] } }],
        })
            .select('id title description subject likes lastUsage')
            .sort({ lastUsage: -1 });

        res.json({
            alumets,
            flashcardSets,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: 'Failed to get items',
        });
    }
});

module.exports = router;
