import { BrowserRouter as Router , Routes, Route } from 'react-router-dom';
import './App.css';
import TopNav from './components/Navbar';
import Home from"./components/Home"
import SingleDate from './components/SingleDate';
import Register from './components/Register'
import LogIn from './components/LogIn'
import AddDate from './components/AddDate'
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
        <Route path="https://its-a-date.onrender.com/home" element ={<Home/>}/>
        <Route path="https://its-a-date.onrender.com/" element ={<Home/>}/>
        <Route path="/AddDate" element ={<AddDate/>}/>
        <Route path="/DateTypes/:type" element ={<DateTypes/>}/>
        <Route path="https://its-a-date.onrender.com/LogIn" element ={<LogIn/>}/>
        <Route path="https://its-a-date.onrender.com/Register" element ={<Register/>}/>
        <Route path="https://its-a-date.onrender.com/SingleDate/:id" element ={<SingleDate/>}/>
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
