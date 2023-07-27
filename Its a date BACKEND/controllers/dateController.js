const Date = require("../Modules/Date");
const User = require("../Modules/User");

var jwt = require("jsonwebtoken");

const createDate = async(req,res)=>{
    try{
        const{tittle , tags , text, token, image }= req.body
        if(!token){
            return res.status(400).json({message:"Please log in"})
        }
        let payload = jwt.verify(token, process.env.JWT_SECRET);
        if(!tittle||!tags||!text||!image){
            return res.status(400).json({message:"Please fill all the inputs properly"})
        }
        const findCreator = await User.findOne({email:payload})
        console.log(findCreator)
        const newDate = await Date.create({tittle:tittle , text:text, creator:findCreator._id, overallRates:[],image:image, review:false, tags:tags})
        return res.json({message:"ok" , date:newDate})
    }catch(error){
        res.status(500).json({ error: 'Failed to create date' });
    }
}

const getAllDates = async(req,res)=>{

    try{
        const dates = await Date.find({review:true});
        res.json({ dates });
    }catch(error){
        console.log(error)
    }
}

const getDateById = async(req,res)=>{
    try{
        const id = req.params.id
        const date = await Date.findById(id)
        if (!date) {
            return res.status(404).json({ error: 'Date not found' });
          }
        return res.status(200).json({date:date})
    }catch(error){
        console.log(error)
    }
}

const getReviewDates = async(req,res)=>{
    try{
        const dates = await Date.find({review:false});
        res.json({ dates });
    }catch(error){
        console.log(error)
    }
}

module.exports={
    createDate,
    getAllDates,
    getDateById,
}