const express = require('express');
const bcrypt = require('bcrypt');
const Account = require('../../models/account');
const A2F = require('../../models/a2f');
const Alumet = require('../../models/alumet');
const Invitation = require('../../models/invitation');
const validateAccount = require('../../middlewares/modelsValidation/validateAccount');
const { upload, uploadAndSaveToDb } = require('../../middlewares/utils/uploadHandler');
const rateLimit = require('../../middlewares/authentification/rateLimit');
const { authCookieOptions, signJwt } = require('../../utils/auth');
const logger = require('../../utils/logger');
const { sendMail } = require('../mail/mailing');
const { validate } = require('../../middlewares/validation/validate');
const schemas = require('../../schemas/api');

const router = express.Router();
const sessionMaxAge = 60 * 24 * 60 * 60 * 1000;

const notificationTypes = ['messageP', 'messageG', 'invitationC', 'commentP', 'alumetA', 'experiments'];

const createSessionToken = user =>
    signJwt(
        {
            userId: user._id,
            mail: user.mail,
        },
        {
            expiresIn: '60d',
        }
    );

router.post('/sessions', rateLimit(3), validate(schemas.createSession), async (req, res) => {
    try {
        const user = await Account.findOne({ mail: req.body.mail.toLowerCase() });
        if (!user) return res.status(401).json({ error: 'User not found.', code: 'UNAUTHORIZED' });

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Incorrect password.', code: 'BAD_CREDENTIALS' });

        if (user.suspended.reason) {
            return res.status(403).json({ error: 'Your account has been suspended. Please check your email for more information.', code: 'ACCOUNT_SUSPENDED' });
        }

        if (user.isA2FEnabled) {
            await sendMail('a2f', user.mail);
            return res.status(200).json({ a2f: true });
        }

        const token = createSessionToken(user);
        return res.cookie('token', token, authCookieOptions(sessionMaxAge)).status(200).json({ message: 'Signed in successfully.' });
    } catch (error) {
        logger.error('Signin failed', error);
        return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

router.delete('/sessions/current', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Signed out successfully.' });
});

router.get('/me', rateLimit(60, true), async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });

        const fetchedInvitations = await Invitation.find({ to: req.user?.id }).sort({ createdAt: -1 });
        const invitations = [];
        for (const invitation of fetchedInvitations) {
            const owner = await Account.findOne({ _id: invitation.owner }, { name: 1, lastname: 1, _id: 1, icon: 1 });
            const referenceDetails = await Alumet.findById(invitation.reference).select('_id title background');
            if (!owner || !referenceDetails) continue;
            invitations.push({
                inviter: owner.name + ' ' + owner.lastname,
                applicationName: referenceDetails.title,
                invitationId: invitation.reference,
                createdAt: invitation.createdAt,
                icon: owner.icon,
                invitationType: invitation.type,
            });
        }

        const user = await Account.findOne({ _id: req.user?.id }, { name: 1, lastname: 1, _id: 1, mail: 1, accountType: 1, isA2FEnabled: 1, badges: 1, username: 1, icon: 1, notifications: 1 });
        const alumets = await Alumet.find({
            $or: [{ owner: req.user?.id }, { 'participants.userId': req.user?.id }],
        })
            .select('id title lastUsage background type subject')
            .sort({ lastUsage: -1 });

        return res.json({ alumets, user, invitations });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to get items', code: 'SERVER_ERROR' });
    }
});

router.post('/accounts', rateLimit(1), validate(schemas.createAccount), validateAccount, async (req, res) => {
    const account = new Account({
        name: req.body.name,
        lastname: req.body.lastname,
        mail: req.body.mail.toLowerCase(),
        password: req.body.password,
        accountType: req.body.accountType,
        username: req.body.name.substring(0, 1) + req.body.lastname.substring(0, 22),
    });

    try {
        account.password = await bcrypt.hash(account.password, 10);
        const newAccount = await account.save();
        const token = createSessionToken(newAccount);
        return res.cookie('token', token, authCookieOptions(sessionMaxAge)).status(200).json({ message: 'Signed in successfully.' });
    } catch (error) {
        logger.error('Signup failed', error);
        return res.status(400).json({ error: error.message || 'Inscription impossible', code: 'ACCOUNT_CREATE_FAILED' });
    }
});

