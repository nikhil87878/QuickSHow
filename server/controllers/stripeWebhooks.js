import Stripe from 'stripe';
import Booking from '../models/Booking.js';
import { inngest } from '../inngest/index.js';
import mongoose from 'mongoose';

export const stripeWebhooks = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

        let event;
        try {
            

            event = stripeInstance.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

    try {
        console.log('Stripe event type:', event.type);

        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                const sessionList = await stripeInstance.checkout.sessions.list({ payment_intent: paymentIntent.id });

                const session = sessionList.data[0];

                const {bookingId} = session.metadata;

                await Booking.findByIdAndUpdate(bookingId, { isPaid: true, paymentLink: '' });
                break;
            }

            default:
                // Unexpected event type
                console.log(`Unhandled event type ${event.type}`);
        }

           
        console.log('Unhandled Stripe event type:', event.type);
        return res.json({ received: true });
        

        

    } catch (error) {
        console.error('Error processing webhook event:', error);
        return res.status(500).send('Internal Server Error');
    }
};