const express = require('express');
const router = express.Router();
const Board = require('../../models/board');
const validateObjectId = require('../../middlewares/validateObjectId');
const alumetItemsAuth = require('../../middlewares/api/alumetItemsAuth');

router.post('/:alumet/create', validateObjectId, alumetItemsAuth, async (req, res) => {
    if (!req.logged || req.user.id !== req.alumetObj.owner) return res.status(401).json({ error: 'Not logged' });
    try {
        const { name, public, interact } = req.body;
        if (!name ) return res.status(400).json({ error: 'Missing parameters' });

        const board = new Board({
            name,
            alumet: req.alumetObj._id,
            public,
            interact
        });

        await board.save();
        res.json(board);
    } catch (error) {
        console.error(error);
        res.json({ error });
    }
});


router.get('/:alumet', validateObjectId, alumetItemsAuth, async (req, res) => {
    if (req.logged && !req.auth && req.user.id !== req.alumetObj.owner) return res.status(401).json({ error: 'Not logged' });
    if (!req.logged && req.auth && req.auth.id !== req.alumetObj.id) return res.status(401).json({ error: 'Not logged' });
    try {
        const boards = await Board.find({ alumet: req.alumetObj._id });
        res.json(boards);
    }
    catch (error) {
        console.error(error);
        res.json({ error });
    }
});


module.exports = router;