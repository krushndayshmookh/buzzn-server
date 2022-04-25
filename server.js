require('dotenv').config()

const express = require('express')

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const mongooseLeanVirtuals = require('mongoose-lean-virtuals')

const cors = require('cors')

const logger = require('morgan')

// const multer = require('multer')
const path = require('path')

const http = require('http')

// const socketIO = require('socket.io')

const PORT = process.env.PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI
const UPLOADS_DIR = process.env.UPLOADS_DIR
const PUBLIC_DIR = path.join(__dirname, process.env.PUBLIC_DIR)

let app = express()

const server = http.createServer(app)

// const io = socketIO(server)

// global.io = io
mongoose.plugin(mongoosePaginate)
mongoose.plugin(mongooseLeanVirtuals)

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
})
mongoose.Promise = global.Promise

let db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'))
}

app.use(cors())

app.use(
  express.urlencoded({
    extended: true,
    limit: '50mb',
  })
)
app.use(
  express.json({
    limit: '50mb',
  })
)

app.use(express.static(PUBLIC_DIR));

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, UPLOADS_DIR))
//   },
//   filename: function (req, file, cb) {
//     cb(
//       null,
//       file.originalname.replace(/ /g, '_') +
//         '-' +
//         new Date().valueOf() +
//         path.extname(file.originalname)
//     )
//   }
// })

// const upload = multer({ storage })
// global.upload = upload

// app.set('view engine', 'pug')
// app.set('views', './views')

// io.on('connection', client => {
//   console.log('Client connected.')
//   client.on('disconnect', () => {
//     console.log('Client disconnected.')
//   })
// })

app.use('/', require('./routes'))

// app.get("*", function (req, res) {
//   res.sendFile(PUBLIC_DIR + "/index.html");
// });

// make required dirs
const directories = [UPLOADS_DIR]
require('./utils/mkdirSync')(directories)

// display server information on startup
async function displayServerInfo() {
  const { name, version: serverVersion } = require('./package.json')
  const { name: dbName } = db
  const now = new Date()

  console.log(`============================================================`)
  console.log(`${name} v${serverVersion} - [${dbName}]`)
  console.log(`Server started at ${now}`)
  console.log(`============================================================`)
}

// generate config if not exists
const { Config } = require('./models')

async function generateConfig() {
  let config = await Config.findOne({ name: process.env.CONFIG_NAME })
  if (!config) {
    config = new Config({
      name: process.env.CONFIG_NAME,
      commission: 0,
    })
    await config.save()
    console.log('Config generated.')
  }
}

generateConfig().then(displayServerInfo)

server.listen(PORT, err => {
  if (err) throw err
  console.info('Listening on port ' + PORT + '...')
})
