const mongoose = require("mongoose")
const dns = require("dns")

// Optional: some Windows setups can't resolve mongodb+srv records with Node's resolver.
// Set DNS_SERVERS=1.1.1.1,8.8.8.8 in .env to override.
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()))
}

let db = mongoose.connect(process.env.MONGODB_URI)
module.exports= {db}
