import express from 'express'
import { protectAdmin } from '../middleware/auth.js';
import { getAllBookings, getAllShows, getDashboardData, isAdmin } from '../controllers/adminController.js';

const adminRoutes = express.Router();

adminRoutes.get('/is-admin',protectAdmin,isAdmin)
adminRoutes.get('/dashboard',protectAdmin,getDashboardData)
adminRoutes.get('/all-shows',protectAdmin,getAllShows)
adminRoutes.get('/all-bookings',protectAdmin,getAllBookings)

export default adminRoutes