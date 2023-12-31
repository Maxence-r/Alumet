const express = require('express');
const router = express.Router();
const path = require('path');
const authorize = require('../../middlewares/authentification/authorize');
const Alumet = require('../../models/alumet');
const Account = require('../../models/account');
const Invitation = require('../../models/invitation');
const rateLimit = require('../../middlewares/authentification/rateLimit');
router.get('/', async (req, res) => {
    if (!req.connected) return res.redirect('/auth/signin');
    let filePath;
    if (req.user.accountType === 'student') {
        filePath = path.join(__dirname, '../../views/pages/dashboard/student.html');
    } else {
        filePath = path.join(__dirname, '../../views/pages/dashboard/professor.html');
    }

    res.sendFile(filePath);
});

router.get('/identity', authorize(), rateLimit(60), async (req, res) => {
    try {
        const fetchedInvitations = await Invitation.find({ to: req.user.id }).sort({ createdAt: -1 });
        let invitations = [];
        for (let invitation of fetchedInvitations) {
            const owner = await Account.findOne({ _id: invitation.owner }, { name: 1, lastname: 1, _id: 1, icon: 1 });
            let referenceDetails = await Alumet.findById(invitation.reference).select('_id title background');

            if (!owner || !referenceDetails) {
                continue;
            }
            invitations.push({ inviter: owner.name + ' ' + owner.lastname, applicationName: referenceDetails.title, invitationId: invitation.reference, createdAt: invitation.createdAt, icon: owner.icon, invitationType: invitation.type });
        }
        const user = await Account.findOne({ _id: req.user.id }, { name: 1, lastname: 1, _id: 1, mail: 1, accountType: 1, isA2FEnabled: 1, badges: 1, username: 1, icon: 1, notifications: 1 });
        const alumets = await Alumet.find({
            $or: [
                { owner: req.user.id },
                { 'participants.userId': req.user.id }
            ],
        })
            .select('id title lastUsage background type subject')
            .sort({ lastUsage: -1 });

        res.json({
            alumets, user, invitations
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: 'Failed to get items',
        });
    }
});

module.exports = router;
