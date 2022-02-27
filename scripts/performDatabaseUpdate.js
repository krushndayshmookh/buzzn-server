const mongoose = require('mongoose')

require('dotenv').config()

const { MONGODB_URI } = process.env

async function performDatabaseUpdate(operation) {
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  })
  mongoose.Promise = global.Promise

  let db = mongoose.connection
  db.on('error', console.error.bind(console, 'MongoDB connection error:'))

  try {
    await operation()
  } catch (err) {
    console.error(err)
  }

  db.close()
}

module.exports = performDatabaseUpdate
