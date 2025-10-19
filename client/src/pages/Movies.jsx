import React from 'react'
import { dummyShowsData } from '../assets/assets'
import MovieCard from '../components/MovieCard'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'

const Movies = () => {

  const {shows} = useAppContext();
  return  shows?.length>0 ? (
    <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 
    overflow-hidden min-h-[80vh]'>

        <BlurCircle top="150px" left="0px"/>
        <BlurCircle bottom="50px" right="50px"/>
         <h1 className='text-lg font-medium my-4'>Now Showing</h1>
         <div className='flex flex-wrap justify-center sm:justify-start gap-8 mt-8'>
          {shows.map((movie)=>(
            <MovieCard movie={movie} key={movie._id}/>
          ))}
         </div>


    </div>
  ) : (
    <div className='flex items-center justify-center h-[80vh]'>
      <h1 className='text-2xl font-medium'>No Movies Available</h1>
    </div>
  )
}

export default Movies