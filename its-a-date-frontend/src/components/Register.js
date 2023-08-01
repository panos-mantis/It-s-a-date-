import React, { useState } from "react";
import axios from "axios";

const Register = () => {
  const [email, setEmail]=useState("")
  const [name, setName]=useState("")
  const [password, setPassword]=useState("")

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:4000/user/register", {email:email,
      name:name,
      password:password});
      console.log(response.data);
      return
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <form className="  mt-5" onSubmit={handleRegister}>
      <div class="mb-3">
        <label for="InputEmail1" class="form-label">
          Email
        </label>
        <input
          type="email"
          class="form-control"
          id="InputEmail1"
          aria-describedby="emailHelp"
          value={email}
          onChange={(e)=>{setEmail(e.target.value)}}
        />
      </div>
      <div class="mb-3">
        <label for="InputName" class="form-label">
          Name
        </label>
        <input
          type="text"
          class="form-control"
          id="InputName"
          aria-describedby="nameHelp"
          value={name}
          onChange={(e)=>{setName(e.target.value)}}
        />
       
      </div>
      <div class="mb-3">
        <label for="InputPassword" class="form-label">
          Password
        </label>
        <input
          type="password"
          class="form-control"
          id="InputPassword"
          value={password}
          onChange={(e)=>{setPassword(e.target.value)}}
        />
      </div>
      <button type="submit" class="btn btn-primary">
        Submit
      </button>
    </form>
  );
};

export default Register;
