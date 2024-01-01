const mongoose = require('mongoose');

function validateObjectId(req, res, next) {
    const id = req.params.id || req.body.id || req.params.alumet || req.params.board || req.params.flashcardSetId || req.params.wall || req.params.application;
    if (!mongoose.Types.ObjectId.isValid(id) && req.params.id !== 'system') {
        return res.redirect('/404');
    }
    next();
}

module.exports = validateObjectId;
