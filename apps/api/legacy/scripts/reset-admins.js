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

// Line source: prompts on a TTY, plain lines from stdin when piped.
const isTTY = process.stdin.isTTY
let pipedLines
let pipedIdx = 0

async function init() {
  if (!isTTY) {
    const chunks = []
    for await (const c of process.stdin) chunks.push(c)
    pipedLines = Buffer.concat(chunks).toString("utf8").split(/\r?\n/)
  }
}

// Visible line: the console echoes typing itself; readline gets no output stream,
// so it can't redraw (and erase) the prompt label.
function readVisibleLine() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, terminal: false })
    rl.once("line", (line) => {
      rl.close()
      resolve(line)
    })
  })
}

// Hidden line: raw mode, nothing echoed. Enter finishes, Backspace deletes, Ctrl+C quits.
function readHiddenLine() {
  return new Promise((resolve) => {
    const stdin = process.stdin
    let buf = ""
    const finish = () => {
      stdin.removeListener("data", onData)
      stdin.setRawMode(false)
      stdin.pause()
      process.stdout.write("\n")
      resolve(buf)
    }
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") return finish()
        if (ch === "\u0003") {
          stdin.setRawMode(false)
          process.stdout.write("\nCancelled, nothing written\n")
          process.exit(130)
        }
        if (ch === "\u007f" || ch === "\b") buf = buf.slice(0, -1)
        else if (ch >= " ") buf += ch
      }
    }
    stdin.setEncoding("utf8")
    stdin.setRawMode(true)
    stdin.on("data", onData)
    stdin.resume()
  })
}

function ask(question, hidden) {
  if (!isTTY) {
    process.stdout.write(question + "\n")
    return Promise.resolve((pipedLines[pipedIdx++] || "").replace(/\r$/, ""))
  }
  process.stdout.write(question)
  return hidden ? readHiddenLine() : readVisibleLine()
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
