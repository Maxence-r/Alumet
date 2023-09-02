const express = require('express');
const router = express.Router();
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');
const alumetItemsAuth = require('../../middlewares/alumetItemsAuth');

router.post('/:alumet/create', validateObjectId, alumetItemsAuth, async (req, res) => {
    if (!req.connected || req.user.id !== req.alumetObj.owner) return res.status(401).json({ error: 'Not connected' });
    try {
        const { name, public, interact } = req.body;
        if (!name) return res.status(400).json({ error: 'Missing parameters' });

        const board = new Board({
            name,
            alumet: req.alumetObj._id,
            interact,
            lastUsage: Date.now(),
        });

        await board.save();
        res.json(board);
    } catch (error) {
        console.error(error);
        res.json({ error });
    }
});

router.get('/:alumet', validateObjectId, alumetItemsAuth, async (req, res) => {
    if (req.connected && !req.auth && req.user.id !== req.alumetObj.owner) return res.status(401).json({ error: 'Not connected' });
    if (!req.connected && req.auth && req.auth.id !== req.alumetObj.id) return res.status(401).json({ error: 'Not connected' });
    try {
        const boards = await Board.find({ alumet: req.alumetObj._id }).sort({ lastUsage: -1 });
        res.json(boards);
    } catch (error) {
        console.error(error);
        res.json({ error });
    }
});

router.get('/:alumet/:board', validateObjectId, alumetItemsAuth, async (req, res) => {
    if (req.connected && !req.auth && req.user.id !== req.alumetObj.owner) return res.status(401).json({ error: 'Not connected' });
    if (!req.connected && req.auth && req.auth.id !== req.alumetObj.id) return res.status(401).json({ error: 'Not connected' });
    try {
        const board = await Board.findOne({ _id: req.params.board, alumet: req.alumetObj._id });
        if (!board) return res.status(404).json({ error: 'Board not found' });
        res.json(board);
    } catch (error) {
        console.error(error);
        res.json({ error });
    }
});

router.put('/:alumet/:board', validateObjectId, alumetItemsAuth, async (req, res) => {
    if (!req.connected || req.user.id !== req.alumetObj.owner) return res.status(401).json({ error: 'Not connected' });
    try {
        const { name, public, interact } = req.body;
        if (!name) return res.status(400).json({ error: 'Missing parameters' });

        const board = await Board.findOne({ _id: req.params.board, alumet: req.alumetObj._id });
        if (!board) return res.status(404).json({ error: 'Board not found' });

        board.name = name;
        board.interact = interact;
        board.lastUsage = Date.now();

        await board.save();
        res.json(board);
    } catch (error) {
        console.error(error);
        res.json({ error });
    }
});

router.delete('/:alumet/:board', validateObjectId, alumetItemsAuth, async (req, res) => {
    if (!req.connected || req.user.id !== req.alumetObj.owner) return res.status(401).json({ error: 'Not connected' });
    try {
        const board = await Board.findOne({ _id: req.params.board, alumet: req.alumetObj._id });
        if (!board) return res.status(404).json({ error: 'Board not found' });
        await board.remove();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ error });
    }
});

module.exports = router;
