import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import BackTop from "./BackTop";
import "../styles/Home.css"

const Home = () => {
  const [dates, setDates] = useState([]);
  const getDates = async () => {
    const response = await axios.get("http://localhost:4000/date/");
    console.log(response.data);
    return setDates(response.data.dates);
  };
  useEffect(() => {
    getDates();
  }, []);
  const myImageStyle = { width: "400px", objectFit: "contain" };
  return (
    <>
      
      <ul className="dateList" >
        {dates.map((date) => {
          return (
            <li key={date._id} className=" list-group-item container-sm">
              <div className="card mb-3">
                <div className="row g-0">
                  <div className="col-md-4">
                    <img
                      style={myImageStyle}
                      src={date.image}
                      className="img-fluid rounded-start"
                      alt="..."
                    />
                  </div>
                  <div className="col-md-8">
                    <div className="card-body">
                      <h5 className="card-title">{date.tittle}</h5>
                      <p className="card-text">{date.text}</p>
                      <p className="card-text">
                        <small className="text-body-secondary">
                          {date.tags.map((tag) => {
                            return <span key={tag}>{tag} </span>;
                          })}
                        </small>
                      </p>
                      <Link
                        to={`/SingleDate/${date._id}`}
                        className="btn btn-primary"
                      >
                        Learn More
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <BackTop />
      
    </>
  );
};

export default Home;
