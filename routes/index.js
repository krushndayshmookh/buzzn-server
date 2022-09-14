const router = require('express').Router()

const allowRoot = require('../middlewares/allowRoot')
const validateToken = require('../middlewares/validateToken')

router.use('/api/auth', require('./auth'))
router.use('/api/admin', /* validateToken, */ allowRoot, require('./admin'))
router.use('/api/users', require('./user'))
router.use('/api/utils', require('./util'))
router.use('/api/uploads', require('./upload'))
router.use('/api/posts', require('./post'))
router.use('/api/holdings', require('./holding'))
router.use('/api/instruments', require('./instrument'))
router.use('/api/orders', require('./order'))
router.use('/api/bookmarks', require('./bookmark'))
router.use('/api/payments', require('./payment'))
router.use('/api/notifications', require('./notification'))

router.get('/api', (req, res) => {
  res.send('Please read documentation for the API.')
})

router.get('*', (req, res) => {
  res.redirect('/api')
})

module.exports = router
