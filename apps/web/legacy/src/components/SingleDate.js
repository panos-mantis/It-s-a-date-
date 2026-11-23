import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router";
import { useNavigate } from "react-router";

const SingleDate = () => {
  const { id } = useParams();
  const [date, setDate] = useState([]);

  const navigate = useNavigate();

  const handleClick =()=>{
      navigate("/DateTypes/"+ date.tags[0]);
    }

  const getDate = async () => {
    const response = await axios.get("https://its-a-date-backend-pm.onrender.com/date/" + id);
    console.log(response.data);
    return setDate(response.data.date);
  };

  useEffect(() => {
    getDate();
    console.log(date)
  },[]);
  return (
    <>
      <div className="card w-50 m-auto mt-2">
        <img src={date.image} className="card-img-top" alt="..." />
        <div className="card-body">
          <h5 className="card-title">{date.tittle}</h5>
          <p className="card-text">{date.text}</p>
          <button onClick={handleClick} className="btn similarIdeasBtn">Get similar ideas</button>
        </div>
        <div className="card-footer">
          <small className="text-body-secondary">
            {date.tags?.map((tag) => {
              return <span key={tag}>{tag} </span>;
            })}
          </small>
        </div>
      </div>
      
    </>
  );
};

export default SingleDate;
