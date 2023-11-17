const Agenda = require('agenda')

const optimizePostImage = require('./agendaHandlers/optimizePostImage')
const optimizePostAudio = require('./agendaHandlers/optimizePostAudio')
const optimizePostGlimpse = require('./agendaHandlers/optimizePostGlimpse')
const optimizePostVideo = require('./agendaHandlers/optimizePostVideo')

const optimizeUserAvatar = require('./agendaHandlers/optimizeUserAvatar')

const jobQueue = new Agenda({
  db: {
    address: process.env.MONGODB_URI,
    collection: 'jobs',
  },
})

jobQueue.define('OptimizePostImage', optimizePostImage)
jobQueue.define('OptimizePostAudio', optimizePostAudio)
jobQueue.define('OptimizePostGlimpse', optimizePostGlimpse)
jobQueue.define('OptimizePostVideo', optimizePostVideo)

jobQueue.define('OptimizeUserAvatar', optimizeUserAvatar)

jobQueue.start()

console.info('Agenda started')

exports.schedulePostImageProcessing = async (req, res) => {
  const { post } = req.body

  try {
    jobQueue.now('OptimizePostImage', post)

    res.json({
      success: true,
      post,
    })
  } catch (err) {
    console.error(err)
    res.status(500).send('Internal server error')
  }
}

exports.schedulePostAudioProcessing = async (req, res) => {
  const { post } = req.body

  try {
    jobQueue.now('OptimizePostAudio', post)

    res.json({
      success: true,
      post,
    })
  } catch (err) {
    console.error(err)
    res.status(500).send('Internal server error')
  }
}

exports.schedulePostGlimpseProcessing = async (req, res) => {
  const { post } = req.body

  try {
    jobQueue.now('OptimizePostGlimpse', post)

    res.json({
      success: true,
      post,
    })
  } catch (err) {
    console.error(err)
    res.status(500).send('Internal server error')
  }
}

exports.schedulePostVideoProcessing = async (req, res) => {
  const { post } = req.body

  try {
    jobQueue.now('OptimizePostVideo', post)

    res.json({
      success: true,
      post,
    })
  } catch (err) {
    console.error(err)
    res.status(500).send('Internal server error')
  }
}

exports.scheduleUserAvatarProcessing = async (req, res) => {
  const { user } = req.body

  try {
    jobQueue.now('OptimizeUserAvatar', user)

    res.json({
      success: true,
      user,
    })
  } catch (err) {
    console.error(err)
    res.status(500).send('Internal server error')
  }
}
