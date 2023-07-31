import axios from "axios";

export const getAllDates = async()=>{
    const response = axios.get("http://localhost:4000/date/")
    console.log(response)
    return response.data
}

