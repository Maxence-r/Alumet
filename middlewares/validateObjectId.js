const mongoose = require('mongoose');

function validateObjectId(req, res, next) {
  const id = req.params.id || req.body.id || req.params.alumet || req.params.board;
  if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.redirect('/404');
  }
  next();
}
  
module.exports = validateObjectId;