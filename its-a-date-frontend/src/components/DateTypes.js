import React from "react";
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useNavigate  } from "react-router";
import { Link } from "react-router-dom";
import axios from "axios";


const DateTypes = () => {
  const [dates, setDates] = useState([]);
  const [dateTypes, setDateTypes] = useState([]);
  const { type } = useParams();
  const navigate = useNavigate();
  const myImageStyle = { height: "300px", objectFit: "cover" };

  useEffect(() => {
    console.log(type);
    getDates();
  }, [type]);

  const getDates = async () => {
    const response = await axios.get("http://localhost:4000/date/");
    console.log(response.data);
    return setDates(response.data.dates);
  };

  const getDatesOfType = () => {
    const datesSet = new Set(dates.filter((date) => date.tags.includes(type)));
    console.log(datesSet)
    return Array.from(datesSet);
  };

  return (
    <div className="fullHeight">
      <h1>{type} Dates</h1>
      <div>
        {getDatesOfType().map((date) => {
          return (
            <div className="card" >
              <img src={date.image} className="card-img-top" alt="..." />
              <div className="card-body">
                <h5 className="card-title">{date.title}</h5>
                <p className="card-text">
                 {date.text}
                </p>
                
                <Link to={`/SingleDate/${date._id}`} className="btn btn-primary">
                  Learn More
                </Link>
              </div> 
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DateTypes;
