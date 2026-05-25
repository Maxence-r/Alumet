const express = require('express');
const urlMetadata = require('url-metadata');
const Account = require('../../models/account');
const Alumet = require('../../models/alumet');
const Invitation = require('../../models/invitation');
const Incident = require('../../models/incident');
const Conversation = require('../../models/conversation');
const Message = require('../../models/message');
const rateLimit = require('../../middlewares/authentification/rateLimit');
const { validate } = require('../../middlewares/validation/validate');
const schemas = require('../../schemas/api');
const config = require('../../config/env');
const logger = require('../../utils/logger');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();
const stripe = config.stripe.secretKey ? require('stripe')(config.stripe.secretKey) : null;

const requireStripe = (req, res, next) => {
    if (!stripe) return res.status(503).json({ error: 'Stripe is not configured', code: 'STRIPE_NOT_CONFIGURED' });
    return next();
};

router.get('/users/search', rateLimit(10), validate(schemas.userSearch), async (req, res) => {
    const searchQuery = req.query.q.trim();
    const searchType = req.query.type;
    const accountTypeQuery = searchType ? { accountType: searchType } : {};
    try {
        const contacts = await Account.find(
            {
                $and: [
                    { _id: { $ne: req.user?._id } },
                    { $or: [{ name: { $regex: searchQuery, $options: 'i' } }, { lastname: { $regex: searchQuery, $options: 'i' } }] },
                    accountTypeQuery,
                ],
            },
            '_id name lastname icon accountType badges'
        );
        return res.json(contacts);
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

router.post('/chat/conversations', async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    const participantIds = Array.isArray(req.body.participants) ? req.body.participants : [];
    const conversation = new Conversation({
        participants: participantIds,
        name: req.body.name,
        type: participantIds.length > 1 ? 'group' : 'private',
        owner: req.user.id,
        administrators: [req.user.id],
        lastUsage: Date.now(),
        icon: req.user.icon,
    });
    await conversation.save();
    return res.status(201).json({
        _id: conversation._id,
        lastUsage: conversation.lastUsage,
        isReaded: true,
        type: conversation.type,
        conversationName: conversation.name,
        conversationIcon: conversation.icon,
        participants: conversation.participants,
        userinfos: {
            name: req.user.name,
            lastname: req.user.lastname,
            icon: req.user.icon,
            accountType: req.user.accountType,
        },
    });
});

router.post('/chat/conversations/:id/messages', async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found', code: 'NOT_FOUND' });
    const message = new Message({
        sender: req.user.id,
        content: req.body.message,
        reference: conversation._id.toString(),
    });
    await message.save();
    conversation.lastUsage = Date.now();
    await conversation.save();
    global.io?.to(conversation._id.toString()).emit('message', message, req.user);
    return res.status(201).json(message);
});

router.delete('/chat/messages/:id', async (req, res) => {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found', code: 'NOT_FOUND' });
    if (message.sender !== req.user?.id) return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    await message.deleteOne();
    return res.json({ message: 'Message deleted' });
});

router.get('/invitations/:id', validate(schemas.alumetId), async (req, res) => {
    if (!req.user || !req.user.mail) return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    const invitation = await Invitation.findOne({ reference: req.params.id, mail: req.user.mail });
    if (!invitation) return res.status(404).json({ error: 'Invitation not found', code: 'NOT_FOUND' });
    return res.json({ invitation });
});

router.patch('/invitations/:id', validate(schemas.invitationPatch), rateLimit(30), async (req, res) => {
    try {
        if (!req.user || !req.user.mail) return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        const invitation = await Invitation.findOne({ reference: req.params.id, mail: req.user.mail });
        if (!invitation) return res.status(404).json({ error: 'Invitation not found', code: 'NOT_FOUND' });

        if (req.body.status === 'accepted') {
            const referenceDetails = await Alumet.findById(invitation.reference);
            if (!referenceDetails) {
                await invitation.remove();
                return res.status(404).json({ error: 'Invitation target not found', code: 'NOT_FOUND' });
            }
            referenceDetails.participants = referenceDetails.participants.filter(participant => participant.userId !== req.user.id);
            referenceDetails.participants.push({ userId: req.user.id, role: 'admin' });
            await referenceDetails.save();
        }

        await invitation.remove();
        return res.status(200).json({ message: req.body.status === 'accepted' ? 'Invitation accepted' : 'Invitation declined' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

router.get('/admin/incidents', rateLimit(30), async (req, res) => {
    const incidents = await Incident.find().sort({ createdAt: 1 });
    return res.json(incidents);
});

router.post('/admin/incidents', async (req, res) => {
    const incident = new Incident({ ...req.body, createdAt: Date.now() });
    await incident.save();
    return res.status(201).json(incident);
});

router.patch('/admin/users/:userId/suspension', async (req, res) => {
    const user = await Account.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    user.suspended = {
        reason: req.body.reason || 'Suspended',
        date: Date.now(),
    };
    await user.save();
    return res.json({ message: 'User suspended' });
});

router.delete('/admin/users/:userId/suspension', async (req, res) => {
    const user = await Account.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    user.suspended = {};
    await user.save();
    return res.json({ message: 'User unsuspended' });
});

router.post('/billing/checkout-sessions', requireStripe, asyncHandler(async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        line_items: [{ price: config.stripe.priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${config.server.publicBaseUrl}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.server.publicBaseUrl}/`,
    });
    res.redirect(303, session.url);
}));

router.post('/billing/portal-sessions', requireStripe, asyncHandler(async (req, res) => {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: 'session_id is required', code: 'BAD_REQUEST' });
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: checkoutSession.customer,
        return_url: config.server.publicBaseUrl,
    });
    res.redirect(303, portalSession.url);
}));

router.post('/billing/webhook', requireStripe, express.raw({ type: 'application/json' }), (request, response) => {
    let event = request.body;
    if (config.stripe.webhookSecret) {
        const signature = request.headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(request.rawBody || request.body, signature, config.stripe.webhookSecret);
        } catch (error) {
            logger.warn('Stripe webhook signature verification failed.', error.message);
            return response.sendStatus(400);
        }
    }
    logger.info(`Stripe event received: ${event.type}`);
    return response.send();
});

router.get('/link-metadata', rateLimit(4), async (req, res) => {
    try {
        const metadata = await urlMetadata(req.query.url);
        return res.json(metadata);
    } catch (error) {
        return res.json({});
    }
});

module.exports = router;
