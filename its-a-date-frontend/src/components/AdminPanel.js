import React, { useEffect } from "react";
import { useState } from "react";
import axios from "axios";
import "../styles/AdminPanel.css"

const AdminPanel = () => {
  const tokenLocal = localStorage.getItem("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [token, setToken] = useState("");

  const [datesToReview, setDatesToReview] = useState([]);

  const [tittle, setTittle] = useState("");
  const [image, setImage] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState([]);
  const [tagToSend, setTagToSend] = useState("");
  const [dateId, setDateId] = useState("");
  const [headingContent, setHeadingContent] = useState("");

  const getTags = async () => {
    try {
      const response = await axios.get("http://localhost:4000/tag/");
      setTags(response.data.tags);
      return;
    } catch (error) {
      console.log(error);
    }
  };

  const deleteHandler = async (e) => {
    e.preventDefault()
    try {
      const confirmBox = window.confirm(
        "Do you really want to reject this date?"
      );
      if (confirmBox === true) {
        await handleReject();
      }
    } catch (error) {
      console.log(error);
    }
  };
  

  const handleReject = async() => {
    try{
      console.log(dateId)
      if(dateId){
        const response = await axios.delete("http://localhost:4000/date/delete/"+ dateId);
        console.log(response)
        getDatesToReview()
      }else{
        console.log("potatos")
      }
      
    }catch(error){
      console.log(error)
    }
  };
  const handleAccept = async(e) => {
    try{
      e.preventDefault()
      console.log(dateId)
      if(dateId){
        const response = await axios.put("http://localhost:4000/date/accept/"+ dateId , {tittle:tittle , text:text, tags:tagToSend});
        console.log(response)
        getDatesToReview()
      }else{
        console.log("potatos")
      }
      
    }catch(error){
      console.log(error)
    }
  };
  const createAdmin = async (e) => {
    e.preventDefault();

    try {
      if (!email || !name || !password) {
        alert("Please fill all the inputs properly");
      }
      const response = await axios.post("http://localhost:4000/user/register/admin", {
        email: email,
        name: name,
        password: password,
      });
      console.log(response.data);
      alert("Admin created successfully");
      setEmail("")
      setPassword("")
      setName("")
      return;
    } catch (error) {
      alert(error.response.data.message);
    }
  };
  const getDatesToReview = async () => {
    const response = await axios.get("http://localhost:4000/date/review");
    console.log(response.data.dates);
    if(response.data.dates.length>0){
    setDatesToReview(response.data.dates);
    setTittle(response.data.dates[0].tittle);
    setTagToSend(response.data.dates[0].tags[0]);
    setImage(response.data.dates[0].image);
    setText(response.data.dates[0].text);
    setDateId(response.data.dates[0]._id);
    setHeadingContent("Dates to review")
    return
    }
    else{
      setHeadingContent("There are no dates to review")
    setDatesToReview(response.data.dates);
    setTittle("");
    setTagToSend("");
    setImage("");
    setText("");
    setDateId("");
    setHeadingContent("Dates to review")
    }
    
    
    return;
  };
  const checkIfAdmin = async () => {
    try {
      if (!email || !password) {
        alert("Please fill all the inputs properly");
      }
      const response = await axios.post(
        "http://localhost:4000/user/login/admin",
        { email: email, password: password }
      );
      console.log(response.data);
      setToken(response.data.token);
      alert("You logged in as admin ");

      return;
    } catch (error) {
      alert(error.response.data.message);
    }
  };
  useEffect(() => {
    setToken(tokenLocal);
    getTags();
    getDatesToReview();
  }, []);
  const handleLogIn = async (e) => {
    e.preventDefault();
    try {
      if (!email || !password) {
        alert("Please fill all the inputs properly");
      }
      const response = await axios.post(
        "http://localhost:4000/user/login/admin",
        { email: email, password: password }
      );
      console.log(response.data);
      setToken(response.data.token);
      localStorage.setItem("token", response.data.token);
      alert("You logged in as admin ");
      setEmail("");
      setPassword("");
      return;
    } catch (error) {
      alert(error.response.data.message);
    }
  };
  return (
    <div className="fullHeight formContainer">
      {!token ? (

        <form className="adminLogIn  mt-5" onSubmit={handleLogIn}>
          <h2>Admin LogIn</h2>
          <div className="mb-3">
            <label htmlFor="InputEmail1" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="InputEmail1"
              aria-describedby="emailHelp"
              onChange={(e) => {
                setEmail(e.target.value);
              }}
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
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Log in as Admin
          </button>
        </form>
      ) : (
        <div className="container">
          
          <div class="row gap-lg-5">
            <div class="col">
            <h2>Create An admin</h2>
            <form className="adminForm  mt-5" onSubmit={createAdmin}>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
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
                onChange={(e) => {
                  setName(e.target.value);
                }}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Create Admin
            </button>
            </form>
            </div>
            <div class="col">
            <h2>{headingContent}</h2>
            <form className="mt-5">
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
                value={tagToSend}
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
            <img
              src={image}
              className="card-img-top"
              alt="Not Found"
            />
            <div>
              <button onClick={deleteHandler} className="btn btn-danger">
                Reject
              </button>

              <button onClick={handleAccept} className="btn btn-success">
                Submit
              </button>
            </div>
          </form>
            </div>

            </div>  
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
