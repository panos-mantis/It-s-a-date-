const jwt = require("jsonwebtoken")
const User = require("../Modules/User")

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || ""
    const [scheme, token] = header.split(" ")
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Please log in as an admin" })
    }
    let email
    try {
      email = jwt.verify(token, process.env.JWT_SECRET)
    } catch (e) {
      return res.status(401).json({ message: "Please log in as an admin" })
    }
    if (typeof email !== "string") {
      return res.status(401).json({ message: "Please log in as an admin" })
    }
    const user = await User.findOne({ email })
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admins only" })
    }
    req.user = user
    next()
  } catch (e) {
    return res.status(401).json({ message: "Please log in as an admin" })
  }
}

module.exports = requireAdmin
