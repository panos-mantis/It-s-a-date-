import React from "react";
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useNavigate  } from "react-router";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/DateTypes.css"


const DateTypes = () => {
  const [dates, setDates] = useState([]);
  const [dateTypes, setDateTypes] = useState([]);
  const { type } = useParams();
  const navigate = useNavigate();
  const myImageStyle = { height: "240px", objectFit: "cover", width :"100%"};

  useEffect(() => {
    console.log(type);
    getDates();
  }, [type]);

  const getDates = async () => {
    const response = await axios.get("https://its-a-date-backend-pm.onrender.com/date/");
    console.log(response.data);
    return setDates(response.data.dates);
  };

  const getDatesOfType = () => {
    const datesSet = new Set(dates.filter((date) => date.tags.includes(type)));
    console.log(datesSet)
    return Array.from(datesSet);
  };

  return (
    <div className="bgColour">
      <div className="fullHeight container">
      <h1 id="header">{type} dates</h1>
      <div className="grid m-auto">
      <div className="row row-cols-3 m-0 p-0">
        {getDatesOfType().map((date) => {
          return (
            <div className=" col card m-0 p-0 mb-3">
              <h3 className="dateTittle">{date.tittle}</h3>
              <img src={date.image} className="card-img" alt="..." style={myImageStyle}/>
              <div className="card-body">
                <h5 className="card-title">{date.title}</h5>
                <p className="card-text">
                 {date.text.substring(0,90)} ...
                </p>
                
                <Link to={`/SingleDate/${date._id}`} id="button" className="btn btn-primary me-md-2">
                  Learn More
                </Link>
              </div> 
            </div>
          );
        })}
        </div>
        
      </div>
    </div>
    </div>
    
  );
};

export default DateTypes;
