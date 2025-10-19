import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";

// API controller function to get User Bookings
export const getUserBookings = async (req,res)=>{
    try{
        const user = req.auth().userId;

        const booking = await Booking.find({user}).populate({
            path : "show",
            populate: {path : "Movie"}

        }).sort({createdAt: -1});
        console.log(booking);
        res.json({success : true,booking})
    }catch(error){
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
}

// APi Controller function to Add favorite Movie in Clerk User Metadata
export const addFavorite = async(req,res)=>{
    try{
        const {movieId}= req.body;
        const userId = req.auth().userId;

        const user = await clerkClient.users.getUser(userId);

        if (!user.privateMetadata) user.privateMetadata = {};
        if (!Array.isArray(user.privateMetadata.favorites)) user.privateMetadata.favorites = [];

        if (!user.privateMetadata.favorites.includes(movieId)){
            user.privateMetadata.favorites.push(movieId);
            await clerkClient.users.updateUserMetadata(userId,{privateMetadata:user.privateMetadata});
        }

        res.json({success:true , message : "Favorite Added Successfully"})

    }catch(error){
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
}

// APi Controller function to Update favorite Movie in Clerk User Metadata (toggle)
export const updateFavorite = async(req,res)=>{
    try{
        const {movieId}= req.body;
        const userId = req.auth().userId;

        const user = await clerkClient.users.getUser(userId);

        if (!user.privateMetadata) user.privateMetadata = {};
        if (!Array.isArray(user.privateMetadata.favorites)) user.privateMetadata.favorites = [];

        const idx = user.privateMetadata.favorites.indexOf(movieId);
        if (idx === -1) {
            user.privateMetadata.favorites.push(movieId);
        } else {
            user.privateMetadata.favorites.splice(idx, 1);
        }

        await clerkClient.users.updateUserMetadata(userId,{privateMetadata:user.privateMetadata})

        res.json({success:true , message : "Favorite movies updated"})

    }catch(error){
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
}

// Api to get all list favorite movies list
export const getFavorites = async(req,res)=>{
    try{
        const userId = req.auth().userId;
        const user = await clerkClient.users.getUser(userId)

        const favorites = Array.isArray(user.privateMetadata?.favorites) ? user.privateMetadata.favorites : [];

        // getting movies from database (empty array if no favorites)
        const movies = favorites.length ? await Movie.find({_id:{$in: favorites}}) : [];

        res.json({success:true, movies})

    }catch(error){
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
}
