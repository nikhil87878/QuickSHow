import React, { use, useEffect, useState } from 'react'
import { dummyShowsData } from '../../assets/assets';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateformat } from '../../lib/dateFormat';
import { useAppContext } from '../../context/AppContext';

const ListShows = () => {
    const currency = import.meta.env.VITE_CURRENCY
    const {axios,getToken , user,image_base_url}= useAppContext();

    const [show,setShow] = useState([]);
    const [loading, setLoading] = useState();

    const getAllShows = async () =>{
        try{
            const token = await getToken();
            const {data} = await axios.get('/api/admin/all-shows',{
              headers : {Authorization:  `Bearer ${token}`}}
            )
            setShow(data.shows);
            setLoading(false);
        }
        catch(error){
            console.error(error)
        }
        
    }
    useEffect(()=>{
        if(user){
            getAllShows();
        }
    },[user]);

  return !loading ? (
   <>
    <Title text1="List" text2="Shows"/>
    <div className='max-w-4xl mt-6 overflow-x-auto'>
        <table className='w-full border-collapse rounded-md overflow-hidden text-nowrap'>
            <thead>
                <tr className='bg-primary/20 text-left text-white'>
                    <th className='p-2 font-medium pl-5'>Movie Name</th>
                    <th className='p-2 font-medium pl-5'>Show Time</th>
                    <th className='p-2 font-medium pl-5'>Total Bookings</th>
                    <th className='p-2 font-medium pl-5'>Earning</th>
                </tr>
            </thead>
            <tbody className="text-sm font-light">
                {show?.map((show, index) => (
                    <tr  key={index} className="border-b
                     border-primary/10 bg-primary/5 even:bg-primary/10" >
                        <td className="p-2 min-w-45 pl-5">{show?.Movie?.title}</td>

                        <td className="p-2">{dateformat(show.showDateTime)} </td>
                        <td className="p-2">{Object.keys(show.occupiedSeats).length}</td>

                         <td className="p-2">{currency} {Object.keys(show.occupiedSeats).length * show.showPrice}</td>
                    </tr>
                ))}
            </tbody>

        </table>
    </div>
   </>
  
) : <Loading/>
}

export default ListShows