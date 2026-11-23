import React from 'react';
import { FaAngleUp } from 'react-icons/fa';
import { useState, useEffect } from 'react';



const BackTop = () => {
    
    const [showBtn , setShowBtn]= useState(false)

    useEffect(()=>{
        window.addEventListener("scroll",()=>{
            if(window.scrollY>500){
                setShowBtn(true)
            }else{
                setShowBtn(true)
            }
        })
    })

    const handleScrollTop =()=>{
        window.scrollTo({top:0, behavior:"smooth"})
         setShowBtn(false)
    }

    return (
    <>
         {showBtn &&(
        <div className="top-to-btm" onClick={handleScrollTop}>
            <FaAngleUp className="icon-position icon-style" />
        </div>
        )}
    </>
       
    );
};
export default BackTop;