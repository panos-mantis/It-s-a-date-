import React, { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'

const AdminPanel = () => {
    const tokenLocal = localStorage.getItem("token")
    const [email, setEmail]=useState("")
    const [password, setPassword]=useState("")
    const [name, setName]=useState("")

    const [token, setToken]= useState("")

    const [dates, setDates] = useState("");

    const [tittle, setTittle] = useState("");
    const [text, setText] = useState("");
    const [tags, setTags] = useState([]);
    const [tagToSend, setTagToSend] = useState("");

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
        localStorage.setItem("token", response.data.token)
        alert("You registered successfully")
        return
      } catch (error) {
        alert(error.response.data.message);
      }
    };
    const createAdmin = async()=>{

    }
    const getDatesToReview = async () => {
      const response = await axios.get("http://localhost:4000/date/review");
      setDates(response.data.dates);
      console.log(dates)
      return 
    };
    const checkIfAdmin=async()=>{
      try {
        if(!email||!password){
          alert("Please fill all the inputs properly")
        }
        const response = await axios.post("http://localhost:4000/user/login/admin", {email:email,
        password:password});
        console.log(response.data);
        setToken(response.data.token)
        alert("You logged in as admin ")
        
        return
      } catch (error) {
        alert(error.response.data.message);
      }
    }
    useEffect(()=>{
      setToken(tokenLocal)
      getDatesToReview()
      console.log(dates[4])
    },[])
    const handleLogIn = async (e) => {
      e.preventDefault();
      try {
        if(!email||!password){
          alert("Please fill all the inputs properly")
        }
        const response = await axios.post("http://localhost:4000/user/login/admin", {email:email,
        password:password});
        console.log(response.data);
        setToken(response.data.token)
        localStorage.setItem("token", response.data.token)
        alert("You logged in as admin ")
        setEmail("")
        setPassword("")
        return
      } catch (error) {
        alert(error.response.data.message);
      }
    };
  return (
    <>
    {!token? (
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
              Log in as Admin
            </button>
          </form>)
          :
          (<div><form className="  mt-5" onSubmit={createAdmin}>
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
        Create Admin
      </button>
    </form>
   
    <form className='mt-5'>
      <div className="mb-3">
        <label htmlFor="tittle" className="form-label">
          Tittle
        </label>
        <input
          type="text"
          className="form-control"
          id="tittle"
          placeholder="Go for sushi"
          value={tittle}
          onChange={(e) => {
            setTittle(e.target.value);
            console.log(tittle);
          }}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="tag" className="form-label">
          Date Tag
        </label>
        <select
          className="form-select form-select-lg mb-3"
          onChange={(e) => {
            setTagToSend(e.target.value);
            console.log(tagToSend);
          }}
        >
          {tags.map((tag) => {
            return (
              <option key={tag._id} value={tag.tagName}>
                {tag.tagName}
              </option>
            );
          })}
        </select>
      </div>
      <div className="mb-3">
        <label htmlFor="textArea" className="form-label">
          Main Text
        </label>
        <textarea
          className="form-control"
          id="textArea"
          rows="5"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            console.log(text);
          }}
        ></textarea>
      </div>
      <div>
        <img scr= {dates[0].image} alt='Not Found'/>
      </div>
      
    </form>
   
    </div>)
        
      }
    </>
  )
}

export default AdminPanel