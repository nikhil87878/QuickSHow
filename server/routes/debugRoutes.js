import express from 'express';
import Booking from '../models/Booking.js';
import mongoose from 'mongoose';

const router = express.Router();

// Dev-only: show mongoose connection status
router.get('/status', (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ success: false, message: 'Not allowed in production' });
  try {
    return res.json({ success: true, readyState: mongoose.connection.readyState, dbName: mongoose.connection.name });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// Dev-only: mark a booking as paid to verify DB writes
router.post('/mark-paid', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ success: false, message: 'Not allowed in production' });

    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId required' });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.isPaid = true;
    booking.paymentLink = '';
    const saved = await booking.save();

    return res.json({ success: true, booking: saved });
  } catch (error) {
    console.error('debug mark-paid error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Dev-only: fetch a booking by id
router.get('/booking/:id', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ success: false, message: 'Not allowed in production' });
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    return res.json({ success: true, booking });
  } catch (e) {
    console.error('debug fetch booking error:', e);
    return res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
