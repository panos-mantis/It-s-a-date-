import { BrowserRouter as Router , Routes, Route } from 'react-router-dom';
import './App.css';
import TopNav from './components/Navbar';
import Home from"./components/Home"
import SingleDate from './components/SingleDate';
import Register from './components/Register'
import LogIn from './components/LogIn'
import AddDate from './components/AddDate'
import AllDates from './components/AllDates'
import DateTypes from './components/DateTypes'
import NotFound from './components/NotFound'
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import BackTop from './components/BackTop';

function App() {
  return (
    <>
    <TopNav/>
    <Router>
      <Routes>
        <Route path="/home" element ={<Home/>}/>
        <Route path="/" element ={<Home/>}/>
        <Route path="/AddDate" element ={<AddDate/>}/>
        <Route path="/AllDates" element ={<AllDates/>}/>
        <Route path="/DateTypes/:type" element ={<DateTypes/>}/>
        <Route path="/LogIn" element ={<LogIn/>}/>
        <Route path="/Register" element ={<Register/>}/>
        <Route path="/SingleDate/:id" element ={<SingleDate/>}/>
        <Route path="*" element ={<NotFound/>}/>
        <Route path="/Admin" element ={<AdminPanel/>}/>
      </Routes>
    </Router>
    <BackTop/>
    <Footer/>
    </>
    
   
  );
}

export default App;
