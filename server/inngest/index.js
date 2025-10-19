import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });


// Inngest funtion to  save user data to a database
const syncUserCreation = inngest.createFunction(
    {id:'sync-user-from-clerk'},
    {event : 'clerk/user.created'},
    async ({event})=>{
        const {id,first_name,last_name,email_addresses,image_url} = event.data;
        const userData = {
            _id : id,
            email :email_addresses[0].email_addresses,
            name: first_name + " " + last_name,
            image : image_url
        }
        await User.create(userData);
    }
)

// Inngest Function to delete user from dataBAse
const syncUserDeletion = inngest.createFunction(
    {id:'delete-user-from-clerk'},
    {event : 'clerk/user.deleted'},
    async ({event})=>{
        const {id} = event.data;
        
        await User.findByIdAndDelete(id);
    }
)

// Update funtion using Inngest
const syncUserUpdation = inngest.createFunction(
    {id:'update-user-from-clerk'},
    {event : 'clerk/user.updated'},
    async ({event})=>{
        const {id,first_name,last_name,email_addresses,image_url} = event.data;
        const userData = {
            _id : id,
            email :email_addresses[0].email_addresses,
            name: first_name + " " + last_name,
            image : image_url
        }
        await User.findByIdAndUpdate(id,userData);
    }
)

// Inngest Functions to cancle booking and release seats of show after 10 min of booking if created payment is not made
const releaseSeatsAndDeleteBooking = inngest.createFunction(
    {id:'release-seats-delete-booking'},
    {event : 'app/checkpayment'},
    async ({event,step})=>{
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
        await step.sleepUntil('Wait-for-10-minutes', tenMinutesLater);

        await step.run('Check-payment-status', async () => {
            const {bookingId} = event.data.bookingId;
            const bookingData = await Booking.findById(bookingId);
            if(bookingData && !bookingData.isPaid){
                // release seats
                const showData = await Show.findById(bookingData.show);
                bookingData.bookedSeats.forEach((seat)=>{
                    delete showData.occupiedSeats[seat];
                })
                showData.markModified('occupiedSeats');
                await showData.save();  
                // delete booking
                await Booking.findByIdAndDelete(bookingId);
            }

        });

    }
)




// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking
];