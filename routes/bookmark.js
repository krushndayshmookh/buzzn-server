const router = require('express').Router()

const bookmarkController = require('../controllers/bookmark')

const validateToken = require('../middlewares/validateToken')

router.get('/', validateToken, bookmarkController.fetch_get)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (user)')
})

// Export -----
module.exports = router
