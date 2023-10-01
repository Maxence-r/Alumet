const express = require('express');
const authorize = require('../../middlewares/authentification/authorize');
const router = express.Router();
const Invitation = require('../../models/invitation');
const path = require('path');
const validateObjectId = require('../../middlewares/modelsValidation/validateObjectId');
const { default: mongoose } = require('mongoose');
const Account = require('../../models/account');
const Alumet = require('../../models/alumet');
const flashCardSet = require('../../models/flashcardSet');

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

router.get('/info/:id', authorize(), async (req, res) => {
    const invitation = await Invitation.findOne({ _id: req.params.id });
    if (!invitation) {
        return res.status(404).json({ message: 'Invitation not found' });
    }
    const owner = await Account.findOne({ _id: invitation.owner }, { name: 1, lastname: 1, _id: 1, mail: 1, accountType: 1, isCertified: 1, isA2FEnabled: 1, badges: 1, username: 1, icon: 1 });
    let referenceDetails;
    if (invitation.type === 'flashcards') {
        referenceDetails = await flashCardSet.findById(invitation.reference).select('_id description title');
    } else if (invitation.type === 'alumet') {
        referenceDetails = await Alumet.findById(invitation.reference).select('_id title description background');
    }
    if (!owner || !referenceDetails) {
        return res.status(404).json({ message: 'Owner or Alumet not found' });
    }

    res.json({ inviter: owner, referenceInfos: referenceDetails, invitation });
});

module.exports = router;
//
