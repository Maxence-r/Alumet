const express = require('express');
const router = express.Router();
const Board = require('../models/board');
const validateObjectId = require('../middlewares/validateObjectId');
const alumetItemsAuth = require('../middlewares/api/alumetItemsAuth');
const path = require('path');
const Alumet = require('../models/alumet');
const alumetAuth = require('../middlewares/api/alumetAuth');

router.get('/:board', validateObjectId, alumetItemsAuth, alumetAuth, async (req, res) => {
    try {
        const board = await Board.findOne({ _id: req.params.board });
        if (!board) return res.redirect('/404');
        const alumetObj = await Alumet.findOne({ _id: board.alumet });
        if (!alumetObj) return res.status(404).json({ error: 'Alumet not found' });
        if (!req.logged && !req.auth) return res.redirect(`/portal/${alumetObj._id}`);
        if (req.logged && !req.auth && req.user.id !== alumetObj.owner) return res.redirect(`/portal/${alumetObj._id}`);
        if (!req.logged && req.auth && req.alumet.id !== alumetObj.id) return res.redirect(`/portal/${alumetObj._id}`);
        const filePath = path.join(__dirname, '../views/pages/board.html');
        res.sendFile(filePath);
    }
    catch (error) {
        console.error(error);
        res.json({ error });
    }
});

module.exports = router;