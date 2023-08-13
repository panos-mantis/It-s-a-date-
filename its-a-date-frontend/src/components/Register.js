import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
      const response = await axios.post("http://localhost:4000/user/register", {email:email,
      name:name,
      password:password});
      console.log(response.data);
      alert("You registered successfully")
      return
    } catch (error) {
      alert(error.response.data.message);
    }
  };
  return (
    <form className="  mt-5" onSubmit={handleRegister}>
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
        Submit
      </button>
    </form>
  );
};

export default Register;
