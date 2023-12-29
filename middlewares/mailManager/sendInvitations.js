const { sendMail } = require('../../routes/mail/mailing');
const Account = require('../../models/account');
const Invitation = require('../../models/invitation');
const Alumet = require('../../models/alumet');

async function sendInvitations(req, res, reference) {
    try {
        if (typeof req.body.collaborators === 'string') req.body.collaborators = JSON.parse(req.body.collaborators);
        const collaborators = req.body.collaborators;

        for (const participant of collaborators) {
            let account = await Account.findOne({
                _id: { $ne: req.user.id },
                _id: participant,
            });
            let referenceDetails = await Alumet.findById(reference);
            let invitationCheck = await Invitation.findOne({ to: participant, reference: reference });
            if (!account || invitationCheck || referenceDetails.participants.some(p => p.userId === participant && p.status === 1) || referenceDetails.owner == participant) {
                continue;
            }
            const invitation = new Invitation({
                owner: req.user.id,
                to: participant,
                reference,
                createdAt: new Date(),
            });
            await invitation.save();
            console.log('invitation saved');
            sendMail(
                "collaboration",
                account.mail,
            );
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = sendInvitations;