router.post('/auth/2fa-codes', rateLimit(3), validate(schemas.twoFactorCode), async (req, res) => {
    const mail = req.user?.mail || req.body.mail;
    if (!mail) return res.status(400).json({ error: 'Mail invalide !', code: 'INVALID_EMAIL' });

    await sendMail('a2f', mail);
    return res.status(200).json({ a2f: true });
});

router.post('/auth/2fa-verifications', rateLimit(3), validate(schemas.twoFactorVerification), async (req, res) => {
    try {
        const a2f = await A2F.findOne({ owner: req.body.mail, code: req.body.code });
        if (!a2f || a2f.expireAt < new Date()) return res.status(400).json({ error: 'Invalid code.', code: 'INVALID_2FA_CODE' });

        const user = await Account.findOne({ mail: a2f.owner });
        if (!user) return res.status(400).json({ error: 'User not found.', code: 'USER_NOT_FOUND' });

        const token = createSessionToken(user);
        await A2F.deleteOne({ owner: a2f.owner });
        return res.cookie('token', token, authCookieOptions(sessionMaxAge)).status(200).json({ message: 'Signed in successfully.' });
    } catch (error) {
        logger.error('2FA authorization failed', error);
        return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

router.patch('/accounts/password', rateLimit(3), validate(schemas.passwordReset), async (req, res) => {
    try {
        const a2f = await A2F.findOne({ owner: req.body.mail, code: req.body.code });
        if (!a2f || a2f.expireAt < new Date()) return res.status(400).json({ error: 'Invalid code.', code: 'INVALID_2FA_CODE' });

        const user = await Account.findOne({ mail: req.body.mail });
        if (!user) return res.status(400).json({ error: 'The user does not exist.', code: 'USER_NOT_FOUND' });

        user.password = await bcrypt.hash(req.body.password, 10);
        await user.save();
        await A2F.deleteOne({ owner: req.body.mail });
        return res.status(200).json({ message: 'Password updated.' });
    } catch (error) {
        logger.error('Password reset failed', error);
        return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

router.patch('/me', rateLimit(10), validate(schemas.updateMe), async (req, res) => {
    try {
        const user = await Account.findById(req.user?.id);
        if (!user) return res.status(401).json({ error: 'User not found.', code: 'UNAUTHORIZED' });

        user.username = req.body.username;
        notificationTypes.forEach(type => {
            if (req.body[type] && !user.notifications.includes(type)) {
                user.notifications.push(type);
            } else if (!req.body[type] && user.notifications.includes(type)) {
                user.notifications = user.notifications.filter(notification => notification !== type);
            }
        });
        await user.save();
        return res.status(200).json({ message: 'Information updated successfully!' });
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.patch('/me/2fa', rateLimit(3), validate(schemas.toggleTwoFactor), async (req, res) => {
    try {
        const user = await Account.findOne({ mail: req.user.mail });
        if (!user) return res.status(401).json({ error: 'User not found.', code: 'UNAUTHORIZED' });

        const a2f = await A2F.findOne({ owner: req.user.mail, code: req.body.code });
        if (!a2f || a2f.expireAt < new Date()) return res.status(400).json({ error: 'Invalid code.', code: 'INVALID_2FA_CODE' });

        user.isA2FEnabled = !user.isA2FEnabled;
        await user.save();
        await A2F.deleteOne({ owner: req.user.mail });

        return res.status(200).json({ isA2FEnabled: user.isA2FEnabled, message: 'Two-factor authentication updated successfully!' });
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

router.patch('/me/avatar', rateLimit(5), upload.single('file'), uploadAndSaveToDb('1', ['png', 'jpeg', 'jpg'], 'icon'), async (req, res) => {
    try {
        const user = await Account.findById(req.user.id);
        user.icon = req.upload._id;
        await user.save();
        return res.status(200).json({ icon: user.icon });
    } catch (error) {
        return res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
});

module.exports = router;
