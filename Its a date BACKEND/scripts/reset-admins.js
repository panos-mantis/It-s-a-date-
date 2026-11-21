// Demotes every user, then upserts one admin. Usage:
//   npm run reset-admins -- --email <email> --name <name> [--db <dbname>]
const readline = require("readline")
const { MongoClient } = require("mongodb")
const bcrypt = require("bcrypt")
const { uri, uriDbName } = require("./_env")

function arg(flag) {
  const i = process.argv.indexOf(flag)
  return i > -1 ? process.argv[i + 1] : undefined
}

const email = (arg("--email") || "").trim().toLowerCase()
const name = (arg("--name") || "").trim()
const dbName = arg("--db") || uriDbName(uri)

if (!email || !name || !dbName) {
  console.error("Usage: npm run reset-admins -- --email <email> --name <name> [--db <dbname>]")
  process.exit(1)
}

// Line source: hidden prompts on a TTY, plain lines from stdin when piped.
const isTTY = process.stdin.isTTY
let rl
let pipedLines
let pipedIdx = 0

async function init() {
  if (isTTY) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  } else {
    const chunks = []
    for await (const c of process.stdin) chunks.push(c)
    pipedLines = Buffer.concat(chunks).toString("utf8").split(/\r?\n/)
  }
}

function ask(question, hidden) {
  if (!isTTY) {
    process.stdout.write(question + "\n")
    return Promise.resolve((pipedLines[pipedIdx++] || "").replace(/\r$/, ""))
  }
  return new Promise((resolve) => {
    const orig = rl._writeToOutput
    if (hidden) rl._writeToOutput = () => {}
    process.stdout.write(question)
    rl.question("", (answer) => {
      rl._writeToOutput = orig
      if (hidden) process.stdout.write("\n")
      resolve(answer)
    })
  })
}

async function main() {
  await init()
  console.log(`Target DB: ${dbName}`)
  const client = new MongoClient(uri)
  await client.connect()
  try {
    const users = client.db(dbName).collection("users")
    // Case-insensitive exact match: legacy rows may be stored with mixed case.
    const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const matches = await users
      .find({ email: new RegExp("^" + escaped + "$", "i") }, { projection: { email: 1 } })
      .toArray()
    if (matches.length > 1) {
      console.error("Multiple accounts match this email, nothing written:")
      matches.forEach((m) => console.error("  " + m.email))
      process.exit(1)
    }

    const pw = await ask("Password (min 12 chars): ", true)
    if (pw.length < 12) {
      console.error("Password must be at least 12 characters")
      process.exit(1)
    }
    const confirm = await ask("Type the DB name to confirm: ", false)
    if (confirm.trim() !== dbName) {
      console.error("DB name did not match, aborting")
      process.exit(1)
    }
    if (rl) rl.close()

    const hash = await bcrypt.hash(pw, 10)
    const demoted = await users.updateMany({}, { $set: { isAdmin: false } })
    if (matches.length === 1) {
      await users.updateOne(
        { _id: matches[0]._id },
        { $set: { email, name, isAdmin: true, password: hash } }
      )
    } else {
      await users.insertOne({ email, name, isAdmin: true, password: hash, personalRates: [] })
    }
    console.log(`Demoted accounts: ${demoted.modifiedCount}`)
    console.log(`Admin: ${email}`)
    console.log("Log in with the lowercased email exactly as printed above.")
  } finally {
    await client.close()
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
