const { sendMail } = require('./../../routes/api/alumetGlobal/mailing');
const Account = require('./../../models/account');
const Invitation = require('./../../models/invitation');
const Alumet = require('./../../models/alumet');

async function sendInvitations(req, res, next) {
    try {
        if (typeof req.body.collaborators === 'string') req.body.collaborators = JSON.parse(req.body.collaborators);
        const collaborators = req.body.collaborators;

        let owner = await Account.findById(req.user.id);
        for (const participant of collaborators) {
            let account = await Account.findOne({
                _id: { $ne: req.user.id },
                _id: participant,
            });
            let alumet = await Alumet.findById(req.alumetId ? req.alumetId : req.params.alumet);
            let invitationCheck = await Invitation.findOne({ to: participant, alumet: req.alumetId ? req.alumetId : req.params.alumet });

            if (!account || invitationCheck || alumet.collaborators.includes(participant) || (account.accountType !== 'professor' && account.accountType !== 'staff')) {
                continue;
            }
            const invitation = new Invitation({
                owner: req.user.id,
                to: participant,
                alumet: req.alumetId ? req.alumetId : req.params.alumet,
            });
            await invitation.save();
            sendMail(
                account.mail,
                'Invitation à un alumet',
                `Vous avez été invité à collaborer sur "${alumet.title}" en tant que collaborateur par ${owner.name} ${owner.lastname} (${owner.username}). Accepter ou refuser l'invitation en vous rendant sur votre tableau de bord. `
            );
        }
        next();
    } catch (error) {
        console.error(error);
        next(error);
    }
}

module.exports = sendInvitations;
