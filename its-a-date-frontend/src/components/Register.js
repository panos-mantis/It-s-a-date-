import React from "react";

const Register = () => {
  return (
    <form className="  mt-5">
      <div class="mb-3">
        <label for="InputEmail1" class="form-label">
          Email
        </label>
        <input
          type="email"
          class="form-control"
          id="InputEmail1"
          aria-describedby="emailHelp"
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
        />
      </div>
      <button type="submit" class="btn btn-primary">
        Submit
      </button>
    </form>
  );
};

export default Register;
