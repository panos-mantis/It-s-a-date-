import React from 'react'
import { useNavigate } from "react-router-dom";

const SimilarIdeasButton = (props) => {
     const navigate = useNavigate();
    const handleClick =()=>{
        navigate("/DateTypes/"+props.dateTag);
    }
  return (
    <button onClick={handleClick} className="btn btn-secondary">Get similar ideas</button>
  )
}

export default SimilarIdeasButton