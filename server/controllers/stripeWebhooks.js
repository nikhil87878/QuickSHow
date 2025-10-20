import Stripe from 'stripe';
import Booking from '../models/Booking.js';
import { inngest } from '../inngest/index.js';
import mongoose from 'mongoose';

export const stripeWebhooks = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    console.log('Stripe webhook received - signature:', sig);
        console.log('req.body type:', Object.prototype.toString.call(req.body));
        const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    console.log('Stripe webhook raw body (truncated):', rawBody.slice(0, 1000));

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

        let event;
        try {
            // Defensive: trim whitespace/newlines which commonly appear when copying the secret
            const rawSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
            const trimmedSecret = rawSecret.trim();
            if (rawSecret !== trimmedSecret) {
                console.warn('STRIPE_WEBHOOK_SECRET contained leading/trailing whitespace; trimming before verification');
            }

            event = stripeInstance.webhooks.constructEvent(req.body, sig, trimmedSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

    try {
        console.log('Stripe event type:', event.type);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            console.log('checkout.session.completed -> id:', session.id, 'payment_status:', session.payment_status, 'metadata:', session.metadata);

            const bookingId = session.metadata?.bookingId;
            if (!bookingId) {
                console.warn('No bookingId found in session metadata');
                return res.json({ received: true });
            }

            console.log('Mongoose readyState:', mongoose.connection.readyState, 'DB:', mongoose.connection.name);
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                console.warn('Booking not found for id:', bookingId);
                return res.json({ received: true });
            }

            booking.isPaid = true;
            booking.paymentLink = '';
            const saved = await booking.save();
            console.log('Booking updated by webhook:', saved._id.toString(), 'isPaid:', saved.isPaid);

            try {
                await inngest.send({ name: 'app/show.booked', data: { bookingId: bookingId } });
            } catch (e) {
                console.error('Inngest send failed:', e);
            }

            return res.json({ received: true });
        }

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            console.log('payment_intent.succeeded -> id:', paymentIntent.id);

            const sessions = await stripeInstance.checkout.sessions.list({ payment_intent: paymentIntent.id });
            const session = sessions.data && sessions.data.length ? sessions.data[0] : null;
            if (!session) {
                console.warn('No checkout session found for payment_intent:', paymentIntent.id);
                return res.json({ received: true });
            }

            const bookingId = session.metadata?.bookingId;
            if (!bookingId) {
                console.warn('No bookingId in session metadata for payment_intent case');
                return res.json({ received: true });
            }

            const booking = await Booking.findById(bookingId);
            if (!booking) {
                console.warn('Booking not found for id (payment_intent):', bookingId);
                return res.json({ received: true });
            }

            booking.isPaid = true;
            booking.paymentLink = '';
            const saved = await booking.save();
            console.log('Booking updated by payment_intent fallback:', saved._id.toString(), 'isPaid:', saved.isPaid);

            try {
                await inngest.send({ name: 'app/show.booked', data: { bookingId: bookingId } });
            } catch (e) {
                console.error('Inngest send failed (payment_intent):', e);
            }

            return res.json({ received: true });
        }

        console.log('Unhandled Stripe event type:', event.type);
        return res.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook event:', error);
        return res.status(500).send('Internal Server Error');
    }
};