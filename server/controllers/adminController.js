import { err } from "inngest/types";
import Booking from "../models/Booking.js"
import Show from "../models/Show.js";
import { populate } from "dotenv";
import { create } from "domain";
import User from "../models/User.js";



// Api to check if user is Admin
export const isAdmin = async (req,res)=>{
    res.json({success:true , isAdmin:true})
}

// APi to get dashBoard data
export const getDashboardData = async (req,res)=>{
    try{
        const booking = await Booking.find({isPaid : true});
        const activeShows = await Show.find({showDateTime : {$gte: new Date()}}).populate('Movie');
        const totalUser = await User.countDocuments();

        const dashBoardData = {
            totalBookings : booking.length,
            totalRevenue : booking.reduce((acc,booking)=>acc+booking.amount,0),
            activeShows,
            totalUser
        }

        res.json({success:true,dashboardData: dashBoardData});
    }catch(error){
        console.error(error)
        res.json({success : false, message : error.message})
    }
}

// Api to get all shows
export const getAllShows = async (req,res)=>{
    try{
        // do DB-side sort before awaiting the query result
        const shows = await Show.find({ showDateTime: { $gte: new Date() } })
            .populate('Movie')
            .sort({ showDateTime: 1 });

        res.json({ success: true, shows });
    }catch(error){
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// Api to get all bookings
export const getAllBookings = async (req,res)=>{
    try{
        const booking = await Booking.find({}).populate('User').populate({
            path : "show",
            populate: {path:'Movie'}
        }).sort({createdAt : -1})
        res.json({success: true , booking})

    }catch(error){
        console.error(error)
        res.json({success : false, Message : error.Message})
    }
}
