const express = require('express');
const router = express.Router();
const path = require('path');
const alumetAuth = require('../middlewares/alumetAuth');
const checkLogin = require('../middlewares/checkLogin');
const Alumet = require('../models/alumet');
const validateObjectId = require('../middlewares/validateObjectId');

router.get('/:id', alumetAuth, validateObjectId, (req, res) => {
    if (!req.auth || req.alumet.id != req.params.id) return res.redirect(`/portal/${req.params.id}`);
    const filePath = path.join(__dirname, '../views/pages/alumet.html');
    res.sendFile(filePath);
});

router.get('/edit/:id', checkLogin, validateObjectId, (req, res) => {
    if (!req.logged) return res.redirect(`/portal/${req.params.id}`);
    Alumet.findOne({
        _id: req.params.id
    }).then(alumet => {
        console.log(alumet.owner.toString(), req.user.id);
        if (!alumet) return res.redirect(`/404`);
        if (alumet.owner.toString() !== req.user.id) return res.redirect(`/portal/${req.params.id}`);
        const filePath = path.join(__dirname, '../views/pages/editor.html');
        res.sendFile(filePath);
    });
});

module.exports = router;