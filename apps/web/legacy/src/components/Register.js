import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/AddDate.css"
import {Link} from "react-router-dom"

const Register = () => {
  const navigate = useNavigate()
  const [email, setEmail]=useState("")
  const [name, setName]=useState("")
  const [password, setPassword]=useState("")

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      if(!email||!name||!password){
        alert("Please fill all the inputs properly")
      }
      const response = await axios.post("https://its-a-date-backend-pm.onrender.com/user/register", {email:email,
      name:name,
      password:password});
      console.log(response.data);
      localStorage.setItem("token", response.data.token)
      alert("You registered successfully")
      return
    } catch (error) {
      alert(error.response.data.message);
    }
  };
  return (
    <div className="fullHeight formContainer">
       <h1 className="formHeader">Register</h1>
      <form className=" addDate " onSubmit={handleRegister} > 
      <div className="mb-3">
        <label htmlFor="InputEmail1" className="form-label">
          Email
        </label>
        <input
          type="email"
          className="form-control"
          id="InputEmail1"
          aria-describedby="emailHelp"
          value={email}
          onChange={(e)=>{setEmail(e.target.value)}}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="InputName" className="form-label">
          Name
        </label>
        <input
          type="text"
          className="form-control"
          id="InputName"
          aria-describedby="nameHelp"
          value={name}
          onChange={(e)=>{setName(e.target.value)}}
        />
       
      </div>
      <div className="mb-3">
        <label htmlFor="InputPassword" className="form-label">
          Password
        </label>
        <input
          type="password"
          className="form-control"
          id="InputPassword"
          value={password}
          onChange={(e)=>{setPassword(e.target.value)}}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Create Account
      </button>
      <p className="mt-3">
       Already have an account ? Click <Link to="/LogIn">here</Link> to
       login.
      </p>
    </form>
    </div>
    
  );
};

export default Register;
