import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key', {
  apiVersion: '2025-02-15-preV0' as any, // Utiliza la versión disponible para la instalación del SDK local
});
