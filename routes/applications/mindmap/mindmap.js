const express = require('express');
const router = express.Router();
const authorize = require('../../../middlewares/authentification/authorize');
const sendInvitations = require('../../../middlewares/mailManager/sendInvitations');



module.exports = router;
//
