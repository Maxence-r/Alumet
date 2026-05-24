const express = require('express');
const router = express.Router();
const config = require('../../config/env');
const logger = require('../../utils/logger');
const asyncHandler = require('../../utils/asyncHandler');

const stripe = config.stripe.secretKey ? require('stripe')(config.stripe.secretKey) : null;

const requireStripe = (req, res, next) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  return next();
};

router.post('/create-checkout-session', requireStripe, asyncHandler(async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: config.stripe.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${config.server.publicBaseUrl}/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.server.publicBaseUrl}/`,
  });
  res.redirect(303, session.url);
}));

router.post('/create-portal-session', requireStripe, asyncHandler(async (req, res) => {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
  
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: checkoutSession.customer,
      return_url: config.server.publicBaseUrl,
    });

    res.redirect(303, portalSession.url);
}));

  router.post(
    '/webhook',
    requireStripe,
    express.raw({ type: 'application/json' }),
    (request, response) => {
      let event = request.body;
      if (config.stripe.webhookSecret) {
        const signature = request.headers['stripe-signature'];
        try {
          event = stripe.webhooks.constructEvent(
            request.rawBody || request.body,
            signature,
            config.stripe.webhookSecret
          );
        } catch (err) {
          logger.warn('Stripe webhook signature verification failed.', err.message);
          return response.sendStatus(400);
        }
      }
      let subscription;
      let status;
      // Handle the event
      switch (event.type) {
        case 'customer.subscription.trial_will_end':
          subscription = event.data.object;
          status = subscription.status;
          logger.info(`Subscription trial will end. Status is ${status}.`);
          break;
        case 'customer.subscription.deleted':
          subscription = event.data.object;
          status = subscription.status;
          logger.info(`Subscription deleted. Status is ${status}.`);
          break;
        case 'customer.subscription.created':
          subscription = event.data.object;
          status = subscription.status;
          logger.info(`Subscription created. Status is ${status}.`);
          break;
        case 'customer.subscription.updated':
          subscription = event.data.object;
          status = subscription.status;
          logger.info(`Subscription updated. Status is ${status}.`);
          break;
        default:
          logger.info(`Unhandled Stripe event type ${event.type}.`);
      }
      response.send();
    }
  );
  

module.exports = router;
