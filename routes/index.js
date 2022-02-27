let router = require('express').Router()

router.use('/api/auth', require('./auth'))
router.use('/api/users', require('./user'))
router.use('/api/utils', require('./util'))
router.use('/api/posts', require('./post'))
router.use('/api/holdings', require('./holding'))
router.use('/api/instruments', require('./instrument'))
router.use('/api/orders', require('./order'))
router.use('/api/bookmarks', require('./bookmark'))

router.get('/api', (req, res) => {
  res.send('Please read documentation for the API.')
})

router.get('*', (req, res) => {
  res.redirect('/api')
})

module.exports = router
