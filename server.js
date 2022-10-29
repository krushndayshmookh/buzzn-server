const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '.env') })

if (process.env.NODE_ENV !== 'development') {
  // eslint-disable-next-line global-require
  require('newrelic')
}

const express = require('express')

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const mongooseLeanVirtuals = require('mongoose-lean-virtuals')

const cors = require('cors')

const logger = require('morgan')

// const multer = require('multer')

const http = require('http')
// const socketIO = require('socket.io')

const packageJSON = require('./package.json')

const PORT = process.env.PORT || 3000
const { MONGODB_URI, MONGODB_DBNAME } = process.env
const { UPLOADS_DIR } = process.env
const PUBLIC_DIR = path.join(__dirname, process.env.PUBLIC_DIR)

const app = express()

const server = http.createServer(app)

// const io = socketIO(server)

// global.io = io
mongoose.plugin(mongoosePaginate)
mongoose.plugin(mongooseLeanVirtuals)

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: MONGODB_DBNAME,
})
mongoose.Promise = global.Promise

const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

// app.use(logger('dev'))

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

app.use(express.static(PUBLIC_DIR))

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
//   console.info('Client connected.')
//   client.on('disconnect', () => {
//     console.info('Client disconnected.')
//   })
// })

app.use('/api', require('./routes'))

app.get('*', (req, res) => {
  res.send('Please read documentation for the API.')
})

// app.get("*", function (req, res) {
//   res.sendFile(PUBLIC_DIR + "/index.html");
// });

// make required dirs
const directories = [UPLOADS_DIR]
require('./utils/mkdirSync')(directories)

// display server information on startup
async function displayServerInfo() {
  const { name, version: serverVersion } = packageJSON
  const { name: dbName } = db
  const now = new Date()

  console.info('============================================================')
  console.info(`${name} v${serverVersion} - [${dbName}]`)
  console.info(`Server started at ${now}`)
  console.info('============================================================')
}

// generate config if not exists
const { Config } = require('./models')

async function generateConfig() {
  try {
    let config = await Config.findOne({ name: process.env.CONFIG_NAME })
    if (!config) {
      config = new Config({
        name: process.env.CONFIG_NAME,
        commission: 0,
      })
      await config.save()
      console.info('Config generated.')
    }
  } catch (err) {
    console.error(err)
  }
}

generateConfig().then(displayServerInfo)

server.listen(PORT, err => {
  if (err) throw err
  console.info(`Listening on port ${PORT}...`)
})
