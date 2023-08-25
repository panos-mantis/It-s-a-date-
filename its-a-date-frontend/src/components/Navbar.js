import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import axios from 'axios';

const TopNav = () => {

  const [tags, setTags] = useState([]);
  const [dates,setDates]= useState([])

     const getTags = async () => {
      try {
        const response = await axios.get("http://localhost:4000/tag/");
        console.log(response)
        setTags(response.data.tags);
        return;
      } catch (error) {
        console.log(error);
      }
    };
  
  useEffect( () => {
    try{
      getTags()
      
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
            
           

            <NavDropdown title="Dropdown" id="nav-dropdown">
       {tags.map((tag)=>{
        return(
          <NavDropdown.Item key={tag._id} href={`/DateTypes/${tag.tagName}`}>{tag.tagName}</NavDropdown.Item>
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
