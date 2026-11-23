const path = require("path")
const dns = require("dns")
require("dotenv").config({ path: path.join(__dirname, "..", ".env") })

// Same DNS override as connection.js (Node can't resolve mongodb+srv on some Windows setups).
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()))
}

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (expected in Its a date BACKEND/.env)")
  process.exit(1)
}

// DB name embedded in the URI path, or "" if none.
function uriDbName(uri) {
  const m = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/)
  return m ? decodeURIComponent(m[1]) : ""
}

module.exports = { uri: process.env.MONGODB_URI, uriDbName }
