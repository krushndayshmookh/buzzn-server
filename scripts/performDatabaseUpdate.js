const mongoose = require('mongoose')

require('dotenv').config()

const { MONGODB_URI, MONGODB_DBNAME } = process.env

async function performDatabaseUpdate(operation) {
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: MONGODB_DBNAME,
  })
  mongoose.Promise = global.Promise

  const db = mongoose.connection
  db.on('error', console.error.bind(console, 'MongoDB connection error:'))

  try {
    await operation()
  } catch (err) {
    console.error(err)
  }

  db.close()
}

module.exports = performDatabaseUpdate
