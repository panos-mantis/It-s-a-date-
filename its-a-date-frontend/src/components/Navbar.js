import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import axios from 'axios';
import "../styles/Navbar.css"
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
      <Navbar collapseOnSelect expand="md" className='navbar'>
        <Container  >
          <Navbar.Brand href="/home" className='NavBrand NavItem'>It's a Date</Navbar.Brand>
          <Nav className="me-auto">
            
           

            <NavDropdown title="Dropdown" id="navDropdown" >
       {tags.map((tag)=>{
        return(
          <NavDropdown.Item key={tag._id} href={`/DateTypes/${tag.tagName}`} className='NavItem'>{tag.tagName}</NavDropdown.Item>
        )
       })}
      </NavDropdown>

            <Nav.Link href="/AddDate" className='NavItem'>Add a date</Nav.Link>
            <Nav.Link href="/Register" className='NavItem'>Register</Nav.Link>
            <Nav.Link href="/LogIn" className='NavItem'>Log in</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
    </>
  );
};
export default TopNav;
