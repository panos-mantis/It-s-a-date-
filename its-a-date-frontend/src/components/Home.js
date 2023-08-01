import React, { useEffect, useState } from "react";
import axios from "axios";
import  BackTop  from "./BackTop";
import Footer from "./Footer";
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
    <ul>
      {dates.map((date) => {
        return (
          <li key={date._id} className="mt-3 list-group-item container-sm">
            <div className="card mb-3">
              <div className="row g-0">
                <div className="col-md-4">
                  <img style= {myImageStyle}src={date.image} className="img-fluid rounded-start" alt="..." />
                </div>
                <div className="col-md-8">
                  <div className="card-body">
                    <h5 className="card-title">{date.tittle}</h5>
                    <p className="card-text">
                      {date.text}
                    </p>
                    <p className="card-text">
                      <small className="text-body-secondary">
                        {date.tags.map((tag)=>{
                          return(
                            <span>{tag} </span>
                          )
                        })}
                      </small>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
    <BackTop/>
    <Footer/>
    </>
    
  );
};

export default Home;
