import React, { useEffect } from "react";
import { useState } from "react";
import axios from "axios";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";
import { Link } from "react-router-dom";
const AddDate = () => {
  const [tittle, setTittle] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState([]);
  const [tagToSend, setTagToSend] = useState("");
  const [imageUpload, setImageUpload] = useState("");
  const [imageLink, setImageLink] = useState("");
  const token = localStorage.getItem("token");
  const uploadImage = async () => {
    
    if (imageUpload == null) return;
    const imageRef = ref(storage, `dateimages/${imageUpload.name}`);
    const response = await uploadBytes(imageRef, imageUpload);
    alert("Image Uploaded");
    const img = await getDownloadURL(imageRef);
    console.log(img);
    setImageLink(img);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log(token);
      console.log(tagToSend);
      console.log(imageLink);
      console.log(text);
      if(!token||!tagToSend||!tittle||!imageUpload||!text){
        alert("Please fill all the inputs properly. And don't forget to upload an image")
        return
      }
      uploadImage();
      console.log(1);
      const response = await axios.post("http://localhost:4000/date/create", {
        tittle: tittle,
        tags: tagToSend,
        image: imageLink,
        text: text,
        token: token,
      });
      console.log(response.data);
      setTags(response.data.tags);
      return;
    } catch (error) {
      console.log(error);
    }
  };

  const getTags = async () => {
    try {
      const response = await axios.get("http://localhost:4000/tag/");
      console.log(response.data);
      setTags(response.data.tags);
      return;
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getTags();
  }, []);

  return (
    <>
    
    {token ? ( <form onSubmit={handleSubmit}>
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
          Example textarea
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
      <div className="mb-3">
        <label htmlFor="image" className="form-label">
          Example textarea
        </label>
        <input
          type="file"
          className="form-control"
          id="image"
          onChange={(e) => {
            setImageUpload(e.target.files[0]);
          }}
        />
      </div>
      <button type="submit" className="btn btn-success">
        Submit
      </button>
    </form>):(
      <div>
        <h2>Please <Link to="/LogIn">log in</Link>  first</h2>
      </div>
    )}
   
    </>);
};

export default AddDate;
