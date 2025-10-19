import React, { useEffect, useState, useRef } from 'react'
import {  dummyDateTimeData, dummyShowsData } from '../assets/assets';
import { useNavigate, useParams } from 'react-router-dom';
import BlurCircle from '../components/BlurCircle';
import { Heart, PlayCircleIcon, StarIcon } from 'lucide-react';

import { timeFormate } from '../lib/timeFormate';
import DateSelect from '../components/DateSelect';
import MovieCard from '../components/MovieCard';
import Loading from '../components/Loading';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

export const MoviesDetails = () => {
  const navigate = useNavigate();

  const {id} =  useParams();
  const [show, setShow] = useState(null);
  const dateSelectRef = useRef(null);

  const {shows,axios,getToken,user,fetchFavoriteMovies,favoriteMovies,image_base_url} = useAppContext();


  const getShow = async()=>{
    try{
      const token = await getToken();
      const{data} = await axios.get(`/api/show/${id}`)
       
      
      if(data.success){
        setShow(data);
        
      }

    }catch(error){
      console.error(error)
  }
  }

  const handleFavorite = async()=>{
    try{

        if(!user){
      return toast.error("Please sign in to add to favorites");
    }

    const {data} = await axios.post('/api/user/update-favorite',{
      movieId : id
    },{
      headers : {Authorization:  `Bearer ${await getToken()}`}}
    )
    if(data.success){
      await fetchFavoriteMovies();
      toast.success(data.message);
    } else {
      toast.error(data.message);
    }

    }catch(error){
      console.error(error)
    }
  }

  useEffect(()=>{
    getShow();
  },[id]);


  return show  ? (
    <div className='px-6 md:mx-16 lg;px-40 ot-30 md:pt-50'>
      <div className='flex flex-col md:flex-row gap-8 max-w-6xl mx-auto'> 

        <img src={image_base_url + show.movie.poster_path} alt='' className='max-md:mx-auto
        rounded-xl max-w-72 h-104 object-cover'/>

        <div className='relative flex flex-col gap-3'>
          <BlurCircle top='-100px' left='-100px'/>
          <p className='text-primary'>ENGLISH</p>
          <h1 className='text-4xl max-w-96 text-balance font-semibold'>{show.movie.title}</h1>

          <div className='flex items-center gap-2 text-gray-300'>
            <StarIcon className='w-5 h-5 text-primary fill-primary'/>
            {show.movie.vote_average.toFixed(1)} User Rating
          </div>

          <p className='text-gray-400 mt-2 text-sm leading-tight max-w-xl'>
            {show.movie.overview}
          </p>

          <p>
            {timeFormate(show.movie.runtime)}  • {show.movie.genres.map(genre=>genre.name).join(', ')} • {show.movie.release_date.split('-')[0]}
          </p> 

          <div className='flex items-center flex-wrap gap-4 mt-4'>
            <button className='flex items-center gap-2 px-7 py-3 text-sm 
             bg-gray-800 hover:bg-gray-600 transition rounded-md font-medium
             cursor-pointer active:scale-95 '>
            <PlayCircleIcon className='w-5 h-5'/>
            Watch Trailers
            </button>

            <a
              href="#date-select"
              onClick={e => {
                e.preventDefault();
                dateSelectRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className='px-10 py-3 text-sm bg-primary
            hover:bg-primary-dull transition rounded-md font-medium cursor-pointer
            active:scale-95'
            >
              Buy Tickets
            </a>
            <button onClick={handleFavorite} className='bg-gray-700 p-2.5 rounded-full transition
            cursor-pointer active:scale-95'>
              <Heart className={`w-5 h-5 ${favoriteMovies.find(movie => movie._id === id) ? 'fill-primary text-primary' : ''}`}/>
            </button>
          </div>


        </div>
      </div>

      <p className='text-lg font-medium mt-20'>Your Favorite Cast</p>
      <div className='overflow-x-auto no-scrollbar  mt-8 pb-4'>
        <div className='flex items-center gap-4 w-max px-4'>
          {show.movie.casts.slice(0,12).map((cast,index)=>(
            <div key={index} className='flex flex-col items-center text-center'>
              <img src={image_base_url + cast.profile_path} alt='' className='rounded-full h-20
              md:h-20 aspect-square object-cover'/>
              <p className='font-medium text-xs mt-3 '>{cast.name}</p>
              
             </div> 
          ))}
        </div>
      </div>

          <DateSelect ref={dateSelectRef} dateTime={show.dateTime} id={id}/>

          <p className='text-lg font-medium mt-20 mb-8'>You May Also Like</p>
          <div className='flex flex-wrap max-sm:justify-center gap-8'>
            {shows.slice(0,4).map((movie,index)=>(
              <MovieCard key={index} movie={movie}/>
            ))}
          </div>
          <div className='flex justify-center mt-20'>
            <button onClick={()=>{navigate('/movies');scrollTo(0,0)}} className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md
            font-medium cursor-pointer mt-20 mb-40'>
                Show more
            </button>
          </div>
    </div>
  
  ) : (
    <div><Loading/></div>
  )
}

export default MoviesDetails