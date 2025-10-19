import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Movies from './pages/Movies'
import SeatLayout from './pages/SeatLayout'
import MoviesDetails from './pages/MoviesDetails'
import MyBookings from './pages/MyBookings'
import Favorite from './pages/Favorite'
import Home from './pages/Home'
import{Toaster} from 'react-hot-toast'
import Footer from './components/Footer'
import Layout from './pages/Admin/Layout'
import Dashboard from './pages/Admin/Dashboard'
import { AddShows } from './pages/Admin/AddShows'
import ListShows from './pages/Admin/ListShows'
import ListBookings from './pages/Admin/ListBookings'
import { AppContext, useAppContext } from './context/AppContext'
import { SignIn } from '@clerk/clerk-react'
import Loading from './components/Loading'

const App = () => {


  const isAdminRoute = useLocation().pathname.startsWith('/admin');

  const {user} = useAppContext();

  return (
    <>
    <Toaster/>
      {!isAdminRoute ? <Navbar/>: null}
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='movies' element={<Movies/>}/>
        <Route path='movies/:id' element={<MoviesDetails/>}/>
        <Route path='movies/:id/:date' element={<SeatLayout/>}/>
        <Route path='/my-bookings' element={<MyBookings/>}/>
        <Route path='/loading/:nextUrl' element={<Loading/>}/>

        <Route path='favorite' element={<Favorite/>}/>

        <Route path='/admin/*' element={user ? <Layout/> : (
          <div className='min-h-screen flex justify-center items-center'>
            <SignIn fallbackRedirectUrl={'/admin'}/>
          </div>
        )}>
            <Route index element={<Dashboard/>}/>
            <Route path='add-shows' element={<AddShows/>}/>
            <Route path='list-bookings' element={<ListBookings/>}/>
            <Route path='list-shows' element={<ListShows/>}/>
        </Route>
      </Routes>
      {!isAdminRoute && <Footer/>}
    </>
  )
}

export default App