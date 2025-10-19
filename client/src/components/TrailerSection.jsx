import React, { useState } from 'react'
import { dummyTrailers } from '../assets/assets'
import BlurCircle from './BlurCircle';
import ReactPlayer from 'react-player';
import { PlayCircleIcon } from 'lucide-react';

const TrailerSection = () => {

    const [ currentTrailer, setCurrentTrailer ] = useState(dummyTrailers[0]);

   return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-12 overflow-hidden">
      <p className="text-gray-300 font-medium text-lg max-w-max mx-auto">Trailers</p>
      <div className="relative mt-6">
        <BlurCircle top="-100px" right="-100px" />
        <ReactPlayer
          url={currentTrailer.videoUrl}
          controls={true}
          className="mx-auto max-w-full"
          width="960px"
          height="540px"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {dummyTrailers.map((trailer, index) => (
            <div
            key={index}
            className="relative cursor-pointer hover:opacity-50 hover:translate-y-1 transition duration-300"
            onClick={() => setCurrentTrailer(trailer)}
            >
            <img
            src={trailer.image}
            alt="trailer"
            className="rounded-lg w-full h-full object-cover brightness-75"
            loading="lazy"
            onError={(e) => { e.target.src = '/fallback.jpg'; }}
            />
            <PlayCircleIcon
            strokeWidth={1.6}
             className="absolute top-1/2 left-1/2 w-8 h-5 md:w-12 md:h-12 transform -translate-x-1/2 -translate-y-1/2"
            />
    </div>
  ))}
</div>
      

    </div>
  );

}

export default TrailerSection