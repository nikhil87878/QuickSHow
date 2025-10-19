import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import stripe from 'stripe';

//  Function to check availabilty of selected Seat for a movie
const checkSeatsAvailability = async (showId, selectedSeats)=>{
    try{
        // validate inputs
        if (!showId) return false;
        if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) return false;

        const showData = await Show.findById(showId);
        if(!showData) return false;

        const occupiedSeats = showData.occupiedSeats || {}; // safe default

        // ensure selectedSeats is an array before calling some
        const isAnySeatTaken = selectedSeats.some(seat => Boolean(occupiedSeats[seat]));

        return !isAnySeatTaken;

    }catch(error){
        console.log(error.message);
        return false;
    }
}

export const createBooking = async(req,res)=>{
    try{
        const {userId} = req.auth();
        const {showId,selectedSeats} = req.body;

        // validate request body
        if(!showId) return res.status(400).json({success:false, message: 'showId is required'});
        if(!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
            return res.status(400).json({success:false, message: 'selectedSeats must be a non-empty array'});
        }

        const {origin} = req.headers;

        // check if the seat is available for the selected show
        const isAvailable = await checkSeatsAvailability(showId,selectedSeats);
        if(!isAvailable){
            return res.json({success:false, message:'One or more selected seats are already booked. Please choose different seats.'})
        }

        const showData = await Show.findById(showId);
        if(!showData){
            return res.json({success:false, message:'Show not found'})
        }

        // create a new Booking
        const booking = await Booking.create({
            user:userId,
            show: showId,
            amount : showData.showPrice * selectedSeats.length,
            bookedSeats : selectedSeats
        })

        // mark seats as occupied
        showData.occupiedSeats = showData.occupiedSeats || {};
        selectedSeats.forEach((seat)=>{
            showData.occupiedSeats[seat] = userId;
        })

        showData.markModified('occupiedSeats');

        await showData.save();

        // stripe gateWay INitalsis
        const stripeInstance =  new stripe(process.env.STRIPE_SECRET_KEY);

        //  Creating line items to for stripe
        const line_items = [{
            price_data:{
                currency: 'usd',
                product_data:{
                    name: showData?.Movie?.title || 'Ticket'
                },
                unit_amount: Math.floor(booking.amount)* 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            line_items: line_items,
            mode : 'payment',
            metadata: {
                bookingId: booking._id.toString()
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60 // 30 minutes from now

        })
        booking.paymentLink = session.url
        booking.isPaid = true; // Mark as paid since payment succeeded
        await booking.save();

        // Run Inngest function to release seats and delete booking after 10 minutes if payment is not made
        await inngest.send({
            name : 'app/checkpayment',
            data : {
                bookingId : booking._id.toString()
            }
        })

        res.json({success: true, url:session.url })

    }catch(error){
        console.log(error);
        res.json({success:false, message:error.message})

    }
}

export const getOccupiedSeats = async (req,res)=>{
    try{

        const {showId} = req.params;
        if(!showId) return res.status(400).json({success:false, message: 'showId is required'});

        const showData = await Show.findById(showId);
        if(!showData) return res.status(404).json({success:false, message: 'Show not found'});

        const occupiedSeats = Object.keys(showData.occupiedSeats || {});

        res.json({success : true, occupiedSeats});

    }catch(error){
        console.log(error);
        res.json({success:false, message:error.message})

    }
}