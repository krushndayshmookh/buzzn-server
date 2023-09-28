const router = require('express').Router()

const agendaController = require('../controllers/agenda')

router.post('/post/image', agendaController.schedulePostImageProcessing)

router.post('/post/audio', agendaController.schedulePostAudioProcessing)

router.post('/post/glimpse', agendaController.schedulePostGlimpseProcessing)

router.post('/user/avatar', agendaController.scheduleUserAvatarProcessing)

module.exports = router
