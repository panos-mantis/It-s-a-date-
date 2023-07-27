const User = require("../Modules/User");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill all the inputs properly" });
    }
    const findUser = await User.findOne({ email: email });
    if (findUser) {
      return res.status(400).json({ message: "User already exists" });
    } else {
      let token = jwt.sign(email, process.env.JWT_SECRET);

      const hash = await bcrypt.hash(password, 10);
          const newUser = await User.create({
            email: email,
            name: name,
            password: hash,
            isAdmin: false,
            personalRates: [],
          });
          res.json({
            message: "User registered successfully",
            user: newUser,
            token: token,
          });
        
    }
  } catch (error) {
    console.log(error);
  }
};

const logInUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill all the inputs properly" });
    }
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      return res.status(400).json({ message: "Wrong email" });
    }
    const match = await bcrypt.compare(password, existingUser.password);
    if(!match){
        return res.status(401).json({message:"Wrong password"})
    }

    let token = jwt.sign(email, process.env.JWT_SECRET);
    return res.status(200).json({message:"Logged in", token:token})
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  registerUser,
  logInUser
};
