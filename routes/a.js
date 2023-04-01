const express = require('express');
const router = express.Router();
const path = require('path');
const alumetAuth = require('../middlewares/alumetAuth');


router.get('/:id', alumetAuth, (req, res) => {
    console.log(req.auth);
    if (!req.auth || req.alumet.id != req.params.id) return res.redirect(`/portal/${req.params.id}`);
    const filePath = path.join(__dirname, '../views/pages/alumet.html');
    res.sendFile(filePath);
});

module.exports = router;