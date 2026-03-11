const config = require('../config');
const { queries } = require('../db');
const logger = require('../logger');

let stripe = null;
try {
  if (config.stripe.secretKey) {
    stripe = require('stripe')(config.stripe.secretKey);
  }
} catch (err) {
  logger.warn('Stripe not initialized', { error: err.message });
}

async function createCheckoutSession(tenant) {
  if (!stripe) throw new Error('Stripe not configured');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: tenant.email,
    metadata: { tenant_id: tenant.id },
    line_items: [{ price: config.stripe.priceId, quantity: 1 }],
    success_url: `${config.appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.appUrl}/payment/cancel`,
    subscription_data: {
      trial_period_days: 14,
      metadata: { tenant_id: tenant.id },
    },
  });

  return { url: session.url, sessionId: session.id };
}

async function createPortalSession(tenant) {
  if (!stripe) throw new Error('Stripe not configured');
  if (!tenant.stripe_customer_id) throw new Error('No Stripe customer found');

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripe_customer_id,
    return_url: `${config.appUrl}/site/${tenant.subdomain}`,
  });

  return { url: session.url };
}

function handleWebhook(payload, signature) {
  if (!stripe) throw new Error('Stripe not configured');

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  logger.info('Stripe webhook received', { type: event.type });

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const tenantId = session.metadata?.tenant_id;
      if (tenantId) {
        queries.updateTenantStripe(tenantId, {
          customerId: session.customer,
          subscriptionId: session.subscription,
          status: 'active',
        });
        logger.info('Tenant subscription activated', { tenantId });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      queries.updateSubscriptionStatus(sub.id, sub.status);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      queries.updateSubscriptionStatus(sub.id, 'canceled');
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        queries.updateSubscriptionStatus(invoice.subscription, 'past_due');
      }
      break;
    }
    default:
      logger.debug('Unhandled webhook event', { type: event.type });
  }

  return { received: true };
}

module.exports = { createCheckoutSession, createPortalSession, handleWebhook };
