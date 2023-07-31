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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home" element ={<Home/>}/>
        <Route path="/AddDate" element ={<AddDate/>}/>
        <Route path="/AllDates" element ={<AllDates/>}/>
        <Route path="/DateTypes" element ={<DateTypes/>}/>
        <Route path="/LogIn" element ={<LogIn/>}/>
        <Route path="/Register" element ={<Register/>}/>
        <Route path="/SingleDate" element ={<SingleDate/>}/>
        <Route path="*" element ={<SingleDate/>}/>
      </Routes>
    </Router>
   
  );
}

export default App;
