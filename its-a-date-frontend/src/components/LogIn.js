import React from "react";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LogIn = () => {
  const [email, setEmail]=useState("")
  const [password, setPassword]=useState("")
  const navigate = useNavigate();
  const handleLogIn = async (e) => {
    e.preventDefault();

    try {
      if(!email||!password){
        alert("Please fill all the inputs properly")
      }
      const response = await axios.post("http://localhost:4000/user/login", {email:email,
      password:password});
      console.log(response.data);
      alert("You logged in")
      navigate("/")
      return
    } catch (error) {
      alert(error.response.data.message);
    }
  };
  return (
    <form className="  mt-5" onSubmit={handleLogIn}>
      <div className="mb-3">
        <label htmlFor="InputEmail1" className="form-label">
          Email
        </label>
        <input
          type="email"
          className="form-control"
          id="InputEmail1"
          aria-describedby="emailHelp"
          onChange={(e)=>{setEmail(e.target.value)}}
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
          onChange={(e)=>{setPassword(e.target.value)}}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Submit
      </button>
    </form>
  );
};

export default LogIn;
