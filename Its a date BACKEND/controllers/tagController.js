const Tag = require("../Modules/Tags");

const addTag = async(req,res)=>{
    try{
        const {tagName}= req.body
        if(!tagName){
            return res.status(400).json({message:"Please fill the inputs properly"})
        }
        const checkTag = await Tag.findOne({tagName:tagName})
        if(checkTag){
            console.log(checkTag)
            return res.status(400).json({message:"Failed to create tag because it already exists"})
        }
        const newTag = await Tag.create({tagName:tagName})
        const allTags = await Tag.find()
        return res.status(200).json({message:"Tag added successfully" , tags:allTags})
    }catch(error){
        return res
        .status(400)
        .json({ message: "Failed to create tag" });
    }
}
const deleteTagById = async(req,res)=>{
    try{
        const id = req.params.id
        const checkTag = await Tag.findByIdAndDelete(id)
        if(!checkTag){
            console.log(checkTag)
            return res.status(400).json({message:"Failed to delete tag because it was not found"})
        }
        const allTags = await Tag.find()
        return res.status(200).json({message:"Tag deleted successfully" , tags:allTags})
    }catch(error){
        return res
        .status(400)
        .json({ message: "Failed to delete tag" });
    }
}

const getTags = async (req,res)=>{
    try{
        const tags = await Tag.find()
        if(!tags){
            return res.status(400).json({message:"Tags not found"})
        }
        return res.status(200).json({message:"Good", tags:tags})
    }catch(error){

    }
}

const updateTagById = async(req,res)=>{
    try{
        const id = req.params.id
        const checkTag = await Tag.findByIdAndDelete(id)
        if(!checkTag){
            console.log(checkTag)
            return res.status(400).json({message:"Failed to delete tag because it was not found"})
        }
        const allTags = await Tag.find()
        return res.status(200).json({message:"Tag deleted successfully" , tags:allTags})
    }catch(error){
        return res
        .status(400)
        .json({ message: "Failed to delete tag" });
    }
}


module.exports = {
    addTag,
    deleteTagById,
    getTags,
}