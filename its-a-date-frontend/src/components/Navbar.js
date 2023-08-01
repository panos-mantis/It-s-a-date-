import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import axios from 'axios';

const TopNav = () => {
  const getDates = async()=>{
    const response = await axios.get("http://localhost:4000/date/");
    console.log(response.data.dates)
    return  setDates(response.data.dates);
   
  }

    const getUniqueTags = () => {
    const datesSet = new Set(dates.map((date) => date.tags[0]));
    return(Array.from(datesSet)) ;
  };

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
          <Navbar.Brand href="/home">It's a Date</Navbar.Brand>
          <Nav className="me-auto">
            
            <Nav.Link href="/AllDates">All Dates</Nav.Link>

            <NavDropdown title="Dropdown" id="nav-dropdown">
       {getUniqueTags().map((tag)=>{
        return(
          <NavDropdown.Item key="date._id" href={`/DateTypes/${tag}`}>{tag}</NavDropdown.Item>
        )
       })}
      </NavDropdown>

            <Nav.Link href="/AddDate">Add a date</Nav.Link>
            <Nav.Link href="/Register">Register</Nav.Link>
            <Nav.Link href="/LogIn">Log in</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
    </>
  );
};
export default TopNav;
