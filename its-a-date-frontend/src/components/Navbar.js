import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import axios from 'axios';

const TopNav = () => {
  const getDates = async()=>{
    const response = await axios.get("http://localhost:4000/date/");
    console.log(response)
    return  setDates(response.data.dates);
   
  }
  const [dates,setDates]= useState([])
  useEffect( () => {
    try{
      getDates()
      
    }catch(error){
  console.log(error)
    }
   
  }, []);

  return (
    <>
      <Navbar collapseOnSelect expand="md" bg="dark" data-bs-theme="dark">
        <Container  >
          <Navbar.Brand href="#home">Navbar</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link to="#home">Home</Nav.Link>
            <Nav.Link to="#features">All Dates</Nav.Link>
            <Nav.Link to="#pricing">Date Type</Nav.Link>
            <Nav.Link to="#pricing">Add a date</Nav.Link>
            <Nav.Link to="#pricing">What is a date?</Nav.Link>
            <Nav.Link to="#pricing">Register</Nav.Link>
            <Nav.Link to="#pricing">Log in</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
    </>
  );
};
export default TopNav;
