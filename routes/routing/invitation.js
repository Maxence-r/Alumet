const express = require('express');
const authorize = require('../../middlewares/authentification/authorize');
const router = express.Router();
const Invitation = require('../../models/invitation');
const path = require('path');
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');

router.get('/:id', validateObjectId, authorize(), async (req, res) => {
    try {
        let invitation = await Invitation.findOne({ _id: req.params.id, mail: req.user.mail });
        if (!invitation) {
            res.redirect('/404');
        }

        const filePath = path.join(__dirname, '../../views/pages/invitation.html');
        res.sendFile(filePath);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
});



module.exports = router;
//
