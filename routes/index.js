const router = require('express').Router()

const allowRoot = require('../middlewares/allowRoot')
const validateToken = require('../middlewares/validateToken')

router.use('/auth', require('./auth'))
router.use('/admin', /* validateToken, */ allowRoot, require('./admin'))
router.use('/users', require('./user'))
router.use('/utils', require('./util'))
router.use('/uploads', require('./upload'))
router.use('/posts', require('./post'))
router.use('/holdings', require('./holding'))
router.use('/instruments', require('./instrument'))
router.use('/orders', require('./order'))
router.use('/bookmarks', require('./bookmark'))
router.use('/payments', require('./payment'))
router.use('/notifications', require('./notification'))
router.use('/statistics', require('./statistics'))

module.exports = router
