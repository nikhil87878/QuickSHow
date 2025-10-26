import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { model } from "mongoose";
import sendEmail from "../configs/nodeMailer.js";

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
        const tenMinutesLater = new Date(Date.now() + 1 * 60 * 1000);
        await step.sleepUntil('Wait-for-10-minutes', tenMinutesLater);

        await step.run('Check-payment-status', async () => {
            const {bookingId} = event.data.bookingId;
            console.log('Checking payment status for bookingId:', bookingId);
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
                await Booking.findByIdAndDelete(bookingData._id);
            }

        });

    }
)

// Ingest function to send email where user book a show
const sendBookingEmail = inngest.createFunction(
    {id:'send-booking-confirmation-email'},
    {event : 'app/show-booked'},
    async ({event})=>{
        const {bookingId,userId} = event.data;

        const booking = await Booking.findById(bookingId).populate({
            path : 'Show',
            populate : {
                path : 'Movie',
                model   : 'Movie'
            }}).populate('User');

            await sendEmail({
                to : booking.user.email,
                subject : `Booking Confirmation - ${booking.show.movie.title}`,
                body : `<h1>Your booking is confirmed!</h1>
                <p>Booking ID: ${booking._id}</p>
                <p>Movie: ${booking.show.movie.title}</p>
                <p>Showtime: ${booking.show.startTime}</p>
                <p>Seats: ${booking.bookedSeats.join(', ')}</p>
                <p>Thank you for booking with us!</p>
                `  

            })
        });


// Ingest function to send email remainder 
const sendShowReminderEmail = inngest.createFunction(
    {id:'send-show-reminder'},
    {cron: '0 */9 * * *'}, // every 9 hours
   
    async ({step})=>{
       const now = new Date();
       const in9Hours = new Date(now.getTime() + 9 * 60 * 60 * 1000);
       const windowStart = new Date(in9Hours.getTime() - 10 * 60 * 1000);

    //    pepare remainder tasks
    const remainderTasks= await step.run('prepare-remainder-tasks', async ()=>{
        const shows = await Show.find({
            startTime : {
                $gte : windowStart,
                $lte : in9Hours
            }
        }).populate('Movie');

        const tasks = [];

        for(const show of shows){
            if(!show.Movie || !show.occupiedSeats) continue;

            const userIds = [...new Set(Object.values(show.occupiedSeats))];
            if(userIds.length ===0) continue;

            const users = (await User.find({_id : {$in : userIds}})).select('name email');
            for(const user of users){
                tasks.push({
                    userEmail : user.email,
                    userName : user.name,
                    movieTitle : show.Movie.title,
                    showTime : show.showTime
                });
            }
        }
        return tasks;
    });
    if(remainderTasks.length ===0) return;

    // send remainder emails
    const results = await step.run('send-all-remainders', async ()=>{
        return await Promise.allSettled(
            remainderTasks.map(task=>
                sendEmail({
                    to : task.userEmail,
                    subject : `Reminder: Upcoming Show - ${task.movieTitle}`,
                    body : `<h1>Reminder: Your show is coming up!</h1>
                    <p>Dear ${task.userName},</p>
                    <p>This is a friendly reminder that you have an upcoming show for <strong>${task.movieTitle}</strong> scheduled at <strong>${new Date(task.showTime).toLocaleString()}</strong>.</p>
                    <p>We look forward to seeing you there!</p>
                    <p>Best regards,<br/>Movie Ticket Booking Team</p>
                    `
                })
            )
        );
            const sent = results.filter(r=>r.status ==='fulfilled').length;
            const failed = results.filter(r=>r.status ==='rejected').length;

            return {sent,failed,
                message : `Sent ${sent} reminders, ${failed} failed.`};
        }
        );
    });


    // inngest function to send notification when a new show is added
const sendNewShowNotification = inngest.createFunction(
    {id:'send-new-show-notification'},
    {event : 'app/show.added'},
    async ({event})=>{
        const {movieTitle,movieId} = event.data;

        const users = await User.find({})

        for(const user of users){
            const userEmail = user.email;
            const userName = user.name;

            const subject = `New Show Added: ${movieTitle}`;
            const body = `<h1>New Show Alert!</h1>
            <p>Dear ${userName},</p>
            <p>We are excited to inform you that a new show for <strong>${movieTitle}</strong> has just been added to our lineup. Don't miss out on the chance to book your tickets now!</p>
            <p>Click <a href="http://yourwebsite.com/movies/${movieId}">here</a> to view the show details and book your tickets.</p>
            <p>Best regards,<br/>Movie Ticket Booking Team</p>
            `;
            await sendEmail({
            to : userEmail,
            subject,
            body
        });
        }
        return {message : 'Notifications sent to all users.'};
    }
)




// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking,
    sendBookingEmail,
    sendShowReminderEmail
];