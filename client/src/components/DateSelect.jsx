import React, { useState, forwardRef } from 'react'
import BlurCircle from './BlurCircle'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const DateSelect = forwardRef(({ dateTime, id }, ref) => {
    const [selected, setSelected] = useState(null);

    const navigate= useNavigate();
    const onBookHandler = ()=>{
        if(!selected){
            return toast('Please select a time slot first' , {icon:'⚠️'});

        }
        navigate(`/movies/${id}/${selected}`)
        scroll(0,0);
    }

  return (
    <div ref={ref} id='dateSelect' className='pt-30'>
        <div className='flex flex-col md:flex-row items-center justify-between gap-10
        relative p-8 bg-primary/10 rounded-lg border border-primary/20'>
            <BlurCircle top='-100px' left='-100px'/>
            <BlurCircle top='100px' right='0px'/>

            <div>
                <p className='text-lg font-semibold'>Choose Date</p>
                <div className='flex items-center gap-6 text-sm mt-5'>
                    <ChevronLeftIcon width={28}/>
                    <span className='grid grid-cols-3 md:flex flex-wrap md:max-w-lg gap-4'>
                        {Object.keys(dateTime).map((date)=>(
                            <button onClick={()=> setSelected(date)} key={date} className={`flex flex-col items-center
                            justify-center h-14 w-14 aspect-square rounded cursor-pointer ${selected===date ? 'bg-primary text-white' : 'border border-primary/70'}`}>
                                <span className='font-medium'>{new Date(date).getDate()}</span>
                                <span className='text-sm'>{new Date(date).toLocaleDateString('en-US',{month:'short'})}</span>
                            </button>
                        ))}
                    </span>
                    <ChevronRightIcon width={28}/>
                </div>
                    

            </div>
                    <button onClick={onBookHandler} className='bg-primary text-white px-8 py-2 mt-6 
                    rounded hover:bg-primary/90 transition-all cursor-pointer'>
                    Book Now</button>
        </div>

    </div>
  )
})

export default DateSelect