// Copies users, dates, tags from the source DB (read only) into the dev DB (dropped first).
const { MongoClient } = require("mongodb")
const { uri } = require("./_env")

const SOURCE = "ItsADate"
const TARGET = "itsadate_dev"
const COLLECTIONS = ["users", "dates", "tags"]

async function main() {
  if (SOURCE === TARGET) {
    console.error("Refusing to run: source and target DB names are equal")
    process.exit(1)
  }
  const client = new MongoClient(uri)
  await client.connect()
  try {
    const src = client.db(SOURCE)
    const dst = client.db(TARGET)
    for (const name of COLLECTIONS) {
      const docs = await src.collection(name).find({}).toArray()
      await dst.collection(name).drop().catch((e) => {
        if (e.codeName !== "NamespaceNotFound") throw e
      })
      if (docs.length) await dst.collection(name).insertMany(docs)
      const count = await dst.collection(name).countDocuments()
      console.log(`${name}: ${count} (source ${docs.length})`)
    }
  } finally {
    await client.close()
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
