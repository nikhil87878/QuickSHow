import axios from "axios"
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { err } from "inngest/types";

// API to get now playing movies from TMDB API
export const getNowPlayingMovies = async (req, res)=>{
    try{
       const {data} =  await axios.get('https://api.themoviedb.org/3/movie/now_playing',{
            headers : {Authorization : `Bearer ${process.env.TMDB_API_KEY}`}
        })

        const movies = data.results;
        res.json({success:true , movies:movies})
    }
    catch(error)
    {
        console.error(error);
        res.json({success:false , message: error.message})
    }
}

// api to add A new to database
export const addshow = async (req, res)=>{
    try{
       const{movieId , showsInput, showPrice}= req.body

       let movie = await Movie.findById(movieId)

       if(!movie){
        // Fetch movie details and credits from TMDB API
            const [movieDetailsResponse,movieCreditsResponse] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}`,{
                    headers : {Authorization : `Bearer ${process.env.TMDB_API_KEY}`} }),

                    axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`,{
                        headers : {Authorization : `Bearer ${process.env.TMDB_API_KEY}`}
                    })
            ]);
            const movieApiData = movieDetailsResponse.data;
            const movieCreditsData = movieCreditsResponse.data;
            const movieDetails = {
                     _id: movieId,
                     title: movieApiData.title,
                     overview: movieApiData.overview,
                     poster_path: movieApiData.poster_path,
                     backdrop_path: movieApiData.backdrop_path,
                    genres: movieApiData.genres,
                     casts: movieCreditsData.cast,
                     release_date: movieApiData.release_date,
                     original_language: movieApiData.original_language,
                     tagline: movieApiData.tagline || "",
                     vote_average: movieApiData.vote_average,
                     runtime: movieApiData.runtime,
                    }

            // Add movie to database
            movie = await Movie.create(movieDetails);

       }

       const showsToCreate = [];
       showsInput.forEach(show => {
        const showDate = show.date;
        show.time.forEach((time)=>{
            const dateTimeString =  `${showDate}T${time}`;
            showsToCreate.push({
                Movie : movieId,
                showDateTime : new Date(dateTimeString),
                showPrice,
                occupiedSeats: {}
            })
        })
       });

       if(showsToCreate.length > 0){
        await Show.insertMany(showsToCreate);
       }
       res.json({success:true , message: 'Show Added successfully'})

    }
    catch(error)
    {
        console.error(error);
        res.json({success:false , message: error.message})
    }
}



// APi to get show from database
export const getShows = async (req,res)=> {
    try{
        const shows = await Show.find({showDateTime : {$gte: new Date()}}).populate
        ('Movie').sort({showDateTime:1});

        // filter Unique shows
        const UniqueShows = new Set(shows.map(show=> show.Movie))

        res.json({success : true , shows: Array.from(UniqueShows)})

    }catch(error){
        console.log(error);
         res.json({success : false , message: error.message});

    }
}

// Api  to get a single show from the database
export const getShow = async (req,res) => {
    try{
        const {movieId} = req.params;

        // get all upcoming shows for the movie
        const shows = await Show.find({Movie : movieId,showDateTime : {$gte: new Date()}})

        const movie = await Movie.findById(movieId);
        const dateTime= {}

        shows.forEach((show)=>{
            const date = show.showDateTime.toISOString().split("T")[0];
            if(!dateTime[date]){
                dateTime[date]= []
            }
            dateTime[date].push({time:show.showDateTime,showID : show._id})
        })

        res.json({success:true , movie,dateTime})

    }catch(error){
         console.error(error);
         res.json({success:false , message:error.message});
    }
}