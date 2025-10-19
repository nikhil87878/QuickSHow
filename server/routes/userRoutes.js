import express from 'express'
import { getFavorites, getUserBookings, updateFavorite } from '../controllers/userController.js';

const userRoutes = express.Router();

userRoutes.get('/booking',getUserBookings)
userRoutes.post('/update-favorite',updateFavorite)
userRoutes.get('/favorites',getFavorites)

export default userRoutes;